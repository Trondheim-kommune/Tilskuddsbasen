/*global console, Backbone, _, moment, LZString, $ */

var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.FilterSubscription = new ns.TilskuddApp.UrlQueryParameterSubscription(
        "filter",
        "urlQueryParam:updateFilterFromUrl",
        "urlQueryParam:updateFilterFromApp",
        "urlQueryParam:requestBroadcastFilterQueryParameterValueEvent",
        true);

    var FacetValueBaseItem = Backbone.Marionette.ItemView.extend({
        tagName: "li",

        showErrors: function (error) {
            ns.TilskuddApp.vent.trigger("message:error",
                {
                    'message': 'Det oppstod en feil. Prøv igjen senere.'
                }
            );
            _.each(error, this.addError, this);
        },

        addError: function (error, key) {
            console.log("error" + error);
        }
    });

    var FacetValueCheckboxItem = FacetValueBaseItem.extend({
        template: "#facet_value_checkbox_template"
    });

    var FacetValueRadioItem = FacetValueBaseItem.extend({
        template: "#facet_value_radio_template"
    });

    var FacetValueTextItem = FacetValueBaseItem.extend({
        template: "#facet_value_text_template"
    });


    var FacetView = Backbone.Marionette.CompositeView.extend({
        template: "#facets_template",
        childViewContainer: ".facet_values",
        events: {
            'click .reset_facet ': 'resetByUser',
            'click .toggler ': 'toggleUL'
        },


        getChildView: function (item) {
            // Choose which view class to render,
            // depending on the properties of the item model
            if (this.model.get('facetType') === "oneof") {
                return FacetValueRadioItem;
            } else if (this.model.get('facetType') === "anyof") {
                return FacetValueCheckboxItem;
            } else if (this.model.get('facetType') === "free") {
                return FacetValueTextItem;
            } else {
                throw this.model.get('facetType') + " not supported";
            }
        },

        initialize: function () {
            this.collection = new Backbone.Collection(this.model.get('values'));
            var facetBindingSelector = ".facet" + this.model.get('facetId') + "class";
            this.bindings = {};
            this.bindings[facetBindingSelector] = 'selection';

            this.listenTo(this.model, "change:selection", function () {
                ns.TilskuddApp.vent.trigger(ns.FilterUtils.getUpdateOnUserModificationEvent());
            });
        },

        onRender: function () {
            this.stickit();
        },

        resetByUser: function (e) {
            e.preventDefault();
            this.reset();
            // reset does not trigger any event, we have to do it now.
            ns.TilskuddApp.vent.trigger(ns.FilterUtils.getUpdateOnUserModificationEvent());
        },

        reset: function () {
            // Reset of a collection of facet is done by calling this reset function on each facet in the collection.
            //
            // We use silent true here, and rely on the code using this reset function to manually
            // trigger the correct event to avoid triggering as many events as there are facets in the collection.
            this.model.set('selection', undefined, {silent: true});
            // as we used silent the view is not going to be refreshed on its own, let´s do it.
            this.render();
        },

        showErrors: function (error) {
            ns.TilskuddApp.vent.trigger("message:error",
                {
                    'message': 'Det oppstod en feil. Prøv igjen senere.'
                }
            );
            _.each(error, this.addError, this);
        },

        addError: function (error, key) {
            console.log("error" + error);
        },

        updateFacetsBasedOnURL: function (filters) {
            if (filters !== undefined) {
                var self = this;
                _.each(filters, function (facet) {
                        if (facet.facetName === self.model.get('facetName')) {
                            var selection;
                            if (self.model.get('facetType') === "anyof") {
                                selection = [];
                                _.each(facet.values, function (facetValue) {
                                    var modelValueName = ns.FilterUtils.convertToBusterCompatibleValueName(facetValue.queryValueName);
                                    selection.push(modelValueName);
                                });
                            } else if (self.model.get('facetType') === "oneof" || self.model.get('facetType') === "free") {
                                var modelValueName = ns.FilterUtils.convertToBusterCompatibleValueName(facet.values[0].queryValueName);
                                selection = modelValueName;
                            } else {
                                throw this.model.get('facetType') + " not supported";
                            }
                            self.model.set('selection', selection, {silent: true});
                        }
                    }
                )
                ;
            }
            this.render();
        },

        toggleUL: function (event) {
            var toggler = $(event.target);
            toggler.siblings("div").slideToggle("fast");
            if (toggler.hasClass("glyphicon-chevron-down")) {
                toggler.addClass("glyphicon-chevron-up").removeClass("glyphicon-chevron-down");
            }

            else {
                toggler.addClass("glyphicon-chevron-down").removeClass("glyphicon-chevron-up");
            }
        }
    });

    ns.FilterSoknaderActionView = ns.BaseActionContentView.extend({
        template: "#filter_action_template",
        events: {
            'click #cancel_action': 'cancel',
            'click #reset_filters': 'resetByUser'
        },
        childView: FacetView,

        childViewContainer: "#facets",

        initialize: function () {
            ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(ns.FilterSubscription, true);
            _.bindAll(this, "updateFacetsBasedOnURL", "filterAfterUserModification", "reset", "collectFacets", "collectFacetValues");
            this.listenTo(ns.TilskuddApp.vent, ns.FilterUtils.getUpdateOnUserModificationEvent(), this.filterAfterUserModification);
            this.listenTo(ns.TilskuddApp.vent, ns.FilterSubscription.updateFromUrlEvent, this.updateFacetsBasedOnURL);
            this.refreshFilters();
        },

        refreshFilters: function () {
            var self = this;
            this.collection.fetch({
                reset: true,
                success: function (model, response, options) {
                    ns.TilskuddApp.vent.trigger(
                        ns.FilterSubscription.requestBroadcastQueryParameterValueEvent,
                        ns.FilterSubscription,
                        self
                    );
                }, error: function (model, response, options) {
                    ns.TilskuddApp.vent.trigger("message:error",
                        {
                            'message': 'Kunne ikke hente filter!'
                        });
                }

            });
        },

        updateFacetsBasedOnURL: function (filters, requestedBy) {
            if (_.isUndefined(requestedBy) || _.isEqual(requestedBy, this)) {
                this.reset();
                var latestFilters = ns.FilterUtils.getLatestFiltersCookie();
                latestFilters = (latestFilters && latestFilters.length > 0) ? latestFilters : undefined;
                if (filters && filters.length > 0) {
                    console.log("Updating filters based on information found in URL: " + JSON.stringify(filters));
                    this.updateFacetsBasedOnFilters(filters);
                } else if (!_.isUndefined(latestFilters)) {
                    console.log("Updating filters based on information found in cookie: " + JSON.stringify(latestFilters));
                    this.updateFacetsBasedOnFilters(latestFilters);
                    ns.TilskuddApp.vent.trigger(
                        ns.FilterSubscription.updateFromAppEvent,
                        ns.FilterSubscription,
                        latestFilters
                    );
                    ns.TilskuddApp.vent.trigger(ns.FilterUtils.getFilterChangedEvent(), latestFilters);
                }
            }
        },

        updateFacetsBasedOnFilters: function (filters) {
            if (typeof this.childView !== "undefined") {
                if (this.children.length > 0) {
                    this.children.each(function (facetView) {
                        facetView.updateFacetsBasedOnURL(filters);
                    });
                }
            }
        },

        filterAfterUserModification: function () {
            this.filter(true);
        },

        filter: function (triggerUpdateFromAppEvent) {
            var filters = this.collectFacets();
            if (triggerUpdateFromAppEvent) {
                ns.FilterUtils.setLatestFiltersCookie(filters);
                ns.TilskuddApp.vent.trigger(
                    ns.FilterSubscription.updateFromAppEvent,
                    ns.FilterSubscription,
                    (filters.length === 0) ? undefined : filters
                );
            }
            console.log("Filters changed: " + JSON.stringify(filters));
            ns.TilskuddApp.vent.trigger(ns.FilterUtils.getFilterChangedEvent(), filters);
        },

        resetByUser: function (e) {
            e.preventDefault();
            this.reset();
            // reset does not trigger any event, we have to do it now.
            ns.TilskuddApp.vent.trigger(ns.FilterUtils.getUpdateOnUserModificationEvent());
        },

        reset: function () {
            if (typeof this.childView !== "undefined") {
                this.children.each(function (facetView) {
                    facetView.reset();
                });
            }
        },

        collectFacets: function () {
            var filters = [];
            var self = this;
            this.children.each(function (facetView) {
                var facetViewModel = facetView.model;
                var facetName = facetViewModel.get('facetName');
                var facetType = facetViewModel.get('facetType');
                var values = self.collectFacetValues(facetViewModel, values);
                if (values.length > 0) {
                    var facet = {};
                    facet.facetType = facetType;
                    facet.facetName = facetName;
                    facet.values = values;
                    filters.push(facet);
                }
            });
            return filters;
        },

        collectFacetValues: function (facetModel) {
            if (_.isUndefined(facetModel.get('selection')) || facetModel.get('selection') === "") {
                return [];
            }
            var values = [];
            if (facetModel.get('facetType') === "anyof") {
                this.addAnyOfValues(facetModel, values);
            } else if (facetModel.get('facetType') === "oneof") {
                this.addOneOfValue(facetModel.get('values'), facetModel.get('selection'), values);
            } else if (facetModel.get('facetType') === "free") {
                this.addFreeValue(facetModel.get('values'), facetModel.get('selection'), values);
            } else {
                throw facetModel.get('facetType') + " not supported";
            }
            return values;
        },

        addAnyOfValues: function (facetModel, values) {
            var self = this;
            _.each(facetModel.get('selection'), function (selectedQueryValuename) {
                self.addOneOfValue(facetModel.get('values'), selectedQueryValuename, values);
            });
        },

        addOneOfValue: function (facetValues, selectedQueryValue, values) {
            _.each(facetValues, function (value) {
                var modelValueName = ns.FilterUtils.convertToBusterCompatibleValueName(value.queryValueName);
                if (modelValueName === selectedQueryValue) {
                    values.push({
                        "valueName": value.valueName,
                        "queryValueName": value.queryValueName
                    });
                }
            });
        },

        addFreeValue: function (facetValues, selectedQueryValue, values) {
            _.each(facetValues, function (value) {
                values.push({
                    "valueName": value.valueName,
                    "queryValueName": selectedQueryValue
                });
            });
        }
    });

    ns.FilterUtils = {

        getUpdateOnUserModificationEvent: function () {
            return "filter:updateOnUserModification";
        },

        getFilterChangedEvent: function () {
            return "filter:changed:";
        },

        convertToBusterCompatibleValueName: function (facetValueName) {
            var ret = facetValueName;
            // Verdiene i facet modellen skal sammenlignes med en verdi som kommer
            // fra stickit. Stickit verdien er en streng mens det brukes andre typer i modellen vår.
            // En konvertering må derfor skje:
            //
            //      * I tilfelle modellverdien er et tall så konverterer vi den til streng
            //      * I tilfelle modellverdien er null konverterer vi til tom streng.
            //       (det skjer typisk for valg av typen "Ikke satt")
            if (!_.isNaN(facetValueName) && !_.isNull(facetValueName)) {
                ret = facetValueName + "";
            } else if (_.isNull(facetValueName)) {
                ret = "";
            }
            return ret;
        },

        setLatestFiltersCookie: function (filterValue) {
            // setting expiry date to 100 years in the future ("never" expires)
            var expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 100 * 365);
            document.cookie =
                "tilskudd_latest_filters=" + encodeURIComponent(JSON.stringify(filterValue)) +
                ";expires=" + expiryDate.toUTCString();
        },

        getLatestFiltersCookie: function () {
            var cookieName = "tilskudd_latest_filters=";
            var cookieArray = document.cookie.split(';');
            for (var i = 0; i < cookieArray.length; i++) {
                var cookie = cookieArray[i];
                while (cookie.charAt(0) === ' ') {
                    cookie = cookie.substring(1, cookie.length);
                }
                if (cookie.indexOf(cookieName) === 0) {
                    return JSON.parse(decodeURIComponent(cookie.substring(cookieName.length, cookie.length)));
                }
            }
            return null;
        }

    };


})
(Tilskudd);
