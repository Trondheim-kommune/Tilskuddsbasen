/*global Backbone, moment, _, $, window */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.BaseOkonomipostRowView = Backbone.Marionette.ItemView.extend({
        tagName: "tr",
        events: {
            'click .remove_budsjettpost': 'removeBudsjettpost',
            'change .belop': 'belopchanged'
        },

        belopchanged: function () {
            this.trigger("belopchanged");
        },
        onRender: function () {
            this.stickit();
        },
        removeBudsjettpost: function () {
            this.model.collection.remove(this.model);
        },
        showErrors: function (error) {
            _.each(error, this.addError, this);
        },
        addError: function (error, key) {
            if (_.isObject(error)) {
                if (key === 'okonomibelop') {
                    _.each(error, function (error, key) {
                        this.showErrors(error);
                    }, this);
                }
            }
            var elem;
            if (this.options.parent) {
                elem = this.options.parent;
            } else {
                elem = this.$('#id_' + key).parent('td');
            }
            elem.addClass("has-error control-group");
            elem.append("<span class='control-label help-inline text-error'>" + error + "</span>");
        }
    });

    ns.BaseOkonomipostView = ns.BaseContentEditView.extend({

        onRender: function () {
            this.stickit();
            this.calculateSums();
        },

        initialize: function () {
            this.listenTo(this, "childview:belopchanged", this.calculateSums);
            this.listenTo(this.collection, "remove", this.calculateSums);
        },

        attachHtml: function (collectionView, childView) {
            if (childView.model.get("okonomipost_type") === 'Utgift') {
                collectionView.$("#id_utgift").append(childView.el);
            } else if (childView.model.get("okonomipost_type") === 'Inntekt') {
                if (childView.model.get("okonomipost_kategori") === "Annet") {
                    collectionView.$("#id_andre_inntekter").append(childView.el);
                } else if (childView.model.get("okonomipost_kategori") === "Tilskudd") {
                    collectionView.$("#id_andre_tilskudd").append(childView.el);
                }
            }
        },

        addOkonomipost: function () {
            throw "Override addOkonomipost!";
        },

        events: function () {
            // OBS: husk at første parameter er destination, bruk derfor {} for å unngå endringer i eksisterende eventlist
            return _.extend({}, this.constructor.__super__.constructor.__super__.events,
                {'click #add_utgift': function () {
                    this.addOkonomipost('Utgift', 'Annet');
                },
                    'click #add_andre_tilskudd': function () {
                        this.addOkonomipost('Inntekt', 'Tilskudd');
                    },
                    'click #add_andre_inntekter': function () {
                        this.addOkonomipost('Inntekt', 'Annet');
                    },
                    'change #id_omsokt_belop': this.calculateSums});
        },

        additionalUpdateModel: function () {
            var list = _.filter(this.collection.models, function (item) {
                item.set("okonomibelop", _.reject(item.get("okonomibelop"), function (el) {
                    return el.belop === "" || el.belop === undefined;
                }));
                return (item.get("navn") === "" && item.get("okonomibelop").length === 0);
            });
            _.each(list, function (item) {
                this.collection.remove(item);
            }, this);

            this.model.set({
                'okonomipost': this.collection.toJSON()
            });
        },

        addObjError: function (error, key) {
            if (key === 'okonomipost') {
                _.each(error, function (error, key) {
                    var view = this.children.findByIndex(key);
                    view.showErrors(error);
                }, this);
            } else {
                _.each(error, function (error, key) {
                    this.addError(error, key);
                }, this);
            }
        }
    });


}(Tilskudd));
