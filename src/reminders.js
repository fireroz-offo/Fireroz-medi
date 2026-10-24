// Native Android scheduled notifications (work when app is closed). Medicine names hidden on lock screen by default.
// Each tune (tone1..tone5) has its own Android notification channel, so the chosen 30-second tune plays natively.
import { Capacitor } from "@capacitor/core";
import { LocalNotifications as LN } from "@capacitor/local-notifications";
const hash = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return (Math.abs(h) % 2147483000) + 1; };
const tuneKey = t => (/^tone[1-5]$/.test(t) ? t : "tone1"); // custom (user-uploaded) tune -> default tune on native
const channelId = t => `fireroz_reminder_${tuneKey(t)}_v1`;
const isNative = () => Capacitor.isNativePlatform();
const isAndroid = () => Capacitor.getPlatform() === "android";
const TUNE_NAMES = { tone1: "मधुर घंटी", tone2: "म्यूज़िक बॉक्स", tone3: "भूपाली घंटी", tone4: "तेज़ चाइम", tone5: "बाँसुरी" };

async function cancelAll() { const p = await LN.getPending(); if (p.notifications.length) await LN.cancel({ notifications: p.notifications.map(n => ({ id: n.id })) }); }

async function ensureChannels() {
  if (!isAndroid()) return;
  for (const t of Object.keys(TUNE_NAMES)) {
    await LN.createChannel({
      id: channelId(t), name: `दवाई रिमाइंडर – ${TUNE_NAMES[t]}`, description: "दवाई के समय की सूचना",
      importance: 5, visibility: 1, vibration: true, lights: true, sound: `fz_${t}`
    });
  }
}

// Android 12+: exact alarms need the "Alarms & reminders" permission, otherwise the reminder can be late.
async function ensureExact(askUser) {
  if (!isAndroid()) return true;
  try {
    const s = await LN.checkExactNotificationSetting();
    if (s.exact_alarm === "granted") return true;
    if (askUser) { await LN.changeExactNotificationSetting(); const s2 = await LN.checkExactNotificationSetting(); return s2.exact_alarm === "granted"; }
    return false;
  } catch { return true; }
}

async function ensurePermissions() {
  if (!isNative()) return false;
  try {
    let p = await LN.checkPermissions(); if (p.display !== "granted") p = await LN.requestPermissions();
    if (p.display !== "granted") return false;
    await ensureChannels();
    await ensureExact(true);
    return true;
  } catch { return false; }
}

export const Reminders = {
  isNative,
  ensurePermissions,
  async sync(data) {
    if (!isNative()) return;
    try {
      await cancelAll();
      if (!data.settings.reminders || !data.medicines.length) return;
      let p = await LN.checkPermissions(); if (p.display !== "granted") p = await LN.requestPermissions(); if (p.display !== "granted") return;
      await ensureChannels();
      if (isAndroid() && !localStorage.getItem("fz-exact-asked")) { localStorage.setItem("fz-exact-asked", "1"); await ensureExact(true); }
      const list = [];
      data.medicines.forEach(m => (m.times || "").split(",").map(t => t.trim()).filter(Boolean).forEach(t => {
        const [h, mi] = t.split(":").map(Number); if (isNaN(h) || isNaN(mi)) return;
        const tone = tuneKey(m.tune);
        list.push({
          id: hash(m.id + t), title: "Fireroz Care",
          body: data.settings.showMedName ? `${m.name} की खुराक का समय है।` : "दवाई का समय हो गया है।",
          channelId: channelId(tone), sound: `fz_${tone}`,
          schedule: { on: { hour: h, minute: mi }, allowWhileIdle: true }
        });
      }));
      if (list.length) await LN.schedule({ notifications: list });
    } catch { /* reminders are best-effort; UI states this */ }
  },
  async clear() { if (isNative()) try { await cancelAll(); } catch {} }
};
