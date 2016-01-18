# -*- coding: utf-8 -*-
from repo.standardtekst_repo import StandardTekstRepo
from flod_common.validation.base_validator import BaseValidator


class StandardTekstValidator(BaseValidator):
    '''
    Validator klasse for StandardTekstValidator
    '''
    def validate_unique_stdtekst_navn(self, key_name):
        navn = self.data.get(key_name)

        rapporter = StandardTekstRepo.find_by_where(key_name, navn)

        if len(rapporter) > 0:
            self.errors[key_name] = '%s skal være unikt' % key_name
        return self

    def validate_post_fields(self):
        self.validate_le_max_length('navn', 60)
        self.validate_unique_stdtekst_navn('navn')
        return self

    def validate_put_fields(self):
        self.validate_le_max_length('navn', 60)
        self.validate_le_max_length('tekst', 500)
        return self
