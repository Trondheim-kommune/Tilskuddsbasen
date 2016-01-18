#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import json

from flask import request, current_app
import requests

from flod_common.session.utils import make_auth_cookie, ADMIN_USER_ID


class HttpError(Exception):
    pass


class ResourceProxy(object):
    def post(self, url, data, headers=None, auth_token_username=None, catch_errors=True):
        if not headers:
            headers = {'content-type': 'application/json'}
        auth_token_cookies = make_auth_cookie(auth_token_username)
        response = requests.post(
            url=url,
            data=json.dumps(data),
            cookies=dict(request.cookies.items() + auth_token_cookies.items()),
            headers=headers
        )
        if response.status_code / 100 != 2 and catch_errors:
            raise HttpError(response.status_code, response.content)
        return response

    def put(self, url, data, headers=None, auth_token_username=None, catch_errors=True):
        if not headers:
            headers = {'content-type': 'application/json'}
        auth_token_cookies = make_auth_cookie(auth_token_username)
        response = requests.put(
            url=url,
            data=json.dumps(data),
            cookies=dict(request.cookies.items() + auth_token_cookies.items()),
            headers=headers
        )
        if response.status_code / 100 != 2 and catch_errors:
            raise HttpError(response.status_code, response.content)
        return response

    def get(self, url, query_string=None, auth_token_username=None, catch_errors=True):
        if query_string:
            url = url + "?" + query_string

        auth_token_cookies = make_auth_cookie(auth_token_username)
        response = requests.get(
            url=url,
            cookies=dict(request.cookies.items() + auth_token_cookies.items())
        )
        if response.status_code / 100 != 2 and catch_errors:
            raise HttpError(response.status_code, response.content)
        return response


class UserServiceProxy(ResourceProxy):
    service_base_url = os.environ.get('USERS_URL', 'http://localhost:4000')
    service_version = os.environ.get('USERS_VERSION', 'v1')
    users_uri = '%s/api/%s/users' % (service_base_url, service_version)

    def get_user(self, user_id, auth_token_username=None):
        response = self.get(
            '%s/%s' % (self.users_uri, user_id),
            auth_token_username=auth_token_username
        )
        try:
            return json.loads(response.content)
        except:
            return None

    def create_or_update_user(self, private_id, authentication_type):
        return json.loads(
            self.post(
                '%s/' % self.users_uri,
                {'private_id': private_id, 'authentication_type': authentication_type},
                auth_token_username=ADMIN_USER_ID
            ).content
        )

    def update_user(self, user_id, data):
        return json.loads(
            self.post(
                '%s/%s' % (self.users_uri, user_id),
                data,
                auth_token_username=ADMIN_USER_ID
            ).content
        )

    def update_user_profile(self, user_id, dict, auth_token_username=None):
        return json.loads(
            self.post(
                '%s/%s/profile' % (self.users_uri, user_id),
                dict,
                auth_token_username=auth_token_username
            ).content
        )

    def update_user_roles(self, user_id, roles):
        """
        :param user_id:
        :param roles:
        :return:
        """
        return json.loads(
            self.post(
                '%s/%s/roles' % (self.users_uri, user_id),
                roles,
                auth_token_username=ADMIN_USER_ID
            ).content
        )


class OrganisationsServiceProxy(ResourceProxy):
    service_base_url = os.environ.get('ORGANISATIONS_URL', 'http://localhost:1338')
    service_version = os.environ.get('ORGANISATIONS_VERSION', 'v1')
    persons_uri = '%s/api/%s/persons' % (service_base_url, service_version)
    organisations_uri = '%s/api/%s/organisations' % (service_base_url, service_version)

    def get_person(self, person_id, auth_token_username=None):
        response = \
            self.get('%s/%s' % (self.persons_uri, person_id),
                     auth_token_username=auth_token_username
                     )
        try:
            return json.loads(response.content)
        except:
            return None

    def get_organisation(self, organisation_id, auth_token_username=None):
        response = \
            self.get('%s/%s' % (self.organisations_uri, organisation_id),
                     auth_token_username=auth_token_username
                     )
        try:
            return json.loads(response.content)
        except:
            return None

    def get_person_by_national_id_number(self, national_id_number, auth_token_username=None):
        response = self.get(
            '%s/' % self.persons_uri,
            'national_identity_number=%s' % national_id_number,
            auth_token_username=ADMIN_USER_ID
        )
        try:
            person_data = json.loads(response.content)
            return person_data
        except:
            return None

    def create_person(self, national_id_number, auth_token_username=None):
        return json.loads(
            self.post(
                '%s/' % self.persons_uri,
                {"national_identity_number": national_id_number},
                auth_token_username=ADMIN_USER_ID
            ).content
        )


class SakServiceProxy(ResourceProxy):
    service_base_url = os.environ.get('SAK_URL', 'http://localhost:1338')
    service_version = os.environ.get('SAK_VERSION', 'v1')
    root_uri = '%s/api/%s' % (service_base_url, service_version)
    soknader_uri = '%s/soknader' % (root_uri)
    filters_soknader_uri = '%s/filters/soknader' % (root_uri)
    queries_uri = '%s/queries' % (root_uri)

    def get_filters_soknader(self, auth_token_username=None):
        response = \
            self.get('%s' % (self.filters_soknader_uri),
                     auth_token_username=auth_token_username
                     )
        try:
            return json.loads(response.content)
        except:
            return None


user_service_proxy = UserServiceProxy()
organisations_service_proxy = OrganisationsServiceProxy()
sak_service_proxy = SakServiceProxy()
