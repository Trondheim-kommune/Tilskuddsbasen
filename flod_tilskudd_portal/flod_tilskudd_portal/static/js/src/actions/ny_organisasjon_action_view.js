/*global Backbone, _, $, console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.OrganisasjonLayout = Backbone.Marionette.LayoutView.extend({
        template: "#ny_organisasjon_action_template",

        events: {
            'click #cancel_button': 'cancel',
            'click #create_button': 'opprett'
        },

        cancel: function (e) {
            e.preventDefault();
            this.trigger("cancel", this);
        },

        opprett: function (e) {
            e.preventDefault();
            window.open(this.options.aktor_url, '_blank');
        }

    });

})(Tilskudd);