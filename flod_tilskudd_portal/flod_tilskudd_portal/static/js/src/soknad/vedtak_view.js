/*global Backbone, window, console, _ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.VedtakView = Backbone.Marionette.ItemView.extend({

        events: function () {
            // OBS: husk at første parameter er destination, bruk derfor {} for å unngå endringer i eksisterende eventlist
            return _.extend({}, this.constructor.__super__.events, {
                'click #vedtaksbrev_button': 'downloadVedtaksbrev'
            });
        },

        template: "#vedtak_template",
        bindings: {
            "#id_vedtak": {
                observe: "tilsagn",
                onGet: function (value) {
                    if (value) {
                        return "Tilsagn";
                    } else {
                        return "Avslag";
                    }
                }
            },
            "#id_vedtatt_belop": {
                observe: "nyeste_vedtak",
                onGet: function (value) {
                    if (!_.isUndefined(value)) {
                        if (value.vedtatt_belop !== null && value.vedtatt_belop !== "") {
                            return value.vedtatt_belop;
                        }
                    }
                    return "";
                }
            },
            "#id_vedtaksdato": {
                observe: "nyeste_vedtak",
                onGet: function (value) {
                    if (!_.isUndefined(value)) {
                        if (value.vedtaksdato !== null && value.vedtaksdato !== "") {
                            return ns.formatDato(value.vedtaksdato);
                        }
                    }
                    return "";
                }
            },
            "#id_saksbehandler": {
                observe: 'saksbehandler',
                onGet: function (saksbehandler) {
                    if (!_.isUndefined(saksbehandler)) {
                        return saksbehandler.full_name;
                    }
                }
            },
            "#id_vedtatt_av": {
                observe: 'godkjenner',
                onGet: function (godkjenner) {
                    if (!_.isUndefined(godkjenner)) {
                        var str = godkjenner.get("profile").full_name;
                        if (this.model.get("tilskuddsordning").godkjenner_tittel){
                            str = str.concat(", ", this.model.get("tilskuddsordning").godkjenner_tittel);
                        }
                        return str;
                    }
                }
            },
            "#id_rapportfrist": {
                observe: 'nyeste_vedtak',
                onGet: function (vedtak) {
                    vedtak = this.model.getSisteVedtak();
                    if (!_.isUndefined(vedtak)) {
                        if (!_.isNull(vedtak.rapportfrist)) {
                            return ns.formatDato(vedtak.rapportfrist);
                        } else {
                            return "Ingen";
                        }
                    }
                    return "";
                }
            },
            "#id_saksnummer": {
                observe: 'id',
                onGet: function (id) {
                    return id;
                }
            },
            "#id_tilskuddsordning_navn": {
                observe: 'tilskuddsordning',
                onGet: function (tilskuddsordning) {
                    if (!_.isUndefined(tilskuddsordning)) {
                        return tilskuddsordning.navn;
                    }
                }
            },
            "#id_soker_name": {
                observe: 'organisation',
                onGet: function (organisation) {
                    if (!_.isUndefined(organisation)) {
                        return organisation.name;
                    }
                }
            },
            "#id_kontaktperson": {
                observe: "person",
                onGet: function (kontaktperson) {
                    if (!_.isUndefined(kontaktperson)) {
                        return kontaktperson.first_name + " " + kontaktperson.last_name;
                    }
                }
            },
            "#id_org_nummer": {
                observe: 'organisation',
                onGet: function (organisation) {
                    if (!_.isUndefined(organisation) && !_.isNull(organisation.org_number) && organisation.org_number !== "") {
                        return organisation.org_number;
                    } else {
                        return "Uten organisasjonsnummer";
                    }
                }
            },
            "#id_kontonummer": {
                observe: 'kontonummer',
                onGet: function (kontonummer) {
                    return kontonummer;
                }
            },
            "#id_prosjektnavn": {
                observe: 'prosjektnavn',
                onGet: function (prosjektnavn) {
                    return prosjektnavn;
                }
            },

            "#id_levert_dato": {
                observe: 'levert_dato',
                onGet: function (levert_dato) {
                    return ns.formatDato(levert_dato);
                }
            },
            "#id_andre_opplysninger": {
                observe: "nyeste_vedtak",
                onGet: function (value) {
                    if (!_.isUndefined(value)) {
                        return value.andre_opplysninger;
                    }
                    return "";
                }
            },
            "#id_vedtakstekst": {
                observe: "nyeste_vedtak",
                onGet: function (value) {
                    if (!_.isUndefined(value)) {
                        return value.vedtakstekst;
                    }
                    return "";
                }
            },
            "#id_husk_ogsa": {
                observe: "husk_ogsa",
                onGet: function(value) {
                    return this.addLinkTagToLinks(value);
                },
                updateMethod: 'html',
                escape: true
            }
        },

        initialize: function () {
            this.model.set("nyeste_vedtak", null);
            this.model.set('husk_ogsa', this.model.get("tilskuddsordning").husk_ogsa);
            var nyeste_vedtak = this.model.getNyesteFattetVedtak();
            if (nyeste_vedtak!==null && !_.isUndefined(nyeste_vedtak)) {
                this.model.set("nyeste_vedtak", nyeste_vedtak);
                if (nyeste_vedtak.vedtatt_belop !== null && nyeste_vedtak.vedtatt_belop !== "" && nyeste_vedtak.vedtatt_belop > 0) {
                    this.model.set("tilsagn", true);
                } else {
                    this.model.set("tilsagn", false);
                }

                this.godkjenner = new ns.UserModel({"id" : this.model.get("tilskuddsordning").godkjenner_id});
                var self = this;
                self.godkjenner.fetch({
                    'success': function (model) {
                        self.model.set("godkjenner", model);
                    },
                    'error': function () {

                    }
                });
            }
        },

        addLinkTagToLinks: function(text) {
            var replacePattern1 = /(\b(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
            return (text ? text.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>') : '');
        },

        downloadVedtaksbrev: function (e) {
            e.preventDefault();
            var url = this.model.url() + "/vedtak/nyeste/vedtaksbrev";
            window.open(url, '_blank');
        },

        onShow: function () {
            this.stickit();
        }
    });

}(Tilskudd));
