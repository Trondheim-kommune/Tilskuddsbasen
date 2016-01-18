# -*- coding: utf-8 -*-
import os
from copy import copy, deepcopy

from flask.ext.script import Manager

from app import app
from domain import models
from database import init_db

manager = Manager(app)
import json


class ModelObjectCache(object):
    def __init__(self):
        self._cache = {}

    def dict(self):
        return self._cache

    def get(self, type, id):
        if type not in self._cache or id not in self._cache[type]:
            return None
        return self._cache[type][id]

    def add(self, type, id, model_to_cache):
        if type not in self._cache:
            self._cache[type] = {}
        self._cache[type][id] = model_to_cache

    def exists(self, type, id):
        if self.get(type, id):
            return True
        return False


class Fixtures(object):
    def __init__(self, fname):
        self._fixtures = json.load(open(fname))
        print "Fixtures for %s fixture types loaded!" % len(self._fixtures)

    def all(self):
        return deepcopy(self._fixtures)

    def get_by_type(self, fixture_type):
        if fixture_type not in self._fixtures:
            raise Exception("No fixtures for type=%s!" % (fixture_type))
        return deepcopy(self._fixtures[fixture_type])

    def get_by_type_and_id(self, fixture_type, fixture_id):
        fixtures = self.get_by_type(fixture_type)
        for f in fixtures:
            if f["id"] == fixture_id:
                return deepcopy(f)
        raise Exception("Fixture with fixture_type=%s and fixture_id=%s does not exist!" % (fixture_type, fixture_id))


