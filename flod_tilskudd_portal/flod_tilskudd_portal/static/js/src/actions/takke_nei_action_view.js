/*global console, _, window */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.TakkeNeiActionView = ns.GodtaVedtakActionView.extend({
        template: "#takke_nei_action_template"
    });
})(Tilskudd);