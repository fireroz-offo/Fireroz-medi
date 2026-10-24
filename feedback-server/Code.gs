// Google Apps Script: receives app suggestions and emails them to you. Deploy as Web app (Execute as: Me, Access: Anyone).
const OWNER_EMAIL = "firerozofficial@gmail.com";
const DAILY_LIMIT = 80; // protects your inbox/quota from spam
const KINDS = { feature: "Feature request", bug: "Problem", other: "Other" };
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    const p = PropertiesService.getScriptProperties();
    const day = "d" + Utilities.formatDate(new Date(), "Asia/Kolkata", "yyyyMMdd");
    const used = Number(p.getProperty(day) || 0);
    if (used >= DAILY_LIMIT) return out(false);
    const d = JSON.parse(e.postData.contents);
    const text = String(d.text || "").trim().slice(0, 600);
    if (text.length < 5) return out(false);
    MailApp.sendEmail({ to: OWNER_EMAIL, subject: "[Fireroz Care] " + (KINDS[d.kind] || "Other"), body: text + "\n\n— app " + String(d.v || "").slice(0, 20) });
    p.setProperty(day, String(used + 1));
    return out(true);
  } catch (err) { return out(false); } finally { try { lock.releaseLock(); } catch (x) {} }
}
function out(ok) { return ContentService.createTextOutput(JSON.stringify({ ok: ok })).setMimeType(ContentService.MimeType.JSON); }
