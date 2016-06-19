# -*- coding: utf-8 -*-
from datetime import datetime, date

from bouncer.constants import MANAGE, DELETE
from flask import current_app, request
from flask.ext.bouncer import ensure
from flask.ext.restful import abort

from api import ExportSoknaderResource, ExportRapporterResource
from api.auth import is_person_member_of_organisation, get_person, get_organisation
from flod_common.validation.base_validator import BaseValidator
from api.vedtaksbrev_generator_resource import VedtaksbrevGeneratorResource
from api.soknad_actions import SoknadAction
from constants.tilskuddsordningtyper import FORSKUDDSUTBETALING, ETTERSKUDDSUTBETALING, KREVER_IKKE_RAPPORT
from documents.arkiv.journalpost.arkiv_journalpost import save_journalpost_for_soknad, \
    save_journalpost_for_rapport, save_journalpost_for_klage, save_journalpost_for_vedtaksbrev, \
    InvalidArkivExtensionError
from documents.arkiv.sak.arkiv_sak import save_sak
from documents.documents_utils import get_rel_vedtaksmappe_path, save_file_to_disk
from domain.models import Vedtak, Klage, Utbetaling
from documents.epost.tilskudd_emails import send_email_to_soker_on_action_send_inn, send_email_to_soker_on_action_underkjenn, \
    send_email_to_saksbehandlere_on_action_send_inn, send_email_to_soker_on_action_lever_rapport, \
    send_email_to_saksbehandler_on_action_lever_rapport, send_email_to_soker_on_action_fatt_vedtak, send_email_to_soker_on_action_fatt_klagevedtak, \
    send_email_to_organisasjon_on_action_send_inn
from repo.base_repo import BaseRepo
from repo.rapport_repo import RapportRepo
from repo.soknad_repo import SoknadRepo
from statemachine.soknad_sm import SoknadStateMachine


class VedtakUtils(object):
    @classmethod
    def get_vedtak_for_oppdatering(cls, soknad, vedtak_id, sjekk_dato=True):
        vedtak = None
        if vedtak_id:
            liste = [v for v in soknad.vedtak if v.id == vedtak_id]
            if len(liste) != 1:
                abort(400,
                      __error__=['Fant %s vedtak med id=%s for søknad med id=%s' % (len(liste), vedtak_id, soknad.id)])
            vedtak = liste[0]

            if sjekk_dato:
                if vedtak.vedtaksdato:
                    abort(400, __error__=['Vedtak er allerede fattet, kan ikke oppdateres'])
        return vedtak

    @classmethod
    def fatt_vedtak(cls, soknad, data):
        if data is None or data.get('vedtak_id') is None or data.get('vedtak_id') == "":
            abort(400, __error__=['Vedtak id ikke satt'])

        vedtak = cls.get_vedtak_for_oppdatering(soknad, data.get('vedtak_id'))

        validator = BaseValidator(data)
        validator.validate_le_max_length("intern_merknad", 600, "merknad")
        validator.validate_is_positive_integer("vedtatt_belop", "vedtatt beløp", requires_value=True)
        if validator.has_errors():
            abort(400, __error__=validator.errors)

        BaseRepo.update_model(vedtak, 'vedtatt_belop', data)
        BaseRepo.update_model(vedtak, 'intern_merknad', data)

        return vedtak

    @classmethod
    def tilbake_til_innstilling(cls, soknad, data):
        if data is None or data.get('vedtak_id') is None or data.get('vedtak_id') == "":
            abort(400, __error__=['Vedtak id ikke satt'])

        vedtak = cls.get_vedtak_for_oppdatering(soknad, data.get('vedtak_id'))

        validator = BaseValidator(data)
        validator.validate_le_max_length("intern_merknad", 600, "merknad")
        if validator.has_errors():
            abort(400, __error__=validator.errors)

        BaseRepo.update_model(vedtak, 'intern_merknad', data)

        return vedtak


def slett_action_strategy(soknad, action, data):
    ensure(DELETE, soknad)
    SoknadRepo.delete(soknad)


def opprett_raport_action_strategy(soknad, action, data):
    abort(403, __error__=['For å opprette ny rapport må POST på rapport resource brukes'])


