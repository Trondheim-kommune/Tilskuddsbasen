# -*- coding: utf-8 -*-
from flod_common.validation.base_validator import BaseValidator


class ArrangementValidator(BaseValidator):
    '''
    Validator klasse for Arrangement
    '''

    def validate_put_fields(self):
        self.validate_dates_are_ordered('start_dato', 'slutt_dato', 'Startdato må være før sluttdato')
        self.validate_date_is_newer_than_year_1900('start_dato', 'Startdato kan ikke være før 1900')
        self.validate_date_is_newer_than_year_1900('slutt_dato', 'Sluttdato kan ikke være før 1900')

        return self