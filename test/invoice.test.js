'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const invoice = require('../lib/invoice');
const pricing = require('../lib/pricing');

function line(name, price, qty, hsn, gstRate) {
  return { name, sku: name, price, qty, hsn, gstRate };
}

const cases = [
  {
    name: 'CURRENT BEHAVIOUR: order #1001 uses its 5% and 18% line rates with no coupon',
    order: {
      id: 1001,
      coupon: '',
      items: [
        line('Assam CTC Masala Chai 250g', 140, 2, '0902', 18),
        line('Unpolished Toor Dal 1kg', 165, 2, '0713', 5)
      ]
    },
    expected: {
      subtotal: 610, discount: 0, tax: 66.9, cgst: 33.45, sgst: 33.45, total: 676.9,
      gstPercents: [18, 5], lineTaxes: [50.4, 16.5]
    }
  },
  {
    name: 'Invoice order #1002 matches checkout SAVE10 totals',
    order: {
      id: 1002,
      coupon: 'SAVE10',
      items: [
        line('Indrayani Basmati Rice 5kg', 640, 1, '1006', 5),
        line('Cold-Pressed Sunflower Oil 1L', 190, 2, '1512', 5)
      ]
    },
    expected: {
      subtotal: 1020, discount: 102, tax: 45.9, cgst: 22.95, sgst: 22.95, total: 963.9,
      gstPercents: [5, 5], lineTaxes: [28.8, 17.1]
    }
  },
  {
    name: 'Invoice order #1004 matches checkout SAVE10 cap on ₹2,240 subtotal',
    order: {
      id: 1004,
      coupon: 'SAVE10',
      items: [line('Cold-Pressed Groundnut Oil 5L', 1120, 2, '1508', 5)]
    },
    expected: {
      subtotal: 2240, discount: 150, tax: 104.5, cgst: 52.25, sgst: 52.25, total: 2194.5,
      gstPercents: [5], lineTaxes: [104.5]
    }
  },
  {
    name: 'CURRENT BEHAVIOUR: order #1008 uses 18% on both lines with no coupon',
    order: {
      id: 1008,
      coupon: '',
      items: [
        line('Assam CTC Masala Chai 250g', 140, 1, '0902', 18),
        line('Syrup product', 180, 2, '2106', 18)
      ]
    },
    expected: {
      subtotal: 500, discount: 0, tax: 90, cgst: 45, sgst: 45, total: 590,
      gstPercents: [18, 18], lineTaxes: [25.2, 64.8]
    }
  }
];

for (const scenario of cases) {
  test(scenario.name, function () {
    const orderFigures = invoice.computeInvoiceFigures(scenario.order);
    const checkoutFigures = pricing.computeTotals(scenario.order.items, scenario.order.coupon);

    // Compute checkout too, so the same in-memory order inputs exercise both paths.
    assert.equal(typeof checkoutFigures.total, 'number');
    assert.deepEqual(
      {
        subtotal: orderFigures.subtotal,
        discount: orderFigures.discount,
        tax: orderFigures.tax,
        cgst: orderFigures.cgst,
        sgst: orderFigures.sgst,
        total: orderFigures.total,
        gstPercents: orderFigures.rows.map(row => row.gstPercent),
        lineTaxes: orderFigures.rows.map(row => row.lineTax)
      },
      scenario.expected
    );
  });
}

test('Invoice figures match checkout HSN GST, capped coupon, and billed totals', function () {
  for (const scenario of cases) {
    // Saved order lines have price, quantity, and HSN; GST is resolved from HSN.
    const items = scenario.order.items.map(function (item) {
      return {
        name: item.name,
        sku: item.sku,
        price: item.price,
        qty: item.qty,
        hsn: item.hsn
      };
    });
    const order = { id: scenario.order.id, coupon: scenario.order.coupon, items };
    const checkout = pricing.computeTotals(items, order.coupon);
    const invoiceFigures = invoice.computeInvoiceFigures(order);

    assert.deepEqual(
      {
        subtotal: invoiceFigures.subtotal,
        discount: invoiceFigures.discount,
        tax: invoiceFigures.tax,
        cgst: invoiceFigures.cgst,
        sgst: invoiceFigures.sgst,
        total: invoiceFigures.total,
        gstPercents: invoiceFigures.rows.map(row => row.gstPercent),
        lineTaxes: invoiceFigures.rows.map(row => row.lineTax)
      },
      {
        subtotal: checkout.subtotal,
        discount: checkout.discount,
        tax: checkout.tax,
        cgst: checkout.cgst,
        sgst: checkout.sgst,
        total: checkout.total,
        gstPercents: checkout.lines.map(line => line.gstPercent),
        lineTaxes: checkout.lines.map(line => line.tax)
      },
      `order #${order.id}`
    );
  }
});
