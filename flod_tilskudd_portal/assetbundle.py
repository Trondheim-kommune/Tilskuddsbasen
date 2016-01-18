# -*- coding: utf-8 -*-
from flask.ext.assets import Bundle

from flod_tilskudd_portal import app


js_filters = ['jsmin']
css_filters = ['cssmin']

bootstrap_css = Bundle(
    'css/bootstrap/css/bootstrap.min.css',

    Bundle('css/datepicker3.css',
           'css/tilskudd.css',
           filters=css_filters),
    filters=['cssrewrite'],
    output='gen/css/bootstrap.css'
)

base_js_libs = Bundle(
    Bundle(
        'js/lib/jquery-1.11.1.min.js',
        'js/lib/underscore-min.js',
        'js/lib/backbone-min.js',
        'js/lib/bootstrap.min.js',
        'js/lib/bootstrap-datepicker.js',
        'js/lib/backbone.marionette.min.js',
        'js/lib/backbone.stickit.js',
        'js/lib/moment.min.js',
        'js/lib/lz-string-1.3.3-min.js',
        'js/lib/bootstrap-filestyle.min.js'
    ),
    Bundle(
        'js/src/common/utils.js',
        'js/src/common/menu.js',
        'js/src/common/message.js',
        'js/src/domain/models.js',
        'js/src/common/action_content_view.js',
        'js/src/common/content_edit_view.js',
        'js/src/common/dev_placeholders.js',
        'js/src/tilskudd.application.js',
        filters=js_filters
    ),
    output='gen/js/base_js_libs.js'
)

soknader_js_libs = Bundle(
    'js/src/domain/filter_models.js',
    'js/src/actions/filter_soknader_action_view.js',
    filters=js_filters,
    output='gen/js/soknader_js_libs.js'
)

soker_soknader_js_libs = Bundle(
    'js/src/actions/ny_soknad_action_view.js',
    'js/src/soknader/soknader.js',
    filters=js_filters,
    output='gen/js/soker_soknader_js_libs.js'
)

saksbehandler_soknader_js_libs = Bundle(
    'js/src/soknader/saksbehandler_soknader.js',
    'js/src/actions/varsle_godkjenner_action_view.js',
    filters=js_filters,
    output='gen/js/saksbehandler_soknader_js_libs.js'
)

soknad_js_libs = Bundle(
    'js/lib/jquery.iframe-transport.js',
    'js/src/common/summary.js',
    'js/src/common/rapport_summary.js',
    'js/src/common/soknad_summary.js',
    'js/src/common/vedlegg_views.js',
    'js/src/actions/behandle_action_view.js',
    'js/src/actions/trekk_soknad_action_view.js',
    'js/src/actions/send_inn_soknad_action_view.js',
    'js/src/actions/slett_soknad_action_view.js',
    'js/src/actions/rediger_soknad_action_view.js',
    'js/src/actions/general_action_view.js',
    'js/src/actions/ny_rapport_action_view.js',
    'js/src/actions/lever_rapport_action_view.js',
    'js/src/actions/til_vedtak_action_view.js',
    'js/src/actions/etterspor_info_action_view.js',
    'js/src/actions/redigere_rapportfrist_action_view.js',
    'js/src/actions/registrer_utbetaling_action_view.js',
    'js/src/actions/underkjenn_rapport_action_view.js',
    'js/src/actions/avskriv_rapportkrav_action_view.js',
    'js/src/actions/fatt_vedtak_action_view.js',
    'js/src/actions/rediger_rapport_action_view.js',
    'js/src/actions/godta_vedtak_action_view.js',
    'js/src/actions/takke_nei_action_view.js',
    'js/src/actions/klage_action_view.js',
    'js/src/actions/vurder_klage_action_view.js',
    'js/src/actions/fatt_klagevedtak_action_view.js',
    'js/src/actions/ny_saksvedlegg_action_view.js',
    'js/src/actions/endre_kontakt_action_view.js',
    'js/src/actions/endre_tilskuddsordning_action_view.js',
    'js/src/soknad/utbetaling_view.js',
    'js/src/soknad/rapport_view.js',
    'js/src/soknad/oversikt_view.js',
    'js/src/soknad/soknad_title_view.js',
    'js/src/soknad/soknad_view.js',
    'js/src/soknad/saksvedlegg_view.js',
    'js/src/soknad/vedtak_view.js',
    filters=js_filters,
    output='gen/js/soknad_js_libs.js'
)

