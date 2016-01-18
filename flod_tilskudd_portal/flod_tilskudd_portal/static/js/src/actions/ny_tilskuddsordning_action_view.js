/*global console, _ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.NySoknadslisteActionView = ns.BaseSavingActionContentView.extend({
        template: '#ny_tilskuddsordning_action_template',
        bindings: {
            "#id_navn": "navn"
        },

        redirectOnSaveSuccess: function() {
            window.location.href = "/admin/tilskuddsordning/" + this.model.id + "/edit/";
        }
    });
})(Tilskudd);

