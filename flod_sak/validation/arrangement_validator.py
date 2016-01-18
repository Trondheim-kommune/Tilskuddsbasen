# -*- coding: utf-8 -*-
from flod_common.validation.base_validator import BaseValidator


class ArrangementValidator(BaseValidator):
    '''
    Validator klasse for Arrangement
    '''

    def validate_put_fields(self):
        self.validate_dates_are_ordered('start_dato', 'slutt_dato', 'Startdato må være før sluttdato')

        return self