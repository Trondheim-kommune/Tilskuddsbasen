# -*- coding: utf-8 -*-
import json
import traceback

from flask import current_app, request
from flask.ext.restful import Api, output_json

from flod_common.outputs.output_csv import output_csv
from flod_common.outputs.output_pdf import output_pdf


class TilskuddApi(Api):
    def __init__(self, *args, **kwargs):
        super(TilskuddApi, self).__init__(*args, **kwargs)
        self.representations = {
            'text/csv': output_csv,
            'application/pdf': output_pdf,
            'application/json': output_json
        }

    def handle_error(self, e):
        code = getattr(e, 'code', 500)
        self.log_error(e)
        if code == 500:
            return self.make_response({'message': self.response_msg(e)}, 500)
        return super(TilskuddApi, self).handle_error(e)

        # OBS: the @app.errorhandler is not the right way to configure the custom error handlers
        # when the endpoint is a flask-restful endpoint instead of a standard flask endpoint
        # more about it in flask_restful.__init__.error_router
        #
        # override handle_error instead!

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
                   (traceback.format_exc().decode('utf-8'))

    def log_error(self, e):
        try:
            current_app.logger.warn(self.log_msg(e))
        except:
            current_app.logger.critical("Could not log error!")