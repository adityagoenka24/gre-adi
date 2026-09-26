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
 *     Category: Add to cart · Count: One · Value: ₹399 · Window: 30 days
 *
 *   Action 3: "Purchase"
 *     Category: Purchase · Count: One · Value: use the actual amount paid
 *     (₹399 / ₹499 / ₹599 / ₹799 / ₹899 / ₹999 depending on plan) · Window: 30 days
 *
 * Step 3 — Copy each conversion ID (looks like AW-123456789/AbCdEfGhIjK)
 *   and paste into the conversions object below.
 *
 * Step 4 — Save and push to GitHub. That's it.
 * ─────────────────────────────────────────────────────────────────────────────
 */
window.GQP_ADS = {

  // Your Google Ads Tag ID — replace AW-REPLACE_ME with your real ID
  googleAdsId: 'AW-18184272300',

  // Conversion action IDs — replace each AW-REPLACE_ME/REPLACE_ME pair
  conversions: {
    mock_started:        'AW-18184272300/wiDiCI6Hn7IcEKzz995D',  // "Mock Lead"
    buy_pro_clicked:     'AW-18184272300/HlWzCO66nrIcEKzz995D',  // "Purchase Intent - Pro"
    purchase_completed:  'AW-18184272300/Z051CICan7IcEKzz995D',  // "Purchase" (fires on thank-you page)
  },

  // Purchase values by plan — used when firing the purchase conversion
  values: {
    sectional: 399,
    practice: 499,
    mocks: 599,
    practice_sectional: 799,
    sectional_mocks: 899,
    full: 999,
  },

  // Currency
  currency: 'INR',
};
