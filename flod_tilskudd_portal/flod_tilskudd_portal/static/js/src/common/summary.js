/*global Backbone, window*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.SummaryView = ns.BaseContentEditView.extend({
        saveOnNavigation: false,
        calculateBudsjett: function() {
            var utgifter = this.okonomipostCollection.calculateSum('Budsjett', 'Utgift');
            var inntekter = this.okonomipostCollection.calculateSum('Budsjett', 'Inntekt');
            var omsokt_belop = parseInt(this.omsoktBelop, 10);
            if (!_.isNaN(omsokt_belop)) {
                inntekter += omsokt_belop;
            }

            this.model.set('sum_utgifter', utgifter);
            this.model.set('sum_inntekter', inntekter);
            this.model.set('budsjettbalanse', inntekter-utgifter);

        },

        calculateRegnskap: function() {
            var utgifter_regnskap = this.okonomipostCollection.calculateSum('Regnskap', 'Utgift');
            var inntekter_regnskap = this.okonomipostCollection.calculateSum('Regnskap', 'Inntekt');

            var vedtatt_belop = parseInt(this.vedtattBelop, 10);
            if (!_.isNaN(vedtatt_belop)) {
                inntekter_regnskap += vedtatt_belop;
            }

            this.model.set('sum_regnskap_utgifter', utgifter_regnskap);
            this.model.set('sum_regnskap_inntekter', inntekter_regnskap);
            this.model.set('regnskapbalanse', inntekter_regnskap - utgifter_regnskap);

        },

        calculateSums: function() {
            throw "ProgrammingError. Calculate sums not overridden.";
        },

        onRender: function() {
            this.calculateSums();
        }
    });

}(Tilskudd));