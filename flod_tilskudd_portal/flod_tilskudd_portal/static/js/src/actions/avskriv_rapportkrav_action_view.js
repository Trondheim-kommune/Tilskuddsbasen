/*global console, _ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.AvskrivRapportkravActionView = ns.BaseSavingActionContentView.extend({
        template: "#avskriv_rapportkrav_action_template",
        bindings: {
            "#id_merknad_orsak": "avskrevet_rapportkrav_kommentar"
        },

        redirectOnSaveSuccess: function () {
            window.location.href = '/soknad/' + this.model.soknad_id;
        }
    });
})(Tilskudd);