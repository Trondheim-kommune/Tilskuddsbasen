# -*- coding: utf-8 -*-
import urllib

from flask import render_template, current_app, request
from celery import Celery
from flask.ext.restful.representations import json

from api import SoknaderFilterResource
from api.auth import get_user_by_id, get_organisation, get_person
from statemachine.soknad_sm import SoknadStateMachine
from utils.facets import AnyOfFacet
from utils.lz_string import LZString


SK_SOKNAD_ON_PURRING_TEMPLATE = u"epost/soker_email_soknad_purring.txt"
SK_SOKNAD_SENDT_INN_TEMPLATE = u"epost/soker_email_soknad_sendt_inn.txt"
SB_SOKNAD_SENDT_INN_TEMPLATE = u"epost/saksbehandler_email_soknad_sendt_inn.txt"
ORG_SOKNAD_SENDT_INN_TEMPLATE = u"epost/organisasjon_email_soknad_sendt_inn.txt"

SK_VEDTAK_FATTET_TEMPLATE = u"epost/soker_email_vedtak_fattet.txt"
SK_KLAGEVEDTAK_FATTET_TEMPLATE = u"epost/soker_email_klagevedtak_fattet.txt"

SK_RAPPORT_UNDERKJENT_TEMPLATE = u"epost/soker_email_rapport_underkjent.txt"
SK_RAPPORT_LEVERT_TEMPLATE = u"epost/soker_email_rapport_levert.txt"
SK_RAPPORT_PURRING_TEMPLATE = u"epost/soker_email_rapport_purring.txt"
SB_RAPPORT_LEVERT_TEMPLATE = u"epost/saksbehandler_email_rapport_levert.txt"

GK_VARSEL_FOR_TILSKUDDSORDNING_TEMPLATE = u'epost/godkjenner_email_varsel_for_tilskuddsordning.txt'

celery_app = Celery(broker='amqp://guest:guest@localhost:5672//')


def get_ansvarlige_saksbehandlere(soknad):
    ansvarlige_saksbehandlere = soknad.tilskuddsordning.saksbehandlere

    saksbehandlere = []
    for ansvarlig_saksbehandler in ansvarlige_saksbehandlere:
        user = get_user_by_id(ansvarlig_saksbehandler.saksbehandler_id, request.cookies)
        if user is not None:
            saksbehandlere.append(user)
    return saksbehandlere


def send_email_to_saksbehandlere_on_action_send_inn(soknad):
    saksbehandlere = get_ansvarlige_saksbehandlere(soknad)

    message = render_template(SB_SOKNAD_SENDT_INN_TEMPLATE,
                              soknad_id=soknad.id,
                              tilskuddsordning_navn=soknad.tilskuddsordning.navn)

    if saksbehandlere is None or len(saksbehandlere) == 0:
        current_app.logger.warn(u"Kunne ikke sende epost til saksbehandlere ved innsendelse av søknad %s, "
                                u"ingen saksbehandlere funnet for denne tilskuddsordningen '%s'!"
                                % (soknad.id, soknad.tilskuddsordning.navn))
    else:
        for saksbehandler in saksbehandlere:
            if saksbehandler['profile']['email'] is not None:
                celery_app.send_task('celery_tasks.email_tasks.send_email_task',
                                     queue='email',
                                     kwargs={'subject': u'Ny søknad om tilskudd mottatt',
                                             'sender': u'tilskudd@trondheim.kommune.no',
                                             'recipients': [saksbehandler['profile']['email']],
                                             'body': message})
            else:
                current_app.logger.warn(u"Kunne ikke sende epost til saksbehandler %s ved innsendelse av søknad %s, "
                                        u"igen epost er satt!"
                                        % (saksbehandler['id'], soknad.id))


def send_email_to_soker_on_action_lever_rapport(soknad):
    if soknad.epost is None or soknad.epost == '':
        current_app.logger.warn(u"Kunne ikke sende epost til personen %s ved levering av rapport %s, "
                                u"ingen epost adresse registrert på søknaden!"
                                % (soknad.person_id, soknad.id))
    else:
        message = render_template(SK_RAPPORT_LEVERT_TEMPLATE, soknad_id=soknad.id)
        celery_app.send_task('celery_tasks.email_tasks.send_email_task',
                             queue='email',
                             kwargs={'subject': u'Bekreftelse på mottatt rapport',
                                     'sender': u'tilskudd@trondheim.kommune.no',
                                     'recipients': [soknad.epost],
                                     'body': message})


