/*global Backbone, window, _, console, Marionette, $, LZString*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    // Disallow AJAX caching
    $.ajaxSetup({ cache: false });

    ns.TilskuddLayout = Backbone.Marionette.LayoutView.extend({
        template: "#tilskudd_layout_template",
        regions: {
            title: "#title",
            menu: "#navbar",
            content: "#content",
            actionbar: "#actionbar",
            actionarea: "#actionarea",
            message: "#message"
        },
        initialize: function () {

            var self = this;
            ns.TilskuddApp.vent.on("message:success", function (data) {
                if (!data.title) {
                    data.title = "Suksess";
                }
                data.type = ns.MessageModel.MessageType.SUCCESS;

                self.showMessageToUser(new ns.MessageModel(data));

            });
            ns.TilskuddApp.vent.on("message:error", function (data) {

                if (!data.title) {
                    data.title = "Feil";
                }
                data.type = ns.MessageModel.MessageType.ERROR;

                self.showMessageToUser(new ns.MessageModel(data));
            });
            ns.TilskuddApp.vent.on("message:clear", function (data) {
                self.clearUserMessages();
            });
        },
        showMessageToUser: function (messageModel) {
            this.message.show(new ns.MessageView({model: messageModel}));
        },

        clearUserMessages: function () {
            this.message.reset();
        }
    });

    ns.TilskuddLayoutNoMenu = ns.TilskuddLayout.extend({
        template: "#tilskudd_layout_template_no_menu"
    });


    ns.globalEvents = {
        registerQParamEvents: "url:registerQParamEvents"
    };


    ns.TilskuddApp = new Backbone.Marionette.Application();

    ns.TilskuddApp.addRegions({
        pageContent: "#page-content"

    });

    ns.TilskuddApp.addInitializer(function (options) {
        ns.TilskuddApp.pageContent.show(options.pageContent);
    });


    ns.TilskuddApp.vent.on("tilskudd:ready", function (options) {
        if (Backbone.history) {
            Backbone.history.start({pushState: "pushState" in window.history});
            
        }
    });

    ns.TilskuddApp.UrlQueryParameterSubscription = function UrlQueryParameterSubscription(qParamName, updateFromUrlEvent, updateFromAppEvent, requestBroadcastQueryParameterValueEvent, compressValue) {
        this.qParamName = qParamName;
        this.updateFromUrlEvent = updateFromUrlEvent;
        this.updateFromAppEvent = updateFromAppEvent;
        this.requestBroadcastQueryParameterValueEvent = requestBroadcastQueryParameterValueEvent;
        this.compressValue = compressValue;
        this.toString = function () {
            return "qParamName=" + this.qParamName +
                ", updateFromUrlEvent=" + this.updateFromUrlEvent +
                ", updateFromAppEvent=" + this.updateFromAppEvent +
                ", requestBroadcastQueryParameterValueEvent=" + this.requestBroadcastQueryParameterValueEvent +
                ", compressValue=" + this.compressValue;
        };
    };

    ns.TilskuddApp.controller = {
        urlQueryParameterSubscriptions: [],
        currentQueryString: undefined,
        ///////////////
        // Parse URL //
        ///////////////

        /**
         * Parse query string.
         * ?a=b&c=d to {a: b, c: d}
         * @param {String} (option) queryString
         * @return {Object} query params
         */
        queryStringToObject: function (queryString) {
            if (!queryString) {
                return {};
            }
            return _
                .chain(queryString.split('&'))
                .map(function (params) {
                    var param = params.split('=');
                    return [param[0], decodeURIComponent(param[1])];
                })
                .object()
                .value();
        },

        setQueryStringAndNotifyQueryParameterSubscribers: function (pagePath, queryString) {
            // pagePath and queryString is ignored, the code relies on using Backbone.history.fragment
            var self = this;
            _.each(this.urlQueryParameterSubscriptions, function (qPSubscription) {
                self.notifyQueryParameterSubscribers(qPSubscription);
            });
        },

        notifyQueryParameterSubscribers: function (qPSubscription, requestedBy) {
            var currentFragment = Backbone.history.fragment;
            if (_.isUndefined(currentFragment)) {
                console.warn("No fragment defined, is backbone history started?");
                return;
            }
            var queryString = this.getQueryString(currentFragment);
            var query = this.queryStringToObject(queryString);
            var value = query[qPSubscription.qParamName];
            if (qPSubscription.compressValue && !_.isUndefined(value)) {
                value = ns.CompressionUtils.toUncompressedArray(value);
            }
            Tilskudd.TilskuddApp.vent.trigger(
                qPSubscription.updateFromUrlEvent,
                (_.isUndefined(value)) ? [] : value,
                requestedBy);
        },

        getQueryString: function (fragment) {
            var pathAndQueryString = fragment.split('?');
            if (pathAndQueryString.length === 2) {
                return pathAndQueryString[1];
            }
            return "";
        },

        getPathString: function (fragment) {
            var pathAndQueryString = fragment.split('?');
            return pathAndQueryString[0];
        },

        /////////////////
        // Update URL //
        /////////////////

        updateFragment: function (fragment, qPSubscription, newValue) {
            var pathString = this.getPathString(fragment);
            var queryString = this.getQueryString(fragment);
            var query = this.queryStringToObject(queryString);
            if (newValue !== undefined) {
                query[qPSubscription.qParamName] = newValue;
            } else {
                delete query[qPSubscription.qParamName];
            }
            var updatedQueryString = _
                .chain(query)
                .pairs()
                .reduce(function (mem, qParam) {
                    if (mem !== "") {
                        mem = mem + "&";
                    }
                    return mem + qParam[0] + "=" + encodeURIComponent(qParam[1]);
                }, "")
                .value();
            if (updatedQueryString === "") {
                return pathString;
            } else {
                return pathString + '?' + updatedQueryString;
            }
        },

        updateQueryParamInFragment: function (qPSubscription, value) {
            var currentFragment = Backbone.history.fragment;
            if (currentFragment !== undefined) {
                if (qPSubscription.compressValue && !_.isUndefined(value)) {
                    value = ns.CompressionUtils.toCompressedString(value);
                }
                var updatedFragment = this.updateFragment(currentFragment, qPSubscription, value);
                Backbone.history.navigate(updatedFragment);
            }
        },

        ///////////////
        // Subscribe //
        ///////////////

        assertNoSubscriptionConflict: function (subscription) {
            _.each(this.urlQueryParameterSubscriptions, function (qPSubscription) {
                if (qPSubscription.qParamName === subscription.qParamName ||
                    qPSubscription.updateFromUrlEvent === subscription.updateFromUrlEvent ||
                    qPSubscription.updateFromUrlEvent === subscription.updateFromAppEvent ||
                    qPSubscription.updateFromAppEvent === subscription.updateFromUrlEvent ||
                    qPSubscription.updateFromAppEvent === subscription.updateFromAppEvent) {
                    throw "Cannot add subscription, it conflicts with one already in the list. " +
                        "new: '" + subscription.toString() + "'" +
                        "\t existing: '" + qPSubscription.toString() + "'.";
                }
            });
        },

        assertMandatoryPropertiesExist: function (subscription) {
            if (typeof subscription.qParamName === "undefined" || subscription.qParamName === "") {
                throw "Cannot register a subscription without a property 'qParamName'";
            }
            if (typeof subscription.updateFromUrlEvent === "undefined" || subscription.updateFromUrlEvent === "") {
                throw "Cannot register a subscription without a property 'updateFromUrlEvent'";
            }
            if (typeof subscription.updateFromAppEvent === "undefined" || subscription.updateFromAppEvent === "") {
                throw "Cannot register a subscription without a property 'updateFromAppEvent'";
            }
        },

        addUrlQueryParameter: function (subscription) {
            this.urlQueryParameterSubscriptions.push(subscription);
            this.listenTo(ns.TilskuddApp.vent, subscription.updateFromAppEvent, ns.TilskuddApp.controller.updateQueryParamInFragment);
            this.listenTo(ns.TilskuddApp.vent, subscription.requestBroadcastQueryParameterValueEvent, ns.TilskuddApp.controller.notifyQueryParameterSubscribers);
        },

        /**
         * Registers a new event related to a URL query parameter.
         * This function throws errors if the necessary information is not found in the subscription.
         */
        registerUrlQueryParameterSubscription: function (subscription, allowMultipleSubscription) {
            this.assertMandatoryPropertiesExist(subscription);
            if (_.isUndefined(allowMultipleSubscription) || !allowMultipleSubscription) {
                this.assertNoSubscriptionConflict(subscription);
                this.addUrlQueryParameter(subscription);
            } else {
                if (!_.contains(this.urlQueryParameterSubscriptions, subscription)) {
                    this.addUrlQueryParameter(subscription);
                }
            }
        }
    };
    _.extend(ns.TilskuddApp.controller, Backbone.Events);

    ns.TilskuddApp.tilskuddRouter = new Marionette.AppRouter({
        controller: ns.TilskuddApp.controller,
        appRoutes: {
            "*pagePath(?*queryString)": 'setQueryStringAndNotifyQueryParameterSubscribers'
        }
    });

    _.bindAll(ns.TilskuddApp.controller, "updateFragment", "updateQueryParamInFragment", "notifyQueryParameterSubscribers");

    ns.CompressionUtils = {

        toCompressedString: function (array) {
            return LZString.compressToBase64(JSON.stringify(array));
        },

        toUncompressedArray: function (string) {
            return JSON.parse(LZString.decompressFromBase64(string));
        }
    };

}(Tilskudd));