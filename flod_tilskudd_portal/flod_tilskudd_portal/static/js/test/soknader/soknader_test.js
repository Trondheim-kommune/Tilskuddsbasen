/*global buster, Backbone */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var assert = assert || buster.referee.assert;
    var refute = refute || buster.referee.refute;

    var TestSoknadModel;
    var TestSoknadTableView;

    var setup = function (templatePath) {
        ns.test_tools.backupTilskuddApp();
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
                organisation: {
                    id: ""
                },
                omsokt_belop: 0,
                arrangement: [
                    {
                        id: "",
                        sted: "",
                        tidspunkt: "",
                        start_dato: "",
                        slutt_dato: ""
                    }
                ],
                "vedtak": [
                    {
                        id: 1,
                        rapportfrist: null,
                        vedtaksdato: null,
                        vedtakstekst: null,
                        innstilt_belop: 0,
                        vedtatt_belop: 0
                    }
                ]
            },
            saved: false,
            save: function () {
                this.saved = true;
            }
        });

        TestSoknadTableView = ns.SoknadTableView.extend({
            bindings: {},
            initialize: function () {
                this.collection.comparator = this.compareSoknad;
            }
        });

        ns.test_tools.loadTemplateInDocumentBody(templatePath);
    };

    var teardown = function () {
        ns.test_tools.restoreOriginalDocumentBody();
        ns.test_tools.resetTilskuddApp();
    };


    buster.testCase("SoknadTableViewTest", {

        setUp: function () {
            setup("/soknader/content_soknader");
        },

        tearDown: function () {
            teardown();
        },

        "Test that soknader for soker are sorted by levert dato": function () {
            refute.exception(function () {
                var soknaderCollection = new ns.SoknadsListeCollection();
                soknaderCollection.add(new TestSoknadModel({id: 1, levert_dato: "2012-11-30", person: {name: 'Tanja'}, status : "Tull"}));
                soknaderCollection.add(new TestSoknadModel({id: 2, levert_dato: "2012-11-30", person: {name: 'Tanja2'}, status : "Tull"}));
                soknaderCollection.add(new TestSoknadModel({id: 3, levert_dato: null, person: {name: 'Tanja3'}, status : "Kladd"}));
                soknaderCollection.add(new TestSoknadModel({id: 4, levert_dato: null, person: {name: 'Tanja4'}, status : "Kladd"}));
                soknaderCollection.add(new TestSoknadModel({id: 5, levert_dato: "2013-11-30", person: {name: 'Tanja5'}, status : "Avslått"}));

                var mod = new Backbone.Model();

                var testView = new TestSoknadTableView({
                    model: mod,
                    collection: soknaderCollection,
                    mode: "soker"
                });

                testView.render();

                var current = -1;
                var res = true;

                testView.collection.each(function(soknad){
                    if (current !== -1) {
                        var tmp = new Date(soknad.get('levert_dato')).getTime();
                        if ((tmp === 0) && (current !== 0)) {
                            res = false;
                        }else if ((current >= tmp) || (current === 0)){
                            current = tmp;
                        } else {
                            res = false;
                        }
                    } else {
                        current = new Date(soknad.get('levert_dato')).getTime();
                    }
                });
                assert.equals(true,res);
            });
        }
    });

}(Tilskudd));