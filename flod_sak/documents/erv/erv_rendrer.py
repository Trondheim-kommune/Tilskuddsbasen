# -*- coding: utf-8 -*-
from datetime import datetime

from flask import request

from api.auth import get_user_from_auth, get_person
from documents.docx.docx_rendrer import create_docx_from_template
from documents.docx.docx_to_pdf import convert_to_pdf

ERV_TIME_FORMAT = '%d.%m.%Y'

ERV_TEMPLATE = u'erv/Standard_utbetalingsskjema ERV-template.docx'

OUTPUT_FORMAT_DOCX = "docx"
OUTPUT_FORMAT_PDF = "pdf"


def erv_datestr(date):
    return date.strftime(ERV_TIME_FORMAT)


def get_organisasjonsnummer_or_foedselsnummer(organisation, person_id):
    orgnr_fnr = organisation['org_number'] if organisation['org_number'] is not None else ""
    if orgnr_fnr == "":
        orgnr_fnr = get_person(person_id, request.cookies)['national_identity_number']
    return orgnr_fnr if orgnr_fnr is not None else ""


def create_erv_from_template(soknad, organisation, utbetaling, outputformat=OUTPUT_FORMAT_DOCX):
    if outputformat is OUTPUT_FORMAT_PDF:
        return create_erv_pdf_from_template(soknad, organisation, utbetaling)
    else:
        return create_erv_docx_from_template(soknad, organisation, utbetaling)


def create_erv_docx_from_template(soknad, organisation, utbetaling):
    now = datetime.now()
    orgnr_fnr = get_organisasjonsnummer_or_foedselsnummer(organisation, soknad.person_id)
    erv = {
        u'utbetales_til': organisation['name'] if organisation['name'] is not None else "",
        u'orgnr_fnr': orgnr_fnr,
        u'bankkonto': soknad.kontonummer if soknad.kontonummer is not None else "",
        u'belop': "%s,00" % utbetaling.utbetalt_belop if utbetaling.utbetalt_belop is not None else "",
        u'fakturadato': erv_datestr(utbetaling.registrertdato) if utbetaling.registrertdato is not None else "",
        u'forfallsdato': erv_datestr(utbetaling.utbetalingsdato) if utbetaling.utbetalingsdato is not None else "",
        u'tekst':  "%s" % utbetaling.tekst if utbetaling.tekst is not None else "",
        u'utfylt_av': get_user_from_auth()['profile']['full_name'],
        u'utfylt_dato': erv_datestr(now)

    }
    return create_docx_from_template(ERV_TEMPLATE,
                                     erv=erv)

def create_erv_pdf_from_template(soknad, organisation, utbetaling):
    erv_docx, docx_size = create_erv_from_template(soknad, organisation, utbetaling)
    return convert_to_pdf(erv_docx)
