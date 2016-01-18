# -*- coding: utf-8 -*-
from collections import OrderedDict

from bouncer.constants import GET
from flask.ext.bouncer import requires
from flask.ext.restful.reqparse import RequestParser

from flod_common.outputs.output_csv import output_csv
from flod_common.outputs.output_pdf import output_pdf
from api.soknad_resource import SoknadResource
from api.base_resource import BaseResource
from flod_common.api.external_resource_helper import ExternalResourceHelper
from domain.models import Soknad


def get_fieldname_mapping():
    fieldname_mapping = OrderedDict()
    fieldname_mapping['id'] = 'Saksnummer'
    fieldname_mapping['saksbehandler_name'] = 'Saksbehandler'
    fieldname_mapping['status'] = 'Status på søknad'
    fieldname_mapping['organisation_name'] = 'Organisasjonsnavn'
    fieldname_mapping['person_name'] = 'Kontaktperson'
    fieldname_mapping['telefon'] = 'Telefon'
    fieldname_mapping['epost'] = 'Epost'
    fieldname_mapping['kontonummer'] = 'Kontonummer'
    fieldname_mapping['prosjektnavn'] = 'Navn på prosjekt/aktivitet'
    fieldname_mapping['om_oss'] = 'Beskrivelse av søker'
    fieldname_mapping['maalsetting'] = 'Hva vi ønsker å oppnå med prosjektet/aktiviteten'
    fieldname_mapping['beskrivelse'] = 'Beskrivelse av prosjektet'
    fieldname_mapping['arrangement_sted'] = 'Arrangement sted'
    fieldname_mapping['arrangement_start_dato'] = 'Arrangement startdato'
    fieldname_mapping['arrangement_slutt_dato'] = 'Arrangement sluttdato'
    fieldname_mapping['arrangement_tidspunkt'] = 'Arrangement tidspunkt'
    fieldname_mapping['merknad'] = 'Merknad på søknad'
    fieldname_mapping['levert_dato'] = 'Dato levert'
    fieldname_mapping['omsokt_belop'] = 'Søknadsbeløp'
    fieldname_mapping['vedtak_innstilt_belop'] = 'Innstilt beløp'
    fieldname_mapping['vedtak_vedtatt_belop'] = 'Vedtatt beløp'
    fieldname_mapping['vedtak_vedtaksdato'] = 'Vedtaksdato'
    fieldname_mapping['vedtak_rapportfrist'] = 'Rapportfrist'
    fieldname_mapping['vedtak_tilskuddsordning_type'] = 'Vedtak tilskuddsordning type'
    fieldname_mapping['okonomipost_navn'] = 'Økonomipost navn'
    fieldname_mapping['okonomipost_okonomibelop_okonomibelop_type'] = 'Økonomipost beløpstype'
    fieldname_mapping['okonomipost_okonomipost_kategori'] = 'Økonomipost kategori'
    fieldname_mapping['okonomipost_okonomipost_type'] = 'Økonomipost type'
    fieldname_mapping['okonomipost_okonomibelop_belop'] = 'Beløp'
    fieldname_mapping['vedlegg_filnavn'] = 'Filnavn vedlegg'
    fieldname_mapping['vedlegg_beskrivelse'] = 'Beskrivelse av vedlegg'
    fieldname_mapping['vedlagtlink_navn'] = 'Vedlagtlink navn'
    fieldname_mapping['vedlagtlink_beskrivelse'] = 'Beskrivelse av vedlagt link'
    fieldname_mapping['vedlagtlink_passord'] = 'Brukernavn/passord på filer publisert andre steder'
    fieldname_mapping['utbetaling_tekst'] = 'Tekst/Fakturanr'
    fieldname_mapping['utbetaling_utbetalingsdato'] = 'Utbetalingsdato'
    fieldname_mapping['klage_levertdato'] = 'Dato for levert klage'
    fieldname_mapping['kommentar'] = 'Kommentar'
    fieldname_mapping['vedtak_behandlet_av_formannskapet'] = 'Klage behandlet av formannskapet'
    fieldname_mapping['vedtak_vedtakstekst'] = 'Merk følgende'
    fieldname_mapping['vedtak_andre_opplysninger'] = 'Andre opplysninger'
    fieldname_mapping['vedtak_intern_merknad'] = 'Vedtak - intern merknad'
    fieldname_mapping['vedtak_endre_rapportfrist_arsak'] = 'Årsak til endret rapportfrist'
    fieldname_mapping['klage_begrunnelse'] = 'Begrunnelse for klage'
    fieldname_mapping['trukket_kommentar'] = 'Begrunnelse for trukket søknad'
    fieldname_mapping['avskrevet_rapportkrav_kommentar'] = 'Årsak til avskrevet rapportkrav'
    fieldname_mapping['utbetaling_utbetalt_belop'] = 'Utbetalt beløp'
    fieldname_mapping['utbetaling_registrertdato'] = 'Dato for registrert utbetaling'
    fieldname_mapping['saksvedlegg_filnavn'] = 'Saksvedlegg filnavn'
    fieldname_mapping['saksvedlegg_beskrivelse'] = 'Saksvedlegg beskrivelse'
    fieldname_mapping['saksvedlegg_vedlagtdato'] = 'Dato for saksvedlegg'
    fieldname_mapping['tilskuddsordning_navn'] = 'Tilskuddsordningens navn'
    fieldname_mapping['tilskuddsordning_soknadsfrist'] = 'Søknadsfrist (tilskuddsordning)'
    fieldname_mapping['tilskuddsordning_budsjett_i_balanse'] = 'Budsjett må gå i balanse'
    fieldname_mapping['tilskuddsordning_rapportfrist'] = 'Rapportfrist'
    fieldname_mapping['tilskuddsordning_innledningstekst'] = 'Innledningstekst for tilskuddsordningen'
    fieldname_mapping['tilskuddsordning_publisert'] = 'Er tilskuddsordningen publisert'
    fieldname_mapping['tilskuddsordning_prosjekttekst'] = 'Tilskuddsordningens prosjekttekst'
    fieldname_mapping['tilskuddsordning_budsjettekst'] = 'Tilskuddsordning budsjettekst'
    fieldname_mapping['tilskuddsordning_type'] = 'Tilskuddsordning type'
    fieldname_mapping['tilskuddsordning_budsjett'] = 'Tilskuddsordning budsjett'
    return fieldname_mapping


