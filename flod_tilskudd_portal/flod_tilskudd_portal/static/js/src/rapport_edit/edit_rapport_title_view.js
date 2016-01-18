/*global Backbone, moment, _, $, window, console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.EditRapportTitleView = Backbone.Marionette.ItemView.extend({
        template: "#edit_rapport_title_template",

        bindings: {
            "#id_soker_name" : {
                observe: 'organisation',
                onGet : function (value) {
                    if (value) {
                        return value.name;
                    } else {
                        return "<Søker ikke satt>";
                    }
                }
            }
        },

        onShow : function () {
            this.stickit();
        }

    });

}(Tilskudd));
