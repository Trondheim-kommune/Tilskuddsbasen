# -*- coding: utf-8 -*-
from datetime import datetime
from operator import attrgetter
import os

from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, Boolean, UniqueConstraint, CheckConstraint, \
    DateTime
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.orm import relationship, backref, class_mapper
from sqlalchemy.event import listens_for

from flask import current_app

from database import Base
from domain.storage import FileBackend


class MandatoryFieldsValidator(object):
    missing = {}

    def add_missing(self, key, value='Mandatory'):
        if not self.missing:
            self.missing = {}
        self.missing[key] = value

    def validate_mandatory_fields(self):
        for col in class_mapper(self.__class__).columns:
            if col.info.get('mandatory'):
                if not self.__getattribute__(col.key):
                    self.add_missing(col.key)

        return self.missing


class Vedlegg(Base):
    __tablename__ = 'vedlegg'
    id = Column(Integer, primary_key=True)
    filnavn = Column(String)
    file_ref = Column(String)
    beskrivelse = Column(String)
    vedlagtdato = Column(DateTime, nullable=False)
    user_id = Column(String, nullable=False)


class Vedlagtlink(Base):
    __tablename__ = 'vedlagtlink'
    id = Column(Integer, primary_key=True)
    navn = Column(String)
    beskrivelse = Column(String)
    passord = Column(String)


okonomipost_type_enums = Enum("Inntekt", "Utgift", name="okonomipost_type_types", convert_unicode=True)
okonomipost_kategori_enums = Enum("Tilskudd", "Annet", name="okonomipost_kategori_types", convert_unicode=True)


class OkonomiPost(MandatoryFieldsValidator, Base):
    __tablename__ = "okonomi_post"
    id = Column(Integer, primary_key=True, info={'mandatory': True})
    navn = Column(String(60), nullable=True, info={'mandatory': True})
    okonomipost_type = Column(okonomipost_type_enums, default=None, nullable=False, info={'mandatory': True})
    okonomipost_kategori = Column(okonomipost_kategori_enums, default=None, nullable=False, info={'mandatory': True})
    okonomibelop = relationship("OkonomiBelop", lazy=False, cascade="all, delete-orphan", passive_deletes=False)

    def validate_mandatory_fields(self):
        super(OkonomiPost, self).validate_mandatory_fields()
        okonomibelop_errors = []
        for okonomibelop in self.okonomibelop:
            error = okonomibelop.validate_mandatory_fields()
            if len(error) > 0:
                okonomibelop_errors.append(error)
        if okonomibelop_errors:
            self.add_missing('okonomibelop', okonomibelop_errors)

        return self.missing


okonomibelop_type_enums = Enum("Budsjett", "Regnskap", name="okonomibelop_type_types", convert_unicode=True)


class OkonomiBelop(MandatoryFieldsValidator, Base):
    __tablename__ = "okonomi_belop"
    id = Column(Integer, primary_key=True, info={'mandatory': True})
    okonomipost_id = Column(Integer, ForeignKey("okonomi_post.id"), info={'mandatory': True})
    okonomibelop_type = Column(okonomibelop_type_enums, default=None, nullable=False, info={'mandatory': True})
    belop = Column(Integer, nullable=True, info={'mandatory': True})
    __table_args__ = (
        UniqueConstraint('okonomipost_id', 'okonomibelop_type', name='uix_okonomipost_id_okonomibelop_type'),
        CheckConstraint('belop >= 0', name="chk_okonomi_belop_belop"))


soknad_status_enums = Enum("Kladd",
                           "Innsendt",
                           "Trukket",
                           "Avsluttet",
                           "Under behandling",
                           "Åpnet for redigering",
                           "Til vedtak",
                           "Vedtak fattet",
                           "Vedtak påklaget",
                           "Til utbetaling",
                           "Avventer rapport",
                           "Rapport påbegynt",
                           "Rapport levert",
                           "Tilbakebetaling kreves",
                           "Til klagevedtak",
                           name="soknad_status_types", convert_unicode=True)


