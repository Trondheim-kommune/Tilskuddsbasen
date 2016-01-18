# -*- coding: utf-8 -*-
from domain.models import StandardTekst
from repo.base_repo import BaseRepo


class StandardTekstRepo(BaseRepo):
    # used by BaseRepo
    model_class = StandardTekst

    @classmethod
    def map_model(cls, standardtekst, data):

        StandardTekstRepo.update_model(standardtekst, 'navn', data)
        StandardTekstRepo.update_model(standardtekst, 'tekst', data)
        StandardTekstRepo.update_model(standardtekst, 'type', data)