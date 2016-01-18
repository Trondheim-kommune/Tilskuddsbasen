/*global Backbone, window*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.RapportSummaryView = ns.SummaryView.extend({

        initialize: function (options) {
            if (this.options && this.options.soknadModel) {
                this.omsoktBelop = this.options.soknadModel.get('omsokt_belop');
                var vedtak = this.options.soknadModel.getSisteVedtak();
                if (!_.isUndefined(vedtak)) {
                    this.vedtattBelop = vedtak.vedtatt_belop;
                }
            } else {
                throw "Missing option 'soknadModel', cannot initialize view!";
            }

        },

        calculateSums: function () {
            this.calculateBudsjett();
            this.calculateRegnskap();
        }

    })
    ;

}(Tilskudd));