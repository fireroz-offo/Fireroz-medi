// Runs after `npx cap add android`: no cloud auto-backup, no cleartext, minimal permissions, version code, release signing.
import fs from "node:fs";
import path from "node:path";
const f = "android/app/src/main/AndroidManifest.xml";
let x = fs.readFileSync(f, "utf8");
x = /android:allowBackup="[^"]*"/.test(x) ? x.replace(/android:allowBackup="[^"]*"/, 'android:allowBackup="false"') : x.replace("<application", '<application android:allowBackup="false"');
if (!x.includes("usesCleartextTraffic")) x = x.replace("<application", '<application android:usesCleartextTraffic="false"');
for (const p of ["POST_NOTIFICATIONS", "CAMERA", "SCHEDULE_EXACT_ALARM", "VIBRATE", "RECEIVE_BOOT_COMPLETED", "WAKE_LOCK"]) if (!x.includes(`android.permission.${p}`)) x = x.replace("</manifest>", `    <uses-permission android:name="android.permission.${p}" />\n</manifest>`);
fs.writeFileSync(f, x);

// ---- Logo (launcher icons), notification small icon and long reminder tunes ----
const res = "android/app/src/main/res";
const copyDir = (from, to) => { for (const e of fs.readdirSync(from, { withFileTypes: true })) { const a = path.join(from, e.name), b = path.join(to, e.name); if (e.isDirectory()) { fs.mkdirSync(b, { recursive: true }); copyDir(a, b); } else { fs.mkdirSync(path.dirname(b), { recursive: true }); fs.copyFileSync(a, b); } } };
// remove default icons (incl. .webp duplicates) so ours are the only ones
for (const d of fs.readdirSync(res)) if (d.startsWith("mipmap-")) for (const f of fs.readdirSync(path.join(res, d))) if (/^ic_launcher.*\.(webp|png|xml)$/.test(f)) fs.rmSync(path.join(res, d, f));
copyDir("android-res", res);
fs.mkdirSync(path.join(res, "mipmap-anydpi-v26"), { recursive: true });
fs.mkdirSync(path.join(res, "values"), { recursive: true });
for (const n of ["ic_launcher", "ic_launcher_round"]) fs.writeFileSync(path.join(res, "mipmap-anydpi-v26", n + ".xml"), '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/fz_icon_bg"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>\n</adaptive-icon>\n');
fs.writeFileSync(path.join(res, "values", "fz_colors.xml"), '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="fz_icon_bg">#FFFFFF</color>\n</resources>\n');
// long reminder tunes -> res/raw (used by notification channels)
fs.mkdirSync(path.join(res, "raw"), { recursive: true });
for (let i = 1; i <= 5; i++) fs.copyFileSync(`public/tones/tone${i}.ogg`, path.join(res, "raw", `fz_tone${i}.ogg`));
const g = "android/app/build.gradle"; let b = fs.readFileSync(g, "utf8"); const vc = process.env.VERSION_CODE || "1";
b = b.replace(/versionCode\s+\d+/, `versionCode ${vc}`).replace(/versionName\s+"[^"]*"/, `versionName "1.0.${vc}"`);
if (process.env.KEYSTORE_PATH) {
  const n = b.replace(/buildTypes\s*\{\s*release\s*\{/, `signingConfigs {\n        release {\n            storeFile file(System.getenv("KEYSTORE_PATH"))\n            storePassword System.getenv("KEYSTORE_PASSWORD")\n            keyAlias System.getenv("KEY_ALIAS")\n            keyPassword System.getenv("KEY_PASSWORD")\n        }\n    }\n    buildTypes {\n        release {\n            signingConfig signingConfigs.release`);
  if (n === b) throw new Error("Could not add signing config to build.gradle");
  b = n;
}
fs.writeFileSync(g, b); console.log("Android project configured (versionCode " + vc + ").");

// ---- Native "save backup to Downloads" plugin (MediaStore, no permission needed on Android 10+) ----
{
  const appId = JSON.parse(fs.readFileSync("capacitor.config.json", "utf8")).appId;
  const dir = path.join("android/app/src/main/java", ...appId.split("."));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "SaveFilePlugin.java"), `package ${appId};

import android.content.ActivityNotFoundException;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;

@CapacitorPlugin(name = "SaveFile")
public class SaveFilePlugin extends Plugin {
    // Saves a file into the public Downloads folder (MediaStore, no storage permission needed on Android 10+).
    @PluginMethod
    public void saveToDownloads(PluginCall call) {
        String name = call.getString("name");
        String data = call.getString("data");
        String mime = call.getString("mime");
        if (mime == null || mime.length() == 0) mime = "application/zip";
        if (name == null || data == null) { call.reject("missing data"); return; }
        if (Build.VERSION.SDK_INT < 29) { call.reject("android below 10"); return; }
        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            ContentValues v = new ContentValues();
            v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
            v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
            v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
            v.put(MediaStore.MediaColumns.IS_PENDING, 1);
            ContentResolver r = getContext().getContentResolver();
            Uri u = r.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
            if (u == null) { call.reject("insert failed"); return; }
            OutputStream o = r.openOutputStream(u);
            if (o == null) { call.reject("stream failed"); return; }
            o.write(bytes);
            o.flush();
            o.close();
            ContentValues done = new ContentValues();
            done.put(MediaStore.MediaColumns.IS_PENDING, 0);
            r.update(u, done, null, null);
            JSObject ret = new JSObject();
            ret.put("path", "Downloads/" + name);
            ret.put("uri", u.toString());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }

    // Opens a saved file in the phone's viewer app (PDF reader, gallery, ...).
    @PluginMethod
    public void openFile(PluginCall call) {
        String uri = call.getString("uri");
        String mime = call.getString("mime");
        if (mime == null || mime.length() == 0) mime = "application/pdf";
        if (uri == null) { call.reject("missing uri"); return; }
        try {
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(Uri.parse(uri), mime);
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("no_viewer");
        } catch (Exception e) {
            call.reject(String.valueOf(e.getMessage()));
        }
    }
}
`);
  fs.writeFileSync(path.join(dir, "MainActivity.java"), `package ${appId};

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(SaveFilePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`);
}
