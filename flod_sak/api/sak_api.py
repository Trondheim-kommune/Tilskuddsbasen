# -*- coding: utf-8 -*-
import json
import traceback

from flask import current_app, request, Response
from flask.ext.restful import Api


class SakApi(Api):
    def handle_error(self, e):
        code = getattr(e, 'code', 500)
        if code == 413:
            return self.create_error_response_for_iframe(413, 'Filen er for stor!')
        if code >= 500:
            self.log_error(e)
            return self.make_response({'message': self.response_msg(e)}, code)

        return super(SakApi, self).handle_error(e)

    # OBS: the @app.errorhandler is not the right way to configure the custom error handlers
    # when the endpoint is a flask-restful endpoint instead of a standard flask endpoint
    # more about it in flask_restful.__init__.error_router
    #
    # override handle_error instead!

    @classmethod
    def create_error_response_for_iframe(cls, body_status=None, body_error=None):
        # Returning with abort(4xx, myMsg) creates responses which are understood by chrome but in IE it seems that the
        # browser forbids client javascript code from accessing this.contentWindow.document when the return status
        # is anything but a 2xx.
        #
        # Not beeing able to access this.contentWindow.document leads to an error in jquery.iframe-transport.js.
        # We have modified the jquery.iframe-transport.js to recover from this and produce an error anyways
        # (check the file). The problem is that the possible feedback found in the response is not accessible.
        #
        # So to make things behave as we want in IE we return the error as a response 201, and put the real error
        # status and message in the body.
        #
        # Note: the content_type is sat to 'text/html' to prevent IE from asking the user if he wants to save the
        # response (probably thinking a file worth saving is returned).
        current_app.logger.warn("Containing HTTP Response  %s on error: '%s'" % (body_status, body_error))
        return Response(response=json.dumps({'status': body_status, '__error__': body_error}),
                        status=201, content_type='text/html')

    def response_msg(self, e):
        return "An error occurred processing %s %s" \
               % \
               (request.method,
                request.path)

    def log_msg(self, e):
        if request:
            return u"An error occurred processing %s %s\n" \
                   u"Cookies: %s\n" \
                   u"Args: %s\n" \
                   u"Json: %s\n" \
                   u"%s" \
                   % \
                   (request.method,
                    request.path,
                    request.cookies,
                    json.dumps(request.args),
                    request.get_json(),
                    traceback.format_exc().decode('utf-8'))
        else:
            return u"An error occurred outside request context!\n" \
                   u"%s" \
                   % \
                   traceback.format_exc().decode('utf-8')

    def log_error(self, e):
        try:
            current_app.logger.error(self.log_msg(e))
        except:
            current_app.logger.critical("Could not log error!")


from werkzeug.wsgi import LimitedStream


class StreamConsumingMiddleware(object):
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        stream = LimitedStream(environ['wsgi.input'],
                               int(environ.get('CONTENT_LENGTH', 0) or 0))

        environ['wsgi.input'] = stream
        app_iter = self.app(environ, start_response)
        try:
            stream.exhaust()
            for event in app_iter:
                yield event
        finally:
            if hasattr(app_iter, 'close'):
                app_iter.close()