class Soknad(MandatoryFieldsValidator, Base):
    __tablename__ = 'soknader'
    id = Column(Integer, primary_key=True, info={'mandatory': True})
    person_id = Column(Integer, nullable=False, info={'mandatory': True})
    organisation_id = Column(Integer, nullable=True, info={'mandatory': True})
    saksbehandler_id = Column(String, nullable=True)
    tilskuddsordning_id = Column(Integer, ForeignKey("tilskuddsordninger.id"), nullable=False, info={'mandatory': True})
    tilskuddsordning = relationship("Tilskuddsordning", lazy=True)
    omsokt_belop = Column(Integer, info={'mandatory': True})
    status = Column(soknad_status_enums, default=None, info={'mandatory': True})
    kontonummer = Column(String(11), info={'mandatory': True})
    epost = Column(String(320), info={'mandatory': True})
    telefon = Column(String(8), info={'mandatory': True})
    om_oss = Column(String(300), info={'mandatory': False})
    prosjektnavn = Column(String(60), info={'mandatory': True})
    beskrivelse = Column(String(800), info={'mandatory': True})
    maalsetting = Column(String(300), info={'mandatory': True})
    kommentar = Column(String(700))
    levert_dato = Column(Date, info={'mandatory': True})
    trukket_kommentar = Column(String(700))
    merknad = Column(String(150))
    saksvedlegg = association_proxy("soknad_saksvedlegg", "vedlegg")
    vedlegg = association_proxy("soknad_vedlegg", "vedlegg")
    vedlagtlink = association_proxy("soknad_vedlagtlink", "vedlagtlink")
    arrangement = association_proxy('soknad_arrangement', 'arrangement')
    okonomipost = association_proxy('soknad_okonomipost', 'okonomipost')
    rapport = relationship('Rapport')
    vedtak = relationship("Vedtak")
    klage = relationship("Klage")
    utbetaling = relationship("Utbetaling")
    avskrevet_rapportkrav_kommentar = Column(String(700))

    def validate_soknad_for_innsending(self):
        self.validate_mandatory_fields()
        if self.missing == {}:
            self.validate_budsjett_balanse()
        return self.missing

    def validate_budsjett_balanse(self):
        budsjettbalanse = 0
        for okonomipost in self.okonomipost:
            if okonomipost.okonomipost_type == "Inntekt":
                for okonomibelop in okonomipost.okonomibelop:
                    budsjettbalanse += okonomibelop.belop
            else:
                for okonomibelop in okonomipost.okonomibelop:
                    budsjettbalanse -= okonomibelop.belop

        budsjettbalanse = self.omsokt_belop + budsjettbalanse
        if self.tilskuddsordning.budsjett_i_balanse:
            if budsjettbalanse != 0:
                self.add_missing('omsokt_belop', u"Budsjett må gå i balanse")
        else:
            if budsjettbalanse < 0:
                self.add_missing('omsokt_belop', u"Budsjettbalanse kan ikke være negativ")

    def validate_mandatory_fields(self):
        super(Soknad, self).validate_mandatory_fields()

        # require at least one arrangement
        if len(self.arrangement) == 0:
            self.add_missing('arrangement')
        # validate mandatory fields of arrangements
        arr_errors = []
        for arr in self.arrangement:
            error = arr.validate_mandatory_fields()
            if len(error) > 0:
                arr_errors.append(error)
        if arr_errors:
            self.add_missing('arrangement', arr_errors)

        # validate mandatory fields of arrangements
        okopost_errors = []
        for okonomipost in self.okonomipost:
            error = okonomipost.validate_mandatory_fields()
            if len(error) > 0:
                okopost_errors.append(error)
        if okopost_errors:
            self.add_missing('okonomipost', okopost_errors)
        return self.missing

    def nyeste_utbetaling(self):
        if len(self.utbetaling) == 0:
            return None
        else:
            id_sorted = sorted(self.utbetaling, key=attrgetter('id'))
            s = sorted(id_sorted,
                       key=lambda utbetaling: utbetaling.utbetalingsdato
                       if utbetaling.utbetalingsdato
                       else datetime.now())
            return s[-1]

    def nyeste_vedtak(self):
        if len(self.vedtak) == 0:
            return None
        else:
            id_sorted = sorted(self.vedtak, key=attrgetter("id"))
            s = sorted(id_sorted,
                       key=lambda vedtak: vedtak.vedtaksdato
                       if vedtak.vedtaksdato
                       else datetime.now())
            return s[-1]

    def nyeste_fattet_vedtak(self):
        if len(self.vedtak) == 0:
            return None
        for vedtak in sorted(self.vedtak,
                             key=lambda vedtak: vedtak.vedtaksdato
                             if vedtak.vedtaksdato
                             else datetime.now(), reverse=True):
            if vedtak.vedtaksdato is not None:
                return vedtak


