/*global console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";


    ns.NyRapportActionView = ns.BaseSavingActionContentView.extend({
        template: "#ny_rapport_action_template",
        redirectOnSaveSuccess: function () {
            window.location.href = '/soknad/' + this.model.soknad_id + "/rapport/" + this.model.id + "/edit";
        }
    });
})(Tilskudd);