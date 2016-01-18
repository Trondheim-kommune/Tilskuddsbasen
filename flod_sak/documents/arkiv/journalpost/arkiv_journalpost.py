# -*- coding: utf-8 -*-
from datetime import datetime
import os
import shutil

from flask import current_app

from documents.documents_utils import generate_dir_path, save_file_to_disk, get_rel_vedlegg_path, \
    get_rel_saksvedlegg_path, get_rel_vedtaksmappe_path, get_rel_arkivmappe_path
from domain.models import ArkivverdigInfo
from repo.arkivverdig_info_repo import ArkivverdigInfoRepo

AK_LAST_OPP_SOKNADSVEDLEGG_ = u"Last opp vedlegg på søknad"
AK_LAST_OPP_RAPPORTVEDLEGG_ = u"Last opp vedlegg på rapport"
AK_LAST_OPP_SAKSVEDLEGG_ = u"Last opp vedlegg på sak"
AK_LEVER_RAPPORT_ = u"Lever Rapport"
AK_KLAGE_ = u"Klage"
AK_FATT_VEDATAK_ = u"Fatt vedatak"
AK_TILBAKE_TIL_SAKSBEHANDLING_ = u"Tilbake til saksbehandling"
AK_BEHANDLE_SOKNAD_ = u"Behandle søknad"


class InvalidArkivExtensionError(RuntimeError):
    pass


def save_journalpost_for_soknad(soknad, organisation, person, filecontent, filename, is_utgaaende_dokument=False):
    beskrivelse = u"Søknad"
    docs = [new_file_to_doc(beskrivelse, filecontent, filename, soknad)] + vedlegg_to_docs(soknad, soknad.vedlegg)

    return save_journalpost(soknad,
                            organisation,
                            person,
                            u"Søknad",
                            docs,
                            is_utgaaende_dokument=is_utgaaende_dokument)


def new_file_to_doc(beskrivelse, filecontent, filename, soknad):
    return {"beskrivelse": beskrivelse,
            "filnavn": filename,
            "file_ref": save_new_dokument_to_disk(filecontent, filename, dest_dir_rel_path=get_rel_arkivmappe_path(soknad))}


def vedlegg_to_docs(soknad, vedlegg):
    return [{"beskrivelse": d.beskrivelse,
             "filnavn": d.filnavn,
             "file_ref": copy_dokument_on_disk(d.file_ref, d.file_ref, get_rel_vedlegg_path(soknad.id), dest_dir_rel_path=get_rel_arkivmappe_path(soknad))}
            for d in vedlegg]


def save_journalpost_for_rapport(soknad, rapport, organisation, person, filecontent, filename, is_utgaaende_dokument=False):
    beskrivelse = u"Rapport"
    docs = [new_file_to_doc(beskrivelse, filecontent, filename, soknad)] + vedlegg_to_docs(soknad, rapport.vedlegg)

    return save_journalpost(soknad,
                            organisation,
                            person,
                            u"Rapport",
                            docs,
                            is_utgaaende_dokument=is_utgaaende_dokument)


def save_journalpost_for_klage(soknad, organisation, person, filecontent, filename, is_utgaaende_dokument=False):
    beskrivelse = u"Klage"
    return save_journalpost(soknad,
                            organisation,
                            person,
                            u"Klage",
                            docs=[new_file_to_doc(beskrivelse, filecontent, filename, soknad)],
                            is_utgaaende_dokument=is_utgaaende_dokument)


def save_journalpost_for_saksvedlegg(soknad, organisation, person, vedlegg, is_utgaaende_dokument=False):
    docs = [{"beskrivelse": vedlegg.beskrivelse,
             "filnavn": vedlegg.filnavn,
             "file_ref": copy_dokument_on_disk(vedlegg.file_ref,
                                               vedlegg.file_ref,
                                               get_rel_saksvedlegg_path(soknad),
                                               dest_dir_rel_path=get_rel_arkivmappe_path(soknad))}]
    save_journalpost(soknad, organisation, person, create_tittel1(vedlegg.beskrivelse, vedlegg.filnavn), docs, is_utgaaende_dokument)


def save_journalpost_for_vedtaksbrev(soknad, organisation, person, vedtak, is_utgaaende_dokument=False):
    docs = [{"beskrivelse": "",
             "filnavn": "vedtak-%s.pdf" % vedtak.id,
             "file_ref": copy_dokument_on_disk(vedtak.vedtaksbrev_file_ref,
                                               vedtak.vedtaksbrev_file_ref,
                                               get_rel_vedtaksmappe_path(soknad, vedtak),
                                               dest_dir_rel_path=get_rel_arkivmappe_path(soknad))}]
    save_journalpost(soknad, organisation, person, "Vedtak", docs, is_utgaaende_dokument)


def save_journalpost(soknad, organisation, person, beskrivelse, docs, is_utgaaende_dokument=False):
    metadata = generate_G1007_ny_journalpost_metadata(soknad,
                                                      organisation,
                                                      person,
                                                      beskrivelse,
                                                      docs,
                                                      is_utgaaende_dokument=is_utgaaende_dokument)
    create_arkivverdig_info(soknad, metadata)


