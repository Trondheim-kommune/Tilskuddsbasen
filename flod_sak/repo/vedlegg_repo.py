# -*- coding: utf-8 -*-
from domain.models import Vedlegg
from repo.base_repo import BaseRepo


class VedleggRepo(BaseRepo):
    # used by BaseRepo
    model_class = Vedlegg

    @classmethod
    def map_model(cls, vedlagtlink_post, data):
        VedleggRepo.update_model(vedlagtlink_post, 'beskrivelse', data)

        if data.get('vedlegg') is not None:
            VedleggRepo.update_sub_models(data.get('vedlegg'), vedlagtlink_post, 'vedlegg')