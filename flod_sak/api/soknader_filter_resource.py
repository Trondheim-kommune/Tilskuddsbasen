# -*- coding: utf-8 -*-
from flask import request
from flask.ext.restful import abort
from flask.ext.bouncer import requires, GET

from domain.models import Soknad
from repo.soknad_repo import SoknadRepo
from base_resource import BaseResource
from api.auth import get_user_from_auth, is_soker, get_organisations_for_person, is_godkjenner, is_saksbehandler
from utils.facets import get_names, AnyOfFacet, OneOfFacet, FacetValue, periods_in_the_past, FreeFacet


class SoknaderFilterResource(BaseResource):
    repo = SoknadRepo()

    @requires(GET, Soknad)
    def get(self):
        user = get_user_from_auth()
        if is_saksbehandler(user) or is_godkjenner(user):
            return self.get_saksbehandler_filters()
        elif is_soker(user):
            return self.get_soker_filters(user)
        else:
            abort(403)

    def get_soker_filters(self, user):
        facets = [
            AnyOfFacet(name="Søker",
                       values=self.transfrom_to_facet_values(
                           SoknadRepo.find_organisasjoner_knyttet_til_soknader(
                               restrict_to_organisations=[org['id'] for org in get_organisations_for_person(user['person_id'], request.cookies)],
                               registered_by_person=user['person_id'])
                       )),
            OneOfFacet(name="Dato levert",
                       values=[FacetValue(name=name, value=name) for name in get_names(periods_in_the_past)])
        ]
        return [facet.to_json() for facet in facets]

    @staticmethod
    def transfrom_to_facet_values(list_of_objects, field_name=None):
        facet_values = []
        if None in list_of_objects:
            facet_values.append(FacetValue(name="Ikke satt"))

        if field_name:
            facet_values = facet_values + [FacetValue(name=getattr(obj, field_name), value=getattr(obj, field_name)) for
                                           obj in list_of_objects if obj]
        else:
            facet_values = facet_values + [FacetValue(name=obj, value=obj) for obj in list_of_objects if obj]
        return facet_values

    def get_saksbehandler_filters(self):
        facets = [
            FreeFacet(name="Søker",
                      values=[FacetValue(name="Organisasjonsnavn")]),
            AnyOfFacet(name="Tilskuddsordning",
                       values=[FacetValue(name=tilskuddsordning.navn, value=tilskuddsordning.id) for tilskuddsordning in SoknadRepo.find_tilskuddsordninger_knyttet_til_soknader()]
                       ),
            OneOfFacet(name="Dato levert",
                       values=[FacetValue(name=name, value=name) for name in get_names(periods_in_the_past)]),
            AnyOfFacet(name="Status",
                       values=self.transfrom_to_facet_values(
                           SoknadRepo.find_states_knyttet_til_soknader(exclude_soknad_states=["Kladd"])
                       )),
            AnyOfFacet(name="Saksbehandler",
                       values=self.transfrom_to_facet_values(
                           SoknadRepo.find_saksbehandlere_knyttet_til_soknader()
                       ))
        ]

        return [facet.to_json() for facet in facets]