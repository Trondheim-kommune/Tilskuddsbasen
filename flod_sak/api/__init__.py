# -*- coding: utf-8 -*-
from api.arkivverdig_info_processor_resource import ArkivverdigInfoProcessorResource

from api.erv_generator_resource import ErvGeneratorResource
from api.export_rapporter_resource import ExportRapporterResource
from api.export_soknader_resource import ExportSoknaderResource
from api.soknader_filter_resource import SoknaderFilterResource
from api.query_resource import QueryResource
from api.rapport_resource import RapportResource
from api.soknader_purringer_resource import SoknaderPurringerResource
from api.rapporter_purringer_resource import RapporterPurringerResource
from api.standardtekst_resource import StandardTekstResource
from api.sak_api import SakApi, StreamConsumingMiddleware

from api.action_soknad_resource import SoknadActionResource
from api.soknad_resource import SoknadResource
from api.tilskuddsordning_action_resource import TilskuddsordningActionResource
from api.tilskuddsordning_resource import TilskuddsordningResource
from api.vedtaksbrev_generator_resource import VedtaksbrevGeneratorResource
from api.vedtaksbrev_resource import VedtaksbrevResource
from api.saksvedlegg_resource import SaksvedleggResource
from vedlegg_resource import VedleggResource


def create_api(app, api_version,
               soknad_resource=SoknadResource,
               rapport_resource=RapportResource,
               tilskuddsordning_resource=TilskuddsordningResource,
               tilskuddsordning_action_resource=TilskuddsordningActionResource,
               action_soknad_resource=SoknadActionResource,
               soknader_filter_resource=SoknaderFilterResource,
               vedlegg_resource=VedleggResource,
               saksvedlegg_resource=SaksvedleggResource,
               erv_generator_resource=ErvGeneratorResource,
               vedtaksbrev_generator_resource=VedtaksbrevGeneratorResource,
               vedtaksbrev_resource=VedtaksbrevResource,
               query_resource=QueryResource,
               standardtekst_resource=StandardTekstResource,
               soknader_purringer_resource=SoknaderPurringerResource,
               rapporter_purringer_resource=RapporterPurringerResource,
               export_soknader_resource=ExportSoknaderResource,
               export_rapporter_resource=ExportRapporterResource,
               arkivverdig_info_processor_resource=ArkivverdigInfoProcessorResource):
    api = SakApi(app)

    # Some browsers (Chrome among others) will need the streams to be consumed to return correctly
    # we set up one middleware which will take care of this.
    # It´s useful when upload is aborted by flash when the size of the file is bigger than max allowed.
    app.wsgi_app = StreamConsumingMiddleware(app.wsgi_app)

    api.add_resource(soknad_resource,
                     '/api/%s/soknad/<int:soknad_id>' % api_version,
                     '/api/%s/soknad/' % api_version)

    api.add_resource(action_soknad_resource,
                     '/api/%s/soknad/<int:soknad_id>/actions/' % api_version,
                     '/api/%s/soknad/<int:soknad_id>/actions/<string:action_id>' % api_version)

    api.add_resource(soknader_purringer_resource,
                     '/api/%s/purringer/soknader/' % api_version)

    api.add_resource(rapporter_purringer_resource,
                     '/api/%s/purringer/rapporter/' % api_version)

    api.add_resource(soknader_filter_resource,
                     '/api/%s/filters/soknader/' % api_version)

    api.add_resource(query_resource,
                     '/api/%s/queries/' % api_version)

    api.add_resource(tilskuddsordning_resource,
                     '/api/%s/tilskuddsordning/<int:tilskuddsordning_id>' % api_version,
                     '/api/%s/tilskuddsordning/' % api_version)

    api.add_resource(tilskuddsordning_action_resource,
                     '/api/%s/tilskuddsordning/<int:tilskuddsordning_id>/<string:action_id>' % api_version)
    api.add_resource(vedlegg_resource,
                     '/api/%s/vedlegg/<int:vedlegg_id>' % api_version,
                     '/api/%s/vedlegg/' % api_version)

    api.add_resource(saksvedlegg_resource,
                     '/api/%s/soknad/<int:soknad_id>/saksvedlegg/<int:saksvedlegg_id>' % api_version,
                     '/api/%s/soknad/<int:soknad_id>/saksvedlegg/' % api_version)

    api.add_resource(rapport_resource,
                     '/api/%s/soknad/<int:soknad_id>/rapport/' % api_version,
                     '/api/%s/soknad/<int:soknad_id>/rapport/<int:rapport_id>' % api_version)

    api.add_resource(erv_generator_resource,
                     '/api/%s/soknad/<int:soknad_id>/utbetaling/nyeste/generated-erv' % api_version)

    api.add_resource(vedtaksbrev_generator_resource,
                     '/api/%s/soknad/<int:soknad_id>/vedtak/nyeste/generated-vedtaksbrev' % api_version)

    api.add_resource(vedtaksbrev_resource,
                     '/api/%s/soknad/<int:soknad_id>/vedtak/nyeste/vedtaksbrev' % api_version)

    api.add_resource(standardtekst_resource,
                     '/api/%s/standardtekst/<int:standardtekst_id>' % api_version,
                     '/api/%s/standardtekst/' % api_version)

    api.add_resource(export_soknader_resource,
                     '/api/%s/export/soknader' % api_version,
                     '/api/%s/export/soknader/<int:soknad_id>' % api_version)

    api.add_resource(export_rapporter_resource,
                     '/api/%s/export/soknad/<int:soknad_id>/rapport/<int:rapport_id>' % api_version)

    api.add_resource(arkivverdig_info_processor_resource,
                     '/api/%s/arkivverdig_info/process' % api_version)

    return api


