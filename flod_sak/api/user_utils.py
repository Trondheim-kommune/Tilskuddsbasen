# -*- coding: utf-8 -*-


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


def is_superuser(user):
    return user.get('is_superuser', None) == True

def has_role(user, name):
    return name in (role['name'] for role in user.get('roles', []))

