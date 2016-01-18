/*global Backbone, window, _*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.SoknadView = ns.SoknadSummaryView.extend({
        template: "#soknad_view_details_template",
        events: function () {
            // OBS: husk at første parameter er destination, bruk derfor {} for å unngå endringer i eksisterende eventlist
            return _.extend({}, this.constructor.__super__.events, {
                'click #export_button': 'exportdata'
            });
        },

        exportdata: function (e) {
            e.preventDefault();
            var url = '/api/sak/v1/export/soknader/' + this.model.id;
            window.open(url, '_blank');
        }

    });


}(Tilskudd));