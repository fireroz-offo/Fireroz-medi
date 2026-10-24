// Health Report: build from app data -> draw pages on canvas (Hindi-safe) -> PDF -> save to Downloads -> open.
import { Capacitor, registerPlugin } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import { icon, toast, prefersReduced } from "./ui.js";

export const SaveFile = registerPlugin("SaveFile");
const isNative = () => { try { return Capacitor.isNativePlatform(); } catch { return false; } };
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
export const ymd = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const DAYS = ["र", "सो", "मं", "बु", "गु", "शु", "श"];
const timesOf = m => (m.times || "").split(",").map(t => t.trim()).filter(Boolean);
const wait = ms => new Promise(r => setTimeout(r, ms));

/* ------------------------------------------------------------------ data */
export function computeReport(data, member = "all") {
  const inM = n => member === "all" || (n || "आप") === member;
  const meds = data.medicines.filter(m => inM(m.member));
  const ids = new Set(meds.map(m => m.id));
  const now = new Date(), todayStr = ymd(now);
  const days = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate() - i); days.push({ date: ymd(d), label: DAYS[d.getDay()], taken: 0, missed: 0 }); }
  data.doses.forEach(x => {
    if (!ids.has(x.medicineId)) return;
    const row = days.find(d => d.date === x.date);
    if (!row) return;
    if (x.status === "taken") row.taken++; else if (x.status === "missed") row.missed++;
  });
  const taken7 = days.reduce((n, d) => n + d.taken, 0), missed7 = days.reduce((n, d) => n + d.missed, 0);
  const score = taken7 + missed7 > 0 ? Math.round(taken7 * 100 / (taken7 + missed7)) : null;
  const stat = (m, t) => data.doses.find(x => x.key === [m.id, todayStr, t, m.member || "आप"].join("|"))?.status || "pending";
  const todayRows = [];
  meds.forEach(m => timesOf(m).forEach(t => todayRows.push({ name: m.name || "", dose: m.dose || "", time: t, member: m.member || "आप", status: stat(m, t) })));
  todayRows.sort((a, b) => a.time.localeCompare(b.time));
  const tTaken = todayRows.filter(r => r.status === "taken").length;
  const tMissed = todayRows.filter(r => r.status === "missed").length;
  const tPending = todayRows.length - tTaken - tMissed;
  const appts = data.appointments.filter(a => inM(a.member) && (a.date || "") >= todayStr)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 6);
  const recs = data.records.filter(r => !r.doseKey && inM(r.member))
    .sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 8);
  let label = "शुरू करें", tone = "gray", desc = "दवाई जोड़ें और हर खुराक पर ‘ले ली’ या ‘नहीं ली’ दबाएँ — तब आपका स्कोर बनेगा।";
  if (score !== null) {
    if (score >= 80) { label = "बहुत अच्छा"; tone = "good"; desc = "पिछले 7 दिनों में ज़्यादातर खुराक समय पर ली गईं। इसे ऐसे ही जारी रखें।"; }
    else if (score >= 50) { label = "ठीक-ठाक"; tone = "mid"; desc = "कुछ खुराक छूट रही हैं। रिमाइंडर चालू रखें और समय पर दवाई लें।"; }
    else { label = "ध्यान दें"; tone = "low"; desc = "कई खुराक छूटी हैं। रिमाइंडर जाँचें; ज़रूरत हो तो डॉक्टर या फार्मासिस्ट से बात करें।"; }
  }
  const insights = [];
  if (!meds.length) insights.push("अभी कोई दवाई दर्ज नहीं है।");
  else {
    insights.push(`आज कुल ${todayRows.length} खुराक: ${tTaken} ली गईं, ${tPending} बाकी, ${tMissed} छूटीं।`);
    if (score !== null) insights.push(`पिछले 7 दिनों में ${taken7} खुराक ली गईं और ${missed7} छूटीं।`);
  }
  if (appts[0]) insights.push(`अगला अपॉइंटमेंट: ${appts[0].date} ${appts[0].time || ""} — ${appts[0].doctor || "डॉक्टर"}।`);
  else insights.push("अभी कोई आने वाला अपॉइंटमेंट नहीं है।");
  insights.push(recs.length ? `${recs.length} स्वास्थ्य रिकॉर्ड/रिपोर्ट सुरक्षित हैं।` : "कोई स्वास्थ्य रिकॉर्ड नहीं जोड़ा गया है।");
  const tips = ["रिमाइंडर चालू रखें और नोटिफिकेशन की अनुमति दें।", "हर खुराक के बाद ऐप में ‘ले ली’ दर्ज करें।", "डॉक्टर की पर्ची और रिपोर्ट की फोटो/PDF रिकॉर्ड में जोड़ें।", "नियमित स्वास्थ्य जाँच के लिए डॉक्टर से मिलें।", "बैकअप बनाकर सुरक्षित जगह रखें।"];
  const famCount = member === "all" ? data.family.length : 1;
  return { member, memberLabel: member === "all" ? "पूरा परिवार" : member, dateLabel: now.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }), todayStr, days, score, label, tone, desc, todayRows, tTaken, tMissed, tPending, meds, appts, recs, insights, tips, famCount, taken7, missed7 };
}

