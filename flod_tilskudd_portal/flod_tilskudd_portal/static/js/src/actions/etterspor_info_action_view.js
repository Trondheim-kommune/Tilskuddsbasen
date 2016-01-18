/*global console, _, window */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.ApneSoknadForRedigeringActionView = ns.BaseSavingActionContentView.extend({
        template: "#apne_soknad_for_redigering_action_template",
        bindings: {
            "#id_merknad": "merknad"
        },

        initialize: function () {
            this.soknadModel = this.options.soknadModel;
            this.model.set('merknad', this.soknadModel.get('merknad'));
        },

        redirectOnSaveSuccess: function () {
            window.location.href = "/soknad/" + this.model.soknad_id;
        }

    });
})(Tilskudd);