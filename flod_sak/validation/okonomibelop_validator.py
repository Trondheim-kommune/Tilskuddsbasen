# -*- coding: utf-8 -*-
from flod_common.validation.base_validator import BaseValidator


class OkonomibelopValidator(BaseValidator):
    """
    Validator klasse for Okonomibelop
    """

    def validate_put_fields(self):
        self.validate_is_positive_integer('belop', 'Beløp', requires_value=False)

        return self