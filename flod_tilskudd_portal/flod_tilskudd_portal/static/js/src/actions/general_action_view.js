/*global console, _ */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.GeneralActionView = ns.BaseSavingActionContentView.extend({
        initialize: function(options) {
		     this.template = options.model.attributes.template;
		},
        
        redirectOnSaveSuccess: function () {
            window.location.href = '/soknad/' + this.model.soknad_id;
        }
    });
})(Tilskudd);