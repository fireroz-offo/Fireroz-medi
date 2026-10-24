// In-app suggestions -> your Gmail (via a free Google Apps Script). Sent ONLY when the user taps "भेजें".
// Exit prompt: shown at most once a week when pressing Back to leave the app; always skippable, never blocks exit.
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { App } from "@capacitor/app";
import { FEEDBACK_URL } from "./config.js";
const K = "fc-fb-v1", DAY = 864e5;
const st = () => { try { return JSON.parse(localStorage.getItem(K) || "{}"); } catch { return {}; } };
const put = s => localStorage.setItem(K, JSON.stringify(s));
const enabled = () => FEEDBACK_URL.startsWith("https://script.google.com/");
const btn = "display:block;width:100%;padding:13px;margin:8px 0;border:0;border-radius:12px;font-size:16px;font-weight:700;";
const shell = html => { const g = document.createElement("div"); g.id = "fc-fb"; g.style.cssText = "position:fixed;inset:0;z-index:100002;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,sans-serif"; g.innerHTML = `<div style="background:#fff;color:#111;border-radius:16px;padding:20px;width:100%;max-width:420px;max-height:90vh;overflow:auto;line-height:1.5">${html}</div>`; document.body.appendChild(g); return g; };
async function post(body) {
  const data = JSON.stringify(body);
  if (Capacitor.isNativePlatform()) { const r = await CapacitorHttp.post({ url: FEEDBACK_URL, headers: { "Content-Type": "text/plain" }, data }); return r.status >= 200 && r.status < 300 && !String(typeof r.data === "string" ? r.data : JSON.stringify(r.data)).includes('"ok":false'); }
  const r = await fetch(FEEDBACK_URL, { method: "POST", headers: { "Content-Type": "text/plain" }, body: data }); return (await r.json()).ok === true;
}
function form() {
  if (!enabled() || document.getElementById("fc-fb")) return;
  const g = shell(`<h3 style="margin-top:0">सुझाव / फीचर रिक्वेस्ट</h3>
<select id="fb-kind" style="width:100%;padding:10px;margin:6px 0;font-size:16px"><option value="feature">नया फीचर चाहिए</option><option value="bug">दिक्कत / गड़बड़</option><option value="other">कुछ और</option></select>
<textarea id="fb-text" maxlength="500" rows="5" placeholder="यहाँ लिखें…" style="width:100%;padding:10px;font-size:16px;box-sizing:border-box"></textarea>
<p style="font-size:13px;color:#444">⚠️ अपना नाम, फोन नंबर, बीमारी या दवाई की जानकारी न लिखें। "भेजें" दबाने पर सिर्फ़ यही लिखा हुआ टेक्स्ट हमें भेजा जाएगा। जवाब नहीं दिया जा सकेगा। <a href="/privacy.html" target="_blank">Privacy Policy</a></p>
<p id="fb-msg" style="color:#b00020;margin:4px 0"></p>
<button id="fb-send" style="${btn}background:#126B50;color:#fff">भेजें</button><button id="fb-x" style="${btn}background:#eee;color:#111">रद्द करें</button>`);
  const msg = m => g.querySelector("#fb-msg").textContent = m;
  g.querySelector("#fb-x").onclick = () => g.remove();
  g.querySelector("#fb-send").onclick = async () => {
    const text = g.querySelector("#fb-text").value.trim(), s = st(), today = new Date().toDateString();
    if (text.length < 5) return msg("कृपया थोड़ा और विस्तार से लिखें।");
    if (s.day === today && (s.n || 0) >= 3) return msg("आज के लिए सीमा पूरी हो गई। कल फिर भेजें।");
    const b = g.querySelector("#fb-send"); b.disabled = true; msg("");
    try {
      if (!(await post({ kind: g.querySelector("#fb-kind").value, text, v: "mvp-2" }))) throw 0;
      put({ ...s, day: today, n: (s.day === today ? s.n || 0 : 0) + 1, lastSent: Date.now() });
      g.querySelector("div").innerHTML = `<h3>धन्यवाद! 🙏</h3><p>आपका सुझाव हमें मिल गया।</p><button id="fb-ok" style="${btn}background:#126B50;color:#fff">ठीक है</button>`; g.querySelector("#fb-ok").onclick = () => g.remove();
    } catch { b.disabled = false; msg("भेज नहीं पाए। इंटरनेट जाँचकर दोबारा कोशिश करें।"); }
  };
}
function exitAsk() {
  const g = shell(`<h3 style="margin-top:0">बाहर निकलने से पहले</h3><p>कोई फीचर चाहिए या कोई दिक्कत आई? हमें बताएँ।</p><button id="fx-yes" style="${btn}background:#126B50;color:#fff">सुझाव दें</button><button id="fx-no" style="${btn}background:#eee;color:#111">बाहर निकलें</button>`);
  g.querySelector("#fx-yes").onclick = () => { g.remove(); form(); };
  g.querySelector("#fx-no").onclick = () => App.exitApp();
}
export const Feedback = {
  enabled, openForm: form,
  initBack() {
    if (!Capacitor.isNativePlatform()) return;
    const s = st(); s.launches = (s.launches || 0) + 1; put(s);
    App.addListener("backButton", ({ canGoBack }) => {
      if (document.getElementById("fc-fb")) return;
      if (canGoBack) return history.back();
      const x = st(), due = enabled() && (x.launches || 0) >= 3 && Date.now() - (x.lastAsk || 0) >= 7 * DAY && Date.now() - (x.lastSent || 0) >= 30 * DAY;
      if (!due) return App.exitApp();
      put({ ...x, lastAsk: Date.now() }); exitAsk();
    });
  }
};
