/*global _, Backbone, window */
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    ns.PlaceholderActionView = ns.BaseSavingActionContentView.extend({
        template: _.template("<div class='well'><h3><%= placeholder_title %></h3><div><b>OBS!</b> Dialogen er ikke på plass i denne versjonen av tilskuddsbasen.</div><div class='push--top'><button id='cancel_action' class='btn-primary'>avbryt</button></div>")
    });

    ns.PlaceholderSoknadEditView = ns.BaseContentEditView.extend({
        template: _.template("<div class='well'><h2><%= placeholder_title %></h2><div><b>OBS!</b> Dialogen er ikke på plass i denne versjonen av tilskuddsbasen.</div><div class='push--top'><button id='previous_button' class='btn'>Forrige</button><button id='cancel_button' class='btn'>Avbryt</button><button id='next_button' class='btn-primary'>Neste</button></div>"),
        saveOnNavigation: false
    });

    ns.PlaceholderSoknadView = Backbone.Marionette.CompositeView.extend({
        template: _.template("<div class='well'><h2><%= placeholder_title %></h2><div><b>OBS!</b> Dialogen er ikke på plass i denne versjonen av tilskuddsbasen.</div><div class='push--top'>")
    });

    ns.PlaceholderStdTextView = Backbone.Marionette.CompositeView.extend({
        template: _.template("<div class='well'><h2><%= placeholder_title %></h2><div><b>OBS!</b> Dialogen er ikke på plass i denne versjonen av tilskuddsbasen.</div><div class='push--top'>")
    });

}(Tilskudd));