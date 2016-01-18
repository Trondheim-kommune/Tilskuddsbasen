/*global console, _, window, $, Backbone */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.NySaksvedleggActionView = ns.VedleggFilView.extend({
        template: "#ny_saksvedlegg_action_template",
        childView: null,
        bindings: {
            "#id_filnavn": "filnavn",
            "#id_tittel": "tittel"
        },

        events: {
            'change #id_upload': 'velgFil',
            'click #ok_action' : 'saveFile',
            'click #cancel_action' : 'cancel'
        },

        cancel: function (e) {
            e.preventDefault();
            this.trigger("cancel", this);
        },

        attachHtml: function (collectionView, childView) {
            //
        },

        createNewFile: function () {
            var fil = new Backbone.Model();
            fil.urlRoot = '/api/sak/v1/soknad/' + this.model.id + '/saksvedlegg/';
            fil.error = this.error;
            fil.success = this.success;

            return fil;
        },

        velgFil: function () {
            var filename = $('input#id_upload')[0].value.split(/(\\|\/)/g).pop();
            this.model.set("filnavn", filename);
            this.clearValidationAlerts();
            ns.TilskuddApp.vent.trigger("message:clear");
        },

        saveSuccessAction: function () {
            window.location.href = '/soknad/' + this.model.id + '/?menu=Saksvedlegg';
        },

        setupBrowseButton: function() {
            var checkExist = setInterval(function() {
                if ($('#id_upload').length) {
                    $("#id_upload").filestyle({buttonText: "Velg fil", input: false, iconName: "glyphicon-inbox"});
                    clearInterval(checkExist);
                }
            }, 10); // check every 10ms
        },

        saveFile: function(event){
            if (typeof event !== 'undefined') {
                event.preventDefault();
            }
            if (this.$('input').get(0).value !== '') {

                this.$el.find('div').removeClass("has-error control-group");
                this.$el.find('div span.help-inline, td span.help-inline, td span.control-label').remove();

                var data;
                data = {'soknad_id': this.model.get("id"), 'tittel': this.model.get("tittel"),
                    'saksbehandler_id': window.loggedInUser.get('id')};

                var fil = this.createNewFile();
                ns.TilskuddApp.vent.trigger("message:clear");
                var filename = $('input#id_upload')[0].value.split(/(\\|\/)/g).pop();
                this.showSpinner(filename);
                var self = this;
                $.ajax(fil.urlRoot, {
                    files: self.$('#id_upload')[0],
                    processData: false,
                    iframe: true,
                    dataType: 'json',
                    data: data
                })
                    .done(function (data, textStatus, jqXHR) {
                        self.fileSaved(data, textStatus, jqXHR, filename);
                        self.hideSpinner();
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        self.fileNotSaved(jqXHR, textStatus, errorThrown, filename);
                        self.hideSpinner();
                    });
            }
        }
    });

})(Tilskudd);