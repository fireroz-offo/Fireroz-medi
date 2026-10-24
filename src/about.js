// "About the app" screen. Edit the lists below to change what users see.
const NOW = ["परिवार के सदस्य जोड़ना", "दवाई और खुराक का समय तय करना", "दवाई के रिमाइंडर नोटिफिकेशन", "खुराक ली/छूटी का रिकॉर्ड", "अपॉइंटमेंट, स्वास्थ्य रिकॉर्ड और फोटो/फाइल सहेजना", "रिपोर्ट, बैकअप बनाना और वापस लाना", "सारा डेटा एक बटन से मिटाना"];
const USEFUL = ["घर के बुज़ुर्गों की दवाई समय पर याद रखने के लिए", "कई सदस्यों की दवाइयाँ एक ही जगह देखने के लिए", "डॉक्टर के पास जाते समय पुराने रिकॉर्ड साथ रखने के लिए"];
// Only list features you really plan. Keep wording as "planned" — never promise dates or medical outcomes.
const FUTURE = ["अलग-अलग फोन पर परिवार के साथ अनुमति से सुरक्षित शेयरिंग", "क्लाउड बैकअप और सिंक (आपकी अलग सहमति के बाद)", "और भारतीय भाषाएँ", "बेहतर रिपोर्ट और चार्ट", "ज़्यादा रिमाइंडर विकल्प"];
import { FEEDBACK_URL } from "./config.js";
if (FEEDBACK_URL) NOW.push("ऐप से सीधे सुझाव/फीचर रिक्वेस्ट भेजना");
const KEY = "fc-about-v1";
const li = a => a.map(t => `<li>${t}</li>`).join("");
function render(done) {
  const g = document.createElement("div");
  g.style.cssText = "position:fixed;inset:0;z-index:100001;background:#fff;overflow:auto;padding:24px;font-family:system-ui,sans-serif;line-height:1.55";
  g.innerHTML = `<h2>Fireroz Care के बारे में</h2><p>परिवार की दवाइयों, रिमाइंडर और स्वास्थ्य रिकॉर्ड को एक जगह रखने का सरल टूल।</p>
<h3>अभी उपलब्ध</h3><ul>${li(NOW)}</ul>
<h3>किसके काम आएगा</h3><ul>${li(USEFUL)}</ul>
<h3>आने वाले फीचर <small>(अभी उपलब्ध नहीं — बदल सकते हैं)</small></h3><ul>${li(FUTURE)}</ul>
<h3>ध्यान रखें</h3><ul><li>यह रिकॉर्ड और रिमाइंडर टूल है, डॉक्टर की सलाह या इलाज नहीं।</li><li>रिमाइंडर फोन की सेटिंग से देर/मिस हो सकते हैं।</li><li>डेटा सिर्फ़ आपके फोन में रहता है; बैकअप बनाकर रखें।</li></ul>
<button id="ab-ok" style="display:block;width:100%;padding:14px;margin-top:16px;border:0;border-radius:12px;background:#126B50;color:#fff;font-size:16px;font-weight:700">समझ गया, शुरू करें</button>`;
  document.body.appendChild(g); g.querySelector("#ab-ok").onclick = () => { g.remove(); done(); };
}
export const About = {
  run() { return new Promise(res => { if (localStorage.getItem(KEY)) return res(); render(() => { localStorage.setItem(KEY, "1"); res(); }); }); },
  show() { render(() => {}); }
};
