# GTA 6 Zone gateway: a neon banner on both homepages (pure CSS sunset + live countdown) and a cinematic "warp"
# transition for every link into the zone (site.js). Idempotent: re-running replaces the marked blocks.
# usage: python tools/gta_portal.py <repo>
import io, os, re, sys
os.chdir(sys.argv[1])
def rd(p): return io.open(p, encoding="utf-8").read()
def wr(p, s): io.open(p, "w", encoding="utf-8", newline="").write(s)
B = {
 "en": dict(href="/gta-6", kick="New · Fan zone", t="GTA 6 ZONE", d="Out 19 November — countdown, mission overlays, crew names and wallpapers.", cta="Enter the zone", days="days to go"),
 "ar": dict(href="/ar/gta-6", kick="جديد · منطقة المعجبين", t="منطقة GTA 6", d="تنزل 19 نوفمبر — عدّاد، طبقات مهمات، أسماء عصابات وخلفيات.", cta="ادخل المنطقة", days="يوم متبقٍ"),
}
def banner(L):
    b = B[L]
    return ('  <!--GTA-PORTAL-->\n  <a class="gta-portal-card" href="%s" aria-label="%s">\n    <span class="gp-sky" aria-hidden="true"><i class="gp-sun"></i><i class="gp-grid"></i><i class="gp-palm l"></i><i class="gp-palm r"></i></span>\n'
            '    <span class="gp-body"><span class="gp-kick">%s</span><b class="gp-title">%s</b><span class="gp-desc">%s</span>'
            '<span class="gp-row"><span class="gp-count"><b data-gta-days>--</b> %s</span><span class="gp-cta">%s →</span></span></span>\n  </a>\n  <!--/GTA-PORTAL-->\n\n') % (b["href"], b["t"], b["kick"], b["t"], b["d"], b["days"], b["cta"])
for page, L in (("index.html", "en"), ("ar.html", "ar")):
    s = rd(page)
    s = re.sub(r"  <!--GTA-PORTAL-->.*?<!--/GTA-PORTAL-->\n\n", "", s, flags=re.S)
    anchor = "  <!--CREATOR-HUB-->"
    assert anchor in s, page
    s = s.replace(anchor, banner(L) + anchor, 1)
    wr(page, s)
