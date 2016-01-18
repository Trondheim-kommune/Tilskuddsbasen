# -*- coding: utf-8 -*-
from datetime import datetime, timedelta

from flask import request
from flask.ext.bouncer import requires, POST

from api.base_resource import BaseResource
from documents.epost.tilskudd_emails import send_email_to_soker_on_soknad_purring
from repo.soknad_repo import SoknadRepo
from statemachine.soknad_sm import SoknadStateMachine


class Purring(object):
    pass


class SoknaderPurringerResource(BaseResource):
    @requires(POST, Purring)
    def post(self):
        data = request.get_json()

        minutes = data.pop('minutes')

        soknader = self.filter_soknader_for_purring(SoknadRepo.find_soknader(soknad_states=[SoknadStateMachine.s_vedtak_fattet.id]), minutes, **data)

        for soknad in soknader:
            if send_email_to_soker_on_soknad_purring(soknad):
                soknad.nyeste_fattet_vedtak().purret_dato = datetime.now()
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
            if vedtak is not None and vedtak.vedtaksdato is not None:
                vedtaksdato = vedtak.vedtaksdato
                today = datetime.today()
                purretdato = vedtak.purret_dato

                if (vedtaksdato + timedelta(minutes=minutes) <= today <= vedtaksdato + timedelta(minutes=minutes + reminder_slack)
                        and (purretdato is None
                             or (not (vedtaksdato + timedelta(minutes=minutes) <= purretdato <= vedtaksdato + timedelta(minutes=minutes + reminder_slack))
                                 and (today - purretdato).total_seconds()/60 > min_minutes_since_last_reminder))):

                    result.append(soknad)

        return result