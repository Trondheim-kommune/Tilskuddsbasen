# -*- coding: utf-8 -*-
import copy


class BaseState(object):
    def __init__(self, id, state_name_soker=None, state_name_saksbehandler=None):
        self.transition_definitions = {}
        self.id = id
        self.state_name_soker = state_name_soker if state_name_soker else id
        self.state_name_saksbehandler = state_name_saksbehandler if state_name_saksbehandler else id

    def __repr__(self):
        return "(id=%s)" % (self.id)

    def add_transition(self, transition, condition=None):
        """
        Adds a transition to this BaseState.

        :param transition:
        :param condition: The condition which needs to be True in order for the transition to appear in get_transitions
        :return:
        """
        self.transition_definitions[transition.id] = {"transition": transition, "condition": condition}

    def has_transition(self, transition):
        if self.transition_definitions.get(transition.id):
            return True
        return False

    def get_transitions(self, *args, **kwargs):
        computed_transition_definitions = copy.copy(self.transition_definitions)
        computed_transitions = {}
        for key in computed_transition_definitions.iterkeys():
            if computed_transition_definitions[key]['condition'] is None or computed_transition_definitions[key]['condition'](*args, **kwargs):
                transition = computed_transition_definitions[key]['transition']
                computed_transitions[transition.id] = transition
        return computed_transitions

class BaseTransition(object):
    def __init__(self, id, name, end_state):
        """
        Creates a transition. Supports dynamic end state computation (end_state can be a callable).

        :param id:
        :param name:
        :param end_state: can be a variable or a callable
        :return:
        """
        self.id = id
        self.name = name
        # should not be accessed directly, use get_end_state instead!
        self.end_state = end_state

    def __repr__(self):
        return "(id=%s)" % (self.id)

    def get_end_state(self, *args, **kwargs):
        if hasattr(self.end_state, '__call__'):
            return self.end_state(*args, **kwargs)
        else:
            return self.end_state

class BaseStateMachine(object):
    def __init__(self):
        self.states = {}

    def validate_state(self, id):
        if not self.states[id]:
            raise "%s: Unknown state %s" % (self.__class__.__name__, id)

    def find_state_by_id(self, id):
        self.validate_state(id)
        return self.states[id]

    def add_state(self, state):
        self.states[state.id] = state
        return self

    def get_transitions(self, id, *args, **kwargs):
        self.validate_state(id)
        return self.states[id].get_transitions(*args, **kwargs)
