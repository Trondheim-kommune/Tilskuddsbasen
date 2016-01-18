var config = module.exports;

var fs = require("fs");

config["Browser tests"] = {
    env: "browser",
    rootPath: "../",
    // Bruker ikke minified versjonene i test, debugging av tester som feiler blir enklere.
    libs: [
        "lib/underscore.js",
        "lib/jquery-1.11.1.js",
        "lib/bootstrap.js",
        "lib/bootstrap-datepicker.js",
        "lib/backbone.js",
         "lib/backbone.marionette.js",
        "lib/backbone.stickit.js",
        "lib/moment.js",
        "lib/lz-string-1.3.3.js"
    ],
    // content_edit_view må lastes før dev_placeholders, kanskje vi bør sette samme rekkefølge her som i assetbundle.py?
    sources: [
        "src/common/content_edit_view.js",
        "src/common/action_content_view.js",
        "src/common/vedlegg_views.js",
        "src/tilskudd.application.js",
        "src/actions/filter_soknader_action_view.js",
        "src/domain/models.js",
        "src/domain/filter_models.js",
        "src/common/summary.js",
        "src/**/*.js",
        "test/test_tools.js"
    ],
    tests: [
        "test/**/*_test.js"
    ],
    resources: [
        {
            path: "/tilskudd_layout_template",
            content: fs.readFileSync('../../../templates/tilskudd_layout_template.html', {encoding: "utf-8"})
        },
        {
            path: "/actions/filter_action_content",
            content: fs.readFileSync('../../../templates/actions/action_content_filter.html', {encoding: "utf-8"})
        },
        {
            path: "/soknad_edit/content_om_soker",
            content: fs.readFileSync('../../../templates/soknad_edit/content_om_soker.html', {encoding: "utf-8"})
        },
        {
            // content_beskrivelse er avhengig av content_edit_arrangement_row
            path: "/soknad_edit/content_beskrivelse",
            content: fs.readFileSync('../../../templates/soknad_edit/content_beskrivelse.html', {encoding: "utf-8"}) + fs.readFileSync('../../../templates/common/content_edit_arrangement_row.html', {encoding: "utf-8"})
        },
        {
            path: "/soknad_edit/content_budsjett",
            content: fs.readFileSync('../../../templates/soknad_edit/content_budsjett.html', {encoding: "utf-8"})
        },
        {
            path: "/soknad_edit/content_vedlegg",
            content: fs.readFileSync('../../../templates/common/content_vedlegg.html', {encoding: "utf-8"})
        },
        {
            path: "/soknader/content_saksbehandler_soknader",
            content: fs.readFileSync('../../../templates/soknader/content_saksbehandler_soknader.html', {encoding: "utf-8"})
        },
        {
            path: "/soknader/content_soknader",
            content: fs.readFileSync('../../../templates/soknader/content_soknader.html', {encoding: "utf-8"})
        },
        {
            path: "/actions/action_content_ny_organisasjon",
            content: fs.readFileSync('../../../templates/actions/action_content_ny_organisasjon.html', {encoding: "utf-8"})
        },
        {
            path: "/rapport_edit/content_edit_gjennomforing",
            content: fs.readFileSync('../../../templates/rapport_edit/content_edit_gjennomforing.html', {encoding: "utf-8"}) + fs.readFileSync('../../../templates/common/content_edit_arrangement_row.html', {encoding: "utf-8"})
        },
        {
            path: "/rapport_edit/content_edit_regnskap",
            content: fs.readFileSync('../../../templates/rapport_edit/content_edit_regnskap.html', {encoding: "utf-8"})
        },
        {
            path: "/admin/redigere_tilskuddsordning",
            content: fs.readFileSync('../../../templates/tilskuddsordning_edit/content_om_tilskuddsordning.html', {encoding: "utf-8"})
        },
        {
            path: "/admin/tilskuddsord_saksbehandlere",
            content: fs.readFileSync('../../../templates/tilskuddsordning_edit/content_saksbehandlere.html', {encoding: "utf-8"})
        },
        {
            path: "/actions/vurdere_klage_action_content",
            content: fs.readFileSync('../../../templates/actions/action_content_vurdere_klage.html', {encoding: "utf-8"})
        },
        {
            path: "/actions/fatt_klagevedtak_action_content",
            content: fs.readFileSync('../../../templates/actions/action_content_fatt_klagevedtak.html', {encoding: "utf-8"})
        }
    ]


};

