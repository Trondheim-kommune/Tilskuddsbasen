# -*- coding: utf-8 -*-
from flod_common.validation.base_validator import BaseValidator


class TilskuddsordningValidator(BaseValidator):
    '''
    Validator klasse for TilskuddsordningValidator
    '''

    def validate_put_fields(self):
        self.validate_le_max_length('navn', 60)
        self.validate_le_max_length('innledningstekst', 600)
        self.validate_le_max_length('prosjekttekst', 600)
        self.validate_le_max_length('budsjettekst', 600)
        self.validate_le_max_length('husk_ogsa', 1000)
        self.validate_is_positive_integer('budsjett', requires_value=False)
        self.validate_max_value('budsjett', 1000000000)
        self.validate_le_max_length('lenke_til_retningslinjer', 100)
        return self

    def validate_post_fields(self):
        self.validate_le_max_length('navn', 60)

        return self
