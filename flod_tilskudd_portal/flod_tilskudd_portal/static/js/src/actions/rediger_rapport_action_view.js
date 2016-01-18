/*global console, _ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.RedigerRapportActionView = ns.BaseActionContentView.extend({
        template: '#rediger_rapport_action_template',

        ok: function (e) {
            e.preventDefault();

            if (this.model.get('rapport')) {
                if (this.model.get('rapport').length === 1) {
                    window.location.href = '/soknad/' + this.model.get('id') + "/rapport/" + this.model.get('rapport')[0].id + "/edit";
                } else if (this.model.get('rapport').length === 0) {
                    console.log.error("Ingen rapport er opprettet!");
                } else {
                    console.log.error("Det finnes flere rapporter!");
                }
            }
        }
    });
})(Tilskudd);