class Arrangement(MandatoryFieldsValidator, Base):
    __tablename__ = 'arrangement'
    id = Column(Integer, primary_key=True, info={'mandatory': True})
    sted = Column(String, info={'mandatory': True})
    tidspunkt = Column(String)
    start_dato = Column(Date)
    slutt_dato = Column(Date)

    def validate_mandatory_fields(self):
        super(Arrangement, self).validate_mandatory_fields()

        if not ((self.start_dato and self.slutt_dato) or self.tidspunkt):
            if not self.start_dato:
                self.add_missing('start_dato')
            if not self.slutt_dato:
                self.add_missing('slutt_dato')

        return self.missing


class SoknadSaksvedlegg(Base):
    __tablename__ = 'soknad_saksvedlegg'
    vedlegg_id = Column(Integer, ForeignKey("vedlegg.id"), primary_key=True)
    vedlegg = relationship(Vedlegg,
                           lazy=True,
                           cascade="all, delete-orphan",
                           backref=backref("saks_vedlegg", lazy=True, cascade="all, delete-orphan"),
                           single_parent=True)
    soknad_id = Column(Integer, ForeignKey("soknader.id"), primary_key=True)
    soknad = relationship(Soknad, backref=backref("soknad_saksvedlegg", lazy=True, cascade="all, delete-orphan"),
                          single_parent=True)

    def __init__(self, vedlegg=None, soknad=None):
        self.vedlegg = vedlegg
        self.soknad = soknad


class SoknadVedlegg(Base):
    __tablename__ = 'soknad_vedlegg'
    vedlegg_id = Column(Integer, ForeignKey("vedlegg.id"), primary_key=True)
    vedlegg = relationship("Vedlegg",
                           lazy=True,
                           cascade="all, delete-orphan",
                           backref=backref("soknad_vedlegg", lazy=True, cascade="all, delete-orphan"),
                           single_parent=True)
    soknad_id = Column(Integer, ForeignKey("soknader.id"), primary_key=True)
    soknad = relationship(Soknad,
                          backref=backref("soknad_vedlegg", lazy=True, cascade="all, delete-orphan"),
                          single_parent=True)

    def __init__(self, vedlegg=None, soknad=None):
        self.vedlegg = vedlegg
        self.soknad = soknad


class SoknadVedlagtlink(Base):
    __tablename__ = 'soknad_vedlagtlink'
    vedlagtlink_id = Column(Integer, ForeignKey("vedlagtlink.id"), primary_key=True)
    vedlagtlink = relationship("Vedlagtlink",
                               lazy=True,
                               cascade="all, delete-orphan",
                               backref=backref("soknad_vedlagtlink", lazy=True, cascade="all, delete-orphan"),
                               single_parent=True)
    soknad_id = Column(Integer, ForeignKey("soknader.id"), primary_key=True)
    soknad = relationship(Soknad,
                          backref=backref("soknad_vedlagtlink", lazy=True, cascade="all, delete-orphan"),
                          single_parent=True)

    def __init__(self, vedlagtlink=None, soknad=None):
        self.vedlagtlink = vedlagtlink
        self.soknad = soknad


class SoknadArrangement(Base):
    __tablename__ = 'soknad_arrangement'
    arrangement_id = Column(Integer, ForeignKey("arrangement.id"), primary_key=True)
    arrangement = relationship("Arrangement",
                               lazy=True,
                               cascade="all, delete-orphan",
                               backref=backref("soknad_arrangement", lazy=True, cascade="all, delete-orphan"),
                               single_parent=True)
    soknad_id = Column(Integer, ForeignKey("soknader.id"), primary_key=True)
    soknad = relationship(Soknad,
                          backref=backref("soknad_arrangement", lazy=True, cascade="all, delete-orphan"),
                          single_parent=True)

    def __init__(self, arrangement=None, soknad=None):
        self.arrangement = arrangement
        self.soknad = soknad


