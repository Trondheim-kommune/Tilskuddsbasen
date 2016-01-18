# -*- coding: utf-8 -*-
from functools import wraps

class ApiException(Exception):
    def __init__(self, message, code):
        self.message = message
        self.code = code

    def __str__(self):
        return "Message: %s  Status code: %d" % (self.message, self.code)

