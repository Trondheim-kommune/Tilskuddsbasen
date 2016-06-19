# -*- coding: utf-8 -*-
from datetime import datetime
import tempfile
import zipfile
import os
import shutil
from flask import current_app

import jinja2
import mmap

TIMESTAMP_FORMAT = '%Y-%M-%d-%H-%M-%S-%f'


def remove_from_zip(orginalzipfname, newzipfname, *filenames):
    tempdir = tempfile.mkdtemp()
    try:
        tempname = os.path.join(tempdir, 'tilskudd-generated-%s.zip' % datetime.now().strftime(TIMESTAMP_FORMAT))
        with zipfile.ZipFile(orginalzipfname, 'r') as zipread:
            with zipfile.ZipFile(tempname, 'w') as zipwrite:
                for item in zipread.infolist():
                    if item.filename not in filenames:
                        data = zipread.read(item.filename)
                        zipwrite.writestr(item, data)
        shutil.move(tempname, newzipfname)
    finally:
        shutil.rmtree(tempdir)


def create_docx_from_template(docx_fname,
                              template_in_docx_fname=u'word/document.xml',
                              **template_data):
    """
    Creates a new docx from a given docx template and returns the resulting docx and its size.

    :param docx_fname: the path to the docx file to use as template.
    :param template_in_docx_fname: the default should i many case be good enough.
    :param template_data: the data to render the template with.
    :return: the resulting docx as bytes and its size
    """
    tempdir = tempfile.mkdtemp()
    try:
        new_zip_fname = os.path.join(tempdir, "tilskudd-generated-%s.docx" % datetime.now().strftime(TIMESTAMP_FORMAT))

        template_zip_fname = "%s/%s/%s" % (current_app.root_path, current_app.template_folder, docx_fname)

        # create zip from original zip, without the docx template (we´ll generate the result)
        remove_from_zip(template_zip_fname, new_zip_fname, template_in_docx_fname)

        # read template from original zip
        zf = zipfile.ZipFile(template_zip_fname)
        try:
            original_document_contents = zf.read(template_in_docx_fname).decode(encoding="utf-8")
        finally:
            zf.close()


        # render template
        template = jinja2.Template(original_document_contents, autoescape=True)
        rendered_document = template.render(**template_data)

        # append template to new zip
        zf = zipfile.ZipFile(new_zip_fname, mode='a')

        try:
            zf.writestr(template_in_docx_fname, rendered_document.encode(encoding="utf-8"))
        finally:
            zf.close()
        size = os.path.getsize(new_zip_fname)

        docx_file = open(new_zip_fname, mode='r')
        return docx_file.read(), size
    finally:
        if docx_file is not None:
            docx_file.close()
        shutil.rmtree(tempdir)




