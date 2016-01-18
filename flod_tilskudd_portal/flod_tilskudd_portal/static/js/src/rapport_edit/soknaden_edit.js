/*global Backbone, window*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.RapportSoknadenView = ns.SoknadSummaryView.extend({
        template: "#rapport_view_soknaden_template"
    });

}(Tilskudd));