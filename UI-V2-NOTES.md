# UI v2 (naya design) — kya badla
- Naya mobile UI (home grid, hero card, quick stats, bottom tab bar) + animations (page entry, count-up, score ring, ripple, bottom sheets, download animation).
- Health Report page: Care Score + 7 din ka chart + PDF download. PDF seedha phone ke **Downloads** folder me save hoti hai aur apne aap khulti hai (PDF viewer na mile to ऐप ke andar khulti hai).
- Records ki file/photo ab "खोलें" button se khulti hai (pehle download link Android me kaam nahi karta tha).
- Bug fix: `updateDate()` function exist nahi karta tha, isse app start par error aa sakta tha — hata diya.
- Native plugin (scripts/android-config.mjs) me `openFile` + mime support joda; build ke waqt `npm run android:prepare` ye khud likh deta hai.
