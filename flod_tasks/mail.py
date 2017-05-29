# -*- coding: utf-8 -*-

from __future__ import print_function

import os
import smtplib

from email.mime.text import MIMEText
from email.header import Header


def smtp_server():
    host = os.environ.get('MAIL_SERVER', 'localhost')
    port = os.environ.get('MAIL_PORT', 25)
    username = os.environ.get('MAIL_USERNAME', '')
    password = os.environ.get('MAIL_PASSWORD', '')
    tls = os.environ.get('MAIL_USE_TLS', False)
    server = smtplib.SMTP(host, port, timeout=30)
    if tls:
        server.starttls()
    # Username or password equal to '' implies no login.
    if '' not in (username, password):
        server.login(username, password)
    return server


def _print_email(subject, sender, recipients, body):
    subject = subject.encode('utf-8')
    recipients = str(recipients).encode('utf-8')
    sender = sender.encode('utf-8')
    body = body.encode('utf-8')

    email = """
        Subject: %s
        To: %s
        From: %s
        Body: %s
        """ % (subject, recipients, sender, body)

    print(email)


def _send_email(subject, sender, recipients, body):
    server = smtp_server()
    msg = MIMEText(body.encode('utf-8'), 'plain', 'utf-8')
    msg['From'] = sender
    msg['To'] = ', '.join(recipients)
    msg['Subject'] = Header(subject.encode('utf-8'), 'utf-8')
    server.sendmail(sender, recipients, msg.as_string())
    server.quit()


def send_email(subject, sender, recipients, msg):
    is_debug = os.environ.get('DEBUG') == 'True'
    if is_debug:
        _print_email(subject, sender, recipients, msg)

    _send_email(subject, sender, recipients, msg)