class SoknadOkonomipost(Base):
    __tablename__ = 'soknad_okonomipost'
    okonomipost_id = Column(Integer, ForeignKey("okonomi_post.id"), primary_key=True)
    okonomipost = relationship("OkonomiPost",
                               lazy=True,
                               cascade="all, delete-orphan",
                               backref=backref("soknad_okonomipost", lazy=True, cascade="all, delete-orphan"),
                               single_parent=True)
    soknad_id = Column(Integer, ForeignKey("soknader.id"), primary_key=True)
    soknad = relationship(Soknad,
                          backref=backref("soknad_okonomipost", lazy=True, cascade="all, delete-orphan"),
                          single_parent=True)

    def __init__(self, okonomipost=None, soknad=None):
        self.okonomipost = okonomipost
        self.soknad = soknad


tilskuddsordning_type_enums = Enum("Forskuddsutbetaling",
                                   "Etterskuddsutbetaling",
                                   "Krever ikke rapport",
                                   name="tilskuddsordning_types", convert_unicode=True)


class Tilskuddsordning(Base):
    __tablename__ = "tilskuddsordninger"
    id = Column(Integer, primary_key=True)
    navn = Column(String, nullable=False)
    publisert = Column(Boolean, nullable=False, default=False)
    type = Column(tilskuddsordning_type_enums, default=None, info={'mandatory': True})
    soknadsfrist = Column(Date, nullable=True)
    rapportfrist = Column(Date, nullable=True)
    budsjett = Column(Integer, nullable=True)
    budsjett_i_balanse = Column(Boolean, nullable=True)
    innledningstekst = Column(String, nullable=True)
    prosjekttekst = Column(String, nullable=True)
    budsjettekst = Column(String, nullable=True)
    godkjenner_id = Column(String, nullable=True)
    godkjenner_tittel = Column(String, nullable=True)
    lenke_til_retningslinjer = Column(String, nullable=True)
    saksbehandlere = relationship("TilskuddsordningSaksbehandler", lazy=True, cascade="all, delete-orphan",
                                  passive_deletes=False)


class TilskuddsordningSaksbehandler(Base):
    __tablename__ = "tilskuddsordning_saksbehandler"
    tilskuddsordning_id = Column(Integer, ForeignKey("tilskuddsordninger.id"), primary_key=True)
    saksbehandler_id = Column(String, primary_key=True)


class Rapport(MandatoryFieldsValidator, Base):
    __tablename__ = 'rapport'
    id = Column(Integer, primary_key=True)
    soknad_id = Column(Integer, ForeignKey("soknader.id"))
    prosjekt_gjennomforing = Column(String(800), info={'mandatory': True})
    prosjekt_avvik = Column(String(300))
    budsjett_avvik = Column(String(300))
    resultat_kommentar = Column(String(300), info={'mandatory': True})
    arrangement = association_proxy('rapport_arrangement', 'arrangement')
    vedlegg = association_proxy("rapport_vedlegg", "vedlegg")
    vedlagtlink = association_proxy("rapport_vedlagtlink", "vedlagtlink")
    okonomipost = association_proxy('rapport_okonomipost', 'okonomipost')
    saksbehandler_kommentar = Column(String(300))

    def validate_rapport_for_levering(self):
        return self.validate_mandatory_fields()

    def validate_mandatory_fields(self):
        super(Rapport, self).validate_mandatory_fields()
        # require at least one arrangement
        if len(self.arrangement) == 0:
            self.add_missing('arrangement')
        # validate mandatory fields of arrangements
        arr_errors = []
        for arr in self.arrangement:
            error = arr.validate_mandatory_fields()
            if len(error) > 0:
                arr_errors.append(error)
        if arr_errors:
            self.add_missing('arrangement', arr_errors)

        # validate mandatory fields of arrangements
        okopost_errors = []
        for okonomipost in self.okonomipost:
            error = okonomipost.validate_mandatory_fields()
            if len(error) > 0:
                okopost_errors.append(error)
            found = False
            for okonomibelop in okonomipost.okonomibelop:
                if okonomibelop.okonomibelop_type == "Regnskap":
                    found = True

            if not found:
                rez = {"okonomipost": "Mandatory"}
                okopost_errors.append(rez)

        if okopost_errors:
            self.add_missing('okonomipost', okopost_errors)

        return self.missing