def til_vedtak_action_strategy(soknad, action, data):
    if data is None:
        abort(400, __error__=['Data mangler'])
    vedtak = VedtakUtils.get_vedtak_for_oppdatering(soknad, data.get('vedtak_id'))
    if vedtak is None:
        vedtak = Vedtak()
        soknad.vedtak.append(vedtak)

    validator = BaseValidator(data)
    validator.validate_le_max_length("intern_merknad", 600, "merknad")
    validator.validate_le_max_length("vedtakstekst", 1000, "vedtakstekst")
    validator.validate_le_max_length("andre_opplysninger", 1000, "andre_opplysninger")
    validator.validate_is_positive_integer("innstilt_belop", "innstilt beløp", requires_value=True)
    validator.validate_is_defined("tilskuddsordning_type", label="Rapport og utbetaling")

    if not data.get('saveOnly'):
        validator.validate_is_defined("vedtakstekst")
        innstilt_belop = data.get('innstilt_belop')
        if isinstance(innstilt_belop, basestring) and innstilt_belop.isdigit():
            innstilt_belop = int(innstilt_belop)
        if data.get('tilskuddsordning_type') != KREVER_IKKE_RAPPORT and not innstilt_belop == 0:
            validator.validate_is_defined("rapportfrist")
        soknad.status = action.get_end_state().id

    if validator.has_errors():
        abort(400, __error__=validator.errors)

    BaseRepo.update_model(vedtak, 'innstilt_belop', data)
    BaseRepo.update_model(vedtak, 'intern_merknad', data)
    BaseRepo.update_model(vedtak, 'tilskuddsordning_type', data)

    if data.get('behandlet_av_formannskapet'):
        BaseRepo.update_model(vedtak, 'behandlet_av_formannskapet', data)

    if vedtak.tilskuddsordning_type == KREVER_IKKE_RAPPORT:
        vedtak.rapportfrist = None
    else:
        BaseRepo.update_model(vedtak, 'rapportfrist', data)

    BaseRepo.update_model(vedtak, 'vedtakstekst', data)
    BaseRepo.update_model(vedtak, 'andre_opplysninger', data)

    # setter vedtatt belop slik at det blir default verdi for godkjenner (han kan overstyre den)
    vedtak.vedtatt_belop = vedtak.innstilt_belop

    SoknadRepo.save(soknad)


def sende_inn_action_strategy(soknad, action, data):
    soknad.levert_dato = date.today()

    errors = soknad.validate_soknad_for_innsending()
    if errors:
        abort(400, __error__=errors)

    soknad.status = action.get_end_state().id
    SoknadRepo.save(soknad)
    # Sending mail after save to avoid that mail integration errors make it impossible to perform action.
    # It also makes sense to send mail only when we know that the action is successful
    send_email_to_soker_on_action_send_inn(soknad)
    send_email_to_organisasjon_on_action_send_inn(soknad)

    if not soknad.tilskuddsordning.soknadsfrist:
        send_email_to_saksbehandlere_on_action_send_inn(soknad)


def send_tilbake_til_saksbehandling_strategy(soknad, action, data):
    errors = soknad.validate_soknad_for_innsending()
    if errors:
        abort(400, __error__=errors)

    soknad.status = action.get_end_state().id

    SoknadRepo.save(soknad, autocommit=False)

    # Arkivering
    ############
    organisation = get_organisation(soknad.organisation_id, request.cookies)
    person = get_person(soknad.person_id, request.cookies)

    csv_file_content = ExportSoknaderResource().get(soknad_id=soknad.id).data

    save_journalpost_for_soknad(soknad, organisation, person, csv_file_content,
                                u"soknad-%s-%s.pdf" % (soknad.id, datetime.now().isoformat()))

    current_app.db_session.commit()

    # Sending mail after save to avoid that mail integration errors make it impossible to perform action.
    # It also makes sense to send mail only when we know that the action is successful
    send_email_to_soker_on_action_send_inn(soknad)
    if not soknad.tilskuddsordning.soknadsfrist:
        send_email_to_saksbehandlere_on_action_send_inn(soknad)


