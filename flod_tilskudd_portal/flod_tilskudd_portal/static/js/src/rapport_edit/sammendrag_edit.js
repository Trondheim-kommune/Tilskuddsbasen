/*global Backbone, window*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.RapportSammendragView = ns.RapportSummaryView.extend({
        template: "#rapport_edit_sammendrag_template",
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
            '#id_regnskapbalanse': "regnskapbalanse"
        },

        events: {
            'click #previous_button': 'previousClicked',
            'click #cancel_button': 'cancel',
            'click #send_button': 'send'
        },

        send: function () {
            var target = '?menu=Sammendrag&action=Send%20rapport';
            if ("pushState" in window.history) {
                Backbone.history.navigate(window.location.pathname + target, true);
            }
            else {
                Backbone.history.navigate(target, true);
            }
            $(window).scrollTop(0);
        },

        initialize: function (options) {
            ns.RapportSummaryView.prototype.initialize.call(this, options);
            this.okonomipostCollection = new ns.OkonomipostCollection(this.model.get("okonomipost"));
            this.model.set("okonomipostCollection", this.okonomipostCollection);

            this.soknadModel = this.options.soknadModel;
            this.model.set("soknadModel", this.soknadModel);

        }
    });

}(Tilskudd));