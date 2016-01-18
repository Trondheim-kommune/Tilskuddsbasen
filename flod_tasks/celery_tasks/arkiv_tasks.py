# -*- coding: utf-8 -*-
import ast
import base64
import copy
import tempfile
import traceback
import json
import re
import mmap

from billiard import current_process
from suds import WebFault
from suds.client import Client
from suds.sudsobject import asdict
from celery.utils.log import get_task_logger

from celery.utils.mail import ErrorMail
import requests

from celery_app import app
from celery_tasks import SAK_URL, SAK_VERSION, ARKIV_SAK_URL, JOURNAL_POSTERING_URL, USERS_URL, USERS_VERSION, DEFAULT_MAX_RETRIES, DEFAULT_RETRY_DELAY
from flod_common.session.utils import make_superuser_auth_cookie

logger = get_task_logger(__name__)

arkiv_response_dict_start = '#A#R#D#S#'
arkiv_response_dict_end = '#A#R#D#E#'


class ErrorMailArkiv(ErrorMail):
    subject = u"""Arkivering{JobType} feilet for søknad {EksterntSaksnr}"""
    body = u"""
Arkivering{JobType} feilet for søknad {EksterntSaksnr}.

Feilmelding fra arkiv: {response_status_from_arkiv} {response_melding_from_arkiv}

Når feilen er utbedret, kan system-administrator kjøre jobben på nytt ved å trigge arkivering av arkiveringsjobb med id {arkivverdig_info_id}.


Host: {hostname}
""" + ErrorMail.body

    def send(self, context, exc, fail_silently=True):
        # add EksterntSaksnr to context to be able to use it in subject
        kwargs = ast.literal_eval(context.get(u'kwargs', '{}'))
        context['EksterntSaksnr'] = kwargs.get('metadata', {}).get('EksterntSaksnr', 'UNKNOWN')
        context['arkivverdig_info_id'] = kwargs.get('arkivverdig_info_id', {'UNKNOWN'})

        response_from_arkiv = self.extract_response_from_arkiv(context)
        context['response_status_from_arkiv'] = response_from_arkiv.get('status', '')
        context['response_melding_from_arkiv'] = response_from_arkiv.get('melding', '')

        context['JobType'] = ' av sak' if context.get('name', '') == 'celery_tasks.arkiv_tasks.create_sak_in_archive' \
            else ' av journalpost' if context.get('name', '') == 'celery_tasks.arkiv_tasks.create_journalpost_in_archive' else ''

        super(ErrorMailArkiv, self).send(context, exc, fail_silently)

    def extract_response_from_arkiv(self, context):
        m = re.search('(?<=' + arkiv_response_dict_start + ')(.+)(?=' + arkiv_response_dict_end + ')', context.get('traceback'))
        # Extracting response from traceback and transform it back to a dict
        str_response_from_arkiv = m.group(0) if m else None
        response_from_arkiv = {}
        if str_response_from_arkiv:
            str_response_from_arkiv = ast.literal_eval('u"""' + str_response_from_arkiv + '"""')
            response_from_arkiv = json.loads(str_response_from_arkiv)
        return response_from_arkiv


@app.task
def trigger_arkivverdig_info_processor():
    print "Triggering  the arkivverdig_info processor."
    auth_token_cookie = make_superuser_auth_cookie()
    response = requests.post('%s/api/%s/arkivverdig_info/process' % (SAK_URL, SAK_VERSION),
                             cookies=auth_token_cookie,
                             data=json.dumps([]),
                             headers={'Content-type': 'application/json', 'Accept': 'text/plain'})
    if response.status_code != 201:
        logger.error("Could not trigger the arkivverdig_info processor, response has status %s!\n response=%s"
                     % (response.status_code, response))


"""
WARNING: UGLY WORKAROUND

The args and kwargs in ErrorMail is only the supplied parameters when calling the task.
For some reason it is not possible to pass additional parameters to ErrorEmail,
but all parameters (incl changes) shows up in the traceback.
The traceback will hold the current value, while the kwargs will hold the previous value.

As a workaround to be able to pass the response from archive to the email, the 'response_from_arkiv'
parameter is needed in both 'create_sak_in_archive' and 'create_journalpost_in_archive'.

"""


@app.task(bind=True, max_retries=DEFAULT_MAX_RETRIES, default_retry_delay=DEFAULT_RETRY_DELAY, send_error_emails=True, ErrorMail=ErrorMailArkiv)
def create_sak_in_archive(self, arkivverdig_info_id, metadata, response_from_arkiv=None):
    """

    :param arkivverdig_info_id:
    :param metadata:
    :param response_from_arkiv: this parameter is used as a workaround to be able to get the response from archive when
    generating the error email.
    :return:
    """
    try:
        data = copy.deepcopy(metadata)
        # get saksbehandler ident basert på lagrede id!
        data['Saksansvarlig'] = get_user_ident_by_id(data.get('Saksansvarlig', None))

        header = {
            'AvsenderSystemkode': 'TIB'
        }

        client = Client(ARKIV_SAK_URL + '?wsdl')
        client.set_options(location=ARKIV_SAK_URL)
        response = client.service.T10121_ArkivSak(header, None, data)
        response_as_dict = as_str_dict(response)
        if response_as_dict.get('status', -1) != '0':
            response_from_arkiv = {'response': arkiv_response_dict_start + json.dumps(response_as_dict) + arkiv_response_dict_end}
            raise Exception("Message 'create_sak_in_archive' for arkivverdig_info with id=%s failed! Response %s" % (arkivverdig_info_id, response_as_dict))
        return response_as_dict
    except Exception as e:
        if isinstance(e, WebFault):
            response_from_arkiv = {'response': arkiv_response_dict_start + json.dumps({'melding': str(e)}) + arkiv_response_dict_end}
        logger.error("<WORKER PID %s><TASK %s> 'create_sak_in_archive' failed. "
                     "Message for arkivverdig_info with id=%s will be retried in %s seconds."
                     % (current_process().ident, self.request.id, arkivverdig_info_id, self.default_retry_delay)
                     )
        logger.error(traceback.format_exc().decode('utf-8'))

        self.retry(kwargs={'arkivverdig_info_id': arkivverdig_info_id, 'metadata': metadata, 'response_from_arkiv': response_from_arkiv})


