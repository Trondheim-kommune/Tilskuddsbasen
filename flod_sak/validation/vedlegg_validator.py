# -*- coding: utf-8 -*-
from flod_common.validation.base_validator import BaseValidator


class VedleggValidator(BaseValidator):
    '''
    Validator klasse for Vedlegg
    '''

    def validate_put_fields(self):
        self.validate_le_max_length('beskrivelse', 60)

        return self

    def validate_post_fields(self):
        self.validate_put_fields()

        return self