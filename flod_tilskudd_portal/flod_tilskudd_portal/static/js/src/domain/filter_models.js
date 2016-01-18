/*global Backbone, _*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";


    ns.FacetModel = Backbone.Model.extend({
        urlRoot: '/tilskudd/api/v1/filters/soknader',

        addFacetProperties: function () {
            var self = this;
            var values = self.get('values');
            _.each(values, function (facetValue) {
                facetValue.facetId = self.get('facetId');
            });
            _.each(values, function (facetValue) {
                facetValue.facetName = self.get('facetName');
            });
        },

        addValueIdProperty: function () {
            var self = this;
            var values = self.get('values');
            var ctx = 0;
            _.each(values, function (facetValue) {
                facetValue.valueId = ctx++;
            });
        },

        initialize: function () {
            this.set('values', this.get('values'));
            this.set('selection', undefined);
            this.addFacetProperties();
            this.addValueIdProperty();
        }

    });

    ns.FacetCollection = Backbone.Collection.extend({
        model: ns.FacetModel,
        url: '/tilskudd/api/v1/filters/soknader',


        addFacetIdPropertyToAll: function () {
            var ctx = 0;
            this.each(function (facet) {
                facet.attributes.facetId = ctx++;
                facet.addFacetProperties();
            });
        },

        initialize: function () {
            this.listenTo(this, "reset", this.addFacetIdPropertyToAll, this);
        }
    });

}(Tilskudd));
