# -*- coding: utf-8 -*-
from flask import request, current_app
from flask.ext.bouncer import requires, POST
from flask.ext.restful import abort

from api.base_resource import BaseResource
from repo.arkivverdig_info_repo import ArkivverdigInfoRepo
from documents.arkiv import send_to_arkiv

class ArkivverdigInfoProcessorResource(BaseResource):
    @requires(POST, 'ArkivverdigInfo')
    def post(self):
        data = request.get_json()

        batch_size = None
        if data and 'batch_size' in data:
            batch_size = data['batch_size']
            if batch_size <= 0:
                abort(400, __errors__=[u'Invalid batch_size=%s, it has to be a positive integer.'])

        arkivverdig_info_list = ArkivverdigInfoRepo.find_arkivverdig_info_to_send_to_arkiv(
            **({"batch_size": batch_size} if batch_size else {}))

        processed_ids = []
        for arkivverdig_info in arkivverdig_info_list:
            current_app.logger.debug("Sending arkivverdig_info id=%s to arkiv." % arkivverdig_info.id)
            send_to_arkiv(arkivverdig_info)
            ArkivverdigInfoRepo.mark_as_sent(arkivverdig_info)
            processed_ids.append(arkivverdig_info.id)

        return processed_ids, 201
