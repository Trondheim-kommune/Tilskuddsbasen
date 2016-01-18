# -*- coding: utf-8 -*-
from domain.models import TilskuddsordningSaksbehandler
from repo.base_repo import BaseRepo


class TilskuddsordningSaksbehandlereRepo(BaseRepo):
    # used by BaseRepo
    model_class = TilskuddsordningSaksbehandler

    @classmethod
    def map_model(cls, tilskuddsordningsaksbehandler_post, data):
        TilskuddsordningSaksbehandlereRepo.update_model(tilskuddsordningsaksbehandler_post, 'saksbehandler_id', data)