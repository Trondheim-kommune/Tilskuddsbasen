/*global console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";


    ns.NySoknadActionView = ns.BaseSavingActionContentView.extend({
        template: "#ny_soknad_action_template",
        events: {
            'click #cancel_action': 'cancel',
            'click #ok_action': 'ok',
            'change #valgt_tilskuddsordning': 'changedValgtTilskuddsordning'
        },

        fetchTilskuddsordninger: function () {
            var self = this;
            this.model.get('tilskuddsordninger').fetch({
                reset: true,
                success: function (model, response, options) {
                    self.render();
                },
                error : function() {
                    ns.TilskuddApp.vent.trigger("message:error",
                        {
                            'message': 'Det oppstod en feil ved lasting av tilskuddsordninger.'
                        }
                    );
                }
            });
        },

        initialize: function () {
            this.listenTo(this.model, "change", this.render());
            this.fetchTilskuddsordninger();
        },

        changedValgtTilskuddsordning: function (e) {
            var tilskuddsordning_id = this.$("#valgt_tilskuddsordning").val();
            this.valgtTilskuddsordning = this.model.get('tilskuddsordninger').get(tilskuddsordning_id);
            if (_.isNull(this.valgtTilskuddsordning.get("soknadsfrist"))) {
                this.$("#soknadsfrist").text("Ingen søknadsfrist");
            } else {
                this.$("#soknadsfrist").text(ns.formatDato(this.valgtTilskuddsordning.get("soknadsfrist")));
            }
        },

        ok: function (e) {
            e.preventDefault();
            var soknadModel = new ns.SoknadModel();
            soknadModel.save(
                {"tilskuddsordning_id": this.valgtTilskuddsordning.get("id")},
                {
                    success: function (model, response, options) {
                        window.location.href = "/soknad/" + soknadModel.id + "/edit";
                    },
                    error: function (model, response, options) {
                        ns.TilskuddApp.vent.trigger("message:error",
                            {
                                'message': 'Det oppstod en feil ved opprettelse av søknad. Prøv igjen senere.'
                            }
                        );
                    }
                }
            );
        }
    });
})(Tilskudd);