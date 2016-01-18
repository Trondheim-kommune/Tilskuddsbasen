/*global window, Backbone, $, _, console, moment */

var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.formatDato = function (date) {
        if (date !== null && date !== '') {
            var formattedDate = moment(date);
            if (formattedDate.isValid()) {
                return formattedDate.format('DD.MM.YYYY');
            }
            throw "\"" + date + "\" er ikke en dato.";
        }
        return '';
    };

    ns.formatDateNoToIso = function (date) {
        if (date !== null && date !== '') {
            var formattedDate = moment(date, 'DD.MM.YYYY');
            if (formattedDate.isValid()) {
                return formattedDate.format('YYYY-MM-DD');
            }
            throw "\"" + date + "\" er ikke en dato.";
        }
        return '';
    };

}(Tilskudd));