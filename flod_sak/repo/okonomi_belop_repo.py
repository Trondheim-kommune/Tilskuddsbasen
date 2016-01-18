# -*- coding: utf-8 -*-
from domain.models import OkonomiBelop
from repo.base_repo import BaseRepo


class OkonomiBelopRepo(BaseRepo):
    # used by BaseRepo
    model_class = OkonomiBelop

    @classmethod
    def map_model(cls, okonomi_belop, data):
        OkonomiBelopRepo.update_model(okonomi_belop, 'belop', data)
        OkonomiBelopRepo.update_model(okonomi_belop, 'okonomibelop_type', data)
