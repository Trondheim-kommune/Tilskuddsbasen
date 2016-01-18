/*global buster, console, $, Backbone, _*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.test_tools = {};
    ns.test_tools.templates = [];

    /**
     * Used to load a given template in document body. The current document body is saved, so that it can be restored
     * when calling ns.test_tools.restoreOriginalDocumentBody.
     *
     * The templates are also cached for not having to read them many times.
     */
    ns.test_tools.loadTemplateInDocumentBody = function (templatePath) {
        var ctxPath = "";
        // There is no contextPath when buster-static is useds
        if (buster.env.contextPath !== undefined) {
            ctxPath = buster.env.contextPath;
        }
        var templateUrl = ctxPath + templatePath;

        function updateDocumentBody(response) {
            // when running buster-server the document body contains the report buster is building,
            // we have to make sure it does not get wasted by our dom manipulations
            ns.test_tools.documentBodyBackup = document.body;
            document.body = document.createElement("body");
            $(document.body).html(response);
        }

        if (ns.test_tools.templates[templateUrl] !== undefined) {
            console.log("Html template already in cache: " + templatePath);
            updateDocumentBody(ns.test_tools.templates[templateUrl]);
        } else {
            $.ajax({
                async: false,
                url: templateUrl,
                success: function (template) {
                    console.log("Html template read from disk: " + templatePath);
                    ns.test_tools.templates[templateUrl] = template;
                    updateDocumentBody(template);
                }
            });
        }

    };

    /**
     * Used to backup some of the commonly overloaded TilskuddApp functions and properties
     */
    ns.test_tools.backupTilskuddApp = function () {
        this.backboneSync = Backbone.sync;
        this.backboneHistoryNavigate = Backbone.History.navigate;
        this.tilskuddappVentTrigger = ns.TilskuddApp.vent.trigger;
    };
    /**
     * Used to restore the original document body, should always be called in teardown of testsuites modifying the
     * document body. Not doing so would make the test fail in buster-static.
     */
    ns.test_tools.restoreOriginalDocumentBody = function () {
        if (ns.test_tools.documentBodyBackup !== undefined) {
            document.body = ns.test_tools.documentBodyBackup;
            ns.test_tools.documentBodyBackup = undefined;
        }
    };

    /**
     * Used to restore the original state of the TilskuddApp object, which can be altered when running tests.
     */
    ns.test_tools.resetTilskuddApp = function () {
        Backbone.sync = this.backboneSync;
        Backbone.History.navigate = this.backboneHistoryNavigate;
        ns.TilskuddApp.vent.trigger = this.tilskuddappVentTrigger;
        ns.TilskuddApp.controller.urlQueryParameterSubscriptions = [];
    };


}(Tilskudd));