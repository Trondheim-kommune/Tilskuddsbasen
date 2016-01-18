/*global Backbone, window, _*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.SoknadSummaryView = ns.SummaryView.extend({

        bindings: {
            "#id_tilskuddsordning_navn": {
                observe: 'tilskuddsordning',
                onGet: function (tilskuddsordning) {
                    if (!_.isUndefined(tilskuddsordning) && !_.isNull(tilskuddsordning.navn)) {
                        return tilskuddsordning.navn;
                    }
                }
            },
            "#id_soknadsfrist": {
                observe: 'tilskuddsordning',
                onGet: function (tilskuddsordning) {
                    if (!_.isUndefined(tilskuddsordning) && !_.isNull(tilskuddsordning.soknadsfrist)) {
                        return ns.formatDato(tilskuddsordning.soknadsfrist);
                    } else {
                        // returnerer en verdi siden det å ikke ha verdi i det feltet
                        // betyr ikke at det er ikke fylt ut ennå, men at det er ingen frist.
                        return "Ingen";
                    }
                }
            },
            "#id_rapportfrist": {
                observe: 'vedtak',
                onGet: function (vedtak) {
                    vedtak = this.model.getSisteVedtak();
                    if (!_.isUndefined(vedtak)) {
                        if (!_.isNull(vedtak.rapportfrist)) {
                            return ns.formatDato(vedtak.rapportfrist);
                        } else {
                            return "Ingen";
                        }
                    } else {
                        // dersom ingen vedtak, bruk rapportfrist fra tilskuddsordning
                        var tilskuddsordning = this.model.get("tilskuddsordning");
                        if (!_.isUndefined(tilskuddsordning) && !_.isNull(tilskuddsordning.rapportfrist)) {
                            return ns.formatDato(tilskuddsordning.rapportfrist);
                        } else {
                            // returnerer en verdi siden det å ikke ha verdi i det feltet
                            // betyr ikke at det er ikke fylt ut ennå, men at det er ingen frist.
                            return "Ingen";
                        }
                    }
                }
            },
            ".rapportfrist_info": {
                attributes: [
                    {
                        name: 'class',
                        onGet: function () {
                            if (this.model.get("tilskuddsordning").type === "Krever ikke rapport"){
                                return "hidden";
                            }
                        }
                    }
                ]
            },
            "#id_id": "id",
            "#id_organisation_org_number": {
                observe: 'organisation',
                onGet: function (organisation) {
                    if (!_.isUndefined(organisation) && !_.isNull(organisation.org_number) && organisation.org_number !== "") {
                        return organisation.org_number;
                    } else {
                        return "Uten organisasjonsnummer";
                    }
                }
            },
            "#id_organisation_name": {
                observe: 'organisation',
                onGet: function (organisation) {
                    if (!_.isUndefined(organisation) && !_.isNull(organisation.name)) {
                        return organisation.name;
                    }
                }
            },
            "#id_organisation_telefon": {
                observe: 'organisation',
                onGet: function (organisation) {
                    if (!_.isUndefined(organisation) && !_.isNull(organisation.phone_number)) {
                        return organisation.phone_number;
                    }
                }
            },
            "#id_organisation_epost": {
                observe: 'organisation',
                onGet: function (organisation) {
                    if (!_.isUndefined(organisation) && !_.isNull(organisation.email_address)) {
                        return organisation.email_address;
                    }
                }
            },
            "#id_org_beskrivelse": {
                observe: 'organisation',
                onGet: function (organisation) {
                    if (!_.isUndefined(organisation) && !_.isNull(organisation.description)) {
                        return organisation.description;
                    }
                }
            },
            "#id_kontonummer": "kontonummer",
            "#id_person_name": {
                observe: 'person',
                onGet: function (person) {
                    if (!_.isUndefined(person)) {
                        return person.first_name + " " + person.last_name;
                    }
                }
            },
            "#id_telefon": "telefon",
            "#id_epost": "epost",
            "#id_om_oss": "om_oss",
            "#id_prosjektnavn": "prosjektnavn",
            "#id_beskrivelse": "beskrivelse",
            "#id_maalsetting": "maalsetting",
            "#id_kommentar": "kommentar",
            '#id_sum_utgifter': "sum_utgifter",
            '#id_sum_inntekter': "sum_inntekter",
            '#id_budsjettbalanse': "budsjettbalanse"
        },

        initialize: function () {
            this.okonomipostCollection = new ns.OkonomipostCollection(this.model.get("okonomipost"));
            this.model.set({'okonomipostCollection': this.okonomipostCollection});

            this.omsoktBelop = this.model.get('omsokt_belop');
            this.vedtattBelop = this.model.get('vedtatt_belop');
        },

        calculateSums: function () {
            this.calculateBudsjett();
        }
    });

}(Tilskudd));