def create_arkivverdig_info(soknad, metadata):
    arkivverdig_info = ArkivverdigInfo()
    arkivverdig_info.soknad_id = soknad.id
    arkivverdig_info.opprettet_dato = datetime.now()
    arkivverdig_info.type = "ny_journalpost"
    arkivverdig_info.arkiv_metadata = metadata
    ArkivverdigInfoRepo.save(arkivverdig_info, autocommit=False)


def copy_dokument_on_disk(file_ref, filename, src_file_rel_path, dest_dir_rel_path=""):
    document_root_path = os.environ.get('DOCUMENTS_PATH', '/tmp')
    assert (os.path.isdir(document_root_path))

    src_dir = "%s/%s" % (document_root_path, src_file_rel_path)
    target_dir = generate_dir_path(document_root_path, dest_dir_rel_path)

    shutil.copyfile("%s/%s" % (src_dir, file_ref),
                    "%s/%s" % (target_dir, filename))

    current_app.logger.info("Vedlegg '%s' archived as journalpost %s/%s." % (file_ref, target_dir, filename))

    return "%s/%s" % (target_dir, filename)


def save_new_dokument_to_disk(filecontent, filename, dest_dir_rel_path=""):
    document_root_path = os.environ.get('DOCUMENTS_PATH', '/tmp')
    assert (os.path.isdir(document_root_path))

    generated_file_name, target_dir = save_file_to_disk(filecontent, filename,
                                                        relative_path=dest_dir_rel_path,
                                                        use_uuid=False)

    current_app.logger.info("Journalpost file '%s' archived in %s." % (filename, target_dir))

    return "%s/%s" % (target_dir, generated_file_name)


def generate_G1007_ny_journalpost_metadata(soknad, organisation, person, beskrivelse, docs,
                                           is_utgaaende_dokument=False):
    metadata = {
        "EksterntSaksnr": soknad.id,
        "Dokumenttype": u"U" if is_utgaaende_dokument else u"I",
        "Adressat1": {
            "Fornavn": "",
            "Etternavn": organisation['name'],
            "Adresse1": organisation['business_address']['address_line'] if organisation['business_address'] is not None else "",
            "Postnr": organisation['business_address']['postal_code'] if organisation['business_address'] else "",
            "Sted": organisation['business_address']['postal_city'] if organisation['business_address'] else "",
            "Landkode": u"NO",
            "E-postadresse": organisation['email_address'],
            "Orgnr":
                organisation['org_number'] if organisation['org_number'] is not None and organisation['org_number'] != ""
                else "",
            "Foedselsnr":
                "" if organisation['org_number'] is not None and organisation['org_number'] != ""
                else person['national_identity_number'] if 'national_identity_number' in person else "",
        },
        # Det er saksbehandler sin adfs ident som må brukes mot arkivet, men søkere kan ikke få tak i det,
        # informasjonen er ikke public. Så den koden som skal laste opp i arkivet skal måtte ta seg av å hente
        # saksbehandler basert på id-en som lagres her...
        "Saksbehandler": soknad.saksbehandler_id,
        "Tittel1": beskrivelse,
        "Tilgangsgruppe": u"1",
        "Avskrivningsmaate": u"1" if not is_utgaaende_dokument else "",
        "ArkivKontekstReferanse": u"U",
        "Dokument": [{"DokumentTittel": create_tittel1(d['beskrivelse'], d['filnavn']),
                      "FilNavn": d['filnavn'],
                      "FilInnhold": {
                          "mimeType": determine_mimetype(d['filnavn']),
                          "file_ref": d['file_ref']}} for d in docs],
        "Journalstatus": "" if is_utgaaende_dokument else u"2"
    }
    current_app.logger.debug("Metadata for ny journalpost generated: '%s'" % (metadata))
    return metadata


def create_tittel1(beskrivelse, filename):
    return beskrivelse if (beskrivelse and beskrivelse != "") else filename


def determine_mimetype(filename):
    name, extension = os.path.splitext(filename)
    extension = extension.lower()

    if extension == ".pdf":
        return "application/pdf"

    elif extension in [".doc", ".docx"]:  # eller .docx "application/vnd.openxmlformats-officedocument.wordprocessingml.document"?
        return "application/msword"

    elif extension == ".xls":
        return "application/vnd.ms-excel"

    elif extension == ".xlsx":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    elif extension == ".odt":
        return "application/vnd.sun.xml.writer"  # eller "application/vnd.oasis.opendocument.text"?

    elif extension == ".ods":
        return "application/vnd.oasis.opendocument.spreadsheet"

    elif extension == ".xml":
        return "application/xml"

    elif extension in [".jpeg", ".jpg"]:
        return "image/jpeg"

    elif extension in [".tiff", ".tif"]:
        return "image/tiff"

    elif extension == ".mp2":
        return "video/mpeg"

    elif extension == ".mp3":
        return "audio/mpeg"

    elif extension == ".txt":
        return "text/plain"

    else:
        raise InvalidArkivExtensionError(u"Filer av typen '%s' støttes ikke." % extension)
