# -*- coding: utf-8 -*-
from flask.ext.restful import fields

from api.auth import get_user_from_auth, is_soker, is_saksbehandler, is_godkjenner
from api.base_resource import ISO8601DateTime
from statemachine.soknad_sm import SoknadStateMachine


class Status(fields.Raw):
    def __init__(self, default=None, attribute=None, user=None):
        super(Status, self).__init__(default, attribute)
        self.user = user

    def format(self, value):
        sm = SoknadStateMachine()
        state = sm.find_state_by_id(value)
        if is_soker(self.user):
            return state.state_name_soker
        return state.state_name_saksbehandler


class VedtakListe(fields.List):
    def __init__(self, cls_or_instance, user=None, **kwargs):
        super(VedtakListe, self).__init__(cls_or_instance, **kwargs)
        self.user = user

    def output(self, key, data):
        value = super(VedtakListe, self).output(key, data)

        # søkar får berre sjå vedtak med vedtaksdato
        if is_soker(self.user):
            return [item for item in value if item.get('vedtaksdato', None) is not None]
        # saksbehandlar og godkjennar får sjå alle vedtak
        elif is_saksbehandler(self.user) or is_godkjenner(self.user):
            return value
        # andre skal ikkje sjå nokon vedtak

        return None


class RapportListe(fields.List):
    def __init__(self, cls_or_instance, user=None, **kwargs):
        super(RapportListe, self).__init__(cls_or_instance, **kwargs)
        self.user = user

    def output(self, key, data):
        value = super(RapportListe, self).output(key, data)

        # søkar får alltid sjå rapport
        if is_soker(self.user):
            return value
        # saksbehandlar og godkjennar får ikkje sjå rapport når rapport er under arbeid
        elif is_saksbehandler(self.user) or is_godkjenner(self.user):
            return value if data.status is not None and data.status not in [SoknadStateMachine.s_rapport_pabegynt.id, SoknadStateMachine.s_avventer_rapport] else []

        return None


def soknadliste_fields():
    user = get_user_from_auth()
    sf = {
        'id': fields.Integer,
        'person_id': fields.Integer,
        'saksbehandler_id': fields.String,
        'organisation_id': fields.Integer,
        'status': Status(user=user),
        'omsokt_belop': fields.Integer,
        'prosjektnavn': fields.String,
        'levert_dato': fields.String,
        'vedtak': VedtakListe(fields.Nested(vedtak_fields()), user=user),
    }

    return sf


def soknad_fields():
    user = get_user_from_auth()
    sf = {
        'id': fields.Integer,
        'tilskuddsordning': fields.Nested(tilskuddsordning_light_fields),
        'person_id': fields.Integer,
        'saksbehandler_id': fields.String,
        'organisation_id': fields.Integer,
        'status': Status(user=user),
        'omsokt_belop': fields.Integer,
        'epost': fields.String,
        'kontonummer': fields.String,
        'telefon': fields.String,
        'om_oss': fields.String,
        'prosjektnavn': fields.String,
        'beskrivelse': fields.String,
        'maalsetting': fields.String,
        'kommentar': fields.String,
        'trukket_kommentar': fields.String,
        'merknad': fields.String,
        'levert_dato': ISO8601DateTime,
        'vedlegg': fields.List(fields.Nested(vedlegg_fields)),
        'vedlagtlink': fields.List(fields.Nested(vedlagtlink_fields)),
        'arrangement': fields.List(fields.Nested(arrangement_fields)),
        'okonomipost': fields.List(fields.Nested(okonomipost_fields)),
        'rapport': RapportListe(fields.Nested(rapport_soknad_fields), user=user),
        'vedtak': VedtakListe(fields.Nested(vedtak_fields()), user=user),
        'klage': fields.List(fields.Nested(klage_fields)),
        'utbetaling': fields.List(fields.Nested(utbetaling_fields)),
        'avskrevet_rapportkrav_kommentar': fields.String
    }

    if is_saksbehandler(user) or is_godkjenner(user):
        sf["saksvedlegg"] = fields.List(fields.Nested(saksvedlegg_fields))

    return sf


