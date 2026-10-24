**Phone-only? Follow GITHUB-STEPS.md (GitHub Actions builds the APK/AAB).**

# Fireroz Care — MVP (on-device, no server, ₹0 running cost)
**No guarantee**: this lowers legal/Play/DPDP risk but cannot promise approval or zero complaints. Get a lawyer's quick review when you can.

## Build (PC or cloud Android build env; Node 22+; Android Studio/SDK)
1. Fill `{{EFFECTIVE_DATE}}`, `{{OPERATOR_NAME}}`, `{{OPERATOR_ADDRESS}}` in `public/privacy.html` (your own name/address while you're an individual).
2. `npm install` → `npm run build:release` → `npx cap add android` → `npm run android:prepare` → `npx cap sync android`.
3. Host `dist/privacy.html` at a public HTTPS URL (free: GitHub Pages).
4. Open in Android Studio, create your own signing key (keep it safe), build a signed AAB, upload to a Play **closed test**.
5. Follow `PLAY-CONSOLE-ANSWERS.md`.

## Test before release (real phone)
Reminder at set time with screen locked; after reboot; with battery saver; notification denied; delete-all; backup/restore; first-run notice appears once.

## Known limits
- Data is in the app's private WebView storage; lost on uninstall/clear data (backup export exists; its 4-digit PIN is weak — warn users).
- QR works only on the same phone (no server). Care Assistant is a simple rule-based helper, not medical advice.
- Adding login, cloud, ads or analytics later means updating policy + consent + Play forms (use the cloud version).
