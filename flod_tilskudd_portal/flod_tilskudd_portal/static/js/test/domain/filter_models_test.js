/*global buster, console, $, Backbone, _, debugger*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var assert = assert || buster.referee.assert;
    var refute = refute || buster.referee.refute;
    var severalFacets = [
        {
            'facetName': 'Tilskuddsordning',
            'facetType': 'anyof',
            'values': [
                {
                    'valueName': 'Tilskudd IL'
                },
                {
                    'valueName': 'Frivillighetsmillionen 2014'
                }
            ]
        },
        {
            'facetName': 'Søker',
            'facetType': 'anyof',
            'values': [
                {
                    'valueName': 'Ola normann'
                },
                {
                    'valueName': 'Kvik Fotball'
                },
                {
                    'valueName': 'Ranheim FK'
                },
                {
                    'valueName': 'Baklandets velforening'
                }
            ]
        },
        {
            'facetName': 'Navn på aktivitet/prosjekt',
            'facetType': 'free',
            'values': [
                {
                    'valueName': ''
                }
            ]
        },
        {
            'facetName': 'Saksnummer',
            'facetType': 'free',
            'values': [
                {
                    'valueName': ''
                }
            ]
        },
        {
            'facetName': 'Dato Levert',
            'facetType': 'oneof',
            'values': [
                {
                    'valueName': 'siste 7 dager'
                },
                {
                    'valueName': 'siste måned'
                },
                {
                    'valueName': 'siste 3 måneder'
                },
                {
                    'valueName': 'siste 12 måneder'
                },
                {
                    'valueName': 'Alle'
                }
            ]
        },
        {
            'facetName': 'Dato brev sendt',
            'facetType': 'oneof',
            'values': [
                {
                    'valueName': 'siste 7 dager'
                },
                {
                    'valueName': 'siste måned'
                },
                {
                    'valueName': 'siste 3 måneder'
                },
                {
                    'valueName': 'siste 12 måneder'
                },
                {
                    'valueName': 'Alle'
                }
            ]
        },
        {
            'facetName': 'Dato rapportfrist',
            'facetType': 'oneof',
            'values': [
                {
                    'valueName': 'I løpet av de neste 12 måneder'
                },
                {
                    'valueName': 'I løpet av de neste 3 måneder'
                },
                {
                    'valueName': 'I løpet av neste måned'
                },
                {
                    'valueName': 'I løpet av de neste 7 dagene'
                },
                {
                    'valueName': 'over fristen'
                },
                {
                    'valueName': 'Alle'
                }
            ]
        },
        {
            'facetName': 'Merknad',
            'facetType': 'free',
            'values': [
                {
                    'valueName': ''
                }
            ]
        },
        {
            'facetName': 'Status',
            'facetType': 'anyof',
            'values': [
                {
                    'valueName': 'Kladd'
                },
                {
                    'valueName': 'Trukket'
                },
                {
                    'valueName': 'Til Godkjenning'
                }
            ]
        },
        {
            'facetName': 'Søknadsbeløp',
            'facetType': 'anyof',
            'values': [
                {
                    'valueName': '0-5000'
                },
                {
                    'valueName': '5001-10000'
                },
                {
                    'valueName': '10001-20000'
                },
                {
                    'valueName': '20000-50000'
                },
                {
                    'valueName': '50000-1200000'
                },
                {
                    'valueName': '1200000 og mer'
                }
            ]
        },
        {
            'facetName': 'Innstilt beløp',
            'facetType': 'anyof',
            'values': [
                {
                    'valueName': '0-5000'
                },
                {
                    'valueName': '5001-10000'
                },
                {
                    'valueName': '10001-20000'
                },
                {
                    'valueName': '20000-50000'
                },
                {
                    'valueName': '50000-1200000'
                },
                {
                    'valueName': '1200000 og mer'
                }
            ]
        },
        {
            'facetName': 'Vedtatt beløp',
            'facetType': 'anyof',
            'values': [
                {
                    'valueName': '0-5000'
                },
                {
                    'valueName': '5001-10000'
                },
                {
                    'valueName': '10001-20000'
                },
                {
                    'valueName': '20000-50000'
                },
                {
                    'valueName': '50000-1200000'
                },
                {
                    'valueName': '1200000 og mer'
                }
            ]
        }
    ];
    var oneFacet =
    {
        'facetName': 'Tilskuddsordning',
        'facetType': 'anyof',
        'values': [
            {
                'valueName': 'Tilskudd IL'
            },
            {
                'valueName': 'Frivillighetsmillionen 2014'
            }
        ]
    };
    var oneFacetValue =
    {
        'valueName': 'Frivillighetsmillionen 2014'
    };


    var setup = function () {
        ns.test_tools.backupTilskuddApp();
    };

    var teardown = function () {
        ns.test_tools.resetTilskuddApp();
    };

    buster.testCase("FacetCollectionTests", {

        setUp: function () {
            setup();

        },

        tearDown: function () {
            teardown();
        },


        "Test reset collection regenerates new facetIds": function () {
            // setup
            var facetCollection = new ns.FacetCollection();

            // run code under test
            facetCollection.reset(severalFacets);

            // verify
            facetCollection.each(function (facet) {
                assert.defined(facet.get('facetId'));
                assert.isNumber(facet.get('facetId'));
            });
        },

        "Test reset collection twice regenerates the same facetIds": function () {
            // setup
            var facetCollection = new ns.FacetCollection();
            facetCollection.reset(severalFacets);
            var facetIds = [];
            facetCollection.each(function (facet) {
                facetIds.push(facet.get('facetId'));
            });

            // run code under test
            facetCollection.reset(severalFacets);

            // verify
            var facetIdsAfterSecondReset = [];
            facetCollection.each(function (facet) {
                facetIdsAfterSecondReset.push(facet.get('facetId'));
            });
            assert.equals(facetIds.length, facetIdsAfterSecondReset.length);

            _.each(facetIdsAfterSecondReset, function (id) {
                assert.contains(facetIds, id);
            });
        },

        "Test reset collection sets facetIds, facetName and value on all facetValues": function () {
            // setup
            var facetCollection = new ns.FacetCollection();

            // run code under test
            facetCollection.reset(severalFacets);

            // verify
            facetCollection.each(function (facet) {
                var facetId = facet.get('facetId');
                var facetName = facet.get('facetName');
                _.each(facet.get('values'), function (value) {
                    assert.equals(facetId, value.facetId);
                    assert.equals(facetName, value.facetName);
                    assert.defined(value.valueId);
                    assert.isNumber(value.valueId);
                });
            });

        }


    });

    buster.testCase("FacetModelTests", {

        setUp: function () {
            setup();

        },

        tearDown: function () {
            teardown();
        },


        "Test initialize facet model sets up a value array": function () {
            // setup

            // run code under test
            var facet = new ns.FacetModel(oneFacet);

            // verify
            assert.defined(facet.get('values'));
            assert.isArray(facet.get('values'));
        },

        "Test initialize facet model sets up a values": function () {
            // setup

            // run code under test
            var facet = new ns.FacetModel(oneFacet);

            // verify
            var facetId = facet.get('facetId');
            var facetName = facet.get('facetName');
            _.each(facet.get('values'), function (value) {
                assert.equals(facetId, value.facetId);
                assert.equals(facetName, value.facetName);
                assert.defined(value.valueId);
                assert.isNumber(value.valueId);
            });
        }

    });

    buster.testCase("FacetValueTests", {

        setUp: function () {
            setup();

        },

        tearDown: function () {
            teardown();
        },


    });


}(Tilskudd));
