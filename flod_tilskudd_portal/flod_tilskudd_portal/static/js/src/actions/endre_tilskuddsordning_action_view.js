/*global console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";


    ns.EndreTilskuddsordningActionView = ns.BaseSavingActionContentView.extend({
        template: "#endre_tilskuddsordning_action_template",
        bindings: {
            'select#tilskuddsordninger': {
                observe: 'tilskuddsordning_id',
                selectOptions: {
                    collection: function () {
                        return this.tilskuddsordninger;
                    },
                    labelPath: 'navn',
                    valuePath: 'id',
                    defaultOption: {
                        label: '---',
                        value: null
                    }
                }
            },
            'select#saksbehandlere': {
                observe: 'saksbehandler_id',
                selectOptions: {
                    collection: function () {
                        return this.saksbehandlere;
                    },
                    labelPath: 'profile.full_name',
                    valuePath: 'id',
                    defaultOption: {
                        label: '---',
                        value: null
                    }
                }
            }
        },

        updateSaksbehandlere: function () {
            this.saksbehandlere.reset();
            this.model.trigger("change:saksbehandler_id", this.model);
            var tilskuddsordning = this.tilskuddsordninger.get(this.model.get('tilskuddsordning_id'));
            if (tilskuddsordning) {
                this.listenTo(tilskuddsordning.saksbehandlereInfo, "sync", function (e) {
                    this.saksbehandlere = tilskuddsordning.saksbehandlereInfo;
                    var currentUserAsSaksbehandler = tilskuddsordning.saksbehandlereInfo.get(window.loggedInUser.get('id'));
                    if (!_.isUndefined(currentUserAsSaksbehandler)) {
                        this.model.set('saksbehandler_id', currentUserAsSaksbehandler.get('id'));
                    }
                    this.model.trigger("change:saksbehandler_id", this.model);
                });
                tilskuddsordning.updateSaksbehandlerInfo();
            }
        },


        initialize: function () {
            var self = this;
            this.tilskuddsordninger = new ns.TilskuddsordningCollection();
            //this.model.set('tilskuddsordning_id', this.get('id'));
            this.saksbehandlere = new Backbone.Collection();
            this.listenTo(this.model, "change:tilskuddsordning_id", this.updateSaksbehandlere);
            this.tilskuddsordninger.fetch({
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
            window.location.href = '/soknad/' + this.model.soknad_id;
        }
    });
})(Tilskudd);