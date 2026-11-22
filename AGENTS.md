# ShopLedger

## Stack
- Node.js application using Express 4 and body-parser for JSON request parsing.
- Browser UI is static HTML, CSS, and JavaScript served from `public/`.
- Application data is read from and written to `data/db.json` by `lib/store.js`.

## Module map
- `routes/customers.js` — lists Khata customers and settlements; records customer settlements.
- `routes/orders.js` — lists, retrieves, places, and cancels orders.
- `routes/products.js` — lists/searches products and lists active coupons.
- `routes/reports.js` — dashboard and GST reconciliation, pricing preview, and keyed data export.
- `lib/coupons.js` — normalizes, validates, lists, and calculates configured coupon discounts.
- `lib/dates.js` — formats today's date and normalizes date keys; derives fiscal-year labels.
- `lib/inventory.js` — finds products, checks/reserves/releases stock, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable HTML invoices.
- `lib/ledger.js` — finds customers, calculates Khata balances, charges/reverses orders, and records settlements.
- `lib/orders.js` — adds, finds, cancels, and filters orders.
- `lib/pricing.js` — computes order subtotal, coupon discount, per-line GST, and totals.
- `lib/reports.js` — computes dashboard summaries and compares stored order figures with invoice figures.
- `lib/store.js` — reads/writes the JSON database and appends bounded audit history.
- `lib/tax.js` — resolves GST rates from item rate/HSN configuration and splits GST into CGST/SGST.

## Commands
- Start the app: `node server.js` (or `npm start`).
- Run tests: `node --test` (the package does not define a test suite or a working test script).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; they use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
- Invoice total and GST breakdown do not match what the customer was billed.
- Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
