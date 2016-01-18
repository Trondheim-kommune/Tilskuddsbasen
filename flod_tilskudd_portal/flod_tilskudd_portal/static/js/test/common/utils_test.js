/*global buster, console*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var assert = assert || buster.referee.assert;
    var refute = refute || buster.referee.refute;

    buster.testCase("TestDateFunctions", {

        "Test that null or empty date does not fail ": function () {
            refute.exception(function () {
                ns.formatDato(null);
                ns.formatDato("");
            });
        },

        "Test that date formatting is as expected ": function () {
            assert.equals("11.02.2014", ns.formatDato("2014-02-11"));
            assert.equals("03.08.2014", ns.formatDato("2014-08-03T12:41:29Z"));
        },

        "Test that date formatting throws exception on erroneous input": function () {
            assert.exception(function() {
                ns.formatDato("hei på deg");
            });
        }
    });

    buster.testCase("TestformatDateNoToIsoFunctions", {

        "Test that null or empty date does not fail ": function () {
            refute.exception(function () {
                ns.formatDateNoToIso(null);
                ns.formatDateNoToIso("");
            });
        },

        "Test that date formatting is as expected ": function () {
            assert.equals("2014-02-11", ns.formatDateNoToIso("11.02.2014"));
        },

        "Test that date formatting throws exception on erroneous input": function () {
            assert.exception(function() {
                ns.formatDato("hei på deg");
            });
        }
    });

}(Tilskudd));