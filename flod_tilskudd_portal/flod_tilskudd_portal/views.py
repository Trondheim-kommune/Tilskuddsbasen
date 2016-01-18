# !/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import ConfigParser

from flask import (render_template, abort, request, redirect, make_response)
from flask.ext.bouncer import requires, GET

from flask.ext.login import login_user, logout_user, login_required, current_user

from idporten.saml import AuthRequest, LogoutRequest, Response as IdpResponse, LogoutResponse
from adfs.saml import AuthRequest as ADFSAuthRequest, Response as ADFSResponse
import adfs_helper
from flod_common.session.cookie_helper import set_redirect_target_cookie, get_redirect_target_from_cookie, invalidate_redirect_target_cookie, set_cookie, set_auth_type_cookie, \
    get_auth_type_from_cookie

from flod_tilskudd_portal import app
import authentication
from flod_common.session.utils import make_auth_token
from flod_common.logging.http_logger import setup_http_logger, http_request_logger, http_response_logger, http_teardown

APP_NAME = "Tilskuddsbasen"
AKTOR_URL = os.environ.get('AKTOR_URL', 'https://aktor.trondheim.kommune.no')

@app.errorhandler(401)
def not_authorized_handler(e):
    return 'Ingen tilgang til siden', 401


def page_links():
    over = []
    if current_user.is_soker():
        over = [
            {
                "title": u"Mine søknader",
                "path": "/soknader"
            },
            {
                "title": u"Min profil",
                "path": "/profil"
            }
        ]

    if current_user.is_saksbehandler() or current_user.is_godkjenner():
        over.append({
            "title": u"Min arbeidsliste",
            "path": "/soknader"
        })

    if current_user.is_administrator():
        over.append({
            "title": u"Admin",
            "path": "/admin"
        })

    links = {
        "over": over,
        "under": []
    }

    return links


DEBUG = os.environ.get('DEBUG') == 'True'
DEBUG_PASSWORD = os.environ.get('DEBUG_PASSWORD')

# specifically mock idporten and adfs if set. remove from prod?
MOCK_IDPORTEN = os.environ.get('MOCK_IDPORTEN') == 'True'
MOCK_ADFS = os.environ.get('MOCK_ADFS') == 'True'


def read_config(config_file, config_path="."):
    config = ConfigParser.RawConfigParser()
    config_path = os.path.expanduser(config_file)
    config_path = os.path.abspath(config_path)
    with open(config_path) as f:
        config.readfp(f)
    return config


@app.before_first_request
def setup_logger():
    setup_http_logger(app, os.environ.get('HTTP_LOGGING_CONFIG_FILE'))


@app.before_request
def log_request():
    http_request_logger(app, APP_NAME, request)


@app.after_request
def log_response(response=None):
    http_response_logger(app, APP_NAME, request, response)
    return response


@app.teardown_request
def log_teardown(arg=None):
    http_teardown(app, APP_NAME, arg)


@app.before_first_request
def configure_idporten():
    # skip config if mocking
    if MOCK_IDPORTEN:
        app.logger.info("Running in test/dev environment with mocked IDPorten. Skip IDPorten configuration.")
        return

    app.idporten_config = read_config(os.environ['FLOD_SAML_CONFIG'])

    # IDporten settings
    app.idporten_settings = {
        'assertion_consumer_service_url': app.idporten_config.get('saml', 'assertion_consumer_service_url'),
        'issuer': app.idporten_config.get('saml', 'issuer'),
        'name_identifier_format': app.idporten_config.get('saml', 'name_identifier_format'),
        'idp_sso_target_url': app.idporten_config.get('saml', 'idp_sso_target_url'),
        'idp_cert_file': app.idporten_config.get('saml', 'idp_cert_file'),
        'private_key_file': app.idporten_config.get('saml', 'private_key_file'),
        'logout_target_url': app.idporten_config.get('saml', 'logout_target_url'),
    }