class FixturesCommand(object):
    def __init__(self, fname):
        self._cache = ModelObjectCache()
        self._fixtures = Fixtures(fname)
        self._model_mappings = {
            "standardtekst": {"model": models.StandardTekst, "map_model": self.no_map},
            "okonomibelop": {"model": models.OkonomiBelop, "map_model": self.no_map},
            "okonomipost": {"model": models.OkonomiPost, "map_model": self.no_map},
            "soknad": {"model": models.Soknad, "map_model": self.map_soknad},
            "vedlegg": {"model": models.Vedlegg, "map_model": self.map_vedlegg},
            "arrangement": {"model": models.Arrangement, "map_model": self.map_arrangement},
            "vedtak": {"model": models.Vedtak, "map_model": self.no_map},
            "utbetalinger": {"model": models.Utbetaling, "map_model": self.no_map},
            "tilskuddsordning": {"model": models.Tilskuddsordning, "map_model": self.no_map},
            "vedlagtlink": {"model": models.Vedlagtlink, "map_model": self.no_map},
            "tilskuddsordning_saksbehandler": {"model": models.TilskuddsordningSaksbehandler, "map_model": self.no_map},
            # junction tables...
            "soknad_vedlagtlink": {"model": models.SoknadVedlagtlink, "map_model": self.map_soknad_vedlagtlink},
            "soknad_arrangement": {"model": models.SoknadArrangement, "map_model": self.map_soknad_arrangement},
            "soknad_okonomipost": {"model": models.SoknadOkonomipost, "map_model": self.map_soknad_okonomipost},
            "soknad_vedlegg": {"model": models.SoknadVedlegg, "map_model": self.map_soknad_vedlegg},
        }

    def execute(self):
        for type in self._fixtures.all():
            self.create_models_for_type(type, self._fixtures.get_by_type(type))

        return self._cache.dict()

    def create_models_for_type(self, fixture_type, fixtures):
        for fixture in fixtures:
            if "tilskuddsordning_saksbehandler" == fixture_type:
                # this table differs from the others, it looks like a junciton table (no id as PK) but it´s not..
                fixture_id = "%s_%s" %(fixture["tilskuddsordning_id"], fixture["saksbehandler_id"])
                new_model = self.create_model(fixture, fixture_type, fixture_id)
                self._cache.add(fixture_type, fixture_id, new_model)
            elif ("id" in fixture):
                id = fixture.pop("id")
                if not self._cache.exists(fixture_type, id):
                    new_model = self.create_model(fixture, fixture_type, id)
                    self._cache.add(fixture_type, id, new_model)
            else:
                self.create_junction_model(fixture, fixture_type)

    def create_model(self, fixture, fixture_type, fixture_id):
        print "Creating model object for %s (fixture id= %s)..." % (fixture_type, fixture_id)
        return self._model_mappings[fixture_type]["model"](**self._model_mappings[fixture_type]["map_model"](fixture))

    def create_junction_model(self, fixture, fixture_type):
        print "%s is a junction table model, creating referenced models..." % (fixture_type)
        # the fixture is a domain object mapping to a junction table, we have to make sure the
        # references entities exist or add them to the session.
        entities = {}
        for key in fixture:
            # the name of the columns in junction tables are supposed to be respecting the format entitytype_id
            target_entity_type = key.split('_')[0]
            target_entity_id = fixture[key]
            entity = self.create_referenced_entity(target_entity_type, target_entity_id)
            entities[target_entity_type] = entity
        print "The referenced models are added, creating relations for %s..." % (fixture_type)
        self._model_mappings[fixture_type]["map_model"](**entities)

    def create_referenced_entity(self, fixture_type, fixture_id):
        fixture = self._fixtures.get_by_type_and_id(fixture_type, fixture_id)
        # we copy the fixture because we do not want to alter the original fixtures, they are used elsewhere
        fixture_copy = copy(fixture)
        fixture_id = fixture_copy.pop("id")

        if not self._cache.exists(fixture_type, fixture_id):
            new_model = self.create_model(fixture_copy, fixture_type, fixture_id)
            self._cache.add(fixture_type, fixture_id, new_model)

        return self._cache.get(fixture_type, fixture_id)

    def complete_model(self, fixture_type, fixture_id, model):
        entity = self.create_referenced_entity(fixture_type, fixture_id)
        model[fixture_type] = entity

    def no_map(self, model):
        return model

    def map_soknad(self, model):
        if model.get("tilskuddsordning_id") is not None:
            self.complete_model("tilskuddsordning", model.get("tilskuddsordning_id"), model)
        return model

    def map_vedlegg(self, model):
        if model.get("soknad_id") is not None:
            self.complete_model("soknad", model.get("soknad_id"), model)
        return model

    def map_arrangement(self, model):
        if model.get("soknad_id") is not None:
            self.complete_model("soknad", model.get("soknad_id"), model)
        return model

    def map_soknad_arrangement(self, **kwargs):
        soknad = kwargs["soknad"]
        arrangement = kwargs["arrangement"]
        soknad.arrangement.append(arrangement)

    def map_soknad_vedlagtlink(self, **kwargs):
        soknad = kwargs["soknad"]
        vedlagtlink = kwargs["vedlagtlink"]
        soknad.vedlagtlink.append(vedlagtlink)

    def map_soknad_okonomipost(self, **kwargs):
        soknad = kwargs["soknad"]
        okonomipost = kwargs["okonomipost"]
        soknad.okonomipost.append(okonomipost)

    def map_soknad_vedlegg(self, **kwargs):
        soknad = kwargs["soknad"]
        vedlegg = kwargs["vedlegg"]
        soknad.vedlegg.append(vedlegg)

def setup_db():
    app.db_session.remove()
    # app.db_metadata.drop_all(app.db_engine)
    db_url = os.environ.get('SAK_DATABASE_URL', 'sqlite:////tmp/flod_sak.db')
    init_db(db_url)


def install_fixtures_in_file():
    model_types = FixturesCommand('./fixtures.json').execute()
    print "Adding created models to db session..."
    for model_type in model_types:
        for model_id in model_types[model_type]:
            print "Adding type=%s instance=%s..." % (model_type, model_id)
            app.db_session.add(model_types[model_type][model_id])
    print "Committing..."
    app.db_session.commit()


@manager.command
def fixtures():
    """Install test data fixtures into the configured database."""
    print "installing fixtures..."
    setup_db()

    install_fixtures_in_file()

    print "Done!"


if __name__ == "__main__":
    manager.run()
