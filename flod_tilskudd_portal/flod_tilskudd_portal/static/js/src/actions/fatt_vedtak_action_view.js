/*global console, _ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.VurdereVedtakActionView = ns.BaseSavingActionContentView.extend({
        template: "#fatt_vedtak_action_template",
        bindings: {
            "#id_omsokt_belop": "omsokt_belop",
            "#id_innstilt_belop": "innstilt_belop",
            "#id_vedtatt_belop": "vedtatt_belop",
            "#id_intern_merknad": "intern_merknad",
            "#id_andre_opplysninger": "andre_opplysninger",
            "#id_vedtakstekst": "vedtakstekst"
        },

        redirectOnSaveSuccess: function () {
            window.location.href = '/soknad/' + this.model.soknad_id;
        },

        events: function () {
            return _.extend({}, ns.BaseSavingActionContentView.prototype.events, {
                'click #fatt_vedtak_action': 'fatt_vedtak',
                'click #tilbake_til_saksbehandler_action': 'tilbake_til_innstilling',
                'click #save_action': 'saveOnly'
            });
        },

        initialize: function () {
            this.soknadModel = this.options.soknadModel;
            var vedtak = this.soknadModel.getSisteVedtak();
            if (!_.isUndefined(vedtak)) {
                this.model.set('vedtak_id', vedtak.id);
                this.model.set('innstilt_belop', vedtak.innstilt_belop);
                this.model.set('vedtatt_belop', vedtak.vedtatt_belop);
                this.model.set('intern_merknad', vedtak.intern_merknad);
                this.model.set('rapportfrist', vedtak.rapportfrist);
                this.model.set('vedtakstekst', vedtak.vedtakstekst);
                this.model.set('andre_opplysninger', vedtak.andre_opplysninger);
            }
            this.model.set('omsokt_belop', this.soknadModel.get('omsokt_belop'));
        },

        saveOnly: function (e) {
            this.model.set('saveOnly', true);
            var self = this;
            this.ok(e, function () {
                self.model.unset('saveOnly');
                self.soknadModel.fetch({
                    'success': function () {
                        var vedtak = self.soknadModel.getSisteVedtak();
                        self.model.set('vedtak_id', vedtak.id);
                    }
                });
            });
        },

        fatt_vedtak: function (e) {
            this.model.set('id', 'fatt_vedtak');
            this.ok(e);
        },

        tilbake_til_innstilling: function (e) {
            this.model.set('id', 'tilbake_til_innstilling');
            this.ok(e);
        }

    });
})(Tilskudd);