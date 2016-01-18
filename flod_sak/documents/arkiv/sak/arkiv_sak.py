# -*- coding: utf-8 -*-
from datetime import datetime

from flask import current_app
from domain.models import ArkivverdigInfo
from repo.arkivverdig_info_repo import ArkivverdigInfoRepo



def save_sak(soknad):
    metadata = generate_G1006_ny_sak_metadata(soknad)
    arkivverdig_info = ArkivverdigInfo()
    arkivverdig_info.soknad_id = soknad.id
    arkivverdig_info.opprettet_dato = datetime.now()
    arkivverdig_info.type = "ny_sak"
    arkivverdig_info.arkiv_metadata = metadata
    ArkivverdigInfoRepo.save(arkivverdig_info, autocommit=False)


def generate_G1006_ny_sak_metadata(soknad):
    metadata = {
        "EksterntSaksnr": soknad.id,
        "Tittel1": u"Søknad om tilskudd %s" % soknad.tilskuddsordning.navn,
        "OrdningsprinsippKode": u"FE",
        "Ordningsverdi": u"223",
        "Ordningsbeskrivelse": u"Refusjon, tilskudd - ut",
        "Arkivdel": u"EL-SAKARKI",
        "Saksansvarlig": soknad.saksbehandler_id,
        "Tilgangsgruppe": 1
    }
    current_app.logger.debug("Metadata for ny sak generated: '%s'" % metadata)
    return metadata
