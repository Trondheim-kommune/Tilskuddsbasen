/*global console, _, Backbone, $ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.BaseContentEditView = Backbone.Marionette.CompositeView.extend({
        events: {
            'click #previous_button': 'previousClicked',
            'click #next_button': 'nextClicked',
            'click #cancel_button': 'cancel',
            'click #save_button': 'save'
        },
        saveOnNavigation: true,

        onShow: function () {
            this.stickit();
        },

        additionalUpdateModel: function () {
        },

        nextClicked: function (e) {
            e.preventDefault();
            if (this.saveOnNavigation) {
                this.saveModel(_.bind(this.redirectNext, this));
            } else {
                this.redirectNext();
            }
        },

        previousClicked: function (e) {
            e.preventDefault();
            if (this.saveOnNavigation) {
                this.saveModel(_.bind(this.redirectPrevious, this));
            } else {
                this.redirectPrevious();
            }
        },

        save: function (e) {
            e.preventDefault();
            this.saveModel(null, e);
        },

        cancel: function (e) {
            e.preventDefault();
            this.trigger('cancel', this);
        },

        redirectNext: function () {
            this.trigger("nextClicked", this);
        },

        redirectPrevious: function () {
            this.trigger("previousClicked", this);
        },

        saveModel: function (saveSuccessCallback, e) {
            this.clearValidationAlerts();
            ns.TilskuddApp.vent.trigger("message:clear");
            this.additionalUpdateModel();
            if (this.model.isValid()) {
                if (!_.isUndefined(e) && !_.isNull(e)) {
                    var button_id = e.target.id;
                    var interval_id = this.startBlinkingAndDisableButton(button_id);
                }
                var self = this;
                this.model.save(
                    null,
                    {
                        "success": function (model, response, options) {
                            self.saveSuccess(button_id, interval_id, saveSuccessCallback);
                        },
                        "error": function (model, response, options) {
                            self.saveFailed(button_id, interval_id, model, response, options);
                        }
                    }
                );
            } else {
                this.showErrors();
            }
        },

        clearValidationAlerts: function () {
            // inline messages related to form data
            this.$el.find('div, td').removeClass("has-error control-group");
            this.$el.find('div span.help-inline, td span.help-inline, td span.control-label').remove();
        },

        findUniqueButtonEl: function (button_id) {
            var button = this.$("#" + button_id);
            if (button.length !== 1) {
                throw "There should only be ONE button with id=" + button_id + "!";
            }
            return button;
        },


        startBlinkingAndDisableButton: function (button_id) {
            if (!_.isUndefined(button_id) && !_.isNull(button_id)) {
                var button = this.findUniqueButtonEl(button_id);
                button.prop("disabled", true);
                var blinker = function () {
                    button.fadeOut("slow");
                    button.fadeIn("slow");
                };
                return setInterval(blinker, 300);
            }
        },

        stopBlinkingAndDisableButton: function (button_id, interval_id) {
            if (!_.isUndefined(button_id) && !_.isNull(button_id)) {
                clearInterval(interval_id);
                var button = this.findUniqueButtonEl(button_id);
                button.prop("disabled", false);
            }
        },


        saveSuccess: function (button_id, interval_id, saveSuccessCallback) {
            ns.TilskuddApp.vent.trigger("message:success",
                {
                    'message': 'Skjemaet er lagret.'
                }
            );
            this.stopBlinkingAndDisableButton(button_id, interval_id);
            if (!_.isUndefined(saveSuccessCallback) && !_.isNull(saveSuccessCallback)) {
                saveSuccessCallback();
            }
        },

        createErrorMessage: function (response) {
            if (response.status === 400) {
                return 'Kunne ikke lagre, kontroller opplysningene i skjemaet.';
            }
            return 'Det oppstod en feil ved lagring av skjema. Prøv igjen senere.';
        },

        saveFailed: function (button_id, interval_id, model, response, options) {
            ns.TilskuddApp.vent.trigger("message:error",
                {
                    'message': this.createErrorMessage(response)
                }
            );

            this.stopBlinkingAndDisableButton(button_id, interval_id);

            model.validationError = JSON.parse(response.responseText).__error__;
            this.showErrors();
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

}(Tilskudd));