@app.task(bind=True, max_retries=DEFAULT_MAX_RETRIES, default_retry_delay=DEFAULT_RETRY_DELAY, send_error_emails=True, ErrorMail=ErrorMailArkiv)
def create_journalpost_in_archive(self, arkivverdig_info_id, metadata, response_from_arkiv=None):
    """

    :param arkivverdig_info_id:
    :param metadata:
    :param response_from_arkiv: this parameter is used as a workaround to be able to get the response from archive when
    generating the error email.
    :return:
    """
    try:
        data = copy.deepcopy(metadata)
        # get saksbehandler ident basert på lagrede id!
        data['Saksbehandler'] = get_user_ident_by_id(data.get('Saksbehandler', None))
        # FilInnhold, currently contains mimeType and file_ref, should only contain base64 encoded string
        # nowhere to set mimeType of content!?
        documents = data.get('Dokument', [])
        for doc in documents:
            filinnhold = doc.pop('FilInnhold', {})
            file_ref = filinnhold.get('file_ref', None)
            if file_ref:
                doc['FilInnhold'] = file_ref

        header = {
            'AvsenderSystemkode': 'TIB'
        }

        client = Client(JOURNAL_POSTERING_URL + '?wsdl')
        client.set_options(location=JOURNAL_POSTERING_URL)
        # response = client.service.T10122_JournalPostering(header, data)
        response = with_attachment(client.service.T10122_JournalPostering, header, data)
        response_as_dict = as_str_dict(response)
        if response_as_dict.get('status', -1) != '0':
            response_from_arkiv = {'response': arkiv_response_dict_start + json.dumps(response_as_dict) + arkiv_response_dict_end}
            raise Exception("Message 'create_journalpost_in_archive' for arkivverdig_info with id=%s failed! Response %s" % (arkivverdig_info_id, response_as_dict))
        return response_as_dict
    except Exception as e:
        if isinstance(e, WebFault):
            response_from_arkiv = {'response': arkiv_response_dict_start + json.dumps({'melding': str(e)}) + arkiv_response_dict_end}
        logger.error("<WORKER PID %s><TASK %s> 'create_journalpost_in_archive' failed. "
                     "Message for arkivverdig_info with id=%s will be retried in %s seconds."
                     % (current_process().ident, self.request.id, arkivverdig_info_id, self.default_retry_delay))
        logger.error(traceback.format_exc().decode('utf-8'))
        self.retry(kwargs={'arkivverdig_info_id': arkivverdig_info_id, 'metadata': metadata, 'response_from_arkiv': response_from_arkiv})


def as_str_dict(response):
    response_as_dict = asdict(response)
    for k, v in response_as_dict.iteritems():
        response_as_dict[k] = v.encode('utf-8')
    return response_as_dict


def get_user_ident_by_id(user_id):
    if user_id:
        url = '%s/api/%s/users/%s' % (USERS_URL, USERS_VERSION, user_id)
        auth_token_cookie = make_superuser_auth_cookie()
        response = requests.get(url, cookies=auth_token_cookie)
        data = response.json()
        return data.get('private_id', None)
    return None


def with_attachment(suds_method, *args, **kwargs):
    soap_method = suds_method.method

    # Generate SOAP XML appropriate for this request
    soap_client = suds_method.clientclass(kwargs)
    binding = soap_method.binding.input
    soap_xml = binding.get_message(soap_method, args, kwargs)

    # replace file name in tag <ns1:FilInnhold></ns1:FilInnhold>
    # with base64-encoded file-content
    pattern = re.compile('(<ns1:FilInnhold>)(.*?)(</ns1:FilInnhold>)')
    txt = re.split(pattern, soap_xml.plain().encode('utf-8'))

    # with tempfile.NamedTemporaryFile(mode="w+", suffix='.txt', prefix='arkiv_', delete=False) as f:
    with tempfile.TemporaryFile(mode="w+", suffix='.txt', prefix='arkiv_') as f:
        # with open('/tmp/test.txt', 'w+') as f:
        is_file = False
        for s in txt:
            if is_file:
                print "filnavn %s" % s
                is_file = False
                with open(s, "rb") as file_content:
                    while True:
                        chunk = file_content.read(3 * 1024 * 1024)
                        if not chunk:
                            break
                        encoded_string = base64.b64encode(chunk)
                        f.write(encoded_string)
            else:
                if s == '<ns1:FilInnhold>':
                    is_file = True
                f.write(s)

        f.flush()
        mmapped = MyMMap(f.fileno(), 0, access=mmap.ACCESS_READ)
        sc = soap_client(suds_method.client, soap_method)
        return sc.send(MySoapEnv(mmapped))


class MyMMap(mmap.mmap):
    """
    This is a helper-class to get around that suds `suds.client.SoapClient` will try to do a .encode
    """

    def encode(self, *args, **kwargs):
        return self


class MySoapEnv:
    """
    This is a helper-class to get around the suds `suds.client.SoapClient` will try to do a .root and .plain or .str
    By using `MyMMap` when creating instances of this class you will be able to use mmap as data for
    `suds.client.SoapClient`
    """

    def __init__(self, stream):
        self.stream = stream

    def root(self):
        return None

    def plain(self):
        return self.str()

    def str(self):
        return self.stream
