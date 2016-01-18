# !/usr/bin/env python
# -*- coding: utf-8 -*-
import json
import os
from functools import partial

from bouncer.constants import MANAGE
import requests
from flask import request, abort

from flask.ext.bouncer import Bouncer, GET, PUT, POST, DELETE

from flod_common.session.utils import unsign_auth_token, verify_superuser_auth_token
from api.soknad_actions import SoknadAction
from api.user_utils import is_soker, is_godkjenner, is_saksbehandler, is_administrator, is_superuser
from repo.soknad_repo import SoknadRepo
from statemachine.soknad_sm import SoknadStateMachine

USERS_URL = os.environ.get('USERS_URL', 'http://localhost:4000')
USERS_VERSION = os.environ.get('USERS_VERSION', 'v1')
ORGANISATIONS_URL = os.environ.get('ORGANISATIONS_URL', 'http://localhost:1338')
ORGANISATIONS_VERSION = os.environ.get('ORGANISATIONS_VERSION', 'v1')


def get_user_by_id(user_id, cookies):
    url = '%s/api/%s/users/%s/public' % (USERS_URL, USERS_VERSION, user_id)
    response = requests.get(url, cookies=cookies)
    if response.status_code == 200:
        return json.loads(response.content)
    else:
        return None


def get_user_id_from_cookies(cookies):
    if 'auth_token' not in cookies:
        return None
    return unsign_auth_token(cookies['auth_token'])


def get_user(cookies):
    if verify_superuser_auth_token(cookies.get('auth_token')):
        return {'is_superuser': True}

    user_id = get_user_id_from_cookies(cookies)
    if user_id:
        url = '%s/api/%s/users/%s' % (USERS_URL, USERS_VERSION, user_id)
        response = requests.get(url, cookies=cookies)
        return response.json()
    return None


def get_user_from_auth():
    user = get_user(request.cookies)
    if user is None:
        abort(401)
    return user


def is_person_member_of_organisation(organisation_id, person_id):
    if organisation_id is not None and person_id is not None:
        persons = get_persons_for_organisation(organisation_id, request.cookies)
        for person in persons:
            if person_id == person['id']:
                return True
    return False


def get_persons_for_organisation(organisation_id, cookies):
    url = "%s/api/%s/organisations/%s/persons/" % (ORGANISATIONS_URL, ORGANISATIONS_VERSION, organisation_id)
    response = requests.get(
        url=url,
        headers={'content-type': 'application/json; charset=utf-8'},
        cookies=cookies
    )
    return json.loads(response.content)


def get_organisations_for_person(person_id, cookies):
    url = "%s/api/%s/persons/%s/organisations/" % (ORGANISATIONS_URL, ORGANISATIONS_VERSION, person_id)
    response = requests.get(
        url=url,
        headers={'content-type': 'application/json; charset=utf-8'},
        cookies=cookies
    )
    return json.loads(response.content)


def get_organisation(org_id, cookies):
    url = "%s/api/%s/organisations/%s" % (ORGANISATIONS_URL, ORGANISATIONS_VERSION, org_id)
    response = requests.get(
        url=url,
        headers={'content-type': 'application/json; charset=utf-8'},
        cookies=cookies
    )
    return json.loads(response.content)


def get_person(person_id, cookies):
    url = "%s/api/%s/persons/%s" % (ORGANISATIONS_URL, ORGANISATIONS_VERSION, person_id)
    response = requests.get(
        url=url,
        headers={'content-type': 'application/json; charset=utf-8'},
        cookies=cookies
    )
    return json.loads(response.content)


def if_soker_can_manage_soknad(soknad, user):
    user_can_manage_soknad = is_soker(user) \
                             and (is_person_member_of_organisation(soknad.organisation_id, user["person_id"])
                                  or if_is_soknad_owner_and_no_organisation_is_registered(soknad, user))
    return user_can_manage_soknad


def if_is_soknad_owner_and_no_organisation_is_registered(soknad, user):
    is_owner = soknad.person_id == user['person_id']
    has_no_organisation_registered = soknad.organisation_id is None
    return is_owner and has_no_organisation_registered