def lever_rapport_action_strategy(soknad, action, data):
    rapport = RapportRepo.find_by_where("soknad_id", soknad.id)
    if len(rapport) != 1:
        abort(400, __error__=['Kan ikke finne rapport'])

    errors = rapport[0].validate_rapport_for_levering()
    if errors:
        abort(400, __error__=errors)

    soknad.status = action.get_end_state().id
    SoknadRepo.save(soknad, autocommit=False)

    # Arkivering
    # ###########
    organisation = get_organisation(soknad.organisation_id, request.cookies)
    person = get_person(soknad.person_id, request.cookies)

    csv_file_content = ExportRapporterResource().get(soknad_id=soknad.id, rapport_id=rapport[0].id).data

    save_journalpost_for_rapport(soknad, rapport[0], organisation, person, csv_file_content,
                                 u"soknad-%s-rapport-%s-%s.pdf" % (soknad.id, rapport[0].id, datetime.now().isoformat()))

    current_app.db_session.commit()

    # Sending mail after save to avoid that mail integration errors make it impossible to perform action.
    # It also makes sense to send mail only when we know that the action is successful
    send_email_to_soker_on_action_lever_rapport(soknad)
    send_email_to_saksbehandler_on_action_lever_rapport(soknad)


def rediger_rapportfrist_action_strategy(soknad, action, data):
    if data is None:
        abort(400, __error__=['Data mangler'])
    vedtak = VedtakUtils.get_vedtak_for_oppdatering(soknad, data.get('vedtak_id'), False)
    if vedtak is None:
        abort(400, __error__=['Kan ikke finne vedtak'])

    validator = BaseValidator(data)
    validator.validate_le_max_length("endre_rapportfrist_arsak", 150, "aarsak til rapportfrist")
    validator.validate_is_defined("rapportfrist")

    BaseRepo.update_model(vedtak, 'endre_rapportfrist_arsak', data)
    BaseRepo.update_model(vedtak, 'rapportfrist', data)

    if validator.has_errors():
        abort(400, __error__=validator.errors)

    # dersom rapport er levert, settes den tilbake til påbegynt
    if soknad.status == SoknadStateMachine.s_rapport_levert.id:
        soknad.status = action.get_end_state().id

    SoknadRepo.save(soknad)


def godta_vedtak_action_strategy(soknad, action, data):
    if data is None:
        abort(400, __error__=['Data mangler'])
    vedtak = VedtakUtils.get_vedtak_for_oppdatering(soknad, data.get('vedtak_id'), False)
    if vedtak is None:
        abort(400, __error__=['Kan ikke finne vedtak'])

    if vedtak.vedtatt_belop == 0:
        soknad.status = SoknadStateMachine.s_avsluttet.id
    else:
        if vedtak.tilskuddsordning_type == ETTERSKUDDSUTBETALING:
            soknad.status = SoknadStateMachine.s_avventer_rapport.id
        else:
            # søknader til tilskuddsordninger med forskuddsutbetaling og som krever ikke rapport skal gå direkte til utbetaling
            soknad.status = SoknadStateMachine.s_til_utbetaling.id

    SoknadRepo.save(soknad)


def vedtak_klaget_action_strategy(soknad, action, data):
    if data is None:
        abort(400, __error__=['Data mangler'])

    validator = BaseValidator(data)
    validator.validate_le_max_length("begrunnelse", 300, "begrunnelse")

    if validator.has_errors():
        abort(400, __error__=validator.errors)

    klage = Klage()
    klage.soknad_id = soknad.id
    klage.vedtak_id = data.get('vedtak_id')
    klage.levertdato = datetime.now()
    klage.begrunnelse = data.get('begrunnelse')

    soknad.klage.append(klage)

    soknad.status = action.get_end_state().id
    SoknadRepo.save(soknad, autocommit=False)

    # Arkivering
    # ###########
    organisation = get_organisation(soknad.organisation_id, request.cookies)
    person = get_person(soknad.person_id, request.cookies)
    save_journalpost_for_klage(soknad, organisation, person, klage.begrunnelse.encode("UTF-8"), u"soknad-%s-klage-%s.txt" % (soknad.id, datetime.now().isoformat()))

    current_app.db_session.commit()


