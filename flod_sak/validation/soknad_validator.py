# -*- coding: utf-8 -*-
from validation.arrangement_validator import ArrangementValidator
from flod_common.validation.base_validator import BaseValidator
from validation.okonomipost_validator import OkonomipostValidator
from validation.vedlegg_validator import VedleggValidator
from validation.vedlagtlink_validator import VedlagtlinkValidator


class SoknadValidator(BaseValidator):
    """
    Validator klasse for Soknad
    """

    def validate_put_fields(self):
        self.validate_le_max_length('om_oss', 300) \
            .validate_le_max_length('beskrivelse', 800) \
            .validate_le_max_length('kommentar', 700) \
            .validate_le_max_length('prosjektnavn', 60) \
            .validate_le_max_length('maalsetting', 300) \
            .validate_is_norwegian_phone_number('telefon', requires_value=False) \
            .validate_is_norwegian_bank_account_number('kontonummer') \
            .validate_is_email('epost', requires_value=False) \
            .validate_is_positive_integer('omsokt_belop', "Beløp", requires_value=False) \
            .validate_all_sub_values("arrangement", ArrangementValidator) \
            .validate_all_sub_values("okonomipost", OkonomipostValidator) \
            .validate_all_sub_values("vedlegg", VedleggValidator) \
            .validate_all_sub_values("vedlagtlink", VedlagtlinkValidator)

        return self

    def validate_post_fields(self):
        self.validate_is_defined('tilskuddsordning_id')

        return self