/* ---------------------------------------------------------- canvas pages */
const W = 1240, H = 1754, M = 70;
const FONT = '"Noto Sans Devanagari","Noto Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
const C = { green: "#0E7A5F", green2: "#19A37F", dark: "#0B4F3F", text: "#172B24", muted: "#66756D", light: "#EAF6F0", border: "#DDE9E2", red: "#C0392B", orange: "#C77712", blue: "#1B6FE0" };
const TONE = { good: "#19A37F", mid: "#E5A100", low: "#D9534F", gray: "#9AA7A0" };

function loadImg(src) {
  return new Promise(res => { const i = new Image(); const t = setTimeout(() => res(null), 2500); i.onload = () => { clearTimeout(t); res(i); }; i.onerror = () => { clearTimeout(t); res(null); }; i.src = src; });
}

export async function drawReportPages(r) {
  const logo = await loadImg("/logo.png");
  const pages = [];
  let c, x, y;
  const font = (size, weight = 400) => { x.font = `${weight} ${size}px ${FONT}`; };
  const rr = (px, py, w, h, rad, fill, stroke) => {
    x.beginPath(); x.moveTo(px + rad, py); x.arcTo(px + w, py, px + w, py + h, rad); x.arcTo(px + w, py + h, px, py + h, rad); x.arcTo(px, py + h, px, py, rad); x.arcTo(px, py, px + w, py, rad); x.closePath();
    if (fill) { x.fillStyle = fill; x.fill(); }
    if (stroke) { x.strokeStyle = stroke; x.lineWidth = 2; x.stroke(); }
  };
  const txt = (s, px, py, size, weight, color, align = "left") => { font(size, weight); x.fillStyle = color; x.textAlign = align; x.textBaseline = "alphabetic"; x.fillText(String(s), px, py); };
  const fit = (s, maxW, size, weight) => { s = String(s ?? ""); font(size, weight); if (x.measureText(s).width <= maxW) return s; while (s.length > 1 && x.measureText(s + "…").width > maxW) s = s.slice(0, -1); return s + "…"; };
  const wrap = (s, maxW, size, weight) => {
    font(size, weight); const out = []; let line = "";
    String(s).split(/\s+/).forEach(w => {
      const t = line ? line + " " + w : w;
      if (x.measureText(t).width <= maxW) line = t;
      else { if (line) out.push(line); line = w; while (x.measureText(line).width > maxW && line.length > 1) { let k = line.length - 1; while (k > 1 && x.measureText(line.slice(0, k)).width > maxW) k--; out.push(line.slice(0, k)); line = line.slice(k); } }
    });
    if (line) out.push(line); return out;
  };
  const newPage = () => {
    c = document.createElement("canvas"); c.width = W; c.height = H; x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); pages.push(c);
    if (pages.length === 1) { y = 0; return; }
    x.fillStyle = C.green; x.fillRect(0, 0, W, 14);
    txt("Fireroz Care  •  स्वास्थ्य रिपोर्ट  •  " + r.memberLabel, M, 62, 24, 600, C.muted);
    y = 100;
  };
  const ensure = h => { if (y + h > H - 130) newPage(); };
  const section = (title) => {
    ensure(240); y += 64; rr(M, y - 34, 10, 44, 5, C.green2);
    txt(title, M + 28, y, 38, 700, C.dark); y += 34;
  };

  newPage();
  // ---- header band
  const g = x.createLinearGradient(0, 0, W, 330); g.addColorStop(0, C.dark); g.addColorStop(1, C.green2);
  x.fillStyle = g; x.fillRect(0, 0, W, 330);
  rr(M, 66, 140, 140, 32, "#fff");
  if (logo) x.drawImage(logo, M + 16, 82, 108, 108);
  txt("Health Report", M + 176, 128, 72, 800, "#fff");
  txt("स्वास्थ्य रिपोर्ट  •  Fireroz Care", M + 178, 184, 34, 500, "rgba(255,255,255,.85)");
  txt(r.dateLabel, W - M, 110, 34, 700, "#fff", "right");
  txt("सदस्य: " + fit(r.memberLabel, 420, 30, 500), W - M, 160, 30, 500, "rgba(255,255,255,.9)", "right");
  txt("सिर्फ़ इसी फोन के डेटा से बनी", W - M, 202, 24, 400, "rgba(255,255,255,.75)", "right");
  y = 330;

  // ---- score card
  y += 40; const cardH = 300;
  rr(M, y, W - 2 * M, cardH, 36, "#F4FAF7", C.border);
  const cx = M + 190, cy = y + cardH / 2, R = 96;
  x.lineWidth = 28; x.lineCap = "round"; x.strokeStyle = "#DCEBE3"; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.stroke();
  if (r.score !== null && r.score > 0) { x.strokeStyle = TONE[r.tone]; x.beginPath(); x.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * r.score / 100); x.stroke(); }
  txt(r.score === null ? "—" : r.score, cx, cy + 20, 74, 800, C.dark, "center");
  txt("/100", cx, cy + 62, 28, 500, C.muted, "center");
  const tx = M + 360;
  txt("ओवरऑल केयर स्कोर", tx, y + 82, 42, 800, C.text);
  font(28, 700); const pw = x.measureText(r.label).width + 52;
  rr(tx, y + 106, pw, 52, 26, TONE[r.tone]); txt(r.label, tx + pw / 2, y + 143, 28, 700, "#fff", "center");
  wrap(r.desc, W - M - tx - 36, 27, 400).slice(0, 3).forEach((l, i) => txt(l, tx, y + 206 + i * 38, 27, 400, C.muted));
  y += cardH;

  // ---- today tiles
  y += 30; const gap = 22, tw = (W - 2 * M - gap * 3) / 4;
  [["आज की खुराक", r.todayRows.length, "#FDECEC", C.red], ["ली गईं", r.tTaken, "#E6F6EE", C.green], ["बाकी", r.tPending, "#FFF3DF", C.orange], ["छूटीं", r.tMissed, "#EDE9FB", "#6A4FD1"]].forEach((t, i) => {
    const px = M + i * (tw + gap); rr(px, y, tw, 150, 28, t[2]);
    txt(t[0], px + 26, y + 52, 26, 600, C.muted); txt(t[1], px + 26, y + 118, 62, 800, t[3]);
  });
  y += 150;

  // ---- 7 day chart
  section("पिछले 7 दिन की खुराक");
  const ch = 280; rr(M, y, W - 2 * M, ch, 30, "#fff", C.border);
  const maxV = Math.max(1, ...r.days.map(d => d.taken + d.missed)), baseY = y + ch - 62, topY = y + 54, bw = 70, step = (W - 2 * M - 80) / 7;
  r.days.forEach((d, i) => {
    const bx = M + 40 + i * step + (step - bw) / 2, hT = (baseY - topY) * d.taken / maxV, hM = (baseY - topY) * d.missed / maxV;
    rr(bx, baseY - 6, bw, 6, 3, "#E6EEE9");
    if (hT > 0) rr(bx, baseY - hT, bw, hT, 10, C.green2);
    if (hM > 0) rr(bx, baseY - hT - hM - (hT ? 4 : 0), bw, hM, 10, "#E86A5E");
    if (d.taken + d.missed > 0) txt(d.taken + d.missed, bx + bw / 2, baseY - hT - hM - 14, 24, 700, C.text, "center");
    txt(d.label, bx + bw / 2, y + ch - 22, 26, 600, d.date === r.todayStr ? C.green : C.muted, "center");
  });
  y += ch;
  rr(M + 40, y + 24, 22, 22, 6, C.green2); txt("ली गईं", M + 74, y + 43, 24, 500, C.muted);
  rr(M + 200, y + 24, 22, 22, 6, "#E86A5E"); txt("छूटीं", M + 234, y + 43, 24, 500, C.muted);
  y += 50;

  // ---- medicines table
  section("दवाइयाँ — आज की स्थिति");
  const cols = [["दवाई", 0.34], ["डोज़", 0.18], ["समय", 0.14], ["सदस्य", 0.18], ["आज", 0.16]], tW = W - 2 * M;
  const colX = []; { let a = M + 20; cols.forEach(cc => { colX.push(a); a += tW * cc[1]; }); }
  ensure(150); rr(M, y, tW, 62, 16, C.light);
  cols.forEach((cc, i) => txt(cc[0], colX[i], y + 41, 25, 700, C.dark)); y += 62;
  if (!r.todayRows.length) { ensure(80); txt("कोई दवाई दर्ज नहीं है।", M + 20, y + 52, 28, 400, C.muted); y += 80; }
  r.todayRows.forEach((row, k) => {
    ensure(70); if (k % 2) rr(M, y, tW, 66, 12, "#FAFCFB");
    const st = row.status === "taken" ? ["ले ली", C.green] : row.status === "missed" ? ["नहीं ली", C.red] : ["बाकी", C.orange];
    txt(fit(row.name, tW * 0.34 - 24, 27, 600), colX[0], y + 44, 27, 600, C.text);
    txt(fit(row.dose || "—", tW * 0.18 - 20, 26, 400), colX[1], y + 44, 26, 400, C.muted);
    txt(row.time, colX[2], y + 44, 26, 500, C.text);
    txt(fit(row.member, tW * 0.18 - 20, 26, 400), colX[3], y + 44, 26, 400, C.muted);
    txt(st[0], colX[4], y + 44, 26, 700, st[1]); y += 66;
  });

  // ---- appointments
  section("आने वाले अपॉइंटमेंट");
  if (!r.appts.length) { ensure(70); txt("कोई आने वाला अपॉइंटमेंट नहीं।", M + 20, y + 44, 28, 400, C.muted); y += 70; }
  r.appts.forEach(a => {
    ensure(100); rr(M, y, tW, 86, 20, "#fff", C.border); rr(M + 18, y + 18, 50, 50, 14, "#E8F1FF");
    x.strokeStyle = C.blue; x.lineWidth = 4; x.lineCap = "round"; x.strokeRect(M + 30, y + 31, 26, 24); x.beginPath(); x.moveTo(M + 30, y + 40); x.lineTo(M + 56, y + 40); x.moveTo(M + 36, y + 27); x.lineTo(M + 36, y + 34); x.moveTo(M + 50, y + 27); x.lineTo(M + 50, y + 34); x.stroke();
    txt(fit((a.doctor || "डॉक्टर") + (a.reason ? " — " + a.reason : ""), tW - 330, 28, 600), M + 90, y + 40, 28, 600, C.text);
    txt(fit((a.member || "आप"), tW - 330, 24, 400), M + 90, y + 72, 24, 400, C.muted);
    txt((a.date || "") + "  " + (a.time || ""), W - M - 24, y + 52, 26, 700, C.dark, "right"); y += 100;
  });

  // ---- records
  section("स्वास्थ्य रिकॉर्ड");
  if (!r.recs.length) { ensure(70); txt("कोई रिकॉर्ड नहीं जोड़ा गया।", M + 20, y + 44, 28, 400, C.muted); y += 70; }
  r.recs.forEach(rc => {
    ensure(100); rr(M, y, tW, 86, 20, "#fff", C.border); rr(M + 18, y + 18, 50, 50, 14, "#E6F6EE");
    x.strokeStyle = C.green; x.lineWidth = 4; x.lineCap = "round"; x.beginPath(); [34, 43, 52].forEach(o => { x.moveTo(M + 31, y + o); x.lineTo(M + 55, y + o); }); x.stroke();
    txt(fit(rc.title || "रिकॉर्ड", tW - 330, 28, 600), M + 90, y + 40, 28, 600, C.text);
    txt(fit((rc.member || "आप") + " · " + (rc.recordType || "मेडिकल रिकॉर्ड"), tW - 330, 24, 400), M + 90, y + 72, 24, 400, C.muted);
    txt(rc.date || "", W - M - 24, y + 52, 26, 700, C.dark, "right"); y += 100;
  });

  // ---- insights + tips
  const bullets = (title, list, col) => {
    section(title);
    list.forEach(s => {
      const lines = wrap(s, tW - 90, 28, 400), h = lines.length * 40 + 22; ensure(h + 10);
      x.beginPath(); x.arc(M + 22, y + 24, 16, 0, Math.PI * 2); x.fillStyle = col; x.fill();
      x.strokeStyle = "#fff"; x.lineWidth = 4; x.lineCap = "round"; x.lineJoin = "round"; x.beginPath(); x.moveTo(M + 14, y + 24); x.lineTo(M + 20, y + 30); x.lineTo(M + 31, y + 18); x.stroke();
      lines.forEach((l, i) => txt(l, M + 60, y + 33 + i * 40, 28, 400, C.text)); y += h;
    });
  };
  bullets("सारांश", r.insights, C.green2);
  bullets("सुझाव", r.tips, C.blue);

  // ---- disclaimer
  ensure(170); y += 30; rr(M, y, tW, 130, 22, "#FFF7E8");
  wrap("यह रिपोर्ट सिर्फ़ आपके द्वारा ऐप में दर्ज जानकारी पर आधारित है। यह डॉक्टर की सलाह, जाँच या इलाज का विकल्प नहीं है। केयर स्कोर केवल दवाई की नियमितता दिखाता है, सेहत का चिकित्सीय आकलन नहीं।", tW - 56, 24, 400)
    .slice(0, 3).forEach((l, i) => txt(l, M + 28, y + 46 + i * 34, 24, 400, "#7A5A1E"));
  y += 130;

  // ---- footers
  pages.forEach((pc, i) => {
    const cx2 = pc.getContext("2d"); cx2.fillStyle = C.border; cx2.fillRect(M, H - 96, W - 2 * M, 2);
    cx2.font = `500 24px ${FONT}`; cx2.fillStyle = C.muted; cx2.textBaseline = "alphabetic";
    cx2.textAlign = "left"; cx2.fillText("Fireroz Care  •  आपके फोन में सुरक्षित", M, H - 52);
    cx2.textAlign = "right"; cx2.fillText(`पेज ${i + 1}/${pages.length}`, W - M, H - 52);
  });
  return pages;
}

