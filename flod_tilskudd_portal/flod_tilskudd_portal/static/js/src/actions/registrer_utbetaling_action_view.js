/*global console, _, window */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.RegistrerUtbetalingActionView = ns.BaseSavingActionContentView.extend({
        template: "#registrer_utbetaling_action_template",
        bindings: {
            "#id_fakturanr": "fakturanr",
            "#id_kontonr": "kontonr",
            "#id_belop" : "belop",
            "#id_utbetaling_dato": "utbetaling_dato"
        },

        initialize: function () {
            this.soknadModel = this.options.soknadModel;
            var vedtak = this.soknadModel.getSisteVedtak();

            this.model.set('kontonr', this.soknadModel.get("kontonummer"));
            this.model.set('belop', vedtak.vedtatt_belop);
            this.model.set('utbetaling_dato', '');
        },

        redirectOnSaveSuccess: function () {
            window.location.href = '/soknad/' + this.model.soknad_id;
        }
    });
})(Tilskudd);