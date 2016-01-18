/*global Backbone, window*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.ViewSoknadTitleView = Backbone.Marionette.ItemView.extend({
        template: "#view_soknad_title_template",

        bindings: {
            "#id_soker_name": {
                observe: 'organisation',
                onGet: function (value) {
                    if (value) {
                        return value.name;
                    } else {
                        return "<Søker ikke satt>";
                    }
                }
            }
        },

        onShow: function () {
            this.stickit();
        }

    });
}(Tilskudd));