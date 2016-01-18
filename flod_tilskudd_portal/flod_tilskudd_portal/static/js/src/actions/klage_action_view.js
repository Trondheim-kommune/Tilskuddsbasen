/*global console, _, window */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.KlageActionView = ns.BaseSavingActionContentView.extend({
        template: "#klage_action_template",
        bindings: {
            "#id_begrunnelse_klage": "begrunnelse",
            "#id_klagefrist": "klagefrist"
        },

        events: {
            'click #id_bekreft': 'enableSendKlage',
            'click #cancel_action': 'cancel',
            'click #ok_action': 'ok'
        },

        initialize: function () {
            this.soknadModel = this.options.soknadModel;
            var vedtak = this.soknadModel.getSisteVedtak();
            if (!_.isUndefined(vedtak)) {
                this.model.set('vedtak_id', vedtak.id);
            }

            var klagefrist = moment(vedtak.vedtaksdato).add(35, 'days').toDate();

            this.model.set('begrunnelse', "");
            this.model.set('klagefrist', ns.formatDato(klagefrist));

            this.$(".btn-danger").attr("disabled", true);
        },

        onShow: function () {
            ns.BaseSavingActionContentView.prototype.onShow.call(this);

            this.addBinding(this.soknadModel, "#id_email", {
                observe: "saksbehandler",
                onGet: function (value) {
                    return "Ta kontakt med saksbehandler";
                },
                attributes: [
                    {
                        name: 'href',
                        onGet: function (value) {
                            if (!_.isUndefined(value) && value !== null) {
                                return "mailto:" + value.email_address;
                            }
                        }
                    }
                ]
            });
        },

        enableSendKlage: function () {
            if (this.$("#id_bekreft").is(':checked')) {
                this.$(".btn-danger").attr("disabled", false);
            } else {
                this.$(".btn-danger").attr("disabled", true);
            }
        },

        redirectOnSaveSuccess: function () {
            window.location.href = '/soknad/' + this.model.soknad_id;
        }
    });
})(Tilskudd);