soknad_edit_js_libs = Bundle(
    'js/lib/jquery.iframe-transport.js',
    'js/src/common/base_arrangement_view.js',
    'js/src/common/base_okonomipost_view.js',
    'js/src/common/summary.js',
    'js/src/common/soknad_summary.js',
    'js/src/common/vedlegg_views.js',
    'js/src/actions/trekk_soknad_action_view.js',
    'js/src/actions/slett_soknad_action_view.js',
    'js/src/actions/send_inn_soknad_action_view.js',
    'js/src/actions/general_action_view.js',
    'js/src/soknad_edit/edit_soknad_title_view.js',
    'js/src/soknad_edit/innledning_view.js',
    'js/src/soknad_edit/om_soker_view.js',
    'js/src/soknad_edit/beskrivelse_view.js',
    'js/src/soknad_edit/budsjett_view.js',
    'js/src/soknad_edit/annet_view.js',
    'js/src/soknad_edit/sammendrag_view.js',
    filters=js_filters,
    output='gen/js/soknad_edit_js_libs.js'
)

profil_js_libs = Bundle(
    'js/src/profil/personalia.js',
    'js/src/profil/organisasjon.js',
    'js/src/actions/ny_organisasjon_action_view.js',
    filters=js_filters,
    output='gen/js/profil_js_libs.js'
)

rapport_edit_js_libs = Bundle(
    'js/lib/jquery.iframe-transport.js',
    'js/src/common/base_arrangement_view.js',
    'js/src/common/base_okonomipost_view.js',
    'js/src/common/summary.js',
    'js/src/common/rapport_summary.js',
    'js/src/common/soknad_summary.js',
    'js/src/common/vedlegg_views.js',
    'js/src/rapport_edit/sammendrag_edit.js',
    'js/src/rapport_edit/regnskap_edit.js',
    'js/src/rapport_edit/soknaden_edit.js',
    'js/src/rapport_edit/gjennomforing_edit.js',
    'js/src/rapport_edit/innledning_edit.js',
    'js/src/rapport_edit/edit_rapport_title_view.js',
    'js/src/actions/lever_rapport_action_view.js',
    filters=js_filters,
    output='gen/js/rapport_edit_js_libs.js'
)

tilskuddsordning_edit_js_libs = Bundle(
    'js/src/tilskuddsordning_edit/om_tilskuddsordning_view.js',
    'js/src/tilskuddsordning_edit/saksbehandlere_view.js',
    'js/src/actions/ny_tilskuddsordning_action_view.js',
    'js/src/actions/ny_standardtekst_action_view.js',
    filters=js_filters,
    output='gen/js/admin_js_libs.js'
)

standardtekst_edit_js_libs = Bundle(
    'js/src/standardtekst_edit/redigere_stdtekst_view.js',
    'js/src/actions/ny_tilskuddsordning_action_view.js',
    'js/src/actions/ny_standardtekst_action_view.js',
    filters=js_filters,
    output='gen/js/admin_js_libs.js'
)

admin_js_libs = Bundle(
    'js/src/admin/tilskuddsordninger.js',
    'js/src/admin/stdtekster.js',
    'js/src/actions/ny_tilskuddsordning_action_view.js',
    'js/src/actions/ny_standardtekst_action_view.js',
    filters=js_filters,
    output='gen/js/admin_js_libs.js'
)
