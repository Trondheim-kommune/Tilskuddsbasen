import os
from abc import ABCMeta, abstractmethod
from os import environ
from uuid import uuid4

from flask import url_for
from werkzeug.utils import secure_filename


def uuid_with_ext(filename):
    uuid = str(uuid4())
    ext = os.path.splitext(secure_filename(filename))[1]
    return "%s%s" % (uuid, ext)


class Backend(object):
    __metaclass__ = ABCMeta

    @abstractmethod
    def save(self):
        pass

    @abstractmethod
    def delete(self):
        pass

    @abstractmethod
    def get_url(self):
        pass


class FileBackend(Backend):
    name = 'file'

    def __init__(self, file, filename, path):
        self.file = file
        self.filename = filename
        self.upload_path = os.path.join(path, self.filename)

    def save(self):
        if not os.path.isfile(self.upload_path):
            self.file.save(self.upload_path)

    def delete(self):
        if os.path.isfile(self.upload_path):
            os.remove(self.upload_path)

    def get_url(self, route):
        return url_for(route, filename=self.filename)


def get_backend(file, filename, path):
    backend = environ.get('FILE_BACKEND', '').lower()

    return FileBackend(file, filename, path)


def get_backend_for_model(model, path):
    if model.storage_backend == 'file':
        return FileBackend(None, filename=model.filename, path=path)
    return None
