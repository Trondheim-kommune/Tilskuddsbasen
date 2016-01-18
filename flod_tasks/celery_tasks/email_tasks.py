# -*- coding: utf-8 -*-
from mail import send_email
from celery_app import app
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)


@app.task
def send_email_task(subject, sender, recipients, body):
    recipients = [x for x in recipients if x is not None]
    send_email(subject, sender, recipients, body)
