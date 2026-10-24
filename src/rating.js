// Asks for a Play Store rating via Google's official in-app review dialog: after real use, rarely, to everyone equally.
// No incentives, no "do you like the app?" pre-filter, no feature locked behind a rating (Play policy).
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { InAppReview } from "@capacitor-community/in-app-review";
const K = "fc-rate-v1", DAY = 864e5, URL = "https://play.google.com/store/apps/details?id=com.fireroz.care";
const get = () => { try { return { first: Date.now(), launches: 0, asked: 0, last: 0, ...JSON.parse(localStorage.getItem(K) || "{}") }; } catch { return { first: Date.now(), launches: 0, asked: 0, last: 0 }; } };
export const Rating = {
  maybeAsk() {
    const s = get(); s.launches++;
    const due = Capacitor.isNativePlatform() && s.launches >= 5 && Date.now() - s.first >= 7 * DAY && s.asked < 2 && Date.now() - s.last >= 60 * DAY;
    if (due) { s.asked++; s.last = Date.now(); }
    localStorage.setItem(K, JSON.stringify(s));
    if (due) setTimeout(() => InAppReview.requestReview().catch(() => {}), 4000);
  },
  openStore() { Browser.open({ url: URL }).catch(() => window.open(URL, "_blank")); }
};
