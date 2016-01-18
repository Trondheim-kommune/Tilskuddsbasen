# -*- coding: utf-8 -*-

from flask import request
from flask.ext.restful import marshal, abort
from flask.ext.bouncer import requires, ensure, GET, MANAGE

from api.base_resource import BaseResource
from api.fields import action_fields
from api.soknad_action_strategies import SoknadActionExecutor
from api.soknad_actions import SoknadAction
from repo.soknad_repo import SoknadRepo
from statemachine.soknad_sm import SoknadStateMachine
from domain.models import Soknad
from api.auth import filter_actions, get_user_from_auth


class SoknadActionResource(BaseResource):
    @requires(GET, Soknad)
    def get(self, soknad_id, action_id=None):
        # hent søknad
        soknad = SoknadRepo.find_by_id(soknad_id)

        ensure(GET, soknad)

        user = get_user_from_auth()
        # filter transitions
        actions = filter_actions(soknad, user)

        if action_id:
            if action_id in actions:
                return marshal(actions[action_id], action_fields)
            else:
                abort(404, __error__=[u'Fant ingen action med id=%s' % action_id])

        return marshal(actions.values(), action_fields)

    @requires(MANAGE, SoknadAction)
    def put(self, soknad_id=None, action_id=None):
        data = request.get_json()
        # hent søknad
        soknad = SoknadRepo.find_by_id(soknad_id)

        # sjekk om angitt action er lovlig transition
        user = get_user_from_auth()

        sm = SoknadStateMachine()
        transitions = sm.get_transitions(soknad.status, user)
        if action_id not in transitions:
            abort(403,  __error__=[u"Aksjon %s ikke tilgjengelig for søknader med status %s" %(action_id, soknad.status)])
        action = transitions[action_id]

        SoknadActionExecutor.execute(soknad, action, data)

        return None, 200