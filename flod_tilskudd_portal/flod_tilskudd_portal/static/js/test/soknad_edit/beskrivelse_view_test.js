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

    buster.testCase("BeskrivelseViewTest", {

        setUp: function () {
            setup("/soknad_edit/content_beskrivelse");
        },

        tearDown: function () {
            teardown();
        },


        "Test that model and view are compatible": function () {
            refute.exception(function () {
                var model = new TestSoknadModel();
                var testBeskrivelseView = new ns.BeskrivelseView({
                    model: model,
                    collection: new Backbone.Collection(model.get("arrangement"))
                });
                var res = testBeskrivelseView.render();
            });
        },

        "Test that events are inherited from base class": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901"});

            var parentView = new ns.BaseContentEditView({model: model});

            var testedView = new ns.BeskrivelseView({model: model, collection: new Backbone.Collection(model.get("arrangement"))});

            for (var eventName in parentView.events) {
                assert.contains(_.keys(testedView.events), eventName);
            }
        },

        "Test that base class does not get new events because of inheritance": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901"});

            var parentView = new ns.BaseContentEditView({model: model});
            var original_nb_of_events = _.keys(parentView.events).length;
            var testedView = new ns.BeskrivelseView({model: model, collection: new Backbone.Collection(model.get("arrangement"))});

            assert.equals(original_nb_of_events, _.keys(ns.BaseContentEditView.prototype.events).length);
        },

        "Test that one arrangement is added initially if model contains zero arrangements": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901", arrangement: []});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.equals(0, model.get("arrangement").length);

            var testedView = new ns.BeskrivelseView({model: model, collection: new Backbone.Collection(model.get("arrangement"))});
            testedView.render();

            assert.equals(1, testedView.collection.length);
        },

        "Test that one arrangement is added when add arrangement is clicked": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901", arrangement: []});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.equals(0, model.get("arrangement").length);

            var testedView = new ns.BeskrivelseView({model: model, collection: new Backbone.Collection(model.get("arrangement"))});
            testedView.render();

            assert.equals(1, testedView.collection.length);

            testedView.$('#add_arrangement').click();
            assert.equals(2, testedView.collection.length);
        },

        "Test that arrangement is removed when remove arrangement is clicked": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901", arrangement: []});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.equals(0, model.get("arrangement").length);

            var testedView = new ns.BeskrivelseView({model: model, collection: new Backbone.Collection(model.get("arrangement"))});
            testedView.render();

            assert.equals(1, testedView.collection.length);

            testedView.$('#add_arrangement').click();
            assert.equals(2, testedView.collection.length);

            var arrangements = testedView.$('.remove_arrangement');
            assert.equals(2, arrangements.length);

            arrangements.first().click();
            assert.equals(1, testedView.collection.length);

            arrangements = testedView.$('.remove_arrangement');
            assert.equals(1, arrangements.length);
            arrangements.first().click();
            assert.equals(0, testedView.collection.length);
        },

        "Test that start date updates end date if end date is not set": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901", arrangement: []});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.equals(0, model.get("arrangement").length);

            var testedView = new ns.BeskrivelseView({model: model, collection: new Backbone.Collection(model.get("arrangement"))});
            testedView.render();

            assert.equals(1, testedView.collection.length);

            var startdato = testedView.$el.find('#id_arrangement').find("#id_start_dato");
            var sluttdato = testedView.$el.find('#id_arrangement').find("#id_slutt_dato");

            var dato = "30.08.2014";
            startdato.datepicker("update", dato);
            startdato.trigger('changeDate');

            assert.equals(dato, startdato.val());
            assert.equals(dato, sluttdato.val());
        },

        "Test that start date updates end date if end date is less than start date": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901"});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.equals(1, model.get("arrangement").length);

            model.get("arrangement")[0].slutt_dato = "2014-01-01";

            var testedView = new ns.BeskrivelseView({model: model, collection: new Backbone.Collection(model.get("arrangement"))});
            testedView.render();

            assert.equals(1, testedView.collection.length);

            var startdato = testedView.$el.find('#id_arrangement').find("#id_start_dato");
            var sluttdato = testedView.$el.find('#id_arrangement').find("#id_slutt_dato");

            assert.equals("01.01.2014", sluttdato.val());

            var dato = "30.08.2014";
            startdato.datepicker("update", dato);
            startdato.trigger('changeDate');

            assert.equals(dato, startdato.val());
            assert.equals(dato, sluttdato.val());
        },

        "Test that start date does not updates end date if end date is greater than start date": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901"});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.equals(1, model.get("arrangement").length);

            model.get("arrangement")[0].slutt_dato = "2014-10-31";

            var testedView = new ns.BeskrivelseView({model: model, collection: new Backbone.Collection(model.get("arrangement"))});
            testedView.render();

            assert.equals(1, testedView.collection.length);

            var startdato = testedView.$el.find('#id_arrangement').find("#id_start_dato");
            var sluttdato = testedView.$el.find('#id_arrangement').find("#id_slutt_dato");

            assert.equals("31.10.2014", sluttdato.val());

            var dato = "30.08.2014";
            startdato.datepicker("update", dato);
            startdato.trigger('changeDate');

            assert.equals(dato, startdato.val());
            assert.equals("31.10.2014", sluttdato.val());
        },

        "Test that end date updates start date if start date is not set": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901", arrangement: []});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.equals(0, model.get("arrangement").length);

            var testedView = new ns.BeskrivelseView({model: model, collection: new Backbone.Collection(model.get("arrangement"))});
            testedView.render();

            assert.equals(1, testedView.collection.length);

            var startdato = testedView.$el.find('#id_arrangement').find("#id_start_dato");
            var sluttdato = testedView.$el.find('#id_arrangement').find("#id_slutt_dato");

            var dato = "30.08.2014";
            sluttdato.datepicker("update", dato);
            sluttdato.trigger('changeDate');

            assert.equals(dato, startdato.val());
            assert.equals(dato, sluttdato.val());
        },

        "Test that end date does not update start date if start date is less than end date": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901"});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.equals(1, model.get("arrangement").length);

            model.get("arrangement")[0].start_dato = "2014-01-01";

            var testedView = new ns.BeskrivelseView({model: model, collection: new Backbone.Collection(model.get("arrangement"))});
            testedView.render();

            assert.equals(1, testedView.collection.length);

            var startdato = testedView.$el.find('#id_arrangement').find("#id_start_dato");
            var sluttdato = testedView.$el.find('#id_arrangement').find("#id_slutt_dato");

            assert.equals("01.01.2014", startdato.val());

            var dato = "30.08.2014";
            sluttdato.datepicker("update", dato);
            sluttdato.trigger('changeDate');

            assert.equals("01.01.2014", startdato.val());
            assert.equals(dato, sluttdato.val());
        },

        "Test that end date updates start date if start date is greater than end date": function () {
            var model = new TestSoknadModel({kontonummer: "12345678901"});
            assert.equals("12345678901", model.attributes.kontonummer);
            assert.equals(1, model.get("arrangement").length);

            model.get("arrangement")[0].start_dato = "2014-12-31";

            var testedView = new ns.BeskrivelseView({model: model, collection: new Backbone.Collection(model.get("arrangement"))});
            testedView.render();

            assert.equals(1, testedView.collection.length);

            var startdato = testedView.$el.find('#id_arrangement').find("#id_start_dato");
            var sluttdato = testedView.$el.find('#id_arrangement').find("#id_slutt_dato");

            assert.equals("31.12.2014", startdato.val());

            var dato = "30.08.2014";
            sluttdato.datepicker("update", dato);
            sluttdato.trigger('changeDate');

            assert.equals(dato, startdato.val());
            assert.equals(dato, sluttdato.val());
        }

    });

}(Tilskudd));
