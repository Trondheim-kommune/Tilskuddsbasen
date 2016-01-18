var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";


    ns.SlettSoknadActionView = ns.BaseSavingActionContentView.extend({
        template: '#slett_soknad_action_template',

        redirectOnSaveSuccess: function () {
            window.location.href = '/soknader';
        }
    });
})(Tilskudd);