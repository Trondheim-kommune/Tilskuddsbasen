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
                type: "Etterskuddsutbetaling",
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

    buster.testCase("TilskuddsordnSaksbehandlereViewTest", {

        setUp: function () {
            setup("/admin/tilskuddsord_saksbehandlere");
        },

        tearDown: function () {
            teardown();
        },

        "Test that saksbehandler can be added to tilskuddsordning": function () {
            var model = new TestTilskuddordnModel();
            var testView= new TestTilskuddSaksbehandlerView({model: model,collection: model.saksbehandlereInfo});
            testView.render();

            //stickit ville ikke binde dropdown mot type_activity_array, så jeg måtte legge samme verdiene manuelt
            testView.$("#id_saksbehandler").append($('<option>', { value: "1" }).text("Tanja1"));
            testView.$("#id_saksbehandler").append($('<option>', { value: "2" }).text("Tanja2"));

            assert.equals(0, testView.collection.length);

            testView.$("#id_saksbehandler").val(1);
            testView.$('.add-person-btn').click();
            assert.equals(1, testView.collection.length);
        },

        "Test that saksbehandler can be removed from tilskuddsordning": function () {
            var model = new TestTilskuddordnModel();
            var testView= new TestTilskuddSaksbehandlerView({model: model,collection: model.saksbehandlereInfo});
            testView.render();

            //stickit ville ikke binde dropdown mot type_activity_array, så jeg måtte legge samme verdiene manuelt
            testView.$("#id_saksbehandler").append($('<option>', { value: "1" }).text("Tanja1"));
            testView.$("#id_saksbehandler").append($('<option>', { value: "2" }).text("Tanja2"));

            assert.equals(0, testView.collection.length);

            testView.$("#id_saksbehandler").val(1);
            testView.$('.add-person-btn').click();
            assert.equals(1, testView.collection.length);

            testView.$('.remove-btn').click();
            assert.equals(0, testView.collection.length);
        }
    });

}(Tilskudd));