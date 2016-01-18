# -*- coding: utf-8 -*-
from datetime import datetime, timedelta, date

from flask import request
from flask.ext.bouncer import requires, POST

from api.base_resource import BaseResource
from api.soknader_purringer_resource import Purring
from documents.epost.tilskudd_emails import send_email_to_soker_on_rapport_purring
from repo.soknad_repo import SoknadRepo
from statemachine.soknad_sm import SoknadStateMachine


class RapporterPurringerResource(BaseResource):
    @requires(POST, Purring)
    def post(self):
        data = request.get_json()

        minutes = data.pop('minutes')

        soknader = self.filter_soknader_for_purring(SoknadRepo.find_soknader(soknad_states=[SoknadStateMachine.s_avventer_rapport.id, SoknadStateMachine.s_rapport_pabegynt.id]), minutes, **data)

        for soknad in soknader:
            if send_email_to_soker_on_rapport_purring(soknad):
                soknad.nyeste_fattet_vedtak().rapport_purret_dato = datetime.now()
                SoknadRepo.save(soknad)

        return None, 201

    @staticmethod
    def filter_soknader_for_purring(soknader, minutes, reminder_slack=2*24*60, min_minutes_since_last_reminder=1*24*60):
        """

        :param soknader:
        :param minutes:

        :param reminder_slack:
        i tilfelle jobben er nede en stund, så får brukeren likevel purring, men ikke etter x antall minutter, default 2 dager

        :param min_minutes_since_last_reminder:
        for å unngå å spamme så setter vi en begrensning på hvor lang tid det minimum må ha gått siden forrige purring, default 1 dag

        :return:
        """

        result = []

        for soknad in soknader:
            vedtak = soknad.nyeste_fattet_vedtak()
            if vedtak is not None and vedtak.rapportfrist is not None:
                rapportfrist = datetime(vedtak.rapportfrist.year, vedtak.rapportfrist.month, vedtak.rapportfrist.day)
                today = datetime.today()

                purretdato = vedtak.rapport_purret_dato

                if (rapportfrist + timedelta(minutes=minutes) <= today <= rapportfrist + timedelta(minutes=minutes + reminder_slack)
                        and (purretdato is None
                             or (not (rapportfrist + timedelta(minutes=minutes) <= purretdato <= rapportfrist + timedelta(minutes=minutes + reminder_slack))
                                 and (today - purretdato).total_seconds()/60 > min_minutes_since_last_reminder))):

                    result.append(soknad)

        return result