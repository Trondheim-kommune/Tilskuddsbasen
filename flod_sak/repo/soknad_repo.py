# -*- coding: utf-8 -*-
from datetime import datetime

from flask import current_app
from sqlalchemy import and_, or_

from domain.models import Soknad, Tilskuddsordning
from repo.base_repo import BaseRepo
from repo.okonomi_post_repo import OkonomiPostRepo
from repo.vedlagtlink_repo import VedlagtlinkRepo
from repo.vedlegg_repo import VedleggRepo
from repo.arrangement_repo import ArrangementRepo
from utils.facets import periods_in_the_past, get_time_delta_by_name
from utils.types import StringUtils


class SoknadRepo(BaseRepo):
    # used by BaseRepo
    model_class = Soknad

    @classmethod
    def map_model(cls, soknad, data):
        soknad.kontonummer = StringUtils.keep_alnum_only(data.get('kontonummer')) if data.get('kontonummer') else None
        soknad.telefon = StringUtils.keep_alnum_only(data.get('telefon')) if data.get('telefon') else None

        SoknadRepo.update_model(soknad, 'epost', data)
        SoknadRepo.update_model(soknad, 'om_oss', data)
        SoknadRepo.update_model(soknad, 'prosjektnavn', data)
        SoknadRepo.update_model(soknad, 'beskrivelse', data)
        SoknadRepo.update_model(soknad, 'maalsetting', data)
        SoknadRepo.update_model(soknad, 'omsokt_belop', data)
        SoknadRepo.update_model(soknad, 'kommentar', data)

        if data.get('organisation_id'):
            soknad.organisation_id = data.get('organisation_id')
        else:
            soknad.organisation_id = None

        if data.get('person_id'):
            soknad.person_id = data.get('person_id')

        if data.get('arrangement') is not None:
            ArrangementRepo.update_sub_models(data.get('arrangement'), soknad, 'arrangement')

        if data.get('okonomipost') is not None:
            OkonomiPostRepo.update_sub_models(data.get('okonomipost'), soknad, 'okonomipost')

        if data.get('vedlagtlink') is not None:
            VedlagtlinkRepo.update_sub_models(data.get('vedlagtlink'), soknad, 'vedlagtlink')

        if data.get('vedlegg') is not None:
            VedleggRepo.update_sub_models(data.get('vedlegg'), soknad, 'vedlegg')

    @classmethod
    def find_organisasjoner_knyttet_til_soknader(cls,
                                                 restrict_to_organisations=None,
                                                 registered_by_person=None):
        """
        Finner frem til søknadene som tilfredstiller de angitte kriteriene, og returnerer alle de unique
        organisasjonene de er knyttet til.

        :param person_uri: Hvis angitt blir det kun søknader opprettet av den angitte person som søkes i.
        :return: en liste med organisasjoner. "None" kan oppstå i listen
        """
        soknader = current_app.db_session \
            .query(cls.model_class) \
            .outerjoin(cls.model_class.tilskuddsordning) \
            .filter(cls.get_find_soknader_filter(restrict_to_organisations=restrict_to_organisations,
                                                 registered_by_person=registered_by_person)) \
            .distinct(cls.model_class.organisation_id) \
            .all()
        return [soknad.organisation_id for soknad in soknader]

    @classmethod
    def find_tilskuddsordninger_knyttet_til_soknader(cls,
                                                     restrict_to_organisations=None,
                                                     registered_by_person=None):
        """
        Finner frem til søknadene som tilfredstiller de angitte kriteriene, og returnerer alle de unique
        tilskuddsordningene de er knyttet til.

        :param person_uri: Hvis angitt blir det kun søknader opprettet av den angitte person som søkes i.
        :return: en liste med tilskuddsordninger. "None" kan oppstå i listen
        """
        soknader = current_app.db_session \
            .query(cls.model_class) \
            .outerjoin(cls.model_class.tilskuddsordning) \
            .filter(cls.get_find_soknader_filter(restrict_to_organisations=restrict_to_organisations,
                                                 registered_by_person=registered_by_person)) \
            .distinct(cls.model_class.tilskuddsordning_id) \
            .all()
        return [soknad.tilskuddsordning for soknad in soknader]

    @classmethod
    def find_states_knyttet_til_soknader(cls,
                                           restrict_to_organisations=None,
                                           registered_by_person=None,
                                           exclude_soknad_states=None):
        """
        Finner frem til søknadene som tilfredstiller de angitte kriteriene, og returnerer alle de unique
        tilskuddsordningene de er knyttet til.

        :param person_uri: Hvis angitt blir det kun søknader opprettet av den angitte person som søkes i.
        :return: en liste med tilskuddsordninger. "None" kan oppstå i listen
        """
        soknader = current_app.db_session \
            .query(cls.model_class) \
            .outerjoin(cls.model_class.tilskuddsordning) \
            .filter(cls.get_find_soknader_filter(restrict_to_organisations=restrict_to_organisations,
                                                 registered_by_person=registered_by_person,
                                                 exclude_soknad_states=exclude_soknad_states)) \
            .distinct(cls.model_class.status) \
            .all()
        return [soknad.status for soknad in soknader]

    @classmethod
    def find_saksbehandlere_knyttet_til_soknader(cls, restrict_to_organisations=None, registered_by_person=None):
        """
        Finner frem til søknadene som tilfredstiller de angitte kriteriene, og returnerer alle de unique
        saksbehandlere de er knyttet til.

        :param person_uri: Hvis angitt blir det kun søknader opprettet av den angitte person som søkes i.
        :return: en liste med saksbehandlere. "None" kan oppstå i listen
        """
        soknader = current_app.db_session \
            .query(cls.model_class) \
            .outerjoin(cls.model_class.tilskuddsordning) \
            .filter(cls.get_find_soknader_filter(restrict_to_organisations=restrict_to_organisations,
                                                 registered_by_person=registered_by_person)) \
            .distinct(cls.model_class.saksbehandler_id) \
            .all()
        return [soknad.saksbehandler_id for soknad in soknader]

    @classmethod
    def generate_in_period_clause(cls, sql_column=None, first_bound=None, second_bound=None):
        assert sql_column
        if not first_bound and not second_bound:
            return None

        if first_bound == second_bound:
            return and_(sql_column.isnot(None), sql_column == first_bound)

        lower_bound = first_bound
        upper_bound = second_bound
        if first_bound > second_bound:
            lower_bound = second_bound
            upper_bound = first_bound

        return and_(sql_column.isnot(None), sql_column > lower_bound, sql_column < upper_bound)

    @classmethod
    def find_soknader(cls, **kwargs):
        return cls.get_find_soknader_query(**kwargs) \
            .order_by(cls.model_class.id).all()

    @classmethod
    def get_find_soknader_query(cls, **kwargs):
        return \
            current_app.db_session.query(cls.model_class)\
                .outerjoin(cls.model_class.tilskuddsordning)\
                .filter(cls.get_find_soknader_filter(**kwargs))

    @classmethod
    def get_find_soknader_filter(cls,
                                 levert_period_names=None,
                                 registered_by_person=None,
                                 exclude_soknad_states=None,
                                 restrict_to_organisations=None,
                                 saksbehandlere=None,
                                 sokere=None,
                                 soknad_states=None,
                                 tilskuddsordninger=None):
        clauses = []
        if registered_by_person is not None and (restrict_to_organisations is not None and len(restrict_to_organisations) > 0):
            clauses.append(
                or_(
                    and_(Soknad.person_id == registered_by_person, Soknad.organisation_id == None),
                    Soknad.organisation_id.in_(restrict_to_organisations))
            )
        if registered_by_person is None and (restrict_to_organisations is not None and len(restrict_to_organisations) > 0):
            clauses.append(Soknad.organisation_id.in_(restrict_to_organisations))
        if registered_by_person is not None and (restrict_to_organisations is None or len(restrict_to_organisations) == 0):
            clauses.append(
                and_(Soknad.person_id == registered_by_person, Soknad.organisation_id == None)
            )
        if sokere is not None and len(sokere) > 0:
            if None in sokere:
                clauses.append(
                    or_(Soknad.organisation_id.in_(sokere), Soknad.organisation_id == None)
                )
            else:
                clauses.append(Soknad.organisation_id.in_(sokere))
        if levert_period_names is not None and len(levert_period_names) > 0:
            now = datetime.now()
            dato_levert_clauses = []
            for period_name in levert_period_names:
                period_bound = get_time_delta_by_name(periods_in_the_past, period_name).apply(now)
                clause = cls.generate_in_period_clause(cls.model_class.levert_dato,
                                                       first_bound=now,
                                                       second_bound=period_bound)
                dato_levert_clauses.append(clause)
            if len(dato_levert_clauses) == 1:
                clauses.append(*dato_levert_clauses)
            if len(dato_levert_clauses) > 1:
                clauses.append(or_(*dato_levert_clauses))
        if saksbehandlere is not None and len(saksbehandlere) > 0:
            if None in saksbehandlere:
                clauses.append(or_(Soknad.saksbehandler_id.in_(saksbehandlere), Soknad.saksbehandler_id == None))
            else:
                clauses.append(Soknad.saksbehandler_id.in_(saksbehandlere))

        if exclude_soknad_states is not None and len(exclude_soknad_states) > 0:
            clauses.append(cls.model_class.status.notin_(exclude_soknad_states))
        if soknad_states is not None and len(soknad_states) > 0:
            clauses.append(cls.model_class.status.in_(soknad_states))
        if tilskuddsordninger is not None and len(tilskuddsordninger) > 0:
            clauses.append(cls.model_class.tilskuddsordning_id.in_(tilskuddsordninger))
        if len(clauses) == 1:
            return clauses[0]
        else:
            return and_(*clauses)