@app.before_first_request
def configure_adfs():
    # Skip config if mocking
    if MOCK_ADFS:
        app.logger.info('Running in test/dev environment with mocked ADFS. Skip ADFS configuration.')
        return

    app.adfs_config = read_config(os.environ['FLOD_ADFS_CONFIG'])
    app.adfs_settings = {
        'assertion_consumer_service_url': app.adfs_config.get('saml', 'assertion_consumer_service_url'),
        'issuer': app.adfs_config.get('saml', 'issuer'),
        'name_identifier_format': app.adfs_config.get('saml', 'name_identifier_format'),
        'idp_sso_target_url': app.adfs_config.get('saml', 'idp_sso_target_url'),
        'idp_cert_file': app.adfs_config.get('saml', 'idp_cert_file'),
        'sp_private_key': app.adfs_config.get('saml', 'secret_key'),
        'logout_target_url': app.adfs_config.get('saml', 'logout_target_url'),
    }

    # idp_cert_file has priority over idp_cert_fingerprint
    cert_file = app.adfs_settings.pop('idp_cert_file', None)
    if cert_file:
        cert_path = os.path.expanduser(cert_file)
        cert_path = os.path.abspath(cert_path)

        with open(cert_path) as f:
            app.adfs_settings['idp_cert_fingerprint'] = f.read()


def get_attribute_or_404(saml_response, attribute):
    values = saml_response.get_assertion_attribute_value(attribute)
    if len(values) == 0:
        app.logger.error('Could not find attribute in SAML response: %s',
                         attribute)
        abort(404)
    return values[0]


@app.route('/login', methods=['GET', 'POST'])
def login():
    auth_type = get_auth_type_from_cookie(request)

    if auth_type == 'active_directory':
        response = redirect('/admin/login')
    else:
        response = make_response(render_template('login.html', app_name=APP_NAME))

    # Save the location of the page the user is trying to reach in a cookie.
    # This makes it possible to redirect correctly when user comes back
    # from id-porten/adfs.
    set_redirect_target_cookie(response)

    return response


@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    # Skip ADFS login in when mocking
    if MOCK_ADFS:
        return login_adfs_mock()

    # Default to ADFS login
    url = ADFSAuthRequest.create(**app.adfs_settings)
    return redirect(url)


@app.route('/adfs/ls/', methods=['POST'])
def logged_in_from_adfs():
    app.logger.info('User logged in via ADFS')
    SAMLResponse = request.values['SAMLResponse']

    try:
        res = ADFSResponse(SAMLResponse, app.adfs_settings["idp_cert_fingerprint"])

        res.decrypt(app.adfs_settings["sp_private_key"])
        valid = res.is_valid()

        if not valid:
            app.logger.error('Invalid response from ADFS')
            abort(404)

        def to_unicode(in_str):
            return in_str.encode("utf-8")

        name_id = to_unicode(res.name_id)
        ident = get_attribute_or_404(res, "http://schemas.microsoft.com/ws/2008/06/identity/claims/windowsaccountname")
        name = to_unicode(get_attribute_or_404(res, "http://schemas.xmlsoap.org/claims/CommonName"))
        email = to_unicode(
            get_attribute_or_404(res, "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"))

        app.logger.info('Logging in: name_id=%s name=%s ident=%s email=%s', name_id, name, ident, email)
        data = {"misc": {"name": name,
                         "email": email,
                         "ident": ident}}

        claims = adfs_helper.parse_claims(res._document)
        app.logger.info('Claims in SAML response: %s', claims)

        roles = adfs_helper.extract_roles(claims)
        app.logger.info('Requested roles parsed from claims: %s', roles)

        auth_user = authentication.login_adfs_user_by_private_id(ident, data)
        user_roles = authentication.update_user_roles(auth_user.user_id, roles)
        auth_user.roles = user_roles
        app.logger.info('User roles after update: %s', user_roles)

        login_user(auth_user, remember=True)
        # Check if the user wants to redirect to a specific page
        redirect_target = get_redirect_target_from_cookie(request)
        response = make_response(redirect(redirect_target or request.args.get('next') or '/'))
        invalidate_redirect_target_cookie(response)

        set_cookie(response, 'auth_token', make_auth_token(auth_user.user_id))

        # set authentication type cookie
        set_auth_type_cookie(response, "active_directory")

        return response
    except Exception as e:
        app.logger.error('Logging failed: %s', e)
        abort(404, 'Ugyldig innlogging.')


def login_adfs_mock():
    if request.method != 'POST':
        return render_template('admin_login.html', roles=authentication.adfs_roles())

    username = request.form['username']
    password = request.form['password']
    if DEBUG_PASSWORD is None or password != DEBUG_PASSWORD:
        app.logger.error('Running in debug mode, but DEBUG_PASSWORD is not set')
        abort(403)

    auth_user = authentication.login_adfs_user_by_private_id(username, {})

    roles = request.form.getlist('roles')
    user_roles = authentication.update_user_roles(auth_user.user_id, roles)
    auth_user.roles = user_roles

    login_user(auth_user, remember=True)
    # Check if the user wants to redirect to a specific page
    redirect_target = get_redirect_target_from_cookie(request)
    response = make_response(redirect(redirect_target or request.args.get('next') or '/'))
    invalidate_redirect_target_cookie(response)

    set_cookie(response, 'auth_token', make_auth_token(auth_user.user_id))

    # set authentication type cookie
    set_auth_type_cookie(response, "active_directory")

    return response


