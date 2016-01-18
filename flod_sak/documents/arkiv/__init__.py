# -*- coding: utf-8 -*-
from celery import Celery
from flask.ext.restful import abort

celery_app = Celery(broker='amqp://guest:guest@localhost:5672//')


def send_to_arkiv(arkivverdig_info):
    if arkivverdig_info.type == "ny_sak":
        celery_app.send_task('celery_tasks.arkiv_tasks.create_sak_in_archive',
                             queue='arkiv',
                             kwargs={'arkivverdig_info_id': arkivverdig_info.id,
                                     'metadata': arkivverdig_info.arkiv_metadata
                                     })

    elif arkivverdig_info.type == "ny_journalpost":
        celery_app.send_task('celery_tasks.arkiv_tasks.create_journalpost_in_archive',
                             queue='arkiv',
                             kwargs={'arkivverdig_info_id': arkivverdig_info.id,
                                     'metadata': arkivverdig_info.arkiv_metadata
                                     })
    else:
        abort(500, __errors__=[u'Ukjent arkiv aksjonstype "%s".' % arkivverdig_info.type])