def trekk_action_strategy(soknad, action, data):
    if data:
        validator = BaseValidator(data)
        validator.validate_le_max_length("trukket_kommentar", 700, "kommentar")
        if validator.has_errors():
            abort(400, __error__=validator.errors)
        soknad.trukket_kommentar = data.get("trukket_kommentar")
    soknad.status = action.get_end_state().id
    SoknadRepo.save(soknad)


def apne_soknad_for_redigering_action_strategy(soknad, action, data):
    validator = BaseValidator(data)
    validator.validate_le_max_length("merknad", 600, "merknad")

    if validator.has_errors():
        abort(400, __error__=validator.errors)

    soknad.merknad = data.get('merknad')
    soknad.status = action.get_end_state().id
    SoknadRepo.save(soknad)


def behandle_action_strategy(soknad, action, data):
    if not data or not data.get("saksbehandler"):
        abort(400, __error__={'saksbehandler': u'Saksbehandler må være satt'})
    soknad.saksbehandler_id = data.get("saksbehandler")
    soknad.status = action.get_end_state().id

    SoknadRepo.save(soknad, autocommit=False)

    # Arkivering
    # ###########
    organisation = get_organisation(soknad.organisation_id, request.cookies)
    person = get_person(soknad.person_id, request.cookies)

    csv_file_content = ExportSoknaderResource().get(soknad_id=soknad.id).data

    save_sak(soknad)
    save_journalpost_for_soknad(soknad, organisation, person, csv_file_content, u"soknad-%s-%s.pdf" % (soknad.id, datetime.now().isoformat()))

    current_app.db_session.commit()


def endre_saksbehandler_action_strategy(soknad, action, data):
    if not data or not data.get("saksbehandler"):
        abort(400, __error__={'saksbehandler': u'Saksbehandler må være satt'})
    soknad.saksbehandler_id = data.get("saksbehandler")

    SoknadRepo.save(soknad)


def fatt_vedtak_action_strategy(soknad, action, data):
    vedtak = VedtakUtils.fatt_vedtak(soknad, data)
    if not data.get('saveOnly'):
        vedtak.vedtaksdato = datetime.now()
        soknad.status = action.get_end_state().id

        current_app.logger.debug("Generating vedtaksbrev...")
        rendered_file, file_size, mimetype, filename = VedtaksbrevGeneratorResource.generate_vedtaksbrev(soknad, vedtak)
        current_app.logger.debug("Saving vedtaksbrev to backend...")
        saved_filename, saved_in_dir = save_file_to_disk(rendered_file, filename,
                                                         relative_path=get_rel_vedtaksmappe_path(soknad, vedtak))
        current_app.logger.debug("Updating vedtaket med vedtaksbrev_file_ref=%s..." % saved_filename)
        vedtak.vedtaksbrev_file_ref = saved_filename

        # Arkivering
        # ###########
        organisation = get_organisation(soknad.organisation_id, request.cookies)
        person = get_person(soknad.person_id, request.cookies)
        save_journalpost_for_vedtaksbrev(soknad, organisation, person, vedtak, is_utgaaende_dokument=True)

        SoknadRepo.save(soknad)

        # Sending mail after save to avoid that mail integration errors make it impossible to perform action.
        # It also makes sense to send mail only when we know that the action is successful
        if action == SoknadStateMachine.t_fatt_vedtak:
            send_email_to_soker_on_action_fatt_vedtak(soknad)
        elif action == SoknadStateMachine.t_fatt_klagevedtak:
            send_email_to_soker_on_action_fatt_klagevedtak(soknad)

    else:
        SoknadRepo.save(soknad)


def tilbake_til_innstilling_action_strategy(soknad, action, data):
    VedtakUtils.tilbake_til_innstilling(soknad, data)
    soknad.status = action.get_end_state().id
    SoknadRepo.save(soknad)


def tilbake_til_vurder_klage_action_strategy(soknad, action, data):
    VedtakUtils.fatt_vedtak(soknad, data)
    soknad.status = action.get_end_state().id
    SoknadRepo.save(soknad)


