/*global Backbone, moment, _, $, window */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var BudsjettRowView = ns.BaseOkonomipostRowView.extend({
        template: "#budsjett_row_template",
        bindings: {
            "#id_navn": "navn",
            "#id_belop": {
                observe: 'okonomibelop',
                onGet: function() {
                    return this.model.getBelopOfType("Budsjett");
                },
                onSet: function(newValue) {
                    var okonomibelopListe = this.model.get("okonomibelop");
                    var post = this.model.getOkonomibelopOfType("Budsjett");
                    if (post === undefined) {
                        post = {'okonomibelop_type': "Budsjett"};
                        this.model.get("okonomibelop").push(post);
                    }
                    post.belop = newValue;
                    return okonomibelopListe;
                }
            }
        }
    });

    ns.BudsjettView = ns.BaseOkonomipostView.extend({
        template: "#budsjett_template",
        childView: BudsjettRowView,
        bindings: {
            "#id_omsokt_belop": {
                observe: "omsokt_belop",
                onGet: function(value) {
                    if (value === 0) {
                        return null;
                    }
                    return value;
                }
            }
        },
        initializeBudsjettposter: function(type, kategori, minNum) {
            var count = this.collection.filterOkonomipost(type, kategori).length;
            while (count++ < minNum) {
                this.addOkonomipost(type, kategori);
            }
        },
        initialize: function () {
            this.initializeBudsjettposter('Utgift', 'Annet', 5);
            this.initializeBudsjettposter('Inntekt', 'Annet', 5);
            this.initializeBudsjettposter('Inntekt', 'Tilskudd', 2);

            // kopiert fra BaseOkonomipostView sidan initialize er overrida her
            this.listenTo(this, "childview:belopchanged", this.calculateSums);
            this.listenTo(this.collection, "remove", this.calculateSums);
        },

        calculateSums: function() {
            var utgifter = this.collection.calculateSum('Budsjett', 'Utgift');
            var inntekter = this.collection.calculateSum('Budsjett', 'Inntekt');
            var omsokt_belop = parseInt(this.model.get("omsokt_belop"), 10);
            if (!_.isNaN(omsokt_belop)) {
                inntekter += omsokt_belop;
            }
            this.$('#id_sum_utgifter').html(utgifter);
            this.$('#id_sum_inntekter').html(inntekter);
            this.$('#id_budsjettbalanse').html(inntekter-utgifter);
        },
        addOkonomipost: function (type, kategori) {
            this.collection.add(new ns.OkonomipostModel({
                'okonomipost_type': type,
                'okonomipost_kategori': kategori,
                'navn': '',
                'okonomibelop': [{'okonomibelop_type': 'Budsjett', 'belop': ''}]
            }));
        }
    });


}(Tilskudd));
