/*global console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";


    ns.VarsleGodkjennerActionView = ns.BaseSavingActionContentView.extend({
        template: "#varsle_godkjenner_action_template",
        bindings: {
            'select#tilskuddsordninger': {
                observe: 'tilskuddsordning_id',
                selectOptions: {
                    collection: function () {
                        return this.model.get('tilskuddsordninger');
                    },
                    labelPath: 'navn',
                    valuePath: 'id',
                    defaultOption: {
                        label: '---',
                        value: null
                    }
                }
            }
        },

        initialize: function () {
            var self = this;
            this.model.get('tilskuddsordninger').fetch({
                success: function (model, response, options) {
                    // Bindings are not automatically updated when the collection is, we have to take care of it
                    self.model.trigger("change:tilskuddsordning_id", self.model);
                },
                error: function () {
                    ns.TilskuddApp.vent.trigger("message:error",
                        {
                            'message': 'Det oppstod en feil ved lasting av tilskuddsordninger.'
                        }
                    );
                }
            });
        },

        redirectOnSaveSuccess: function () {
        },

        ok: function (e) {
            e.preventDefault();
            this.clearValidationAlerts();
            var valgtTilskuddsordningId = this.model.get('tilskuddsordning_id');
            if (valgtTilskuddsordningId) {
                var tilskuddsordning = this.model.get('tilskuddsordninger').get(valgtTilskuddsordningId);
                var self = this;
                var button_id = e.target.id;
                var interval_id = this.startBlinkingAndDisableButton(button_id);
                tilskuddsordning.varsle_godkjenner({
                    success: function (model, textStatus, xhr) {
                        ns.TilskuddApp.vent.trigger("message:success",
                            {
                                'message': 'Varsel sendt til godkjenner for tilskuddsordning ' + tilskuddsordning.get('navn')
                            }
                        );
                        self.saveSuccess(button_id, interval_id);
                    },
                    error: function (xhr, textStatus, errorThrown) {
                        ns.TilskuddApp.vent.trigger("message:error",
                            {
                                'message': 'Det oppstod en feil ved opprettelse av søknad. Prøv igjen senere.'
                            }
                        );

                        self.saveFailed(button_id, interval_id, self.model, xhr, null);
                    }
                });
            }
        }
    });
})(Tilskudd);