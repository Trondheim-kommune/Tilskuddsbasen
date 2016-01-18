/*global Backbone, _, console, $*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.MessageView = Backbone.Marionette.ItemView.extend({

        tagName: "div",
        className: "alert",
        id: "user_alert",

        events: {
            "click .close": "destroy"
        },

        template: '#message_template',

        initialize: function () {

            if(this.model) {
                var messageType = this.model.get('type');

                var self = this;
                if (messageType === ns.MessageModel.MessageType.ERROR) {
                    this.$el.addClass('alert-danger');
                } else if (messageType === ns.MessageModel.MessageType.SUCCESS) {
                    this.$el.addClass('alert-success');
                    setTimeout(function () {
                        self.destroy();
                    }, 3000);
                } else {
                    console.error("invalid message type");
                }
            } else {
                console.error("programming error: no model set for message view!");
            }
        }

    });

}(Tilskudd));