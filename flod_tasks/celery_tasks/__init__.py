# -*- coding: utf-8 -*-
import os

SAK_URL = os.environ.get('SAK_URL')
SAK_VERSION = os.environ.get('SAK_VERSION', 'v1')

ARKIV_URL = os.environ.get('ARKIV_URL')
ARKIV_SAK_URL = ARKIV_URL + '/T10121_ArkivSak/ProxyServices/ArkivSak'
JOURNAL_POSTERING_URL = ARKIV_URL + '/T10122_Journalpostering/ProxyServices/Journalpostering'

USERS_URL = os.environ.get('USERS_URL')
USERS_VERSION = os.environ.get('USER_VERSION', 'v1')

DEFAULT_RETRY_DELAY = int(os.environ.get('DEFAULT_RETRY_DELAY', 600))
DEFAULT_MAX_RETRIES = int(os.environ.get('DEFAULT_MAX_RETRIES', 10))
