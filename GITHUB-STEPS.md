# GitHub se app banana (phone se)
**Repo 1 — PRIVATE** `fireroz-care-app`: (a) `Fireroz-Care-MVP.zip` ko Add file → Upload files se upload karein (zip ko khol-kar nahi). (b) Add file → Create new file → naam `.github/workflows/build.yml` → `build.yml` ka text paste → Commit.
**Repo 2 — PUBLIC** `fireroz-care-privacy`: `privacy-index.html` upload → Settings → Pages → Deploy from branch (main /root). Link: `https://USERNAME.github.io/fireroz-care-privacy/privacy-index.html` → Play Console mein privacy URL.
**Test APK:** Repo 1 → Actions → Fireroz Care build → Run workflow (task: build) → khatam hone par Artifacts → `test-apk` → phone mein install.
**Signing key (ek baar):** Run workflow task=`make-keystore` → artifact `keystore-PRIVATE` download → `keystore-secrets.txt` ki 4 values ko Settings → Secrets and variables → Actions mein 4 Secrets banakar daalein (KEYSTORE_BASE64, KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD). `upload.jks` safe jagah backup karein. Repo private hi rakhein.
**Play AAB:** Secrets ke baad dobara build chalayein → artifact `play-store-aab` → Play Console closed test mein upload.
Build fail ho to Actions ka error log (aakhri laal lines) mujhe bhej dein.

**Suggestion feature (optional):** `FEEDBACK-SETUP.md` follow karke Apps Script URL banayein, phir Secret `FEEDBACK_URL` mein daalein. Khali raha to ye feature chhupa rehta hai.
