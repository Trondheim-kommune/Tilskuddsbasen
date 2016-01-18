/*global buster, console*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var assert = assert || buster.referee.assert;
    var refute = refute || buster.referee.refute;

    buster.testCase("Test_SoknadModel_GetSisteVedtak", {

        "Test that null does not fail ": function () {
            var soknad = new ns.SoknadModel({'vedtak': null});
            refute.exception(function () {
                soknad.getSisteVedtak();
            });
        },

        "Test that empty list does not fail ": function () {
            var soknad = new ns.SoknadModel({'vedtak': []});
            refute.exception(function () {
                soknad.getSisteVedtak();
            });
        },

        "Test that getSisteVedtak returns the one and only vedtak": function () {
            var soknad = new ns.SoknadModel({
                'vedtak': [
                    {'id': 100, 'vedtaksdato': '2014-01-14'}
                ]
            });
            var vedtak = soknad.getSisteVedtak();
            assert.equals(100, vedtak.id);
        },

        "Test that getSisteVedtak returns vedtak with highest vedtaksdato": function () {
            var soknad = new ns.SoknadModel({
                'vedtak': [
                    {'id': 1, 'vedtaksdato': '2014-01-14'},
                    {'id': 2, 'vedtaksdato': '2014-01-15'},
                    {'id': 3, 'vedtaksdato': '2014-01-12'},
                    {'id': 4, 'vedtaksdato': '2013-11-15'}
                ]
            });
            var vedtak = soknad.getSisteVedtak();
            assert.equals(2, vedtak.id);
        },

        "Test that getSisteVedtak returns highest id if multiple with same vedtaksdato": function () {
            var soknad = new ns.SoknadModel({
                'vedtak': [
                    {'id': 11, 'vedtaksdato': '2014-01-14'},
                    {'id': 12, 'vedtaksdato': '2014-01-14'}
                ]
            });
            var vedtak = soknad.getSisteVedtak();
            assert.equals(12, vedtak.id);
        },

        "Test that getSisteVedtak returns the one without vedtaksdato if multiple vedtak": function () {
            var soknad = new ns.SoknadModel({'vedtak': [
                {'id': 21, 'vedtaksdato': '2014-01-14'},
                {'id': 22, 'vedtaksdato': null},
                {'id': 23, 'vedtaksdato': '2014-01-14'}
            ]});
            var vedtak = soknad.getSisteVedtak();
            assert.equals(22, vedtak.id);
        },
        "Test that getSisteVedtak returns the one highest id if multiple without vedtaksdato": function () {
            var soknad = new ns.SoknadModel({
                'vedtak': [
                    {'id': 21, 'vedtaksdato': '2014-01-14'},
                    {'id': 22, 'vedtaksdato': '2014-01-14'},
                    {'id': 24, 'vedtaksdato': null},
                    {'id': 23, 'vedtaksdato': null}
                ]
            });
            var vedtak = soknad.getSisteVedtak();
            assert.equals(24, vedtak.id);
        }
    });

    buster.testCase("Test_SoknadModel_GetNyesteFattetVedtak", {

        "Test that null does not fail ": function () {
            var soknad = new ns.SoknadModel({'vedtak': null});
            refute.exception(function () {
                soknad.getNyesteFattetVedtak();
            });
        },

        "Test that empty list does not fail ": function () {
            var soknad = new ns.SoknadModel({'vedtak': []});
            refute.exception(function () {
                soknad.getNyesteFattetVedtak();
            });
        },

        "Test that getNyesteVedtak returns the one and only vedtak": function () {
            var soknad = new ns.SoknadModel({
                'vedtak': [
                    {'id': 100, 'vedtaksdato': '2014-01-14'}
                ]
            });
            var vedtak = soknad.getNyesteFattetVedtak();
            assert.equals(100, vedtak.id);
        },

        "Test that getNyesteVedtak returns vedtak with highest vedtaksdato": function () {
            var soknad = new ns.SoknadModel({
                'vedtak': [
                    {'id': 1, 'vedtaksdato': '2014-01-14'},
                    {'id': 2, 'vedtaksdato': '2014-01-15'},
                    {'id': 3, 'vedtaksdato': '2014-01-12'},
                    {'id': 4, 'vedtaksdato': '2013-11-15'}
                ]
            });
            var vedtak = soknad.getNyesteFattetVedtak();
            assert.equals(2, vedtak.id);
        },

        "Test that getNyesteVedtak returns highest id if multiple with same vedtaksdato": function () {
            var soknad = new ns.SoknadModel({
                'vedtak': [
                    {'id': 11, 'vedtaksdato': '2014-01-14'},
                    {'id': 12, 'vedtaksdato': '2014-01-14'}
                ]
            });
            var vedtak = soknad.getNyesteFattetVedtak();
            assert.equals(12, vedtak.id);
        },

        "Test that getNyesteVedtak returns the one with vedtaksdato if the newest one does not have a vedtaksdato": function () {
            var soknad = new ns.SoknadModel({
                'vedtak': [
                    {'id': 21, 'vedtaksdato': '2014-01-14'},
                    {'id': 22, 'vedtaksdato': '2014-01-14'},
                    {'id': 23, 'vedtaksdato': null}
                ]
            });
            var vedtak = soknad.getNyesteFattetVedtak();
            assert.equals(22, vedtak.id);
        }
    });

    buster.testCase("SoknaderTest", {

        "Test that soknader are sorted by levert dato": function () {
            refute.exception(function () {
                var soknaderCollection = new ns.SoknadCollection();
                soknaderCollection.add(new ns.SoknadModel({id: 1, levert_dato: "2012-11-30", person: {name: 'Tanja'}, status: "Tull"}));
                soknaderCollection.add(new ns.SoknadModel({id: 2, levert_dato: "2012-11-30", person: {name: 'Tanja2'}, status: "Tull"}));
                soknaderCollection.add(new ns.SoknadModel({id: 3, levert_dato: null, person: {name: 'Tanja3'}, status: "Kladd"}));
                soknaderCollection.add(new ns.SoknadModel({id: 4, levert_dato: null, person: {name: 'Tanja4'}, status: "Kladd"}));
                soknaderCollection.add(new ns.SoknadModel({id: 5, levert_dato: "2013-11-30", person: {name: 'Tanja5'}, status: "Avslått"}));

                var current = -1;
                var res = true;

                soknaderCollection.each(function (soknad) {
                    if (current !== -1) {
                        var tmp = new Date(soknad.get('levert_dato')).getTime();
                        if ((tmp === 0) && (current !== 0)) {
                            res = false;
                        } else if ((current >= tmp) || (current === 0)) {
                            current = tmp;
                        } else {
                            res = false;
                        }
                    } else {
                        current = new Date(soknad.get('levert_dato')).getTime();
                    }
                });
                assert.isTrue(res);
            });
        }
    });

}(Tilskudd));