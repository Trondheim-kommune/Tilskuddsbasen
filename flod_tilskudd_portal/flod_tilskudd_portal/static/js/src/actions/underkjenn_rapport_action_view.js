/*global console, _ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.UnderkjennRapportActionView = ns.BaseSavingActionContentView.extend({
        template: "#underkjenn_rapport_action_template",
        bindings: {
            "#id_merknad_orsak": "saksbehandler_kommentar"
        },

        redirectOnSaveSuccess: function () {
            window.location.href = '/soknad/' + this.model.soknad_id;
        }
    });
})(Tilskudd);