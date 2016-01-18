# -*- coding: utf-8 -*-
import copy
import json

from flask import request
from flask.ext.restful import Resource

from flod_tilskudd_portal.utils.facets import convert_to_array_of_facets
from flod_common.api.external_resource_helper import ExternalResourceHelper

class SoknaderResource(Resource):
    type_name = "soknad"

    def get(self):
        return self.fetch_soknader({})

    def post(self):
        filters = request.get_json()
        facets = convert_to_array_of_facets(filters)
        return self.fetch_soknader(facets)

    def fetch_soknader(self, facets):
        url = ExternalResourceHelper.sak_root_uri + '/queries/'

        # "søker" facet can require extra processing if its type is 'free'
        soker_facet = SoknaderResource.find_facet(facets, u'Søker')
        if soker_facet and SoknaderResource.facet_type_equals(soker_facet, 'free'):
            new_values = self.create_correct_query_values(soker_facet)
            if new_values is not None and len(new_values) > 0:
                soker_facet.values = new_values
            else:
                # no organisations have been found if new_values is empty,
                # then the search is not supposed to return anything
                return []

        response = ExternalResourceHelper.post_to_ext(url, {"type": "soknad", "filters": [facet.to_json() for facet in facets]})
        soknader = json.loads(response.content)
        ExternalResourceHelper.load_organisations(soknader)
        ExternalResourceHelper.load_persons(soknader)

        return soknader

    @classmethod
    def find_facet(cls, facets, name):
        for facet in facets:
            if facet.name == name:
                return facet

    @classmethod
    def facet_type_equals(cls, facet, type):
        if facet.type == type:
            return True

    @classmethod
    def find_matching_organisations_and_append_new_values(cls, facet_value):
        new_values = []
        organisations = ExternalResourceHelper.get_organisation_by_name(facet_value.value)
        if len(organisations) > 0:
            for org in organisations:
                new_value = copy.copy(facet_value)
                new_value.value = org['id']
                new_values.append(new_value)
        return new_values

    @classmethod
    def create_correct_query_values(cls, facet):
        new_values = []
        for facet_value in facet.values:
            new_values += cls.find_matching_organisations_and_append_new_values(facet_value)
        return new_values