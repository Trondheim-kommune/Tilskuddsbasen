/*global console, _ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.SendInnSoknadActionView = ns.BaseSavingActionContentView.extend({
        template: '#send_inn_soknad_action_template',
        redirectOnSaveSuccess: function () {
            window.location.href = '/soknad/' + this.model.soknad_id;
        }
    });
})(Tilskudd);