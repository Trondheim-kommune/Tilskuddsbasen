/*global Backbone, moment, _, $, window */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var ArrangementRowView = Backbone.Marionette.ItemView.extend({
        template: "#arrangement_template",
        ui: {
            dato_bestemt_checkbox: ".dato_bestemt_checkbox",
            tidspunkt_div: ".tidspunkt_div",
            dato_div: ".dato_div",
            start_dato: "#id_start_dato",
            slutt_dato: "#id_slutt_dato"
        },
        bindings: {
            "#id_sted": "sted",
            "#id_tidspunkt": "tidspunkt",
            "#id_start_dato": 'start_dato',
            "#id_slutt_dato": 'slutt_dato'
        },
        events: {
            'click .dato_bestemt_checkbox': function () {
                var isChecked = this.ui.dato_bestemt_checkbox.prop("checked");
                this.toggleDatoBestemt(isChecked);
            },
            'click .remove_arrangement': 'removeArrangement',
            'changeDate @ui.start_dato': 'startDatoEndret',
            'changeDate @ui.slutt_dato': 'sluttDatoEndret'
        },

        startDatoEndret: function () {
            var start = moment(this.ui.start_dato.val(), "DD.MM.YYYY");
            var slutt = moment(this.ui.slutt_dato.val(), "DD.MM.YYYY");

            if (start.get('year') < 1900) {
                this.clearError("start_dato");
                this.addError("Startdato kan ikke være før 1900", "start_dato");
            } else {
                this.clearError("start_dato");
            }

            if (_.isNull(slutt) || (start.diff(slutt, 'days') > 0)) {
                this.ui.slutt_dato.datepicker('update', new Date(start));
            }
        },

        sluttDatoEndret: function () {
            var start = moment(this.ui.start_dato.val(), "DD.MM.YYYY");
            var slutt = moment(this.ui.slutt_dato.val(), "DD.MM.YYYY");

            if (slutt.get('year') < 1900) {
                this.clearError("slutt_dato");
                this.addError("Sluttdato kan ikke være før 1900", "slutt_dato");
            } else {
                this.clearError("slutt_dato");
            }


            if (_.isNull(start) || (start.diff(slutt, 'days') > 0)) {
                this.ui.start_dato.datepicker('update', new Date(slutt));
            }
        },

        toggleDatoBestemt: function (isDatoBestemt) {
            if (isDatoBestemt) {
                this.ui.tidspunkt_div.addClass("hidden");
                this.ui.dato_div.removeClass("hidden");
                this.model.set("tidspunkt",null);
            } else {
                this.ui.tidspunkt_div.removeClass("hidden");
                this.ui.dato_div.addClass("hidden");
                this.ui.start_dato.datepicker('update', null);
                this.ui.slutt_dato.datepicker('update', null);
            }
        },

        onRender: function () {
            var isDatoBestemt = (this.model.get("tidspunkt") === null || this.model.get("tidspunkt") === "");
            this.ui.dato_bestemt_checkbox.prop("checked", isDatoBestemt);
            this.toggleDatoBestemt(isDatoBestemt);

            Backbone.Stickit.addHandler({
                selector: '.datepicker',
                onGet: function (value, options) {
                    return ns.formatDato(value);
                },
                onSet: function (value, options) {
                    return ns.formatDateNoToIso(value);
                }
            });

            this.stickit();

            this.$el.find('.datepicker').datepicker({
                format: "dd.mm.yyyy",
                weekStart: 1
            });
        },

        removeArrangement: function () {
            this.model.collection.remove(this.model);
        },

        showErrors: function (error) {
            _.each(error, this.addError, this);
        },
        addError: function (error, key) {
            var elem;
            if (this.options.parent) {
                elem = this.options.parent;
            } else {
                elem = this.$('#id_' + key).parent('div');
            }
            elem.addClass("has-error");
            elem.append("<span class='control-label help-inline text-error'>" + error + "</span>");
        },
        clearError : function(key) {
            var elem;
            if (this.options.parent) {
                elem = this.options.parent;
            } else {
                elem = this.$('#id_' + key).parent('div');
            }
            elem.removeClass("has-error");
            elem.children(".text-error").remove();
        }
    });

    ns.BaseArrangementView = ns.BaseContentEditView.extend({
        childView: ArrangementRowView,
        childViewContainer: "#id_arrangement",
        initialize: function () {
            if (this.collection.length < 1) {
                this.addArrangement();
            }
        },

        additionalUpdateModel: function () {
            this.model.set({
                arrangement: this.collection.toJSON()
            });
        },

        addObjError: function (error, key) {
            if (key === 'arrangement') {
                _.each(error, function (error, key) {
                    var view = this.children.findByIndex(key);
                    view.showErrors(error);
                }, this);
            } else {
                _.each(error, function (error, key) {
                    this.addError(error, key);
                }, this);
            }
        },

        events: function () {
            // OBS: husk at første parameter er destination, bruk derfor {} for å unngå endringer i eksisterende eventlist
            return _.extend({}, this.constructor.__super__.constructor.__super__.events, {'click #add_arrangement': 'addArrangement'});
        },

        addArrangement: function (e) {
            if (!_.isUndefined(e)) {
                e.preventDefault();
            }
            this.collection.add(new Backbone.Model({'sted': '', 'start_dato': '', 'slutt_dato': '', 'tidspunkt': ''}));
        }
    });


}(Tilskudd));
