/*global Backbone, moment, _, $, window, console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.EditSoknadTitleView = Backbone.Marionette.ItemView.extend({
        template: "#edit_soknad_title_template",

        bindings: {
            "#id_soker_name": {
                observe: 'organisation',
                onGet: function (value) {
                    if (value) {
                        return value.name;
                    }
                }
            },
            "#id_tilskuddsordning_navn": {
                observe: 'tilskuddsordning',
                onGet: function (value) {
                    if (!_.isUndefined(this.model.get('tilskuddsordning'))) {
                        return this.model.get('tilskuddsordning').navn;
                    }
                }
            },
            "#id_status": "status"
        },

        onShow: function () {
            var self = this;
            this.model.fetch();
            this.stickit();
        }


    });

}(Tilskudd));
