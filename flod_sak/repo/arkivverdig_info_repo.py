# -*- coding: utf-8 -*-
from flask import current_app
from domain.models import Vedlegg, ArkivverdigInfo
from repo.base_repo import BaseRepo
from repo.vedlegg_repo import VedleggRepo


class ArkivverdigInfoRepo(BaseRepo):
    # used by BaseRepo
    model_class = ArkivverdigInfo

    @classmethod
    def find_arkivverdig_info_to_send_to_arkiv(cls, batch_size=100):
        '''
        Henter et antall ArkivverdigInfo klar til å bli sendt
        :return: Et antall ArkivverdigInfo (opp til 'batch_size'). Det er de eldste som hentes først, og kun de som
        har ArkivverdigInfo.sendt_til_arkivet satt til False.
        '''
        return current_app.db_session.query(cls.model_class).filter(
            cls.model_class.sendt_til_arkivet == False).order_by(cls.model_class.opprettet_dato).limit(batch_size)
        all()

    @classmethod
    def mark_as_sent(cls, arkivverdig_info):
        arkivverdig_info.sendt_til_arkivet = True
        current_app.db_session.add(arkivverdig_info)
        current_app.db_session.commit()
