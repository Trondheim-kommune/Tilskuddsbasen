# -*- coding: utf-8 -*-
from api.auth import is_saksbehandler
from statemachine.base_sm import BaseStateMachine, BaseState, BaseTransition


class SoknadStateMachine(BaseStateMachine):
    # Deklarasjon av alle tilstander
    s_kladd = BaseState(u"Kladd")
    s_innsendt = BaseState(u"Innsendt", state_name_saksbehandler=u"Ny søknad")
    s_trukket = BaseState(u"Trukket")
    s_avsluttet = BaseState(u"Avsluttet")
    s_under_behandling = BaseState(u"Under behandling")
    s_apnet_for_redigering = BaseState(u"Åpnet for redigering", state_name_soker=u"Returnert til søker",
                                       state_name_saksbehandler=u"Returnert til søker")
    s_til_vedtak = BaseState(u"Til vedtak", state_name_soker=u"Under behandling")
    s_vedtak_fattet = BaseState(u"Vedtak fattet")
    s_vedtak_klaget = BaseState(u"Vedtak påklaget")
    s_til_utbetaling = BaseState(u"Til utbetaling")
    s_avventer_rapport = BaseState(u"Avventer rapport")
    s_rapport_pabegynt = BaseState(u"Rapport påbegynt", state_name_soker=u"Avventer rapport")
    s_rapport_levert = BaseState(u"Rapport levert")
    s_tilbakebetaling_kreves = BaseState(u"Tilbakebetaling kreves")
    s_til_klagevedtak = BaseState(u"Til klagevedtak")

    # Deklarasjon av alle transisjoner
    t_slett = BaseTransition("slett", u"Slett søknad", None)
    t_sende_inn = BaseTransition("sendinn", u"Send søknad", s_innsendt)
    # OBS: Denne transisjon bruker ikke end status. Søknaden skal være i samme status som før etter aksjonen er utført
    t_rediger_soknad = BaseTransition("rediger", u"Rediger søknad", s_kladd)
    t_trekk = BaseTransition("trekk", u"Trekk søknad", s_trukket)
    t_apne_soknad_for_redigering = BaseTransition("apne_soknad_for_redigering", u"Returner søknad til søker", s_apnet_for_redigering)
    t_behandle = BaseTransition("behandle", u"Behandle", s_under_behandling)
    t_endre_saksbehandler = BaseTransition("endre_saksbehandler", u"Endre saksbehandler", None)
    t_send_tilbake_til_saksbehandling = BaseTransition("send_tilbake_til_saksbehandling", u"Send tilbake til saksbehandling", s_under_behandling)
    t_til_vedtak = BaseTransition("til_vedtak", u"Til vedtak", s_til_vedtak)
    t_fatt_vedtak = BaseTransition("fatt_vedtak", u"Fatt vedtak", s_vedtak_fattet)
    t_tilbake_til_innstilling = BaseTransition("tilbake_til_innstilling", u'Tilbake til innstilling', s_under_behandling)
    t_opprett_rapport = BaseTransition("opprett_rapport", u"Opprett rapport", s_rapport_pabegynt)
    t_rediger_rapport = BaseTransition("rediger_rapport", u"Rediger rapport", s_rapport_pabegynt)
    t_til_utbetaling = BaseTransition("til_utbetaling", u"Til utbetaling", s_til_utbetaling)
    t_avslutt = BaseTransition("avslutt", u"Avslutt", s_avsluttet)
    t_vedtak_klaget = BaseTransition("klage", u"Klage på vedtak", s_vedtak_klaget)
    t_oppretthold_klage = BaseTransition("oppretthold_klage", u"Oppretthold klage", s_vedtak_klaget)
    t_rediger_rapportfrist = BaseTransition("redigere_rapportfrist", u"Utsett rapportfrist eller send rapport tilbake til søker", s_rapport_pabegynt)
    t_lever_rapport = BaseTransition("lever_rapport", u"Send rapport", s_rapport_levert)
    # OBS: Denne transisjon bruker ikke den angitt statisk end state; den virekelig state blir valgt dynamisk!
    t_godkjenn_rapport = BaseTransition("godkjenn_rapport", u"Godkjenn rapport", s_rapport_levert)
    # OBS: Denne transisjon bruker ikke den angitt statisk end state; den virekelig state blir valgt dynamisk!
    t_underkjenn_rapport = BaseTransition("underkjenn_rapport", u"Underkjenn rapport", s_rapport_levert)
    t_avskriv_rapportkrav = BaseTransition("avskriv_rapportkrav", u"Avskriv rapportkrav", None)
    t_krev_tilbakebetaling = BaseTransition("krev_tilbakebetaling", u"Krev tilbakebetaling", s_trukket)
    # OBS: Denne transisjon bruker ikke den angitt statisk end state; den virekelig state blir valgt dynamisk!
    t_godta_vedtak = BaseTransition("godta_vedtak", u"Godta vedtak", s_vedtak_fattet)
    t_takke_nei = BaseTransition("takke_nei", u"Avslå tilskuddet", s_trukket)
    t_vurder_klage = BaseTransition("vurder_klage", u"Vurder klage", s_til_klagevedtak)
    t_fatt_klagevedtak = BaseTransition("fatt_klagevedtak", u"Fatt klagevedtak", s_vedtak_fattet)
    t_tilbake_til_vurder_klage = BaseTransition("tilbake_til_vurder_klage", u'Tilbake til vurder klage', s_vedtak_klaget)
    # OBS: Denne transisjon bruker ikke den angitt statisk end state; den virekelig state blir valgt dynamisk!
    t_registrer_utbetaling = BaseTransition("registrer_utbetaling", u'Registrer utbetaling', s_til_utbetaling)
    # OBS: Denne transisjon bruker ikke end status. Søknaden skal være i samme status som før etter aksjonen er utført
    t_last_opp_saksvedlegg = BaseTransition("last_opp_saksvedlegg", u'Nytt saksvedlegg', None)
    # OBS: Denne transisjon bruker ikke end status. Søknaden skal være i samme status som før etter aksjonen er utført
    t_endre_kontakt = BaseTransition("endre_kontakt", u'Endre kontakt', None)
    t_endre_tilskuddsordning = BaseTransition("endre_tilskuddsordning", u'Endre tilskuddsordning', None)

    def __init__(self):
        super(SoknadStateMachine, self).__init__()

        # konfigurasjon av hvilke transisjoner finnes på hvilke tilstander
        self.s_kladd.add_transition(self.t_slett)
        self.s_kladd.add_transition(self.t_sende_inn)
        self.s_kladd.add_transition(self.t_rediger_soknad)

        self.s_innsendt.add_transition(self.t_behandle)
        self.s_innsendt.add_transition(self.t_trekk)
        self.s_innsendt.add_transition(self.t_endre_kontakt)

        self.s_under_behandling.add_transition(self.t_trekk)
        self.s_under_behandling.add_transition(self.t_apne_soknad_for_redigering)
        self.s_under_behandling.add_transition(self.t_til_vedtak)
        self.s_under_behandling.add_transition(self.t_last_opp_saksvedlegg)
        self.s_under_behandling.add_transition(self.t_endre_kontakt)
        self.s_under_behandling.add_transition(self.t_endre_saksbehandler)
        self.s_under_behandling.add_transition(self.t_endre_tilskuddsordning)

        self.s_apnet_for_redigering.add_transition(self.t_send_tilbake_til_saksbehandling)
        self.s_apnet_for_redigering.add_transition(self.t_rediger_soknad)
        self.s_apnet_for_redigering.add_transition(self.t_trekk)
        self.s_apnet_for_redigering.add_transition(self.t_last_opp_saksvedlegg)
        self.s_apnet_for_redigering.add_transition(self.t_endre_kontakt)
        self.s_apnet_for_redigering.add_transition(self.t_endre_saksbehandler)

        self.s_til_vedtak.add_transition(self.t_tilbake_til_innstilling)
        self.s_til_vedtak.add_transition(self.t_fatt_vedtak)
        self.s_til_vedtak.add_transition(self.t_trekk)
        self.s_til_vedtak.add_transition(self.t_last_opp_saksvedlegg)
        self.s_til_vedtak.add_transition(self.t_endre_kontakt)
        self.s_til_vedtak.add_transition(self.t_endre_saksbehandler)

        self.s_vedtak_fattet.add_transition(self.t_avslutt)
        self.s_vedtak_fattet.add_transition(self.t_vedtak_klaget)
        self.s_vedtak_fattet.add_transition(self.t_oppretthold_klage)
        self.s_vedtak_fattet.add_transition(self.t_godta_vedtak)
        self.s_vedtak_fattet.add_transition(self.t_takke_nei)
        self.s_vedtak_fattet.add_transition(self.t_last_opp_saksvedlegg)
        self.s_vedtak_fattet.add_transition(self.t_endre_kontakt)
        self.s_vedtak_fattet.add_transition(self.t_trekk, condition=is_saksbehandler)
        self.s_vedtak_fattet.add_transition(self.t_endre_saksbehandler)

        self.s_vedtak_klaget.add_transition(self.t_vurder_klage)
        self.s_vedtak_klaget.add_transition(self.t_last_opp_saksvedlegg)
        self.s_vedtak_klaget.add_transition(self.t_endre_kontakt)
        self.s_vedtak_klaget.add_transition(self.t_endre_saksbehandler)

        self.s_til_klagevedtak.add_transition(self.t_fatt_klagevedtak)
        self.s_til_klagevedtak.add_transition(self.t_tilbake_til_vurder_klage)
        self.s_til_klagevedtak.add_transition(self.t_last_opp_saksvedlegg)
        self.s_til_klagevedtak.add_transition(self.t_endre_kontakt)
        self.s_til_klagevedtak.add_transition(self.t_endre_saksbehandler)

        self.s_til_utbetaling.add_transition(self.t_avslutt)
        self.s_til_utbetaling.add_transition(self.t_registrer_utbetaling)
        self.s_til_utbetaling.add_transition(self.t_last_opp_saksvedlegg)
        self.s_til_utbetaling.add_transition(self.t_endre_kontakt)
        self.s_til_utbetaling.add_transition(self.t_endre_saksbehandler)

        self.s_avventer_rapport.add_transition(self.t_opprett_rapport)
        self.s_avventer_rapport.add_transition(self.t_rediger_rapportfrist)
        self.s_avventer_rapport.add_transition(self.t_avskriv_rapportkrav)
        self.s_avventer_rapport.add_transition(self.t_last_opp_saksvedlegg)
        self.s_avventer_rapport.add_transition(self.t_endre_kontakt)
        self.s_avventer_rapport.add_transition(self.t_endre_saksbehandler)

        self.s_rapport_pabegynt.add_transition(self.t_rediger_rapport)
        self.s_rapport_pabegynt.add_transition(self.t_lever_rapport)
        self.s_rapport_pabegynt.add_transition(self.t_rediger_rapportfrist)
        self.s_rapport_pabegynt.add_transition(self.t_avskriv_rapportkrav)
        self.s_rapport_pabegynt.add_transition(self.t_last_opp_saksvedlegg)
        self.s_rapport_pabegynt.add_transition(self.t_endre_kontakt)
        self.s_rapport_pabegynt.add_transition(self.t_endre_saksbehandler)

        self.s_rapport_levert.add_transition(self.t_godkjenn_rapport)
        self.s_rapport_levert.add_transition(self.t_underkjenn_rapport)
        self.s_rapport_levert.add_transition(self.t_rediger_rapportfrist)
        self.s_rapport_levert.add_transition(self.t_avskriv_rapportkrav)
        self.s_rapport_levert.add_transition(self.t_last_opp_saksvedlegg)
        self.s_rapport_levert.add_transition(self.t_endre_kontakt)
        self.s_rapport_levert.add_transition(self.t_endre_saksbehandler)

        self.s_tilbakebetaling_kreves.add_transition(self.t_krev_tilbakebetaling)
        self.s_tilbakebetaling_kreves.add_transition(self.t_last_opp_saksvedlegg)
        self.s_tilbakebetaling_kreves.add_transition(self.t_endre_kontakt)
        self.s_tilbakebetaling_kreves.add_transition(self.t_endre_saksbehandler)

        self.add_state(self.s_kladd) \
            .add_state(self.s_innsendt) \
            .add_state(self.s_trukket) \
            .add_state(self.s_avsluttet) \
            .add_state(self.s_under_behandling) \
            .add_state(self.s_apnet_for_redigering) \
            .add_state(self.s_til_vedtak) \
            .add_state(self.s_vedtak_fattet) \
            .add_state(self.s_vedtak_klaget) \
            .add_state(self.s_til_utbetaling) \
            .add_state(self.s_avventer_rapport) \
            .add_state(self.s_rapport_pabegynt) \
            .add_state(self.s_rapport_levert) \
            .add_state(self.s_tilbakebetaling_kreves) \
            .add_state(self.s_til_klagevedtak)