def if_rapport_owner_can_create_report(rapport, user):
    soknad = SoknadRepo.find_by_id(rapport.soknad_id)
    soknadaction = SoknadAction(soknad, SoknadStateMachine.t_opprett_rapport)
    return if_rapport_owner(rapport, user) and can_perform_action(soknadaction, user)


def if_rapport_owner_can_edit_report(rapport, user):
    soknad = SoknadRepo.find_by_id(rapport.soknad_id)
    soknadaction = SoknadAction(soknad, SoknadStateMachine.t_rediger_rapport)
    return if_rapport_owner(rapport, user) and can_perform_action(soknadaction, user)


def if_soknad_is_not_kladd(soknad):
    return soknad.status != SoknadStateMachine.s_kladd.id


def if_soknad_is_not_in_status_rapport_pabegynt(rapport):
    soknad = SoknadRepo.find_by_id(rapport.soknad_id)
    return soknad.status != SoknadStateMachine.s_rapport_pabegynt.id


def if_rapport_owner(rapport, user):
    soknad = SoknadRepo.find_by_id(rapport.soknad_id)
    return if_soker_can_manage_soknad(soknad, user)


def they_can_get_erv_file(user, they):
    if is_saksbehandler(user) or is_godkjenner(user):
        they.can(GET, 'ErvFile')


def they_can_get_generated_vedtaksbrev(user, they):
    if is_saksbehandler(user) or is_godkjenner(user):
        they.can(GET, 'GeneratedVedtaksbrev')


def if_tilskuddsordning_is_published(tilskuddsordning):
    return tilskuddsordning.publisert


def if_soknad_tilskuddsordning_is_published(soknad):
    return if_tilskuddsordning_is_published(soknad.tilskuddsordning)


def if_soknad_can_be_updated(soknad, user):
    return soknad.status in [SoknadStateMachine.s_kladd.id, SoknadStateMachine.s_apnet_for_redigering.id] and if_soker_can_manage_soknad(soknad, user)


def if_soknad_can_be_deleted(soknad, user):
    return soknad.status == SoknadStateMachine.s_kladd.id and if_soker_can_manage_soknad(soknad, user)


def they_can_get_soknader(user, they):
    if is_saksbehandler(user) or is_godkjenner(user):
        they.can(GET, 'Soknad', partial(if_soknad_is_not_kladd))
    elif is_soker(user):
        they.can(GET, 'Soknad', partial(if_soker_can_manage_soknad, user=user))


def they_can_post_soknader(user, they):
    if is_soker(user):
        they.can(POST, 'Soknad', partial(if_soknad_tilskuddsordning_is_published))


def they_can_put_soknader(user, they):
    they.can(PUT, 'Soknad', partial(if_soknad_can_be_updated, user=user))


def they_can_delete_soknader(user, they):
    they.can(DELETE, 'Soknad', partial(if_soknad_can_be_deleted, user=user))


def they_can_get_rapport(user, they):
    if is_saksbehandler(user) or is_godkjenner(user):
        they.can(GET, 'Rapport', partial(if_soknad_is_not_in_status_rapport_pabegynt))
    else:
        they.can(GET, 'Rapport', partial(if_rapport_owner, user=user))


def they_can_post_rapport(user, they):
    if is_soker(user):
        they.can(POST, 'Rapport', partial(if_rapport_owner_can_create_report, user=user))


def they_can_put_rapport(user, they):
    they.can(PUT, 'Rapport', partial(if_rapport_owner_can_edit_report, user=user))


def they_can_delete_rapport(user, they):
    # we have no functionality to delete a report
    # they.can(DELETE, 'Rapport', partial(if_rapport_owner, user=user))
    return


def they_can_get_tilskuddsordninger(user, they):
    if is_administrator(user) or is_saksbehandler(user) or is_godkjenner(user):
        they.can(GET, 'Tilskuddsordning')
    elif is_soker(user):
        they.can(GET, 'Tilskuddsordning', if_tilskuddsordning_is_published)