/* ------------------------------------------------------------------- PDF */
export function pdfFromJpegs(pages) {
  const enc = new TextEncoder(), chunks = [], offs = []; let len = 0;
  const push = b => { const u = typeof b === "string" ? enc.encode(b) : b; chunks.push(u); len += u.length; };
  const PW = 595.28, PH = 841.89, n = pages.length, total = 2 + n * 3;
  push("%PDF-1.4\n"); push(new Uint8Array([37, 226, 227, 207, 211, 10]));
  const obj = (id, parts) => { offs[id] = len; push(id + " 0 obj\n"); parts.forEach(push); push("\nendobj\n"); };
  obj(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  obj(2, [`<< /Type /Pages /Kids [${pages.map((_, i) => (3 + i * 3) + " 0 R").join(" ")}] /Count ${n} >>`]);
  pages.forEach((p, i) => {
    const pid = 3 + i * 3, cid = pid + 1, iid = pid + 2, cs = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`;
    obj(pid, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${iid} 0 R >> >> /Contents ${cid} 0 R >>`]);
    obj(cid, [`<< /Length ${cs.length} >>\nstream\n`, cs, "\nendstream"]);
    obj(iid, [`<< /Type /XObject /Subtype /Image /Width ${p.w} /Height ${p.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.bytes.length} >>\nstream\n`, p.bytes, "\nendstream"]);
  });
  const xref = len; push(`xref\n0 ${total + 1}\n0000000000 65535 f \n`);
  for (let id = 1; id <= total; id++) push(String(offs[id]).padStart(10, "0") + " 00000 n \n");
  push(`trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(len); let o = 0; chunks.forEach(u => { out.set(u, o); o += u.length; }); return out;
}
const b64ToBytes = b64 => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; };
const bytesToB64 = u => { let s = ""; for (let i = 0; i < u.length; i += 8192) s += String.fromCharCode.apply(null, u.subarray(i, i + 8192)); return btoa(s); };
export const canvasesToJpegs = cs => cs.map(c => { const url = c.toDataURL("image/jpeg", 0.9); return { w: c.width, h: c.height, url, bytes: b64ToBytes(url.split(",")[1]) }; });

/* ------------------------------------------------------- save / open / share */
export async function saveFile(name, mime, bytes) {
  if (!isNative()) {
    const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
    const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    return { where: "Downloads", uri: url, name, mime, native: false };
  }
  const b64 = bytesToB64(bytes); let where = null, uri = null, why = "";
  try { const r = await SaveFile.saveToDownloads({ name, data: b64, mime }); where = "Downloads"; uri = (r && r.uri) || null; }
  catch (e) { why = String((e && e.message) || e); }
  if (!where) {
    try { try { await Filesystem.requestPermissions(); } catch (e0) { } await Filesystem.writeFile({ path: name, data: b64, directory: Directory.Documents, recursive: true }); where = "Documents"; }
    catch (e) { why += " | " + String((e && e.message) || e); }
  }
  return { where, uri, name, mime, native: true, b64, why };
}
export async function openSaved(res) {
  if (!res) return false;
  if (!res.native) { try { window.open(res.uri, "_blank"); return true; } catch { return false; } }
  if (!res.uri) return false;
  try { await SaveFile.openFile({ uri: res.uri, mime: res.mime }); return true; } catch { return false; }
}
export async function shareSaved(name, mime, bytes) {
  if (!isNative()) {
    try { if (navigator.share) { await navigator.share({ title: name, files: [new File([bytes], name, { type: mime })] }); return true; } } catch { }
    return false;
  }
  try {
    await Filesystem.writeFile({ path: name, data: bytesToB64(bytes), directory: Directory.Cache });
    const { uri } = await Filesystem.getUri({ path: name, directory: Directory.Cache });
    try { await Share.share({ title: name, files: [uri], dialogTitle: "रिपोर्ट शेयर करें" }); }
    catch (e) { if (/cancel/i.test(String((e && e.message) || e))) return true; await Share.share({ title: name, url: uri, dialogTitle: "रिपोर्ट शेयर करें" }); }
    return true;
  } catch (e) { return /cancel/i.test(String((e && e.message) || e)); }
}

/* --------------------------------------------------------------- overlays */
function closeEl(el) { if (!el || el.dataset.closing) return; el.dataset.closing = "1"; el.classList.add("closing"); setTimeout(() => el.remove(), prefersReduced() ? 0 : 260); }

export function openViewer(title, images, onSave) {
  const v = document.createElement("div"); v.className = "viewer";
  v.innerHTML = `<div class="viewer-bar"><button class="icon-btn" data-x aria-label="बंद करें">${icon("back", 22)}</button><b>${esc(title)}</b>${onSave ? `<button class="icon-btn" data-save aria-label="सेव करें">${icon("download", 22)}</button>` : "<span></span>"}</div><div class="viewer-body">${images.map((s, i) => `<img src="${s}" alt="पेज ${i + 1}" style="--i:${i}">`).join("")}</div>`;
  document.body.appendChild(v);
  v.querySelector("[data-x]").onclick = () => closeEl(v);
  const sv = v.querySelector("[data-save]"); if (sv) sv.onclick = onSave;
}

function sheetShell() {
  const o = document.createElement("div"); o.className = "sheet-overlay";
  o.innerHTML = `<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-grab"></div><div class="sheet-body"></div></div>`;
  document.body.appendChild(o);
  return { o, body: o.querySelector(".sheet-body") };
}
const STEPS = ["डेटा इकट्ठा किया", "रिपोर्ट के पेज बनाए", "PDF तैयार की", "फोन में सेव की"];

