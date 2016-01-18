# -*- coding: utf-8 -*-
import json
from celery_app import app
from celery.utils.log import get_task_logger
from celery_tasks import SAK_URL, SAK_VERSION
import requests
from flod_common.session.utils import make_superuser_auth_cookie

logger = get_task_logger(__name__)


def send_reminder(url, minutes=None, reminder_slack=None, min_minutes_since_last_reminder=None):
    if minutes is None or not isinstance(minutes, int):
        logger.error("send_soknad_reminder_task - antall minutter ikke satt")
        return

    data = {'minutes': minutes}
    if reminder_slack is not None:
        data.update(reminder_slack=reminder_slack)
    if min_minutes_since_last_reminder is not None:
        data.update(min_minutes_since_last_reminder=min_minutes_since_last_reminder)

    auth_token_cookie = make_superuser_auth_cookie()
    headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}

    return requests.post(url, data=json.dumps(data), cookies=auth_token_cookie, headers=headers)


@app.task
def send_soknad_reminder_task(minutes=None, reminder_slack=None, min_minutes_since_last_reminder=None):
    url = '%s/api/%s/purringer/soknader/' % (SAK_URL, SAK_VERSION)
    response = send_reminder(url, minutes, reminder_slack, min_minutes_since_last_reminder)

    if response.status_code != 201:
        logger.error("Could not trigger the sending of soknad reminders, response has status %s!\n response=%s"
                     % (response.status_code, response))


@app.task
def send_rapport_reminder_task(minutes=None, reminder_slack=None, min_minutes_since_last_reminder=None):
    url = '%s/api/%s/purringer/rapporter/' % (SAK_URL, SAK_VERSION)
    response = send_reminder(url, minutes, reminder_slack, min_minutes_since_last_reminder)

    if response.status_code != 201:
        logger.error("Could not trigger the sending of rapport reminders, response has status %s!\n response=%s"
                     % (response.status_code, response))
