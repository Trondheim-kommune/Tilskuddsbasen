/*global Backbone, moment, _, $, window, console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var StdTekstRowView = Backbone.Marionette.ItemView.extend({
        tagName: "tr",
        template: "#view_standardtekst_row_template",

        bindings: {
            "#id_navn" : "navn",
            "#id_type" : "type",
            "#id_tekst" : "tekst"
        },

        events: {
            'click': 'row_clicked',
            'enter': 'row_clicked'
        },

        row_clicked: function () {
            if (this.model !== undefined) {
                window.location.href = "/admin/standardtekst/" + this.model.id + "/edit/";
            }
        },

        onShow: function () {
            this.stickit();
        },
        initialize: function() {
        	$("body").on("keypress","#list_standardtekst td",function(e){
    			if(e.keyCode == 13){
			      $(this).trigger('enter');
			   }
			});
        }
    });

    ns.StandardTekstListView = ns.BaseContentEditView.extend({
        template: "#view_standardtekster_template",
        childView: StdTekstRowView,
        childViewContainer: "#list_standardtekst"
    });

}(Tilskudd));