# -*- coding: utf-8 -*-
from StringIO import StringIO

from bouncer.constants import GET
from flask import current_app, send_file, request
from flask.ext.bouncer import requires

from api.auth import get_organisation
from domain.models import Soknad
from base_resource import BaseResource
from documents.erv.erv_rendrer import create_erv_from_template


class ErvGeneratorResource(BaseResource):
    def generate_file_name(self, soknad, organisation, utbetaling, f_extension):
        soknad_name = "-".join(filter(None,
                                      (soknad.tilskuddsordning.navn,
                                       organisation['name'],
                                       str(soknad.id),))
        )
        return u"ERV-%s-utbetaling-%s.%s" % (soknad_name, utbetaling.id, f_extension)

    def create_docx(self, soknad, organisation, utbetaling):
        mimetype = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        filename = self.generate_file_name(soknad, organisation, utbetaling, "docx")
        rendered_file, size = create_erv_from_template(soknad, organisation, utbetaling)
        return rendered_file, size, mimetype, filename

    @requires(GET, 'ErvFile')
    def get(self, soknad_id):
        soknad = current_app.db_session.query(Soknad).filter(Soknad.id == soknad_id).one()
        utbetaling = soknad.nyeste_utbetaling()
        organisation = get_organisation(soknad.organisation_id, request.cookies)

        rendered_file_contents, size, mimetype, filename = self.create_docx(soknad, organisation, utbetaling)

        rendered_file = StringIO(rendered_file_contents)
        response = send_file(rendered_file,
                             mimetype=mimetype,
                             as_attachment=True,
                             attachment_filename=filename.encode("utf-8"))

        response.headers['Content-Length'] = size
        return response

