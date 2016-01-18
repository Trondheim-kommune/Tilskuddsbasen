# -*- coding: utf-8 -*-
from flod_common.validation.base_validator import BaseValidator
from validation.okonomibelop_validator import OkonomibelopValidator


class OkonomipostValidator(BaseValidator):
    """
    Validator klasse for Okonomipost
    """

    def validate_put_fields(self):
        self.validate_le_max_length('navn', 60) \
            .validate_all_sub_values("okonomibelop", OkonomibelopValidator)

        return self