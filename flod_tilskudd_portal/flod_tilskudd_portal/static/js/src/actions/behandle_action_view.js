/*global console, $, _, Backbone */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.BehandleActionView = ns.BaseSavingActionContentView.extend({
        template: '#behandle_action_template',

        initialize: function (options) {
            this.tilskuddsordningModel = this.options.tilskuddsordningModel;
            var self = this;
            self.tilskuddsordningModel.fetch({
                'success': function () {
                    self.listenTo(self.tilskuddsordningModel.saksbehandlereInfo, "add", function () {
                        var currentUserAsSaksbehandler = self.tilskuddsordningModel.saksbehandlereInfo.get(window.loggedInUser.get('id'));
                        if (!_.isUndefined(currentUserAsSaksbehandler)) {
                            self.model.set('saksbehandler', currentUserAsSaksbehandler.get('id'));
                        }
                        // Bindings are not automatically updated when the collection is, we have to take care of it
                        self.model.trigger("change:saksbehandler", self.model);
                    });
                },
                'error': function () {
                    ns.TilskuddApp.vent.trigger("message:error",
                        {
                            'message': 'Det oppstod en feil ved lasting av tilskuddsordning på søknad.'
                        }
                    );
                }
            });
            this.bindings = {
                'select#saksbehandlere': {
                    observe: 'saksbehandler',
                    selectOptions: {
                        collection: self.tilskuddsordningModel.saksbehandlereInfo,
                        defaultOption: {
                            label: '---',
                            value: null
                        },
                        labelPath: 'profile.full_name',
                        valuePath: 'id'
                    }
                }
            };

        },

        redirectOnSaveSuccess: function () {
            window.location.href = '/soknad/' + this.model.soknad_id;
        }


    });
})(Tilskudd);