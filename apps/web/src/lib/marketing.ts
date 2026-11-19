/**
 * STAYflow Marketing: the add-on sold apart from COMPLETE. One payment, no subscription.
 * The price is a first proposal (USD 29 to 49); change it here and the whole page follows.
 */
export const MARKETING_PRICE = 39;

/** Where the buyer enters with the access code. */
export const MARKETING_APP_URL = (process.env.NEXT_PUBLIC_MARKETING_APP_URL ?? "https://stayflow-marketing-nahuelsummerdreams-2754.vercel.app").trim();

/** The payment link once the store exists. While it is empty the page only collects the email. */
export const MARKETING_CHECKOUT_URL = (process.env.NEXT_PUBLIC_MARKETING_CHECKOUT_URL ?? "").trim();
