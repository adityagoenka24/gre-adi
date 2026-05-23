/**
 * GRE Quant Pro — Ads Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO FILL THIS IN (takes ~10 minutes after creating your Google Ads account):
 *
 * Step 1 — Get your Google Ads Tag ID:
 *   Google Ads → Tools & Settings → Measurement → Conversions → Tag Setup
 *   Copy the ID that looks like: AW-123456789
 *   Paste it into googleAdsId below.
 *
 * Step 2 — Create 3 conversion actions in Google Ads:
 *   Google Ads → Goals → Conversions → + New Conversion Action → Website
 *
 *   Action 1: "Mock Lead"
 *     Category: Lead · Count: One · Value: ₹0 · Window: 30 days
 *
 *   Action 2: "Purchase Intent - Pro"
 *     Category: Add to cart · Count: One · Value: ₹999 · Window: 30 days
 *
 *   Action 3: "Purchase"
 *     Category: Purchase · Count: One · Value: use different values for each
 *     (Pro = ₹999, Coach = ₹1499) · Window: 30 days
 *
 * Step 3 — Copy each conversion ID (looks like AW-123456789/AbCdEfGhIjK)
 *   and paste into the conversions object below.
 *
 * Step 4 — Save and push to GitHub. That's it.
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.GQP_ADS = {

  // Your Google Ads Tag ID — replace AW-REPLACE_ME with your real ID
  googleAdsId: 'AW-REPLACE_ME',

  // Conversion action IDs — replace each AW-REPLACE_ME/REPLACE_ME pair
  conversions: {
    mock_started:        'AW-REPLACE_ME/REPLACE_ME',  // "Mock Lead"
    buy_pro_clicked:     'AW-REPLACE_ME/REPLACE_ME',  // "Purchase Intent - Pro"
    purchase_completed:  'AW-REPLACE_ME/REPLACE_ME',  // "Purchase" (fires on thank-you page)
  },

  // Purchase values by plan — used when firing the purchase conversion
  values: {
    pro:   999,
    coach: 1499,
  },

  // Currency
  currency: 'INR',
};
