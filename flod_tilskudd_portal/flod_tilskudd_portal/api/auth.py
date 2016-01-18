# !/usr/bin/env python
# -*- coding: utf-8 -*-
import os
from flask.ext.login import current_user

import requests
from flask import request, abort
from flask.ext.bouncer import Bouncer, GET

from flod_common.session.utils import unsign_auth_token

USERS_URL = os.environ.get('USERS_URL', 'http://localhost:4000')
USERS_VERSION = os.environ.get('USERS_VERSION', 'v1')


def is_idporten_user(user):
    return user.get('authentication_type', None) == 'id_porten'


def is_adfs_user(user):
    return user.get('authentication_type', None) == 'active_directory'


def is_soker(user):
    return is_idporten_user(user)


def is_administrator(user):
    return is_adfs_user(user) and has_role(user, 'tilskudd_administrator')


def is_saksbehandler(user):
    return is_adfs_user(user) and has_role(user, 'tilskudd_saksbehandler')


def is_godkjenner(user):
    return is_adfs_user(user) and has_role(user, 'tilskudd_godkjenner')


def has_role(user, name):
    return name in (role['name'] for role in user.get('roles', []))


def get_user_id_from_cookies(cookies):
    if 'auth_token' not in cookies:
        return None
    return unsign_auth_token(cookies['auth_token'])


def get_user_from_auth():
    return current_user.to_dict()

def they_can_get_page_soknader(user, they):
    if is_soker(user):
        they.can(GET, 'page_soknader')
    elif is_saksbehandler(user):
        they.can(GET, 'page_soknader')
    elif is_godkjenner(user):
        they.can(GET, 'page_soknader')


def they_can_get_page_soknad(user, they):
    if is_soker(user):
        they.can(GET, 'page_soknad')
    elif is_saksbehandler(user):
        they.can(GET, 'page_soknad')
    elif is_godkjenner(user):
        they.can(GET, 'page_soknad')


def they_can_get_page_soknad_edit(user, they):
    if is_soker(user):
        they.can(GET, 'page_soknad_edit')


def they_can_get_page_rapport_edit(user, they):
    if is_soker(user):
        they.can(GET, 'page_rapport_edit')


def they_can_get_page_profil(user, they):
    if is_soker(user):
        they.can(GET, 'page_profil')


def they_can_get_page_organisasjon(user, they):
    if is_soker(user):
        they.can(GET, 'page_organisasjon')


def they_can_get_page_admin(user, they):
    if is_administrator(user):
        they.can(GET, 'page_admin')


def they_can_get_page_tilskuddsordning(user, they):
    if is_administrator(user):
        they.can(GET, 'page_tilskuddsordning')


def they_can_get_page_standardtekst(user, they):
    if is_administrator(user):
        they.can(GET, 'page_standardtekst')


def define_authorization(user, they):
    they_can_get_page_soknader(user, they)
    they_can_get_page_soknad(user, they)
    they_can_get_page_soknad_edit(user, they)

    they_can_get_page_rapport_edit(user, they)

    they_can_get_page_profil(user, they)
    they_can_get_page_organisasjon(user, they)

    they_can_get_page_admin(user, they)
    they_can_get_page_tilskuddsordning(user, they)
    they_can_get_page_standardtekst(user, they)


def create_bouncer(app):
    bouncer = Bouncer(app, ensure_authorization=False)
    bouncer.get_current_user = get_user_from_auth
    bouncer._authorization_method = define_authorization
    return bouncer