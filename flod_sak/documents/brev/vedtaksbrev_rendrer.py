# -*- coding: utf-8 -*-
from flask import request, render_template
from flask.ext.restful import abort

from api.auth import get_person, get_user_by_id
from flod_common.outputs.output_pdf import create_pdf

VEDTAKSBREV_TIME_FORMAT = '%d.%m.%Y'


def vedtaksbrev_datestr(date):
    return date.strftime(VEDTAKSBREV_TIME_FORMAT)


def get_organisasjonsnummer_or_foedselsnummer_values(organisation, person_id):
    orgnr_fnr = organisation['org_number'] if organisation['org_number'] is not None else ""
    if orgnr_fnr != "":
        return u"Organisasjonsnummer", orgnr_fnr
    else:
        person = get_person(person_id, request.cookies)

        if 'national_identity_number' in person:
            orgnr_fnr = person['national_identity_number']
            return u"Fødselsnummer", orgnr_fnr
        else:
            abort(500, __error__=[(u"Kunne ikke hente fødselsnummer for person med id=%s" % person['id'])])


def create_vedtaksbrev_from_template(soknad, organisation, vedtak):
    saksbehandler = get_user_by_id(soknad.saksbehandler_id,request.cookies)
    godkjenner =get_user_by_id(soknad.tilskuddsordning.godkjenner_id,request.cookies)
    person = get_person(soknad.person_id,request.cookies)

    tekst_orgnr_eller_fnr, orgnr_eller_fnr = get_organisasjonsnummer_or_foedselsnummer_values(organisation,
                                                                                              soknad.person_id)
    vedtaksbrev = {
        u'vedtak': u'Tilsagn ' if vedtak.vedtatt_belop is not None else u"Avslag",
        u'vedtatt_belop': "%s,00" % vedtak.vedtatt_belop if vedtak.vedtatt_belop is not None else "",
        u'vedtaksdato': vedtaksbrev_datestr(vedtak.vedtaksdato) if vedtak.vedtaksdato is not None else "",
        u'saksbehandler': saksbehandler['profile']['full_name'],
        u'vedtatt_av': godkjenner['profile']['full_name'] + (',' + soknad.tilskuddsordning.godkjenner_tittel) if soknad.tilskuddsordning.godkjenner_tittel is not None else "",
        u'rapportfrist': vedtaksbrev_datestr(vedtak.rapportfrist) if vedtak.rapportfrist is not None else u"Ingen",
        u'saksnummer': soknad.id,
        u'tilskuddsordning_navn': soknad.tilskuddsordning.navn if soknad.tilskuddsordning.navn is not None else "",
        u'organisasjon_navn': organisation['name'] if organisation['name'] is not None else "",
        u'kontaktperson': person['first_name'] if person['first_name'] is not None else "" + ' ' + person.last_name if person.last_name is not None else "",
        u'tekst_orgnr_eller_fnr': tekst_orgnr_eller_fnr,
        u'orgnr_eller_fnr': orgnr_eller_fnr,
        u'kontonummer': soknad.kontonummer if soknad.kontonummer is not None else "",
        u'prosjektnavn': soknad.prosjektnavn if soknad.prosjektnavn is not None else "",
        u'innsendt': vedtaksbrev_datestr(soknad.levert_dato) if soknad.levert_dato is not None else "",
        u'merk_folgende': vedtak.vedtakstekst if vedtak.vedtakstekst is not None else "",
        u'andre_opplysninger': vedtak.andre_opplysninger if vedtak.andre_opplysninger is not None else ""
    }

    message = render_template(u'pdf/vedtak.html', **vedtaksbrev)
    pdf = create_pdf(message)
    return pdf.getvalue(), pdf.len