@app.route('/bruker/login', methods=['GET', 'POST'])
def bruker_login():
    if MOCK_IDPORTEN:
        return login_idporten_mock()

    # Encrypt "authentication" URL with our private key. We redirect to that URL.
    auth_request = AuthRequest(**app.idporten_settings)
    url = auth_request.get_signed_url(app.idporten_settings["private_key_file"])
    app.logger.info("url=%s", url)
    return redirect(url)


@app.route('/idporten/login_from_idp', methods=['POST', 'GET'])
def logged_in():
    # IDPorten redirects to this URL if all ok with login
    app.logger.info("User logged in via ID-porten: request.values=%s",
                    request.values)
    SAMLResponse = request.values['SAMLResponse']

    res = IdpResponse(
        SAMLResponse,
        "TODO: remove signature parameter"
    )

    # Decrypt response from IDPorten with our private key, and make sure that the response is valid
    # (it was encrypted with same key)
    valid = res.is_valid(app.idporten_settings["idp_cert_file"], app.idporten_settings["private_key_file"])
    if valid:
        national_id_number = res.get_decrypted_assertion_attribute_value("uid")[0]
        idporten_parameters = {
            "session_index": res.get_session_index(),
            "name_id": res.name_id
        }

        # Log in user in tilskuddsbasen
        auth_user = authentication.login_idporten_user_by_private_id(national_id_number,
                                                                     idporten_parameters)
        login_user(auth_user, remember=True)

        # Force the user to fill in the profile if unregistered
        if not auth_user.is_registered():
            response = make_response(redirect("/profil"))
        else:
            # Check if the user wants to redirect to a specific page
            redirect_target = get_redirect_target_from_cookie(request)
            response = make_response(redirect(redirect_target or request.args.get('next') or '/'))
            invalidate_redirect_target_cookie(response)

        set_cookie(response, 'auth_token', make_auth_token(auth_user.user_id))

        return response
    else:
        abort(404, 'Ugyldig innlogging.')


def login_idporten_mock():
    if request.method != 'POST':
        return render_template('bruker_login.html')

    ssn = request.form['ssn']
    password = request.form['password']
    if DEBUG_PASSWORD is None or password != DEBUG_PASSWORD:
        app.logger.error('Running in debug mode, incorrect DEBUG_PASSWORD or not set')
        abort(403)

    auth_user = authentication.login_idporten_user_by_private_id(ssn, {})
    login_user(auth_user, remember=True)

    # Force the user to fill in the profile if unregistered
    if not auth_user.is_registered():
        response = make_response(redirect("/profil"))
    else:
        # Check if the user wants to redirect to a specific page
        redirect_target = get_redirect_target_from_cookie(request)
        response = make_response(redirect(redirect_target or request.args.get('next') or '/'))
        invalidate_redirect_target_cookie(response)

    set_cookie(response, 'auth_token', make_auth_token(auth_user.user_id))

    return response


@app.route('/logout')
def logout():
    # Remove the user information from the session
    app.logger.info("Logout requested")

    url = '/'

    if current_user.authentication_type == 'id_porten':

        if MOCK_IDPORTEN:
            logout_user()
            return redirect('/')

        logout_request = LogoutRequest(name_id=current_user.misc["name_id"],
                                       session_index=current_user.misc["session_index"],
                                       **app.idporten_settings)
        app.logger.info("logout_request.raw_xml=%s", logout_request.raw_xml)
        url = logout_request.get_signed_url(app.idporten_settings["private_key_file"])
        app.logger.info("Logging out: url=%s", url)

    elif current_user.authentication_type == 'active_directory':

        if MOCK_ADFS:
            logout_user()
            return redirect('/')

        # Note: We never really log out from adfs, it is SSO in TK and we only want
        # to log out from our system
        logout_user()

        # Redirect to logout path on adfs idp
        url = app.adfs_settings['logout_target_url'] + '?wa=wsignout1.0'
        app.logger.info("Logging out: url=%s", url)

    return redirect(url)


