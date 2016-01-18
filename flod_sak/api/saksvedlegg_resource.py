# -*- coding: utf-8 -*-
import json

import os
from datetime import datetime
from bouncer.constants import MANAGE
from flask import current_app, Response, request, send_from_directory
from flask.ext.restful import marshal, abort
from flask.ext.bouncer import requires, ensure, GET, POST
from werkzeug.exceptions import NotFound
from api import SakApi
from api.auth import get_user_from_auth, get_organisation, get_person
from api.fields import saksvedlegg_fields
from api.soknad_actions import SoknadAction
from documents.arkiv.journalpost.arkiv_journalpost import save_journalpost_for_saksvedlegg, InvalidArkivExtensionError
from documents.documents_utils import generate_dir_path, get_rel_saksvedlegg_path
from domain.storage import get_backend, uuid_with_ext
from domain.models import Vedlegg
from base_resource import BaseResource
from repo.soknad_repo import SoknadRepo
from repo.vedlegg_repo import VedleggRepo
from statemachine.soknad_sm import SoknadStateMachine
from validation.vedlegg_validator import VedleggValidator
from constants.valid_mimetypes import VALID_MIME_TYPES, VALID_EXTENSIONS

DOC_PATH = os.environ.get('DOCUMENTS_PATH', '/tmp')


class SaksvedleggResource(BaseResource):

    @requires(GET, 'Saksvedlegg')
    def get(self, soknad_id, saksvedlegg_id):

        soknad = SoknadRepo.find_by_id(soknad_id)

        ensure(GET, soknad)

        try:
            saksvedlegg = VedleggRepo.find_by_id(saksvedlegg_id)
            doc_path = "%s/%s" %(DOC_PATH, get_rel_saksvedlegg_path(soknad))

            return send_from_directory(doc_path,
                                       saksvedlegg.file_ref,
                                       as_attachment=True,
                                       attachment_filename=saksvedlegg.filnavn.encode("utf-8"))
        except NotFound:
            abort(400, __error__=['Vedlegg med id %d finnes ikke' % saksvedlegg_id])


    @requires(POST, 'Saksvedlegg')
    def post(self, soknad_id):

        if soknad_id is not None:
            soknad = SoknadRepo.find_by_id(soknad_id)
        else:
            return SakApi.create_error_response_for_iframe(body_status=400, body_error='Missing object id')

        ensure(MANAGE, SoknadAction(soknad, SoknadStateMachine.t_last_opp_saksvedlegg))

        validator = VedleggValidator(request.form).validate_post_fields()
        if validator.has_errors():
            return SakApi.create_error_response_for_iframe(body_status=400, body_error=validator.errors)

        file = request.files.get('upload_file')
        if file is None:
            current_app.logger.warn('Missing required file: document')
            return SakApi.create_error_response_for_iframe(body_status=400, body_error=u'Dokument er påkrevd.')

        extension = os.path.splitext(file.filename)[1]

        if file.mimetype not in VALID_MIME_TYPES or extension not in VALID_EXTENSIONS:
            current_app.logger.warn('Invalid mimetype: %s', file.mimetype)
            return SakApi.create_error_response_for_iframe(body_status=400, body_error=u'Ugyldig filtype.')

        filnavn = uuid_with_ext(file.filename)

        target_path = generate_dir_path(DOC_PATH, get_rel_saksvedlegg_path(soknad))

        backend = get_backend(file, filename=filnavn, path=target_path)
        backend.save()

        saksvedlegg = Vedlegg()
        user = get_user_from_auth()

        saksvedlegg.filnavn = file.filename
        saksvedlegg.file_ref = filnavn
        saksvedlegg.beskrivelse = request.form.get('tittel')
        saksvedlegg.user_id = user['id']
        saksvedlegg.vedlagtdato = datetime.now()

        soknad.saksvedlegg.append(saksvedlegg)


        if soknad.saksbehandler_id:
            # Arkivering
            # ###########

            organisation = get_organisation(soknad.organisation_id, request.cookies)
            person = get_person(soknad.person_id, request.cookies)
            try:
                save_journalpost_for_saksvedlegg(soknad, organisation, person, saksvedlegg)
            except InvalidArkivExtensionError as e:
                return SakApi.create_error_response_for_iframe(body_status=400, body_error=e.message)

        current_app.db_session.commit()

        return Response(response=json.dumps(marshal(saksvedlegg, saksvedlegg_fields)), status=201,
                        content_type='text/html')

