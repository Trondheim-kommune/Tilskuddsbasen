/*global _, Backbone, $, window, console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {

    "use strict";
    ns.SaksbehandlerSoknadItemTableView = Backbone.Marionette.ItemView.extend({
        tagName: "tr",
        template: "#saksbehandler_soknadsliste_tablerow_template",
        events: {
            'click .merknad_info': 'merknad_field_clicked',
            'click .row_clicked': 'row_clicked',
            'enter .row_clicked': 'row_clicked'
        },
        bindings: {
            ".merknad_info": {
                attributes: [
                    {
                        name: 'class',
                        onGet: function () {
                            var vedtak = this.model.getSisteVedtak();
                            if (_.isUndefined(vedtak) || _.isEmpty(vedtak.intern_merknad)) {
                                return "hidden";
                            }
                        }
                    }
                ]
            },

            ".id_intern_merknad": {
                observe: "vedtak",
                onGet: function (value) {
                    var vedtak = this.model.getSisteVedtak();
                    if (!_.isUndefined(vedtak)) {
                        return vedtak.intern_merknad;
                    }
                }

            },
            "#id_innstilt_belop": {
                observe: "vedtak",
                onGet: function (value) {
                    var vedtak = this.model.getSisteVedtak();
                    if (!_.isUndefined(vedtak)) {
                        return vedtak.innstilt_belop;
                    }
                },
                onSet: function (value) {
                    var vedtak = this.model.getSisteVedtak();
                    if (_.isUndefined(vedtak)) {
                        vedtak = {'innstilt_belop': value};
                        this.model.set('vedtak', [vedtak]);
                    } else {
                        vedtak.innstilt_belop = value;
                    }
                    return this.model.get("vedtak");
                },
                attributes: [
                    {
                        name: 'disabled',
                        onGet: function () {
                            return this.options.mode !== "saksbehandler" || this.model.get('status') !== 'Under behandling';

                        }
                    },
                    {
                        name: 'readonly',
                        onGet: function () {
                            return this.options.mode !== "saksbehandler" || this.model.get('status') !== 'Under behandling';

                        }
                    }
                ]
            },
            "#id_vedtatt_belop": {
                observe: "vedtak",
                onGet: function (value) {
                    var vedtak = this.model.getSisteVedtak();
                    if (!_.isUndefined(vedtak)) {
                        return vedtak.vedtatt_belop;
                    }
                },
                onSet: function (value) {
                    var vedtak = this.model.getSisteVedtak();
                    if (!_.isUndefined(vedtak)) {
                        vedtak.vedtatt_belop = value;
                    }
                    return this.model.get("vedtak");
                },
                attributes: [
                    {
                        name: 'disabled',
                        onGet: function () {
                            return this.options.mode !== "godkjenner" || this.model.get('status') !== 'Til vedtak';

                        }
                    },
                    {
                        name: 'readonly',
                        onGet: function () {
                            return this.options.mode !== "godkjenner" || this.model.get('status') !== 'Til vedtak';

                        }
                    }
                ]
            }
        },
        row_clicked: function () {
            if (this.model !== undefined) {
                window.location.href = "/soknad/" + this.model.id;
            }
        },

        merknad_field_clicked: function (event) {
            var text = $(event.target).siblings().text();
            $('#merknad_modal .modal-body').text(text);
            $('#merknad_modal').modal('show');
        },

        onRender: function () {
            this.stickit();
        },

        saveVedtak: function (action_id, saveOnly) {
            this.clearValidationAlerts();

            var action;
            action = undefined;
            var vedtak = this.model.getSisteVedtak();
            if (!_.isUndefined(vedtak)) {
                if (this.options.mode === 'saksbehandler') {
                    if (this.model.get('status') === 'Under behandling') {
                        action = new ns.SoknadActionModel({'id': action_id, 'soknad_id': this.model.id, 'saveOnly': true});
                        action.set('vedtak_id', vedtak.id);
                        action.set('innstilt_belop', vedtak.innstilt_belop);
                    }
                } else if (this.options.mode === 'godkjenner') {
                    if (this.model.get('status') === 'Til vedtak') {
                        action = new ns.SoknadActionModel({'id': action_id, 'soknad_id': this.model.id, 'saveOnly': saveOnly});
                        action.set('vedtak_id', vedtak.id);
                        action.set('vedtatt_belop', vedtak.vedtatt_belop);
                    }
                }

                if (!_.isUndefined(action) && action.isValid()) {
                    var el = $("<div id='saveSpinner'>Lagrer</div>").addClass("searching");
                    this.$("#id_vedtatt_belop").after(el);

                    var self = this;
                    action.save(null, {
                        success: function (model, response, options) {
                            self.saveSuccess();
                        },
                        error: function (model, response, options) {
                            ns.TilskuddApp.vent.trigger("message:error",
                                {
                                    'message': 'Det oppstod en feil ved lagring. Se skjema for evnt. detaljer.'
                                }
                            );
                            self.saveFailed(model, response, options);
                        }
                    });
                }
            }
        },

        clearValidationAlerts: function () {
            this.$el.removeClass("has-error control-group");
            this.$el.find('div, td').removeClass("has-error control-group");
            this.$el.find('span.help-inline, span.control-label').remove();
        },

        saveSuccess: function () {
            //this.$("#next_button").show();
            this.$("#saveSpinner").remove();
            var self = this;
            this.model.fetch({
                'success': function () {
                    self.render();
                },
                'error': function () {
                    ns.TilskuddApp.vent.trigger("message:error",
                        {
                            'message': 'Det oppstod en feil ved lasting av søknad. Prøv igjen senere.'
                        }
                    );
                }
            });
        },

        saveFailed: function (model, response, options) {
            ns.TilskuddApp.vent.trigger("message:error",
                {
                    'message': 'Det oppstod en feil ved lagring av skjema. Prøv igjen senere.'
                }
            );

            this.$("#saveSpinner").remove();
            this.model.validationError = JSON.parse(response.responseText).__error__;
            this.showErrors();
        },
        showErrors: function () {
            _.each(this.model.validationError, this.addError, this);
        },
        addObjError: function (error, key) {
            _.each(error, function (error, key) {
                this.addError(error, key);
            }, this);
        },
        addError: function (error, key) {
            if (_.isObject(error)) {
                this.addObjError(error, key);
            } else {
                var elem;
                if (this.options.parent) {
                    elem = this.options.parent;
                } else {
                    elem = this.$('#id_' + key).parent('td');
                }
                if (elem.length === 0) {
                    elem = this.$el;
                }
                elem.addClass("has-error control-group");
                elem.append("<span class='help-inline text-error control-label'>" + error + "</span>");
            }
        },
        initialize: function () {
            $("body").on("keypress", "#list_soknader td", function (e) {
                if (e.keyCode == 13) {
                    $(this).trigger('enter');
                }
            });
        }

    });

    ns.SaksbehandlerSoknadTableView = Backbone.Marionette.CompositeView.extend({
        template: "#saksbehandler_soknadsliste_table_template",
        childView: ns.SaksbehandlerSoknadItemTableView,
        childViewContainer: "#list_soknader",
        bindings: {
            "#id_sum_omsokt_belop": {
                observe: "collection",
                onGet: function (field, option) {
                    return field.sumOmsokt();
                },
                updateView: true
            },
            "#id_sum_innstilt_belop": {
                observe: "collection",
                onGet: function (field, option) {
                    return field.sumInnstilt();
                },
                updateView: true
            },
            "#id_sum_vedtatt_belop": {
                observe: "collection",
                onGet: function (field, option) {
                    return field.sumVedtatt();
                },
                updateView: true
            },
            ".lagre_innstilling_button": {
                attributes: [
                    {
                        name: 'class',
                        observe: "collection",
                        onGet: function (collection) {
                            return (collection.length === 0 || this.options.mode !== "saksbehandler") ? 'hidden' : '';

                        }
                    }
                ]
            },
            ".lagre_vedtak_button": {
                attributes: [
                    {
                        name: 'class',
                        observe: "collection",
                        onGet: function (collection) {
                            return (collection.length === 0 || this.options.mode !== "godkjenner") ? 'hidden' : '';

                        }
                    }
                ]
            },
            ".godkjenn_vedtak_button": {
                attributes: [
                    {
                        name: 'class',
                        observe: "collection",
                        onGet: function (collection) {
                            return (collection.length === 0 || this.options.mode !== "godkjenner") ? 'hidden' : '';

                        }
                    }
                ]
            },
            ".tilbake_til_innstilling_button": {
                attributes: [
                    {
                        name: 'class',
                        observe: "collection",
                        onGet: function (collection) {
                            return (collection.length === 0 || this.options.mode !== "godkjenner") ? 'hidden' : '';

                        }
                    }
                ]
            },
            ".export_button": {
                attributes: [
                    {
                        name: 'class',
                        observe: "collection",
                        onGet: function (collection) {
                            return (collection.length === 0) ? 'hidden' : '';

                        }
                    }
                ]
            }

        },
        events: {
            "change #id_innstilt_belop": function () {
                this.model.trigger("change:collection", this.model);
            },
            "change #id_vedtatt_belop": function () {
                this.model.trigger("change:collection", this.model);
            },
            'click .lagre_innstilling_button': function (e) {
                e.preventDefault();
                ns.TilskuddApp.vent.trigger("message:clear");
                this.saveVedtak('til_vedtak', true);
            },
            'click .lagre_vedtak_button': function (e) {
                e.preventDefault();
                ns.TilskuddApp.vent.trigger("message:clear");
                this.saveVedtak('fatt_vedtak', true);
            },
            'click .godkjenn_vedtak_button': function (e) {
                e.preventDefault();
                ns.TilskuddApp.vent.trigger("message:clear");
                this.saveVedtak('fatt_vedtak', false);
            },
            'click .tilbake_til_innstilling_button': function (e) {
                e.preventDefault();
                ns.TilskuddApp.vent.trigger("message:clear");
                this.saveVedtak('tilbake_til_innstilling', false);
            },
            'click .export_button': 'exportdata'
        },

        exportdata: function (e) {
            e.preventDefault();
            var url = '/api/sak/v1/export/soknader?';
            var ids = "";
            this.collection.each(function (model) {
                ids += (ids.length > 0 ? "&" : "") + 'id=' + model.id;
            });
            window.open(url + ids, '_blank');
        },

        saveVedtak: function (action_id, saveOnly) {
            this.children.forEach(function (child) {
                child.saveVedtak(action_id, saveOnly);
            });
        },

        onRender: function () {
            this.stickit();
            this.addBinding(this.tilskuddsordning, "#id_tilskuddsordning", {
                attributes: [
                    {
                        name: 'class',
                        observe: "id",
                        onGet: function (value) {
                            return value ? '' : 'hidden';
                        }
                    }
                ]
            });
            this.addBinding(this.tilskuddsordning, "#id_tilskuddsordning_navn", "navn");
            this.addBinding(this.tilskuddsordning, "#id_tilskuddsordning_budsjett", "budsjett");
            this.addBinding(this.tilskuddsordning, "#id_tilskuddsordning_vedtatt_belop", "vedtatt_belop");
            this.addBinding(this.tilskuddsordning, "#id_tilskuddsordning_gjenstoende_belop", {
                observe: ['budsjett', 'vedtatt_belop'], onGet: function (values) {
                    return values[0] - values[1];
                }
            });

        },

        initialize: function () {
            this.tilskuddsordning = new ns.TilskuddsordningModel();
            this.childViewOptions = {'mode': this.options.mode};
            _.bindAll(this, "updateCollection", "updateTilskuddsordning");

            ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(ns.FilterSubscription);
            this.listenTo(ns.TilskuddApp.vent, ns.FilterSubscription.updateFromUrlEvent, this.updateCollection);
            this.listenTo(ns.TilskuddApp.vent, ns.FilterUtils.getFilterChangedEvent(), this.updateCollection);
            this.listenTo(ns.TilskuddApp.vent, ns.FilterSubscription.updateFromUrlEvent, this.updateTilskuddsordning);
            this.listenTo(ns.TilskuddApp.vent, ns.FilterUtils.getFilterChangedEvent(), this.updateTilskuddsordning);
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
                    // Comment: A bit weird to trigger latestcookiefilters from here...should have been
                    // done in application controller?
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
        },

        updateTilskuddsordning: function (urlFilters, requestedBy) {
            // When clicking back to list of soknader, this is triggered before queryParam set
            // therefore we have to check the cookie for filters.
            if (_.isUndefined(requestedBy) || _.isEqual(requestedBy, this)) {
                var filters = null;
                var latestFilters = ns.FilterUtils.getLatestFiltersCookie();
                latestFilters = (latestFilters && latestFilters.length > 0) ? latestFilters : undefined;
                if (urlFilters && urlFilters.length > 0) {
                    console.log("Update tilskuddordninger based on information in URL: " + JSON.stringify(urlFilters));
                    filters = urlFilters;
                } else if (!_.isUndefined(latestFilters)) {
                    filters = latestFilters;
                    console.log("Update tilskuddsordninger based on latest cookie filters: " + JSON.stringify(latestFilters));
                } else {
                    filters = [];
                }

                var tilskuddFacet = _.findWhere(filters, {'facetName': 'Tilskuddsordning'});
                if (!_.isUndefined(tilskuddFacet) && tilskuddFacet.values.length === 1) {
                    this.tilskuddsordning.set({'id': tilskuddFacet.values[0].queryValueName});
                    this.tilskuddsordning.fetch();
                } else {
                    this.tilskuddsordning.clear();
                }
            }
        }
    });

}(Tilskudd));