PALM = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 160'%3E%3Cpath fill='%230a0212' d='M48 160c2-40 4-80 9-112l4 1c-4 32-6 72-7 111z'/%3E%3Cpath fill='%230a0212' d='M58 48c-14-14-38-16-56-6 18-4 36 0 52 10-18-2-36 8-46 24 14-12 32-18 50-14-10 10-14 26-12 42 4-16 12-30 22-38 8 8 14 22 14 38 4-16 0-32-8-42 18 0 34 8 44 20-8-16-24-28-44-28 16-10 34-12 50-6-16-10-38-10-54 2 4-14 14-26 28-32-18 2-32 14-40 30z'/%3E%3C/svg%3E\")"
CSS = """/* gta-portal */
.gta-portal-card{position:relative;display:grid;grid-template-columns:minmax(0,1fr);overflow:hidden;margin:26px 0 6px;border-radius:26px;text-decoration:none;color:#fff;min-height:220px;border:1px solid rgba(255,120,220,.4);box-shadow:0 30px 70px -36px rgba(255,45,149,.9);isolation:isolate;transition:transform .3s,box-shadow .3s}
.gta-portal-card:hover{transform:translateY(-4px) scale(1.005);box-shadow:0 40px 80px -36px rgba(60,240,255,.9)}
.gta-portal-card:focus-visible{outline:3px solid #3cf0ff;outline-offset:4px}
.gp-sky{position:absolute;inset:0;z-index:-1;background:linear-gradient(180deg,#0b0420 0%,#3a0b5c 38%,#c2185b 62%,#ff7a3d 72%,#2b0640 72.2%,#08020f 100%)}
.gp-sun{position:absolute;left:50%;top:22%;width:190px;height:190px;margin-left:-95px;border-radius:50%;background:linear-gradient(180deg,#ffe66d,#ff8a3d 55%,#ff2d75);box-shadow:0 0 60px rgba(255,120,80,.8);-webkit-mask:linear-gradient(#000 52%,transparent 52% 56%,#000 56% 64%,transparent 64% 69%,#000 69% 77%,transparent 77% 83%,#000 83% 90%,transparent 90%);mask:linear-gradient(#000 52%,transparent 52% 56%,#000 56% 64%,transparent 64% 69%,#000 69% 77%,transparent 77% 83%,#000 83% 90%,transparent 90%);clip-path:inset(0 0 calc(100% - 118px) 0)}
.gp-grid{position:absolute;left:-50%;right:-50%;bottom:0;height:28%;background:repeating-linear-gradient(90deg,rgba(255,64,170,.7) 0 2px,transparent 2px 60px),repeating-linear-gradient(0deg,rgba(255,64,170,.7) 0 2px,transparent 2px 28px);transform:perspective(220px) rotateX(58deg);transform-origin:bottom;animation:gpGrid 1.6s linear infinite}
@keyframes gpGrid{to{background-position:0 0,0 28px}}
.gp-palm{position:absolute;bottom:20%;width:120px;height:190px;background:""" + PALM + """ no-repeat bottom/contain;animation:gpSway 4s ease-in-out infinite alternate;transform-origin:50% 100%}
.gp-palm.l{left:3%}.gp-palm.r{right:3%;transform:scaleX(-1);animation-delay:-2s}
@keyframes gpSway{from{rotate:-2deg}to{rotate:3deg}}
.gp-body{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:6px;padding:28px 20px 22px;background:linear-gradient(180deg,rgba(11,4,32,.15),rgba(11,4,32,.55))}
.gp-kick{font:800 11.5px/1 Sora,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#3cf0ff;background:rgba(0,0,0,.35);padding:7px 12px;border-radius:999px;border:1px solid rgba(60,240,255,.4)}
html[lang=ar] .gp-kick{letter-spacing:0;font-family:"QT Arabic",sans-serif}
.gp-title{font:800 clamp(34px,6vw,58px)/1 Sora,"QT Arabic",sans-serif;background:linear-gradient(180deg,#fff6a8,#ffb347 45%,#ff2d95);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 4px 0 rgba(0,0,0,.5)) drop-shadow(0 0 22px rgba(255,45,149,.6))}
.gp-desc{max-width:560px;font-size:15px;color:#f3dcff;text-shadow:0 2px 8px rgba(0,0,0,.6)}
.gp-row{display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center;margin-top:6px}
.gp-count{font-weight:700;color:#fff;background:rgba(0,0,0,.45);padding:8px 14px;border-radius:12px;border:1px solid rgba(255,45,149,.5)}.gp-count b{font:800 20px/1 Sora,sans-serif;color:#ffb347}
.gp-cta{font-weight:800;padding:10px 18px;border-radius:999px;background:linear-gradient(135deg,#ff2d95,#ff7a3d);box-shadow:0 10px 24px -10px rgba(255,45,149,.9)}
@media (prefers-reduced-motion: reduce){.gp-grid,.gp-palm{animation:none}}
/* warp transition into the zone */
.gta-warp{position:fixed;inset:0;z-index:99999;pointer-events:none;overflow:hidden;background:#0b0420;animation:gtaWarpIn .7s cubic-bezier(.7,0,.3,1) forwards}
.gta-warp::before{content:"";position:absolute;inset:-20%;background:conic-gradient(from 0deg,#ff2d95,#ffb347,#3cf0ff,#9b30ff,#ff2d95);filter:blur(30px);animation:gtaSpin .7s linear forwards;opacity:.85}
.gta-warp::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.35) 0 2px,transparent 2px 4px)}
.gta-warp b{position:absolute;left:50%;top:50%;translate:-50% -50%;z-index:1;font:800 clamp(30px,7vw,70px)/1 Sora,"QT Arabic",sans-serif;color:#fff;text-shadow:3px 0 #ff2d95,-3px 0 #3cf0ff,0 0 30px #fff;white-space:nowrap;animation:gtaWarpTxt .7s ease-out forwards}
@keyframes gtaWarpIn{from{clip-path:circle(0% at var(--wx,50%) var(--wy,50%))}to{clip-path:circle(150% at var(--wx,50%) var(--wy,50%))}}
@keyframes gtaSpin{to{transform:rotate(200deg) scale(1.3)}}
@keyframes gtaWarpTxt{from{opacity:0;scale:1.6;letter-spacing:.4em}to{opacity:1;scale:1;letter-spacing:.02em}}
/* /gta-portal */
"""
s = rd("styles.css"); s = re.sub(r"/\* gta-portal \*/.*?/\* /gta-portal \*/\n", "", s, flags=re.S); wr("styles.css", s.rstrip("\n") + "\n" + CSS)
JS = """// gta-portal: days-to-go on the homepage banner + cinematic warp into the GTA 6 Zone
(function () {
  var launch = new Date("2026-11-19T00:00:00").getTime();
  document.querySelectorAll("[data-gta-days]").forEach(function (el) { el.textContent = String(Math.max(0, Math.ceil((launch - Date.now()) / 86400000))); });
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]"); if (!a || reduce || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin !== location.origin || !/^\\/(ar\\/)?gta-6\\/?$/.test(u.pathname) || u.pathname === location.pathname) return;
    e.preventDefault();
    try { sessionStorage.setItem("qtGtaWarp", "1"); } catch (x) {}
    var w = document.createElement("div"); w.className = "gta-warp"; w.style.setProperty("--wx", e.clientX + "px"); w.style.setProperty("--wy", e.clientY + "px");
    var b = document.createElement("b"); b.textContent = (document.documentElement.lang || "").indexOf("ar") === 0 ? "أهلًا بك في المنطقة" : "ENTERING THE ZONE"; w.appendChild(b);
    document.body.appendChild(w); if (typeof qtEvent === "function") qtEvent("gta_portal");
    setTimeout(function () { location.href = u.href; }, 720);
  });
})();
// /gta-portal
"""
s = rd("site.js"); s = re.sub(r"// gta-portal: .*?// /gta-portal\n", "", s, flags=re.S); wr("site.js", s.rstrip("\n") + "\n" + JS)
print("gta portal: homepages, styles.css, site.js")
