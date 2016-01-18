/*global buster, console, $, Backbone, _*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var assert = assert || buster.referee.assert;
    var refute = refute || buster.referee.refute;

    var TestSoknadModel;
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
                id: "",
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
            saved: false,
            save: function () {
                this.saved = true;
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

    buster.testCase("OmSokerViewTest", {

        setUp: function () {
            setup("/soknad_edit/content_om_soker");
        },

        tearDown: function () {
            teardown();
        },

        "Test that model and view are compatible": function () {
            refute.exception(function () {
                var model = new TestSoknadModel();
                var my_org_coll = new ns.MinOrganisasjonCollection([], {'person_id': 1 });
                var contact_person = new ns.PersonModel({'id': 1 });

                var testOmSokerView = new ns.OmSokerView({
                    model: model,
                    my_organisations: my_org_coll,
                    contact_person: contact_person
                });
                testOmSokerView.render();
            });
        },

        "Test that save is called on click next": function () {


            var model = new TestSoknadModel({kontonummer: "12345678901"});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.isFalse(model.saved);


            var my_org_coll = new ns.MinOrganisasjonCollection([], {'person_id': 1 });
            var contact_person = new ns.PersonModel({'id': 1 });

            var testOmSokerView = new ns.OmSokerView({
                model: model,
                my_organisations: my_org_coll,
                contact_person: contact_person
            });
            testOmSokerView.render();
            testOmSokerView.$('#next_button').click();
            assert.isTrue(model.saved);
        },

         "Test that save is called on click lagre": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901"});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.isFalse(model.saved);

            var my_org_coll = new ns.MinOrganisasjonCollection([], {'person_id': 1 });
            var contact_person = new ns.PersonModel({'id': 1 });

            var testOmSokerView = new ns.OmSokerView({
                model: model,
                my_organisations: my_org_coll,
                contact_person: contact_person
            });
            testOmSokerView.render();
            testOmSokerView.$('#save_button').click();
            assert.isTrue(model.saved);
        },

        "Test that save is called on click previous": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901"});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.isFalse(model.saved);

            var my_org_coll = new ns.MinOrganisasjonCollection([], {'person_id': 1 });
            var contact_person = new ns.PersonModel({'id': 1 });

            var testOmSokerView = new ns.OmSokerView({
                model: model,
                my_organisations: my_org_coll,
                contact_person: contact_person
            });
            testOmSokerView.render();
            testOmSokerView.$('#previous_button').click();
            assert.isTrue(model.saved);
        }

    });

}(Tilskudd));