@app.route('/idporten/logout_from_idp')
def handle_idporten_logout_response():
    # If user logs out IN IDporten, then IDporten sends the logout request to us
    # , and we need to continue the logout process the normal way
    if 'SAMLRequest' in request.values:
        return logout()

    # Got response from logout request from IDporten, continue logging out
    saml_response = request.values['SAMLResponse']
    logout_response = LogoutResponse(saml_response)
    if not logout_response.is_success():
        app.logger.info(("Logout from Idporten failed, proceeding with logout"
                         "anyway"))

    logout_user()
    return redirect("/")


def render_tilskudd_template(template, **kwargs):
    pages = kwargs.pop('pages', page_links())

    debug_info = ''
    if DEBUG is True:
        debug_info = "<li>Roller: "
        for role in current_user.roles:
            debug_info += role['name'] + " "
        debug_info += "</li>"

    authentication_type = getattr(current_user, 'authentication_type', '')

    stripped_person = None

    if authentication_type == 'id_porten':
        person = authentication.get_current_person()
        stripped_person = {
            "name": person['name'],
            "uri": "/persons/%d" % person['person_id'],
            "id": person['person_id']
        }
    stripped_user = {
        "id": current_user.user_id
    }
    return render_template(
        template,
        person=stripped_person,
        user=stripped_user,
        pages=pages,
        app_name=APP_NAME,
        debug_info=debug_info,
        aktor_url=AKTOR_URL,
        **kwargs
    )


def get_user_mode():
    if current_user.is_soker():
        return 'tilskudd_soker'
    elif current_user.is_saksbehandler():
        return 'tilskudd_saksbehandler'
    elif current_user.is_godkjenner():
        return 'tilskudd_godkjenner'
    elif current_user.is_administrator():
        return 'tilskudd_admin'
    else:
        # Hvis vi ikke finner passende autentiseringstype el rolle.
        abort(401, 'Ugyldig innlogging.')


@app.route('/')
@login_required
def home():
    if current_user.is_soker():
        return redirect('soknader')
    elif current_user.is_saksbehandler() or current_user.is_godkjenner():
        return redirect('soknader')
    elif current_user.is_administrator():
        return redirect('admin')

    # Hvis vi ikke finner passende autentiseringstype el rolle.
    abort(401, 'Ugyldig innlogging.')


@app.route('/profil/', methods=['GET', 'POST'])
@login_required
@requires(GET, "page_profil")
def profil():
    return render_tilskudd_template(
        'profil/page_profile.html'
    )


@app.route('/soknad/<int:soknad_id>/')
@login_required
@requires(GET, "page_soknad")
def soknad(soknad_id):
    return render_tilskudd_template(
        'soknad/page_soknad.html',
        id=soknad_id,
        user_mode=get_user_mode()
    )


@app.route('/soknad/<int:soknad_id>/edit/')
@login_required
@requires(GET, "page_soknad_edit")
def soknad_edit(soknad_id):
    return render_tilskudd_template(
        'soknad_edit/page_soknad_edit.html',
        id=soknad_id
    )


@app.route('/soknader/')
@login_required
@requires(GET, "page_soknader")
def soknader():
    mode = None

    if current_user.is_soker():
        mode = 'soker'
    elif current_user.is_saksbehandler():
        mode = 'saksbehandler'
    elif current_user.is_godkjenner():
        mode = 'godkjenner'

    return render_tilskudd_template(
        'soknader/page_soknader.html',
        mode=mode
    )


@app.route('/soknad/<int:soknad_id>/rapport/<int:rapport_id>/edit/')
@login_required
@requires(GET, "page_rapport_edit")
def rapport_edit(soknad_id, rapport_id):
    return render_tilskudd_template(
        'rapport_edit/page_rapport_edit.html',
        id=rapport_id,
        soknad_id=soknad_id
    )


@app.route('/admin/')
@login_required
@requires(GET, "page_admin")
def admin():
    return render_tilskudd_template('admin/page_admin.html')


@app.route('/admin/tilskuddsordning/<int:tilskuddsordning_id>/edit/')
@login_required
@requires(GET, "page_tilskuddsordning")
def tilskuddsordning(tilskuddsordning_id):
    return render_tilskudd_template(
        'tilskuddsordning_edit/page_tilskuddsordning_edit.html', id=tilskuddsordning_id
    )


@app.route('/admin/standardtekst/<int:standardtekst_id>/edit/')
@login_required
@requires(GET, "page_standardtekst")
def standardtekst(standardtekst_id):
    return render_tilskudd_template(
        'standardtekst_edit/page_stdtekst_edit.html', id=standardtekst_id
    )