/*global Backbone, moment, _, $, window, console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var TilskuddsordRowView = Backbone.Marionette.ItemView.extend({
        tagName: "tr",
        template: "#soknadsliste_row_template",

        bindings: {
            "#id_navn": "navn",
            "#id_soknadsfrist": {
                observe: 'soknadsfrist',
                onGet: function (value) {
                    if (value !== undefined && value !== null) {
                        return ns.formatDato(value);

                    } else {
                        return "";
                    }
                }
            },
            "#id_budsjett": "budsjett",
            "#id_type": "type"
        },

        events: {
            'click': 'row_clicked',
            'enter': 'row_clicked'
        },

        row_clicked: function () {
            if (this.model !== undefined) {
                window.location.href = "/admin/tilskuddsordning/" + this.model.id + "/edit/";
            }
        },

        onShow: function () {
            this.stickit();
        },
        initialize: function() {
        	$("body").on("keypress","#list_soknader td",function(e){
    			if(e.keyCode == 13){
			      $(this).trigger('enter');
			   }
			});
        }
    });

    ns.TilskuddsordningerListView = ns.BaseContentEditView.extend({
        template: "#soknadsliste_template",
        childView: TilskuddsordRowView,
        childViewContainer: "#list_soknader",

        initialize: function () {

            this.collection.comparator = function (m) {
                return -new Date(m.get('soknadsfrist')).getTime();
            };

            this.collection.sort();

        }

    });

    ns.ViewAdminTitleView = Backbone.Marionette.ItemView.extend({
        template: "#view_admin_title_template"
    });

}(Tilskudd));