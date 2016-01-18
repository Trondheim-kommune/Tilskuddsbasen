/*global Backbone, window, _ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.UtbetalingView = Backbone.Marionette.ItemView.extend({
        template: "#utbetaling_template",
        bindings: {
            "#id_tilskuddsordning": {
                observe: 'tilskuddsordning',
                onGet: function (value) {
                    if (!_.isUndefined(this.model.get('tilskuddsordning'))) {
                        return this.model.get('tilskuddsordning').navn;
                    }
                }
            },
            "#id_soker_name": {
                observe: 'organisation',
                onGet: function (value) {
                    if (value) {
                        return value.name;
                    }
                }
            },
            "#id_utbetalt_belop": "utbetalt_belop",
            "#id_registrertdato": {
                observe: "registrertdato",
                onGet: function (value) {
                    return ns.formatDato(value);
                }
            },
            "#id_utbetaltdato": {
                observe: "utbetalingsdato",
                onGet: function (value) {
                    return ns.formatDato(value);
                }
            },

            "#id_kontonr": "kontonummer"
        },

        initialize: function (options) {
            if (this.model.get("utbetaling").length > 0) {
                var utbetaling = this.model.get("utbetaling")[0];

                this.model.set('utbetalingsdato', utbetaling.utbetalingsdato);
                this.model.set('registrertdato', utbetaling.registrertdato);
                this.model.set('utbetalt_belop', utbetaling.utbetalt_belop);

            }
        },
        events: {
            'click #erv_download_button': 'downloadErv'
        },

        downloadErv: function () {
            window.location.href = this.model.url() + "/utbetaling/nyeste/generated-erv";
        },

        onShow: function () {
            this.stickit();
            if (!this.options.user_is_soker) {
                this.$("#erv_download_button").removeClass("hidden");
            }
        }

    });

}(Tilskudd));