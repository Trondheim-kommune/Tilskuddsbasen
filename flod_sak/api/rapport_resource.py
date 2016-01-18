# -*- coding: utf-8 -*-
from flask import request
from flask.ext.restful import abort, marshal
from flask.ext.bouncer import requires, ensure, POST, PUT, GET

from api.fields import rapport_fields
from base_resource import BaseResource
from domain.models import Rapport
from repo.rapport_repo import RapportRepo
from validation.rapport_validator import RapportValidator


class RapportResource(BaseResource):
    repo = RapportRepo()

    type_name = "rapport"

    @requires(GET, Rapport)
    def get(self, soknad_id=None, rapport_id=None):

        if rapport_id:
            rapport = self.get_by_id(rapport_id)
            if rapport.soknad_id != soknad_id:
                abort(403)

            ensure(GET, rapport)
            return marshal(rapport, rapport_fields)
        else:
            if soknad_id:
                rapporter = self.repo.find_by_where("soknad_id", soknad_id)
                return marshal(rapporter, rapport_fields)

        abort(404)

    @requires(PUT, Rapport)
    def put(self, soknad_id=None, rapport_id=None):
        data = request.get_json()

        rapport = self.get_by_id(rapport_id)
        if rapport.soknad_id != soknad_id:
            abort(403)

        ensure(PUT, rapport)

        self.validate_put_fields(data)
        rapport = self.repo.save(rapport, data)
        return marshal(rapport, rapport_fields)

    @staticmethod
    def validate_put_fields(data):
        validator = RapportValidator(data).validate_put_fields()
        if validator.has_errors():
            abort(400, __error__=validator.errors)

    @requires(POST, Rapport)
    def post(self, soknad_id):

        rapport = Rapport()
        rapport.soknad_id = soknad_id
        ensure(POST, rapport)

        rapport = self.repo.create(rapport)

        return marshal(rapport, rapport_fields), 201