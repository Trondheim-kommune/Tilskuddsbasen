/*global Backbone, _, console, $*/
var Tilskudd = window.Tilskudd || {};

(function (ns) {
    "use strict";

    // Menyer brukes med to formål i Tilskudd:
    //  * lister av aksjoner man kan utføre på den informasjonen som vises (f.eks. lenker på toppen)
    //  * informasjon klassifisert basert på en liste emner (f.eks. tabs på venstre siden)

    // Felles funksjonalitet

    ns.MenuModel = Backbone.Model.extend({
        defaults: {
            'path': '#'
        }
    });

    ns.MenuElementCollection = Backbone.Collection.extend({
        model: ns.MenuModel
    });

    ns.BaseMenuItemView = Backbone.Marionette.ItemView.extend({
        contentViewCreator: undefined,
        tagName: "li",
        events: {
            'click a': 'itemClicked'
        },

        getMappedContentViewCreator: function (options, itemId) {
            for (var x in options) {
                if (_.isEqual(options[x].itemId, itemId)) {
                    if (_.isUndefined(options[x].disabled) || options[x].disabled === false) {
                        return options[x].contentView;
                    }
                }
            }
            return undefined;
        },

        findContentViewCreator: function (options) {
            var itemId = this.model.get('id');
            return this.getMappedContentViewCreator(options, itemId);
        },

        initialize: function (options) {
            this.contentViewCreator = this.findContentViewCreator(options);
            if (_.isUndefined(this.contentViewCreator)) {
                this.$el.addClass('hidden');
                // logging to help detect new action for which views were forgotten,
                // but it´s most likely intentional when it happens, not a bug.
                console.log("Hiding action \"" + this.model.get('id') + "\", no content view creator is defined for this menu item.");
            }
        },


        itemClicked: function (e) {
            e.preventDefault();
            this.trigger("toggleItem", this, true);
        }

    });

    ns.BaseMenuView = Backbone.Marionette.CollectionView.extend({
        tagName: 'ul',
        contentRegion: undefined,
        clickOnActivatedItemDeactivatesIt: true,
        rendersIfOnlyOneItem: false,

        childViewOptions: function () {
            throw "override this";
        },

        initialize: function (options) {
            this.contentRegion = options.contentRegion;
            this.listenTo(this, "childview:toggleItem", function (clickedItemView, originalEventTriggeredByUser) {
                this.toggleItem(clickedItemView, originalEventTriggeredByUser);
            });
            _.bindAll(this, "toggleItemBasedOnQueryParam");
            this.listenTo(ns.TilskuddApp.vent, this.subscription.updateFromUrlEvent, this.toggleItemBasedOnQueryParam);
        },

        activateItemView: function (itemView) {
            itemView.$el.addClass('active');
            this.activeItem = itemView;
            this.contentRegion.show(itemView.contentView);
        },

        render: function () {
            Backbone.Marionette.CollectionView.prototype.render.apply(this);
            if (this.collection.length === 1 && !this.rendersIfOnlyOneItem) {
                this.$el.addClass('hidden');
            }
            return this;
        },

        findItemViewInCollectionByModelTitle: function (title) {
            if (title !== undefined) {
                var itemViews = this.children.toArray();
                for (var idx in itemViews) {
                    if (itemViews[idx].model.attributes.title === title) {
                        return itemViews[idx];
                    }
                }
            }
            return undefined;
        },

        findItemViewInCollectionByPostition: function (position) {
            var itemViews = this.children.toArray();
            if (position >= 0 && position <= itemViews.length) {
                return itemViews[position];
            }
            return undefined;
        },


        createContentViewAndSetup: function (itemView, originalEventTriggeredByUser) {
            if (!_.isEqual(itemView, this.activeItem)) {

                if (!_.isUndefined(itemView.contentView)) {
                    itemView.contentView.destroy();
                }
                var self = this;
                itemView.contentViewCreator.newInstance(function (contentView) {
                    self.deactivateItemView(self.activeItem);
                    itemView.contentView = contentView;
                    itemView.setupForContentViewListeners();
                    self.activateItemView(itemView);
                    if (originalEventTriggeredByUser) {
                        self.updateURLQueryParams(self.activeItem.model.attributes.title);
                    }
                });
            }
        },

        /**
         * Updates the URL query params based on the current CollectionView state. Has to be implemented by subclasses.
         */
        updateURLQueryParams: function (newValue) {
            Tilskudd.TilskuddApp.vent.trigger(this.subscription.updateFromAppEvent, this.subscription, newValue);
        },

        /**
         * Toggles the given item view.
         *
         * @param {Backbone.Marionette.ItemView} itemview
         */
        toggleItem: function (itemView, originalEventTriggeredByUser) {
            if (_.isEqual(itemView, this.activeItem)) {
                if (originalEventTriggeredByUser) {
                    if (this.clickOnActivatedItemDeactivatesIt) {
                        this.deactivateItemView(this.activeItem);
                        this.updateURLQueryParams(undefined);
                    }
                }
            } else {
                this.createContentViewAndSetup(itemView, originalEventTriggeredByUser);
            }
        },

        deactivateItemView: function (itemView) {
            if (!_.isUndefined(itemView)) {
                itemView.$el.removeClass('active');
                itemView.contentView.destroy();
                this.activeItem = undefined;
                this.contentRegion.reset();
            }
        }

    });

    // venstremeny

    ns.LeftMenuItemView = ns.BaseMenuItemView.extend({
        template: _.template("<a href='<%- path %>'> <%- title %> </a>"),

        setupForContentViewListeners: function () {
            this.listenTo(this.contentView, "nextClicked", function () {
                this.trigger("nextClicked", this);
            });
            this.listenTo(this.contentView, "previousClicked", function () {
                this.trigger("previousClicked", this);
            });
            this.listenTo(this.contentView, "cancel", function () {
                this.trigger("cancel", this);
            });
        },

        initialize: function (options) {
            ns.BaseMenuItemView.prototype.initialize.apply(this, [options]);
        }

    });

    ns.LeftMenuView = ns.BaseMenuView.extend({
        childView: ns.LeftMenuItemView,
        className: 'nav navbar-nav',
        clickOnActivatedItemDeactivatesIt: false,
        subscription: undefined,

        events: {
            'click a': 'collapseMenu'
        },

        // FIXME: isn´t there a better place to write this? a css or something?
        collapseMenu: function () {
            if ($(window).width() < 768) {
                $(".navbar-collapse").collapse('hide');
            }
        },

        initialize: function (options) {
            this.subscription = new ns.TilskuddApp.UrlQueryParameterSubscription(
                "menu",
                "urlQueryParam:updateMenuFromUrl",
                "urlQueryParam:updateMenuFromApp");
            ns.BaseMenuView.prototype.initialize.apply(this, [options]);
            this.listenTo(this, "childview:nextClicked", function (currentItemView) {
                this.showNextContentView(currentItemView);
            });
            this.listenTo(this, "childview:previousClicked", function (currentItemView) {
                this.showPreviousContentView(currentItemView);
            });
            this.listenTo(this, "childview:cancel", function (currentItemView) {
                this.redirectOnCancel(currentItemView);
            });
            ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(this.subscription);
        },

        deactivateItemView: function (itemView) {
            if (this.children.length > 1) {
                ns.BaseMenuView.prototype.deactivateItemView.call(this, itemView);
            }
        },

        /**
         * Toggles the item view controlled by this collection view based on the given title.
         *
         * @param {String} itemview title
         */
        toggleItemBasedOnQueryParam: function (title) {
            if (title !== undefined) {
                // toggle the given item
                var itemView = this.findItemViewInCollectionByModelTitle(title);
                if (itemView !== undefined) {
                    this.toggleItem(itemView, false);
                }
            } else {
                this.toggleDefaultItemView();
            }
        },

        toggleDefaultItemView: function () {
            var firstItemView = this.children.findByModel(this.collection.models[0]);
            this.toggleItem(firstItemView, false);
        },

        onRender: function () {
            if (this.children.length > 0) {
                this.toggleDefaultItemView();
            }
        },

        findCurrentItemViewPositionInCollection: function (currentItemView) {
            var position = this.children.toArray().indexOf(currentItemView);
            if (position === -1) {
                throw "The given view is unknown to this menu!";
            }
            return position;
        },

        showNextContentView: function (currentItemView) {
            var pos = this.findCurrentItemViewPositionInCollection(currentItemView);
            var nextItemView = this.findItemViewInCollectionByPostition(+pos + 1);
            this.toggleItem(nextItemView, true);
        },

        showPreviousContentView: function (currentItemView) {
            var pos = this.findCurrentItemViewPositionInCollection(currentItemView);
            var previousItemView = this.findItemViewInCollectionByPostition(+pos - 1);
            this.toggleItem(previousItemView, true);
        },

        redirectOnCancel: function (currentItemView) {
            if (this.options.urlRedirectOnCancel !== undefined) {
                window.location.href = this.options.urlRedirectOnCancel;
            }
        }

    });

    // aksjonsliste

    ns.ActionItemView = ns.BaseMenuItemView.extend({
        template: _.template("<a href='<%- id %>'> <%- title %> </a>"),

        setupForContentViewListeners: function () {
            this.listenTo(this.contentView, "cancel", function () {
                this.trigger("cancel");
            });
        },

        initialize: function (options) {
            ns.BaseMenuItemView.prototype.initialize.apply(this, [options]);
        }

    });


    ns.ActionMenuView = ns.BaseMenuView.extend({
        className: 'nav nav-tabs',
        childView: ns.ActionItemView,
        rendersIfOnlyOneItem: true,
        subscription: undefined,

        initialize: function (options) {
            this.subscription = new ns.TilskuddApp.UrlQueryParameterSubscription(
                "action",
                "urlQueryParam:updateActionFromUrl",
                "urlQueryParam:updateActionFromApp");
            ns.BaseMenuView.prototype.initialize.apply(this, [options]);
            this.listenTo(this, "childview:cancel", function (currentItemView) {
                this.toggleItem(currentItemView, true);
            });
            ns.TilskuddApp.controller.registerUrlQueryParameterSubscription(this.subscription);
        },

        /**
         * Toggles the item view controlled by this collection view based on the given title.
         *
         * @param {String} itemview title
         */
        toggleItemBasedOnQueryParam: function (title) {
            if (title !== undefined) {
                // toggle the given item
                var itemView = this.findItemViewInCollectionByModelTitle(title);
                if (itemView !== undefined) {
                    this.toggleItem(itemView, false);
                }
            } else {
                // untoggle active view if set
                if (!_.isUndefined(this.activeItem)) {
                    this.deactivateItemView(this.activeItem);
                }
            }
        },


    });


}(Tilskudd));