def they_can_post_tilskuddsordninger(user, they):
    if is_administrator(user):
        they.can(POST, 'Tilskuddsordning')


def they_can_put_tilskuddsordninger(user, they):
    if is_administrator(user):
        they.can(PUT, 'Tilskuddsordning')


def they_can_get_standardtekster(user, they):
    if is_saksbehandler(user) or is_administrator(user):
        they.can(GET, 'StandardTekst')


def they_can_post_standardtekster(user, they):
    if is_administrator(user):
        they.can(POST, 'StandardTekst')


def they_can_put_standardtekster(user, they):
    if is_administrator(user):
        they.can(PUT, 'StandardTekst')


def they_can_delete_standardtekster(user, they):
    if is_administrator(user):
        they.can(DELETE, 'StandardTekst')


def they_can_post_purring(user, they):
    if is_superuser(user):
        they.can(POST, 'Purring')


def they_can_process_arkivverdig_info(user, they):
    if is_superuser(user):
        they.can(POST, 'ArkivverdigInfo')


def they_can_get_saksvedlegg(user, they):
    if is_saksbehandler(user) or is_godkjenner(user):
        they.can(GET, 'Saksvedlegg')


def they_can_post_saksvedlegg(user, they):
    if is_saksbehandler(user):
        they.can(POST, 'Saksvedlegg')


def filter_actions(soknad, user):
    mapping_roles_and_transitions = {
        'tilskudd_soker': [
            SoknadStateMachine.t_slett,
            SoknadStateMachine.t_sende_inn,
            SoknadStateMachine.t_trekk,
            SoknadStateMachine.t_rediger_soknad,
            SoknadStateMachine.t_lever_rapport,
            SoknadStateMachine.t_opprett_rapport,
            SoknadStateMachine.t_rediger_rapport,
            SoknadStateMachine.t_godta_vedtak,
            SoknadStateMachine.t_send_tilbake_til_saksbehandling,
            SoknadStateMachine.t_endre_kontakt
        ],
        'tilskudd_saksbehandler': [
            SoknadStateMachine.t_trekk,
            SoknadStateMachine.t_apne_soknad_for_redigering,
            SoknadStateMachine.t_behandle,
            SoknadStateMachine.t_endre_saksbehandler,
            SoknadStateMachine.t_til_vedtak,
            SoknadStateMachine.t_godkjenn_rapport,
            SoknadStateMachine.t_rediger_rapportfrist,
            SoknadStateMachine.t_avslutt,
            SoknadStateMachine.t_til_utbetaling,
            SoknadStateMachine.t_underkjenn_rapport,
            SoknadStateMachine.t_avskriv_rapportkrav,
            SoknadStateMachine.t_krev_tilbakebetaling,
            SoknadStateMachine.t_vurder_klage,
            SoknadStateMachine.t_registrer_utbetaling,
            SoknadStateMachine.t_last_opp_saksvedlegg,
            SoknadStateMachine.t_endre_tilskuddsordning
        ],
        'tilskudd_godkjenner': [
            SoknadStateMachine.t_fatt_vedtak,
            SoknadStateMachine.t_tilbake_til_innstilling,
            SoknadStateMachine.t_fatt_klagevedtak,
            SoknadStateMachine.t_tilbake_til_vurder_klage
        ],
        'tilskudd_administrator': []
    }

    if soknad.status == SoknadStateMachine.s_vedtak_fattet.id and if_soker_can_manage_soknad(soknad, user):
        if len(soknad.vedtak) != 0:
            nyeste_vedtak = soknad.nyeste_vedtak()
            if nyeste_vedtak.vedtatt_belop > 0:
                mapping_roles_and_transitions.get('tilskudd_soker').append(SoknadStateMachine.t_takke_nei)
            if not nyeste_vedtak.behandlet_av_formannskapet:
                if len(soknad.klage) > 0:
                    mapping_roles_and_transitions.get('tilskudd_soker').append(SoknadStateMachine.t_oppretthold_klage)
                else:
                    mapping_roles_and_transitions.get('tilskudd_soker').append(SoknadStateMachine.t_vedtak_klaget)

    roles = user.get('roles', [])

    if if_soker_can_manage_soknad(soknad, user):
        roles.append({'name': 'tilskudd_soker'})

    soker_can_manage_soknad = if_soker_can_manage_soknad(soknad, user)
    saksbehandler_for_soknad = is_saksbehandler_for_soknad(soknad, user)
    saksbehandler_for_tilskuddsordning = is_saksbehandler_for_tilskuddsordning(soknad.tilskuddsordning, user)
    godkjenner_for_tilskuddsordning = is_godkjenner_for_tilskuddsordning(soknad.tilskuddsordning, user)

    role_actions = {}
    sm = SoknadStateMachine()
    actions = sm.get_transitions(soknad.status, user)

    for role, mapped_actions in mapping_roles_and_transitions.iteritems():
        for action in actions.values():
            if action in mapped_actions and (
                            (role == 'tilskudd_soker' and soker_can_manage_soknad)
                        or (role == 'tilskudd_godkjenner' and godkjenner_for_tilskuddsordning)
                    or (role == 'tilskudd_saksbehandler' and (saksbehandler_for_soknad or (action == SoknadStateMachine.t_behandle and saksbehandler_for_tilskuddsordning)
                                                              or (action == SoknadStateMachine.t_endre_saksbehandler and saksbehandler_for_tilskuddsordning)))):
                role_actions[action.id] = action

    return role_actions


