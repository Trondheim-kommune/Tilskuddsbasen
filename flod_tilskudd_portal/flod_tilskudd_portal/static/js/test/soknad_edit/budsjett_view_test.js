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

    buster.testCase("BudsjettViewTest", {

        setUp: function () {
            setup("/soknad_edit/content_budsjett");
        },

        tearDown: function () {
            teardown();
        },

        "Test that model and view are compatible": function () {
            refute.exception(function () {
                var model = new TestSoknadModel();
                var testBudsjettView = new ns.BudsjettView({
                    model: model,
                    collection: new ns.OkonomipostCollection(model.get("okonomipost"))
                });
                var res = testBudsjettView.render();
            });
        },

        "Test that events are inherited from base class": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901"});

            var parentView = new ns.BaseContentEditView({model: model});

            var testedView = new ns.BudsjettView({model: model, collection: new ns.OkonomipostCollection(model.get("okonomipost"))});

            for (var eventName in parentView.events) {
                assert.contains(_.keys(testedView.events), eventName);
            }
        },

        "Test that base class does not get new events because of inheritance": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901"});

            var parentView = new ns.BaseContentEditView({model: model});
            var original_nb_of_events = _.keys(parentView.events).length;
            var testedView = new ns.BudsjettView({model: model, collection: new ns.OkonomipostCollection(model.get("okonomipost"))});

            assert.equals(original_nb_of_events, _.keys(ns.BaseContentEditView.prototype.events).length);
        },

        "Test that 12 okonomiposts is added initially if model contains zero okonomiposts": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901", okonomipost: []});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.equals(0, model.get("okonomipost").length);

            var testedView = new ns.BudsjettView({model: model, collection: new ns.OkonomipostCollection(model.get("okonomipost"))});
            testedView.render();

            assert.equals(12, testedView.collection.length);
        },

        "Test that one okonomipost is added when add utgift is clicked": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901", okonomipost: []});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.equals(0, model.get("okonomipost").length);

            var testedView = new ns.BudsjettView({model: model, collection: new ns.OkonomipostCollection(model.get("okonomipost"))});
            testedView.render();

            assert.equals(12, testedView.collection.length);

            testedView.$('#add_utgift').click();
            assert.equals(13, testedView.collection.length);
        },

        "Test that one okonomipost is added when add andre inntekter is clicked": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901", okonomipost: []});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.equals(0, model.get("okonomipost").length);

            var testedView = new ns.BudsjettView({model: model, collection: new ns.OkonomipostCollection(model.get("okonomipost"))});
            testedView.render();

            assert.equals(12, testedView.collection.length);

            testedView.$('#add_andre_inntekter').click();
            assert.equals(13, testedView.collection.length);
        },

        "Test that one okonomipost is added when add andre tilskudd is clicked": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901", okonomipost: []});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.equals(0, model.get("okonomipost").length);

            var testedView = new ns.BudsjettView({model: model, collection: new ns.OkonomipostCollection(model.get("okonomipost"))});
            testedView.render();

            assert.equals(12, testedView.collection.length);

            testedView.$('#add_andre_tilskudd').click();
            assert.equals(13, testedView.collection.length);
        },

        "Test that okonomipost is removed when remove okonomipost is clicked": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901", okonomipost: []});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.equals(0, model.get("okonomipost").length);

            var testedView = new ns.BudsjettView({model: model, collection: new ns.OkonomipostCollection(model.get("okonomipost"))});
            testedView.render();

            assert.equals(12, testedView.collection.length);

            testedView.$('#add_utgift').click();
            assert.equals(13, testedView.collection.length);

            var okonomipost = testedView.$('.remove_budsjettpost');
            assert.equals(13, okonomipost.length);

            okonomipost.first().click();
            assert.equals(12, testedView.collection.length);

            okonomipost = testedView.$('.remove_budsjettpost');
            assert.equals(12, okonomipost.length);
            okonomipost.first().click();
            assert.equals(11, testedView.collection.length);
        },

        "Test that empty budsjettposts is removed from collection on save": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901", okonomipost: []});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.equals(0, model.get("okonomipost").length);

            var testedView = new ns.BudsjettView({model: model, collection: new ns.OkonomipostCollection(model.get("okonomipost"))});
            testedView.render();

            assert.equals(12, testedView.collection.length);
            testedView.collection.models[1].get("okonomibelop")[0].belop = 12;

            testedView.$('#next_button').click();
            assert.equals(1, testedView.collection.length);
        }
    });

}(Tilskudd));
