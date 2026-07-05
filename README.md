# Restricted Product Checkout Validation

Medik8 technical task — Option One. The rule: if the cart has any product tagged
`restricted`, checkout is blocked until the customer confirms they're eligible.

Built as a Checkout UI Extension. All the logic is in
[`extensions/restricted-product-block/src/Checkout.jsx`](extensions/restricted-product-block/src/Checkout.jsx).

A bit of honest context: this was my first time working with Shopify checkout
extensions. I chose to do Option One anyway because it's closer to the real work, and I
wanted to show I'm happy to step outside my comfort zone and pick up something new —
so this doubles as a snapshot of how I learn an unfamiliar area of a platform.

Examples of documentation I followed to assist in learning:
https://shopify.dev/docs/api/checkout-ui-extensions/latest
https://shopify.dev/docs/apps/build/checkout/start-building
https://shopify.dev/docs/apps/build/checkout/cart-checkout-validation/create-client-side-validation

## How it works

Product tags aren't available on cart lines at checkout, so I read the cart lines
and query the Storefront API for each product's tags. If anything in the cart is
tagged `restricted`, a confirmation checkbox appears, and `useBuyerJourneyIntercept`
blocks checkout until it's ticked.

A couple of deliberate choices:

- **It fails closed.** If the tag lookup fails — or hasn't finished when the
  customer hits pay — checkout is blocked rather than risk letting a restricted
  product through. Downside: a hanging lookup keeps checkout blocked.
- **It re-checks when the cart changes**, so a "not restricted" verdict from a
  moment ago can't carry over after something's been added.

## Assumptions

Ticking the checkbox counts as explicit confirmation (it isn't saved to the order),
and the tag is exactly `restricted` — case-insensitive, whitespace trimmed.

## Limitations

The block only runs if the merchant places it in the checkout editor. If the rule
absolutely must never be missed, a Shopify Function (checkout validation) would
enforce it server-side — I went with the UI extension since the task asks for one,
and it allows the confirmation interaction. Blocking progress also needs the
`block_progress` capability, which requires Shopify Plus on a live store.

## What I'd do next

- **Better feedback on failure.** Right now a blocked attempt shows Shopify's error
  banner at the top of checkout, but the checkbox itself doesn't react. I'd set
  state when the intercept blocks and show an inline banner next to the checkbox.
- Move the customer-facing strings into the locale files via `useTranslate`.
- Save the confirmation to the order (e.g. an attribute) for an audit trail.

## Running it

```
cd restricted-checkout-app
npm install
npm run dev
```
