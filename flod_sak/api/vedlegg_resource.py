# -*- coding: utf-8 -*-
from datetime import datetime
import json

import os
from flask import current_app, Response, request, send_from_directory
from flask.ext.restful import marshal, abort
from flask.ext.bouncer import ensure, PUT, GET
from werkzeug.exceptions import NotFound
from api import SakApi
from api.auth import get_user_from_auth, get_organisation, get_person
from api.fields import vedlegg_fields
from constants.valid_mimetypes import VALID_MIME_TYPES, VALID_EXTENSIONS
from documents.documents_utils import generate_dir_path, get_rel_vedlegg_path
from domain.storage import get_backend, uuid_with_ext
from domain.models import Vedlegg, RapportVedlegg, SoknadVedlegg, Soknad, Rapport
from base_resource import BaseResource
from repo.soknad_repo import SoknadRepo
from repo.rapport_repo import RapportRepo

DOC_PATH = os.environ.get('DOCUMENTS_PATH', '/tmp')


class VedleggResource(BaseResource):
    def get(self, vedlegg_id):

        rapport_vedlegg = current_app.db_session.query(RapportVedlegg).filter(
            RapportVedlegg.vedlegg_id == vedlegg_id).first()
        soknad_vedlegg = current_app.db_session.query(SoknadVedlegg).filter(
            SoknadVedlegg.vedlegg_id == vedlegg_id).first()

        if rapport_vedlegg is not None:
            object = rapport_vedlegg.rapport
            vedlegg = rapport_vedlegg.vedlegg
            soknad_id = object.soknad_id
        elif soknad_vedlegg is not None:
            object = soknad_vedlegg.soknad
            vedlegg = soknad_vedlegg.vedlegg
            soknad_id = object.id
        else:
            abort(404, __error__=['Vedlegg med id %d finnes ikke' % vedlegg_id])

        ensure(GET, object)

        try:
            doc_path = "%s/%s" % (DOC_PATH, get_rel_vedlegg_path(soknad_id))
            return send_from_directory(doc_path,
                                       vedlegg.file_ref,
                                       as_attachment=True,
                                       attachment_filename=vedlegg.filnavn.encode("utf-8"))

        except NotFound:
            abort(500, __error__=['Filen for vedlegg med id %d finnes ikke' % vedlegg_id])

    def post(self):

        rapport_id = request.form.get('rapport_id')
        soknad_id = request.form.get('soknad_id')

        if not (rapport_id is None):
            soknad_or_rapport = RapportRepo.find_by_id(rapport_id)
            soknad_id = soknad_or_rapport.soknad_id
        elif not (soknad_id is None):
            soknad_or_rapport = SoknadRepo.find_by_id(soknad_id)
        else:
            return SakApi.create_error_response_for_iframe(body_status=400, body_error='Missing object id')

        ensure(PUT, soknad_or_rapport)

        file = request.files.get('upload_file')
        if file is None:
            current_app.logger.warn('Missing required file: document')
            return SakApi.create_error_response_for_iframe(body_status=400, body_error=u'Dokument er påkrevd.')

        extension = os.path.splitext(file.filename)[1]

        if file.mimetype not in VALID_MIME_TYPES or extension not in VALID_EXTENSIONS:
            current_app.logger.warn('Invalid mimetype: %s', file.mimetype)
            return SakApi.create_error_response_for_iframe(body_status=400, body_error=u'Ugyldig filtype.')

        filnavn = uuid_with_ext(file.filename)

        target_path = generate_dir_path(DOC_PATH, get_rel_vedlegg_path(soknad_id));

        backend = get_backend(file, filename=filnavn, path=target_path)
        backend.save()

        vedlegg = Vedlegg()

        user = get_user_from_auth()
        vedlegg.filnavn = file.filename
        vedlegg.file_ref = filnavn
        vedlegg.user_id = user['id']
        vedlegg.vedlagtdato = datetime.now()

        soknad_or_rapport.vedlegg.append(vedlegg)

        current_app.db_session.commit()

        return Response(response=json.dumps(marshal(vedlegg, vedlegg_fields)),
                        status=201,
                        content_type='text/html')

