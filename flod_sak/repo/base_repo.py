# -*- coding: utf-8 -*-
from flask import current_app
from sqlalchemy.orm import class_mapper


class BaseRepo(object):
    @classmethod
    def find_by_id(cls, id):
        """
        :param id:
        :return: entiteten hvis funnet, NoResultFound kastes ellers.
        """
        return current_app.db_session.query(cls.model_class).filter(cls.model_class.id == id).one()

    @classmethod
    def find_all(cls):
        """
        Henter alle entitetene, returneres sortert basert på db id.
        :return:
        """
        return current_app.db_session.query(cls.model_class).order_by(cls.model_class.id).all()

    @classmethod
    def find_by_where(cls, where_field, where_value):
        """
        Henter alle entitetene som passer med gitt where clause
        :parameter where_field field det skal sjekkes på
        :parameter where_value value som skal finnes i gitt field
        :return:
        """
        return current_app.db_session.query(cls.model_class).filter(
            getattr(cls.model_class, where_field) == where_value).all()

    @classmethod
    def update_model(cls, model, field_name, data):
        if field_name in data.keys():
            setattr(model, field_name, data.get(field_name) if data.get(field_name) != "" else None)

    @classmethod
    def update_sub_models(cls, data, model, field_name):
        # remove elements not included in data
        liste = list(model.__getattribute__(field_name))
        for element in liste:
            found = False
            for arr in data:
                if arr.get('id') and int(arr.get('id')) == element.id:
                    found = True
            if not found:
                model.__getattribute__(field_name).remove(element)

        # add or update elements from data
        for item in data:
            obj = None
            # update existing element
            if item.get('id'):
                for sa in model.__getattribute__(field_name):
                    if sa.id == int(item.get('id')):
                        obj = sa
            # add new element
            else:
                obj = cls.model_class()
                model.__getattribute__(field_name).append(obj)

            if obj:
                cls.map_model(obj, item)

    @classmethod
    def save(cls, model, data_to_map=None, autocommit=True):
        if data_to_map:
            cls.map_model(model, data_to_map)

        current_app.db_session.add(model)
        if autocommit:
            current_app.db_session.commit()
            current_app.db_session.refresh(model)

        return model

    @classmethod
    def delete(cls, model, autocommit=True):
        current_app.db_session.delete(model)
        if autocommit:
            current_app.db_session.commit()

    @classmethod
    def copy_model_object(cls, model, found=None):
        """
        :param model: model to make a copy of
        :param found: used when function is called recursivly. Found is used to track references if two entities have references to each other both ways, will loop for ever
        :return: a copy of the model object, without primary keys set
        """
        if found is None:
            found = []
        result = model.__class__()
        pk_keys = set([c.key for c in class_mapper(model.__class__).primary_key])

        for p in class_mapper(model.__class__).columns:
            if p.key not in pk_keys:
                result.__setattr__(p.key, model.__getattribute__(p.key))

        for name, relation in class_mapper(model.__class__).relationships.items():
            if relation not in found:
                found.append(relation)
                if relation.uselist:
                    for child in model.__getattribute__(name):
                        result.__getattribute__(name).append(cls.copy_model_object(child, found))
                else:
                    result.__setattr__(name, cls.copy_model_object(model.__getattribute__(name), found))

        return result
