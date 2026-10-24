// App intro animation (public/intro.mp4). Plays muted on every launch, max ~6s, can be skipped.
export const Intro = { run() { return new Promise(res => {
  const g = document.createElement("div");
  g.style.cssText = "position:fixed;inset:0;z-index:100010;background:#fff;display:flex;align-items:center;justify-content:center";
  g.innerHTML = `<video src="/intro.mp4" muted playsinline autoplay preload="auto" style="width:100%;height:100%;object-fit:contain;background:#fff"></video>
<button id="intro-skip" style="position:absolute;top:calc(env(safe-area-inset-top,0px) + 14px);right:14px;padding:8px 14px;border:0;border-radius:20px;background:rgba(0,0,0,.45);color:#fff;font-size:14px">Skip</button>`;
  document.body.appendChild(g);
  let done = false;
  const finish = () => { if (done) return; done = true; g.style.transition = "opacity .35s"; g.style.opacity = "0"; setTimeout(() => { g.remove(); res(); }, 360); };
  const v = g.querySelector("video");
  v.addEventListener("ended", finish);
  v.addEventListener("error", finish);
  v.play().catch(finish);
  g.querySelector("#intro-skip").onclick = finish;
  setTimeout(finish, 6500);
}); } };
