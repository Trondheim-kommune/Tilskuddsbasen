/*global console, _ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.NyStdTekstActionView = ns.BaseSavingActionContentView.extend({
        template: '#ny_stdtekst_action_template',
        bindings: {
            "#id_navn": "navn"
        },

        redirectOnSaveSuccess: function() {
            window.location.href = "/admin/standardtekst/" + this.model.id + "/edit";
        }
    });
})(Tilskudd);