class RapportVedlegg(Base):
    __tablename__ = 'rapport_vedlegg'
    vedlegg_id = Column(Integer, ForeignKey("vedlegg.id"), primary_key=True)
    vedlegg = relationship("Vedlegg",
                           lazy=True,
                           cascade="all, delete-orphan",
                           backref=backref("rapport_vedlegg", lazy=True, cascade="all, delete-orphan"),
                           single_parent=True)
    rapport_id = Column(Integer, ForeignKey("rapport.id"), primary_key=True)
    rapport = relationship(Rapport,
                           backref=backref("rapport_vedlegg", lazy=True, cascade="all, delete-orphan"),
                           single_parent=True)

    def __init__(self, vedlegg=None, rapport=None):
        self.vedlegg = vedlegg
        self.rapport = rapport


class RapportVedlagtlink(Base):
    __tablename__ = 'rapport_vedlagtlink'
    vedlagtlink_id = Column(Integer, ForeignKey("vedlagtlink.id"), primary_key=True)
    vedlagtlink = relationship("Vedlagtlink",
                               lazy=True,
                               cascade="all, delete-orphan",
                               backref=backref("rapport_vedlagtlink", lazy=True, cascade="all, delete-orphan"),
                               single_parent=True)
    rapport_id = Column(Integer, ForeignKey("rapport.id"), primary_key=True)
    rapport = relationship(Rapport,
                           backref=backref("rapport_vedlagtlink", lazy=True, cascade="all, delete-orphan"),
                           single_parent=True)

    def __init__(self, vedlagtlink=None, rapport=None):
        self.vedlagtlink = vedlagtlink
        self.rapport = rapport


class RapportArrangement(Base):
    __tablename__ = 'rapport_arrangement'
    arrangement_id = Column(Integer, ForeignKey("arrangement.id"), primary_key=True)
    arrangement = relationship("Arrangement",
                               lazy=True,
                               cascade="all, delete-orphan",
                               backref=backref("rapport_arrangement", lazy=True, cascade="all, delete-orphan"),
                               single_parent=True)
    rapport_id = Column(Integer, ForeignKey("rapport.id"), primary_key=True)
    rapport = relationship(Rapport,
                           backref=backref("rapport_arrangement", lazy=True, cascade="all, delete-orphan"),
                           single_parent=True)

    def __init__(self, arrangement=None, rapport=None):
        self.arrangement = arrangement
        self.rapport = rapport


class RapportOkonomipost(Base):
    __tablename__ = 'rapport_okonomipost'
    okonomipost_id = Column(Integer, ForeignKey("okonomi_post.id"), primary_key=True)
    okonomipost = relationship("OkonomiPost",
                               lazy=True,
                               cascade="all, delete-orphan",
                               backref=backref("rapport_okonomipost", lazy=True, cascade="all, delete-orphan"),
                               single_parent=True)
    rapport_id = Column(Integer, ForeignKey("rapport.id"), primary_key=True)
    rapport = relationship(Rapport,
                           backref=backref("rapport_okonomipost", lazy=True, cascade="all, delete-orphan"),
                           single_parent=True)

    def __init__(self, okonomipost=None, rapport=None):
        self.okonomipost = okonomipost
        self.rapport = rapport


standardtekst_type_enums = Enum("Andre opplysninger",
                                "Merk følgende",
                                name="standardtekst_type_enums", convert_unicode=True)


class StandardTekst(Base):
    __tablename__ = "standardtekst"
    id = Column(Integer, primary_key=True)
    navn = Column(String, nullable=True, unique=True)
    type = Column(standardtekst_type_enums, nullable=True)
    tekst = Column(String, nullable=True)


