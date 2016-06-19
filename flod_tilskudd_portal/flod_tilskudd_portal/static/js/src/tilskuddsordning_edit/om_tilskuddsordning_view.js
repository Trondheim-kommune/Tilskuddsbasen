/*global Backbone, moment, _, $, window, console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.TilskuddsordningView = ns.BaseContentEditView.extend({
        template: "#redigere_tilskuddsordning_template",
        bindings: {
            "select#id_type": {
                observe: 'type',
                selectOptions: {
                    collection: ns.TilskuddsordningTypeCollection,
                    defaultOption: {
                        label: '---',
                        value: null // invalid choice, if chosen the old value will still be kept
                    }
                }
            },
            "#id_navn": "navn",
            "#id_soknadsfrist": "soknadsfrist",
            "#id_rapportfrist": "rapportfrist",
            "#id_budsjett": "budsjett",
            "#id_publisert": "publisert",
            '#id_balanse': "budsjett_i_balanse",
            "#id_innledningstekst": "innledningstekst",
            "#id_prosjekttekst": "prosjekttekst",
            "#id_budsjettekst": "budsjettekst",
            "#id_husk_ogsa": "husk_ogsa",
            "#id_lenke_til_retningslinjer": "lenke_til_retningslinjer"
        },

        onShow: function () {
            Backbone.Stickit.addHandler({
                selector: '.datepicker',
                onGet: function (value, options) {
                    return ns.formatDato(value);
                },
                onSet: function (value, options) {
                    return ns.formatDateNoToIso(value);
                }
            });

            this.stickit();

            this.$el.find('.datepicker').datepicker({
                format: "dd.mm.yyyy",
                weekStart: 1
            });
        }
    });

    ns.RedigereTilskuddordTitleView = Backbone.Marionette.ItemView.extend({
        template: "#view_rediger_tilskuddsord_title_template"
    });

}(Tilskudd));