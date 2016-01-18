/*global Backbone, moment, _, $, window, console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";
    ns.AnnetView = ns.BaseContentEditView.extend({
        template: "#annet_template",

        bindings: {
            "#id_kommentar": "kommentar"
        }
    });


}(Tilskudd));
