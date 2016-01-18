/*global Backbone, _, console, $ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.BaseActionContentView = Backbone.Marionette.CompositeView.extend({
        events: {
            'click #cancel_action': 'cancel',
            'click #ok_action': 'ok'
        },

        cancel: function (e) {
            e.preventDefault();
            this.trigger("cancel", this);
        }
    });

    ns.BaseSavingActionContentView = ns.BaseActionContentView.extend({
        onShow: function () {
            Backbone.Stickit.addHandler({
                selector: '.datepicker',
                onGet: function (value, options) {
                    return ns.formatDato(value);
                },
                onSet: function (value, options) {
                    return ns.formatDateNoToIso(value);
                }
            });

            this.stickit();

            this.$el.find('.datepicker').datepicker({
                format: "dd.mm.yyyy",
                weekStart: 1
            });
        },

        keyToTextMapping: function (key) {
            var keyToText = {
                'om_oss': 'hvem vi er',
                'organisation_id': 'organisasjon',
                'omsokt_belop': 'søkt beløp',
                'prosjektnavn': 'navn på prosjekt/aktivitet',
                'beskrivelse': 'hva skal gjøres',
                'arrangement': 'hvor og når',
                'maalsetting': 'hva vil dere oppnå med dette',
                'start_dato': 'startdato',
                'slutt_dato': 'sluttdato'
            };
            var text = keyToText[key];
            if (_.isUndefined(text)) {
                text = key;
            }
            return text;
        },

        ok: function (e, redirectOnSaveSuccessOverride) {
            e.preventDefault();
            this.clearValidationAlerts();
            if (this.model.isValid()) {
                var button_id = e.target.id;
                var interval_id = this.startBlinkingAndDisableButton(button_id);
                var self = this;
                this.model.save(null, {
                    success: function (model, response, options) {
                        self.saveSuccess(button_id, interval_id, redirectOnSaveSuccessOverride);
                    },
                    error: function (model, response, options) {
                        ns.TilskuddApp.vent.trigger("message:error",
                            {
                                'message': 'Det oppstod en feil ved lagring. Se skjema for evnt. detaljer.'
                            }
                        );
                        self.saveFailed(button_id, interval_id,  model, response, options);
                    }
                });
            }
        },

        redirectOnSaveSuccess: function () {
            throw "override redirectOnSaveSuccess";
        },

        findUniqueButtonEl: function (button_id) {
            var button = this.$("#" + button_id);
            if (button.length !== 1) {
                throw "There should only be ONE button with id=" + button_id + "!";
            }
            return button;
        },

        startBlinkingAndDisableButton: function (button_id) {
            var button = this.findUniqueButtonEl(button_id);
            button.prop("disabled", true);
            var blinker = function () {
                button.fadeOut("slow");
                button.fadeIn("slow");
            };
            return setInterval(blinker, 300);
        },

        stopBlinkingAndDisableButton: function (button_id, interval_id) {
            clearInterval(interval_id);
            var button = this.findUniqueButtonEl(button_id);
            button.prop("disabled", false);
        },

        saveSuccess: function (button_id, interval_id, redirectOnSaveSuccessOverride) {
            this.stopBlinkingAndDisableButton(button_id, interval_id);
            if(_.isUndefined(redirectOnSaveSuccessOverride)) {
                this.redirectOnSaveSuccess();
            } else {
                redirectOnSaveSuccessOverride();
            }
        },

        clearValidationAlerts: function () {
            // inline messages related to form data
            this.$el.find('div, td').removeClass("has-error control-group");
            this.$el.find('div span.help-inline, td span.help-inline, td span.control-label').remove();
        },

        saveFailed: function (button_id, interval_id, model, response, options) {
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
                    // Find where parent is set... Remove if not used at all.
                    elem = this.options.parent;
                } else {
                    // try to find element with id="id_key" to show feedback next to the field on which the error occurs
                    elem = this.$('#id_' + key).parent('div');
                }
                // Nothing found, the element will be the first div found in this view
                if (elem.length === 0) {
                    elem = this.$('div').first();
                }

                if (error === 'Mandatory') {
                    error = this.keyToTextMapping(key) + ' er ikke oppgitt';
                }

                elem.addClass("has-error control-group");
                elem.append("<span class='help-inline control-label text-error'>&bull; " + error + "</br></span>");
            }
        }
    });

}(Tilskudd));