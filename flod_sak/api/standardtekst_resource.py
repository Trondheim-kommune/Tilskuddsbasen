# -*- coding: utf-8 -*-
from flask import request
from flask.ext.restful import fields, marshal, abort
from flask.ext.bouncer import requires, GET, POST, PUT, DELETE
from api.fields import standardtekst_fields

from base_resource import BaseResource
from domain.models import StandardTekst
from repo.standardtekst_repo import StandardTekstRepo
from validation.standardtekst_validator import StandardTekstValidator



class StandardTekstResource(BaseResource):
    repo = StandardTekstRepo()
    type_name = "StandardTekst"

    @requires(GET, StandardTekst)
    def get(self, standardtekst_id=None):

        if standardtekst_id:
            standardtekst = self.get_by_id(standardtekst_id)
            return marshal(standardtekst, standardtekst_fields)
        else:
            return marshal(self.repo.find_all(), standardtekst_fields)

    @requires(POST, StandardTekst)
    def post(self):
        data = request.get_json()
        self.validate_post_fields(data)

        standardtekst = StandardTekst()

        self.repo.save(standardtekst, data)
        return marshal(standardtekst, standardtekst_fields), 201

    @staticmethod
    def validate_post_fields(data):
        validator = StandardTekstValidator(data).validate_post_fields()
        if validator.has_errors():
            abort(400, __error__=validator.errors)

    @requires(PUT, StandardTekst)
    def put(self, standardtekst_id):
        data = request.get_json()
        self.validate_put_fields(data)

        standardtekst = self.get_by_id(standardtekst_id)

        self.repo.save(standardtekst, data)
        return marshal(standardtekst, standardtekst_fields)

    @staticmethod
    def validate_put_fields(data):
        validator = StandardTekstValidator(data).validate_put_fields()
        if validator.has_errors():
            abort(400, __error__=validator.errors)

    @requires(DELETE, StandardTekst)
    def delete(self, standardtekst_id):
        standardtekst = self.get_by_id(standardtekst_id)
        self.repo.delete(standardtekst)
        return '', 204