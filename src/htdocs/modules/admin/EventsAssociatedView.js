'use strict';

var EventModulePage = require('admin/AdminEventModulePage'),
    EventComparisonView = require('admin/EventComparisonView'),
    CatalogEvent = require('CatalogEvent'),
    Collection = require('mvc/Collection'),
    Util = require('util/Util'),
    View = require('mvc/View'),
    Product = require('Product'),
    ProductFactory = require('./ProductFactory');


var EventsAssociatedView = function (options) {

  var _this,
      _initialize,

      // variables
      _associatedEventsEl,
      _el,
      _event,
      _productFactory,
      _sendProductView,
      _subEvents,

      // methods
      _deleteCallback,
      _disassociateCallback,
      _createView,
      _sendProduct;

  options = Util.extend({}, options);
  _this = View(options);


  _initialize = function () {
    _el = _this.el;
    _event = CatalogEvent(options.eventDetails);
    _sendProductView = null;

    _productFactory = options.productFactory || ProductFactory();

    _el.innerHTML = '<h3>Associated Events</h3>' +
        '<div class="associated-events"></div>';
    _associatedEventsEl = _el.querySelector('.associated-events');

    _createView();
    options = null;
  };

  /**
   * Create the associated events table, this table contains all sub-events
   * a disassociate button.
   */
  _createView = function () {
    var id = null,
        events = [];

    _subEvents = _event.getSubEvents();

    for (id in _subEvents) {
      events.push(_subEvents[id].getSummary());
    }

    // Collection table inserts markup via innerHTML
    EventComparisonView({
      el: _associatedEventsEl,
      referenceEvent: _event.getSummary(),
      collection: Collection(events),
      buttons: [
        {
          title: 'Disassociate',
          className: 'disassociate',
          callback: _disassociateCallback
        },
        {
          title: 'Delete',
          className: 'delete',
          callback: _deleteCallback
        }
      ]
    });
  };

  /**
   * Deletes all subevent products.
   *
   * @param  {Object} eventSummary,
   *         summary of the event to be deleted.
   */
  _deleteCallback = function (eventSummary) {
    var products,
        subEvent;

    // get all products in sub event
    subEvent = _subEvents[eventSummary.id];
    products = CatalogEvent.productMapToList(subEvent.getProducts());
    // ignore superseded
    products = CatalogEvent.getWithoutDeleted(
        CatalogEvent.getWithoutSuperseded(products));
    // create delete products
    products = products.map(_productFactory.getDelete);
    // send products
    _sendProduct(products, 'Delete Event ' + eventSummary.id,
        '<h4>These products will be deleted</h4>');
  };

  /**
   * Disassociates a subevent from the event.
   *
   * @param  {Object} eventSummary,
   *         summary of the event to be disassociated.
   */
  _disassociateCallback = function (eventSummary) {
    var product,
        products,
        referenceEvent = _event.getSummary(),
        subEvent;

    // create disassociate product
    product = Product({
      source: 'admin',
      type: 'disassociate',
      code: referenceEvent.id + '_' + eventSummary.id,
      properties: {
        eventsource: referenceEvent.source,
        eventsourcecode: referenceEvent.sourceCode,
        othereventsource: eventSummary.source,
        othereventsourcecode: eventSummary.sourceCode
      }
    });

    subEvent = _subEvents[eventSummary.id];
    products = CatalogEvent.productMapToList(subEvent.getProducts());

    // send product
    _sendProduct([product], 'Disassociate Event ' + eventSummary.id,
        '<h4>These products will be disassociated</h4>' +
        '<ul>' +
          products.map(function (p) {
            return '<li>' + p.id + '</li>';
          }).join('') +
        '</ul>');
  };

  /**
   * Reference to EventModulePage sendProduct.
   */
  _sendProduct = EventModulePage.prototype._sendProduct;

  /**
   * Clean up private variables, methods, and remove event listeners.
   */
  _this.destroy = Util.compose(function () {

    // methods
    _disassociateCallback = null;
    _createView = null;

    // variables
    if (_sendProductView !== null) {
      _sendProductView.destroy();
      _sendProductView = null;
    }
    _associatedEventsEl = null;
    _el = null;
    _event = null;
    _subEvents = null;
  }, _this.destroy);


  _initialize();
  return _this;
};


module.exports = EventsAssociatedView;