def registrer_utbetaling_action_strategy(soknad, action, data):
    if data is None:
        abort(400, __error__=['Data mangler'])

    validator = BaseValidator(data)
    validator.validate_le_max_length("fakturanr", 15, "tekst/fakturanummer")
    validator.validate_is_defined('utbetaling_dato', 'utbetalingsdato')

    if validator.has_errors():
        abort(400, __error__=validator.errors)

    utbetaling = Utbetaling()
    utbetaling.soknad_id = soknad.id
    utbetaling.tekst = data.get('fakturanr')
    utbetaling.utbetalingsdato = data.get('utbetaling_dato')
    utbetaling.utbetalt_belop = soknad.nyeste_vedtak().vedtatt_belop
    utbetaling.registrertdato = datetime.now()

    soknad.utbetaling.append(utbetaling)

    if soknad.nyeste_fattet_vedtak().tilskuddsordning_type == FORSKUDDSUTBETALING:
        soknad.status = SoknadStateMachine.s_avventer_rapport.id
    else:
        # søknader til tilskuddsordninger med etterskuddsutbetaling eller som ikke krever rapport skal avsluttes
        soknad.status = SoknadStateMachine.s_avsluttet.id
    SoknadRepo.save(soknad)


def godkjenn_rapport_action_strategy(soknad, action, data):
    vedtak = soknad.nyeste_fattet_vedtak()
    if vedtak.tilskuddsordning_type == FORSKUDDSUTBETALING:
        soknad.status = SoknadStateMachine.s_avsluttet.id
    elif vedtak.tilskuddsordning_type == ETTERSKUDDSUTBETALING:
        soknad.status = SoknadStateMachine.s_til_utbetaling.id
    SoknadRepo.save(soknad)


def underkjenn_rapport_action_strategy(soknad, action, data):
    rapport = RapportRepo.find_by_where("soknad_id", soknad.id)
    if len(rapport) != 1:
        abort(400, __error__=['Kan ikke finne rapport'])

    if data:
        validator = BaseValidator(data)
        validator.validate_le_max_length("saksbehandler_kommentar", 300)
        if validator.has_errors():
            abort(400, __error__=validator.errors)

        rapport[0].saksbehandler_kommentar = data.get("saksbehandler_kommentar")

        RapportRepo.save(rapport[0])
        # Sending mail after save to avoid that mail integration errors make it impossibv to perform action.
        # It also makes sense to send mail only when we know that the action is successful
        send_email_to_soker_on_action_underkjenn(soknad, data.get("saksbehandler_kommentar"))

    vedtak = soknad.nyeste_fattet_vedtak()
    if vedtak.tilskuddsordning_type == FORSKUDDSUTBETALING:
        soknad.status = SoknadStateMachine.s_tilbakebetaling_kreves.id
    elif vedtak.tilskuddsordning_type == ETTERSKUDDSUTBETALING:
        soknad.status = SoknadStateMachine.s_trukket.id
    SoknadRepo.save(soknad)


def avskriv_rapportkrav_action_strategy(soknad, action, data):
    if data is None:
        abort(400, __error__=['Data mangler'])

    if soknad.status in (SoknadStateMachine.s_rapport_pabegynt.id, SoknadStateMachine.s_avventer_rapport.id):
        soknad.rapport = []

    validator = BaseValidator(data)
    validator.validate_is_defined("avskrevet_rapportkrav_kommentar", 'Årsak')
    validator.validate_le_max_length("avskrevet_rapportkrav_kommentar", 700, 'Årsak')
    if validator.has_errors():
        abort(400, __error__=validator.errors)

    soknad.avskrevet_rapportkrav_kommentar = data.get("avskrevet_rapportkrav_kommentar")

    vedtak = soknad.nyeste_fattet_vedtak()
    if vedtak.tilskuddsordning_type == FORSKUDDSUTBETALING:
        soknad.status = SoknadStateMachine.s_avsluttet.id
    elif vedtak.tilskuddsordning_type == ETTERSKUDDSUTBETALING:
        soknad.status = SoknadStateMachine.s_til_utbetaling.id
    SoknadRepo.save(soknad)


def endre_kontakt_action_strategy(soknad, action, data):
    if data is None:
        abort(400, __error__=['Data mangler'])

    validator = BaseValidator(data)
    validator.validate_is_defined('person_id', label="Kontaktperson")
    validator.validate_is_norwegian_phone_number("telefon", label="Telefonnummer")
    validator.validate_is_email('epost', label='Epost')

    person_id = data.get('person_id', None)
    if person_id is not None and not is_person_member_of_organisation(soknad.organisation_id, person_id):
        validator.add_error('person_id', 'Ugyldig person')

    if validator.has_errors():
        abort(400, __error__=validator.errors)

    soknad.person_id = person_id
    soknad.epost = data.get('epost')
    soknad.telefon = data.get('telefon')

    SoknadRepo.save(soknad)