export async function downloadReport(data, member = "all") {
  const { o, body } = sheetShell();
  const CIRC = 2 * Math.PI * 54;
  body.innerHTML = `
    <div class="dl-ring"><svg viewBox="0 0 120 120" width="132" height="132"><circle cx="60" cy="60" r="54" class="dl-bg"/><circle cx="60" cy="60" r="54" class="dl-fg" style="stroke-dasharray:${CIRC};stroke-dashoffset:${CIRC}"/></svg>
      <div class="dl-center"><span class="dl-pct">0</span><small>%</small></div><div class="dl-doc">${icon("file", 26)}</div></div>
    <h3 class="dl-title">रिपोर्ट बन रही है…</h3><p class="dl-sub">कृपया ऐप बंद न करें</p>
    <ul class="dl-steps">${STEPS.map((s, i) => `<li data-s="${i}"><span class="dl-dot"></span>${s}</li>`).join("")}</ul>`;
  const fg = body.querySelector(".dl-fg"), pct = body.querySelector(".dl-pct");
  const setP = p => { fg.style.strokeDashoffset = String(CIRC * (1 - p / 100)); pct.textContent = Math.round(p); };
  const step = (i, st) => { const li = body.querySelector(`[data-s="${i}"]`); if (li) li.className = st; };
  let pages = null, jpegs = null, pdfBytes = null, saved = null, name = "";
  try {
    step(0, "active"); setP(8); await wait(450); step(0, "done");
    const rep = computeReport(data, member);
    step(1, "active"); setP(25); await wait(120);
    pages = await drawReportPages(rep); setP(55); await wait(350); step(1, "done");
    step(2, "active"); setP(70); await wait(120);
    jpegs = canvasesToJpegs(pages); pdfBytes = pdfFromJpegs(jpegs); setP(85); await wait(350); step(2, "done");
    const d = new Date(); name = `Fireroz-Health-Report-${ymd(d)}-${pad(d.getHours())}${pad(d.getMinutes())}.pdf`;
    step(3, "active"); saved = await saveFile(name, "application/pdf", pdfBytes);
    if (!saved.where) throw new Error("save-failed " + (saved.why || ""));
    setP(100); await wait(400); step(3, "done"); await wait(300);
  } catch (e) {
    console.error("report error", e);
    const canView = !!(jpegs || pages);
    body.innerHTML = `<div class="dl-result err"><div class="dl-badge">${icon("alert", 40)}</div><h3 class="dl-title">PDF फोन में सेव नहीं हो पाई</h3>
      <p class="dl-sub">चिंता न करें — आप रिपोर्ट ऐप में देख सकते हैं या फिर से कोशिश कर सकते हैं।</p>
      <div class="dl-actions">${canView ? `<button class="btn primary" data-view>${icon("eye", 20)} ऐप में देखें</button>` : ""}<button class="btn soft" data-retry>${icon("download", 20)} फिर कोशिश करें</button><button class="btn ghost" data-close>बंद करें</button></div></div>`;
    body.querySelector("[data-close]").onclick = () => closeEl(o);
    body.querySelector("[data-retry]").onclick = () => { closeEl(o); setTimeout(() => downloadReport(data, member), 280); };
    const vb = body.querySelector("[data-view]"); if (vb) vb.onclick = () => openViewer("हेल्थ रिपोर्ट", (jpegs || canvasesToJpegs(pages)).map(j => j.url));
    return;
  }
  const where = saved.where === "Downloads" ? "Downloads" : "Documents";
  const parts = Array.from({ length: 14 }, (_, i) => `<i style="--a:${i * 25.7}deg;--d:${50 + (i % 3) * 14}px;--c:${["#19A37F", "#F6A21E", "#1B6FE0", "#E86A5E"][i % 4]}"></i>`).join("");
  body.innerHTML = `<div class="dl-result ok"><div class="dl-burst">${parts}</div>
      <div class="dl-badge"><svg viewBox="0 0 52 52" width="64" height="64"><circle cx="26" cy="26" r="24" class="ck-c"/><path d="M14 27l8 8 16-17" class="ck-p"/></svg></div>
      <h3 class="dl-title">रिपोर्ट डाउनलोड हो गई</h3>
      <div class="dl-file"><span class="dl-pdf">${icon("file", 22)}</span><div><b>${esc(name)}</b><small>${where} फ़ोल्डर में सेव · ${(pdfBytes.length / 1024).toFixed(0)} KB</small></div></div>
      <div class="dl-actions"><button class="btn primary" data-open>${icon("eye", 20)} रिपोर्ट खोलें</button><button class="btn soft" data-share>${icon("share", 20)} शेयर करें</button><button class="btn ghost" data-close>ठीक है</button></div></div>`;
  const doOpen = async (auto) => {
    const ok = await openSaved(saved);
    if (!ok) { if (!auto) toast("PDF व्यूअर नहीं मिला — ऐप में खोल रहे हैं", "err"); openViewer("हेल्थ रिपोर्ट", jpegs.map(j => j.url), () => shareSaved(name, "application/pdf", pdfBytes)); }
  };
  body.querySelector("[data-open]").onclick = () => doOpen(false);
  body.querySelector("[data-share]").onclick = async () => { const ok = await shareSaved(name, "application/pdf", pdfBytes); if (!ok) toast("शेयर नहीं हो पाया", "err"); };
  body.querySelector("[data-close]").onclick = () => closeEl(o);
  setTimeout(() => { if (document.body.contains(o)) doOpen(true); }, 1500);
}

// Open a file attached to a health record (stored as data URL). Never throws.
export async function openRecordFile(f) {
  try {
    if (!f || !f.data) { toast("फ़ाइल उपलब्ध नहीं है", "err"); return; }
    const m = /^data:([^;,]+)[^,]*,(.*)$/.exec(f.data);
    const mime = (m && m[1]) || f.type || "application/octet-stream";
    if (/^image\//.test(mime)) { openViewer(f.name || "फोटो", [f.data]); return; }
    const bytes = b64ToBytes(m ? m[2] : f.data.split(",")[1]);
    const name = (f.name || "record").replace(/[\\/:*?"<>|]/g, "_");
    const res = await saveFile(name, mime, bytes);
    if (res.where) { toast(res.where + " में सेव हो गई"); if (!(await openSaved(res))) await shareSaved(name, mime, bytes); }
    else if (!(await shareSaved(name, mime, bytes))) toast("फ़ाइल नहीं खुल पाई", "err");
  } catch (e) { console.error(e); toast("फ़ाइल नहीं खुल पाई", "err"); }
}
