/*global console, _, window */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.RedigereRapportfristActionView = ns.BaseSavingActionContentView.extend({
        template: "#redigere_rapportfrist_action_template",
        bindings: {
            "#id_rapport_frist": "rapportfrist",
            "#id_trekk_orsak": "endre_rapportfrist_arsak"
        },

        initialize: function () {
            this.soknadModel = this.options.soknadModel;
            var vedtak = this.soknadModel.getSisteVedtak();
            if (_.isUndefined(vedtak)) {
                this.model.set('rapportfrist', this.soknadModel.get('tilskuddsordning').rapportfrist);
            } else {
                this.model.set('vedtak_id', vedtak.id);
                this.model.set('rapportfrist', vedtak.rapportfrist);
            }
            this.model.set('endre_rapportfrist_arsak', "");
        },

        redirectOnSaveSuccess: function () {
            window.location.href = '/soknad/' + this.model.soknad_id;
        }
    });
})(Tilskudd);