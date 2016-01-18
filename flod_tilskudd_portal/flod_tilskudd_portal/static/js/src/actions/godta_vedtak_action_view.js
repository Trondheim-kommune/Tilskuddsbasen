/*global console, _, window */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.GodtaVedtakActionView = ns.BaseSavingActionContentView.extend({
        template: "#godta_vedtak_action_template",

        initialize: function () {
            this.soknadModel = this.options.soknadModel;
            var vedtak = this.soknadModel.getSisteVedtak();
            if (_.isUndefined(vedtak)) {
                this.model.set('vedtak_id', '');
            } else {
                this.model.set('vedtak_id', vedtak.id);
            }
        },

        redirectOnSaveSuccess: function () {
            window.location.href = '/soknad/' + this.model.soknad_id;
        }
    });
})(Tilskudd);