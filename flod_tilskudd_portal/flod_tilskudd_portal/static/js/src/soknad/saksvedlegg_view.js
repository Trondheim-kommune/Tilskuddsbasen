/*global Backbone, window, console, _ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var SaksvedleggRowView = Backbone.Marionette.ItemView.extend({
        template: "#saksvedlegg_row_template",
        tagName: "div",

        bindings: {
            "#id_filnavn": "filnavn",
            "#id_beskrivelse": "beskrivelse",
            "#id_vedlagtdato": "vedlagtdato"
        },

        events: {
            'click #id_filelink': 'openFile'
        },

        openFile: function(){
            window.location.href = "/api/sak/v1/soknad/" + this.model.get("soknad_id") + "/saksvedlegg/" + this.model.id;
        },

        onShow: function () {
            this.stickit();
        }

    });

    ns.SaksvedleggView = ns.BaseContentEditView.extend({
        template: "#soknad_view_saksvedlegg_template",
        childView: SaksvedleggRowView,
        childViewContainer: "#id_saksvedlegg_list",

        // soknad id settes ved hjelp av onBeforeAddChild istedet for det vanlige childViewOptions fordi det
        // ser ikke ut til å være mulig å hende this.model.get("id") i en childViewOptions
        onBeforeAddChild: function(childView){
            childView.model.set("soknad_id", this.model.get("id"));
        }
    });

}(Tilskudd));