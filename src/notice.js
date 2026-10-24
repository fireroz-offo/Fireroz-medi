// First-run notice: data stays on this phone. 18+ and understanding are confirmed before use.
const K = "fc-notice-v1";
export const Notice = { run() { return new Promise(res => {
  if (localStorage.getItem(K)) return res();
  const g = document.createElement("div");
  g.style.cssText = "position:fixed;inset:0;z-index:100000;background:#fff;overflow:auto;padding:24px;font-family:system-ui,sans-serif;line-height:1.55";
  g.innerHTML = `<h2>Fireroz Care — ज़रूरी बातें</h2>
<p>• आपका सारा डेटा (दवाइयाँ, रिकॉर्ड, फोटो) <b>सिर्फ़ आपके फोन में</b> रहता है। हम इसे इकट्ठा नहीं करते और कहीं भेजते नहीं। सिर्फ़ जब आप खुद "सुझाव भेजें" दबाकर कुछ लिखते हैं, वही टेक्स्ट हमें जाता है। कोई लॉगिन, विज्ञापन या एनालिटिक्स नहीं।</p>
<p>• फोन खोने, ऐप हटाने या डेटा क्लियर करने पर डेटा चला जाएगा। रिपोर्ट पेज से <b>बैकअप</b> बनाकर रखें।</p>
<p>• यह सिर्फ़ रिकॉर्ड और रिमाइंडर टूल है। यह डॉक्टर की सलाह, जाँच या इलाज नहीं है। रिमाइंडर फोन की सेटिंग (बैटरी सेवर आदि) से देर या मिस हो सकते हैं। आपातकाल में 112 पर कॉल करें।</p>
<p>• ऐप सिर्फ़ 18 वर्ष या उससे अधिक उम्र के लिए है।</p>
<p><a href="/privacy.html" target="_blank">Privacy Policy</a></p>
<label style="display:block;margin:12px 0"><input type="checkbox" id="n-ok"> मैं 18+ हूँ और ऊपर की बातें समझ गया/गई हूँ।</label>
<button id="n-go" disabled style="display:block;width:100%;padding:14px;border:0;border-radius:12px;background:#126B50;color:#fff;font-size:16px;font-weight:700">आगे बढ़ें</button>`;
  document.body.appendChild(g);
  const ok = g.querySelector("#n-ok"), go = g.querySelector("#n-go"); ok.onchange = () => go.disabled = !ok.checked;
  go.onclick = () => { localStorage.setItem(K, new Date().toISOString()); g.remove(); res(); };
}); } };
