# -*- coding: utf-8 -*-
from flask import request
from flask.ext.restful import abort, marshal
from flask.ext.bouncer import requires, ensure, POST, PUT, GET

from api.query_resource import QueryResource
from api.fields import soknad_fields, soknadliste_fields
from domain.models import Soknad
from repo.soknad_repo import SoknadRepo
from base_resource import BaseResource
from repo.tilskuddsordning_repo import TilskuddsordningRepo
from statemachine.soknad_sm import SoknadStateMachine
from validation.soknad_validator import SoknadValidator
from api.auth import get_user_from_auth


class SoknadResource(BaseResource):
    repo = SoknadRepo()
    query_resource = QueryResource()
    type_name = "soknad"

    @requires(GET, Soknad)
    def get(self, soknad_id=None):

        if soknad_id:
            soknad = self.get_by_id(soknad_id)
            ensure(GET, soknad)

            return marshal(soknad, soknad_fields())
        else:
            soknader = self.query_resource.query_soknader([])
            return marshal(soknader, soknadliste_fields())

    @requires(PUT, Soknad)
    def put(self, soknad_id):
        data = request.get_json()
        self.validate_put_fields(data)
        soknad = self.get_by_id(soknad_id)

        ensure(PUT, soknad)

        self.repo.save(soknad, data)
        return marshal(soknad, soknad_fields())

    @staticmethod
    def validate_put_fields(data):
        validator = SoknadValidator(data).validate_put_fields()
        if validator.has_errors():
            abort(400, __error__=validator.errors)

    @requires(POST, Soknad)
    def post(self):
        data = request.get_json()

        user = get_user_from_auth()

        self.validate_post_fields(data)
        soknad = Soknad()
        soknad.status = SoknadStateMachine.s_kladd.id
        soknad.person_id = user['person_id']

        tilskuddsordning = TilskuddsordningRepo.find_by_id(int(data.get("tilskuddsordning_id")))
        soknad.tilskuddsordning = tilskuddsordning

        ensure(POST, soknad)

        self.repo.save(soknad, data)
        return marshal(soknad, soknad_fields()), 201

    @staticmethod
    def validate_post_fields(data):
        validator = SoknadValidator(data).validate_post_fields()
        if validator.has_errors():
            abort(400, __error__=validator.errors)