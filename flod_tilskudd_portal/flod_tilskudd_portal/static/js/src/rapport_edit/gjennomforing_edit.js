var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.RapportGjennomforingView = ns.BaseArrangementView.extend({
        template: "#rapport_edit_gjennomforing_template",
        bindings: {
            "#id_prosjekt_avvik" : "prosjekt_avvik",
            "#id_prosjekt_gjennomforing" : "prosjekt_gjennomforing"
        }
    });

}(Tilskudd));