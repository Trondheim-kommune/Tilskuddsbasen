# -*- coding: utf-8 -*-
from domain.models import Tilskuddsordning
from repo.base_repo import BaseRepo
from repo.tilskuddsordning_saksbehandlere_repo import TilskuddsordningSaksbehandlereRepo

class TilskuddsordningRepo(BaseRepo):
    # used by BaseRepo
    model_class = Tilskuddsordning

    @classmethod
    def map_model(cls, tilskuddsordning, data):

        TilskuddsordningRepo.update_model(tilskuddsordning, 'navn', data)
        TilskuddsordningRepo.update_model(tilskuddsordning, 'type', data)
        TilskuddsordningRepo.update_model(tilskuddsordning, 'soknadsfrist', data)
        TilskuddsordningRepo.update_model(tilskuddsordning, 'rapportfrist', data)
        TilskuddsordningRepo.update_model(tilskuddsordning, 'budsjett', data)
        TilskuddsordningRepo.update_model(tilskuddsordning, 'budsjett_i_balanse', data)
        TilskuddsordningRepo.update_model(tilskuddsordning, 'innledningstekst', data)
        TilskuddsordningRepo.update_model(tilskuddsordning, 'prosjekttekst', data)
        TilskuddsordningRepo.update_model(tilskuddsordning, 'budsjettekst', data)
        TilskuddsordningRepo.update_model(tilskuddsordning, 'publisert', data)
        TilskuddsordningRepo.update_model(tilskuddsordning, 'godkjenner_id', data)
        TilskuddsordningRepo.update_model(tilskuddsordning, 'godkjenner_tittel', data)
        TilskuddsordningRepo.update_model(tilskuddsordning, 'lenke_til_retningslinjer', data)
        TilskuddsordningRepo.update_model(tilskuddsordning, 'husk_ogsa', data)

        if data.get('saksbehandlere') is not None:
            TilskuddsordningSaksbehandlereRepo.update_sub_models(data.get('saksbehandlere'), tilskuddsordning, 'saksbehandlere')

