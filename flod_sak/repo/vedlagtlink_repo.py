# -*- coding: utf-8 -*-
from domain.models import Vedlagtlink
from repo.base_repo import BaseRepo


class VedlagtlinkRepo(BaseRepo):
    # used by BaseRepo
    model_class = Vedlagtlink

    @classmethod
    def map_model(cls, vedlagtlink_post, data):
        VedlagtlinkRepo.update_model(vedlagtlink_post, 'navn', data)
        VedlagtlinkRepo.update_model(vedlagtlink_post, 'beskrivelse', data)
        VedlagtlinkRepo.update_model(vedlagtlink_post, 'passord', data)

        if data.get('vedlagtlink') is not None:
            VedlagtlinkRepo.update_sub_models(data.get('vedlagtlink'), vedlagtlink_post, 'vedlagtlink')
