from flask.ext import restful
from flask.ext.restful import fields
from sqlalchemy.orm.exc import NoResultFound

from api.api_exceptions import ApiException


class ISO8601DateTime(fields.Raw):
    def format(self, value):
        return value.isoformat()


def make_error_dict(error_message):
    return {"__error__": [error_message]}


class BaseResource(restful.Resource):
    @staticmethod
    def raiseException(message, status_code):
        raise ApiException(message, status_code)

    @classmethod
    def get_by_id(cls, item_id):
        try:
            return cls.repo.find_by_id(item_id)
        except NoResultFound:
            message = "No %s found with id %d." % (cls.type_name, item_id)
            cls.raiseException(make_error_dict(message), 404)