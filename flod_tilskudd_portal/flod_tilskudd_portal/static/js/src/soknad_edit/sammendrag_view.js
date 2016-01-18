/*global Backbone, moment, _, $, window, console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.SammendragView = ns.SoknadSummaryView.extend({
        template: "#soknad_sammendrag_template",
        events: {
            'click #previous_button': 'previousClicked',
            'click #cancel_button': 'cancel',
            'click #send_button': 'send'
        },

        send: function () {
            var target = '?menu=Sammendrag&action=Send%20søknad';
            if ("pushState" in window.history) {
                Backbone.history.navigate(window.location.pathname + target, true);
            }
            else {
                Backbone.history.navigate(target, true);
            }
            $(window).scrollTop(0);
        }
    });


}(Tilskudd));
