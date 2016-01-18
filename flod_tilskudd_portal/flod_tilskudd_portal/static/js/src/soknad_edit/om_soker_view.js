/*global Backbone, _, $, window */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";


    ns.OmSokerView = ns.BaseContentEditView.extend({
        template: "#om_soker_template",

        bindings: {
            "#id_orgnumber": "org_number",
            "#id_org_name": "org_name",
            "#id_kontonummer": "kontonummer",
            "#id_phone_number": "org_phone_number",
            "#id_email_address": "org_email_address",
            "#id_contact_person_name": "contact_person_name",
            "#id_telefon": "telefon",
            "#id_epost": "epost",
            "#id_beskrivelse":  {
                observe: 'org_beskrivelse',
                onGet: function (org_beskrivelse) {
                    if (org_beskrivelse) {
                        return org_beskrivelse;
                    }
                }
            },
            "select#selected_organisation": {
                observe: 'selected_organisation',
                selectOptions: {
                    collection: function () {
                        return this.model.get('my_organisations');
                    },
                    defaultOption: {
                        label: '---',
                        value: null
                    },
                    labelPath: 'name',
                    valuePath: 'id'
                }
            }
        },

        events: function () {
            // OBS: husk at første parameter er destination, bruk derfor {} for å unngå endringer i eksisterende eventlist
            return _.extend({}, this.constructor.__super__.events, {
                'click #update_organisation_information': 'setSelectedOrganisation'
            });
        },

        initialize: function (options) {

            this.model.set({'my_organisations': options.my_organisations});
            this.model.set({'contact_person': options.contact_person});

            this.loadMyOrganisations();
            this.loadContactPerson();
        },

        loadMyOrganisations: function () {
            var self = this;
            this.model.get('my_organisations').fetch({
                'success': function () {
                    self.model.trigger("change:selected_organisation", self.model);
                    self.setDefaultOrganisation();
                },
                'error': function () {
                    ns.TilskuddApp.vent.trigger("message:error",
                        {
                            'message': 'Det oppstod en lasting av dine organisasjoner.'
                        }
                    );
                }
            });
        },

        loadContactPerson: function () {
            var self = this;
            this.model.get('contact_person').fetch({
                'success': function () {

                    self.model.set({
                        'contact_person_name': self.model.get('contact_person').get('first_name') + ' ' + self.model.get('contact_person').get('last_name')
                    });

                    // new person to change soknad, force changes of all contact person details
                    if (self.model.get('person_id') !== self.model.get('contact_person').get('id')) {
                        self.model.set('person_id', self.model.get('contact_person').get('id'));
                        self.model.set('telefon', self.model.get('contact_person').get('phone_number'));
                        self.model.set('epost', self.model.get('contact_person').get('email_address'));
                    } else {

                        if (!self.model.get('telefon')) {
                            self.model.set('telefon', self.model.get('contact_person').get('phone_number'));
                        }

                        if (!self.model.get('epost')) {
                            self.model.set('epost', self.model.get('contact_person').get('email_address'));
                        }

                    }

                },
                'error': function () {
                    ns.TilskuddApp.vent.trigger("message:error",
                        {
                            'message': 'Det oppstod en feil da kontaktperson ble forsøkt lastet. Kontaktperson kunne ikke settes på søknad.'
                        }
                    );
                }
            });
        },

        setDefaultOrganisation: function () {
            var org_id = this.model.get('organisation_id');
            if (org_id) {
                this.$el.find('#selected_organisation').val(org_id);
                this.updateOrganisationInformation(org_id, false);
            }
        },

        setSelectedOrganisation: function (e) {

            e.preventDefault();
            var selected_organisation_id = this.$("#selected_organisation").val();
            if (selected_organisation_id) {
                this.updateOrganisationInformation(selected_organisation_id, true);
            }
        },

        updateOrganisationInformation: function (selected_organisation_id, force_change_account_number) {

            this.selected_organisation = new ns.OrganisasjonModel({'id': selected_organisation_id});

            var mappings_soknad_to_org_model = {
                "org_number": "org_number",
                "org_name": "name",
                "org_phone_number": "phone_number",
                "org_email_address": "email_address",
                "org_beskrivelse": "description"
            };

            var self = this;
            this.selected_organisation.fetch({
                'success': function () {
                    console.log(self.selected_organisation);
                    self.model.set('organisation_id', self.selected_organisation.get('id'));

                    _.each(mappings_soknad_to_org_model, function (organisation_key, soknad_key) {
                        self.model.set(soknad_key, self.selected_organisation.get(organisation_key));
                    });

                    if (!self.model.get('kontonummer') || force_change_account_number) {
                        self.model.set('kontonummer', self.selected_organisation.get('account_number'));
                    }

                    ns.TilskuddApp.vent.trigger("soknadWizard:sokerChanged", self.model);

                },
                'error': function () {
                    ns.TilskuddApp.vent.trigger("message:error",
                        {
                            'message': 'Det oppstod en feil og søknaden kunne ikke oppdateres med valgt organisasjon.'
                        }
                    );
                }
            });

        }
    });

}(Tilskudd));