/*global buster, Backbone, _, $ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var assert = assert || buster.referee.assert;
    var refute = refute || buster.referee.refute;

    var TestSoknadModel;
    var TestSaksbehandlerSoknadTableView;

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

        TestSaksbehandlerSoknadTableView = ns.SaksbehandlerSoknadTableView.extend({
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


    buster.testCase("SaksbehandlerSoknadTableViewTest", {

        setUp: function () {
            setup("/soknader/content_saksbehandler_soknader");
        },

        tearDown: function () {
            teardown();
        },

        "Test that model and view are compatible": function () {
            refute.exception(function () {
                var model = new TestSoknadModel();

                var soknaderCollection = new ns.SoknadsListeCollection();
                soknaderCollection.add(model);
                var soknaderCollectionModel = new ns.SoknadCollectionModel({'collection': soknaderCollection});

                var testView = new ns.SaksbehandlerSoknadTableView({
                    model: soknaderCollectionModel,
                    collection: soknaderCollection
                });

                testView.render();
            });
        },

        "Test that sums are calculated initially": function () {
            refute.exception(function () {
                var soknaderCollection = new ns.SoknadsListeCollection();
                soknaderCollection.add(new TestSoknadModel({id: 1, omsokt_belop: 10,  vedtak: [{innstilt_belop: 20, vedtatt_belop: 30}]}));
                soknaderCollection.add(new TestSoknadModel({id: 2, omsokt_belop: 100, vedtak: [{innstilt_belop: 200, vedtatt_belop: 300}]}));

                var soknaderCollectionModel = new ns.SoknadCollectionModel({'collection': soknaderCollection});

                var testView = new ns.SaksbehandlerSoknadTableView({
                    model: soknaderCollectionModel,
                    collection: soknaderCollection
                });

                testView.render();

                assert.equals(2, soknaderCollection.length);
                assert.equals(2, soknaderCollectionModel.collection.length);

                var sumOmsokt = testView.$('#id_sum_omsokt_belop').html();
                var sumInnstilt = testView.$('#id_sum_innstilt_belop').html();
                var sumVedtatt = testView.$('#id_sum_vedtatt_belop').html();

                assert.equals(110, parseInt(sumOmsokt));
                assert.equals(220, parseInt(sumInnstilt));
                assert.equals(330, parseInt(sumVedtatt));

            });
        },
        "Test that sums are recalculated when value changes": function () {
            refute.exception(function () {
                var soknaderCollection = new ns.SoknadsListeCollection();
                soknaderCollection.add(new TestSoknadModel({id: 1, omsokt_belop: 10, vedtak: [{innstilt_belop: 20, vedtatt_belop: 30}]}));
                soknaderCollection.add(new TestSoknadModel({id: 2, omsokt_belop: 100, vedtak: [{innstilt_belop: 200, vedtatt_belop: 300}]}));

                var soknaderCollectionModel = new ns.SoknadCollectionModel({'collection': soknaderCollection});

                var testView = new ns.SaksbehandlerSoknadTableView({
                    model: soknaderCollectionModel,
                    collection: soknaderCollection
                });

                testView.render();

                assert.equals(2, soknaderCollection.length);
                assert.equals(2, soknaderCollectionModel.collection.length);

                var innstiltBelopListe = testView.$('.id_innstilt_belop');

                assert.equals(2, innstiltBelopListe.length);
                assert.equals(200, parseInt($(innstiltBelopListe[1]).val()));

                $(innstiltBelopListe[1]).val(2000);
                $(innstiltBelopListe[1]).trigger("change");

                var sumOmsokt = testView.$('#id_sum_omsokt_belop').html();
                var sumInnstilt = testView.$('#id_sum_innstilt_belop').html();
                var sumVedtatt = testView.$('#id_sum_vedtatt_belop').html();

                assert.equals(110, parseInt(sumOmsokt));
                assert.equals(2020, parseInt(sumInnstilt));
                assert.equals(330, parseInt(sumVedtatt));
            });
        },
        "Test that soknader for saksbehandler are sorted by levert dato": function () {
            refute.exception(function () {
                var soknaderCollection = new ns.SoknadsListeCollection();
                soknaderCollection.add(new TestSoknadModel({id: 1, levert_dato: "2012-11-30"}));
                soknaderCollection.add(new TestSoknadModel({id: 2, levert_dato: "2015-11-30"}));
                soknaderCollection.add(new TestSoknadModel({id: 3, levert_dato: "2015-11-30"}));
                soknaderCollection.add(new TestSoknadModel({id: 4, levert_dato: "2013-11-30"}));

                var mod = new Backbone.Model();

                var testView = new TestSaksbehandlerSoknadTableView({
                    model: mod,
                    collection: soknaderCollection,
                    mode: "saksbehandler"
                });

                testView.render();

                var current = -1;
                var res = true;

                testView.collection.each(function(soknad){
                    if (current !== -1) {
                        var tmp = new Date(soknad.get('levert_dato')).getTime();
                        if (current >= tmp){
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
        },
        "Test visibility of buttons in saksbehandler mode": function () {
            var soknaderCollection = new ns.SoknadsListeCollection();
            soknaderCollection.add(new TestSoknadModel({id: 1, omsokt_belop: 10, vedtak: [{innstilt_belop: 20, vedtatt_belop: 30}]}));
            soknaderCollection.add(new TestSoknadModel({id: 2, omsokt_belop: 100, vedtak: [{innstilt_belop: 200, vedtatt_belop: 300}]}));

            var soknaderCollectionModel = new ns.SoknadCollectionModel({'collection': soknaderCollection});

            var testView = new ns.SaksbehandlerSoknadTableView({
                model: soknaderCollectionModel,
                collection: soknaderCollection,
                mode: 'saksbehandler'
            });

            testView.render();

            _.each(testView.$('.lagre_innstilling_button'), function (button) {
                assert.isFalse($(button).hasClass('hidden'));
            });

            _.each(testView.$('.lagre_vedtak_button'), function (button) {
                assert.isTrue($(button).hasClass('hidden'));
            });

            _.each(testView.$('.godkjenn_vedtak_button'), function (button) {
                assert.isTrue($(button).hasClass('hidden'));
            });

            _.each(testView.$('.tilbake_til_innstilling_button'), function (button) {
                assert.isTrue($(button).hasClass('hidden'));
            });
        },
        "Test visibility of buttons in godkjenner mode": function () {
            var soknaderCollection = new ns.SoknadsListeCollection();
            soknaderCollection.add(new TestSoknadModel({id: 1, omsokt_belop: 10, vedtak: [{innstilt_belop: 20, vedtatt_belop: 30}]}));
            soknaderCollection.add(new TestSoknadModel({id: 2, omsokt_belop: 100, vedtak: [{innstilt_belop: 200, vedtatt_belop: 300}]}));

            var soknaderCollectionModel = new ns.SoknadCollectionModel({'collection': soknaderCollection});

            var testView = new ns.SaksbehandlerSoknadTableView({
                model: soknaderCollectionModel,
                collection: soknaderCollection,
                mode: 'godkjenner'
            });

            testView.render();

            _.each(testView.$('.lagre_innstilling_button'), function (button) {
                assert.isTrue($(button).hasClass('hidden'));
            });

            _.each(testView.$('.lagre_vedtak_button'), function (button) {
                assert.isFalse($(button).hasClass('hidden'));
            });

            _.each(testView.$('.godkjenn_vedtak_button'), function (button) {
                assert.isFalse($(button).hasClass('hidden'));
            });

            _.each(testView.$('.tilbake_til_innstilling_button'), function (button) {
                assert.isFalse($(button).hasClass('hidden'));
            });
        },
        "Test visibility of buttons in with no mode": function () {
            var soknaderCollection = new ns.SoknadsListeCollection();
            soknaderCollection.add(new TestSoknadModel({id: 1, omsokt_belop: 10, vedtak: [{innstilt_belop: 20, vedtatt_belop: 30}]}));
            soknaderCollection.add(new TestSoknadModel({id: 2, omsokt_belop: 100, vedtak: [{innstilt_belop: 200, vedtatt_belop: 300}]}));

            var soknaderCollectionModel = new ns.SoknadCollectionModel({'collection': soknaderCollection});

            var testView = new ns.SaksbehandlerSoknadTableView({
                model: soknaderCollectionModel,
                collection: soknaderCollection
            });

            testView.render();

            _.each(testView.$('.lagre_innstilling_button'), function (button) {
                assert.isTrue($(button).hasClass('hidden'));
            });

            _.each(testView.$('.lagre_vedtak_button'), function (button) {
                assert.isTrue($(button).hasClass('hidden'));
            });

            _.each(testView.$('.godkjenn_vedtak_button'), function (button) {
                assert.isTrue($(button).hasClass('hidden'));
            });

            _.each(testView.$('.tilbake_til_innstilling_button'), function (button) {
                assert.isTrue($(button).hasClass('hidden'));
            });
        },
        "Test editability of columns in saksbehandler mode": function () {
            var soknaderCollection = new ns.SoknadsListeCollection();
            soknaderCollection.add(new TestSoknadModel({id: 1, levert_dato: '2014-01-02', status: 'Til vedtak', omsokt_belop: 10, vedtak: [{innstilt_belop: 20, vedtatt_belop: 30}]}));
            soknaderCollection.add(new TestSoknadModel({id: 2, levert_dato: '2014-01-01', status: 'Under behandling', omsokt_belop: 100, vedtak: [{innstilt_belop: 200, vedtatt_belop: 300}]}));

            var soknaderCollectionModel = new ns.SoknadCollectionModel({'collection': soknaderCollection});

            var testView = new ns.SaksbehandlerSoknadTableView({
                model: soknaderCollectionModel,
                collection: soknaderCollection,
                mode: 'saksbehandler'
            });

            testView.render();

            var innstiltListe = testView.$('.id_innstilt_belop');
            assert.equals(2, innstiltListe.length);

            assert.equals('disabled', $(innstiltListe[0]).attr('disabled'));
            assert.equals('readonly', $(innstiltListe[0]).attr('readonly'));

            assert.isTrue(_.isUndefined($(innstiltListe[1]).attr('disabled')));
            assert.isTrue(_.isUndefined($(innstiltListe[1]).attr('readonly')));


            var vedtattListe = testView.$('.id_vedtatt_belop');
            assert.equals(2, vedtattListe.length);
            _.each(vedtattListe, function (vedtatt) {
                assert.equals('disabled', $(vedtatt).attr('disabled'));
                assert.equals('readonly', $(vedtatt).attr('readonly'));
            });
        },
        "Test editability of columns in godkjenner mode": function () {
            var soknaderCollection = new ns.SoknadsListeCollection();
            soknaderCollection.add(new TestSoknadModel({id: 1, levert_dato: '2014-01-02', status: 'Til vedtak', omsokt_belop: 10, vedtak: [{innstilt_belop: 20, vedtatt_belop: 30}]}));
            soknaderCollection.add(new TestSoknadModel({id: 2, levert_dato: '2014-01-01', status: 'Under behandling', omsokt_belop: 100, vedtak: [{innstilt_belop: 200, vedtatt_belop: 300}]}));

            var soknaderCollectionModel = new ns.SoknadCollectionModel({'collection': soknaderCollection});

            var testView = new ns.SaksbehandlerSoknadTableView({
                model: soknaderCollectionModel,
                collection: soknaderCollection,
                mode: 'godkjenner'
            });

            testView.render();

            var innstiltListe = testView.$('.id_innstilt_belop');
            assert.equals(2, innstiltListe.length);
            _.each(innstiltListe, function (innstilt) {
                assert.equals('disabled', $(innstilt).attr('disabled'));
                assert.equals('readonly', $(innstilt).attr('readonly'));
            });


            var vedtattListe = testView.$('.id_vedtatt_belop');
            assert.equals(2, vedtattListe.length);

            assert.equals('disabled', $(vedtattListe[1]).attr('disabled'));
            assert.equals('readonly', $(vedtattListe[1]).attr('readonly'));

            assert.isTrue(_.isUndefined($(vedtattListe[0]).attr('disabled')));
            assert.isTrue(_.isUndefined($(vedtattListe[0]).attr('readonly')));

        },
        "Test editability of columns with no mode": function () {
            var soknaderCollection = new ns.SoknadsListeCollection();
            soknaderCollection.add(new TestSoknadModel({id: 1, levert_dato: '2014-01-02', status: 'Til vedtak', omsokt_belop: 10, vedtak: [{innstilt_belop: 20, vedtatt_belop: 30}]}));
            soknaderCollection.add(new TestSoknadModel({id: 2, levert_dato: '2014-01-01', status: 'Under behandling', omsokt_belop: 100, vedtak: [{innstilt_belop: 200, vedtatt_belop: 300}]}));

            var soknaderCollectionModel = new ns.SoknadCollectionModel({'collection': soknaderCollection});

            var testView = new ns.SaksbehandlerSoknadTableView({
                model: soknaderCollectionModel,
                collection: soknaderCollection
            });

            testView.render();

            var innstiltListe = testView.$('.id_innstilt_belop');
            assert.equals(2, innstiltListe.length);
            _.each(innstiltListe, function (innstilt) {
                assert.equals('disabled', $(innstilt).attr('disabled'));
                assert.equals('readonly', $(innstilt).attr('readonly'));
            });


            var vedtattListe = testView.$('.id_vedtatt_belop');
            assert.equals(2, vedtattListe.length);
            _.each(vedtattListe, function (vedtatt) {
                assert.equals('disabled', $(vedtatt).attr('disabled'));
                assert.equals('readonly', $(vedtatt).attr('readonly'));
            });

        }
    });

}(Tilskudd));