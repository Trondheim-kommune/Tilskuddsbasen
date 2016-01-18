/*global buster, console, $, Backbone, _*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var assert = assert || buster.referee.assert;
    var refute = refute || buster.referee.refute;

    var TestRapportModel;
    var backboneSync = undefined;

    ns.testvar = 0;

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

        TestRapportModel = ns.SoknadRapportModel.extend({
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

    buster.testCase("VedlagtLinkViewTest", {

        setUp: function () {
            setup("/soknad_edit/content_vedlegg");
        },

        tearDown: function () {
            teardown();
        },

        "Test that new link is added when add link is clicked": function () {
            var model = new TestRapportModel({vedlagtlink: []});
            assert.equals(0, model.get("vedlagtlink").length);

            var testedView = new ns.VedleggLinkView({model: model, collection: new Backbone.Collection(model.get("vedlagtlink")), parentObject: "rapport"});
            testedView.render();

            assert.equals(0, testedView.collection.length);

            testedView.$('#add_link').click();
            assert.equals(1, testedView.collection.length);
        },

        "Test that link is removed when remove button is clicked": function () {
            var model = new TestRapportModel({vedlagtlink: []});
            assert.equals(0, model.get("vedlagtlink").length);

            var testedView = new ns.VedleggLinkView({model: model, collection: new Backbone.Collection(model.get("vedlagtlink")), parentObject: "rapport"});
            testedView.render();

            assert.equals(0, testedView.collection.length);

            testedView.$('#add_link').click();
            assert.equals(1, testedView.collection.length);

            var vedlagtlink = testedView.$('.remove_vedlagtlink');
            assert.equals(1, vedlagtlink.length);

            vedlagtlink.first().click();
            assert.equals(0, testedView.collection.length);
        },

        "Test that empty fields are removed from collection on save": function () {
            var model = new TestRapportModel({vedlagtlink: []});
            assert.equals(0, model.get("vedlagtlink").length);

            var testedView = new ns.VedleggLinkView({model: model, collection: new Backbone.Collection([
                {navn: "name", beskrivelse: "beskr"}]), parentObject: "rapport"});
            testedView.render();

            assert.equals(1, testedView.collection.length);

            testedView.$('#add_link').click();
            assert.equals(2, testedView.collection.length);
            testedView.$('#add_link').click();
            assert.equals(3, testedView.collection.length);

            testedView.additionalUpdateModel();

            assert.equals(1, testedView.collection.length);
        }

    });

}(Tilskudd));
