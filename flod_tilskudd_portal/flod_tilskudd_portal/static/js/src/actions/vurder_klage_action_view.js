/*global console, _, Backbone, window */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.VurderKlageActionView = ns.BaseSavingActionContentView.extend({
        template: "#vurdere_klage_action_template",
        standardtekst: new ns.StandardTekstCollection(),
        bindings: {
            "#id_omsokt_belop": "omsokt_belop",
            "#id_vedtatt_belop": "opprinnelig_vedtatt_belop",
            "#id_innstilt_belop": "innstilt_belop",
            "#id_intern_merknad": "intern_merknad",
            "#id_rapportfrist": "rapportfrist",
            "#id_andre_opplysninger": "andre_opplysninger",
            "#id_vedtakstekst": "vedtakstekst",
            "#id_klagebegrunnelse": "klagebegrunnelse",
            "#id_behandlet": "behandlet_av_formannskapet",
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
                        console.log(this.standardtekst);
                        console.log(new ns.StandardTekstCollection(this.standardtekst.where({type: ns.StandardtekstTypeCollection[0].value})));
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

        initialize: function (options) {
            this.soknadModel = this.options.soknadModel;

            var vedtak = this.soknadModel.getSisteVedtak();

            if (vedtak.vedtaksdato === null) {
                // vedtak på klage er blitt mellomlagret
                this.model.set('vedtak_id', vedtak.id);
                this.model.set('innstilt_belop', vedtak.innstilt_belop);
                this.model.set('intern_merknad', vedtak.intern_merknad);
                this.model.set('rapportfrist', vedtak.rapportfrist);
                this.model.set('vedtakstekst', vedtak.vedtakstekst);
                this.model.set('andre_opplysninger', vedtak.andre_opplysninger);
                this.model.set('tilskuddsordning_type', vedtak.tilskuddsordning_type);

                var opprinneligVedtak = this.soknadModel.getSisteVedtak(1);
                this.model.set('opprinnelig_vedtatt_belop', opprinneligVedtak.vedtatt_belop);
            } else {
                // vedtak på klage eksisterer ikke ennå
                this.model.set('opprinnelig_vedtatt_belop', vedtak.vedtatt_belop);
                this.model.set('tilskuddsordning_type', vedtak.tilskuddsordning_type);
            }

            var klage = this.soknadModel.getSisteKlage();
            this.model.set('klagebegrunnelse', klage.begrunnelse);

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
                    }});
            });
        },

        redirectOnSaveSuccess: function () {
            window.location.href = '/soknad/' + this.model.soknad_id;
        },

        addMerkFolgendeText: function(){
            this.addDefaultText("select#id_merk_folgende_standardtekst", 'vedtakstekst');
        },

        addAndreOpplysningerText: function(){
            this.addDefaultText("select#id_andre_opplysninger_standardtekst", 'andre_opplysninger');
        },

        addDefaultText: function (control, property) {
            var stdTxt = this.standardtekst.get(this.$(control).val());
            if (!_.isUndefined(stdTxt)) {
                var currentText = this.model.get(property);
                this.model.set(property, ((_.isNull(currentText) || _.isUndefined(currentText)) ? "" : currentText + "\n") + stdTxt.get('tekst'));

            }
        }

    });
})(Tilskudd);