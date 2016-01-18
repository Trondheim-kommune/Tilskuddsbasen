#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import re
from logging import StreamHandler
import datetime

from flask import Flask

# NOTE: The import below is required in order to initialize Bouncer() correctly as a flask extension when testing!
from flask import request

from database import init_db
from api import create_api
from api.auth import create_bouncer
from flod_common.logging.http_logger import setup_http_logger, http_request_logger, http_response_logger, http_teardown

from jinja2 import Markup, escape


API_VERSION = "v1"
APP_NAME = "SakAPI"

def create_app(db_url):
    app = Flask(__name__)
    (app.db_session, app.db_metadata, app.db_engine) = init_db(db_url)
    app.debug = os.environ.get('DEBUG') == 'True'
    _paragraph_re = re.compile(r'(?:\r\n|\r|\n){1,}')

    @app.teardown_request
    def shutdown_session(exception=None):
        app.db_session.remove()

    @app.template_filter('strftime')
    def _jinja2_filter_datetime(date, in_format='%Y-%m-%d', out_format='%d-%m-%Y'):
        if date:
            date = datetime.datetime.strptime(date, in_format)
            return date.strftime(out_format)

    @app.template_filter('nl2br')
    def _nl2br(value):
        result = u'\n\n'.join(u'<p>%s</p>' % p.replace('\n', '<br>\n') \
                              for p in _paragraph_re.split(escape(value)))
        result = Markup(result)
        return result

    @app.template_filter('sort_vedtak')
    def _jinja2_filter_sort_vedtak(vedtak):
        if len(vedtak) == 0:
            return []
        else:
            id_sorted = sorted(vedtak, key=id)
            s = sorted(id_sorted,
                       reverse=True,
                       key=lambda v: v.get('vedtaksdato')
                       if v.get('vedtaksdato')
                       else datetime.datetime.now().isoformat())
            return s

    create_api(app, API_VERSION)
    create_bouncer(app)

    # support for remote debugging in Intellij and pycharm
    #
    # Set IDEA_SAK_REMOTE_DEBUG_ON to True in your environment
    # prior to starting the application to get remote debugging.
    #
    # Set IDEA_REMOTE_DEBUG_SERVER to the ip/hostname of the machine running the
    # debug server.
    #
    # Set IDEA_SAK_REMOTE_DEBUG_SERVER to the port of the debug server prosess
    #
    # For the remote debugging to work you will also have to make sure
    # the pycharm-debug.egg is on your path (check your environment file).
    if os.environ.get('IDEA_SAK_REMOTE_DEBUG_ON') == 'True':
        server = os.environ.get('IDEA_REMOTE_DEBUG_SERVER')
        port = os.environ.get('IDEA_SAK_REMOTE_DEBUG_PORT')
        app.logger.info("Idea remote debugging is on! Will connect to debug server running on %s:%s" % (server, port))
        import pydevd
        pydevd.settrace(server, port=int(port), suspend=False, stdoutToServer = True, stderrToServer = True)

    return app


app = create_app(os.environ.get('SAK_DATABASE_URL', 'sqlite:////tmp/flod_sak.db'))

app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024


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


if not app.debug:
    stream_handler = StreamHandler()
    app.logger.addHandler(stream_handler)

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 1337))
    app = create_app(os.environ.get('SAK_DATABASE_URL', 'sqlite:////tmp/flod_sak.db'))
    app.run(host='0.0.0.0', port=port, debug=True)
