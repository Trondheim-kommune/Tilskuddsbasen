/*global console, _, window, Backbone */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.TilVedtakActionView = ns.BaseSavingActionContentView.extend({
        template: "#til_vedtak_action_template",
        standardtekst: new ns.StandardTekstCollection(),
        bindings: {
            "#id_omsokt_belop": "omsokt_belop",
            "#id_innstilt_belop": "innstilt_belop",
            "#id_intern_merknad": "intern_merknad",
            "#id_rapportfrist": "rapportfrist",
            "#id_vedtakstekst": "vedtakstekst",
            "select#id_tilskuddsordning_type": {
                observe: 'tilskuddsordning_type',
                selectOptions: {
                    collection: ns.TilskuddsordningTypeCollection,
                    defaultOption: {
                        label: '---',
                        value: null
                    }
                }
            },
            "#id_andre_opplysninger": "andre_opplysninger",
            "select#id_merk_folgende_standardtekst": {
                observe: 'selected_standardtekst',
                selectOptions: {
                    collection: function () {
                        return new ns.StandardTekstCollection(this.standardtekst.where({type: ns.StandardtekstTypeCollection[1].value}));
                    },
                    defaultOption: {
                        label: '---',
                        value: null
                    },
                    labelPath: 'navn',
                    valuePath: 'id'
                }
            },
            "select#id_andre_opplysninger_standardtekst": {
                observe: 'selected_standardtekst',
                selectOptions: {
                    collection: function () {
                        return new ns.StandardTekstCollection(this.standardtekst.where({type: ns.StandardtekstTypeCollection[0].value}));
                    },
                    defaultOption: {
                        label: '---',
                        value: null
                    },
                    labelPath: 'navn',
                    valuePath: 'id'
                }
            },
            ".rapportfrist_info": {
                attributes: [
                    {
                        name: 'class',
                        onGet: function () {
                            if (this.soknadModel.get("tilskuddsordning").type === "Krever ikke rapport") {
                                return "hidden";
                            }
                        }
                    }
                ]
            }
        },

        events: function () {
            return _.extend({}, ns.BaseSavingActionContentView.prototype.events, {
                'click #legg_til_andre_opplysninger_standardtekst': 'addAndreOpplysningerText',
                'click #legg_til_merk_folgende_standardtekst': 'addMerkFolgendeText',
                'click #save_action': 'saveOnly'
            });
        },


        initialize: function () {
            this.soknadModel = this.options.soknadModel;

            var vedtak = this.soknadModel.getSisteVedtak();
            if (_.isUndefined(vedtak)) {
                this.model.set('rapportfrist', this.soknadModel.get('tilskuddsordning').rapportfrist);
                this.model.set('innstilt_belop', this.soknadModel.get('omsokt_belop'));
                this.model.set('tilskuddsordning_type', this.soknadModel.get('tilskuddsordning').type);
            } else {
                this.model.set('vedtak_id', vedtak.id);
                this.model.set('innstilt_belop', vedtak.innstilt_belop);
                this.model.set('intern_merknad', vedtak.intern_merknad);
                this.model.set('rapportfrist', vedtak.rapportfrist);
                this.model.set('vedtakstekst', vedtak.vedtakstekst);
                this.model.set('tilskuddsordning_type', vedtak.tilskuddsordning_type);
                this.model.set('andre_opplysninger', vedtak.andre_opplysninger);
            }
            this.model.set('omsokt_belop', this.soknadModel.get('omsokt_belop'));

            var self = this;
            this.standardtekst.fetch({
                'success': function () {
                    self.model.trigger("change:selected_standardtekst", self.model);
                },
                'error': function () {
                    ns.TilskuddApp.vent.trigger("message:error",
                        {
                            'message': 'Det oppstod en feil ved lasting av standardtekster.'
                        }
                    );
                }
            });
        },

        saveOnly: function (e) {
            this.model.set('saveOnly', true);
            var self = this;
            this.ok(e, function () {
                self.model.unset('saveOnly');
                self.soknadModel.fetch({
                    'success': function () {
                        var vedtak = self.soknadModel.getSisteVedtak();
                        self.model.set('vedtak_id', vedtak.id);
                    }
                });
            });
        },

        redirectOnSaveSuccess: function () {
            window.location.href = '/soknad/' + this.model.soknad_id;
        },

        addMerkFolgendeText: function () {
            this.addDefaultText("select#id_merk_folgende_standardtekst", 'vedtakstekst');
        },

        addAndreOpplysningerText: function () {
            this.addDefaultText("select#id_andre_opplysninger_standardtekst", 'andre_opplysninger');
        },

        addDefaultText: function (control, property) {
            var stdTxt = this.standardtekst.get(this.$(control).val());
            if (!_.isUndefined(stdTxt) && stdTxt.get('tekst') !== null) {
                var currentText = this.model.get(property);
                this.model.set(property, ((_.isNull(currentText) || _.isUndefined(currentText)) ? "" : currentText + "\n") + stdTxt.get('tekst'));

            }
        }

    });
})(Tilskudd);