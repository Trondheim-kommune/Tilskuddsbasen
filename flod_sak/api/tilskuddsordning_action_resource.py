# -*- coding: utf-8 -*-
from flask.ext.restful import abort
from flask.ext.bouncer import requires, POST

from api.auth import get_user_from_auth
from base_resource import BaseResource
from documents.epost.tilskudd_emails import send_notification_email_to_godkjenner_for_tilskuddsordning
from repo.tilskuddsordning_repo import TilskuddsordningRepo


class TilskuddsordningActionResource(BaseResource):
    repo = TilskuddsordningRepo()

    @requires(POST, 'TilskuddsordningAction')
    def post(self, tilskuddsordning_id, action_id):
        tilskuddsordning = self.repo.find_by_id(tilskuddsordning_id)
        if action_id == 'varsle_godkjenner':
            saksbehandler = get_user_from_auth()
            success, msg = send_notification_email_to_godkjenner_for_tilskuddsordning(tilskuddsordning, saksbehandler)
            if success:
                return None, 201
            else:
                abort(400, __error__=[msg])

        abort(400, __error__=[U'Ugyldig parametre tilskuddsordning_id %s og action = %s' % (tilskuddsordning_id, action_id)])