# -*- coding: utf-8 -*-
from domain.models import OkonomiPost
from repo.base_repo import BaseRepo
from repo.okonomi_belop_repo import OkonomiBelopRepo


class OkonomiPostRepo(BaseRepo):
    # used by BaseRepo
    model_class = OkonomiPost

    @classmethod
    def map_model(cls, okonomi_post, data):
        OkonomiPostRepo.update_model(okonomi_post, 'navn', data)
        OkonomiPostRepo.update_model(okonomi_post, 'okonomipost_type', data)
        OkonomiPostRepo.update_model(okonomi_post, 'okonomipost_kategori', data)

        if data.get('okonomibelop') is not None:
            OkonomiBelopRepo.update_sub_models(data.get('okonomibelop'), okonomi_post, 'okonomibelop')
