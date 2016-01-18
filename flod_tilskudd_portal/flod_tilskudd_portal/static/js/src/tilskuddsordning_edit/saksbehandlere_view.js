/*global Backbone, moment, _, $, window, console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var TilskuddSaksbehandlerItemTableView = Backbone.Marionette.ItemView.extend({
        tagName: "tr",
        template: "#saksbehandler_tablerow_template",
        events: {
            "click .remove-btn": "removeSaksbehandler"
        },
        bindings: {
            "#id_navn": {
                observe: 'profile',
                onGet: function (value) {
                    return value.full_name;
                }
            }
        },

        onRender: function () {
            this.stickit();
        },

        removeSaksbehandler: function () {
            this.model.collection.remove(this.model);
        }
    });

    ns.TilskuddsordnSaksbehandlereView = ns.BaseContentEditView.extend({
        template: "#tilskuddsordning_saksbehandlere_view_template",
        childView: TilskuddSaksbehandlerItemTableView,
        childViewContainer: "#list_saksbehandlere",
        godkjennere: new ns.GodkjennerCollection(),
        saksbehandlere: new ns.SaksbehandlerCollection(),

        events: function () {
            return _.extend({}, ns.BaseContentEditView.prototype.events, {
                "click .add-person-btn": "addSaksbehandler"
            });
        },

        initialize: function () {
            this.listenTo(this, "remove:child", this.toggleTableVisibility);
            var self = this;
            this.toggleTableVisibility();
            this.saksbehandlere.fetch({
                'success': function () {
                    // Bindings are not automatically updated when the collection is, we have to take care of it
                    self.model.trigger('change:id_saksbehandler', self.model);
                },
                'error': function () {
                    ns.TilskuddApp.vent.trigger("message:error",
                        {
                            'message': 'Det oppstod en feil ved henting av saksbehandlere.'
                        }
                    );
                }
            });

            this.godkjennere.fetch({
                'success': function () {
                    // Bindings are not automatically updated when the collection is, we have to take care of it
                    self.model.trigger('change:godkjenner_id', self.model);
                },
                'error': function () {
                    ns.TilskuddApp.vent.trigger("message:error",
                        {
                            'message': 'Det oppstod en feil ved henting av godkjennere.'
                        }
                    );
                }
            });

            self.bindings = {
                'select#id_godkjenner': {
                    observe: 'godkjenner_id',
                    selectOptions: {
                        collection: self.godkjennere,
                        labelPath: 'profile.full_name',
                        valuePath: 'id',
                        defaultOption: {
                            label: 'Ikke satt',
                            value: ''
                        }
                    }
                },
                'select#id_saksbehandler': {
                    observe: 'id_saksbehandler',
                    selectOptions: {
                        collection: self.saksbehandlere,
                        labelPath: 'profile.full_name',
                        valuePath: 'id',
                        defaultOption: {
                            label: 'Velg saksbehandler...',
                            value: ''
                        }
                    }
                },
                '#id_tittel': "godkjenner_tittel"
            };
        },

        addSaksbehandler: function () {
            var selected = this.$("#id_saksbehandler").val();
            if (selected) {
                var saksbehandler = this.saksbehandlere.where({id: selected});

                if (saksbehandler.length > 0) {
                    this.collection.add(new Backbone.Model({
                        'profile': saksbehandler[0].get("profile"),
                        'id': saksbehandler[0].get("id")
                    }));
                    this.toggleTableVisibility();
                }
            }
        },

        toggleTableVisibility: function () {
            if (this.collection.length > 0) {
                $("#id_table_saksbehandlere").show();
            } else {
                $("#id_table_saksbehandlere").hide();
            }
        },

        saveModel: function (saveSuccessCallback) {
            var mapped_values = this.collection.map(function (model) {
                return { "saksbehandler_id": model.get('id')};
            });
            this.model.set({"saksbehandlere": mapped_values});
            ns.BaseContentEditView.prototype.saveModel.call(this, saveSuccessCallback);
        }

    });

}(Tilskudd));