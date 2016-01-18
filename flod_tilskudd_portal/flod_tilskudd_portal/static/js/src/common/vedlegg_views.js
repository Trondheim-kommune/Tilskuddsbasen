/*global Backbone, _, $, console, window */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.VedleggLayout = Backbone.Marionette.LayoutView.extend({
        template: "#vedlegg_template",
        regions: {
            nedlastedefiler: "#nedlastedefiler",
            vedlagtelinker: "#vedlagtelinker",
            navigering: "#navigering"
        },

        initialize: function (options) {
            this.model.set('parentObject', options.parentObject);
        },

        onRender: function () {
            var vedleggLinkView = new ns.VedleggLinkView({
                model: this.options.model,
                collection: new Backbone.Collection(this.options.model.get("vedlagtlink"))
            });

            var vedleggFilView = new ns.VedleggFilView({
                model: this.options.model,
                collection: new ns.FilVedleggCollection(this.options.model.get("vedlegg"))
            });

            var navigeringView = new ns.NavigeringView({
                model: this.options.model,
                LinkView: vedleggLinkView,
                FilView: vedleggFilView
            });

            this.nedlastedefiler.show(vedleggFilView);
            this.vedlagtelinker.show(vedleggLinkView);
            this.navigering.show(navigeringView);

            this.listenTo(navigeringView, "nextClicked", function () {
                this.trigger("nextClicked", this);
            });
            this.listenTo(navigeringView, "previousClicked", function () {
                this.trigger("previousClicked", this);
            });
            this.listenTo(navigeringView, "cancel", function () {
                this.trigger("cancel", this);
            });
        }
    });

    ns.NavigeringView = ns.BaseContentEditView.extend({
        template: "#navigering_template",
        filview: null,
        linkview: null,

        initialize: function (options) {
            this.filview = options.FilView;
            this.linkview = options.LinkView;
        },
        additionalUpdateModel: function () {
            this.linkview.additionalUpdateModel();
            this.model.set({
                'vedlagtlink': this.linkview.collection.toJSON(),
                'vedlegg': this.filview.collection.toJSON()
            });
        },
        addObjError: function (error, key) {
            ns.TilskuddApp.vent.trigger("message:error",
                {
                    'message': 'Det oppstod en feil ved lasting av vedlegg. Se skjema for detaljert beskrivelse.'
                }
            );
            if (key === 'vedlegg') {
                _.each(error, function (error, key) {
                    var view = this.filview.children.findByIndex(key);
                    view.showErrors(error);
                }, this);
            } else if (key === 'vedlagtlink') {
                _.each(error, function (error, key) {
                    var view = this.linkview.children.findByIndex(key);
                    view.showErrors(error);
                }, this);
            } else {
                _.each(error, function (error, key) {
                    this.addError(error, key);
                }, this);
            }
        },

        clearValidationAlerts: function () {
            // inline messages related to form data
            this.$el.find('div, td').removeClass("has-error control-group");
            this.$el.find('div span.help-inline').remove();
            this.linkview.clearValidationAlerts();
            this.filview.clearValidationAlerts();
        }
    });

    var VedleggLinkRowView = Backbone.Marionette.ItemView.extend({
        template: "#vedlagt_link_row_template",
        tagName: "tr",
        events: {
            'click .remove_vedlagtlink': 'removeVedlagtLink'
        },

        bindings: {
            "#id_nettadresse": "navn",
            "#id_beskrivelse": "beskrivelse",
            "#id_passord": "passord"
        },

        onShow: function () {
            this.stickit();
        },

        removeVedlagtLink: function () {
            this.model.collection.remove(this.model);
        },

        showErrors: function (error) {
            ns.TilskuddApp.vent.trigger("message:error",
                {
                    'message': 'Det oppstod en feil ved opplasting av vedleggLink. Se skjema for detaljert beskrivelse.'
                }
            );
            _.each(error, this.addError, this);
        },

        addError: function (error, key) {
            if (_.isObject(error)) {
                if (key === 'vedlegg') {
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

    ns.VedleggLinkView = ns.BaseContentEditView.extend({
        template: "#vedlagt_link_template",
        childView: VedleggLinkRowView,

        attachHtml: function (collectionView, childView) {
            collectionView.$("#id_linker").append(childView.el);
        },

        events: function () {
            // OBS: husk at første parameter er destination, bruk derfor {} for å unngå endringer i eksisterende eventlist
            return _.extend({}, this.constructor.__super__.events,
                {'click #add_link': function () {
                    this.addLink();
                } });
        },

        additionalUpdateModel: function () {
            var list = _.filter(this.collection.models, function (item) {
                return (item.get("navn") === "" && item.get("beskrivelse") === "" && item.get("passord") === "");
            });
            _.each(list, function (item) {
                this.collection.remove(item);
            }, this);

            this.model.set({
                'vedlagtlink': this.collection.toJSON()
            });
        },

        addLink: function () {
            this.collection.add(new Backbone.Model({
                'navn': '',
                'beskrivelse': '',
                'passord': ''
            }));
        }
    });

    var VedleggFilRowView = Backbone.Marionette.ItemView.extend({
        template: "#vedlagt_fil_row_template",
        tagName: "tr",
        events: {
            'click .remove_vedlagtfil': 'removeVedlagtFil',
            'click #id_filelink': 'openFile'
        },

        bindings: {
            "#id_nettadresse": "filnavn",
            "#id_beskrivelse": "beskrivelse"
        },

        onShow: function () {
            this.stickit();
        },

        openFile: function(){
            window.location.href = "/api/sak/v1/vedlegg/" + this.model.id;
        },

        removeVedlagtFil: function () {
            this.model.collection.remove(this.model);
        },

        showErrors: function (error) {
            ns.TilskuddApp.vent.trigger("message:error",
                {
                    'message': 'Det oppstod en feil ved lagring av vedlegg. Se skjema for detaljert beskrivelse.'
                }
            );
            _.each(error, this.addError, this);
        },
        addError: function (error, key) {
            if (_.isObject(error)) {
                if (key === 'vedleggfil') {
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

    ns.VedleggFilView = ns.BaseContentEditView.extend({
        template: "#vedlagt_fil_template",
        childView: VedleggFilRowView,

        attachHtml: function (collectionView, childView) {
            collectionView.$("#id_filer").append(childView.el);
        },

        events: {
            'change #id_upload': 'save'
        },

        initialize: function () {
            _.bindAll(this, 'save', 'fileSaved');
            this.setupBrowseButton();
        },

        setupBrowseButton: function() {

        	var checkExist = setInterval(function() {
			   if ($('#id_upload').length) {
			      $("#id_upload").filestyle({buttonText: "Legg til fil", input: false, iconName: "glyphicon-inbox"});

			      clearInterval(checkExist);
			   }
			}, 10); // check every 10ms
        },

        contains413: function (jqXHR) {
            // This method will detect 413 stored in both response.responseJSON and response.responseText.
            //
            // * Flask application will contain a responseJSON object looking like this if
            // MAX_CONTENT_LENGTH has been setup: "{"message": "Request Entity Too Large", "status": 413}"
            //
            // * An nginx set up with a value for "client_max_body_size" will contain a responseText
            // looking like "413 Request Entity Too Large", but no JSON object here.
            return (!_.isUndefined(jqXHR.responseText) &&
                jqXHR.responseText.match(/^413 Request Entity Too Large/) !== null )
                || (!_.isUndefined(jqXHR.responseJSON) &&
                    jqXHR.responseJSON.status === 413);
        },

        contains400: function (jqXHR) {
            // This method will detect 400 stored in response.responseJSON (returned by the flask application
            // on validation errors on upload).
            return !_.isUndefined(jqXHR.responseJSON) && jqXHR.responseJSON.status === 400;
        },

        fileSaved: function (file, textStatus, jqXHR, filename) {
            // Upload is done in an iframe, so we have to check the body of the response to know how
            // things went, return status on the response can´t be relied upon.
            var errorMsg = this.identifyKnownError(jqXHR, textStatus, undefined);
            if (errorMsg !== "") {
                this.publishError(errorMsg, filename);
            } else {
                this.saveSuccessAction(file, filename);
            }
        },

        saveSuccessAction: function(file, filename){
            ns.TilskuddApp.vent.trigger("message:success",
                {
                    'message': 'Filen "' + filename + '" er vedlagt.'
                }
            );
            this.collection.add(file);
        },

        fileNotSaved: function (jqXHR, textStatus, errorThrown, filename) {
            // We have to check if the response contains known errors.
            var errorMsg = this.identifyKnownError(jqXHR, textStatus, errorThrown);
            if (errorMsg === "") {
                if (jqXHR.responseText !== undefined && jqXHR.responseText !== "") {
                    errorMsg = jqXHR.responseText + '".';
                } else {
                    errorMsg = 'Feilen er ukjent, ta kontakt med administratoren!';
                }
            }
            this.publishError(errorMsg, filename);
        },

        identifyKnownError: function (jqXHR, textStatus, errorThrown, filename) {
            // We have to check if the response contains known errors.
            var errorMsg = "";
            if (this.contains413(jqXHR)) {
                errorMsg = 'Filen er for stor!';
            } else if (this.contains400(jqXHR)) {
                errorMsg = jqXHR.responseJSON.__error__;
            } else if (!_.isUndefined(errorThrown)) {
                // If we come in here we have a bug, so we log an error  in addition.
                console.error(errorThrown.stack);
                errorMsg = errorThrown.message + ".";
            }
            return errorMsg;
        },

        publishError: function (msg, filename) {
            this.addError(msg, 'upload');
            ns.TilskuddApp.vent.trigger("message:error",
                {
                    'message': 'Det oppstod en feil ved opplasting av "' + filename + '". ' + msg
                }
            );
        },


        createNewFile: function () {
            var fil = new ns.FilVedleggModel();
            fil.error = this.error;
            fil.success = this.success;

            return fil;
        },

        showSpinner: function (filename) {
            var msg = "Laster opp '" + filename + "'...";
            var spinner = this.$el.find(".loading-spinner");
            spinner.text(msg);
            spinner.show();
        },

        hideSpinner: function () {
            var spinner = this.$el.find(".loading-spinner");
            spinner.text("");
            spinner.hide();
        },

        save: function (event) {
            if (typeof event !== 'undefined') {
                event.preventDefault();
            }

            if (this.$('input').get(0).value !== '') {

                this.$el.find('div').removeClass("has-error control-group");
                this.$el.find('div span.help-inline, td span.help-inline, td span.control-label').remove();

                var data;
                if (this.model.get("parentObject") === "rapport") {
                    data = {'rapport_id': this.model.get("id")};
                } else if (this.model.get("parentObject") === "soknad") {
                    data = {'soknad_id': this.model.get("id")};
                }

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

}(Tilskudd));