/*global Backbone, moment, _, $, window, console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.InnledningView = ns.BaseContentEditView.extend({
        template: "#innledning_template",
        saveOnNavigation: false,
        bindings : {
            "#id_innledningstekst": {
                'observe': 'tilskuddsordning',
                'onGet': function(tilskuddsordning) {
                    return tilskuddsordning.innledningstekst;
                }
            },
            "#id_soknadsfrist": {
                'observe': 'tilskuddsordning',
                'onGet': function(tilskuddsordning) {
                    return ns.formatDato(tilskuddsordning.soknadsfrist);
                }
            },
            "#id_lenke_til_retningslinjer": {
                'observe': 'tilskuddsordning',
                'onGet': function(tilskuddsordning) {
                    return tilskuddsordning.lenke_til_retningslinjer;
                }
            }
        },

        initialize: function(){
            this.model.set("lenke_til_retningslinjer", this.model.get('tilskuddsordning').lenke_til_retningslinjer);
        }

    });
}(Tilskudd));
