/*global buster, console, $, Backbone, _*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var assert = assert || buster.referee.assert;
    var refute = refute || buster.referee.refute;

    var setUp = function()  {
        ns.test_tools.backupTilskuddApp();
    };

    var teardown = function () {
        ns.test_tools.resetTilskuddApp();
    };

    buster.testCase("TilskuddApp.controllerTests", {

        setUp: function () {
            setUp();
            var eventHistory = [];
            ns.TilskuddApp.vent.trigger = function (event, value) {
                eventHistory.push([event, value]);
            };
            var navigationHistory = [];
            Backbone.history.navigate = function (fragment) {
                navigationHistory.push(fragment);
            };

            this.eventHistory = eventHistory;
            this.navigationHistory = navigationHistory;
        },

        tearDown: function () {
            teardown();
        },

        "Test that conversion from query string to object works as expected": function () {
            assert.equals({}, ns.TilskuddApp.controller.queryStringToObject(""));
            assert.equals({"menu": "Oversikt"}, ns.TilskuddApp.controller.queryStringToObject("menu=Oversikt"));
            assert.equals({"menu": "Oversikt", "action": "Trekk søknad"}, ns.TilskuddApp.controller.queryStringToObject("menu=Oversikt&action=Trekk%20s%C3%B8knad"));
            assert.equals({menu: "Om Søker", lang: "no"}, ns.TilskuddApp.controller.queryStringToObject("menu=Om%20S%C3%B8ker&lang=no"));
        },

        "Test that path string is found in various urls": function () {
            assert.equals("http://example.com:1234/#something", ns.TilskuddApp.controller.getPathString("http://example.com:1234/#something?query=all"));
            assert.equals("http://example.com:1234/#something", ns.TilskuddApp.controller.getPathString("http://example.com:1234/#something"));
            assert.equals("/#something", ns.TilskuddApp.controller.getPathString("/#something?query=all"));
            assert.equals("", ns.TilskuddApp.controller.getPathString("?query=all"));
            assert.equals("", ns.TilskuddApp.controller.getPathString("?query=all"));
        },

        "Test that query string is found in various urls": function () {
            assert.equals("query=all", ns.TilskuddApp.controller.getQueryString("http://example.com:1234/#something?query=all"));
            assert.equals("query=all&ask=everything", ns.TilskuddApp.controller.getQueryString("/#something?query=all&ask=everything"));
            assert.equals("", ns.TilskuddApp.controller.getQueryString("http://example.com:1234/#something"));
        },

        "Test that no notification is emitted for unknown parameters": function () {
            // setup
            Backbone.history.fragment = "/#something/?query=all&lang=no&menu=sak&action=ny";

            // run the code to test
            ns.TilskuddApp.controller.setQueryStringAndNotifyQueryParameterSubscribers();

            // verify
            assert.equals([], this.eventHistory);
        },

        "Test that correct notifications are emitted for known parameters": function () {
            // setup
            ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(new ns.TilskuddApp.UrlQueryParameterSubscription("action", "queryparam:uppdateAppFromURL", "queryparam:updateURLFromApp"));
            Backbone.history.fragment = "/#something/?query=all&lang=no&menu=sak&action=ny";

            // run the code to test
            ns.TilskuddApp.controller.setQueryStringAndNotifyQueryParameterSubscribers();

            // verify
            assert.equals([
                ["queryparam:uppdateAppFromURL", "ny"]
            ], this.eventHistory);

        },

        "Test that correct notifications are emitted for known parameters even when none are present": function () {
            // setup
            ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(new ns.TilskuddApp.UrlQueryParameterSubscription("action", "queryparam:uppdateAppFromURL", "queryparam:updateURLFromApp"));
            Backbone.history.fragment = "/#something/";

            // run the code to test
            ns.TilskuddApp.controller.setQueryStringAndNotifyQueryParameterSubscribers();

            // verify
            assert.equals([["queryparam:uppdateAppFromURL", []]], this.eventHistory);
        },


        "Test that correct notifications are emitted for known parameters when several are present": function () {
            // setup
            ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(new ns.TilskuddApp.UrlQueryParameterSubscription("action", "queryparam:actionUppdateAppFromURL", "queryparam:actionUpdateURLFromApp"));
            ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(new ns.TilskuddApp.UrlQueryParameterSubscription("menu", "queryparam:menuUppdateAppFromURL", "queryparam:menuUpdateURLFromApp"));
            Backbone.history.fragment = "/#something/?query=all&lang=no&menu=sak&action=Trekk%20s%C3%B8knad";

            // run the code to test
            ns.TilskuddApp.controller.setQueryStringAndNotifyQueryParameterSubscribers();

            // verify
            assert.equals([
                ["queryparam:actionUppdateAppFromURL", "Trekk søknad"],
                ["queryparam:menuUppdateAppFromURL", "sak"]
            ], this.eventHistory);
        },

        "Test that correct register query parameter subscription asserts that mandatory fields are present": function () {
            // setup

            // run and verify
            assert.exception(function () {
                ns.TilskuddApp.controller.registerUrlQueryParameterSubscription({name: "menu"});
            });
            assert.exception(function () {
                ns.TilskuddApp.controller.registerUrlQueryParameterSubscription({updateFromUrlEvent: "event1"});
            });
            assert.exception(function () {
                ns.TilskuddApp.controller.registerUrlQueryParameterSubscription({updateFromAppEvent: "event2"});
            });
            assert.exception(function () {
                ns.TilskuddApp.controller.registerUrlQueryParameterSubscription({name: "menu", updateFromUrlEvent: "event1"});
            });
            assert.exception(function () {
                ns.TilskuddApp.controller.registerUrlQueryParameterSubscription({qParamName: "menu", event1: "event1", event2: "event2"});
            });

            refute.exception(function () {
                ns.TilskuddApp.controller.registerUrlQueryParameterSubscription({qParamName: "menu", updateFromUrlEvent: "event1", updateFromAppEvent: "event2"});
            });
            refute.exception(function () {
                ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(new ns.TilskuddApp.UrlQueryParameterSubscription("menu2", "event3", "event4"));
            });

        },

        "Test that correct register query parameter subscription asserts that new subscription uses a different parameter name than the already existing subscriptions": function () {
            // setup
            ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(new ns.TilskuddApp.UrlQueryParameterSubscription("menu", "event1", "event2"));

            // run and verify
            assert.exception(function () {
                ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(new ns.TilskuddApp.UrlQueryParameterSubscription("menu", "event3", "event4"));
            });
            refute.exception(function () {
                ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(new ns.TilskuddApp.UrlQueryParameterSubscription("menu2", "event3", "event4"));
            });
        },

        "Test that correct register query parameter subscription asserts that new subscription uses events names which are not already taken": function () {
            // setup
            ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(new ns.TilskuddApp.UrlQueryParameterSubscription("menu", "event1", "event2"));

            // run and verify
            assert.exception(function () {
                ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(new ns.TilskuddApp.UrlQueryParameterSubscription("menu2", "event1", "event4"));
            });
            assert.exception(function () {
                ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(new ns.TilskuddApp.UrlQueryParameterSubscription("menu2", "event3", "event1"));
            });
            assert.exception(function () {
                ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(new ns.TilskuddApp.UrlQueryParameterSubscription("menu2", "event2", "event1"));
            });
            refute.exception(function () {
                ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(new ns.TilskuddApp.UrlQueryParameterSubscription("menu2", "event3", "event4"));
            });
        },


        "Test that fragment gets updated correctly when query parameter changes in app and that Backbone.history.navigate gets called": function () {
            // setup
            ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(new ns.TilskuddApp.UrlQueryParameterSubscription("action", "event1", "event2"));
            Backbone.history.fragment = "/#something?query=all&lang=no&menu=sak&action=ny";

            // run and verify
            ns.TilskuddApp.controller.updateQueryParamInFragment(new ns.TilskuddApp.UrlQueryParameterSubscription("action", "event1", "event2"), "Slett");
            // verify
            assert.equals(["/#something?query=all&lang=no&menu=sak&action=Slett"], this.navigationHistory);

        },

        "Test that fragment gets updated correctly when the query parameter is removed in app and that Backbone.history.navigate gets called": function () {
            // setup
            ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(new ns.TilskuddApp.UrlQueryParameterSubscription("action", "event1", "event2"));
            Backbone.history.fragment = "/#something?query=all&lang=no&menu=sak&action=ny";

            // run and verify
            ns.TilskuddApp.controller.updateQueryParamInFragment(new ns.TilskuddApp.UrlQueryParameterSubscription("action", "event1", "event2"), undefined);
            // verify
            assert.equals(["/#something?query=all&lang=no&menu=sak"], this.navigationHistory);

        }


    });


}(Tilskudd));
