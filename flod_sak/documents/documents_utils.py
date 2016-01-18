# -*- coding: utf-8 -*-
import os
from flask import current_app
from domain.storage import uuid_with_ext, get_backend


def get_rel_arkivmappe_path(soknad):
    return u"soknad-%s/archive" % (soknad.id)

def get_rel_vedtaksmappe_path(soknad, vedtak):
    return u"soknad-%s/vedtak-%s" % (soknad.id, vedtak.id)

def get_rel_saksvedlegg_path(soknad):
    return u"soknad-%s/saksvedlegg" % soknad.id

def get_rel_vedlegg_path(soknad_id):
    return u"soknad-%s/vedlegg" % soknad_id

def get_rel_vedtaksbrev_path(soknad, vedtak):
    vedtaksbrev_katalog_path = get_rel_vedtaksmappe_path(soknad, vedtak)
    return u"%s/%s" % (vedtaksbrev_katalog_path, vedtak.vedtaksbrev_file_ref)

def get_abs_vedtaksbrev_path(soknad, vedtak):
    document_root_path = os.environ.get('DOCUMENTS_PATH', '/tmp')
    assert(os.path.isdir(document_root_path))
    return u"%s/%s" %(document_root_path, get_rel_vedtaksbrev_path(soknad, vedtak))

def save_file_to_disk(file_content, filename, relative_path="", use_uuid=True):
    generated_file_name = uuid_with_ext(filename) if use_uuid else filename
    document_root_path = os.environ.get('DOCUMENTS_PATH', '/tmp')
    assert(os.path.isdir(document_root_path))

    target_dir = generate_dir_path(document_root_path, relative_path)

    file = open(u"%s/%s" % (target_dir, generated_file_name), 'w')
    file.write(file_content)
    file.close()
    current_app.logger.info(u"File '%s' written to %s." % (generated_file_name, target_dir))

    return generated_file_name, target_dir

def generate_dir_path(target_dir, relative_path):
    for path in relative_path.split("/"):
        if path != '':
            sub_dir = u"%s/%s" % (target_dir, path)
            if not os.path.exists(sub_dir):
                os.makedirs(sub_dir)
                current_app.logger.info(u"Created directory %s!" % sub_dir)
            target_dir = sub_dir
    return target_dir