class Vedtak(Base):
    __tablename__ = 'vedtak'
    id = Column(Integer, primary_key=True)
    soknad_id = Column(Integer, ForeignKey("soknader.id"), nullable=False)
    innstilt_belop = Column(Integer, nullable=True)
    vedtatt_belop = Column(Integer, nullable=True)
    intern_merknad = Column(String(300), nullable=True)
    vedtaksdato = Column(DateTime, nullable=True)
    vedtakstekst = Column(String(1000))
    andre_opplysninger = Column(String(1000))
    rapportfrist = Column(Date, nullable=True)
    endre_rapportfrist_arsak = Column(String(150))
    klage = relationship("Klage")
    purret_dato = Column(DateTime)
    rapport_purret_dato = Column(DateTime)
    behandlet_av_formannskapet = Column(Boolean, nullable=False, default=False)
    vedtaksbrev_file_ref = Column(String(), nullable=True)
    tilskuddsordning_type = Column(tilskuddsordning_type_enums, nullable=False, default=None)


class Klage(Base):
    __tablename__ = 'klage'
    id = Column(Integer, primary_key=True)
    soknad_id = Column(Integer, ForeignKey("soknader.id"), nullable=False)
    vedtak_id = Column(Integer, ForeignKey("vedtak.id"), nullable=False)
    levertdato = Column(DateTime, nullable=False)
    begrunnelse = Column(String(300), nullable=True)


class Utbetaling(Base):
    __tablename__ = "utbetalinger"
    id = Column(Integer, primary_key=True)
    soknad_id = Column(Integer, ForeignKey("soknader.id"), nullable=False)
    tekst = Column(String(15), nullable=True)
    utbetalt_belop = Column(Integer, nullable=True)
    utbetalingsdato = Column(Date, nullable=True)
    registrertdato = Column(DateTime, nullable=False)


arkivverdig_info_type_enums = Enum("ny_sak",
                                   "ny_journalpost",
                                   name="arkivverdig_info_types", convert_unicode=True)


class ArkivverdigInfo(Base):
    '''
        Arkivverdig informasjon knytett til en søknad.

        Hver gang det blir utført en operasjon på en søknad som medfører behov for arkivering (innsendelse av
        søknad, klage osv...) så skal informasjon lagres som ArkivverdigInfo.

        Det er per dagensdato ingen SQLAlchemy relation deklarert mellom Soknad og ArkivverdigInfo. Det betyr
        at det er ikke mulig å slette Soknad uten å først slette alle ArkivverdigInfo som har FK mot den.

        Sletting av søknad støttes ikke per skrivende tidspunkt, og vi vet ikke om det er riktig eller ikke å
        cascade delete alle ArkivverdigInfo knyttet til Søknad. Så vi lar koden feile, den dagen man skal innføre
        sletting av Soknad så får man ta stilling til ArkivverdigInfo.
    '''
    __tablename__ = 'arkivverdig_info'
    id = Column(Integer, primary_key=True)
    soknad_id = Column(Integer, ForeignKey("soknader.id"), nullable=False)
    opprettet_dato = Column(DateTime, nullable=False)
    sendt_til_arkivet = Column(Boolean, nullable=False, default=False)
    type = Column(arkivverdig_info_type_enums, nullable=False, info={'mandatory': True})
    arkiv_metadata = Column(JSON, nullable=False)

    def __repr__(self):
        return "id=%s, soknad_id=%s, sendt_til_arkivet=%s" % (self.id, self.soknad_id, self.sendt_til_arkivet)


@listens_for(Soknad, 'before_update')
def validate_mandatory_fields_for_soknad(mapper, connection, target):
    if target.status == 'Innsendt':
        error = target.validate_soknad_for_innsending()
        if error:
            raise ValueError("validation of mandatory fields failed", error)


@listens_for(Vedlegg, 'after_delete')
def delete_file(mapper, connection, target):
    backend = FileBackend(None, filename=target.file_ref, path=os.environ.get('DOCUMENTS_PATH', '/tmp'))

    if backend is None:
        current_app.logger.warn('Could not delete associated file. Unknown backend for model: %s (id: %d)', target,
                                target.id)
    else:
        backend.delete()
