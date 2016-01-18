/*global console, _ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.FattKlagevedtakActionView = ns.BaseSavingActionContentView.extend({
        template: "#fatt_klagevedtak_action_template",
        bindings: {
            "#id_omsokt_belop": "omsokt_belop",
            "#id_opprinnelig_vedtatt_belop": "opprinnelig_vedtatt_belop",
            "#id_innstilt_belop": "innstilt_belop",
            "#id_vedtatt_belop": "vedtatt_belop",
            "#id_intern_merknad": "intern_merknad",
            "#id_vedtakstekst": "vedtakstekst",
            "#id_andre_opplysninger": "andre_opplysninger",
            "#id_klagebegrunnelse": "klagebegrunnelse"
        },

        redirectOnSaveSuccess: function () {
            window.location.href = '/soknad/' + this.model.soknad_id;
        },

        events: function () {
            return _.extend({}, ns.BaseSavingActionContentView.prototype.events, {
                'click #fatt_vedtak_action': 'fatt_klagevedtak',
                'click #tilbake_til_saksbehandler_action': 'tilbake_til_innstilling',
                'click #save_action': 'saveOnly'
            });
        },

        initialize: function () {
            this.soknadModel = this.options.soknadModel;
            var vedtak = this.soknadModel.getSisteVedtak();

            this.model.set('vedtak_id', vedtak.id);
            this.model.set('innstilt_belop', vedtak.innstilt_belop);
            this.model.set('vedtatt_belop', vedtak.vedtatt_belop);
            this.model.set('intern_merknad', vedtak.intern_merknad);
            this.model.set('rapportfrist', vedtak.rapportfrist);
            this.model.set('vedtakstekst', vedtak.vedtakstekst);
            this.model.set('andre_opplysninger', vedtak.andre_opplysninger);
            this.model.set('omsokt_belop', this.soknadModel.get('omsokt_belop'));

            var klage = this.soknadModel.getSisteKlage();
            if (!_.isUndefined(klage)) {
                this.model.set('klagebegrunnelse', klage.begrunnelse);
            }

            var opprinneligVedtak = this.soknadModel.getSisteVedtak(1);
            if (!_.isUndefined(opprinneligVedtak)) {
                this.model.set('opprinnelig_vedtatt_belop', opprinneligVedtak.vedtatt_belop);
            }
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

        fatt_klagevedtak: function (e) {
            this.model.set('id', 'fatt_klagevedtak');
            this.ok(e);
        },

        tilbake_til_innstilling: function (e) {
            this.model.set('id', 'tilbake_til_vurder_klage');
            this.ok(e);
        }


    });
})(Tilskudd);