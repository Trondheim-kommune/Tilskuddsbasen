/*global buster, console, $, Backbone, _, debugger*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    var assert = assert || buster.referee.assert;
    var refute = refute || buster.referee.refute;

    var setup = function (templatePath) {
        ns.test_tools.backupTilskuddApp();
        ns.test_tools.loadTemplateInDocumentBody(templatePath);
    };

    var teardown = function () {
        ns.test_tools.restoreOriginalDocumentBody();
        ns.test_tools.resetTilskuddApp();
    };

    buster.testCase("MenuTests", {

        setUp: function () {
            setup("/tilskudd_layout_template");

            var soknadModel = new Tilskudd.SoknadModel({'id': 1});

            var layout = new Tilskudd.TilskuddLayout();
            var user_mode = 'tilskudd_soker';

            var menuElements = new Tilskudd.MenuElementCollection([
                {"title": "Innledning", "id": "innledning"},
                {"title": "Om søker", "id": "om_soker"}
            ]);

            var TestModel = Backbone.Model.extend({
                fetch: function (options) {
                    // not doing anything...
                }
            });

            var menuTitleToContentView = [
                {
                    itemId: 'innledning',
                    contentView: {newInstance: function (callback) {
                        callback(new Tilskudd.PlaceholderSoknadEditView(
                            {
                                model: new TestModel(
                                    {
                                        placeholder_title: "Innledning"
                                    })

                            }));

                    }
                    }
                },
                {
                    itemId: 'invisible_view',
                    disabled: (user_mode === "tilskudd_saksbehandler" || user_mode === "tilskudd_godkjenner") ? false : true,
                    contentView: {newInstance: function (callback) {
                        callback(new Tilskudd.PlaceholderSoknadEditView(
                            {
                                model: new TestModel(
                                    {
                                        placeholder_title: "Invisible view"
                                    })

                            }));
                    }
                    }
                },
                {
                    itemId: 'om_soker',
                    disabled: false,
                    contentView: {newInstance: function (callback) {
                        callback(new Tilskudd.PlaceholderSoknadEditView(
                            {
                                model: new TestModel(
                                    {
                                        placeholder_title: "Om søker"
                                    })

                            }));
                    }
                    }
                },
                {
                    itemId: 'invisible_view2',
                    disabled: true,
                    contentView: {newInstance: function (callback) {
                        callback(new Tilskudd.PlaceholderSoknadEditView(
                            {
                                model: new TestModel(
                                    {
                                        placeholder_title: "One more invisible view"
                                    })

                            }));
                    }
                    }
                }
            ];

            var MenuView = Tilskudd.LeftMenuView.extend({
                childViewOptions: function (model, index) {
                    return menuTitleToContentView;
                }
            });

            layout.render();

            var leftMenuView = new MenuView({
                urlRedirectOnCancel: "/soknad/" + soknadModel.id,
                contentRegion: layout.content,
                collection: menuElements
            });

            leftMenuView.render();

            this.layout = layout;
            this.leftMenuView = leftMenuView;
            this.menuElements = menuElements;
            this.menuTitleToContentView = menuTitleToContentView;
        },

        tearDown: function () {
            teardown();
        },


        "Test that only two menu items have been created": function () {
            assert.equals(2, this.leftMenuView.children.length);
        },

        "Test that there is one activated item": function () {
            assert.defined(this.leftMenuView.activeItem);
        },

        "Test that the first menu item is activated": function () {
            var innledningItemView = this.leftMenuView.findItemViewInCollectionByPostition(0);
            assert.equals(innledningItemView, this.leftMenuView.activeItem);
        },

        "Test that toggling shows content view when not already visible": function () {
            // setup
            var newInstance_ctx = 0;
            var itemView = this.leftMenuView.findItemViewInCollectionByPostition(1);
            var newContentView = null;
            var callback = (function(contentView){newContentView = contentView;});
            itemView.contentViewCreator.newInstance(callback);
            var originalFunction = itemView.contentViewCreator.newInstance;
            itemView.contentViewCreator.newInstance = function (callback) {
                newInstance_ctx++;
                return originalFunction(callback);
            };
            var show_ctx = 0;
            this.leftMenuView.contentRegion.show = function () {
                show_ctx++;
            };

            // code under test
            this.leftMenuView.toggleItem(itemView, true);

            // verify
            assert.equals(1, newInstance_ctx);
            assert.equals(1, show_ctx);
            assert.defined(this.leftMenuView.activeItem);
        },

        "Test that toggling already visible content view does not hide it": function () {
            // setup
            var newInstance_ctx = 0;
            var itemView = this.leftMenuView.findItemViewInCollectionByPostition(1);
            var newContentView = null;
            var callback = (function(contentView){newContentView = contentView;});
            itemView.contentViewCreator.newInstance(callback);
            var originalFunction = itemView.contentViewCreator.newInstance;
            itemView.contentViewCreator.newInstance = function (callback) {
                newInstance_ctx++;
                return originalFunction(callback);
            };
            var show_ctx = 0;
            this.leftMenuView.contentRegion.show = function () {
                show_ctx++;
            };
            var reset_ctx = 0;
            this.leftMenuView.contentRegion.reset = function () {
                reset_ctx++;
            };

            // code under test
            this.leftMenuView.toggleItem(itemView, true);
            this.leftMenuView.toggleItem(itemView, true);

            // verify
            assert.equals(1, newInstance_ctx);
            assert.equals(1, show_ctx);
            assert.equals(1, reset_ctx);
            assert.defined(this.leftMenuView.activeItem);
        },

        "Test that toggling another item than the current one renders it": function () {
            // setup
            var newInstance_ctx = 0;
            var itemView = this.leftMenuView.findItemViewInCollectionByPostition(1);
            var newContentView = null;
            var callback = (function(contentView){newContentView = contentView;});
            itemView.contentViewCreator.newInstance(callback);
            var originalFunction = itemView.contentViewCreator.newInstance;
            itemView.contentViewCreator.newInstance = function (callback) {
                newInstance_ctx++;
                return originalFunction(callback);
            };
            var show_ctx = 0;
            this.leftMenuView.contentRegion.show = function () {
                show_ctx++;
            };
            var reset_ctx = 0;
            this.leftMenuView.contentRegion.reset = function () {
                reset_ctx++;
            };
            this.leftMenuView.toggleItem(itemView, true);

            var itemView2 = this.leftMenuView.findItemViewInCollectionByPostition(0);
            var newContentView2 = null;
            var callback2 = function(contentView){newContentView2 = contentView;};
            var originalFunction2 = itemView.contentViewCreator.newInstance;
            itemView.contentViewCreator.newInstance(callback2);
            itemView.contentViewCreator.newInstance = function (callback2) {
                newInstance_ctx++;
                return originalFunction2(callback2);
            };

            // code under test
            this.leftMenuView.toggleItem(itemView2, true);

            // verify
            assert.equals(2, newInstance_ctx);
            assert.equals(2, show_ctx);
            assert.equals(2, reset_ctx);
            assert.equals(itemView2, this.leftMenuView.activeItem);
        },

        "Test that toggling triggers url query param events": function () {
            // setup
            var itemView0 = this.leftMenuView.findItemViewInCollectionByPostition(0);
            var itemView1 = this.leftMenuView.findItemViewInCollectionByPostition(1);
            var eventHistory = [];
            var triggerFn = ns.TilskuddApp.vent.trigger;
            ns.TilskuddApp.vent.trigger = function (event, subscription, value) {
                eventHistory.push([event, value]);
                triggerFn(event, subscription, value);
            };

            // code under test
            this.leftMenuView.toggleItem(itemView0, true);
            this.leftMenuView.toggleItem(itemView1, true);
            this.leftMenuView.toggleItem(itemView1, true);
            this.leftMenuView.toggleItem(itemView0, true);

            // verify
            assert.equals(2, eventHistory.length);
        }

    });

    buster.testCase("ActionTests", {

        setUp: function () {
            setup("/tilskudd_layout_template");

            var soknadModel = new Tilskudd.SoknadModel({'id': 1});

            var layout = new Tilskudd.TilskuddLayout();

            var menuElements = new Tilskudd.MenuElementCollection([
                {"title": "Trekk søknad", "id": "trekk_soknad"},
                {"title": "Slett", "id": "slett"},
                {"title": "Lever", "id": "lever"}
            ]);

            var TestModel = Backbone.Model.extend({
                fetch: function (options) {
                    // not doing anything...
                }
            });

            var menuTitleToContentView = [
                {
                    itemId: 'trekk_soknad',
                    contentView: {newInstance: function (callback) {
                        callback(new Tilskudd.PlaceholderSoknadEditView(
                            {
                                model: new TestModel(
                                    {
                                        placeholder_title: "Trekk søknad"
                                    })

                            }));
                    }
                    }
                },
                {
                    itemId: 'slett',
                    contentView: {newInstance: function (callback) {
                        callback(new Tilskudd.PlaceholderSoknadEditView(
                            {
                                model: new TestModel(
                                    {
                                        placeholder_title: "Slett"
                                    })

                            }));
                    }
                    }
                },
                {
                    itemId: 'lever',
                    contentView: {newInstance: function (callback) {
                        callback(new Tilskudd.PlaceholderSoknadEditView(
                            {
                                model: new TestModel(
                                    {
                                        placeholder_title: "Lever"
                                    })

                            }));
                    }
                    }
                }
            ];

            var ActionView = Tilskudd.ActionMenuView.extend({
                childViewOptions: function (model, index) {
                    return menuTitleToContentView;
                }
            });

            layout.render();

            var actionMenuView = new ActionView({
                urlRedirectOnCancel: "/soknad/" + soknadModel.id,
                contentRegion: layout.content,
                collection: menuElements
            });

            actionMenuView.render();

            this.layout = layout;
            this.actionMenuView = actionMenuView;
            this.menuElements = menuElements;
            this.menuTitleToContentView = menuTitleToContentView;
        },

        tearDown: function () {
            teardown();
        },


        "Test that three menu items have been created": function () {
            assert.equals(3, this.actionMenuView.children.length);
        },

        "Test that there is no activated item after creation": function () {
            refute.defined(this.actionMenuView.activeItem);
        },

        "Test that toggling shows content view when not already visible": function () {
            // setup
            var newInstance_ctx = 0;
            var itemView = this.actionMenuView.findItemViewInCollectionByPostition(0);
            var newContentView = null;
            var callback = (function(contentView){newContentView = contentView;});
            itemView.contentViewCreator.newInstance(callback);
            var originalFunction = itemView.contentViewCreator.newInstance;
            itemView.contentViewCreator.newInstance = function (callback) {
                newInstance_ctx++;
                return originalFunction(callback);
            };
            var show_ctx = 0;
            this.actionMenuView.contentRegion.show = function () {
                show_ctx++;
            };

            // code under test
            this.actionMenuView.toggleItem(itemView);

            // verify
            assert.equals(1, newInstance_ctx);
            assert.equals(1, show_ctx);
            assert.defined(this.actionMenuView.activeItem);
        },

        "Test that toggling already visible content view hides it": function () {
            // setup
            var newInstance_ctx = 0;
            var itemView = this.actionMenuView.findItemViewInCollectionByPostition(2);
            var newContentView = null;
            var callback = (function(contentView){newContentView = contentView;});
            itemView.contentViewCreator.newInstance(callback);
            var originalFunction = itemView.contentViewCreator.newInstance;
            itemView.contentViewCreator.newInstance = function (callback) {
                newInstance_ctx++;
                return originalFunction(callback);
            };
            var show_ctx = 0;
            this.actionMenuView.contentRegion.show = function () {
                show_ctx++;
            };
            var reset_ctx = 0;
            this.actionMenuView.contentRegion.reset = function () {
                reset_ctx++;
            };

            // code under test
            this.actionMenuView.toggleItem(itemView, true);
            this.actionMenuView.toggleItem(itemView, true);

            // verify
            assert.equals(1, newInstance_ctx);
            assert.equals(1, show_ctx);
            assert.equals(1, reset_ctx);
            refute.defined(this.actionMenuView.activeItem);
        },

        "Test that toggling another item than the current one renders it": function () {
            // setup
            var newInstance_ctx = 0;
            var itemView = this.actionMenuView.findItemViewInCollectionByPostition(1);
            var newContentView = null;
            var callback = (function(contentView){newContentView = contentView;});
            itemView.contentViewCreator.newInstance(callback);
            var originalFunction = itemView.contentViewCreator.newInstance;
            itemView.contentViewCreator.newInstance = function (callback) {
                newInstance_ctx++;
                return originalFunction(callback);
            };
            var show_ctx = 0;
            this.actionMenuView.contentRegion.show = function () {
                show_ctx++;
            };
            var reset_ctx = 0;
            this.actionMenuView.contentRegion.reset = function () {
                reset_ctx++;
            };
            this.actionMenuView.toggleItem(itemView, true);

            var itemView2 = this.actionMenuView.findItemViewInCollectionByPostition(2);
            var newContentView2 = null;
            var callback2 = function(contentView){newContentView2 = contentView;};
            var originalFunction2 = itemView.contentViewCreator.newInstance;
            itemView.contentViewCreator.newInstance(callback2);
            itemView.contentViewCreator.newInstance = function (callback2) {
                newInstance_ctx++;
                return originalFunction2(callback2);
            };

            // code under test
            this.actionMenuView.toggleItem(itemView2, true);

            // verify
            assert.equals(2, newInstance_ctx);
            assert.equals(2, show_ctx);
            assert.equals(1, reset_ctx);
            assert.equals(itemView2, this.actionMenuView.activeItem);
        },

        "Test that toggling triggers url query param events": function () {
            // setup
            var itemView0 = this.actionMenuView.findItemViewInCollectionByPostition(0);
            var itemView1 = this.actionMenuView.findItemViewInCollectionByPostition(1);
            var itemView2 = this.actionMenuView.findItemViewInCollectionByPostition(2);
            var eventHistory = [];
            var triggerFn = ns.TilskuddApp.vent.trigger;
            ns.TilskuddApp.vent.trigger = function (event, subscription, value) {
                eventHistory.push([event, value]);
                triggerFn(event, subscription, value);
            };

            // code under test
            this.actionMenuView.toggleItem(itemView0, true);
            this.actionMenuView.toggleItem(itemView1, true);
            this.actionMenuView.toggleItem(itemView1, true);
            this.actionMenuView.toggleItem(itemView0, true);
            this.actionMenuView.toggleItem(itemView2, true);

            // verify
            assert.equals(5, eventHistory.length);
        }

    });

}
(Tilskudd)
    )
;
