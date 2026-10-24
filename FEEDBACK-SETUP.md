# Suggestions -> Gmail (free, ~10 min)
1. **firerozofficial@gmail.com** se login karke script.google.com kholein (phone mein Chrome → "Desktop site").
2. New project → purana code hatakar `feedback-server/Code.gs` ka text paste → Save.
3. Deploy → New deployment → type: Web app → Execute as: **Me** → Who has access: **Anyone** → Deploy. Pehli baar "Authorize" aayega (Advanced → Go to project → Allow; ye aapki hi script hai).
4. Jo **Web app URL** mile (`https://script.google.com/macros/s/.../exec`) use copy karein.
5. GitHub private repo → Settings → Secrets and variables → Actions → New secret: naam `FEEDBACK_URL`, value wahi URL.
6. Workflow dobara chalayein (build). Test APK mein Settings → "सुझाव / फीचर रिक्वेस्ट भेजें" → bhejkar Gmail mein check karein.
Note: free Gmail ki email limit hoti hai (script roz 80 par rok deti hai). Code badalne par Deploy → Manage deployments → Edit → New version.
