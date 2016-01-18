#!/usr/bin/env python
# -*- coding: utf-8 -*-
from flask import request
from flask.ext.restful import fields, marshal, abort
from flask.ext.bouncer import requires, GET, POST, PUT, ensure
from api.auth import is_soker, get_user_from_auth, is_saksbehandler, is_godkjenner, is_administrator

from api.fields import tilskuddsordning_fields
from base_resource import BaseResource
from domain.models import Tilskuddsordning
from repo.soknad_repo import SoknadRepo
from repo.tilskuddsordning_repo import TilskuddsordningRepo
from statemachine.soknad_sm import SoknadStateMachine
from validation.tilskuddsordning_validator import TilskuddsordningValidator


class TilskuddsordningResource(BaseResource):
    repo = TilskuddsordningRepo()
    type_name = "tilskuddsordning"

    @staticmethod
    def get_vedtatt_belop(tilskuddsordning_id):
        soknad_repo = SoknadRepo()
        sm = SoknadStateMachine()
        soknader = soknad_repo.find_soknader(tilskuddsordninger=[tilskuddsordning_id],
                                             exclude_soknad_states=[sm.s_kladd.id,
                                                                    sm.s_trukket.id,
                                                                    sm.s_apnet_for_redigering.id,
                                                                    sm.s_under_behandling.id,
                                                                    sm.s_innsendt.id,
                                                                    sm.s_tilbakebetaling_kreves.id])
        vedtatt_belop = sum(soknad.nyeste_fattet_vedtak().vedtatt_belop for soknad in soknader if soknad.nyeste_fattet_vedtak())
        return vedtatt_belop

    @requires(GET, Tilskuddsordning)
    def get(self, tilskuddsordning_id=None):
        user = get_user_from_auth()
        if tilskuddsordning_id:
            tilskuddsordning = self.get_by_id(tilskuddsordning_id)
            ensure(GET, tilskuddsordning)
            marshalled = marshal(tilskuddsordning, tilskuddsordning_fields)
            if is_administrator(user) or is_saksbehandler(user) or is_godkjenner(user):
                marshalled['vedtatt_belop'] = self.get_vedtatt_belop(tilskuddsordning_id)
            return marshalled
        else:
            if is_soker(user):
                return marshal(self.repo.find_by_where("publisert", True), tilskuddsordning_fields)
            else:
                return marshal(self.repo.find_all(), tilskuddsordning_fields)

    @requires(POST, Tilskuddsordning)
    def post(self):
        data = request.get_json()
        self.validate_post_fields(data)

        tilskuddsordning = Tilskuddsordning()

        self.repo.save(tilskuddsordning, data)
        return marshal(tilskuddsordning, tilskuddsordning_fields), 201

    @staticmethod
    def validate_post_fields(data):
        validator = TilskuddsordningValidator(data).validate_post_fields()
        if validator.has_errors():
            abort(400, __error__=validator.errors)

    @requires(PUT, Tilskuddsordning)
    def put(self, tilskuddsordning_id):
        data = request.get_json()
        self.validate_put_fields(data)

        tilskuddsordning = self.get_by_id(tilskuddsordning_id)

        self.repo.save(tilskuddsordning, data)
        return marshal(tilskuddsordning, tilskuddsordning_fields)

    @staticmethod
    def validate_put_fields(data):
        validator = TilskuddsordningValidator(data).validate_put_fields()
        if validator.has_errors():
            abort(400, __error__=validator.errors)
