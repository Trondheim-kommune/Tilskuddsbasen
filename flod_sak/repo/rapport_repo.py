# -*- coding: utf-8 -*-
from sqlalchemy.orm import make_transient
from domain.models import Rapport
from repo.base_repo import BaseRepo
from repo.okonomi_post_repo import OkonomiPostRepo
from repo.soknad_repo import SoknadRepo
from repo.vedlagtlink_repo import VedlagtlinkRepo
from repo.vedlegg_repo import VedleggRepo
from repo.arrangement_repo import ArrangementRepo
from statemachine.soknad_sm import SoknadStateMachine


class RapportRepo(BaseRepo):
    # used by BaseRepo
    model_class = Rapport

    @classmethod
    def map_model(cls, rapport, data):
        cls.update_model(rapport, 'prosjekt_gjennomforing', data)
        cls.update_model(rapport, 'prosjekt_avvik', data)
        cls.update_model(rapport, 'budsjett_avvik', data)
        cls.update_model(rapport, 'resultat_kommentar', data)

        if data.get('arrangement') is not None:
            ArrangementRepo.update_sub_models(data.get('arrangement'), rapport, 'arrangement')

        if data.get('okonomipost') is not None:
            OkonomiPostRepo.update_sub_models(data.get('okonomipost'), rapport, 'okonomipost')

        if data.get('vedlagtlink') is not None:
            VedlagtlinkRepo.update_sub_models(data.get('vedlagtlink'), rapport, 'vedlagtlink')

        if data.get('vedlegg') is not None:
            VedleggRepo.update_sub_models(data.get('vedlegg'), rapport, 'vedlegg')

    @classmethod
    def create(cls, rapport):
        soknad = SoknadRepo.find_by_id(rapport.soknad_id)
        for arrangement in soknad.arrangement:
            make_transient(arrangement)
            rapport.arrangement.append(cls.copy_model_object(arrangement))

        for okonomipost in soknad.okonomipost:
            make_transient(okonomipost)
            rapport.okonomipost.append(cls.copy_model_object(okonomipost))

        rapport = cls.save(rapport)

        soknad.status = SoknadStateMachine.s_rapport_pabegynt.id
        SoknadRepo.save(soknad)

        return rapport