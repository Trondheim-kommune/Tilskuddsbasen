#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os

from flask import Flask
from webassets.loaders import PythonLoader
from flask.ext.assets import Environment, Bundle
from flod_tilskudd_portal.api import create_api

from api.auth import create_bouncer

app = Flask(__name__)
app.debug = os.environ.get('DEBUG') == 'True'
api_version = "v1"

assets = Environment(app)
assets.debug = app.debug
bundles = PythonLoader('assetbundle').load_bundles()
for name, bundle in bundles.iteritems():
    assets.register(name, bundle)

from flod_tilskudd_portal import views, proxy


def check_environment(app):
    if 'AUTH_TOKEN_SECRET' not in os.environ:
        raise EnvironmentError(('Environment variable AUTH_TOKEN_SECRET must '
                                'be set'))


check_environment(app)

create_api(app, api_version)
create_bouncer(app)

# support for remote debugging in Intellij and pycharm
#
# Set IDEA_TILSKUDD_PORTAL_REMOTE_DEBUG_ON to True in your environment
# prior to starting the application to get remote debugging.
#
# Set IDEA_REMOTE_DEBUG_SERVER to the ip/hostname of the machine running the
# debug server.
#
# Set IDEA_TILSKUDD_PORTAL_REMOTE_DEBUG_SERVER to the port of the debug server prosess
#
# For the remote debugging to work you will also have to make sure
# the pycharm-debug.egg is on your path (check your environment file).
if os.environ.get('IDEA_TILSKUDD_PORTAL_REMOTE_DEBUG_ON') == 'True':
    server = os.environ.get('IDEA_REMOTE_DEBUG_SERVER')
    port = os.environ.get('IDEA_TILSKUDD_PORTAL_REMOTE_DEBUG_PORT')
    app.logger.info("Idea remote debugging is on! Will connect to debug server running on %s:%s" % (server, port))
    import pydevd
    pydevd.settrace(server, port=int(port), suspend=False, stdoutToServer=True, stderrToServer=True)
