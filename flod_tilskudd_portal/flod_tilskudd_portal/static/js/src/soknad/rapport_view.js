/*global Backbone, window*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
        "use strict";

        ns.RapportView = ns.RapportSummaryView.extend({
            template: "#rapport_template",
            bindings: {
                "#id_prosjekt_gjennomforing": "prosjekt_gjennomforing",
                "#id_prosjekt_avvik": "prosjekt_avvik",
                "#id_regnskapsbalanse": "regnskapsbalanse",
                "#id_budsjett_avvik": "budsjett_avvik",
                "#id_resultat_kommentar": "resultat_kommentar",
                '#id_sum_utgifter': "sum_utgifter",
                '#id_sum_inntekter': "sum_inntekter",
                '#id_budsjettbalanse': "budsjettbalanse",
                '#id_sum_regnskap_utgifter': "sum_regnskap_utgifter",
                '#id_sum_regnskap_inntekter': "sum_regnskap_inntekter",
                '#id_regnskapbalanse': "regnskapbalanse",
                '#id_avskrevet_rapportkrav': {
                    attributes: [
                        {
                            name: 'class',
                            observe: "soknadModel",
                            onGet: function (soknad) {
                                return !soknad.get('avskrevet_rapportkrav_kommentar') ? 'hidden' : '';
                            }
                        }
                    ]
                },
                '#id_avskrevet_rapportkrav_kommentar': {
                    observe: "soknadModel",
                    onGet: function (soknad) {
                        return soknad.get('avskrevet_rapportkrav_kommentar');
                    }
                }
            },

            events: function () {
                // OBS: husk at første parameter er destination, bruk derfor {} for å unngå endringer i eksisterende eventlist
                return _.extend({}, this.constructor.__super__.events, {
                    'click .export_button': 'exportdata'
                });
            },

            exportdata: function (e) {
                e.preventDefault();
                var url = '/api/sak/v1/export/soknad/' + this.model.get('soknad_id') + '/rapport/' + this.model.get('id');
                window.open(url, '_blank');
            },

            initialize: function (options) {
                ns.RapportSummaryView.prototype.initialize.call(this, options);
                this.okonomipostCollection = new ns.OkonomipostCollection(this.model.get("okonomipost"));
                this.model.set("okonomipostCollection", this.okonomipostCollection);

                this.soknadModel = this.options.soknadModel;
                this.model.set("soknadModel", this.soknadModel);
            }
        });

    }(Tilskudd)
);