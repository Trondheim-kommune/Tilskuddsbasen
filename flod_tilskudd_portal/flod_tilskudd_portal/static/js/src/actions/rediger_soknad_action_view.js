/*global console, _ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.RedigerSoknadActionView = ns.BaseSavingActionContentView.extend({
        template: '#rediger_soknad_action_template',
        redirectOnSaveSuccess: function () {
            window.location.href = '/soknad/' + this.model.soknad_id + "/edit";
        }
    });
})(Tilskudd);