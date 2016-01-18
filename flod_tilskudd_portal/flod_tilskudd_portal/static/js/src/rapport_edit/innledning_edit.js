/*global Backbone, console, window*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.RapportInnledningView = ns.BaseContentEditView.extend({
        template: "#rapport_edit_innledning_template",
        saveOnNavigation: false,

        initialize: function() {
            this.vedtak = new Backbone.Model(this.model.getSisteVedtak());
        },

        onShow: function(){
            this.stickit();
            this.addBinding(this.vedtak, "#id_frist", {
                'observe': 'rapportfrist',
                onGet: function(value) {
                    return ns.formatDato(value);
                }
            });

        }
        
    });

}(Tilskudd));