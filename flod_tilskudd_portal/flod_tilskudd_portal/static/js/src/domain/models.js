/*global _, Backbone, $ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.TilskuddsordningModel = Backbone.Model.extend({
        urlRoot: '/api/sak/v1/tilskuddsordning/',

        initialize: function () {
            this.saksbehandlereInfo = new Backbone.Collection();
            this.on('sync', function () {
                this.updateSaksbehandlerInfo();
            });
        },

        updateSaksbehandlerInfo: function () {
            var self = this;
            _(this.get("saksbehandlere")).each(function (s) {
                if (s.saksbehandler_id) {
                    var saksbehandlerModel = new ns.UserModel({id: s.saksbehandler_id});

                    saksbehandlerModel.fetch({
                        'success': function (model) {
                            self.saksbehandlereInfo.add(model);
                        },
                        'error': function () {
                            ns.TilskuddApp.vent.trigger("message:error",
                                {
                                    'message': 'Det oppstod en feil ved lasting av saksbehandlerinformasjon.'
                                }
                            );
                        }
                    });
                }
            });
        },

        varsle_godkjenner: function (opts) {
            var model = this,
                url = model.url() + '/varsle_godkjenner',
                options = {
                    url: url,
                    type: 'POST'
                };

            // add any additional options, e.g. a "success" callback or data
            _.extend(options, opts);

            return (this.sync || Backbone.sync).call(this, null, this, options);
        }
    });

    ns.StandardTekstModel = Backbone.Model.extend({
        urlRoot: '/api/sak/v1/standardtekst/'
    });

    ns.StandardTekstCollection = Backbone.Collection.extend({
        model: ns.StandardTekstModel,
        url: '/api/sak/v1/standardtekst/'
    });

    ns.TilskuddsordningCollection = Backbone.Collection.extend({
        model: ns.TilskuddsordningModel,
        url: '/api/sak/v1/tilskuddsordning/',
        comparator: function (model) {
            return model.get('navn');
        }
    });

    ns.PersonModel = Backbone.Model.extend({
        urlRoot: '/api/organisations/v1/persons/'
    });

    ns.UserModel = Backbone.Model.extend({
        url: function () {
            return '/api/users/v1/users/' + this.id + '/public';
        }
    });

    ns.SaksbehandlerCollection = Backbone.Collection.extend({
        model: ns.UserModel,
        url: "/api/users/v1/users/?role=tilskudd_saksbehandler"
    });

    ns.GodkjennerCollection = Backbone.Collection.extend({
        model: ns.UserModel,
        url: "/api/users/v1/users/?role=tilskudd_godkjenner"
    });

    ns.UserCollection = Backbone.Collection.extend({
        model: ns.UserModel,
        url: '/api/users/v1/users/public'
    });

    ns.Organisation = Backbone.Model.extend({

        defaults: {
            org_number: null,
            name: null,
            postal_address: null,
            business_address: null,
            num_members: null,
            num_members_b20: null,
            description: null,
            phone_number: null,
            telefax_number: null,
            email_address: null,
            area: 0,
            type_organisation: null,
            flod_activity_type: null,
            brreg_activity_code: null,
            type_activity: null,
            account_number: null,
            registered_tkn: false,
            update_brreg: false,
            is_public: false
        },

        url: function () {
            var url = "/api/organisations/v1/organisations/";
            if (!this.isNew()) {
                url += this.get("id");
            }
            return url;
        },

        getContactPerson: function () {
            return _.find(this.get("persons"), function (person) {
                return (person.org_roles.indexOf("Kontaktperson") !== -1);
            });
        },

        initContactPerson: function () {
            var data = Backbone.Model.prototype.toJSON.apply(this, arguments);

            var contactPerson = this.getContactPerson();
            if (contactPerson) {
                var pers = contactPerson.first_name + " " + contactPerson.last_name;
                this.contact_person = pers;
            } else {
                this.contact_person = "-";
            }
        }
    });

    ns.OrganisasjonModel = Backbone.Model.extend({
        urlRoot: '/api/organisations/v1/organisations/'
    });

    ns.OrganisasjonCollection = Backbone.Collection.extend({
        model: ns.Organisation,
        url: '/api/organisations/v1/organisations/'

    });

    ns.MinOrganisasjonCollection = Backbone.Collection.extend({
        model: ns.Organisation,
        initialize: function (models, options) {
            this.person_id = options.person_id;
        },
        url: function () {
            return '/api/organisations/v1/persons/' + this.person_id + '/organisations/';
        }
    });

    ns.OrganisasjonCollectionModel = Backbone.Model.extend({

        initialize: function (options) {
            this.collection = options.collection;
        }
    });

    ns.BrregOrganisation = Backbone.Model.extend({
        url: function () {
            return "/api/organisations/v1/brreg/enhet?orgnr=" + this.get("org_number");
        }
    });

    ns.ActivityTypes = Backbone.Collection.extend({

        getByCodes: function (codes) {
            return new ns.ActivityTypes(
                this.filter(function (activityType) {
                    return codes.indexOf(activityType.get("id")) !== -1;
                }));
        },
        getCodes: function () {
            return this.map(function (model) {
                return model.get("id");
            });
        }
    });

    ns.BrregActivityCodeCollection = Backbone.Collection.extend({
        url: '/api/organisations/v1/brreg_activity_codes/',

        getByCodes: function (codes) {
            return new ns.BrregActivityCodeCollection(
                this.filter(function (activityCode) {
                    return codes.indexOf(activityCode.get("code")) !== -1;
                }));
        },

        getActivityTypes: function () {
            return new ns.ActivityTypes(_.flatten(this.map(function (model) {
                return model.get("flod_activity_types");
            })));
        }

    });

    ns.FlodActivityTypesCollection = Backbone.Collection.extend({
        url: '/api/organisations/v1/flod_activity_types/'
    });

    ns.OrganisasjonsMedlemModel = Backbone.Model.extend({
        defaults: function () {
            var self = this;
            return {
                full_name: function () {
                    return self.get('first_name') + ' ' + self.get('last_name');
                }
            };
        },

        initialize: function (attributes, options) {
            if (!_.isUndefined(options.collection)) {
                this.organisation_id = options.collection.organisation_id;
            } else {
                this.organisation_id = options.organisation_id;
            }
        },

        urlRoot: function () {
            return '/api/organisations/v1/organisations/' + this.organisation_id + '/persons/';
        },
        parse: function (response, options) {
            // Needed since for some reason this returns a list...bug in flod_organisations..
            if (_.isArray(response)) {
                return response[0];
            } else {
                // But when we get post/put response it is not an array any more...
                return response;
            }
        }
    });

    ns.OrganisasjonsMedlemmerCollection = Backbone.Collection.extend({
        model: ns.OrganisasjonsMedlemModel,
        initialize: function (models, options) {
            if (!_.isUndefined(options)) {
                this.organisation_id = options.organisation_id;
            }
        },
        url: function () {
            return '/api/organisations/v1/organisations/' + this.organisation_id + '/persons/';
        }
    });

    ns.SoknadModel = Backbone.Model.extend({
        urlRoot: '/api/sak/v1/soknad/',
        defaults: {
            'omsokt_belop': 0
        },

        initialize: function () {
            this.on('sync', function () {
                this.updateOrganisationInfo();
                this.updateContactPersonInfo();
                this.updateSaksbehandlerInfo();
            });

            var self = this;
            ns.TilskuddApp.vent.on("soknadWizard:sokerChanged", function () {
                self.updateOrganisationInfo();
            });
        },

        getNyesteFattetVedtak: function () {
            var sortedVedtakslist = _.sortBy(this.get("vedtak"), "vedtaksdato").reverse();
            for (var i = 0; i < sortedVedtakslist.length; i++) {
                var vedtak = sortedVedtakslist[i];
                if (!_.isUndefined(vedtak.vedtaksdato) && !_.isNull(vedtak.vedtaksdato)) {
                    return vedtak;
                }
            }
            return null;
        },

        getSisteVedtak: function (index) {
            if (_.isUndefined(index)) {
                return this.getNewestInList(this.get("vedtak"), "vedtaksdato");
            } else {
                return this.getNthNewestInList(this.get("vedtak"), "vedtaksdato", index);
            }
        },


        /**
         * Returns the newest object in the list, based on the date field "dateFieldName" each object in the list
         * is expected to have.
         *
         * @param {array} list - The list to search
         * @param {string} dateFieldName - the name of the field
         * @return {object} or undefined it the given list is empty.
         */
        getNewestInList: function (list, dateFieldName) {
            return this.getNthNewestInList(list, dateFieldName, 0);
        },

        /**
         * Returns the n-th newest object in the list, based on the date field "dateFieldName" each object in the list
         * is expected to have.
         *
         * The Id is used internally to help determine which object is the newest when two of them have the same date.
         *
         * @param {array} list - The list to search
         * @param {string} dateFieldName - the name of the field
         * @param {string} n - which of the objects to return (newest is 0, oldest is list.length -1)
         * @return {object} or undefined it the given list is empty.
         */
        getNthNewestInList: function (list, dateFieldName, n) {
            if (!_.isEmpty(list)) {
                return _.sortBy(list, function (obj) {
                    return obj[dateFieldName] + "-" + obj["id"];
                }).reverse()[n];
            }
            return undefined;
        },

        getSisteKlage: function () {
            return this.getNewestInList(this.get("klage"), "levertdato");
        },

        getSisteUtbetaling: function () {
            return this.getNewestInList(this.get("utbetaling"), "registrertdato");
        },

        updateOrganisationInfo: function () {

            if (this.get('organisation_id')) {
                var organisationModel = new ns.OrganisasjonModel({'id': this.get('organisation_id')});
                var self = this;
                organisationModel.fetch({
                    'success': function () {
                        self.set('organisation', {
                            name: organisationModel.get('name'),
                            phone_number: organisationModel.get('phone_number'),
                            account_number: organisationModel.get('account_number'),
                            email_address: organisationModel.get('email_address'),
                            org_number: organisationModel.get('org_number'),
                            description: organisationModel.get('description')
                        });
                    },
                    'error': function () {
                        ns.TilskuddApp.vent.trigger("message:error",
                            {
                                'message': 'Det oppstod en feil ved lasting av organisasjonsinformasjon på søknad.'
                            }
                        );
                    }
                });
            }
        },

        updateContactPersonInfo: function () {

            if (this.get('person_id') && this.get('organisation_id')) {
                var personModel = new ns.OrganisasjonsMedlemModel({'id': this.get('person_id')}, {'organisation_id': this.get('organisation_id')});
                var self = this;
                personModel.fetch({
                    'success': function () {
                        self.set('person', {
                            first_name: personModel.get('first_name'),
                            last_name: personModel.get('last_name'),
                            email_address: personModel.get('email_address'),
                            phone_number: personModel.get('phone_number')
                        });
                    },
                    'error': function () {
                        ns.TilskuddApp.vent.trigger("message:error",
                            {
                                'message': 'Det oppstod en feil ved lasting av kontaktpersoninformasjon på søknad.'
                            }
                        );
                    }
                });
            }
        },

        updateSaksbehandlerInfo: function () {

            if (this.get('saksbehandler_id')) {
                var saksbehandlerModel = new ns.UserModel({id: this.get('saksbehandler_id')});
                var self = this;
                saksbehandlerModel.fetch({
                    'success': function () {
                        self.set('saksbehandler', {
                            full_name: saksbehandlerModel.get("profile").full_name,
                            email_address: saksbehandlerModel.get("profile").email,
                            phone_number: saksbehandlerModel.get("profile").phone_number
                        });
                    },
                    'error': function () {
                        ns.TilskuddApp.vent.trigger("message:error",
                            {
                                'message': 'Det oppstod en feil ved lasting av saksbehandlerinformasjon på søknad.'
                            }
                        );
                    }
                });
            }
        }
    });

    ns.SoknadCollection = Backbone.Collection.extend({
        model: ns.SoknadModel,
        rootUrl: '/api/sak/v1/soknad/',
        url: function () {
            _.each(this.get('parameters'), function (key, value) {
                this.rootUrl += "&" + key + "=" + value;
            });
            return this.rootUrl;
        },

        comparator: function (a, b) {
            a = new Date(a.get('levert_dato')).getTime();
            b = new Date(b.get('levert_dato')).getTime();

            return a === 0 ? -1
                : b === 0 ? 1
                : a < b ? 1
                : a > b ? -1
                : 0;
        },

        sumOmsokt: function () {
            return this.reduce(function (memo, value) {
                var val = parseInt(value.get("omsokt_belop"), 10);
                if (_.isNaN(val)) {
                    val = 0;
                }
                return memo + val;
            }, 0);
        },
        sumInnstilt: function () {
            return this.reduce(function (memo, value) {
                var val = 0;
                var vedtak = value.getSisteVedtak();
                if (!_.isUndefined(vedtak)) {
                    val = parseInt(vedtak.innstilt_belop, 10);
                }
                if (_.isNaN(val)) {
                    val = 0;
                }
                return memo + val;
            }, 0);
        },
        sumVedtatt: function () {
            return this.reduce(function (memo, value) {
                var val = 0;
                var vedtak = value.getSisteVedtak();
                if (!_.isUndefined(vedtak)) {
                    val = parseInt(vedtak.vedtatt_belop, 10);
                }
                if (_.isNaN(val)) {
                    val = 0;
                }
                return memo + val;
            }, 0);
        }
    });

    ns.SoknadsListeCollection = ns.SoknadCollection.extend({
        model: ns.SoknadModel,
        rootUrl: '/tilskudd/api/v1/soknader/'
    });

    ns.SoknadCollectionModel = Backbone.Model.extend({

        initialize: function (options) {
            this.collection = options.collection;
            this.listenTo(this.collection, "sync", function () {
                this.trigger("change:collection", this);
            });
        }
    });

    ns.TitleModel = Backbone.Model.extend({
        defaults: {
            'main_header': 'Main Header',
            'sub_header': 'Sub Header',
            'sub_sub_header': 'Sub Sub Header'
        }
    });

    ns.SoknadActionModel = Backbone.Model.extend({
        soknad_id: null,
        initialize: function (options) {
            this.soknad_id = options.soknad_id;
        },
        urlRoot: function () {
            return '/api/sak/v1/soknad/' + this.soknad_id + '/actions/';
        }
    });

    ns.SoknadActionCollection = Backbone.Collection.extend({
        model: ns.SoknadActionModel,
        soknad_id: null,
        initialize: function (models, options) {
            this.soknad_id = options.soknad_id;
        },
        url: function () {
            return '/api/sak/v1/soknad/' + this.soknad_id + '/actions/';
        },
        order: ["godkjenn_rapport", "underkjenn_rapport", "avskriv_rapportkrav", "redigere_rapportfrist", "last_opp_saksvedlegg", "godta_vedtak", "takke_nei", "klage", "endre_kontakt"],
        comparator: function (model) {
            return _.indexOf(this.order, model.id);
        }
    });

    ns.FilVedleggModel = Backbone.Model.extend({
        urlRoot: '/api/sak/v1/vedlegg/'
    });

    ns.FilVedleggCollection = Backbone.Collection.extend({
        model: ns.FilVedleggModel
    });

    ns.Person = Backbone.Model.extend({
        urlRoot: "/api/organisations/v1/persons/",

        defaults: {
            "first_name": "",
            "last_name": "",
            "email": "",
            "phone": ""
        }
    });

    ns.SoknadRapportModel = Backbone.Model.extend({
        defaults: {
            'prosjekt_gjennomforing': null,
            'arrangement': [],
            'prosjekt_avvik': null,
            'okonomipost': [],
            'budsjett_avvik': null,
            'resultat_kommentar': null,
            'vedlegg': [],
            'vedlagtlink': []
        },

        soknad_id: null,

        initialize: function (options) {
            this.soknad_id = options.soknad_id;
        },
        urlRoot: function () {
            return '/api/sak/v1/soknad/' + this.soknad_id + '/rapport/';
        }
    });

    ns.SoknadRapportCollection = Backbone.Collection.extend({
        soknad_id: null,

        initialize: function (models, options) {
            this.soknad_id = options.soknad_id;
        },

        url: function () {
            return '/api/sak/v1/soknad/' + this.soknad_id + '/rapport/';
        }
    });

    ns.OkonomipostModel = Backbone.Model.extend({
        defaults: function () {
            var self = this;
            return {
                hasBudsjettbelop: function () {
                    var budsjettpost = self.getOkonomibelopOfType("Budsjett");
                    return budsjettpost !== undefined;
                }
            };
        },

        getOkonomibelopOfType: function (okonomibelop_type) {
            return _.find(this.get("okonomibelop"), function (okonomibelop) {
                return okonomibelop.okonomibelop_type === okonomibelop_type;
            });
        },

        getBelopOfType: function (okonomibelop_type) {
            var okonomibelop = this.getOkonomibelopOfType(okonomibelop_type);
            if (okonomibelop !== undefined) {
                return okonomibelop.belop;
            }
            return undefined;
        }
    });

    ns.OkonomipostCollection = Backbone.Collection.extend({
        model: ns.OkonomipostModel,
        filterOkonomipost: function (okonomipost_type, okonomipost_kategori) {
            return _.filter(this.models, function (okonomipost) {
                return ((okonomipost.get('okonomipost_type') === okonomipost_type) && (_.isEmpty(okonomipost_kategori) || okonomipost.get('okonomipost_kategori') === okonomipost_kategori));
            });
        },
        calculateSum: function (okonomibelop_type, okonomipost_type, okonomipost_kategori) {
            return _.reduce(this.filterOkonomipost(okonomipost_type, okonomipost_kategori), function (sum, okonomipost) {
                var belop = parseInt(okonomipost.getBelopOfType(okonomibelop_type), 10);
                if (_.isNaN(belop)) {
                    belop = 0;
                }
                return sum + belop;
            }, 0);
        }
    });

    ns.MessageModel = Backbone.Model.extend({
        defaults: {
            type: -1,
            title: '',
            message: ''
        },
        toString: function () {
            JSON.stringify(this.toJSON());
        }
    }, {
        MessageType: {
            "DEFAULT": -1,
            "ERROR": 0,
            "SUCCESS": 1
        }
    });

    ns.TilskuddsordningTypeCollection = [
        {'value': 'Forskuddsutbetaling', 'label': 'Forskuddsutbetaling'},
        {'value': 'Etterskuddsutbetaling', 'label': 'Etterskuddsutbetaling'},
        {'value': 'Krever ikke rapport', 'label': 'Krever ikke rapport'}
    ];

    ns.StandardtekstTypeCollection = [
        {'value': 'Andre opplysninger', 'label': 'Andre opplysninger'},
        {'value': 'Merk følgende', 'label': 'Merk følgende'}
    ];

}(Tilskudd));
