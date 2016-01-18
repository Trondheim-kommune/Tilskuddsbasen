# -*- coding: utf-8 -*-
from collections import OrderedDict

from bouncer.constants import GET
from flask.ext.bouncer import requires

from flod_common.outputs.output_pdf import output_pdf
from api.rapport_resource import RapportResource
from api.soknad_resource import SoknadResource
from api.base_resource import BaseResource
from domain.models import Rapport


def get_fieldname_mapping():
    fieldname_mapping = OrderedDict()
    fieldname_mapping['soknad_id'] = 'Saksnummer'
    fieldname_mapping['prosjekt_gjennomforing'] = 'Ble prosjektet eller aktiviteten gjennomført i henhold til søknaden?'
    fieldname_mapping['prosjekt_avvik'] = 'Avvik i forhold til søknaden?'
    fieldname_mapping['budsjett_avvik'] = 'Kommentar hvis avvik mellom busjett og regnskap'
    fieldname_mapping['resultat_kommentar'] = 'Hva gjøres med over-/underskudd?'
    fieldname_mapping['arrangement_sted'] = 'Arrangement sted'
    fieldname_mapping['arrangement_start_dato'] = 'Arrangement startdato'
    fieldname_mapping['arrangement_slutt_dato'] = 'Arrangement sluttdato'
    fieldname_mapping['arrangement_tidspunkt'] = 'Arrangement tidspunkt'
    fieldname_mapping['okonomipost_navn'] = 'Økonomipost navn'
    fieldname_mapping['okonomipost_okonomipost_kategori'] = 'Økonomipost kategori'
    fieldname_mapping['okonomipost_okonomipost_type'] = 'Økonomipost type'
    fieldname_mapping['okonomipost_okonomibelop_okonomibelop_type'] = 'Økonomipost beløpstype'
    fieldname_mapping['okonomipost_okonomibelop_belop'] = 'Beløp'
    fieldname_mapping['endre_rapportfrist_arsak'] = 'Årsak til ny rapportfrist'
    fieldname_mapping['saksbehandler_kommentar'] = 'Saksbehandlers kommentar'
    return fieldname_mapping


def get_fields_to_ignore():
    fields_to_ignore = [
        'okonomipost_id',
        'id',
        'okonomipost_okonomibelop_id',
        'arrangement_id',
        'vedtak',
        'rapport',
        'vedlagtlink',
        'vedlegg',
        'arrangement',
        'okonomipost',
        'klage',
        'utbetaling'
    ]
    return fields_to_ignore


class ExportRapporterResource(BaseResource):
    rapport_resource = RapportResource()
    soknad_resource = SoknadResource()

    @requires(GET, Rapport)
    def get(self, soknad_id=None, rapport_id=None):
        if soknad_id and rapport_id:
            rapport = self.rapport_resource.get(soknad_id, rapport_id)

            # add soknad to be able to get vedtak and omsokt_belop
            soknad = self.soknad_resource.get(soknad_id)
            rapport.update({'soknad': soknad})
            return output_pdf(rapport, 200, template=u'pdf/rapport.html')
            # return output_csv(rapport, 200, fieldname_mapping=get_fieldname_mapping(), fields_to_ignore=get_fields_to_ignore())
