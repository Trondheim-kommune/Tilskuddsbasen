/*global Backbone, moment, _, $, window, console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.PrersonaliaFormView = Backbone.Marionette.ItemView.extend({

        template: "#personalia_template",

        events: {
            "click #savePersonInfo": "save"
        },

        bindings: {
            "#id_fodselsnummer": "national_identity_number",
            "#id_first_name": "first_name",
            "#id_last_name": "last_name",
            "#id_email_address": "email_address",
            "#id_phone_number": "phone_number"
        },

        onShow: function () {
            this.stickit();
        },

        save: function (event) {
            event.preventDefault();
            this.clearValidationAlerts();
            var self = this;
            this.model.save(
                null,
                {
                    "success": function (model, response, options) {
                        ns.TilskuddApp.vent.trigger("message:success",
                            {
                                'message': 'Profilen ble lagret.'
                            }
                        );
                    },
                    "error": function (model, response, options) {
                        ns.TilskuddApp.vent.trigger("message:error",
                            {
                                'message': 'Profilen ble ikke lagret.'
                            }
                        );
                        self.saveFailed(model, response, options);
                    }
                }
            );
        },

        saveFailed: function (model, response, options) {
            var error = JSON.parse(response.responseText).__error__;
            model.validationError = error;
            this.showErrors();
        },

        clearValidationAlerts: function () {
            this.$el.find('div').removeClass("has-error control-group");
            this.$el.find('div span.help-inline, td span.help-inline').remove();
        },

        showErrors: function () {
            _.each(this.model.validationError, this.addError, this);
        },

        addObjError: function (error, key) {
            _.each(error, function (error, key) {
                this.addError(error, key);
            }, this);
        },

        addError: function (error, key) {
            if (_.isObject(error)) {
                this.addObjError(error, key);
            } else {
                var elem;
                if (this.options.parent) {
                    elem = this.options.parent;
                } else {
                    elem = this.$('#id_' + key).parent('div');
                }
                if (elem.length === 0) {
                    elem = this.$('div').first();
                }
                elem.addClass("has-error control-group");
                elem.append("<span class='help-inline text-error control-label'>" + error + "</span>");
            }
        }
    });
    
    ns.ViewProfilTitleView = Backbone.Marionette.ItemView.extend({
        template: "#view_profil_title_template"
    });
    

}(Tilskudd));
