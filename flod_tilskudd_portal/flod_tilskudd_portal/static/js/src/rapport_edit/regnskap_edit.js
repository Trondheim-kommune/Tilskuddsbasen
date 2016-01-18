/*global Backbone, moment, _, $, window, console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var RegnskapRowView = ns.BaseOkonomipostRowView.extend({
        template: "#regnskap_row_template",
        bindings: {
            "#id_navn": "navn",
            "#id_budsjett_belop": {
                observe: 'okonomibelop',
                onGet: function() {
                    return this.model.getBelopOfType("Budsjett");
                },
                onSet: function() {
                    // ignore any changes
                    return this.model.get("okonomibelop");
                }
            },
            "#id_belop": {
                observe: 'okonomibelop',
                onGet: function() {
                    return this.model.getBelopOfType("Regnskap");
                },
                onSet: function(newValue) {
                    var okonomibelopListe = this.model.get("okonomibelop");
                    var post = this.model.getOkonomibelopOfType("Regnskap");
                    if (post === undefined) {
                        post = {'okonomibelop_type': "Regnskap"};
                        this.model.get("okonomibelop").push(post);
                    }
                    post.belop = newValue;
                    return okonomibelopListe;
                }
            }
        }
    });

    ns.RapportRegnskapView = ns.BaseOkonomipostView.extend({
        template: "#rapport_edit_regnskap_template",
        childView: RegnskapRowView,
        bindings: {
            "#id_budsjett_avvik": "budsjett_avvik",
            "#id_resultat_kommentar": "resultat_kommentar"
        },

        initialize: function() {
            this.soknadModel = new ns.SoknadModel({'id': this.model.get('soknad_id')});
            var self = this;
            this.soknadModel.fetch({
                "success": function() {
                    self.calculateSums();
                },
                "error": function() {
                     ns.TilskuddApp.vent.trigger("message:error",
                        {
                            'message': 'Det oppstod en feil ved lasting av tilhørende søknad.'
                        }
                    );
                }
            });

            // kopiert fra BaseOkonomipostView sidan initialize er overrida her
            this.listenTo(this, "childview:belopchanged", this.calculateSums);
            this.listenTo(this.collection, "remove", this.calculateSums);
        },

        onShow: function() {
            this.addBinding(this.soknadModel, "#id_omsokt_belop", "omsokt_belop");
            this.addBinding(this.soknadModel, "#id_vedtatt_belop", {
                observe: 'vedtak',
                onGet: function() {
                    var vedtak = this.soknadModel.getSisteVedtak();
                    if (!_.isUndefined(vedtak)) {
                        return vedtak.vedtatt_belop;
                    }
                }
            });
        },

        calculateSums: function() {
            var utgifter = this.collection.calculateSum('Budsjett', 'Utgift');
            var inntekter = this.collection.calculateSum('Budsjett', 'Inntekt');
            var utgifter_regnskap = this.collection.calculateSum('Regnskap', 'Utgift');
            var inntekter_regnskap = this.collection.calculateSum('Regnskap', 'Inntekt');

            var omsokt_belop = parseInt(this.soknadModel.get("omsokt_belop"), 10);
            if (!_.isNaN(omsokt_belop)) {
                inntekter += omsokt_belop;
            }

            var vedtak = this.soknadModel.getSisteVedtak();
            if (!_.isUndefined(vedtak)) {
                var vedtatt_belop = parseInt(vedtak.vedtatt_belop, 10);
                if (!_.isNaN(vedtatt_belop)) {
                    inntekter_regnskap += vedtatt_belop;
                }
            }

            this.$('#id_sum_utgifter').html(utgifter);
            this.$('#id_sum_inntekter').html(inntekter);
            this.$('#id_budsjettbalanse').html(inntekter-utgifter);

            this.$('#id_sum_regnskap_utgifter').html(utgifter_regnskap);
            this.$('#id_sum_regnskap_inntekter').html(inntekter_regnskap);
            this.$('#id_regnskapbalanse').html(inntekter_regnskap - utgifter_regnskap);
        },

        addOkonomipost: function (type, kategori) {
            this.collection.add(new ns.OkonomipostModel({
                'okonomipost_type': type,
                'okonomipost_kategori': kategori,
                'navn': '',
                'okonomibelop': [{'okonomibelop_type': 'Regnskap', 'belop': ''}]
            }));
        }
    });


}(Tilskudd));
