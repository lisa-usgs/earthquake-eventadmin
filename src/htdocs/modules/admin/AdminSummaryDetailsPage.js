'use strict';

var CatalogEvent = require('CatalogEvent'),

    ProductActionsView = require('admin/ProductActionsView'),
    SummaryDetailsPage = require('base/SummaryDetailsPage');


SummaryDetailsPage.prototype._setContentMarkup = function () {
  var actionsView,
      details,
      products = this.getProducts(),
      product;

  products = CatalogEvent.removePhases(
      CatalogEvent.getWithoutSuperseded(products));

  this._products = products;
  this._actionViews = [];

  if (products.length === 1) {
    product = products[0];
    // If there is only one product display details
    actionsView = ProductActionsView({
      event: this._event,
      page: this,
      products: [(product.product ? product.product : product)]
    });
    this._actionViews.push(actionsView);
    this._content.appendChild(actionsView.el);
    details = this.getDetailsContent(product);
    if (product.status.toUpperCase() === 'DELETE') {
      details.classList.add('deleted');
    }
    this._content.appendChild(details);
  } else {
    // there is more than one product display summary
    this._content.appendChild(this.getSummaryContent(products));
  }
};


SummaryDetailsPage.prototype.getSummaryContent = function (products) {
  var actionsView,
      el,
      summary,
      product,
      fragment = document.createDocumentFragment();

  for (var i = 0; i < products.length; i++) {
    product = products[i];
    el = document.createElement('div');
    el.classList.add('alert');
    el.classList.add('edit-summary');
    fragment.appendChild(el);

    summary = this.buildSummaryMarkup(product, !i);
    // add edit/delete/trump buttons
    actionsView = ProductActionsView({
      event: this._event,
      page: this,
      products: [(product.product ? product.product : product)]
    });
    this._actionViews.push(actionsView);
    // append summary markup
    el.appendChild(actionsView.el);
    el.appendChild(summary);

    if (i === 0 && this._options.markPreferred) {
      summary.classList.add('preferred');
    }

    if (product.status.toUpperCase() === 'DELETE') {
      summary.classList.add('deleted');
    }
  }
  return fragment;
};


SummaryDetailsPage.prototype._getProductFromDataId = function (dataid, type) {
  var products = [],
      product = null;

  products = CatalogEvent.getWithoutSuperseded(
      CatalogEvent.productMapToList(
      this._options.eventDetails.properties.products));

  for (var i =0; i < products.length; i++) {
    product = products[i];
    if (type === product.type && dataid === product.code) {
      return product;
    }
  }

  return null;
};


  // clean-up resources.
SummaryDetailsPage.prototype._destroy = SummaryDetailsPage.prototype.destroy;
SummaryDetailsPage.prototype.destroy = function () {

  this._actionViews.forEach(function (view) {
    view.destroy();
  });
  this._actionViews = null;

  this._content = null;
  this._products = null;
  this._options = null;


  // call regular destroy method
  SummaryDetailsPage.prototype._destroy.call(this);
};



module.exports = SummaryDetailsPage;