def is_saksbehandler_for_soknad(soknad, user):
    if soknad.saksbehandler_id:
        return (is_saksbehandler(user)
                and soknad.saksbehandler_id == user.get('id')
                and is_saksbehandler_for_tilskuddsordning(soknad.tilskuddsordning, user))


def is_saksbehandler_for_tilskuddsordning(tilskuddsordning, user):
    return (is_saksbehandler(user)
            and user.get('id') in [s.saksbehandler_id for s in tilskuddsordning.saksbehandlere])


def is_godkjenner_for_tilskuddsordning(tilskuddsordning, user):
    return (is_godkjenner(user)
            and user.get('id') == tilskuddsordning.godkjenner_id)


def can_perform_action(soknadaction, user):
    actions = filter_actions(soknadaction.soknad, user)
    return soknadaction.action in actions.values()


def they_can_manage_soknadaction(user, they):
    they.can(MANAGE, 'SoknadAction', partial(can_perform_action, user=user))


def they_can_post_tilskuddsordning_action(user, they):
    if is_saksbehandler(user):
        they.can(POST, 'TilskuddsordningAction')


def define_authorization(user, they):
    # Søknad / Sak
    they_can_get_soknader(user, they)
    they_can_put_soknader(user, they)
    they_can_post_soknader(user, they)
    they_can_delete_soknader(user, they)

    # ERV
    they_can_get_erv_file(user, they)

    # Generated vedtaksbrev
    they_can_get_generated_vedtaksbrev(user, they)

    # Rapport
    they_can_get_rapport(user, they)
    they_can_put_rapport(user, they)
    they_can_post_rapport(user, they)
    they_can_delete_rapport(user, they)

    # Tilskuddsordning
    they_can_get_tilskuddsordninger(user, they)
    they_can_post_tilskuddsordninger(user, they)
    they_can_put_tilskuddsordninger(user, they)

    # Standardtekster
    they_can_get_standardtekster(user, they)
    they_can_post_standardtekster(user, they)
    they_can_put_standardtekster(user, they)
    they_can_delete_standardtekster(user, they)

    # SoknadAction
    they_can_manage_soknadaction(user, they)

    # Purring
    they_can_post_purring(user, they)

    # Arkivverdig info
    they_can_process_arkivverdig_info(user, they)

    # Saksbehandler vedlegg
    they_can_get_saksvedlegg(user, they)
    they_can_post_saksvedlegg(user, they)

    # Tilskuddsordning action
    they_can_post_tilskuddsordning_action(user, they)


def create_bouncer(app):
    bouncer = Bouncer(app, ensure_authorization=False)
    bouncer.get_current_user = get_user_from_auth
    bouncer._authorization_method = define_authorization
    return bouncer