def send_email_to_saksbehandler_on_action_lever_rapport(soknad):
    saksbehandler = get_user_by_id(soknad.saksbehandler_id, request.cookies)

    message = render_template(SB_RAPPORT_LEVERT_TEMPLATE, soknad_id=soknad.id, rapport_id=soknad.rapport[0].id)

    if saksbehandler is None:
        current_app.logger.warn(u"Kunne ikke sende epost til saksbehandler %s ved levering av rapport, "
                                u"ingen saksbehandler satt for denne søknaden '%s'!"
                                % (soknad.id, soknad.id))
    else:
        if saksbehandler['profile']['email'] is not None:
            celery_app.send_task('celery_tasks.email_tasks.send_email_task',
                                 queue='email',
                                 kwargs={'subject': u'Ny rapport mottatt',
                                         'sender': u'tilskudd@trondheim.kommune.no',
                                         'recipients': [saksbehandler['profile']['email']],
                                         'body': message})
        else:
            current_app.logger.warn(u"Kunne ikke sende epost til saksbehandler %s ved levering av rapport til søknad %s, "
                                    u"igen epost er satt!"
                                    % (saksbehandler['id'], soknad.id))


def send_email_to_soker_on_action_send_inn(soknad):
    if soknad.epost is None or soknad.epost == '':
        current_app.logger.warn(u"Kunne ikke sende epost til personen %s ved innsendelse av søknad %s, "
                                u"ingen epost adresse registrert på søknaden!"
                                % (soknad.person_id, soknad.id))
    else:
        message = render_template(SK_SOKNAD_SENDT_INN_TEMPLATE, soknad_id=soknad.id)
        celery_app.send_task('celery_tasks.email_tasks.send_email_task',
                             queue='email',
                             kwargs={'subject': u'Bekreftelse på mottatt søknad',
                                     'sender': u'tilskudd@trondheim.kommune.no',
                                     'recipients': [soknad.epost],
                                     'body': message})


def send_email_to_organisasjon_on_action_send_inn(soknad):
    organisation = get_organisation(soknad.organisation_id, request.cookies)

    if (organisation.get('email_address') is None or organisation.get('email_address') == '') and \
        (organisation.get('local_email_address') is None or organisation.get('local_email_address') == ''):
        current_app.logger.warn(u"Kunne ikke sende epost til organisasjon %s ved innsendelse av søknad %s, "
                                u"ingen epost adresse registrert på søknaden!"
                                % (organisation.get("id"), soknad.id))
    else:
        person = get_person(soknad.person_id, request.cookies)
        name = person.get('first_name', '')+' '+ person.get('last_name', '')

        message = render_template(ORG_SOKNAD_SENDT_INN_TEMPLATE, aktor=organisation.get('name'), soker=name,
                                  prosjektnavn=soknad.prosjektnavn,levert_dato=soknad.levert_dato, soknad_id=soknad.id)

        celery_app.send_task('celery_tasks.email_tasks.send_email_task',
                             queue='email',
                             kwargs={'subject': u'Bekreftelse på mottatt søknad',
                                     'sender': u'tilskudd@trondheim.kommune.no',
                                     'recipients': [organisation.get('email_address'), organisation.get('local_email_address')],
                                     'body': message})


def send_email_to_soker_on_action_fatt_vedtak(soknad):
    if soknad.epost is None or soknad.epost == '':
        current_app.logger.warn(u"Kunne ikke sende epost til personen %s om fattet vedtak for søknad %s, "
                                u"ingen epost adresse registrert på søknaden!"
                                % (soknad.person_id, soknad.id))
    else:
        message = render_template(SK_VEDTAK_FATTET_TEMPLATE, soknad_id=soknad.id)
        celery_app.send_task('celery_tasks.email_tasks.send_email_task',
                             queue='email',
                             kwargs={'subject': u'Søknaden din er behandlet',
                                     'sender': u'tilskudd@trondheim.kommune.no',
                                     'recipients': [soknad.epost],
                                     'body': message})


def send_email_to_soker_on_action_fatt_klagevedtak(soknad):
    if soknad.epost is None or soknad.epost == '':
        current_app.logger.warn(u"Kunne ikke sende epost til personen %s om fattet klagevedtak for søknad %s, "
                                u"ingen epost adresse registrert på søknaden!"
                                % (soknad.person_id, soknad.id))
    else:
        message = render_template(SK_KLAGEVEDTAK_FATTET_TEMPLATE, soknad_id=soknad.id)
        celery_app.send_task('celery_tasks.email_tasks.send_email_task',
                             queue='email',
                             kwargs={'subject': u'Klagen din er behandlet',
                                     'sender': u'tilskudd@trondheim.kommune.no',
                                     'recipients': [soknad.epost],
                                     'body': message})


