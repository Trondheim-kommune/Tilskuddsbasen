/*global _, Backbone, $, window, console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";
    ns.SoknadItemTableView = Backbone.Marionette.ItemView.extend({
        tagName: "tr",
        template: "#soknadsliste_tablerow_template",
        bindings: {
            "#id_levert_dato": {
                observe: 'levert_dato',
                onGet: function (value) {
                    return ns.formatDato(value);
                }
            },
            "#id_vedtatt_belop": {
                observe: "vedtak",
                onGet: function (value) {
                    var vedtak = this.model.getSisteVedtak();
                    if (!_.isUndefined(vedtak)) {
                        return vedtak.vedtatt_belop;
                    }
                }
            }
        },
        events: {
            'click': 'row_clicked',
            'enter': 'row_clicked'
        },
        row_clicked: function () {
            if (this.model !== undefined) {
                window.location.href = "/soknad/" + this.model.id;
            }
        },
        onRender: function () {
            this.stickit();
        },

        initialize: function () {
            $("body").on("keypress", "#list_soknader td", function (e) {
                if (e.keyCode == 13) {
                    $(this).trigger('enter');
                }
            });
        }
    });

    ns.SoknadTableView = Backbone.Marionette.CompositeView.extend({
        template: "#soknadsliste_table_template",
        childView: ns.SoknadItemTableView,
        childViewContainer: "#list_soknader",
        bindings: {
            "#id_sum_omsokt_belop": {
                observe: "collection",
                onGet: function (field, option) {
                    return field.sumOmsokt();
                },
                updateView: true
            },
            "#id_sum_vedtatt_belop": {
                observe: "collection",
                onGet: function (field, option) {
                    return field.sumVedtatt();
                },
                updateView: true
            }
        },

        onRender: function () {
            this.stickit();
        },

        initialize: function () {
            _.bindAll(this, "updateCollection");
            this.listenTo(ns.TilskuddApp.vent, ns.FilterSubscription.updateFromUrlEvent, this.updateCollection);
            this.listenTo(ns.TilskuddApp.vent, ns.FilterUtils.getFilterChangedEvent(), this.updateCollection);
            ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(ns.FilterSubscription);
        },

        updateCollection: function (urlFilters, requestedBy) {
            if (_.isUndefined(requestedBy) || _.isEqual(requestedBy, this)) {
                var filters = null;
                var latestFilters = ns.FilterUtils.getLatestFiltersCookie();
                latestFilters = (latestFilters && latestFilters.length > 0) ? latestFilters : undefined;
                if (urlFilters && urlFilters.length > 0) {
                    console.log("Fetching søknadsliste based on information in URL: " + JSON.stringify(urlFilters));
                    filters = urlFilters;
                } else if (!_.isUndefined(latestFilters)) {
                    filters = latestFilters;
                    ns.TilskuddApp.vent.trigger(
                        ns.FilterSubscription.updateFromAppEvent,
                        ns.FilterSubscription,
                        latestFilters
                    );

                }
                // We cancel previous fetch request to guarantee that this.collection contains the
                // data for the latest search.
                if (!_.isUndefined(this.previousJqxhr)) {
                    // readyState values are: UNSENT=0, OPENED=1, HEADERS_RECEIVED=2, LOADING=3 and DONE=4
                    if (this.previousJqxhr.readyState > 0 && this.previousJqxhr.readyState < 4) {
                        this.previousJqxhr.abort();
                    }
                }
                this.previousJqxhr = this.collection.fetch({
                    data: JSON.stringify(filters),
                    type: "POST",
                    contentType: "application/json; charset=UTF-8"
                });
            }
        }
    });
}(Tilskudd));