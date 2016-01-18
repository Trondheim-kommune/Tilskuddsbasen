/*global Backbone, moment, _, $, window, console */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var OrganisasjonItemTableView = Backbone.Marionette.ItemView.extend({
        tagName: "tr",
        template: "#organisasjoner_tablerow_template",
        bindings: {
            "#id_navn": "name",
            "#id_orgnummer": "org_number"
            /*"#id_medlemskap": "role",
             "#id_sistoppdatert": "oppdatert"*/
        },
        events: {
            'click': 'row_clicked',
            'enter': 'row_clicked'
        },
        row_clicked: function () {
            if (this.model !== undefined) {
                window.open(this.options.aktor_url + '/login?next=/organisations/' + this.model.id, '_blank');
            }
        },
        onShow: function () {
            if (this.model !== undefined) {
                this.stickit();
            }
        },
        initialize: function() {
        	$("body").on("keypress","#list_organisasjoner td",function(e){
    			if(e.keyCode === 13){
			      $(this).trigger('enter');
			   }
			});
        }
    });


    ns.OrganisasjonFormView = ns.BaseContentEditView.extend({
        template: "#organisasjon_list_action_template",
        childView: OrganisasjonItemTableView,
        childViewContainer: "#list_organisasjoner",
        childViewOptions: function() {
            return {'aktor_url': this.options.aktor_url};
        }
    });

}(Tilskudd));