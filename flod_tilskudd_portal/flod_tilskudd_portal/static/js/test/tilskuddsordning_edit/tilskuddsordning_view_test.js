/*global buster, $ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var assert = assert || buster.referee.assert;
    var refute = refute || buster.referee.refute;

    var TestTilskuddordnModel;
    var TestTilskuddSaksbehandlerView;

    var setup = function (templatePath) {
        ns.test_tools.backupTilskuddApp();
        TestTilskuddordnModel = ns.TilskuddsordningModel.extend({
            saksbehandlereInfo: new Backbone.Collection(),
            defaults: {
                navn: "",
                forhandsutbetaling: false,
                budsjett: 100,
                publisert: false,
                innledningstekst: "",
                prosjekttekst: "",
                budsjettekst: "",
                "soknadsfrist": "11.02.2014",
                "rapportfrist": "11.02.2016"
            },
            saved: false,
            save: function () {
                this.saved = true;
            }
        });

        TestTilskuddSaksbehandlerView = ns.TilskuddsordnSaksbehandlereView.extend({
            initialize: function () {
                this.saksbehandlere = new ns.SaksbehandlerCollection([
                    {'id': "1", 'profile':{'full_name': 'Tanja1'}},
                    {'id': "2", 'profile':{'full_name': 'Tanja2'}}
                ]);
            }
        });

        ns.test_tools.loadTemplateInDocumentBody(templatePath);
    };

    var teardown = function () {
        ns.test_tools.restoreOriginalDocumentBody();
        ns.test_tools.resetTilskuddApp();
    };

    buster.testCase("TilskuddsordningViewTest", {

        setUp: function () {
            setup("/admin/redigere_tilskuddsordning");
        },

        tearDown: function () {
            teardown();
        },

        "Test that save is called on click next": function () {

            var model = new TestTilskuddordnModel({budsjett: 200});
            assert.equals(200, model.attributes.budsjett);
            assert.isFalse(model.saved);

            var tilskuddsordninger = new ns.TilskuddsordningCollection();
            tilskuddsordninger.add(model);

            var testView = new ns.TilskuddsordningView({
                model: model
            });
            testView.render();

            testView.$('#next_button').click();
            assert.isTrue(model.saved);
        }

    });

}(Tilskudd));