# -*- coding: utf-8 -*-
from datetime import datetime

from domain.models import Arrangement
from repo.base_repo import BaseRepo


class ArrangementRepo(BaseRepo):
    # used by BaseRepo
    model_class = Arrangement

    @classmethod
    def map_model(cls, arrangement, data):
        ArrangementRepo.update_model(arrangement, 'sted', data)
        ArrangementRepo.update_model(arrangement, 'tidspunkt', data)
        arrangement.start_dato = datetime.strptime(data.get('start_dato'), "%Y-%m-%d").date() if data.get(
            'start_dato') else None
        arrangement.slutt_dato = datetime.strptime(data.get('slutt_dato'), "%Y-%m-%d").date() if data.get(
            'slutt_dato') else None