# -*- coding: utf-8 -*-
from datetime import datetime
import os
import shutil
import tempfile
from flask import current_app
from subprocess import call, check_call, CalledProcessError

TIMESTAMP_FORMAT = '%Y-%M-%d-%H-%M-%S-%f'

def convert_to_pdf(data):
    '''
    Writes the data to file and uses libreoffice to convert it to pdf. Supports any kind of data which
    represent a file which libreoffice can open.

    :param data: the data to convert, expected to be bytes.
    :return: the converted pdf as bytes and its size
    '''
    tempdir = tempfile.mkdtemp()
    try:
        now = datetime.now()
        docx_fname = os.path.join(tempdir, "convert_to_pdf-%s.docx" % now.strftime(TIMESTAMP_FORMAT))
        pdf_fname = os.path.join(tempdir, "convert_to_pdf-%s.pdf" % now.strftime(TIMESTAMP_FORMAT))

        # write to data to file
        docx_f = open(docx_fname, "wb")
        docx_f.write(data)
        docx_f.close()

        # use libreoffice to convert to pdf
        libreoffice_cmd = u"libreoffice --headless --convert-to pdf %s --outdir %s" % (docx_fname, tempdir)
        current_app.logger.info("Converting %s to %s with libreoffice cmd='%s'..." % (docx_fname, pdf_fname, libreoffice_cmd))
        check_call(libreoffice_cmd.split(' '))

        # retrieve the generated pdf and return its contents and size
        pdf_size = os.path.getsize(pdf_fname)
        pdf_file = open(pdf_fname, "r")
        return pdf_file.read(), pdf_size
    except CalledProcessError as e:
        current_app.logger.error(e)
    finally:
        if pdf_file is not None:
            pdf_file.close()
        shutil.rmtree(tempdir)
