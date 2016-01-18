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

    buster.testCase("RegnskapViewTest", {

        setUp: function () {
            setup("/rapport_edit/content_edit_regnskap");
        },

        tearDown: function () {
            teardown();
        },

        "Test that model and view are compatible": function () {
            refute.exception(function () {
                var model = new TestRapportModel({'id':1, 'soknad_id':1});
                var testRegnskapView = new ns.RapportRegnskapView({
                    model: model,
                    collection: new ns.OkonomipostCollection(model.get("okonomipost"))
                });
                var res = testRegnskapView.render();
            });
        },

        "Test that events are inherited from base class": function () {
            var model = new TestRapportModel({'id':1, 'soknad_id':1});

            var parentView = new ns.BaseContentEditView({model: model});

            var testedView = new ns.RapportRegnskapView({model: model, collection: new ns.OkonomipostCollection(model.get("okonomipost"))});

            for (var eventName in parentView.events) {
                assert.contains(_.keys(testedView.events), eventName);
            }
        },

        "Test that base class does not get new events because of inheritance": function () {
            var model = new TestRapportModel({'id':1, 'soknad_id':1});

            var parentView = new ns.BaseContentEditView({model: model});
            var original_nb_of_events = _.keys(parentView.events).length;
            var testedView = new ns.RapportRegnskapView({model: model, collection: new ns.OkonomipostCollection(model.get("okonomipost"))});

            assert.equals(original_nb_of_events, _.keys(ns.BaseContentEditView.prototype.events).length);
        },

        "Test that save is called on click next": function () {
            var model = new TestRapportModel({'id':1, 'soknad_id':1});
            assert.isFalse(model.saved);

            var testRegnskapView = new ns.RapportRegnskapView({
                model: model,
                collection: new ns.OkonomipostCollection(model.get("okonomipost"))
            });
            testRegnskapView.render();
            testRegnskapView.$('#next_button').click();
            assert.isTrue(model.saved);
        },

        "Test that save is called on click previous": function () {
            var model = new TestRapportModel({'id':1, 'soknad_id':1});
            assert.isFalse(model.saved);

            var testRegnskapView = new ns.RapportRegnskapView({
                model: model,
                collection: new ns.OkonomipostCollection(model.get("okonomipost"))
            });
            testRegnskapView.render();
            testRegnskapView.$('#previous_button').click();
            assert.isTrue(model.saved);
        },

        "Test that one okonomipost is added when add utgift is clicked": function () {
            var model = new TestRapportModel({'id':1, 'soknad_id':1, okonomipost: []});
            assert.equals(0, model.get("okonomipost").length);

            var testedView = new ns.RapportRegnskapView({model: model, collection: new ns.OkonomipostCollection(model.get("okonomipost"))});
            testedView.render();

            assert.equals(0, testedView.collection.length);

            testedView.$('#add_utgift').click();
            assert.equals(1, testedView.collection.length);
        },

        "Test that one okonomipost is added when add andre inntekter is clicked": function () {
            var model = new TestRapportModel({'id':1, 'soknad_id':1, okonomipost: []});
            assert.equals(0, model.get("okonomipost").length);

            var testedView = new ns.RapportRegnskapView({model: model, collection: new ns.OkonomipostCollection(model.get("okonomipost"))});
            testedView.render();

            assert.equals(0, testedView.collection.length);

            testedView.$('#add_andre_inntekter').click();
            assert.equals(1, testedView.collection.length);
        },

        "Test that one okonomipost is added when add andre tilskudd is clicked": function () {
            var model = new TestRapportModel({'id':1, 'soknad_id':1, okonomipost: []});
            assert.equals(0, model.get("okonomipost").length);

            var testedView = new ns.RapportRegnskapView({model: model, collection: new ns.OkonomipostCollection(model.get("okonomipost"))});
            testedView.render();

            assert.equals(0, testedView.collection.length);

            testedView.$('#add_andre_tilskudd').click();
            assert.equals(1, testedView.collection.length);
        },

        "Test that okonomipost is removed when remove okonomipost is clicked": function () {
            var model = new TestRapportModel({'id':1, 'soknad_id':1, okonomipost: []});
            assert.equals(0, model.get("okonomipost").length);

            var testedView = new ns.RapportRegnskapView({model: model, collection: new ns.OkonomipostCollection(model.get("okonomipost"))});
            testedView.render();

            assert.equals(0, testedView.collection.length);

            testedView.$('#add_utgift').click();
            assert.equals(1, testedView.collection.length);

            var okonomipost = testedView.$('.remove_budsjettpost');
            assert.equals(1, okonomipost.length);

            okonomipost.first().click();
            assert.equals(0, testedView.collection.length);

            okonomipost = testedView.$('.remove_budsjettpost');
            assert.equals(0, okonomipost.length);
        },

        "Test that empty budsjettposts is removed from collection on save": function () {
            var model = new TestRapportModel({'id':1, 'soknad_id':1, okonomipost: []});
            assert.equals(0, model.get("okonomipost").length);

            var testedView = new ns.RapportRegnskapView({model: model, collection: new ns.OkonomipostCollection(model.get("okonomipost"))});
            testedView.render();

            testedView.$('#add_utgift').click();
            assert.equals(1, testedView.collection.length);

            testedView.$('#add_utgift').click();
            assert.equals(2, testedView.collection.length);

            testedView.collection.models[1].get("okonomibelop")[0].belop = 12;

            testedView.$('#next_button').click();
            assert.equals(1, testedView.collection.length);
        },

        "Test that the sum of the regnskap and budsjett posts are correctly calculated": function () {
            var okonomiposts = [
                    {
                    id: 12,
                    navn: "tilskudd 23",
                    okonomibelop: [
                    {
                    belop: 232,
                    id: 13,
                    okonomibelop_type: "Regnskap"
                    },
                    {
                    belop: 34213,
                    id: 12,
                    okonomibelop_type: "Budsjett"
                    }
                    ],
                    okonomipost_kategori: "Tilskudd",
                    okonomipost_type: "Inntekt"
                    },
                    {
                    id: 11,
                    navn: "tilskudd 1",
                    okonomibelop: [
                    {
                    belop: 23,
                    id: 14,
                    okonomibelop_type: "Regnskap"
                    },
                    {
                    belop: 3423,
                    id: 11,
                    okonomibelop_type: "Budsjett"
                    }
                    ],
                    okonomipost_kategori: "Tilskudd",
                    okonomipost_type: "Inntekt"
                    },
                    {
                    id: 10,
                    navn: "intekt2 ",
                    okonomibelop: [
                    {
                    belop: 232,
                    id: 15,
                    okonomibelop_type: "Regnskap"
                    },
                    {
                    belop: 3423,
                    id: 10,
                    okonomibelop_type: "Budsjett"
                    }
                    ],
                    okonomipost_kategori: "Annet",
                    okonomipost_type: "Inntekt"
                    },
                    {
                    id: 9,
                    navn: "inntekt",
                    okonomibelop: [
                    {
                    belop: 442,
                    id: 16,
                    okonomibelop_type: "Regnskap"
                    },
                    {
                    belop: 232,
                    id: 9,
                    okonomibelop_type: "Budsjett"
                    }
                    ],
                    okonomipost_kategori: "Annet",
                    okonomipost_type: "Inntekt"
                    },
                    {
                    id: 8,
                    navn: "psot 2",
                    okonomibelop: [
                    {
                    belop: 43,
                    id: 17,
                    okonomibelop_type: "Regnskap"
                    },
                    {
                    belop: 343,
                    id: 8,
                    okonomibelop_type: "Budsjett"
                    }
                    ],
                    okonomipost_kategori: "Annet",
                    okonomipost_type: "Utgift"
                    },
                    {
                    id: 7,
                    navn: "post q",
                    okonomibelop: [
                    {
                    belop: 343,
                    id: 18,
                    okonomibelop_type: "Regnskap"
                    },
                    {
                    belop: 232,
                    id: 7,
                    okonomibelop_type: "Budsjett"
                    }
                    ],
                    okonomipost_kategori: "Annet",
                    okonomipost_type: "Utgift"
                    }
            ];
            assert.equals(6, okonomiposts.length);

            var okonomipostCollection = new ns.OkonomipostCollection(okonomiposts);
            assert.equals(6, okonomipostCollection.length);

            var budsjett_utgifter = okonomipostCollection.calculateSum('Budsjett','Utgift');
            var budsjett_inntekter = okonomipostCollection.calculateSum('Budsjett','Inntekt');
            var regnskap_utgifter = okonomipostCollection.calculateSum('Regnskap','Utgift');
            var regnskap_inntekter = okonomipostCollection.calculateSum('Regnskap','Inntekt');

            assert.equals(575,budsjett_utgifter);
            assert.equals(41291,budsjett_inntekter);
            assert.equals(386,regnskap_utgifter);
            assert.equals(929,regnskap_inntekter);

        }
    });

}(Tilskudd));
