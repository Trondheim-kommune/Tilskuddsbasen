# -*- coding: utf-8 -*-
from validation.arrangement_validator import ArrangementValidator
from flod_common.validation.base_validator import BaseValidator
from validation.okonomipost_validator import OkonomipostValidator
from validation.vedlegg_validator import VedleggValidator
from validation.vedlagtlink_validator import VedlagtlinkValidator


class RapportValidator(BaseValidator):
    """
    Validator klasse for Soknad
    """

    def validate_put_fields(self):
        self.validate_le_max_length('prosjekt_gjennomforing', 800) \
            .validate_le_max_length('prosjekt_avvik', 300) \
            .validate_le_max_length('budsjett_avvik', 300) \
            .validate_le_max_length('resultat_kommentar', 300) \
            .validate_all_sub_values("arrangement", ArrangementValidator) \
            .validate_all_sub_values("okonomipost", OkonomipostValidator) \
            .validate_all_sub_values("vedlegg", VedleggValidator) \
            .validate_all_sub_values("vedlagtlink", VedlagtlinkValidator)

        return self