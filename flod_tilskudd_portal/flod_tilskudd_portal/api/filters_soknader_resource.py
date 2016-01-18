# -*- coding: utf-8 -*-
from flask.ext.login import current_user
from flask.ext.restful import Resource

from flod_tilskudd_portal.proxy import sak_service_proxy, organisations_service_proxy, user_service_proxy
from flod_tilskudd_portal.utils.facets import convert_to_array_of_facets


class FiltersSoknaderResource(Resource):
    type_name = "soknad"

    def get(self):
        filters = sak_service_proxy.get_filters_soknader(auth_token_username=current_user.user_id)
        facets = convert_to_array_of_facets(filters)
        self.fetch_organisations(facets)
        self.fetch_users(facets)

        return [facet.to_json() for facet in facets]

    def fetch_organisations(self, facets):
        for facet in facets:
            if facet.name == u"Søker":
                for facet_value in facet.values:
                    if facet_value.value:
                        organisations = organisations_service_proxy.get_organisation(facet_value.value,
                                                                                   auth_token_username=current_user.user_id)
                        facet_value.name = organisations['name']

    def fetch_users(self, facets):
        for facet in facets:
            if facet.name == u"Saksbehandler":
                for facet_value in facet.values:
                    if facet_value.value:
                        user = user_service_proxy.get_user(facet_value.value,
                                                                  auth_token_username=current_user.user_id)
                        facet_value.name= ("%s" % user['profile']['full_name'])