def get_fields_to_ignore():
    fields_to_ignore = [
        'klage_vedtak_id',
        'saksvedlegg_id',
        'saksvedlegg_file_ref',
        'okonomipost_id',
        'vedtak_id',
        'vedlagtlink_id',
        'vedlegg_id',
        'person_id',
        'saksbehandler_id',
        'utbetaling_soknad_id',
        'utbetaling_id',
        'rapport_id',
        'organisation_id',
        'klage_id',
        'vedlegg_file_ref',
        'tilskuddsordning_id',
        'okonomipost_okonomibelop_id',
        'arrangement_id',
        'vedtak',
        'rapport',
        'vedlagtlink',
        'vedlegg',
        'arrangement',
        'okonomipost',
        'klage',
        'utbetaling',
        'saksvedlegg'
    ]
    return fields_to_ignore


class ExportSoknaderResource(BaseResource):
    soknad_resource = SoknadResource()

    @requires(GET, Soknad)
    def get(self, soknad_id=None):
        if soknad_id:
            soknad = self.soknad_resource.get(soknad_id)
            ExternalResourceHelper.load_organisation(soknad)
            ExternalResourceHelper.load_persons([soknad])
            ExternalResourceHelper.load_users([soknad])
            return output_pdf(soknad, 200, template=u'pdf/soknad.html')
            # return output_csv(soknad, 200, fieldname_mapping=get_fieldname_mapping(), fields_to_ignore=get_fields_to_ignore())
        else:
            parser = RequestParser()
            parser.add_argument('id', type=int, action='append', required=True)
            args = parser.parse_args()
            soknader = self.soknad_resource.get()
            soknader = [s for s in soknader if s['id'] in args['id']]

            ExternalResourceHelper.load_organisations(soknader)
            ExternalResourceHelper.load_persons(soknader)
            ExternalResourceHelper.load_users(soknader)

            return output_csv(soknader, 200, fieldname_mapping=get_fieldname_mapping(), fields_to_ignore=get_fields_to_ignore())
