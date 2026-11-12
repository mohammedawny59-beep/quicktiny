# Writes EN/AR bodies + style for the GTA 6 Zone (unofficial fan section) — cinematic edition.
# Scripts: gta.js (world canvas, countdown, overlays, crews, wallpapers, checklist), gta-story.js (scroll scenes,
# tilt, storage calc, Vice poster, OBS kit), gta-map.js (illustrative 3D map, ES module).
# Visuals are original: AI-generated scenery (assets/gta6/*.webp) + canvas/CSS. The official logo appears only in
# the editorial facts box, credited to Rockstar Games. Place/character texts are our own short summaries.
import io, os, json
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
FACES = "".join('    @font-face{font-family:"QT Lalezar";font-weight:400;font-display:swap;src:url(/fonts/display/lalezar-%s-400.woff2) format("woff2");unicode-range:%s}\n' % (sub, ur)
    for sub, ur in (("arabic", "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC"),
                    ("latin", "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD")))
STYLE = """  <style>
""" + FACES + """    body:has(#gtaZone){--accent:#ff2d95;--cyan:#3cf0ff;--card:rgba(24,8,46,.88);--line:rgba(255,120,220,.22);--line-strong:rgba(255,120,220,.4);--muted:#d9b8ff;--text-dim:#f3dcff;background:#0b0420!important;overflow-x:clip}
    body:has(#gtaZone) header,body:has(#gtaZone) .site-header{background:rgba(11,4,32,.94)!important}
    body:has(#gtaZone) footer{background:rgba(8,2,18,.9)}
    html:has(#gtaZone){overflow-x:clip}
    .gs-ticker{max-width:100vw}
    #gtaWorld{position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;display:block}
    .gs-full{width:100vw;margin-inline:calc(50% - 50vw);position:relative}
    .gs-h2{font:400 clamp(34px,6vw,68px)/1 "QT Lalezar",Sora,sans-serif;color:#fff;margin:0 0 10px;text-shadow:0 0 30px rgba(255,45,149,.55)}
    html[lang=en] .gs-h2{font:800 clamp(30px,5vw,58px)/1.02 Sora,sans-serif;letter-spacing:-.02em}
    .gs-kick{display:inline-block;font:800 12px/1 Sora,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#3cf0ff;margin-bottom:12px}
    html[lang=ar] .gs-kick{letter-spacing:0;font:800 15px/1.2 "QT Arabic",sans-serif}
    .gs-lead{color:#f3dcff;font-size:17px;line-height:1.75;max-width:760px}
    [data-reveal]{opacity:0;transform:translateY(48px);transition:opacity .9s cubic-bezier(.2,.8,.2,1),transform .9s cubic-bezier(.2,.8,.2,1);transition-delay:var(--d,0s)}
    [data-reveal="left"]{transform:translateX(-60px)}[data-reveal="zoom"]{transform:scale(.9)}
    [data-reveal].in{opacity:1;transform:none}
    /* HERO */
    #gsHero{height:100vh;min-height:620px;overflow:hidden;display:grid;place-items:center;text-align:center;margin-top:-20px;--mx:0;--my:0}
    #gsHeroImg{position:absolute;inset:-6% -4%;background:url(/assets/gta6/hero.webp) center/cover;transform:scale(1.12);will-change:transform;filter:saturate(1.15)}
    #gsHero::before{content:"";position:absolute;inset:0;z-index:1;background:radial-gradient(ellipse at 50% 60%,rgba(11,4,32,.15),rgba(11,4,32,.85) 75%),linear-gradient(180deg,rgba(11,4,32,.55),transparent 30%,transparent 60%,#0b0420)}
    .gs-hero-in{position:relative;z-index:2;padding:0 18px;opacity:var(--gs-fade,1);transform:translate3d(calc(var(--mx)*-18px),calc(var(--my)*-12px),0)}
    .gs-badge{display:inline-flex;gap:8px;align-items:center;font:700 13px/1 Sora,"QT Arabic",sans-serif;color:#fff;background:rgba(0,0,0,.45);border:1px solid rgba(60,240,255,.45);padding:9px 14px;border-radius:999px}
    .gs-badge i{width:8px;height:8px;border-radius:50%;background:#47ff9c;box-shadow:0 0 10px #47ff9c;animation:gsBlink 1.2s infinite}
    @keyframes gsBlink{50%{opacity:.25}}
    .gs-title{margin:18px 0 6px;font:400 clamp(70px,15vw,190px)/.9 "QT Lalezar",Sora,sans-serif;background:linear-gradient(180deg,#fff6a8 5%,#ffb347 40%,#ff2d95 72%,#9b30ff);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 8px 0 rgba(0,0,0,.45)) drop-shadow(0 0 40px rgba(255,45,149,.6))}
    html[lang=en] .gs-title{font:800 clamp(64px,13vw,170px)/.9 Sora,"Arial Black",sans-serif;letter-spacing:-.04em}
    .gs-w{display:inline-block;padding:.04em .08em .1em;margin:0 .06em;background:linear-gradient(180deg,#fff6a8 5%,#ffb347 40%,#ff2d95 72%,#9b30ff);-webkit-background-clip:text;background-clip:text;color:transparent;animation:gsRise .9s cubic-bezier(.2,.9,.2,1) both;animation-delay:calc(var(--i)*.14s + .15s);will-change:transform}
    @keyframes gsRise{from{opacity:0;transform:translateY(40%) scale(.85)}}
    .gs-sub{color:#fff;font-size:clamp(16px,2vw,21px);text-shadow:0 2px 14px rgba(0,0,0,.8);max-width:700px;margin:0 auto}
    #gtaCount{display:flex;justify-content:center;gap:12px;margin:22px 0 6px;flex-wrap:nowrap}
    .gta-cell{min-width:88px;padding:14px 10px 10px;border-radius:18px;background:rgba(10,2,25,.78);border:1px solid rgba(255,45,149,.45);box-shadow:0 0 24px rgba(255,45,149,.25)}
    .gta-cell b{display:block;font:800 44px/1 Sora,sans-serif;color:#fff;text-shadow:0 0 18px #ff2d95;font-variant-numeric:tabular-nums}
    .gta-cell span{display:block;margin-top:6px;font-size:12px;color:#3cf0ff;text-transform:uppercase;letter-spacing:.1em}html[lang=ar] .gta-cell span{letter-spacing:0}
    .gta-cell.tick b{animation:gtaTick .45s cubic-bezier(.2,1.6,.4,1)}@keyframes gtaTick{from{transform:translateY(-10px) scale(1.15);opacity:.4}}
    @media(max-width:480px){#gtaCount{gap:6px}.gta-cell{min-width:0;flex:1 1 0;padding:10px 4px 8px}.gta-cell b{font-size:28px}.gta-cell span{font-size:10px}}
    .gta-out{font:800 34px/1.2 Sora,"QT Lalezar",sans-serif;color:#fff;text-shadow:0 0 22px #3cf0ff}
    .gs-scroll{position:absolute;z-index:2;bottom:26px;left:50%;translate:-50% 0;width:26px;height:42px;border:2px solid rgba(255,255,255,.7);border-radius:14px}
    .gs-scroll::after{content:"";position:absolute;left:50%;top:8px;width:4px;height:8px;margin-left:-2px;border-radius:2px;background:#fff;animation:gsWheel 1.6s infinite}
    @keyframes gsWheel{to{transform:translateY(14px);opacity:0}}
    /* TICKER */
    .gs-ticker{overflow:hidden;border-block:1px solid rgba(255,45,149,.4);background:linear-gradient(90deg,#ff2d95,#ff8a3d,#ff2d95);padding:12px 0;transform:rotate(-1.2deg);margin:10px 0 50px}
    .gs-ticker div{display:flex;gap:46px;width:max-content;animation:gsMarquee 40s linear infinite;font:800 17px/1 Sora,"QT Arabic",sans-serif;color:#12042c;white-space:nowrap}
    html[dir=rtl] .gs-ticker div{animation-direction:reverse}
    @keyframes gsMarquee{to{transform:translateX(-50%)}}
    /* STORY */
    #gsStoryBox{min-height:120vh;display:flex;align-items:center;padding:60px 0}
    #gsStory{font:400 clamp(28px,4.4vw,56px)/1.35 "QT Lalezar",Sora,sans-serif;color:rgba(255,255,255,.14);margin:0}
    html[lang=en] #gsStory{font:700 clamp(26px,3.8vw,50px)/1.3 Sora,sans-serif;letter-spacing:-.01em}
    #gsStory span{transition:color .35s,text-shadow .35s}#gsStory span.lit{color:#fff;text-shadow:0 0 24px rgba(255,45,149,.45)}
    /* PLACES (pinned horizontal track) */
    #gsPlaces{height:520vh}
    .gs-sticky{position:sticky;top:0;height:100vh;overflow:hidden;display:flex;flex-direction:column;justify-content:center;gap:22px}
    .gs-sticky header{padding:0 max(18px,calc(50vw - 590px))}
    #gsRail{display:flex;gap:26px;width:max-content;padding:0 max(18px,calc(50vw - 590px));will-change:transform}
    .gs-place{position:relative;width:min(72vw,880px);height:min(58vh,520px);border-radius:28px;overflow:hidden;flex:none;box-shadow:0 40px 80px -40px rgba(255,45,149,.8);border:1px solid rgba(255,255,255,.12)}
    .gs-place img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scale(1.08);transition:transform 6s ease-out}
    .gs-place:hover img{transform:scale(1.18)}
    .gs-place::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 35%,rgba(11,4,32,.92))}
    .gs-place div{position:absolute;z-index:1;inset:auto 0 0 0;padding:26px 30px}
    .gs-place small{font:800 12px/1 Sora,sans-serif;color:#3cf0ff;letter-spacing:.18em}
    .gs-place h3{margin:8px 0 6px;font:400 clamp(34px,4.6vw,58px)/1 "QT Lalezar",Sora,sans-serif;color:#fff}
    html[lang=en] .gs-place h3{font:800 clamp(30px,4vw,52px)/1 Sora,sans-serif}
    .gs-place p{margin:0;color:#f3dcff;max-width:560px;font-size:15.5px;line-height:1.6}.gs-place em{display:block;margin-top:6px;font-style:normal;font-size:12.5px;color:#ffb347}
    .gs-pbar{height:4px;margin:0 max(18px,calc(50vw - 590px));background:rgba(255,255,255,.12);border-radius:4px;overflow:hidden}#gsPlacesBar{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff2d95,#3cf0ff)}
    @media(max-width:760px){#gsPlaces{height:auto}.gs-sticky{position:static;height:auto;padding:40px 0}#gsRail{flex-direction:column;width:auto;transform:none!important}.gs-place{width:auto;height:62vh}.gs-pbar{display:none}}
    /* MAP */
    .gs-sec{padding:70px 0;scroll-margin-top:70px}
    #gsMap{position:relative;height:min(78vh,720px);border-radius:28px;overflow:hidden;border:1px solid rgba(255,120,220,.35);box-shadow:0 40px 90px -40px rgba(255,45,149,.9);background:#12042c;touch-action:none}
    #gsMap canvas{display:block;width:100%;height:100%;cursor:grab}#gsMap canvas:active{cursor:grabbing}
    #gsMapPins{position:absolute;inset:0;pointer-events:none}
    .gs-pin{all:unset;position:absolute;left:0;top:0;pointer-events:auto;cursor:pointer;font:800 13px/1 Sora,"QT Arabic",sans-serif;color:#fff;background:rgba(11,4,32,.82);border:1px solid var(--pc);box-shadow:0 0 16px var(--pc);padding:8px 12px;border-radius:999px;white-space:nowrap;transition:opacity .3s,background .2s}
    .gs-pin:hover,.gs-pin.on{background:var(--pc);color:#12042c}.gs-pin:focus-visible{outline:2px solid #fff}
    #gsMapCard{position:absolute;inset-inline-start:16px;bottom:16px;width:min(340px,calc(100% - 32px));border-radius:20px;overflow:hidden;background:rgba(11,4,32,.9);border:1px solid rgba(255,120,220,.4);animation:gsCard .5s cubic-bezier(.2,.9,.2,1)}
    @keyframes gsCard{from{opacity:0;transform:translateY(20px)}}
    #gsMapCard img{display:block;width:100%;height:150px;object-fit:cover}#gsMapCard div{padding:14px 16px}#gsMapCard b{font-size:20px;color:#fff}#gsMapCard p{margin:6px 0 0;color:#f3dcff;font-size:14px;line-height:1.55}#gsMapCard em{display:block;margin-top:6px;font-style:normal;font-size:12px;color:#ffb347}
    .gs-x{all:unset;position:absolute;top:8px;inset-inline-end:10px;cursor:pointer;width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;text-align:center;line-height:30px}
    .gs-maptools{position:absolute;top:14px;inset-inline-end:14px;display:flex;gap:8px;align-items:center}
    .gs-maptools span{font-size:12px;color:#fff;background:rgba(0,0,0,.55);padding:7px 11px;border-radius:999px}
    #gsMap.nogl{display:grid;place-items:center;color:#fff;padding:24px;text-align:center}#gsMap.nogl::after{content:attr(data-nogl)}
    /* CHARACTERS */
    .gs-cast{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}
    .gs-cc{position:relative;padding:22px;border-radius:24px;min-height:190px;overflow:hidden;background:linear-gradient(150deg,var(--c1),var(--c2));transition:transform .2s ease-out;transform-style:preserve-3d;border:1px solid rgba(255,255,255,.18)}
    .gs-cc::after{content:"";position:absolute;inset:0;background:radial-gradient(circle at var(--gx,50%) var(--gy,50%),rgba(255,255,255,.28),transparent 45%);pointer-events:none}
    .gs-cc .mono{position:absolute;inset-inline-end:-6px;bottom:-26px;font:800 120px/1 Sora,sans-serif;color:rgba(255,255,255,.09);pointer-events:none}
    .gs-cc b{display:block;font:800 21px/1.1 Sora,"QT Arabic",sans-serif;color:#fff}.gs-cc small{display:block;margin:4px 0 10px;color:rgba(255,255,255,.8);font-weight:700}
    .gs-cc p{position:relative;margin:0;color:#fff;font-size:14.5px;line-height:1.55;text-shadow:0 1px 6px rgba(0,0,0,.35)}
    /* CONSOLES */
    .gs-cons{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px}
    .gs-con{padding:20px;border-radius:22px;background:var(--card);border:1px solid var(--line)}
    .gs-con.best{border-color:#3cf0ff;box-shadow:0 0 30px rgba(60,240,255,.25)}
    .gs-con h3{margin:0 0 4px;font-size:19px;color:#fff}.gs-con .tag{display:inline-block;font-size:11.5px;font-weight:800;color:#12042c;background:#3cf0ff;border-radius:999px;padding:4px 9px;margin-bottom:10px}
    .gs-con ul{margin:0;padding-inline-start:18px;color:#f3dcff;font-size:14px;line-height:1.7}
    .gs-space{margin-top:20px;padding:20px;border-radius:22px;background:rgba(0,0,0,.35);border:1px solid rgba(255,45,149,.35)}
    .gs-space label{font-weight:800;color:#fff}.gs-space input{max-width:180px;margin:8px 0}
    .gs-sbar{height:14px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}#gsSpaceBar{display:block;height:100%;width:0;transition:width .4s,background .4s;background:#ff3b4e}#gsSpaceBar.ok{background:linear-gradient(90deg,#47ff9c,#3cf0ff)}#gsSpaceBar.tight{background:#ffb347}
    #gsSpaceMsg{margin-top:8px;font-weight:800;color:#fff;min-height:1.4em}
    /* GEAR ADVISOR */
    .gs-gear{padding:24px;border-radius:26px;background:linear-gradient(150deg,rgba(60,240,255,.12),rgba(255,45,149,.14)),var(--card);border:1px solid rgba(60,240,255,.35);box-shadow:0 30px 70px -40px rgba(60,240,255,.7)}
    .gs-gear .gta-row{grid-template-columns:130px minmax(0,1fr)}
    #gsGearList{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px;margin-top:16px}
    .gs-gear-card{position:relative;display:flex;flex-direction:column;gap:6px;padding:18px;border-radius:18px;text-decoration:none;color:#fff;background:rgba(10,3,26,.78);border:1px solid rgba(255,255,255,.12);transition:transform .2s,border-color .2s,box-shadow .2s;animation:gsCard .5s cubic-bezier(.2,.9,.2,1) both;animation-delay:var(--d,0s)}
    .gs-gear-card:hover{transform:translateY(-4px);border-color:#3cf0ff;box-shadow:0 18px 40px -20px rgba(60,240,255,.8)}.gs-gear-card:focus-visible{outline:2px solid #3cf0ff}
    .gs-gear-card.p1{border-color:rgba(255,45,149,.6);box-shadow:0 0 0 1px rgba(255,45,149,.25)}
    .gs-gear-card .pri{align-self:flex-start;font-size:11.5px;font-weight:800;padding:4px 9px;border-radius:999px;background:#3cf0ff;color:#12042c}.gs-gear-card.p1 .pri{background:#ff2d95;color:#fff}.gs-gear-card.p3 .pri{background:rgba(255,255,255,.16);color:#fff}
    .gs-gear-card b{font-size:17px}.gs-gear-card p{margin:0;color:#e9d6ff;font-size:14px;line-height:1.6;flex:1}.gs-gear-card .go{font-weight:800;color:#ffb347;font-size:14px}
    .gs-aff{font-size:12px;color:#cfa8ff;margin:12px 0 0;line-height:1.6}
    html.gs-still .gs-gear-card{animation:none}
    @media(max-width:520px){.gs-gear .gta-row{grid-template-columns:1fr}}
    /* CONFIRMED vs PREDICTIONS */
    .gs-cvp{display:grid;grid-template-columns:1fr 1fr;gap:16px}@media(max-width:760px){.gs-cvp{grid-template-columns:1fr}}
    .gs-cvp>div{padding:22px;border-radius:22px;background:var(--card);border:1px solid var(--line)}
    .gs-cvp h3{margin:0 0 12px;font-size:20px;color:#fff}.gs-cvp li{color:#f3dcff;margin-bottom:8px;line-height:1.55}
    .gs-cvp .pred{border-style:dashed;border-color:rgba(255,179,71,.6)}.gs-cvp .pred h3{color:#ffb347}
    /* FACTS + generic boxes (from the first edition) */
    .gta-box{border-radius:24px;padding:22px;margin:22px 0;background:var(--card);border:1px solid var(--line);box-shadow:0 30px 60px -40px rgba(255,45,149,.8);scroll-margin-top:80px}
    .gta-box h2{margin:0 0 6px;font:400 30px/1.15 "QT Lalezar",Sora,sans-serif;color:#fff;text-shadow:0 0 18px rgba(255,45,149,.6)}html[lang=en] .gta-box h2{font:800 26px/1.2 Sora,sans-serif}
    .gta-box>p{color:#f3dcff;margin:0 0 14px}
    .gta-facts{display:grid;grid-template-columns:200px minmax(0,1fr);gap:22px;align-items:center}@media(max-width:640px){.gta-facts{grid-template-columns:1fr;text-align:center}}
    .gta-facts figure{margin:0}.gta-facts img{width:100%;max-width:200px;height:auto;display:block;margin:0 auto;filter:drop-shadow(0 10px 22px rgba(0,0,0,.5))}
    .gta-facts figcaption{font-size:11.5px;color:#cfa8ff;margin-top:8px;line-height:1.5}
    .gta-facts ul{margin:0;padding:0;list-style:none;display:grid;gap:8px}.gta-facts li{color:#fff;font-size:15px}.gta-facts li b{color:#ffb347}
    .gta-src{font-size:12.5px;color:#cfa8ff;margin-top:10px}.gta-src a{color:#3cf0ff}
    .gta-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:start}@media(max-width:860px){.gta-two{grid-template-columns:1fr}}
    .gta-row{display:grid;grid-template-columns:110px minmax(0,1fr);gap:10px;align-items:center;margin-bottom:10px}.gta-row label,.gta-row .gl{font-weight:700;color:#f3dcff;font-size:14px}.gta-row input{margin:0}
    .gta-chips{display:flex;flex-wrap:wrap;gap:6px}@media(max-width:520px){.gta-row{grid-template-columns:1fr}}
    .gta-screen{border-radius:16px;overflow:hidden;border:6px solid #15052b;box-shadow:0 0 0 1px rgba(255,120,220,.35),0 24px 50px -24px rgba(255,45,149,.8);background:#000;max-height:60vh;margin:0 auto}.gta-screen canvas{display:block;width:100%;height:100%}
    .gta-msg{font-weight:700;color:#f3dcff;min-height:1.4em;margin-top:8px;text-align:center}
    #gtaCrews{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin:12px 0}
    .gta-crew{all:unset;cursor:pointer;display:flex;justify-content:space-between;gap:10px;align-items:center;padding:14px 16px;border-radius:14px;background:linear-gradient(135deg,rgba(255,45,149,.18),rgba(60,240,255,.08));border:1px solid rgba(255,120,220,.3);transition:transform .2s,border-color .2s}
    .gta-crew:hover{transform:translateY(-2px);border-color:#3cf0ff}.gta-crew.ok{border-color:#47ff9c}.gta-crew:focus-visible{outline:2px solid #3cf0ff}.gta-crew b{color:#fff;font-size:16px}.gta-crew span{font:800 13px/1 Sora,monospace;color:#3cf0ff}
    #gtaWp,#gsPoster{display:block;margin:0 auto;border-radius:14px;box-shadow:0 20px 40px -20px rgba(0,0,0,.8);max-width:100%;height:auto}
    .gta-files label.btn{cursor:pointer}.gta-files input{position:absolute;width:1px;height:1px;opacity:0}
    #gtaCheck{display:grid;gap:8px;margin:10px 0}#gtaCheck label{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:12px;background:rgba(0,0,0,.25);border:1px solid rgba(255,120,220,.2);color:#fff;cursor:pointer;line-height:1.5}
    #gtaCheck input{margin-top:3px;accent-color:#ff2d95;width:18px;height:18px;flex:none}
    .gta-bar{height:10px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}.gta-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff2d95,#ffb347,#3cf0ff);transition:width .4s}
    .gta-kit{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
    .gta-kit a{display:block;padding:16px;border-radius:16px;text-decoration:none;color:#fff;background:rgba(0,0,0,.3);border:1px solid rgba(60,240,255,.3);transition:transform .2s,border-color .2s}.gta-kit a:hover{transform:translateY(-3px);border-color:#ff2d95}.gta-kit b{display:block;font-size:16px;margin-bottom:4px}.gta-kit span{font-size:13px;color:#d9b8ff;line-height:1.5}
    .gs-obs-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.gs-obs-row input{flex:1;min-width:220px;margin:0;font:600 13px/1.4 ui-monospace,monospace}
    #gsObsFrame{width:100%;aspect-ratio:16/9;border:0;border-radius:14px;background:repeating-conic-gradient(#222 0 25%,#333 0 50%) 0 0/24px 24px;display:block}
    .gta-disc{font-size:12.5px;color:#cfa8ff;text-align:center;margin:26px 0 8px;line-height:1.6}
    html.gta-arrive body::after{content:"";position:fixed;inset:0;z-index:9999;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,45,149,.35) 0 2px,rgba(60,240,255,.18) 2px 4px),linear-gradient(180deg,#ff2d95,#3cf0ff);mix-blend-mode:screen;animation:gtaArrive 1.3s cubic-bezier(.2,.8,.2,1) forwards}
    @keyframes gtaArrive{0%{opacity:1;clip-path:inset(0 0 0 0)}60%{opacity:.8}100%{opacity:0;clip-path:inset(100% 0 0 0)}}
    /* OBS browser-source mode */
    html.gs-obs,html.gs-obs body,html.gs-obs body:has(#gtaZone){background:transparent!important;overflow:hidden}
    html.gs-obs body>*:not(.gs-obs-canvas){display:none!important}
    .gs-obs-canvas{position:fixed;inset:0;width:100vw;height:100vh;object-fit:contain}
    html.gs-still [data-reveal]{opacity:1;transform:none;transition:none}html.gs-still .gs-w,html.gs-still .gs-title,html.gs-still .gs-ticker div,html.gs-still .gs-scroll::after,html.gs-still .gs-badge i{animation:none}html.gs-still.gta-arrive body::after{display:none}
    html.gs-still #gsPlaces{height:auto}html.gs-still .gs-sticky{position:static;height:auto;padding:40px 0}html.gs-still #gsRail{flex-wrap:wrap;width:auto;justify-content:center}html.gs-still .gs-place{width:min(100%,560px);height:360px}html.gs-still .gs-pbar{display:none}
    .gs-motion{all:unset;position:fixed;z-index:50;bottom:16px;inset-inline-end:16px;cursor:pointer;font:800 13px/1 Sora,"QT Arabic",sans-serif;color:#fff;background:rgba(11,4,32,.85);border:1px solid rgba(60,240,255,.5);padding:10px 14px;border-radius:999px;box-shadow:0 8px 24px -10px rgba(255,45,149,.8)}.gs-motion:focus-visible{outline:2px solid #3cf0ff}
  </style>
"""
PLACES = {
 "en": [("vice-city", "Vice City", "Neon nights, art deco hotels and the beachfront strip — the beating heart of Leonida.", "Seems inspired by Miami", .84, .71, "#ff2d95"),
        ("leonida-keys", "Leonida Keys", "A chain of islands and long bridges over turquoise water, where boats move more than tourists.", "Seems inspired by the Florida Keys", .66, .975, "#3cf0ff"),
        ("grassrivers", "Grassrivers", "Endless sawgrass swamps, airboats and wildlife — the wild south of the state.", "Seems inspired by the Everglades", .72, .79, "#47ff9c"),
        ("port-gellhorn", "Port Gellhorn", "A gritty Gulf-coast port town of cranes, warehouses and roadside motels.", "Seems inspired by Florida’s Gulf coast", .07, .18, "#ffb347"),
        ("ambrosia", "Ambrosia", "Sugar-cane country around a huge inland lake, ruled by mills and farm roads.", "Seems inspired by the Lake Okeechobee area", .68, .52, "#ffe66d"),
        ("mount-kalaga", "Mount Kalaga", "Forested hills, rivers and springs — the state’s wild national park up north.", "Seems inspired by North Florida’s parks", .50, .145, "#9b7bff")],
 "ar": [("vice-city", "فايس سيتي", "ليالي النيون وفنادق آرت ديكو وشارع الشاطئ — قلب ليونيدا النابض.", "مستوحاة على ما يبدو من ميامي", .84, .71, "#ff2d95"),
        ("leonida-keys", "جزر ليونيدا", "سلسلة جزر وجسور طويلة فوق مياه فيروزية، القوارب فيها أكثر من السياح.", "مستوحاة على ما يبدو من جزر فلوريدا كيز", .66, .975, "#3cf0ff"),
        ("grassrivers", "غراس ريفرز", "مستنقعات أعشاب لا نهاية لها وقوارب هوائية وحياة برية — جنوب الولاية المتوحش.", "مستوحاة على ما يبدو من الإيفرغليدز", .72, .79, "#47ff9c"),
        ("port-gellhorn", "بورت جيلهورن", "مدينة ميناء قاسية على الخليج: رافعات ومستودعات وموتيلات على الطريق.", "مستوحاة على ما يبدو من ساحل خليج فلوريدا", .07, .18, "#ffb347"),
        ("ambrosia", "أمبروسيا", "أرض قصب السكر حول بحيرة داخلية ضخمة، تحكمها المصانع وطرق المزارع.", "مستوحاة على ما يبدو من منطقة بحيرة أوكيتشوبي", .68, .52, "#ffe66d"),
        ("mount-kalaga", "جبل كالاغا", "تلال وغابات وأنهار وينابيع — الحديقة الوطنية البرية في الشمال.", "مستوحاة على ما يبدو من حدائق شمال فلوريدا", .50, .145, "#9b7bff")],
}
CAST = {
 "en": [("Jason Duval", "Lead", "An ex-soldier running jobs for smugglers in the Keys, chasing an easier life that keeps slipping away.", "#ff2d95", "#6a1b9a"),
        ("Lucia Caminos", "Lead", "Fresh out of prison with a plan — this time only smart moves, for the life her family dreamed of.", "#ff8a3d", "#c2185b"),
        ("Cal Hampton", "Jason’s friend", "A happily paranoid homebody who listens in on Coast Guard radio.", "#3cf0ff", "#1a237e"),
        ("Boobie Ike", "Vice City legend", "Turned street years into an empire: real estate, a club and a studio.", "#ffb347", "#bf360c"),
        ("Dre’Quan Priest", "Music hustler", "Runs a young record label and wants his first real hit.", "#47ff9c", "#00695c"),
        ("Real Dimez", "Rap duo", "Two friends riding viral hooks and social media towards fame.", "#ff6bd6", "#4a148c"),
        ("Raul Bautista", "Bank robber", "A charming veteran of big scores, always recruiting bold talent.", "#ffe66d", "#5d4037"),
        ("Brian Heder", "Old-school smuggler", "A Keys veteran who lets others do the dirty work from his boat yard.", "#8ecae6", "#0d47a1")],
 "ar": [("جيسون دوفال", "بطل", "جندي سابق يشتغل مع مهرّبين في الجزر، ويطارد حياة أسهل بتهرب منه كل مرة.", "#ff2d95", "#6a1b9a"),
        ("لوسيا كامينوس", "بطلة", "طالعة من السجن ومعها خطة — هالمرة حركات ذكية بس، عشان الحياة اللي حلمت فيها عيلتها.", "#ff8a3d", "#c2185b"),
        ("كال هامبتون", "صديق جيسون", "قاعد بالبيت مبسوط بشكوكه، يتنصت على راديو خفر السواحل.", "#3cf0ff", "#1a237e"),
        ("بوبي آيك", "أسطورة فايس سيتي", "حوّل سنين الشارع لإمبراطورية: عقارات ونادٍ واستوديو.", "#ffb347", "#bf360c"),
        ("دريكوان بريست", "منتج طموح", "يدير شركة تسجيلات صغيرة ويدوّر على أول هيت حقيقي.", "#47ff9c", "#00695c"),
        ("ريل دايمز", "ثنائي راب", "صديقتين راكبين موجة الترند والسوشال نحو الشهرة.", "#ff6bd6", "#4a148c"),
        ("راؤول باوتيستا", "لص بنوك", "محترف ساحر بالعمليات الكبيرة، دايمًا يجنّد مواهب جريئة.", "#ffe66d", "#5d4037"),
        ("براين هيدر", "مهرّب قديم", "من جيل التهريب الذهبي بالجزر، يخلّي غيره يعمل الشغل الوسخ.", "#8ecae6", "#0d47a1")],
}
T = {
 "en": dict(home="/", homeL="Home", crumb="GTA 6 Zone", badge="Pre-load is live", title="GTA 6 ZONE", sub="Leonida opens 19 November. Countdown, an interactive 3D map, the places and the people, console guide — and creator tools built for launch week.",
   ticker=["PRE-LOAD IS LIVE", "UP TO 212 GB", "19 NOVEMBER 2026", "PS5 · PS5 PRO · XBOX SERIES X|S", "TARGETING 30 FPS", "XBOX CLOUD GAMING — EVEN ON XBOX ONE", "REMOTE PLAY SUPPORTED", "OFFICIAL MAP DROPS ON LAUNCH DAY"],
   storyK="The story", story="Two people, one easy score that goes wrong, and the sunniest state in America showing its darkest side. Jason and Lucia only have each other — and a conspiracy that stretches across all of Leonida.",
   placesK="Only in Leonida", placesT="Six places to know", mapK="Interactive", mapT="Leonida in 3D", mapP="Drag to spin, right-drag or Shift-drag to move, scroll or pinch to zoom, tap a pin to fly there. Switch to night to see the city light up.", mapNote="Illustrative fan map: original AI-painted art shaped after Florida, the real state Leonida is based on. It is not Rockstar’s map: the official printable map of Leonida comes out free on 19 November, and we’ll line our pins up with it then.", reset="Reset view", nogl="3D isn’t available on this device — explore the places above.",
   castK="People", castT="Who’s who", consK="Consoles", consT="Where it runs and how well",
   cons=[("PlayStation 5 Pro", "Best visuals", ["Sharper image with PSSR", "Ray-traced shadows — Pro only", "Targets 30 fps"], True),
         ("PlayStation 5", "Native", ["DualSense haptics across the game", "Tempest 3D Audio", "Faster loading"], False),
         ("Xbox Series X", "Native", ["Targets 30 fps", "Full-quality local play"], False),
         ("Xbox Series S", "Native", ["Targets 30 fps", "Series S settings"], False),
         ("Xbox One", "Cloud only", ["Via Xbox Cloud Gaming", "Uses Series S settings", "Depends on your connection"], False),
         ("PC", "Not announced", ["No PC version announced yet"], False)],
   remote="Remote Play is supported on both PlayStation and Xbox.", spaceL="How much free space do you have? (GB)", spaceN="The pre-load needs up to 212 GB.",
   gearK="Get set up", gearT="Is your setup ready for GTA 6?", gearP="Pick your console, how much space you have and what you’ll do — get a personal checklist with the specs that matter.", gCon="Console", gCons=[("ps5", "PS5"), ("ps5pro", "PS5 Pro"), ("xsx", "Series X"), ("xss", "Series S"), ("xone", "Xbox One (cloud)")], gFree="Free space (GB)", gUse="I’ll…", gUses=[("play", "Play"), ("stream", "Stream"), ("record", "Record clips")], gStore="Store", gStores=[("sa", "Amazon.sa"), ("ae", "Amazon.ae"), ("eg", "Amazon.eg"), ("com", "Amazon.com")], gAff="Affiliate disclosure: links go to Amazon search results; if you buy something we may earn a small commission at no extra cost to you. We pick specs, not brands — compare prices before you buy.",
   cvpK="Facts vs. guesses", conf="Confirmed", pred="Our predictions (unconfirmed)",
   confs=["Out Thursday 19 November 2026 on PS5 and Xbox Series X|S", "Pre-load live since 10 November — up to 212 GB", "Targets 30 fps; PS5 Pro adds PSSR and ray-traced shadows", "Xbox Cloud Gaming — including Xbox One", "Two leads: Jason and Lucia, in the state of Leonida (Vice City)", "Free official printable poster + map of Leonida on launch day"],
   preds=["A PC version later — unofficial reports point to 2027", "A brand-new online mode, detailed after launch", "Regular post-launch updates, as Rockstar usually does"],
   posterT="Vice poster maker", posterP="Turn any photo into a neon comic-style poster — posterised colours, ink edges and halftone. Original effect, all on your device.", pick="Choose a photo", pal="Palette", pals=[("vice", "Vice"), ("ocean", "Ocean"), ("sunset", "Sunset"), ("noir", "Noir")], ptitle="Title", psub="Line", half="Halftone dots", pgo="⬇ Download poster",
   obsT="Stream kit for OBS", obsP="Animated widgets for streamers. Copy the link, then in OBS: Sources → + → Browser, paste it, set 1920 × 1080.", w=[("soon", "Starting soon screen"), ("countdown", "Launch countdown"), ("live", "Live now banner")], chan="Channel name", mins="Minutes", copy="Copy link",
   factsT="Official sources", logoAlt="Grand Theft Auto VI logo", credit="Grand Theft Auto VI logo © Rockstar Games — shown for news and identification only.",
   facts=["<b>Release:</b> Thursday 19 November 2026", "<b>Pre-load:</b> live since 10 November, up to 212 GB", "<b>Platforms:</b> PS5, PS5 Pro, Xbox Series X|S (+ Xbox Cloud Gaming)", "<b>Unlock time:</b> not announced yet"], src="Sources",
   toolsK="Launch-week tools", ovT="Mission overlays", ovP="“Mission passed / failed / busted” style overlays in our own design — green-screen MP4 for your clips.",
   kind="Type", kinds=[("passed", "Passed"), ("failed", "Failed"), ("busted", "Busted"), ("respect", "Respect +")], text="Big text", sub2="Small text", bg="Background", bgs=[("green", "Green"), ("blue", "Blue"), ("black", "Black")], ratio="Format", go="⬇ Download overlay MP4",
   crewT="Crew name generator", crewP="Tap a name to copy it with its tag.", more="🎲 More names",
   wpT="Photo-mode wallpapers", wpP="Turn your best screenshot into a wallpaper with a neon finish.", pres=[("phone", "Phone"), ("iphone", "iPhone"), ("desktop", "Desktop 1440p"), ("uhd", "4K")], pre="Size", fx="Finish", fxs=[("neon", "Neon"), ("vhs", "VHS"), ("none", "Clean")], focusX="Focus ↔", focusY="Focus ↕", wgo="⬇ Download wallpaper",
   chT="Launch-day checklist", chP="Ticks are saved in this browser.",
   checks=["Pre-load started (digital pre-orders) — or your code-in-box activated", "At least 212 GB free (+ room for a day-one patch)", "Console system software updated", "Online play: active PlayStation Plus / Xbox Game Pass (Core or above)", "Controller charged + a spare cable", "Recording/streaming set up — grab the OBS kit above", "Plan your first clip: hook, captions, thumbnail"],
   kitT="Creator kit for your GTA videos", kit=[("/youtube-thumbnail-maker?theme=vice&title=GTA+6+*first+look*&badge=NEW", "Neon thumbnail", "Opens with a neon theme and a ready title."), ("/ai-clip-maker", "AI Clip Maker", "Long stream → the best moments as Reels."), ("/horizontal-to-vertical-video", "Gameplay → vertical", "16:9 gameplay to 9:16 Shorts."), ("/add-subtitles-to-video", "Auto subtitles", "Your commentary as animated captions."), ("/video-templates#hook", "Reels hook", "A punchy animated opener.")],
   disc="Unofficial fan section. Not affiliated with, endorsed or sponsored by Rockstar Games or Take-Two Interactive. Grand Theft Auto, GTA and the GTA VI logo are trademarks of their respective owners. Scenery images are original AI-generated art; character and place summaries are our own words."),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="منطقة GTA 6", badge="التنزيل المسبق متاح الآن", title="منطقة GTA 6", sub="ليونيدا تفتح أبوابها 19 نوفمبر. عدّاد، خريطة ثلاثية الأبعاد تفاعلية، الأماكن والشخصيات، دليل الأجهزة — وأدوات لصناع المحتوى لأسبوع الإطلاق.",
   ticker=["التنزيل المسبق متاح", "حتى 212 غيغا", "19 نوفمبر 2026", "PS5 · PS5 PRO · XBOX SERIES X|S", "30 إطارًا بالثانية", "XBOX CLOUD GAMING — حتى على XBOX ONE", "يدعم Remote Play", "الخريطة الرسمية يوم الإطلاق"],
   storyK="القصة", story="شخصين، وعملية سهلة بتخرب، وأكثر ولاية مشمسة بأمريكا بتورجيهم أظلم وجه عندها. جيسون ولوسيا ما إلهم غير بعض — ومؤامرة ممتدة على كل ليونيدا.",
   placesK="فقط في ليونيدا", placesT="ستة أماكن لازم تعرفها", mapK="تفاعلية", mapT="ليونيدا ثلاثية الأبعاد", mapP="اسحب لتلف، اسحب بالزر اليمين أو مع Shift لتتنقل، كبّر بالعجلة أو بإصبعين، واضغط أي دبوس لتطير له. جرّب وضع الليل لتشوف المدينة تضوي.", mapNote="خريطة توضيحية من المعجبين: رسم أصلي بالذكاء الاصطناعي على شكل فلوريدا الحقيقية اللي ليونيدا مستوحاة منها. ليست خريطة روكستار: الخريطة الرسمية بتنزل مجانًا يوم 19 نوفمبر، ووقتها منضبط مواقع الدبابيس عليها.", reset="رجوع للعرض", nogl="الثلاثي الأبعاد غير متاح على جهازك — شوف الأماكن بالأعلى.",
   castK="الشخصيات", castT="مين مين", consK="الأجهزة", consT="وين تشتغل وكيف",
   cons=[("PlayStation 5 Pro", "أفضل صورة", ["وضوح أعلى بتقنية PSSR", "ظلال بتتبع الأشعة — حصريًا على Pro", "30 إطارًا بالثانية"], True),
         ("PlayStation 5", "تشغيل أصلي", ["اهتزاز DualSense بكل اللعبة", "صوت Tempest ثلاثي الأبعاد", "تحميل أسرع"], False),
         ("Xbox Series X", "تشغيل أصلي", ["30 إطارًا بالثانية", "لعب محلي بالجودة الكاملة"], False),
         ("Xbox Series S", "تشغيل أصلي", ["30 إطارًا بالثانية", "إعدادات Series S"], False),
         ("Xbox One", "سحابي فقط", ["عبر Xbox Cloud Gaming", "بإعدادات Series S", "حسب سرعة الإنترنت"], False),
         ("الكمبيوتر PC", "لم يُعلن", ["لا توجد نسخة كمبيوتر معلنة بعد"], False)],
   remote="اللعب عن بعد Remote Play مدعوم على بلايستيشن وإكسبوكس.", spaceL="كم مساحة فاضية عندك؟ (غيغا)", spaceN="التنزيل المسبق يحتاج حتى 212 غيغا.",
   gearK="جهّز حالك", gearT="جهازك جاهز لـ GTA 6؟", gearP="اختار جهازك وكم مساحة عندك وشو ناوي تعمل — وبتطلعلك قائمة مخصّصة إلك مع المواصفات اللي بتفرق فعلًا.", gCon="الجهاز", gCons=[("ps5", "PS5"), ("ps5pro", "PS5 Pro"), ("xsx", "Series X"), ("xss", "Series S"), ("xone", "Xbox One (سحابي)")], gFree="المساحة الفاضية (غيغا)", gUse="رح…", gUses=[("play", "ألعب"), ("stream", "أبث"), ("record", "أسجّل مقاطع")], gStore="المتجر", gStores=[("sa", "أمازون السعودية"), ("ae", "أمازون الإمارات"), ("eg", "أمازون مصر"), ("com", "Amazon.com")], gAff="إفصاح: الروابط بتوديك لنتائج البحث بأمازون، وإذا اشتريت ممكن ناخد عمولة صغيرة بدون أي تكلفة إضافية عليك. نحنا منختار المواصفات مش الماركات — قارن الأسعار قبل ما تشتري.",
   cvpK="حقائق وتوقعات", conf="مؤكد", pred="توقعاتنا (غير مؤكدة)",
   confs=["تنزل الخميس 19 نوفمبر 2026 على PS5 وXbox Series X|S", "التنزيل المسبق متاح من 10 نوفمبر — حتى 212 غيغا", "30 إطارًا؛ وPS5 Pro فيه PSSR وظلال بتتبع الأشعة", "Xbox Cloud Gaming — حتى على Xbox One", "بطلين: جيسون ولوسيا، بولاية ليونيدا (فايس سيتي)", "بوستر وخريطة ليونيدا الرسمية مجانًا للطباعة يوم الإطلاق"],
   preds=["نسخة كمبيوتر لاحقًا — تقارير غير رسمية تتحدث عن 2027", "طور أونلاين جديد بتفاصيل بعد الإطلاق", "تحديثات مستمرة بعد الإطلاق مثل عادة روكستار"],
   posterT="صانع بوستر فايس", posterP="حوّل أي صورة لبوستر كوميكس نيون — ألوان مبسّطة وحدود حبر ونقاط طباعة. تأثير أصلي، كله على جهازك.", pick="اختر صورة", pal="الألوان", pals=[("vice", "فايس"), ("ocean", "محيط"), ("sunset", "غروب"), ("noir", "أبيض وأسود")], ptitle="العنوان", psub="السطر", half="نقاط الطباعة", pgo="⬇ نزّل البوستر",
   obsT="عدة الستريمرز لـ OBS", obsP="عناصر متحركة للبث. انسخ الرابط، وبالـ OBS: المصادر ← + ← متصفح (Browser)، الصق الرابط واضبط 1920 × 1080.", w=[("soon", "شاشة البث يبدأ قريبًا"), ("countdown", "عدّاد الإطلاق"), ("live", "بانر مباشر الآن")], chan="اسم القناة", mins="الدقائق", copy="نسخ الرابط",
   factsT="المصادر الرسمية", logoAlt="شعار Grand Theft Auto VI", credit="شعار Grand Theft Auto VI ملك لـ Rockstar Games — معروض لأغراض إخبارية وتعريفية فقط.",
   facts=["<b>موعد النزول:</b> الخميس 19 نوفمبر 2026", "<b>التنزيل المسبق:</b> متاح من 10 نوفمبر، حتى 212 غيغا", "<b>المنصات:</b> PS5 وPS5 Pro وXbox Series X|S (+ Xbox Cloud Gaming)", "<b>ساعة الفتح:</b> لم تُعلن بعد"], src="المصادر",
   toolsK="أدوات أسبوع الإطلاق", ovT="طبقات المهمات", ovP="طبقات «المهمة نجحت / فشلت / انمسكت» بتصميمنا الخاص — MP4 بشاشة خضراء لمقاطعك.",
   kind="النوع", kinds=[("passed", "نجحت"), ("failed", "فشلت"), ("busted", "انمسكت"), ("respect", "احترام +")], text="النص الكبير", sub2="النص الصغير", bg="الخلفية", bgs=[("green", "خضراء"), ("blue", "زرقاء"), ("black", "سوداء")], ratio="المقاس", go="⬇ نزّل الطبقة MP4",
   crewT="مولّد أسماء العصابات", crewP="اضغط على أي اسم لتنسخه مع التاغ.", more="🎲 أسماء جديدة",
   wpT="خلفيات من لقطات التصوير", wpP="حوّل أحلى لقطة عندك لخلفية بلمسة نيون.", pres=[("phone", "جوال"), ("iphone", "آيفون"), ("desktop", "كمبيوتر 1440p"), ("uhd", "4K")], pre="المقاس", fx="اللمسة", fxs=[("neon", "نيون"), ("vhs", "VHS"), ("none", "بدون")], focusX="التركيز ↔", focusY="التركيز ↕", wgo="⬇ نزّل الخلفية",
   chT="قائمة التجهيز ليوم النزول", chP="العلامات تنحفظ في متصفحك.",
   checks=["بدأت التنزيل المسبق (للحجز الرقمي) — أو فعّلت كود النسخة الفيزيائية", "عندك 212 غيغا فاضية على الأقل (+ مساحة لتحديث اليوم الأول)", "حدّثت نظام الجهاز", "للعب أونلاين: اشتراك PlayStation Plus أو Xbox Game Pass (Core أو أعلى)", "اليد مشحونة وكيبل احتياط", "جهّزت التسجيل أو البث — خذ عدة OBS من فوق", "خطّطت لأول مقطع: بداية تشد، ترجمة، صورة مصغّرة"],
   kitT="أدوات صناع المحتوى لفيديوهات GTA", kit=[("/youtube-thumbnail-maker?theme=vice&title=GTA+6+*أول+نظرة*&badge=جديد", "صورة مصغّرة نيون", "يفتح بثيم نيون وعنوان جاهز."), ("/ar/ai-clip-maker", "صانع الريلز بالذكاء الاصطناعي", "بث طويل ← أقوى اللحظات كريلز."), ("/ar/horizontal-to-vertical-video", "اللعب ← عمودي", "مقطع 16:9 لشورت 9:16."), ("/ar/add-subtitles-to-video", "ترجمة تلقائية", "تعليقك كترجمة متحركة."), ("/ar/video-templates#hook", "افتتاحية ريلز", "بداية متحركة قوية.")],
   disc="قسم معجبين غير رسمي، غير تابع أو معتمد أو مموّل من Rockstar Games أو Take-Two Interactive. Grand Theft Auto وGTA وشعار GTA VI علامات تجارية لأصحابها. صور المناظر أصلية مولّدة بالذكاء الاصطناعي، وملخصات الأماكن والشخصيات بكلماتنا."),
}
SOURCES = [("https://www.rockstargames.com/VI", "Rockstar Games — GTA VI"), ("https://www.rockstargames.com/newswire/article/k4ak9okk485712", "Rockstar Newswire — pre-load"), ("https://www.rockstargames.com/newswire/article/89834o94713o21", "Rockstar Newswire — platforms"), ("https://www.rockstargames.com/VI/only-in-leonida", "Only in Leonida")]
def chips(i, attr, o, active): return '<div class="gta-chips" id="%s" role="group">%s</div>' % (i, "".join('<button type="button" class="chip%s" data-%s="%s">%s</button>' % (" active" if k == active else "", attr, k, v) for k, v in o))
def chipsv(i, o): return '<div class="gta-chips" id="%s" role="group">%s</div>' % (i, "".join('<button type="button" class="chip" data-v="%s" aria-pressed="false">%s</button>' % (k, v) for k, v in o))
def body(L, ar):
    t = T[L]; pl = PLACES[L]
    data = json.dumps([{"id": i, "name": n, "desc": d, "real": r, "u": u, "v": v, "css": c, "color": int(c[1:], 16), "img": "/assets/gta6/%s.webp" % i} for i, n, d, r, u, v, c in pl], ensure_ascii=False)
    s = '<div class="wrap">\n  <canvas id="gtaWorld" aria-hidden="true"></canvas>\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n%s' % (t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "")
    s += '<div id="gtaZone">\n  <button type="button" class="gs-motion" id="gsMotion" aria-pressed="true"></button>\n'
    s += ('  <section id="gsHero" class="gs-full"><div id="gsHeroImg" aria-hidden="true"></div>\n    <div class="gs-hero-in"><span class="gs-badge"><i></i>%s</span>\n      <h1 class="gs-title" data-split>%s</h1>\n      <p class="gs-sub">%s</p>\n'
          '      <div id="gtaCount" role="timer" aria-live="off">%s</div>\n    </div><span class="gs-scroll" aria-hidden="true"></span>\n  </section>\n\n') % (t["badge"], t["title"], t["sub"], "".join('<div class="gta-cell" id="%s"><b>--</b><span></span></div>' % i for i in ("gtaD", "gtaH", "gtaM", "gtaS")))
    items = "".join("<span>✦ %s</span>" % x for x in t["ticker"]) * 2
    s += '  <div class="gs-ticker gs-full" aria-hidden="true"><div>%s</div></div>\n\n' % items
    s += '  <section id="gsStoryBox"><div><span class="gs-kick" data-reveal>%s</span><p id="gsStory">%s</p></div></section>\n\n' % (t["storyK"], t["story"])
    s += ('  <section id="gsPlaces" class="gs-full"><div class="gs-sticky"><header><span class="gs-kick">%s</span><h2 class="gs-h2">%s</h2></header>\n    <div id="gsRail">%s</div>\n    <div class="gs-pbar"><i id="gsPlacesBar"></i></div></div></section>\n\n') % (
          t["placesK"], t["placesT"], "".join('<article class="gs-place"><img src="/assets/gta6/%s.webp" alt="" loading="lazy" decoding="async" width="1280" height="720"><div><small>0%d</small><h3>%s</h3><p>%s</p><em>%s</em></div></article>' % (i, k + 1, n, d, r) for k, (i, n, d, r, u, v, c) in enumerate(pl)))
    s += ('  <section class="gs-sec" id="map"><span class="gs-kick" data-reveal>%s</span><h2 class="gs-h2" data-reveal>%s</h2><p class="gs-lead" data-reveal>%s</p>\n'
          '    <div id="gsMap" data-reveal="zoom" data-nogl="%s"><div id="gsMapPins"></div><div class="gs-maptools"><span>%s</span><button type="button" class="chip" id="gsMapReset">%s</button></div>\n'
          '      <div id="gsMapCard" hidden><button type="button" class="gs-x" aria-label="Close">×</button><img alt=""><div><b></b><p></p><em></em></div></div></div>\n'
          '    <p class="gta-msg" style="text-align:start;font-weight:600">%s</p>\n    <script type="application/json" id="gsPlacesData">%s</script>\n  </section>\n\n') % (
          t["mapK"], t["mapT"], t["mapP"], t["nogl"], "🧭 3D", t["reset"], t["mapNote"], data)
    s += '  <section class="gs-sec" id="cast"><span class="gs-kick" data-reveal>%s</span><h2 class="gs-h2" data-reveal>%s</h2>\n    <div class="gs-cast">%s</div>\n  </section>\n\n' % (
          t["castK"], t["castT"], "".join('<div class="gs-cc" data-tilt data-reveal style="--c1:%s;--c2:%s;--d:%.2fs"><span class="mono" aria-hidden="true">%s</span><b>%s</b><small>%s</small><p>%s</p></div>' % (c1, c2, k * .06, n.replace("’", "")[0], n, role, d) for k, (n, role, d, c1, c2) in enumerate(CAST[L])))
    s += ('  <section class="gs-sec" id="consoles"><span class="gs-kick" data-reveal>%s</span><h2 class="gs-h2" data-reveal>%s</h2>\n    <div class="gs-cons">%s</div>\n    <p class="gs-lead" data-reveal style="margin-top:14px">%s</p>\n'
          '    <div class="gs-space" data-reveal><label for="gsFree">%s</label><br><input type="number" id="gsFree" min="0" max="20000" inputmode="numeric" placeholder="250"> <span class="gta-note" style="color:#d9b8ff">%s</span><div class="gs-sbar"><i id="gsSpaceBar"></i></div><div id="gsSpaceMsg" role="status"></div></div>\n  </section>\n\n') % (
          t["consK"], t["consT"], "".join('<div class="gs-con%s" data-reveal style="--d:%.2fs"><h3>%s</h3><span class="tag">%s</span><ul>%s</ul></div>' % (" best" if best else "", k * .07, n, tag, "".join("<li>%s</li>" % f for f in fs)) for k, (n, tag, fs, best) in enumerate(t["cons"])),
          t["remote"], t["spaceL"], t["spaceN"])
    s += ('  <section class="gs-sec" id="gear"><span class="gs-kick" data-reveal>%s</span><h2 class="gs-h2" data-reveal>%s</h2><p class="gs-lead" data-reveal>%s</p>\n'
          '    <div class="gs-gear" id="gsGear" data-reveal>\n      <div class="gta-row"><span class="gl">%s</span>%s</div>\n'
          '      <div class="gta-row"><label for="gsGearFree">%s</label><input type="number" id="gsGearFree" min="0" max="20000" inputmode="numeric" placeholder="150" style="max-width:160px"></div>\n'
          '      <div class="gta-row"><span class="gl">%s</span>%s</div>\n      <div class="gta-row"><span class="gl">%s</span>%s</div>\n'
          '      <div id="gsGearList" aria-live="polite"></div>\n      <p class="gs-aff">%s</p>\n    </div>\n  </section>\n\n') % (
          t["gearK"], t["gearT"], t["gearP"], t["gCon"], chipsv("gsGearCon", t["gCons"]), t["gFree"], t["gUse"], chipsv("gsGearUse", t["gUses"]), t["gStore"], chipsv("gsGearStore", t["gStores"]), t["gAff"])
    s += ('  <section class="gs-sec" id="facts-vs-guesses"><span class="gs-kick" data-reveal>%s</span>\n    <div class="gs-cvp"><div data-reveal><h3>✓ %s</h3><ul>%s</ul></div><div class="pred" data-reveal style="--d:.12s"><h3>? %s</h3><ul>%s</ul></div></div>\n  </section>\n\n') % (
          t["cvpK"], t["conf"], "".join("<li>%s</li>" % x for x in t["confs"]), t["pred"], "".join("<li>%s</li>" % x for x in t["preds"]))
    s += ('  <section class="gta-box" id="poster" data-reveal>\n    <h2>%s</h2>\n    <p>%s</p>\n    <div class="gta-two"><div>\n      <div class="gta-files" style="margin-bottom:12px"><label class="btn">%s<input type="file" id="gsPosterFile" accept="image/*"></label></div>\n'
          '      <div class="gta-row"><span class="gl">%s</span>%s</div>\n      <div class="gta-row"><label for="gsPosterTitle">%s</label><input type="text" id="gsPosterTitle" dir="auto" maxlength="24"></div>\n'
          '      <div class="gta-row"><label for="gsPosterSub">%s</label><input type="text" id="gsPosterSub" dir="auto" maxlength="40"></div>\n'
          '      <div class="gta-row"><span class="gl"></span><label style="display:flex;gap:6px;align-items:center;color:#f3dcff"><input type="checkbox" id="gsPosterHalf" checked> %s</label></div>\n'
          '      <button type="button" class="btn" id="gsPosterGo">%s</button>\n    </div><div><canvas id="gsPoster" width="1080" height="1350" style="width:min(100%%,380px)" role="img" aria-label="%s"></canvas></div></div>\n  </section>\n\n') % (
          t["posterT"], t["posterP"], t["pick"], t["pal"], chips("gsPosterPal", "p", t["pals"], "vice"), t["ptitle"], t["psub"], t["half"], t["pgo"], t["posterT"])
    s += ('  <section class="gta-box" id="obs" data-reveal>\n    <h2>%s</h2>\n    <p>%s</p>\n    <div class="gta-row"><span class="gl"></span>%s</div>\n'
          '    <div class="gta-row"><label for="gsObsName">%s</label><input type="text" id="gsObsName" maxlength="40" dir="auto"></div>\n'
          '    <div class="gta-row" id="gsObsMinRow"><label for="gsObsMin">%s</label><input type="number" id="gsObsMin" min="1" max="120" value="5" style="max-width:120px"></div>\n'
          '    <div class="gs-obs-row" style="margin:6px 0 14px"><input type="text" id="gsObsUrl" readonly aria-label="OBS URL"><button type="button" class="btn" id="gsObsCopy">%s</button></div>\n'
          '    <iframe id="gsObsFrame" title="OBS preview" loading="lazy"></iframe>\n  </section>\n\n') % (t["obsT"], t["obsP"], chips("gsObsW", "w", t["w"], "soon"), t["chan"], t["mins"], t["copy"])
    s += '  <section class="gs-sec" style="padding-bottom:0"><span class="gs-kick" data-reveal>%s</span></section>\n' % t["toolsK"]
    s += ('  <section class="gta-box" id="overlays">\n    <h2>%s</h2>\n    <p>%s</p>\n    <div class="gta-two"><div>\n'
          '      <div class="gta-row"><span class="gl">%s</span>%s</div>\n      <div class="gta-row"><label for="gtaOvlTitle">%s</label><input type="text" id="gtaOvlTitle" dir="auto" maxlength="40"></div>\n'
          '      <div class="gta-row"><label for="gtaOvlSub">%s</label><input type="text" id="gtaOvlSub" dir="auto" maxlength="50"></div>\n      <div class="gta-row"><span class="gl">%s</span>%s</div>\n      <div class="gta-row"><span class="gl">%s</span>%s</div>\n'
          '      <button type="button" class="btn" id="gtaOvlGo">%s</button><div class="gta-msg" id="gtaOvlMsg" role="status"></div>\n    </div><div class="gta-screen"><canvas id="gtaOvl" width="960" height="540" role="img" aria-label="%s"></canvas></div></div>\n  </section>\n\n') % (
          t["ovT"], t["ovP"], t["kind"], chips("gtaOvlKind", "k", t["kinds"], "passed"), t["text"], t["sub2"], t["bg"], chips("gtaOvlBg", "b", t["bgs"], "green"), t["ratio"], chips("gtaOvlRatio", "r", [("16:9", "16:9"), ("9:16", "9:16")], "16:9"), t["go"], t["ovT"])
    s += '  <section class="gta-box" id="crews">\n    <h2>%s</h2>\n    <p>%s</p>\n    <div id="gtaCrews"></div>\n    <button type="button" class="btn" id="gtaCrewGo">%s</button><div class="gta-msg" id="gtaCrewMsg" role="status"></div>\n  </section>\n\n' % (t["crewT"], t["crewP"], t["more"])
    s += ('  <section class="gta-box" id="wallpapers">\n    <h2>%s</h2>\n    <p>%s</p>\n    <div class="gta-two"><div>\n      <div class="gta-files" style="margin-bottom:12px"><label class="btn">%s<input type="file" id="gtaWpFile" accept="image/*"></label></div>\n'
          '      <div class="gta-row"><span class="gl">%s</span>%s</div>\n      <div class="gta-row"><span class="gl">%s</span>%s</div>\n'
          '      <div class="gta-row"><label for="gtaWpX">%s</label><input type="range" id="gtaWpX" min="0" max="100" value="50"></div>\n      <div class="gta-row"><label for="gtaWpY">%s</label><input type="range" id="gtaWpY" min="0" max="100" value="50"></div>\n'
          '      <button type="button" class="btn" id="gtaWpGo">%s</button><div class="gta-msg" id="gtaWpMsg" role="status"></div>\n    </div><div><canvas id="gtaWp" width="180" height="390" role="img" aria-label="%s"></canvas></div></div>\n  </section>\n\n') % (
          t["wpT"], t["wpP"], t["pick"], t["pre"], chips("gtaWpPre", "p", t["pres"], "phone"), t["fx"], chips("gtaWpFx", "f", t["fxs"], "neon"), t["focusX"], t["focusY"], t["wgo"], t["wpT"])
    s += ('  <section class="gta-box" id="checklist">\n    <h2>%s</h2>\n    <p>%s <b id="gtaCheckN"></b></p>\n    <div class="gta-bar"><i id="gtaCheckBar"></i></div>\n    <div id="gtaCheck">%s</div>\n  </section>\n\n') % (
          t["chT"], t["chP"], "".join('<label><input type="checkbox" id="gtaC%d"> <span>%s</span></label>' % (i, c) for i, c in enumerate(t["checks"])))
    s += '  <section class="gta-box" id="kit">\n    <h2>%s</h2>\n    <div class="gta-kit">%s</div>\n  </section>\n\n' % (t["kitT"], "".join('<a href="%s"><b>%s</b><span>%s</span></a>' % k for k in t["kit"]))
    s += ('  <section class="gta-box" id="facts">\n    <h2>%s</h2>\n    <div class="gta-facts"><figure><img src="/assets/gta6/gta6-logo.webp" width="286" height="222" alt="%s" loading="lazy"><figcaption>%s</figcaption></figure>\n'
          '    <div><ul>%s</ul><p class="gta-src">%s: %s</p></div></div>\n  </section>\n\n') % (t["factsT"], t["logoAlt"], t["credit"], "".join("<li>%s</li>" % f for f in t["facts"]), t["src"], " · ".join('<a href="%s" rel="noopener" target="_blank">%s</a>' % x for x in SOURCES))
    s += '</div>\n  <p class="gta-disc">%s</p>\n  <script src="/vendor/mp4-muxer.js"></script>\n  <script src="/gta.js"></script>\n  <script src="/gta-story.js"></script>\n  <script src="/gta-gear.js"></script>\n  <script type="module" src="/gta-map.js"></script>\n</div>\n' % t["disc"]
    return s
def w(n, x): io.open(os.path.join(here, n), "w", encoding="utf-8", newline="\n").write(x)
w("gz_style.html", STYLE); w("gz_en.html", body("en", False)); w("gz_ar.html", body("ar", True))
print("bodies written")
