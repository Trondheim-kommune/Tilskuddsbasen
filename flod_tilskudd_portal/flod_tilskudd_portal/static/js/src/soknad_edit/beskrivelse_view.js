var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.BeskrivelseView = ns.BaseArrangementView.extend({
        template: "#beskrivelse_template",

        bindings: {
            "#id_prosjektnavn": "prosjektnavn",
            "#id_beskrivelse": "beskrivelse",
            "#id_maalsetting": "maalsetting",
            "#id_om_oss": "om_oss",

            "#id_tilskuddsordning_prosjekttekst": {
                observe: 'tilskuddsordning',
                onGet: function (value) {
                    if (!_.isUndefined(this.model.get('tilskuddsordning'))) {
                        return this.model.get('tilskuddsordning').prosjekttekst;
                    }
                }
            }

        }
    });

}(Tilskudd));
