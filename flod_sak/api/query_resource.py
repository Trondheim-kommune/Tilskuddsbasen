# -*- coding: utf-8 -*-
from flask import request, current_app
from flask.ext.restful import marshal, abort
from flask.ext.bouncer import requires, GET
from api.fields import soknadliste_fields

from domain.models import Soknad

from repo.soknad_repo import SoknadRepo
from base_resource import BaseResource
from utils.facets import convert_to_array_of_facets
from api.auth import get_user_from_auth, is_soker, is_godkjenner, is_saksbehandler, get_organisations_for_person


class QueryResource(BaseResource):
    repo = SoknadRepo()

    type_name = "soknad"

    @requires(GET, Soknad)
    def post(self):
        query = request.get_json()
        if query["type"] == "soknad":
            facets = convert_to_array_of_facets(query["filters"])
            soknader = self.query_soknader(facets)
            return marshal(soknader, soknadliste_fields()), 201
        abort(400, message='Unknown query type "%s"' % query["type"])

    @staticmethod
    def convert_facet_value_to_list_of_values(facet_values):
        return [facet_value.value for facet_value in facet_values]

    @requires(GET, Soknad)
    def query_soknader(self, facets):
        kwargs = {}

        for facet in facets:
            if facet.name == u"Søker":
                kwargs['sokere'] = self.convert_facet_value_to_list_of_values(facet.values)
            elif facet.name == u"Status":
                kwargs['soknad_states'] = self.convert_facet_value_to_list_of_values(facet.values)
            elif facet.name == u"Tilskuddsordning":
                kwargs['tilskuddsordninger'] = self.convert_facet_value_to_list_of_values(facet.values)
            elif facet.name == u"Saksbehandler":
                kwargs['saksbehandlere'] = self.convert_facet_value_to_list_of_values(facet.values)
            elif facet.name == u"Dato levert":
                kwargs['levert_period_names'] = self.convert_facet_value_to_list_of_values(facet.values)
            else:
                current_app.logger.warn("Ignoring unknown facet: %s" % facet)
        user = get_user_from_auth()
        if is_soker(user):
            # external users can see soknader for all the organisations they are member of
            # and those without any org which they have registered themselves
            organisations = get_organisations_for_person(user["person_id"], request.cookies)
            kwargs['restrict_to_organisations'] = [organisation["id"] for organisation in organisations]
            kwargs['registered_by_person'] = user["person_id"]
            return self.repo.find_soknader(**kwargs)
        elif is_saksbehandler(user) or is_godkjenner(user):
            # saksbehandlere og godkjennere skal ikke se søknadene i status "kladd"
            kwargs['exclude_soknad_states'] = ['Kladd']
            return self.repo.find_soknader(**kwargs)
        else:
            abort(400, message="The following user cannot query soknader: %s" % user)