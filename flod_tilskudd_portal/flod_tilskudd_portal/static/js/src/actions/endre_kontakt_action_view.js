/*global console, _, window */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.EndreKontaktActionView = ns.BaseSavingActionContentView.extend({
        template: "#endre_kontakt_action_template",
        organisasjonsMedlemmer: new ns.OrganisasjonsMedlemmerCollection(),
        bindings: {
            "#id_epost": "epost",
            "#id_telefon": "telefon",
            'select#kontaktpersoner': {
                observe: 'person_id',
                selectOptions: {
                    collection: function () {
                        return this.organisasjonsMedlemmer;
                    },
                    labelPath: 'full_name',
                    valuePath: 'id'
                }
            }
        },

        events: function () {
            // OBS: husk at første parameter er destination, bruk derfor {} for å unngå endringer i eksisterende eventlist
            return _.extend({}, this.constructor.__super__.events, {
                'change #kontaktpersoner': 'setEpostOgTelefon'
            });
        },

        setEpostOgTelefon: function() {
            console.log('test');
            var person_id = this.$el.find('#kontaktpersoner').val();
            if (person_id) {
                var person = this.organisasjonsMedlemmer.get(person_id);
                this.model.set('epost', person.get('email_address'));
                this.model.set('telefon', person.get('phone_number'));
            }
        },

        initialize: function () {
            this.soknadModel = this.options.soknadModel;
            this.model.set('epost', this.soknadModel.get('epost'));
            this.model.set('telefon', this.soknadModel.get('telefon'));
            this.model.set('person_id', this.soknadModel.get('person_id'));

            this.organisasjonsMedlemmer = new ns.OrganisasjonsMedlemmerCollection([], {'organisation_id': this.soknadModel.get('organisation_id')});
            var self = this;

            self.organisasjonsMedlemmer.fetch({
                'success': function () {
                    // Bindings are not automatically updated when the collection is, we have to take care of it
                    self.model.trigger("change:person_id", self.model);
                },
                'error': function () {
                    ns.TilskuddApp.vent.trigger("message:error",
                        {
                            'message': 'Det oppstod en feil ved lasting av tilskuddsordning på søknad.'
                        }
                    );
                }
            });
        },

        redirectOnSaveSuccess: function () {
            window.location.href = "/soknad/" + this.model.soknad_id;
        }

    });
})(Tilskudd);
