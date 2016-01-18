# -*- coding: utf-8 -*-
from StringIO import StringIO

from bouncer.constants import GET
from flask import current_app, send_file, request
from flask.ext.bouncer import requires
from flask.ext.restful import abort

from api.auth import get_organisation
from documents.brev.vedtaksbrev_rendrer import create_vedtaksbrev_from_template
from domain.models import Soknad
from base_resource import BaseResource


class VedtaksbrevGeneratorResource(BaseResource):
    @classmethod
    def generate_file_name(cls, soknad, organisation, f_extension):
        soknad_name = "-".join(filter(None,
                                      (soknad.tilskuddsordning.navn,
                                       organisation['name'],
                                       str(soknad.id),))
                               )
        return u"vedtaksbrev-%s.%s" % (soknad_name, f_extension)

    @classmethod
    def generate_vedtaksbrev(cls, soknad, vedtak):
        organisation = get_organisation(soknad.organisation_id, request.cookies)

        if vedtak is None:
            abort(404, __error__=[u'Ingen vedtak funnet på søknad!'])

        mimetype = "application/pdf"
        filename = VedtaksbrevGeneratorResource.generate_file_name(soknad, organisation, "pdf")
        rendered_file_content, file_size = create_vedtaksbrev_from_template(soknad, organisation, vedtak)

        return rendered_file_content, file_size, mimetype, filename

    @requires(GET, 'GeneratedVedtaksbrev')
    def get(self, soknad_id):
        soknad = current_app.db_session.query(Soknad).filter(Soknad.id == soknad_id).one()
        vedtak = soknad.nyeste_vedtak()

        rendered_file_content, file_size, mimetype, filename = VedtaksbrevGeneratorResource.generate_vedtaksbrev(soknad,vedtak)

        response = send_file(StringIO(rendered_file_content),
                             mimetype=mimetype,
                             as_attachment=True,
                             attachment_filename=filename.encode("utf-8"))

        response.headers['Content-Length'] = file_size
        return response
