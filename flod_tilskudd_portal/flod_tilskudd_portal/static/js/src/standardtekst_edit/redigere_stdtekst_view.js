/*global Backbone, moment, _, $, window, console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.RedigereStandardTekstView = ns.BaseContentEditView.extend({
        template: "#redigere_stdtekst_template",
        bindings: {
            "#id_navn" : "navn",
            "#id_tekst" : "tekst",
            "select#id_type": {
                observe: 'type',
                selectOptions: {
                    collection: ns.StandardtekstTypeCollection,
                    defaultOption: {
                        label: '---',
                        value: null // invalid choice, if chosen the old value will still be kept
                    }
                }
            }
        },

        onShow: function() {
            this.stickit();
        },

        save: function(e){
            e.preventDefault();
            // in this dialog it make sense to cancel after saving to get back to the list of standardtekster
            this.saveModel(_.bind(function(){this.trigger('cancel', this);}, this));
        },

        events: function () {
            // OBS: husk at første parameter er destination, bruk derfor {} for å unngå endringer i eksisterende eventlist
            return _.extend({}, this.constructor.__super__.events, {
                'click #delete_button': 'slett'
            });
        },

        slett: function(e) {
            e.preventDefault();
            var self = this;
            this.model.destroy({
                "success": function (model, response, options) {
                    // in this dialog it make sense to cancel after saving to get back to the list of standardtekster
                    self.trigger('cancel', self);
                },
                "error": function (model, response, options) {
                    ns.TilskuddApp.vent.trigger("message:error",
                        {
                            'message': 'Det oppstod en feil ved sletting. Prøv igjen senere.'
                        }
                    );
                }
            });
        }
    });

    ns.RedigereStandardTekstTitleView = Backbone.Marionette.ItemView.extend({
        template: "#view_rediger_stdtekst_title_template"
    });

}(Tilskudd));