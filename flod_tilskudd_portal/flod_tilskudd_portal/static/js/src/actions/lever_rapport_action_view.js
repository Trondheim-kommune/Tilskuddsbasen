/*global console, _ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.LeverRapportActionView = ns.BaseSavingActionContentView.extend({
        template: "#lever_rapport_action_template",

        keyToTextMapping: function(key) {
            var keyToText = {
                "arrangement" : "arrangement ",
                "okonomipost" : "regnskap",
                "prosjekt_avvik" : "avvik ift søknaden",
                "prosjekt_gjennomforing" : "prosjekt gjennomforing",
                "resultat_kommentar" : "hva gjøres med over/underskudd"
            };
            var text = keyToText[key];
            if (_.isUndefined(text)) {
                text = key;
            }
            return text;
        },

        redirectOnSaveSuccess: function () {
            window.location.href = '/soknad/' + this.model.soknad_id;
        }
    });
})(Tilskudd);