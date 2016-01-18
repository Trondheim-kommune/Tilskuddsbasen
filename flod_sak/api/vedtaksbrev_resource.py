# -*- coding: utf-8 -*-
import os

from bouncer.constants import GET
from flask import current_app, send_file, request
from flask.ext.bouncer import requires, ensure
from flask.ext.restful import abort

from api.auth import get_organisation
from documents.documents_utils import get_abs_vedtaksbrev_path
from domain.models import Soknad
from base_resource import BaseResource


class VedtaksbrevResource(BaseResource):
    def generate_file_name(self, soknad, organisation, f_extension):
        soknad_name = "-".join(filter(None,
                                      (soknad.tilskuddsordning.navn,
                                       organisation['name'],
                                       str(soknad.id),))
        )
        return u"vedtaksbrev-%s.%s" % (soknad_name, f_extension)

    @requires(GET, Soknad)
    def get(self, soknad_id):
        soknad = current_app.db_session.query(Soknad).filter(Soknad.id == soknad_id).one()
        ensure(GET, soknad)

        organisation = get_organisation(soknad.organisation_id, request.cookies)
        vedtak = soknad.nyeste_fattet_vedtak()
        if vedtak is None:
            abort(404, __error__=[u'Ingen vedtak funnet på søknad!'])

        filename_on_disk = get_abs_vedtaksbrev_path(soknad, vedtak)
        filename_in_response = self.generate_file_name(soknad, organisation, "pdf")
        file_size = os.path.getsize(filename_on_disk)

        response = send_file(filename_on_disk,
                             mimetype="application/pdf",
                             as_attachment=True,
                             attachment_filename=filename_in_response.encode("utf-8"))

        response.headers['Content-Length'] = file_size
        return response

