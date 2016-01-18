/*global Backbone, window, _ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.OversiktView = Backbone.Marionette.ItemView.extend({
        template: "#oversikt_template",
        bindings: {
            "#id_id": "id",
            "#id_etterspurt_info": {
                observe: 'merknad',
                onGet: function (merknad) {
                    if (this.model.get("status") === 'Returnert til søker') {
                        if ((merknad !== null) || (merknad === "")) {
                            this.$("#etterspurt_info_group").show();
                            return merknad;
                        }
                    }
                    return "";
                }
            },
            "#id_endret_rapportfrist": {
                observe: "vedtak",
                onGet: function (value) {
                    if (this.model.get("status") === 'Avventer rapport') {
                        var vedtak = this.model.getSisteVedtak();
                        if (!_.isUndefined(vedtak)) {
                            if (vedtak.endre_rapportfrist_arsak !== null && vedtak.endre_rapportfrist_arsak !== "") {
                                return vedtak.endre_rapportfrist_arsak;
                            }
                        }
                    }
                    return "";
                }
            },
            ".endret_rapportfrist_info": {
                attributes: [
                    {
                        name: 'class',
                        onGet: function () {
                            if (this.model.get("status") === 'Avventer rapport') {
                                var vedtak = this.model.getSisteVedtak();
                                if (!_.isUndefined(vedtak)) {
                                    if (vedtak.endre_rapportfrist_arsak !== null && vedtak.endre_rapportfrist_arsak !== "") {
                                        return "";
                                    }
                                }
                            }
                            return "hidden";
                        }
                    }
                ]

            },
            "#id_rapport_underkjent": "rapport_underkjent",
            "#id_status": "status",
            "#id_omsokt_belop": "omsokt_belop",
            "#id_levert_dato": {
                observe: 'levert_dato',
                onGet: function (levert_dato) {
                    return ns.formatDato(levert_dato);
                }
            },
            "#id_tilskudddsordning_navn": {
                observe: 'tilskuddsordning',
                onGet: function (tilskuddsordning) {
                    if (!_.isUndefined(tilskuddsordning)) {
                        return tilskuddsordning.navn;
                    }
                }
            },
            "#id_soknadsfrist": {
                observe: 'tilskuddsordning',
                onGet: function (tilskuddsordning) {
                    if (!_.isUndefined(tilskuddsordning) &&  !_.isNull(tilskuddsordning.soknadsfrist)) {
                        return ns.formatDato(tilskuddsordning.soknadsfrist);
                    } else {
                        // returnerer en verdi siden det å ikke ha verdi i det feltet
                        // betyr ikke at det er ikke fylt ut ennå, men at det er ingen frist.
                        return "Ingen";
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
            "#id_vedtatt_belop": {
                observe: 'vedtak',
                onGet: function (vedtaksliste) {
                    var vedtak = this.model.getSisteVedtak();
                    if (!_.isUndefined(vedtak)) {
                        return vedtak.vedtatt_belop;
                    }
                }
            },
            "#id_utbetalt_belop": {
                observe: 'utbetaling',
                onGet: function (utbetalingsliste) {
                    var utbetaling = this.model.getSisteUtbetaling();
                    if (!_.isUndefined(utbetaling)) {
                        return utbetaling.utbetalt_belop;
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
                            if (this.model.get("tilskuddsordning").type === "Krever ikke rapport") {
                                return "hidden";
                            }
                        }
                    }
                ]
            },
            "#id_soker_name": {
                observe: 'organisation',
                onGet: function (organisation) {
                    if (!_.isUndefined(organisation)) {
                        return organisation.name;
                    }
                }
            },
            "#id_saksbehandler": {
                observe: 'saksbehandler',
                onGet: function (saksbehandler) {
                    if (!_.isUndefined(saksbehandler)) {
                        return saksbehandler.full_name;
                    }
                }
            }
        },

        initialize: function () {
            this.model.set({opprettet: null});

            this.model.set("rapport_underkjent", "");
            var rapport = this.model.get('rapport')[0];
            if (!(_.isUndefined(rapport))) {
                var rapportModel = new ns.SoknadRapportModel({'id': rapport.id, 'soknad_id': this.model.id});
                var self = this;
                rapportModel.fetch({
                    'success': function (model) {
                        if ((model.get("saksbehandler_kommentar") !== null) || (model.get("saksbehandler_kommentar") === "")) {
                            var rapport_underkjent = model.get("saksbehandler_kommentar");
                            self.model.set("rapport_underkjent", rapport_underkjent);
                            if (!_.isNull(rapport_underkjent) && rapport_underkjent !== "") {
                                self.$("#rapport_underkjent_info").show();
                            }
                        }
                    },
                    'error': function () {
                        ns.TilskuddApp.vent.trigger("message:error",
                            {
                                'message': 'Det oppstod en feil ved lasting av rapportinformasjon på søknad.'
                            }
                        );
                    }
                });
            }
        },

        toggleVedtaksBrevButtonVisibility: function(){
            if(this.model.get("vedtak").length !== 0 && this.model.getNyesteFattetVedtak() !== null) {
                this.$("#vedtaksbrev_button").show();
            } else {
                this.$("#vedtaksbrev_button").hide();
            }
        },

        onShow: function () {
            this.stickit();
            this.toggleVedtaksBrevButtonVisibility();
        }
    });

}(Tilskudd));