def vedtak_fields():
    user = get_user_from_auth()
    sf = {
        'id': fields.Integer,
        'vedtatt_belop': fields.Integer,
        'vedtaksdato': ISO8601DateTime,
        'vedtakstekst': fields.String,
        'andre_opplysninger': fields.String,
        'rapportfrist': ISO8601DateTime,
        'endre_rapportfrist_arsak': fields.String,
        'behandlet_av_formannskapet': fields.Boolean,
        'tilskuddsordning_type': fields.String
    }

    if is_saksbehandler(user) or is_godkjenner(user):
        sf["innstilt_belop"] = fields.Integer
        sf["intern_merknad"] = fields.String

    return sf


tilskuddsordning_light_fields = {
    'id': fields.Integer,
    'navn': fields.String,
    'soknadsfrist': ISO8601DateTime,
    'rapportfrist': ISO8601DateTime,
    'type': fields.String,
    'budsjett': fields.Integer,
    'budsjett_i_balanse': fields.Boolean,
    'innledningstekst': fields.String,
    'prosjekttekst': fields.String,
    'budsjettekst': fields.String,
    'publisert': fields.Boolean,
    'godkjenner_id': fields.String,
    'godkjenner_tittel': fields.String,
    'lenke_til_retningslinjer': fields.String
}

tilskuddsordning_fields = {
    'id': fields.Integer,
    'navn': fields.String,
    'soknadsfrist': ISO8601DateTime,
    'rapportfrist': ISO8601DateTime,
    'type': fields.String,
    'budsjett': fields.Integer,
    'budsjett_i_balanse': fields.Boolean,
    'innledningstekst': fields.String,
    'prosjekttekst': fields.String,
    'budsjettekst': fields.String,
    'publisert': fields.Boolean,
    'godkjenner_id': fields.String,
    'godkjenner_tittel': fields.String,
    'lenke_til_retningslinjer': fields.String,
    'saksbehandlere': fields.List(fields.Nested({'saksbehandler_id': fields.String}))
}

vedlagtlink_fields = {
    'id': fields.Integer,
    'navn': fields.String,
    'beskrivelse': fields.String,
    'passord': fields.String
}

arrangement_fields = {
    'id': fields.Integer,
    'sted': fields.String,
    'tidspunkt': fields.String,
    'start_dato': ISO8601DateTime,
    'slutt_dato': ISO8601DateTime
}

okonomibelop_fields = {
    'id': fields.Integer,
    'belop': fields.Integer,
    'okonomibelop_type': fields.String
}

okonomipost_fields = {
    'id': fields.Integer,
    'navn': fields.String,
    'okonomipost_type': fields.String,
    'okonomipost_kategori': fields.String,
    'okonomibelop': fields.List(fields.Nested(okonomibelop_fields))
}

vedlegg_fields = {
    'id': fields.Integer,
    'filnavn': fields.String,
    'file_ref': fields.String,
    'beskrivelse': fields.String,
}

saksvedlegg_fields = {
    'id': fields.Integer,
    'filnavn': fields.String,
    'file_ref': fields.String,
    'beskrivelse': fields.String,
    'vedlagtdato': ISO8601DateTime
}

klage_fields = {
    'id': fields.Integer,
    'vedtak_id': fields.Integer,
    'levertdato': ISO8601DateTime,
    'begrunnelse': fields.String
}

rapport_fields = {
    'id': fields.Integer,
    'soknad_id': fields.Integer,
    'prosjekt_gjennomforing': fields.String,
    'prosjekt_avvik': fields.String,
    'budsjett_avvik': fields.String,
    'resultat_kommentar': fields.String,
    'saksbehandler_kommentar': fields.String,
    'endre_rapportfrist_arsak': fields.String,
    'vedlegg': fields.List(fields.Nested(vedlegg_fields)),
    'vedlagtlink': fields.List(fields.Nested(vedlagtlink_fields)),
    'arrangement': fields.List(fields.Nested(arrangement_fields)),
    'okonomipost': fields.List(fields.Nested(okonomipost_fields))
}

action_fields = {
    'id': fields.String,
    'title': fields.String(attribute='name'),
}

rapport_soknad_fields = {
    'id': fields.Integer,
}

utbetaling_fields = {
    'id': fields.Integer,
    'soknad_id': fields.Integer,
    'tekst': fields.String,
    'utbetalt_belop': fields.Integer,
    'utbetalingsdato': ISO8601DateTime,
    'registrertdato': ISO8601DateTime
}

standardtekst_fields = {
    'id': fields.Integer,
    'navn': fields.String,
    'tekst': fields.String,
    'type': fields.String,
}
