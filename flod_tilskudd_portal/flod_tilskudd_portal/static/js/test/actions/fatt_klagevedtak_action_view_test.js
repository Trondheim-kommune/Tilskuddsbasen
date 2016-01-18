/*global buster, console, $, Backbone, _*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var assert = assert || buster.referee.assert;
    var refute = refute || buster.referee.refute;

    var TestSoknadModel;
    var TestVurderKlageActionView;
    var backboneSync = undefined;

    var setup = function (templatePath) {
        ns.test_tools.backupTilskuddApp();
        var mocks = [
            {
                "uri": "/api/organisations/v1/persons/1",
                "data": {
                    status: "unregistered",
                    phone_number: "99999999",
                    first_name: "Trond",
                    last_name: "Heim",
                    postal_code: 7000,
                    postal_city: "Trondheim",
                    address_line: "Kjøpmannsgata 35",
                    email_address: "trond@heim.no",
                    id: 1,
                    uri: "/persons/1"
                }
            },

            {
                "uri": "/api/organisations/v1/persons/1/organisations/",
                "data": [
                    {
                        uri: "/organisations/1",
                        org_number: "983915477",
                        id: 1,
                        name: "FOTBALLKLUBBEN KVIK"
                    }
                ]
            }
        ];

        // intercept backbone.sync
        Backbone.sync = function(method, model, options, error) {
            var myUrl = model.url();

            var myData = {};

            _.each(mocks, function (mock) {
                if (mock.uri === myUrl) {
                    myData = mock.data;
                }
            });

            return myData;

        };

        TestSoknadModel = ns.SoknadModel.extend({
            defaults: {
                id: 1,
                telefon: "",
                epost: "",
                om_oss: "",
                kontonummer: "",
                tilskuddsordning: "",
                prosjektnavn: "",
                beskrivelse: "",
                maalsetting: "",
                arrangement: [
                    {
                        id: "",
                        sted: "",
                        tidspunkt: "",
                        start_dato: "",
                        slutt_dato: ""
                    }
                ]
            },

            initialize: function(){
                var vedtak = [{'id': 1, 'vedtaksdato': "2014-01-12", 'vedtatt_belop': 230},
                    {'id': 3, 'vedtaksdato': "2014-01-14", 'vedtatt_belop': 260},
                    {'id': 2, 'vedtaksdato': "2014-01-14", 'vedtatt_belop': 270},
                    {'id': 4, 'vedtaksdato': "2014-01-14", 'vedtatt_belop': 207}];

                this.set('vedtak', vedtak);
            },

            saved: false,
            save: function () {
                this.saved = true;
            }
        });

        TestVurderKlageActionView = ns.VurderKlageActionView.extend({
            initialize: function(){
                var opprinneligVedtak = this.options.soknadModel.getSisteVedtak(1);
                if (!_.isUndefined(opprinneligVedtak)) {
                    this.model.set('opprinnelig_vedtatt_belop', opprinneligVedtak.vedtatt_belop);
                }
            }
        });

        ns.test_tools.loadTemplateInDocumentBody(templatePath);

    };

    var teardown = function () {
        Backbone.sync = backboneSync;
        ns.test_tools.restoreOriginalDocumentBody();
        ns.test_tools.resetTilskuddApp();
        backboneSync = undefined;
    };

    buster.testCase("FattKlagevedtakActionViewTest", {

        setUp: function () {
            setup("/actions/fatt_klagevedtak_action_content");
        },

        tearDown: function () {
            teardown();
        },

        "Test that fatt klagevedtak view shows right opprinnelig vedtatt beløp": function () {

            var model = new TestSoknadModel();

            var testVurderKlageView = new ns.FattKlagevedtakActionView({
                model: new ns.SoknadActionModel({'id': 'fatt_klagevedtak', 'soknad_id': model.id}),
                soknadModel: model
            });

            testVurderKlageView.render();
            var belop = testVurderKlageView.model.get("opprinnelig_vedtatt_belop");
            assert.equals(260, belop);
        }
    });


}(Tilskudd));
