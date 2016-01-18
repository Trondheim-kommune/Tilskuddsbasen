# -*- coding: utf-8 -*-
from flod_tilskudd_portal.utils.types import DateUtils


class Facet(object):
    def __init__(self, type=None, name=None, values=[]):
        assert type
        assert name
        self.type = type
        self.name = name
        self.values = values

    def to_json(self):
        return {"facetType": self.type, "facetName": self.name, "values": [value.to_json() for value in self.values]}


class AnyOfFacet(Facet):
    def __init__(self, name=None, values=[]):
        super(AnyOfFacet, self).__init__(type="anyof", name=name, values=values)


class OneOfFacet(Facet):
    def __init__(self, name=None, values=[]):
        super(OneOfFacet, self).__init__(type="oneof", name=name, values=values)


class FreeFacet(Facet):
    def __init__(self, name=None, values=[]):
        super(FreeFacet, self).__init__(type="free", name=name, values=values)


class FacetValue(object):
    def __init__(self, name=None, value=None):
        assert name
        self.name = name
        self.value = value

    def to_json(self):
        return {"valueName": self.name, "queryValueName": self.value}


def convert_to_array_of_facets(data):
    if not data:
        return []

    facets = []
    for facet in data:
        facets.append(Facet(type=facet["facetType"],
                            name=facet["facetName"],
                            values=[
                                FacetValue(name=value["valueName"],
                                           value=value["queryValueName"])
                                for value in facet["values"]
                            ]
        ))
    return facets


class TimeDelta(object):
    def __init__(self, name, days=None, months=None, years=None):
        self.name = name
        self.days = days
        self.months = months
        self.years = years

    def __eq__(self, other):
        return self.__dict__ == other.__dict__

    def apply(self, datetime):
        computed_datetime = datetime
        if self.days:
            computed_datetime = DateUtils.add_days(computed_datetime, self.days)
        if self.months:
            computed_datetime = DateUtils.add_months(computed_datetime, self.months)
        if self.years:
            computed_datetime = DateUtils.add_years(computed_datetime, self.years)
        return computed_datetime


periods_in_the_past = [
    TimeDelta(u"siste uke", days=-7),
    TimeDelta(u"siste måned", months=-1),
    TimeDelta(u"siste 3 måneder", months=-3),
    TimeDelta(u"siste 5 år", years=-5)
]


def get_names(time_deltas):
    return [x.name for x in time_deltas]


def get_time_delta_by_name(time_deltas, name):
    assert time_deltas
    assert name
    for x in time_deltas:
        if x.name == name:
            return x