def send_email_to_soker_on_action_underkjenn(soknad, saksbehandler_kommentar):
    if soknad.epost is None or soknad.epost == '':
        current_app.logger.warn(u"Kunne ikke sende epost til personen %s ved underkjennelse av søknad %s, "
                                u"ingen epost adresse registrert på søknaden!"
                                % (soknad.person_id, soknad.id))
    else:
        message = render_template(SK_RAPPORT_UNDERKJENT_TEMPLATE, soknad_id=soknad.id, saksbehandler_kommentar=saksbehandler_kommentar)
        celery_app.send_task('celery_tasks.email_tasks.send_email_task',
                             queue='email',
                             kwargs={'subject': u'Din rapport ble underkjent',
                                     'sender': u'tilskudd@trondheim.kommune.no',
                                     'recipients': [soknad.epost],
                                     'body': message})


def send_email_to_soker_on_soknad_purring(soknad):
    if soknad.epost is None or soknad.epost == '':
        current_app.logger.warn(u"Kan ikke sende epost ved purring på svar på søknad %s, ingen epost-adresse registrert på søknaden!" % soknad.id)
        return False
    else:
        message = render_template(SK_SOKNAD_ON_PURRING_TEMPLATE, soknad_id=soknad.id)
        celery_app.send_task('celery_tasks.email_tasks.send_email_task',
                             queue='email',
                             kwargs={'subject': u'Purring på svar på vedtak',
                                     'sender': u'tilskudd@trondheim.kommune.no',
                                     'recipients': [soknad.epost],
                                     'body': message})
        return True


def send_email_to_soker_on_rapport_purring(soknad):
    if soknad.epost is None or soknad.epost == '':
        current_app.logger.warn(u"Kan ikke sende epost ved purring på rapport for søknad %s, ingen epost-adresse registrert på søknaden!" % soknad.id)
        return False
    else:
        message = render_template(SK_RAPPORT_PURRING_TEMPLATE, soknad_id=soknad.id, rapportfrist=soknad.nyeste_fattet_vedtak().rapportfrist.strftime('%d-%m-%Y'))
        celery_app.send_task('celery_tasks.email_tasks.send_email_task',
                             queue='email',
                             kwargs={'subject': u'Purring på rapport',
                                     'sender': u'tilskudd@trondheim.kommune.no',
                                     'recipients': [soknad.epost],
                                     'body': message})
        return True


def send_notification_email_to_godkjenner_for_tilskuddsordning(tilskuddsordning, saksbehandler):
    godkjenner = get_user_by_id(tilskuddsordning.godkjenner_id, request.cookies)

    def get_godkjenner_tilskuddsordning_filter():
        facets = [
            AnyOfFacet(name="Tilskuddsordning",
                       values=SoknaderFilterResource.transfrom_to_facet_values(
                           [tilskuddsordning],
                           "navn"
                       )),
            AnyOfFacet(name="Status",
                       values=SoknaderFilterResource.transfrom_to_facet_values(
                           [SoknadStateMachine.s_til_vedtak.id, SoknadStateMachine.s_til_klagevedtak.id]
                       ))
        ]

        return [facet.to_json() for facet in facets]

    if godkjenner is None:
        current_app.logger.warn(u"Kunne ikke sende epost til godkjenner %s, "
                                u"ingen godkjenner satt for denne tilskuddsordningen '%s'!"
                                % (tilskuddsordning.godkjenner_id, tilskuddsordning.id))
        return False, 'Tilskuddsordningen mangler godkjenner.'
    else:
        filter_str = json.dumps(get_godkjenner_tilskuddsordning_filter())
        encoded_filter = LZString().compressToBase64(filter_str)
        encoded_filter = urllib.quote_plus(encoded_filter)

        message = render_template(GK_VARSEL_FOR_TILSKUDDSORDNING_TEMPLATE,
                                  filter=encoded_filter,
                                  saksbehandler=saksbehandler['profile']['full_name'],
                                  tilskuddsordning_navn=tilskuddsordning.navn)
        if godkjenner['profile']['email'] is not None:
            celery_app.send_task('celery_tasks.email_tasks.send_email_task',
                                 queue='email',
                                 kwargs={'subject': u'Tilskuddsordning "%s"' % tilskuddsordning.navn,
                                         'sender': u'tilskudd@trondheim.kommune.no',
                                         'recipients': [godkjenner['profile']['email']],
                                         'body': message})
            return True, None
        else:
            current_app.logger.warn(u"Kunne ikke sende epost til godkjenner %s, "
                                    u"igen epost er satt!" % godkjenner['id'])
            return False, 'Godkjenner mangler epostadresse.'