def endre_tilskuddsordning_action_strategy(soknad, action, data):
    validator = BaseValidator(data)
    validator.validate_is_defined('tilskuddsordning_id', label="Tilskuddsordning")
    validator.validate_is_defined('saksbehandler_id', label="Saksbehandler")

    if validator.has_errors():
        abort(400, __error__=validator.errors)

    soknad.tilskuddsordning_id = data.get('tilskuddsordning_id')
    soknad.saksbehandler_id = data.get('saksbehandler_id')

    SoknadRepo.save(soknad)


def default_action_strategy(soknad, action, data):
    soknad.status = action.get_end_state().id
    SoknadRepo.save(soknad)


def rediger_soknad_action_strategy(soknad, action, data):
    # skal gjøre ingenting
    pass


class SoknadActionExecutor(object):
    custom_strategies = {
        SoknadStateMachine.t_slett: slett_action_strategy,
        SoknadStateMachine.t_rediger_soknad: rediger_soknad_action_strategy,
        SoknadStateMachine.t_opprett_rapport: opprett_raport_action_strategy,
        SoknadStateMachine.t_til_vedtak: til_vedtak_action_strategy,
        SoknadStateMachine.t_sende_inn: sende_inn_action_strategy,
        SoknadStateMachine.t_trekk: trekk_action_strategy,
        SoknadStateMachine.t_apne_soknad_for_redigering: apne_soknad_for_redigering_action_strategy,
        SoknadStateMachine.t_behandle: behandle_action_strategy,
        SoknadStateMachine.t_endre_saksbehandler: endre_saksbehandler_action_strategy,
        SoknadStateMachine.t_fatt_vedtak: fatt_vedtak_action_strategy,
        SoknadStateMachine.t_tilbake_til_innstilling: tilbake_til_innstilling_action_strategy,
        SoknadStateMachine.t_godkjenn_rapport: godkjenn_rapport_action_strategy,
        SoknadStateMachine.t_underkjenn_rapport: underkjenn_rapport_action_strategy,
        SoknadStateMachine.t_avskriv_rapportkrav: avskriv_rapportkrav_action_strategy,
        SoknadStateMachine.t_lever_rapport: lever_rapport_action_strategy,
        SoknadStateMachine.t_rediger_rapportfrist: rediger_rapportfrist_action_strategy,
        SoknadStateMachine.t_godta_vedtak: godta_vedtak_action_strategy,
        SoknadStateMachine.t_vedtak_klaget: vedtak_klaget_action_strategy,
        SoknadStateMachine.t_vurder_klage: til_vedtak_action_strategy,
        SoknadStateMachine.t_fatt_klagevedtak: fatt_vedtak_action_strategy,
        SoknadStateMachine.t_tilbake_til_vurder_klage: tilbake_til_vurder_klage_action_strategy,
        SoknadStateMachine.t_registrer_utbetaling: registrer_utbetaling_action_strategy,
        SoknadStateMachine.t_oppretthold_klage: vedtak_klaget_action_strategy,
        SoknadStateMachine.t_send_tilbake_til_saksbehandling: send_tilbake_til_saksbehandling_strategy,
        SoknadStateMachine.t_endre_kontakt: endre_kontakt_action_strategy,
        SoknadStateMachine.t_endre_tilskuddsordning: endre_tilskuddsordning_action_strategy
    }

    @classmethod
    def execute(cls, soknad, action, data):
        try:
            ensure(MANAGE, SoknadAction(soknad, action))
            current_app.logger.debug(
                u"Håndterer action %s på soknad %s i status %s" % (action.name, soknad.id, soknad.status))
            strategy = default_action_strategy

            if action in cls.custom_strategies:
                strategy = cls.custom_strategies[action]

            return strategy(soknad, action, data)
        except InvalidArkivExtensionError as e:
            abort(400, __error__=[e.message])
