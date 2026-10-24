/**
 * Fireroz Care - old UI + functional screens
 * Data is stored locally in this browser (localStorage).
 */
import { Reminders } from "./reminders.js";
import { Notice } from "./notice.js";
import { About } from "./about.js";
import { Rating } from "./rating.js";
import { Feedback } from "./feedback.js";
import { Intro } from "./intro.js";
import { icon, initRipple, runCounters, runRings, toast } from "./ui.js";
import { computeReport, downloadReport, openRecordFile, SaveFile } from "./report.js";
const FirerozCare = (() => {
  "use strict";
  const KEY = "fireroz-care-complete-v1";
  const pages = ["dashboard","medicines","family","qr","health","appointments","assistant","reports","settings"];
  const fresh = () => ({ medicines:[], family:[{id:"self",name:"आप",relation:"Owner"}], doses:[], records:[], appointments:[], settings:{reminders:true} });
  let data = load();
  let current = "dashboard";
  let reminderTimer = null;
  function load(){ try { return {...fresh(),...(JSON.parse(localStorage.getItem(KEY)||"{}"))}; } catch { return fresh(); } }
  function save(){ localStorage.setItem(KEY, JSON.stringify(data)); Reminders.sync(data); render(); }
  function showSaveMessage(message){toast(message);}
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const today = () => { const d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
  const id = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  function doseKey(med,date,time,member){ return [med,date,time,member].join("|"); }
  function doseStatus(med,date,time,member){ return data.doses.find(x=>x.key===doseKey(med,date,time,member))?.status || "pending"; }
  function setDose(med,date,time,member,status){
    const key=doseKey(med,date,time,member); let d=data.doses.find(x=>x.key===key);
    if(!d){d={key,medicineId:med,date,time,member,status,updatedAt:new Date().toISOString()};data.doses.push(d);}
    else {d.status=status;d.updatedAt=new Date().toISOString();}
    const mdc=data.medicines.find(x=>x.id===med);
    const rec={title:(status==="taken"?"\u0926\u0935\u093e\u0908 \u0932\u0940: ":"\u0926\u0935\u093e\u0908 \u0928\u0939\u0940\u0902 \u0932\u0940: ")+(mdc?mdc.name:""),member,date,recordType:"\u0926\u0935\u093e\u0908",notes:(mdc&&mdc.dose?mdc.dose+" \u00b7 ":"")+"\u0938\u092e\u092f "+time+" \u00b7 "+new Date().toTimeString().slice(0,5)+" \u092a\u0930 \u0926\u0930\u094d\u091c",files:[],doseKey:key};
    const ex=data.records.find(r=>r.doseKey===key);
    if(ex)Object.assign(ex,rec);else data.records.unshift({id:id(),...rec});
    save();
    showSaveMessage(status==="taken"?"\u0932\u0947 \u0932\u0940 \u2014 \u0930\u093f\u0915\u0949\u0930\u094d\u0921 \u092e\u0947\u0902 \u0938\u0947\u0935 \u0939\u094b \u0917\u092f\u093e\u0964":"\u0928\u0939\u0940\u0902 \u0932\u0940 \u2014 \u0930\u093f\u0915\u0949\u0930\u094d\u0921 \u092e\u0947\u0902 \u0938\u0947\u0935 \u0939\u094b \u0917\u092f\u093e\u0964");
  }
  const TABS=[["dashboard","home","होम"],["medicines","pill","दवाइयाँ"],["reports","file","रिपोर्ट"],["family","users","परिवार"],["settings","sliders","सेटिंग्स"]];
  let reportMember="all", animateNext=true;
  const greeting=()=>{const h=new Date().getHours();return h<5?"शुभ रात्रि":h<12?"सुप्रभात":h<17?"नमस्कार":h<21?"शुभ संध्या":"शुभ रात्रि";};
  function buildChrome(){
    document.getElementById("topbar").innerHTML=`<div class="brand"><img src="/logo.png" alt="Fireroz Care"><div><b>Fireroz <i>Care</i></b><small>आपका परिवार, हमारी प्राथमिकता</small></div></div><button class="icon-btn" data-page="settings" aria-label="रिमाइंडर">${icon("bell",21)}<span class="dot" id="bell-dot"></span></button><button class="avatar" data-page="settings" aria-label="सेटिंग्स">${esc((data.family[0]&&data.family[0].name||"F").trim().charAt(0)||"F")}</button>`;
    document.getElementById("tabbar").innerHTML=`<div class="tab-ind" id="tab-ind"></div>`+TABS.map(t=>`<button class="tab" data-page="${t[0]}" aria-label="${t[2]}">${icon(t[1],23)}<span>${t[2]}</span></button>`).join("");
  }
  function updateChrome(){
    const dot=document.getElementById("bell-dot"); if(dot) dot.style.display=data.settings.reminders?"":"none";
    const root=TABS.some(t=>t[0]===current)?current:"dashboard";
    const bar=document.getElementById("tabbar"); if(!bar) return;
    bar.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.page===root));
    const act=bar.querySelector(".tab.active"),ind=document.getElementById("tab-ind");
    if(act&&ind){ind.style.width=act.offsetWidth+"px";ind.style.transform=`translateX(${act.offsetLeft}px)`;}
  }
  function nav(page,push=true){
    if(!pages.includes(page)) page="dashboard";
    const changed=page!==current;
    current=page;
    if(push&&changed){try{history.pushState({p:page},"");}catch(e){}}
    animateNext=true;
    render();
    window.scrollTo(0,0);
  }
  const head=(title,back,sub)=>`<div class="page-head" style="--i:0">${back?`<button class="icon-btn" data-page="dashboard" aria-label="वापस">${icon("back",20)}</button>`:""}<h1>${title}</h1></div>${sub?`<p class="page-sub" style="--i:1">${sub}</p>`:""}`;
  function pageContent(){
    if(current==="dashboard") return dashboardPage();
    if(current==="medicines") return `<div class="app-page">${head("दवाइयाँ",false,"दवाई और खुराक का शेड्यूल मैनेज करें।")}<div class="add-bar" style="--i:2"><button class="btn primary shine" data-action="add-med">${icon("plus",20)} दवाई जोड़ें</button></div><div class="app-list stagger">${medicineCards()}</div></div>`;
    if(current==="family") return `<div class="app-page">${head("परिवार",false,"सदस्यों और उनकी दवाइयों को मैनेज करें।")}<div class="add-bar" style="--i:2"><button class="btn primary shine" data-action="add-family">${icon("plus",20)} सदस्य जोड़ें</button></div><div class="app-list stagger">${familyCards()}</div></div>`;
    if(current==="qr") return `<div class="app-page">${head("परिवार सदस्य का QR",true)}<div class="app-two-col stagger"><div class="panel" style="--i:0"><h2>सदस्य का QR बनाएं</h2><label>परिवार सदस्य चुनें<select id="qr-member">${data.family.map(f=>`<option value="${f.id}">${esc(f.name)} · ${esc(f.relation||"सदस्य")}</option>`).join("")}</select></label><button class="btn soft block" data-action="make-qr">${icon("qr",20)} QR दिखाएँ</button><p>यह QR सिर्फ़ इसी फोन में काम करता है (स्कैन करने पर इसी फोन में सहेजा सदस्य का रिकॉर्ड दिखेगा)। दूसरे फोन से शेयरिंग अभी उपलब्ध नहीं है।</p><div id="qr-output"></div></div><div class="panel" style="--i:1"><h2>QR स्कैन करें</h2><p>किसी Fireroz Care परिवार सदस्य का QR स्कैन करें।</p><button class="btn soft block" data-action="scan-qr">${icon("qr",20)} स्कैन शुरू करें</button><div id="qr-reader"></div><div id="qr-result"></div></div></div></div>`;
    if(current==="health") return `<div class="app-page">${head("स्वास्थ्य रिकॉर्ड",true,"रिपोर्ट, पर्ची और महत्वपूर्ण नोट्स सुरक्षित रखें।")}<div class="add-bar" style="--i:2"><button class="btn primary shine" data-action="add-record">${icon("plus",20)} रिकॉर्ड जोड़ें</button></div><div class="app-list stagger">${recordCards()}</div></div>`;
    if(current==="appointments") return `<div class="app-page">${head("अपॉइंटमेंट",true,"डॉक्टर से मिलने की तारीख और समय।")}<div class="add-bar" style="--i:2"><button class="btn primary shine" data-action="add-appointment">${icon("plus",20)} अपॉइंटमेंट जोड़ें</button></div><div class="app-list stagger">${appointmentCards()}</div></div>`;
    if(current==="assistant") return `<div class="app-page">${head("Care Assistant",true)}<div class="panel" style="--i:1"><p>यह सहायक आपके ऐप के रिकॉर्ड के आधार पर सामान्य जानकारी व्यवस्थित करने में मदद करता है। यह डॉक्टर की सलाह का विकल्प नहीं है।</p><label>आपका सवाल<textarea id="assistant-question" placeholder="जैसे: आज कौन सी खुराक बाकी है?"></textarea></label><button class="btn primary block" data-action="ask-assistant">${icon("spark",20)} जवाब देखें</button><div id="assistant-answer" class="app-answer"></div></div></div>`;
    if(current==="reports") return reportPage();
    return settingsPage();
  }
  function scheduleRows(member="all"){
    const rows=[];
    data.medicines.forEach(m=>{if(member!=="all"&&(m.member||"आप")!==member)return;(m.times||"").split(",").map(t=>t.trim()).filter(Boolean).forEach(t=>rows.push({m,t,st:doseStatus(m.id,today(),t,m.member||"आप")}));});
    return rows.sort((a,b)=>a.t.localeCompare(b.t));
  }
  function nextDose(){
    const p=scheduleRows().filter(r=>r.st==="pending");if(!p.length)return "--:--";
    const hm=new Date().toTimeString().slice(0,5);return (p.find(r=>r.t>=hm)||p[0]).t;
  }
  function dashboardPage(){
    const rows=scheduleRows(),tk=rows.filter(r=>r.st==="taken").length,pd=rows.filter(r=>r.st==="pending").length;
    const tile=(p,ic,cls,label)=>`<button class="tile ${cls}" data-page="${p}"><span class="ti">${icon(ic,24)}</span>${label}</button>`;
    return `<div class="app-page">
      <section class="greet" style="--i:0"><h1>${greeting()}!</h1><p>स्वस्थ रहें, आगे रहें।</p></section>
      <section class="hero" style="--i:1"><h2>आपकी सेहत मायने रखती है</h2><p>नियमित दवाई, बेहतर कल।</p><button class="btn light shine" data-page="reports">हेल्थ रिपोर्ट देखें ${icon("chev",18)}</button><div class="art" aria-hidden="true"><span></span><span></span><span></span><img src="/logo.png" alt=""></div></section>
      <div class="sec-head" style="--i:2"><h2>क्या करना है?</h2></div>
      <div class="tiles stagger">${tile("reports","file","t-blue","हेल्थ रिपोर्ट")}${tile("appointments","cal","t-purple","अपॉइंटमेंट")}${tile("medicines","pill","t-green","दवाइयाँ")}${tile("health","heart","t-red","स्वास्थ्य रिकॉर्ड")}${tile("qr","qr","t-teal","QR स्कैनर")}${tile("assistant","spark","t-orange","Care Assistant")}</div>
      <div class="sec-head" style="--i:3"><h2>आज एक नज़र में</h2><button class="link" data-page="reports">सब देखें ${icon("chev",16)}</button></div>
      <div class="stats stagger">
        <div class="stat s-red">${icon("pill",20)}<small>आज की खुराक</small><b><span data-count="${rows.length}">${rows.length}</span><em>खुराक</em></b></div>
        <div class="stat s-green">${icon("check",20)}<small>ली गईं</small><b><span data-count="${tk}">${tk}</span><em>खुराक</em></b></div>
        <div class="stat s-purple">${icon("clock",20)}<small>बाकी</small><b><span data-count="${pd}">${pd}</span><em>खुराक</em></b></div>
        <div class="stat s-blue">${icon("bell",20)}<small>अगली खुराक</small><b>${nextDose()}</b></div>
      </div>
      <div class="sec-head" style="--i:4"><h2>आज का खुराक रिकॉर्ड</h2><button class="link" data-action="add-med">${icon("plus",16)} दवाई जोड़ें</button></div>
      <div class="app-list stagger">${todayDoses()}</div>
      <div class="trust" style="--i:5">${icon("shield",18)} सुरक्षित और निजी — आपका डेटा सिर्फ़ आपके फोन में</div>
    </div>`;
  }
  function reportPage(){
    if(reportMember!=="all"&&!data.family.some(f=>f.name===reportMember))reportMember="all";
    const r=computeReport(data,reportMember);
    const chips=[["all","पूरा परिवार"],...data.family.map(f=>[f.name,f.name])].map(c=>`<button class="chip ${c[0]===reportMember?"on":""}" data-action="report-member" data-member="${esc(c[0])}">${esc(c[1])}</button>`).join("");
    const maxV=Math.max(1,...r.days.map(d=>d.taken+d.missed));
    const bars=r.days.map((d,i)=>{const t=Math.round(100*d.taken/maxV),m=Math.round(100*d.missed/maxV);return `<div class="bar ${d.date===r.todayStr?"today":""}">${d.taken+d.missed?`<span>${d.taken+d.missed}</span>`:""}${m?`<div class="col miss" style="--i:${i};height:${m}%"></div>`:""}${t?`<div class="col" style="--i:${i};height:${t}%"></div>`:""}<span>${d.label}</span></div>`;}).join("");
    const nextA=r.appts[0];
    const C=2*Math.PI*54;
    return `<div class="app-page">${head("हेल्थ रिपोर्ट",false)}
      <div class="chips" style="--i:1">${chips}</div>
      <section class="score-card" style="--i:2">
        <div class="ring-wrap"><svg class="ring" viewBox="0 0 132 132" data-pct="${r.score===null?0:r.score}"><circle class="ring-bg" cx="66" cy="66" r="54"/><circle class="ring-fg" cx="66" cy="66" r="54" style="stroke:${({good:"#19A37F",mid:"#E5A100",low:"#D9534F",gray:"#9AA7A0"})[r.tone]}"/></svg><div class="ring-num"><b>${r.score===null?"—":`<span data-count="${r.score}">${r.score}</span>`}</b><small>/100</small></div></div>
        <div class="score-info"><h3>ओवरऑल केयर स्कोर</h3><span class="badge ${r.tone}">${r.label}</span><p>${esc(r.desc)}</p></div>
      </section>
      <div class="sec-head" style="--i:3"><h2>${icon("pulse",20)} आज की स्थिति</h2></div>
      <div class="stats stagger">
        <div class="stat s-red">${icon("pill",20)}<small>कुल खुराक</small><b><span data-count="${r.todayRows.length}">${r.todayRows.length}</span></b></div>
        <div class="stat s-green">${icon("check",20)}<small>ली गईं</small><b><span data-count="${r.tTaken}">${r.tTaken}</span></b></div>
        <div class="stat s-purple">${icon("clock",20)}<small>बाकी</small><b><span data-count="${r.tPending}">${r.tPending}</span></b></div>
        <div class="stat s-blue">${icon("alert",20)}<small>छूटीं</small><b><span data-count="${r.tMissed}">${r.tMissed}</span></b></div>
      </div>
      <div class="sec-head" style="--i:4"><h2>${icon("cal",20)} पिछले 7 दिन</h2></div>
      <div class="panel" style="--i:5"><div class="bars">${bars}</div><div class="legend"><span><i style="background:#19A37F"></i>ली गईं</span><span><i style="background:#E86A5E"></i>छूटीं</span></div></div>
      <div class="vitals" style="margin-top:12px"><div class="vital" style="--i:6"><div class="vh"><span class="vi" style="background:#E6F6EE;color:#0E7A5F">${icon("file",16)}</span>रिकॉर्ड</div><b><span data-count="${r.recs.length}">${r.recs.length}</span><em>सुरक्षित</em></b><span class="tag">${r.recs.length?"उपलब्ध":"कोई नहीं"}</span></div><div class="vital" style="--i:7"><div class="vh"><span class="vi" style="background:#E8F1FF;color:#1B6FE0">${icon("cal",16)}</span>अगला अपॉइंटमेंट</div><b style="font-size:17px">${nextA?esc(nextA.date):"—"}</b><span class="tag ${nextA?"":"o"}">${nextA?esc(nextA.time||""):"कोई नहीं"}</span></div></div>
      <div class="sec-head" style="--i:8"><h2>${icon("info",20)} सारांश</h2></div>
      <div class="panel" style="--i:9">${r.insights.map(s=>`<div class="tip">${icon("check",18)}<span>${esc(s)}</span></div>`).join("")}</div>
      <div class="sec-head" style="--i:10"><h2>${icon("spark",20)} सुझाव</h2></div>
      <div class="panel" style="--i:11">${r.tips.slice(0,4).map(s=>`<div class="tip">${icon("check",18)}<span>${esc(s)}</span></div>`).join("")}</div>
      <div class="cta-bar" style="--i:12"><button class="btn primary shine" data-action="download-report">${icon("download",22)} रिपोर्ट डाउनलोड करें (PDF)</button></div>
      <div class="sec-head" style="--i:13"><h2>${icon("save",20)} बैकअप</h2></div>
      <div class="panel" style="--i:14"><div class="set-list" style="margin-top:0"><button class="btn soft" data-action="export">${icon("download",20)} बैकअप बनाएं</button><label class="btn soft" style="margin:0">${icon("upload",20)} बैकअप वापस लाएँ<input type="file" accept="application/zip,.zip" data-action-file="import-backup" style="display:none"></label></div><p>बैकअप फोन में डाउनलोड होगा। इसे सुरक्षित जगह रखें।</p></div>
      <p class="note">यह रिपोर्ट ऐप में दर्ज जानकारी पर आधारित है। यह डॉक्टर की सलाह या जाँच का विकल्प नहीं है।</p>
    </div>`;
  }
  function settingsPage(){
    return `<div class="app-page">${head("सेटिंग्स",false)}
      <div class="panel" style="--i:1"><h2>रिमाइंडर</h2><label><input type="checkbox" id="reminders-toggle" ${data.settings.reminders?"checked":""}/> रिमाइंडर सक्षम करें</label><p>रिमाइंडर सही समय पर 30 सेकंड की ट्यून के साथ आते हैं। इसके लिए नोटिफिकेशन व "अलार्म और रिमाइंडर" की अनुमति दें, फोन साइलेंट/DND पर न रखें, और बैटरी सेवर में ऐप को "Unrestricted" रखें। फिर भी बैटरी सेवर/फोन की सेटिंग से देरी या चूक हो सकती है; इन्हें पक्का अलार्म न मानें।</p><button class="btn soft block" data-action="notify-permission">${icon("bell",20)} नोटिफिकेशन अनुमति</button><div style="height:12px"></div><label><input type="checkbox" id="medname-toggle" ${data.settings.showMedName?"checked":""}/> लॉक-स्क्रीन नोटिफिकेशन में दवाई का नाम दिखाएँ (डिफ़ॉल्ट: बंद)</label></div>
      <div class="panel" style="--i:2"><h2>ऐप</h2><div class="set-list" style="margin-top:0"><a class="btn soft" href="/privacy.html" target="_blank">${icon("lock",20)} Privacy Policy</a><button class="btn soft" data-action="about">${icon("info",20)} ऐप के बारे में</button><button class="btn soft" data-action="rate-app">${icon("star",20)} Play Store पर रेट करें</button>${Feedback.enabled()?`<button class="btn soft" data-action="feedback">${icon("msg",20)} सुझाव / फीचर रिक्वेस्ट भेजें</button>`:""}</div></div>
      <div class="panel" style="--i:3"><h2>डेटा</h2><p>आपका सारा डेटा सिर्फ़ इसी फोन में रहता है।</p><button class="btn danger block" data-action="clear-data">${icon("trash",20)} सारा स्थानीय डेटा मिटाएँ</button></div>
    </div>`;
  }
  function medicineCards(){return data.medicines.length?data.medicines.map((m,i)=>`<article class="app-item" style="--i:${i}"><div>${m.medicinePhotoData?`<img src="${m.medicinePhotoData}" alt="${esc(m.name)} की फोटो" style="width:64px;height:64px;object-fit:contain;float:left;margin:0 12px 8px 0;border-radius:12px;background:#F3F8F5">`:""}<h3>${esc(m.name)}</h3><p>${esc(m.dose||"डोज़ नहीं दी")} · ${esc(m.member||"आप")} · ${esc(m.times||"समय तय नहीं")}</p><small>${esc(m.notes||"")}</small></div><div class="app-item-actions"><button data-action="edit-med" data-id="${m.id}">एडिट</button><button data-action="delete-med" data-id="${m.id}">हटाएँ</button></div></article>`).join(""):`<div class="empty-state"><div class="ei">${icon("pill",30)}</div><h3>अभी कोई दवाई नहीं जोड़ी गई</h3><p>दवाई जोड़ें — रिमाइंडर अपने आप लग जाएगा।</p><button class="btn primary" data-action="add-med">${icon("plus",20)} दवाई जोड़ें</button></div>`;}
  function familyCards(){return data.family.map((f,i)=>`<article class="app-item" style="--i:${i}"><div><h3>${esc(f.name)}</h3><p>${esc(f.relation||"परिवार सदस्य")}</p></div>${f.id!=="self"?`<button data-action="delete-family" data-id="${f.id}">हटाएँ</button>`:"<small>Owner</small>"}</article>`).join("");}
  function recordCards(){return data.records.length?data.records.map((r,i)=>`<article class="app-item" style="--i:${i}"><div><h3>${esc(r.title)}</h3><p>${esc(r.member)} · ${esc(r.date)} · ${esc(r.recordType||"मेडिकल रिकॉर्ड")}</p><small>${esc(r.notes||"")}</small>${(r.files||[]).map((f,k)=>f.data?`<div><button class="file-link" data-action="open-file" data-id="${r.id}" data-idx="${k}">${icon(f.type&&f.type.startsWith("image/")?"eye":"file",16)} ${esc(f.name||"फाइल खोलें")}</button></div>`:"").join("")}</div><button data-action="delete-record" data-id="${r.id}">हटाएँ</button></article>`).join(""):`<div class="empty-state"><div class="ei">${icon("heart",30)}</div><h3>अभी कोई रिकॉर्ड नहीं है</h3><p>डॉक्टर की पर्ची या जाँच रिपोर्ट की फोटो/PDF जोड़ें।</p><button class="btn primary" data-action="add-record">${icon("plus",20)} रिकॉर्ड जोड़ें</button></div>`;}
  function appointmentCards(){return data.appointments.length?data.appointments.map((a,i)=>`<article class="app-item" style="--i:${i}"><div><h3>${esc(a.doctor||"डॉक्टर")}</h3><p>${esc(a.date)} ${esc(a.time)} · ${esc(a.member)}</p><small>${esc(a.reason)}</small></div><button data-action="delete-appointment" data-id="${a.id}">हटाएँ</button></article>`).join(""):`<div class="empty-state"><div class="ei">${icon("cal",30)}</div><h3>कोई अपॉइंटमेंट नहीं</h3><p>डॉक्टर से मिलने की तारीख यहाँ जोड़ें।</p><button class="btn primary" data-action="add-appointment">${icon("plus",20)} अपॉइंटमेंट जोड़ें</button></div>`;}
  function todayDoses(){
    const rows=scheduleRows();
    if(!rows.length) return `<div class="empty-state"><div class="ei">${icon("pill",30)}</div><h3>आज की कोई खुराक नहीं</h3><p>दवाई जोड़ने पर आज का शेड्यूल यहाँ दिखाई देगा।</p><button class="btn primary" data-action="add-med">${icon("plus",20)} दवाई जोड़ें</button></div>`;
    return rows.map(({m,t,st},i)=>`<article class="app-item" style="--i:${i}"><div><h3>${esc(m.name)} · ${esc(t)}</h3><p>${esc(m.dose)} · ${esc(m.member||"आप")}</p><span class="dose-status ${st}">${st==="taken"?"ले ली":st==="missed"?"नहीं ली":"बाकी"}</span></div><div class="app-item-actions"><button data-action="dose" data-id="${m.id}" data-time="${esc(t)}" data-member="${esc(m.member||"आप")}" data-status="taken">ले ली</button><button data-action="dose" data-id="${m.id}" data-time="${esc(t)}" data-member="${esc(m.member||"आप")}" data-status="missed">नहीं ली</button></div></article>`).join("");
  }
  function render(){
    const v=document.getElementById("view");if(!v)return;
    const anim=animateNext;animateNext=false;
    v.className=anim?"enter":"";
    v.innerHTML=pageContent();
    updateChrome();wirePage();
    if(anim){runCounters(v);runRings(v,true);}else{v.querySelectorAll("[data-count]").forEach(e=>e.textContent=e.dataset.count);runRings(v,false);}
  }
  function wirePage(){
    document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>action(b.dataset.action,b.dataset));
    document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>nav(b.dataset.page));
    document.querySelectorAll("[data-action-file=import-backup]").forEach(inp=>inp.onchange=async()=>{const file=inp.files?.[0];if(!file)return;try{const encrypted=await unzipStoredEntry(await file.arrayBuffer());const envelope=JSON.parse(new TextDecoder().decode(encrypted));let restored=null;try{restored=await decryptBackup(envelope,"\u0906\u092a","");}catch(e0){}if(!restored){const memberName=prompt("बैकअप में दर्ज Member का नाम लिखें:","");if(memberName===null)throw new Error("cancel");const pin=prompt("अगर बैकअप बनाते समय 4 अंकों का PIN लगाया था, तो डालें। PIN नहीं लगाया था तो खाली छोड़ें:","");if(pin===null)throw new Error("cancel");if(pin&&!/^\d{4}$/.test(pin))throw new Error("pin");restored=await decryptBackup(envelope,memberName,pin);}if(!restored||!Array.isArray(restored.records)||!Array.isArray(restored.family))throw new Error("invalid");if(confirm("इस बैकअप से इस फोन का मौजूदा डेटा बदल जाएगा। जारी रखें?")){data={...fresh(),...restored};save();showSaveMessage("बैकअप वापस आ गया।");}}catch(e){if(e.message==="cancel"){}else if(e.message==="pin")alert("PIN 4 अंकों का होना चाहिए।");else alert("बैकअप नहीं खुला। Member का नाम और PIN जाँचें, या फ़ाइल सही है या नहीं देखें।");}inp.value="";});const togg=document.getElementById("reminders-toggle");if(togg)togg.onchange=()=>{data.settings.reminders=togg.checked;save();};
  }
  function formDialog(title,fields,submit){
    const html=`<div class="fc-modal-overlay"><div class="fc-modal"><button class="fc-close" data-close>×</button><h2>${title}</h2><form class="fc-form">${fields}<button class="primary-button" type="submit">सेव करें</button></form></div></div>`;
    document.body.insertAdjacentHTML("beforeend",html);const modal=document.querySelector(".fc-modal-overlay");
    modal.querySelector("[data-close]").onclick=()=>closeModal(modal);
    const relationSelect=modal.querySelector("#relation-select"),otherWrap=modal.querySelector("#other-relation-wrap");if(relationSelect&&otherWrap)relationSelect.onchange=()=>otherWrap.style.display=relationSelect.value==="अन्य"?"grid":"none";
    const preview=modal.querySelector("#preview-tune-button");if(preview)preview.onclick=()=>{const tune=modal.querySelector('[name="tune"]')?.value||"tone1";if(tune==="custom"){const file=modal.querySelector('[name="customTune"]')?.files?.[0];if(file){const audio=new Audio(URL.createObjectURL(file));audio.play();}else alert("पहले अपनी ट्यून की ऑडियो फाइल चुनें।");}else playTune(tune);};
    modal.onclick=e=>{if(e.target===modal)closeModal(modal);};
    modal.querySelector("form").onsubmit=async e=>{e.preventDefault();const obj=Object.fromEntries(new FormData(e.target));const audio=e.target.querySelector('input[name="customTune"]')?.files?.[0];const medicinePhoto=e.target.querySelector('input[name="medicinePhoto"]')?.files?.[0];const recordFiles=[...(e.target.querySelector('input[name="recordFiles"]')?.files||[])];if(recordFiles.length){obj.files=await Promise.all(recordFiles.map(file=>new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve({name:file.name,type:file.type,data:r.result});r.onerror=()=>resolve({name:file.name,type:file.type,data:""});r.readAsDataURL(file);})));}if(medicinePhoto){obj.medicinePhotoName=medicinePhoto.name;obj.medicinePhotoData=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>resolve("");r.readAsDataURL(medicinePhoto);});}delete obj.medicinePhoto;if(audio){obj.customTuneName=audio.name;obj.customTuneData=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>resolve("");r.readAsDataURL(audio);});}delete obj.customTune;submit(obj);closeModal(modal);};
  }
  function closeModal(m){if(!m||m.dataset.closing)return;m.dataset.closing="1";m.classList.add("closing");setTimeout(()=>m.remove(),260);}
  function memberOptions(selected=""){return data.family.map(f=>`<option ${f.name===selected?"selected":""}>${esc(f.name)}</option>`).join("");}
  const relationOptions=["पिता","माता","पति","पत्नी","बेटा","बेटी","भाई","बहन","दादा","दादी","नाना","नानी","अन्य"];
  function tuneOptions(selected="tone1"){return [{v:"tone1",n:"ट्यून 1 – मधुर घंटी (30 सेकंड)"},{v:"tone2",n:"ट्यून 2 – म्यूज़िक बॉक्स (30 सेकंड)"},{v:"tone3",n:"ट्यून 3 – भूपाली घंटी (30 सेकंड)"},{v:"tone4",n:"ट्यून 4 – तेज़ चाइम (30 सेकंड)"},{v:"tone5",n:"ट्यून 5 – बाँसुरी (30 सेकंड)"},{v:"custom",n:"मेरी अपनी ट्यून (सिर्फ ऐप खुला होने पर)"}].map(t=>`<option value="${t.v}" ${selected===t.v?"selected":""}>${t.n}</option>`).join("");}
  function action(a,d){
    if(a==="download-report"){downloadReport(data,reportMember).catch(e=>{console.error(e);toast("रिपोर्ट नहीं बन पाई, फिर कोशिश करें","err");});return;}
    if(a==="report-member"){reportMember=d.member||"all";render();return;}
    if(a==="open-file"){const r=data.records.find(x=>x.id===d.id);const f=r&&(r.files||[])[Number(d.idx)];openRecordFile(f);return;}
    if(a==="add-med"||a==="edit-med"){const m=data.medicines.find(x=>x.id===d.id)||{};formDialog(a==="edit-med"?"दवाई एडिट करें":"दवाई जोड़ें",`<label>दवाई का नाम<input name="name" list="medicine-name-suggestions" required value="${esc(m.name)}" placeholder="नाम लिखें या सुझाव चुनें"><datalist id="medicine-name-suggestions"><option value="Paracetamol"><option value="Cetirizine"><option value="ORS"><option value="Vitamin D3"><option value="Calcium"><option value="Iron"><option value="Metformin"><option value="Amlodipine"><option value="Pantoprazole"><option value="Amoxicillin"></datalist><small>नाम टाइप करें—मिलते-जुलते सुझाव दिखेंगे। यह केवल नाम के सुझाव हैं, दवाई लेने की सलाह नहीं।</small></label><label>डोज़<input name="dose" value="${esc(m.dose)}" placeholder="जैसे 1 टैबलेट"></label><label>दवाई का समय <input name="times" type="time" value="${esc((m.times||"").split(",")[0])}" required></label><label>किसके लिए<select name="member">${memberOptions(m.member)}</select></label><label>अलार्म ट्यून<select name="tune" id="tune-select">${tuneOptions(m.tune)}</select></label><button type="button" class="secondary-button" id="preview-tune-button">ट्यून सुनें</button><label>अपनी ट्यून की ऑडियो फाइल<input name="customTune" type="file" accept="audio/*"></label><small>पाँच तैयार ट्यून में से चुनें या फोन से अपनी ऑडियो फाइल जोड़ें।</small><label>दवाई की पहचान के लिए फोटो<input name="medicinePhoto" type="file" accept="image/*" capture="environment"></label>${m.medicinePhotoData?`<div class="medicine-photo-preview"><img src="${m.medicinePhotoData}" alt="दवाई की पहचान फोटो" style="max-width:120px;max-height:120px;object-fit:contain"><small>मौजूदा फोटो</small></div>`:""}<small>दवाई की स्ट्रिप/डिब्बे की साफ फोटो जोड़ें, ताकि सदस्य पहचान सके। फोटो में नाम/strength स्पष्ट रखें।</small><label>नोट<textarea name="notes">${esc(m.notes)}</textarea></label>`,v=>{if(m.id)Object.assign(m,v);else data.medicines.push({...v,id:id()});save();});}
    if(a==="add-family")formDialog("परिवार सदस्य जोड़ें",`<label>नाम<input name="name" required></label><label>रिश्ता<select name="relation" id="relation-select">${relationOptions.map(r=>`<option>${r}</option>`).join("")}</select></label><label id="other-relation-wrap" style="display:none">अपना रिश्ता लिखें<input name="otherRelation" placeholder="रिश्ता लिखें"></label>`,v=>{if(v.relation==="अन्य")v.relation=v.otherRelation||"अन्य";delete v.otherRelation;data.family.push({...v,id:id()});save();showSaveMessage("परिवार सदस्य सेव हो गया।");});
    if(a==="delete-family"){const member=data.family.find(x=>x.id===d.id);if(member&&confirm(`${member.name} को परिवार से हटाएँ?`)){data.family=data.family.filter(x=>x.id!==d.id);save();showSaveMessage("परिवार सदस्य हट गया।");}}
    if(a==="delete-med"){if(confirm("दवाई हटाएँ?")){data.medicines=data.medicines.filter(x=>x.id!==d.id);save();}}
    if(a==="dose")setDose(d.id,today(),d.time,d.member||"आप",d.status);
    if(a==="add-record")formDialog("मेडिकल रिकॉर्ड जोड़ें",`<label>रिकॉर्ड का नाम<input name="title" required placeholder="जैसे डॉक्टर की पर्ची / ब्लड टेस्ट"></label><label>किस सदस्य का रिकॉर्ड है<select name="member">${memberOptions()}</select></label><label>रिकॉर्ड की तारीख<input name="date" type="date" value="${today()}" required></label><label>रिकॉर्ड का प्रकार<select name="recordType"><option>डॉक्टर की पर्ची</option><option>जाँच रिपोर्ट</option><option>स्कैन / एक्स-रे</option><option>अन्य मेडिकल रिकॉर्ड</option></select></label><label>फोटो या PDF जोड़ें<input name="recordFiles" type="file" accept="image/*,.pdf,application/pdf" multiple required></label><small>फोन से फोटो लें, गैलरी से चुनें या PDF चुनें। एक से अधिक फाइल भी जोड़ सकते हैं।</small><label>नोट / विवरण<textarea name="notes" placeholder="डॉक्टर या जाँच की जरूरी जानकारी"></textarea></label>`,v=>{data.records.push({...v,id:id()});save();showSaveMessage("मेडिकल रिकॉर्ड सेव हो गया।");});
    if(a==="delete-record"){data.records=data.records.filter(x=>x.id!==d.id);save();}
    if(a==="add-appointment")formDialog("अपॉइंटमेंट",`<label>डॉक्टर / क्लिनिक<input name="doctor" required></label><label>किसके लिए<select name="member">${memberOptions()}</select></label><label>तारीख<input name="date" type="date" required></label><label>समय<input name="time" type="time" required></label><label>कारण<input name="reason"></label>`,v=>{data.appointments.push({...v,id:id()});save();});
    if(a==="delete-appointment"){data.appointments=data.appointments.filter(x=>x.id!==d.id);save();}
    if(a==="preview-tune")playTune(d.tune||"tone1");
    if(a==="make-qr")makeQR();
    if(a==="scan-qr")scanQR();
    if(a==="ask-assistant"){const q=document.getElementById("assistant-question")?.value||"";const pending=todayDosesText();document.getElementById("assistant-answer").textContent=q.toLowerCase().includes("बाकी")||q.toLowerCase().includes("दवाई")?pending:"मैं आपके ऐप में दवाई रिकॉर्ड, आज की खुराक और अपॉइंटमेंट व्यवस्थित कर सकता हूँ। चिकित्सा निर्णय के लिए डॉक्टर से सलाह लें।";}
    if(a==="export"){createEncryptedBackup().catch(e=>alert(e.message||"बैकअप नहीं बन पाया।"));}
    if(a==="notify-permission"){Reminders.ensurePermissions().then(()=>{if(!Reminders.isNative()&&"Notification"in window)Notification.requestPermission();});}
    if(a==="clear-data"&&confirm("स्थानीय ऐप डेटा स्थायी रूप से मिटाएँ?")){data=fresh();save();}
  }
  // Encrypted backup: AES-GCM payload stored in a standard, uncompressed ZIP entry.
  async function createEncryptedBackup(){
    if(!data.family.length){alert("पहले परिवार सदस्य जोड़ें।");return;}
    const matched=(data.family[0].name||"\u0906\u092a");const pin="";
    const payload={app:"Fireroz Care",backupVersion:2,createdAt:new Date().toISOString(),memberName:matched,data};
    const envelope=await encryptBackup(payload,matched,pin);
    const zip=zipStoredEntry("fireroz-care-backup.enc",new TextEncoder().encode(JSON.stringify(envelope)));
    await saveBackupFile(zip);
  }
  async function saveBackupFile(zipBytes){
    const name="Fireroz-Care-Backup-"+today()+".zip";
    let native=false;
    try{const {Capacitor}=await import("@capacitor/core");native=Capacitor.isNativePlatform();}catch(e){}
    if(!native){
      const blob=new Blob([zipBytes],{type:"application/zip"});
      const url=URL.createObjectURL(blob),link=document.createElement("a");link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),4000);showSaveMessage("\u092c\u0948\u0915\u0905\u092a \u0921\u093e\u0909\u0928\u0932\u094b\u0921 \u0939\u094b \u0917\u092f\u093e\u0964");return;
    }
    let bin="";for(let i=0;i<zipBytes.length;i+=8192)bin+=String.fromCharCode.apply(null,zipBytes.subarray(i,i+8192));
    const b64=btoa(bin);
    const {Filesystem,Directory}=await import("@capacitor/filesystem");
    const shareCopy=async()=>{
      await Filesystem.writeFile({path:name,data:b64,directory:Directory.Cache});
      const {uri}=await Filesystem.getUri({path:name,directory:Directory.Cache});
      const {Share}=await import("@capacitor/share");
      await Share.share({title:name,url:uri,dialogTitle:"\u092c\u0948\u0915\u0905\u092a \u0938\u0947\u0935 \u0915\u0930\u0947\u0902 / \u092d\u0947\u091c\u0947\u0902"});
    };
    let where=null,why="";
    try{
      await SaveFile.saveToDownloads({name,data:b64,mime:"application/zip"});
      where="Downloads";
    }catch(eA){why=String(eA&&eA.message||eA);}
    if(!where){
      try{
        try{await Filesystem.requestPermissions();}catch(e0){}
        await Filesystem.writeFile({path:name,data:b64,directory:Directory.Documents,recursive:true});
        await Filesystem.stat({path:name,directory:Directory.Documents});
        where="Documents";
      }catch(eB){why+=" | "+String(eB&&eB.message||eB);}
    }
    const saved=!!where;
    const box=document.createElement("div");
    box.style.cssText="position:fixed;inset:0;z-index:100020;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px";
    const bs="display:block;width:100%;padding:13px;margin:8px 0;border:0;border-radius:12px;font-size:16px;font-weight:700;";
    box.innerHTML='<div style="background:#fff;color:#111;border-radius:16px;padding:20px;width:100%;max-width:420px;line-height:1.5"><h3 style="margin-top:0">'+(saved?"\u092c\u0948\u0915\u0905\u092a \u0938\u0947\u0935 \u0939\u094b \u0917\u092f\u093e \u2713":"\u092b\u093c\u094b\u0928 \u092e\u0947\u0902 \u0938\u0940\u0927\u0947 \u0938\u0947\u0935 \u0928\u0939\u0940\u0902 \u0939\u094b \u092a\u093e\u092f\u093e")+'</h3><p>'+(saved?"\u092b\u093c\u093e\u0907\u0932 \u092f\u0939\u093e\u0901 \u0939\u0948: <b>"+where+" / "+name+"</b><br>Files \u0910\u092a \u0916\u094b\u0932\u0915\u0930 \u0935\u0939\u0940 \u092b\u093c\u094b\u0932\u094d\u0921\u0930 \u0926\u0947\u0916\u0947\u0902\u0964":"\u0928\u0940\u091a\u0947 \u201c\u0938\u0947\u0935 / \u092d\u0947\u091c\u0947\u0902\u201d \u0926\u092c\u093e\u0915\u0930 Files, Drive \u092f\u093e WhatsApp \u092e\u0947\u0902 \u092b\u093c\u093e\u0907\u0932 \u0938\u0947\u0935 \u0915\u0930\u0947\u0902\u0964<br><small style=\"color:#888\">"+why.slice(0,160).replace(/</g,"")+"</small>")+'</p><button id="bk-share" style="'+bs+'background:#126B50;color:#fff">'+(saved?"Drive / \u0926\u0942\u0938\u0930\u0940 \u091c\u0917\u0939 \u092d\u0940 \u0938\u0947\u0935 \u0915\u0930\u0947\u0902":"\u0938\u0947\u0935 / \u092d\u0947\u091c\u0947\u0902")+'</button><button id="bk-ok" style="'+bs+'background:#eee;color:#111">'+"\u0920\u0940\u0915 \u0939\u0948"+'</button></div>';
    document.body.appendChild(box);
    box.querySelector("#bk-ok").onclick=()=>box.remove();
    box.querySelector("#bk-share").onclick=async()=>{try{await shareCopy();if(!saved)box.remove();}catch(e2){const m=String(e2&&e2.message||e2);if(!/cancel/i.test(m))alert("\u0936\u0947\u092f\u0930 \u0928\u0939\u0940\u0902 \u0939\u094b \u092a\u093e\u092f\u093e: "+m);}};
    if(!saved){try{await shareCopy();box.remove();}catch(e3){}}
  }
  async function deriveBackupKey(memberName,pin,salt){
    const material=await crypto.subtle.importKey("raw",new TextEncoder().encode(memberName.trim().toLowerCase()+"|"+(pin||"")),"PBKDF2",false,["deriveKey"]);
    return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:180000,hash:"SHA-256"},material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
  }
  async function encryptBackup(payload,memberName,pin){
    const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
    const key=await deriveBackupKey(memberName,pin,salt);
    const ciphertext=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(JSON.stringify(payload)));
    return {format:"fireroz-care-encrypted-backup-v1",salt:Array.from(salt),iv:Array.from(iv),ciphertext:Array.from(new Uint8Array(ciphertext))};
  }
  async function decryptBackup(envelope,memberName,pin){
    if(envelope.format!=="fireroz-care-encrypted-backup-v1")throw new Error("invalid");
    const key=await deriveBackupKey(memberName,pin,new Uint8Array(envelope.salt));
    const clear=await crypto.subtle.decrypt({name:"AES-GCM",iv:new Uint8Array(envelope.iv)},key,new Uint8Array(envelope.ciphertext));
    const payload=JSON.parse(new TextDecoder().decode(clear));
    if(payload.memberName&&payload.memberName.trim().toLowerCase()!==memberName.trim().toLowerCase())throw new Error("invalid");
    return payload.data;
  }
  function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
  function zipStoredEntry(name,bytes){
    const n=new TextEncoder().encode(name),crc=crc32(bytes),local=new Uint8Array(30+n.length+bytes.length),v=new DataView(local.buffer);
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0,true);v.setUint16(8,0,true);v.setUint32(14,crc,true);v.setUint32(18,bytes.length,true);v.setUint32(22,bytes.length,true);v.setUint16(26,n.length,true);v.setUint16(28,0,true);local.set(n,30);local.set(bytes,30+n.length);
    const central=new Uint8Array(46+n.length),c=new DataView(central.buffer);c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0,true);c.setUint16(10,0,true);c.setUint32(16,crc,true);c.setUint32(20,bytes.length,true);c.setUint32(24,bytes.length,true);c.setUint16(28,n.length,true);c.setUint16(30,0,true);c.setUint16(32,0,true);c.setUint32(38,0,true);c.setUint32(42,0,true);central.set(n,46);
    const end=new Uint8Array(22),e=new DataView(end.buffer);e.setUint32(0,0x06054b50,true);e.setUint16(8,1,true);e.setUint16(10,1,true);e.setUint32(12,central.length,true);e.setUint32(16,local.length,true);return concatBytes([local,central,end]);
  }
  function concatBytes(parts){const total=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(total);let offset=0;for(const p of parts){out.set(p,offset);offset+=p.length;}return out;}
  function unzipStoredEntry(buffer){
    const bytes=new Uint8Array(buffer),view=new DataView(buffer);let offset=0;
    if(view.getUint32(offset,true)!==0x04034b50)throw new Error("invalid");const method=view.getUint16(8,true),size=view.getUint32(18,true),nameLen=view.getUint16(26,true),extraLen=view.getUint16(28,true);
    if(method!==0)throw new Error("invalid");offset=30+nameLen+extraLen;return Promise.resolve(bytes.slice(offset,offset+size));
  }
  let previewAudio=null;
  function playTune(tune){try{if(previewAudio){previewAudio.pause();previewAudio=null;}const a=new Audio(`/tones/${/^tone[1-5]$/.test(tune)?tune:"tone1"}.ogg`);previewAudio=a;a.play().catch(()=>alert("इस डिवाइस पर ट्यून प्रीव्यू नहीं चल पाया।"));setTimeout(()=>{if(previewAudio===a){a.pause();previewAudio=null;}},10000);}catch(e){alert("इस डिवाइस पर ट्यून प्रीव्यू नहीं चल पाया।");}}
  function todayDosesText(){const arr=[];data.medicines.forEach(m=>(m.times||"").split(",").map(t=>t.trim()).filter(Boolean).forEach(t=>{if(doseStatus(m.id,today(),t,m.member||"आप")==="pending")arr.push(`${m.name} (${t})`);}));return arr.length?`आज बाकी: ${arr.join(", ")}`:"आज कोई बाकी खुराक नहीं दिख रही।";}
  async function makeQR(){
    const out=document.getElementById("qr-output");const member=data.family.find(f=>f.id===document.getElementById("qr-member")?.value);
    if(!member||!out)return out.textContent="पहले परिवार सदस्य जोड़ें।";
    out.innerHTML="";
    try{const canvas=document.createElement("canvas");out.appendChild(canvas);const QR=await import("qrcode");await QR.toCanvas(canvas,JSON.stringify({app:"Fireroz Care",type:"family-member",memberId:member.id}));out.insertAdjacentHTML("beforeend",`<p><strong>${esc(member.name)}</strong> का QR तैयार है।</p>`);}
    catch(e){out.textContent="QR लाइब्रेरी उपलब्ध नहीं।";}
  }
  function showMemberProfile(memberId,target){
    const member=data.family.find(f=>f.id===memberId);if(!member){target.textContent="यह सदस्य इस ऐप के स्थानीय रिकॉर्ड में नहीं मिला।";return;}
    const meds=data.medicines.filter(m=>m.member===member.name);
    const appts=data.appointments.filter(a=>a.member===member.name).sort((a,b)=>(a.date||"").localeCompare(b.date||""));
    const records=data.records.filter(r=>r.member===member.name).sort((a,b)=>(b.date||"").localeCompare(a.date||""));
    const doseRows=[];meds.forEach(m=>(m.times||"").split(",").map(t=>t.trim()).filter(Boolean).forEach(t=>{const status=doseStatus(m.id,today(),t,member.name);doseRows.push(`<li>${esc(m.name)} · ${esc(t)} — <b>${status==="taken"?"ले ली":status==="missed"?"नहीं ली":"बाकी"}</b></li>`);}));
    target.innerHTML=`<section class="panel" style="margin-top:16px"><h2>${esc(member.name)} · ${esc(member.relation||"परिवार सदस्य")}</h2><h3>दवाइयाँ और आज की खुराक</h3>${meds.length?`<ul>${meds.map(m=>`<li>${esc(m.name)} · ${esc(m.dose||"")} · ${esc(m.times||"")}</li>`).join("")}</ul>`:"<p>दवाई दर्ज नहीं है।</p>"}${doseRows.length?`<ul>${doseRows.join("")}</ul>`:""}<h3>अपॉइंटमेंट</h3>${appts.length?`<ul>${appts.map(a=>`<li>${esc(a.date)} ${esc(a.time)} · ${esc(a.doctor||"डॉक्टर")} · ${esc(a.reason||"")}</li>`).join("")}</ul>`:"<p>अपॉइंटमेंट दर्ज नहीं है।</p>"}<h3>स्वास्थ्य रिपोर्ट / रिकॉर्ड</h3>${records.length?`<ul>${records.map(r=>`<li>${esc(r.date)} · ${esc(r.title)} — ${esc(r.notes||"")}</li>`).join("")}</ul>`:"<p>स्वास्थ्य रिकॉर्ड दर्ज नहीं है।</p>"}</section>`;
  }
  async function scanQR(){const el=document.getElementById("qr-reader");if(!el)return;try{const {Html5Qrcode}=await import("html5-qrcode");const scanner=new Html5Qrcode("qr-reader");await scanner.start({facingMode:"environment"},{fps:10,qrbox:220},decoded=>{scanner.stop();const target=document.getElementById("qr-result");try{const payload=JSON.parse(decoded);if(payload.app==="Fireroz Care"&&payload.type==="family-member"&&payload.memberId){showMemberProfile(payload.memberId,target);}else target.textContent="यह Fireroz Care परिवार सदस्य का QR नहीं है।";}catch{target.textContent="QR डेटा पढ़ा नहीं जा सका।";}},()=>{});}catch(e){el.textContent="कैमरा अनुमति या HTTPS आवश्यक है।";}}
  function init(){
    buildChrome();initRipple();
    try{history.replaceState({p:"dashboard"},"");}catch(e){}
    window.addEventListener("popstate",e=>nav((e.state&&e.state.p)||"dashboard",false));
    window.addEventListener("resize",updateChrome);
    render();startReminders();console.info("Fireroz Care ready");
  }
  function startReminders(){
    if(reminderTimer)clearInterval(reminderTimer);
    reminderTimer=setInterval(()=>{if(!data.settings.reminders||!("Notification"in window)||Notification.permission!=="granted")return;const now=new Date();const hm=now.toTimeString().slice(0,5);data.medicines.forEach(m=>(m.times||"").split(",").map(t=>t.trim()).filter(Boolean).forEach(t=>{if(t===hm&&doseStatus(m.id,today(),t,m.member||"आप")==="pending"){new Notification("Fireroz Care",{body:`${m.name} की खुराक का समय है।`});if(m.tune==="custom"&&m.customTuneData){const audio=new Audio(m.customTuneData);audio.play().catch(()=>{});}else playTune(m.tune||"tone1");}}));},30000);
  }
  return {init,resync:()=>Reminders.sync(data),setSetting:(k,v)=>{data.settings[k]=v;save();},getState:()=>JSON.parse(JSON.stringify(data)),getConfig:()=>({appName:"Fireroz Care",version:"2.1.0"})};
})();
document.addEventListener("DOMContentLoaded",()=>Intro.run().then(()=>Notice.run()).then(()=>About.run()).then(()=>{FirerozCare.init();FirerozCare.resync();Rating.maybeAsk();Feedback.initBack();}));
document.addEventListener("change",e=>{if(e.target&&e.target.id==="medname-toggle")FirerozCare.setSetting("showMedName",e.target.checked);});
document.addEventListener("click",e=>{const b=e.target.closest&&e.target.closest("[data-action=about],[data-action=rate-app],[data-action=feedback]");if(!b)return;if(b.dataset.action==="about")About.show();else if(b.dataset.action==="feedback")Feedback.openForm();else Rating.openStore();});
