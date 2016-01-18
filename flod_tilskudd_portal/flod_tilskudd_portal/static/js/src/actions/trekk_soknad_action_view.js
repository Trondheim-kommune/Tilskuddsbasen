/*global window */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.TrekkSoknadActionView = ns.BaseSavingActionContentView.extend({
        template: "#trekk_soknad_action_template",
        bindings: {
            "#id_trukket_kommentar": "trukket_kommentar"
        },

        redirectOnSaveSuccess: function () {
            window.location.href = "/soknad/" + this.model.soknad_id;
        }

    });
})(Tilskudd);