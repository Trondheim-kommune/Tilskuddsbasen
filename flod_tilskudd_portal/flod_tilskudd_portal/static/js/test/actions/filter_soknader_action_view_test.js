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
    var setup = function (templatePath) {
        ns.test_tools.backupTilskuddApp();
        ns.test_tools.loadTemplateInDocumentBody(templatePath);
    };

    var teardown = function () {
        ns.test_tools.restoreOriginalDocumentBody();
        ns.test_tools.resetTilskuddApp();
    };

    buster.testCase("CompressionUtilsTests", {

        setUp: function () {
            setup("/actions/filter_action_content");

        },

        tearDown: function () {
            teardown();
        },


        "Test encode/decode gives back the original object": function () {
            var encoded = ns.CompressionUtils.toCompressedString(severalFacets);
            var decoded = ns.CompressionUtils.toUncompressedArray(encoded);

            assert.equals(decoded, severalFacets);

        }

    });

    buster.testCase("CompressionUtilsTests", {
        filterSoknaderActionView: undefined,
        ajax: undefined,

        setUp: function () {
            setup("/actions/filter_action_content");
            this.ajax = Backbone.ajax;
            var collection = new Tilskudd.FacetCollection();
            Backbone.ajax = function () {
                // The code has modifies the json, so we have to copy
                // to avoid errors when tests expect the original version in this file...
                var copyOfSeveralFacets = JSON.parse(JSON.stringify(severalFacets));
                collection.add(copyOfSeveralFacets);
                return copyOfSeveralFacets;
            };
            this.filterSoknaderActionView = new Tilskudd.FilterSoknaderActionView(
                {
                    collection: collection
                });
        },

        tearDown: function () {
            teardown();
            Backbone.ajax = this.ajax;
        },

        "Test collect facets ": function () {
            // run code
            var facets = this.filterSoknaderActionView.collectFacets();

            // verify
            assert.equals(0, facets.length);
        },

        "Test collect facets when history set to page without filter query parameter ": function () {
            // setup
            Backbone.history.navigate("soknader?action=Filter", {trigger: true});

            // run code
            var facets = this.filterSoknaderActionView.collectFacets();

            // verify
            assert.equals(0, facets.length);
        }

    });

}(Tilskudd));
