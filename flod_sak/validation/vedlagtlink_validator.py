# -*- coding: utf-8 -*-
from flod_common.validation.base_validator import BaseValidator


class VedlagtlinkValidator(BaseValidator):
    '''
    Validator klasse for VedlagtlinkValidator
    '''

    def validate_put_fields(self):
        self.validate_le_max_length('beskrivelse', 60)
        self.validate_le_max_length('passord', 60)

        return self