// QuickTiny shared site behavior: nav toggle, footer year, copy-to-clipboard helper.
(function(){
  var toggle = document.querySelector(".menu-toggle");
  var links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function(){
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  var yearEls = document.querySelectorAll("[data-year]");
  var year = new Date().getFullYear();
  yearEls.forEach(function(el){ el.textContent = year; });
})();

/* ---------- Cursor spotlight on tool cards (sets --mx/--my; CSS draws the light) ---------- */
(function(){
  if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  var frame = null, last = null;
  document.addEventListener("pointermove", function(e){
    var card = e.target && e.target.closest ? e.target.closest(".tool-card") : null;
    if (!card) return;
    last = { card: card, x: e.clientX, y: e.clientY };
    if (frame) return;
    frame = requestAnimationFrame(function(){
      frame = null;
      var r = last.card.getBoundingClientRect();
      last.card.style.setProperty("--mx", (last.x - r.left) + "px");
      last.card.style.setProperty("--my", (last.y - r.top) + "px");
      // Gentle 3D tilt toward the pointer (max ~5 degrees).
      last.card.style.setProperty("--ry", (((last.x - r.left) / r.width - .5) * 10).toFixed(2) + "deg");
      last.card.style.setProperty("--rx", ((.5 - (last.y - r.top) / r.height) * 8).toFixed(2) + "deg");
    });
  }, { passive: true });
})();

/* ---------- Scroll-reveal + animated stat counters (premium redesign) ---------- */
(function(){
  var targets = document.querySelectorAll(
    ".tool-card, .card:not(.tool-panel .card), .pro-card, .faq-item, .related-grid a, .content > h2, .stat, .section-head"
  );
  if (!targets.length) return;

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || typeof IntersectionObserver === "undefined") {
    targets.forEach(function(el){ el.classList.add("reveal", "in"); });
    return;
  }

  targets.forEach(function(el, i){
    el.classList.add("reveal");
    el.style.transitionDelay = Math.min(i % 8, 6) * 45 + "ms";
  });

  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) {
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  targets.forEach(function(el){ io.observe(el); });

  /* Animated number counters for elements marked data-count-to="N" */
  var counters = document.querySelectorAll("[data-count-to]");
  if (counters.length && typeof IntersectionObserver !== "undefined") {
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (!entry.isIntersecting) return;
        cio.unobserve(entry.target);
        var el = entry.target;
        var end = parseFloat(el.getAttribute("data-count-to"));
        var suffix = el.getAttribute("data-count-suffix") || "";
        var start = 0, dur = 900, t0 = null;
        function step(ts){
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(start + (end - start) * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function(el){ cio.observe(el); });
  }
})();

async function qtCopy(text, statusEl, label){
  var btn = document.activeElement && document.activeElement.tagName === "BUTTON" ? document.activeElement : null;
  try{
    await navigator.clipboard.writeText(text);
    if (statusEl) { statusEl.textContent = (label || "Copied") + " ✓"; statusEl.className = "result success"; }
    // The button that was pressed flips to a tick for a moment.
    if (btn) { btn.classList.remove("qt-copied"); void btn.offsetWidth; btn.classList.add("qt-copied"); clearTimeout(btn._qtc); btn._qtc = setTimeout(function(){ btn.classList.remove("qt-copied"); }, 1300); }
  }catch(e){
    if (statusEl) { statusEl.textContent = "Could not copy — select and copy manually."; statusEl.className = "result error"; }
  }
}

function qtTrack(name, data){
  try {
    if (typeof va === "function") {
      data ? va("event", { name: name, data: data }) : va("event", { name: name });
    }
  } catch (e) {}
}

/* ---------- Free, first-party Smart Actions measurement (Vercel Hobby has no custom-event UI) ---------- */
/* Fire-and-forget: a categorical event name only, never pasted content, never blocks the UI. */

function qtEvent(name){
  try {
    fetch("/api/qt-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: name, page: location.pathname })
    }).catch(function(){});
  } catch (e) {}
}

/* ---------- Smart Actions handoff: pass pasted input from the homepage to a tool page ---------- */
/* sessionStorage only -- never the URL/query string -- and consumed (removed) on first read. */

var QT_HANDOFF_KEY = "qtSmartHandoff";

function qtHandoffSet(payload){
  try { sessionStorage.setItem(QT_HANDOFF_KEY, JSON.stringify(payload)); } catch (e) {}
}

function qtHandoffConsume(expectedTool){
  try {
    var raw = sessionStorage.getItem(QT_HANDOFF_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(QT_HANDOFF_KEY);
    var payload = JSON.parse(raw);
    if (!payload || (expectedTool && payload.tool !== expectedTool)) return null;
    return payload;
  } catch (e) { return null; }
}


/* ---------- Privacy-safe funnel measurement, sharing, install and offline return ---------- */
(function(){
  var path = location.pathname;
  var panel = document.querySelector(".tool-panel");
  var inputTracked = false;
  var resultTracked = false;

  if (path === "/batch-image-compressor") qtEvent("pro_page_viewed");

  if (panel && path !== "/") {
    panel.addEventListener("input", function(e){
      if (inputTracked) return;
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) {
        inputTracked = true;
        qtEvent("tool_input_used");
      }
    }, true);
    panel.addEventListener("change", function(e){
      if (inputTracked) return;
      if (e.target && e.target.tagName === "INPUT") {
        inputTracked = true;
        qtEvent("tool_input_used");
      }
    }, true);
    panel.addEventListener("click", function(e){
      var button = e.target && e.target.closest ? e.target.closest("button") : null;
      if (button) qtEvent("tool_action_clicked");
    }, true);

    var observer = new MutationObserver(function(){
      if (resultTracked) return;
      var result = panel.querySelector(".result.success, .downloads a, pre:not(:empty), textarea[readonly]");
      if (result && (result.textContent || result.value || "").trim()) {
        resultTracked = true;
        qtEvent("tool_result_created");
      }
    });
    observer.observe(panel, { childList: true, subtree: true, characterData: true });
  }

  document.querySelectorAll('a[href="/batch-image-compressor"]').forEach(function(link){
    link.addEventListener("click", function(){ qtEvent("pro_page_viewed"); });
  });

  var shareButton = document.querySelector("#shareQuickTiny");
  if (shareButton) {
    shareButton.addEventListener("click", async function(){
      qtEvent("share_clicked");
      var shareData = {
        title: "QuickTiny",
        text: "Fast, private browser tools with Smart Actions — no signup.",
        url: "https://quicktinyv2.vercel.app/"
      };
      try {
        if (navigator.share) await navigator.share(shareData);
        else await navigator.clipboard.writeText(shareData.url);
        shareButton.textContent = navigator.share ? "Shared ✓" : "Link copied ✓";
        qtEvent("share_completed");
      } catch (e) {}
    });
  }

  var installPrompt = null;
  var installButton = document.querySelector("#installQuickTiny");
  window.addEventListener("beforeinstallprompt", function(e){
    e.preventDefault();
    installPrompt = e;
    if (installButton) installButton.hidden = false;
    qtEvent("install_prompt_shown");
  });
  if (installButton) {
    installButton.addEventListener("click", async function(){
      if (!installPrompt) return;
      qtEvent("install_clicked");
      installPrompt.prompt();
      var choice = await installPrompt.userChoice;
      if (choice && choice.outcome === "accepted") {
        installButton.textContent = "Installed ✓";
        installButton.disabled = true;
        qtEvent("install_completed");
      }
      installPrompt = null;
    });
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function(){
      navigator.serviceWorker.register("/sw.js").catch(function(){});
    });
  }
})();

/* ---------- File handoff: a file dropped on the homepage opens straight in the chosen tool ---------- */
/* The file stays in this browser (IndexedDB), is read once by the target page and then deleted. */
var QT_FILE_FLAG = "qtFileHandoff";
function qtHandoffDb(){
  return new Promise(function(resolve, reject){
    var req = indexedDB.open("qt-handoff", 1);
    req.onupgradeneeded = function(){ req.result.createObjectStore("h"); };
    req.onsuccess = function(){ resolve(req.result); };
    req.onerror = function(){ reject(req.error); };
  });
}
function qtHandoffTx(mode, fn){
  return qtHandoffDb().then(function(db){
    return new Promise(function(resolve, reject){
      var tx = db.transaction("h", mode), out;
      out = fn(tx.objectStore("h"));
      tx.oncomplete = function(){ db.close(); resolve(out && "result" in out ? out.result : undefined); };
      tx.onerror = function(){ db.close(); reject(tx.error); };
    });
  });
}
function qtFileHandoffSet(path, inputId, files){
  try { sessionStorage.setItem(QT_FILE_FLAG, path); } catch (e) {}
  return qtHandoffTx("readwrite", function(store){ return store.put({ path: path, input: inputId, files: files, t: Date.now() }, "pending"); });
}
(function(){
  var flag = null;
  try { flag = sessionStorage.getItem(QT_FILE_FLAG); } catch (e) {}
  if (!flag || flag !== location.pathname || !window.indexedDB) return;
  try { sessionStorage.removeItem(QT_FILE_FLAG); } catch (e) {}
  function apply(){
    var payload = null;
    qtHandoffTx("readwrite", function(store){ var r = store.get("pending"); store.delete("pending"); return r; }).then(function(p){
      payload = p;
      if (!p || p.path !== location.pathname || Date.now() - p.t > 10 * 60 * 1000) return;
      var input = document.getElementById(p.input);
      if (!input || typeof DataTransfer === "undefined") return;
      var dt = new DataTransfer();
      (input.multiple ? p.files : p.files.slice(0, 1)).forEach(function(f){ dt.items.add(f); });
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      var box = input.closest(".tool-panel, .pdf-panel, section") || input.parentNode;
      if (box && box.scrollIntoView) box.scrollIntoView({ behavior: "smooth", block: "start" });
      qtToast((document.documentElement.lang || "").indexOf("ar") === 0 ? "✓ تم فتح ملفك هنا" : "✓ Your file is loaded");
      qtEvent("home_file_opened");
    }).catch(function(){});
  }
  // Wait until the tool's own scripts have attached their listeners.
  if (document.readyState === "complete") setTimeout(apply, 60);
  else window.addEventListener("load", function(){ setTimeout(apply, 60); });
})();

function qtToast(text){
  var t = document.createElement("div");
  t.className = "qt-toast"; t.setAttribute("role", "status"); t.textContent = text;
  document.body.appendChild(t);
  requestAnimationFrame(function(){ t.classList.add("show"); });
  setTimeout(function(){ t.classList.remove("show"); setTimeout(function(){ t.remove(); }, 400); }, 2600);
}

/* ---------- Recently used tools (this browser only) ---------- */
(function(){
  var path = location.pathname;
  if (path === "/" || path === "/ar" || /^\/(embed|guides|ar\/guides)\b/.test(path) || !document.querySelector(".tool-panel")) return;
  var h1 = document.querySelector("h1");
  var name = (h1 ? h1.textContent : document.title.split("|")[0]).replace(/\s+/g, " ").trim().slice(0, 48);
  try {
    var list = JSON.parse(localStorage.getItem("qtRecent") || "[]").filter(function(r){ return r && r.p !== path; });
    list.unshift({ p: path, n: name });
    localStorage.setItem("qtRecent", JSON.stringify(list.slice(0, 8)));
  } catch (e) {}
})();

/* ---------- Before/after compare slider (shared by the image tools) ---------- */
/* qtCompare(before, after, {before:"label", after:"label"}) -> element. before/after are Blobs or URLs. */
function qtCompare(before, after, o){
  o = o || {};
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var tB = o.before || (AR ? "الأصلية" : "Original"), tA = o.after || (AR ? "بعد الضغط" : "Compressed");
  function src(x){ return typeof x === "string" ? x : URL.createObjectURL(x); }
  var wrap = document.createElement("div"); wrap.className = "qt-cmp";
  wrap.innerHTML =
    '<div class="qc-stage" dir="ltr">' +
      '<div class="qc-layer qc-after"><div class="qc-zoom"><img alt="" draggable="false"></div></div>' +
      '<div class="qc-layer qc-before"><div class="qc-zoom"><img alt="" draggable="false"></div></div>' +
      '<div class="qc-line"><button type="button" class="qc-handle" role="slider" aria-valuemin="0" aria-valuemax="100"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg></button></div>' +
      '<span class="qc-tag qc-tag-b"></span><span class="qc-tag qc-tag-a"></span>' +
    '</div>' +
    '<div class="qc-bar"><span class="qc-hint"></span><span class="qc-zooms" role="group"></span></div>';
  var stage = wrap.querySelector(".qc-stage"), before$ = wrap.querySelector(".qc-before"), line = wrap.querySelector(".qc-line"), handle = wrap.querySelector(".qc-handle");
  var imgs = wrap.querySelectorAll("img"), zooms = wrap.querySelectorAll(".qc-zoom");
  imgs[0].src = src(after); imgs[1].src = src(before);
  wrap.querySelector(".qc-tag-b").textContent = tB; wrap.querySelector(".qc-tag-a").textContent = tA;
  wrap.querySelector(".qc-hint").textContent = AR ? "اسحب الخط للمقارنة — كبّر لترى التفاصيل" : "Drag the line to compare — zoom in to check details";
  handle.setAttribute("aria-label", AR ? "موضع المقارنة" : "Comparison position");
  var pos = 50, zoom = 1;
  function set(p){
    pos = Math.max(0, Math.min(100, p));
    before$.style.clipPath = "inset(0 " + (100 - pos) + "% 0 0)";
    line.style.left = pos + "%";
    handle.setAttribute("aria-valuenow", Math.round(pos));
  }
  function origin(e){
    var r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 100, y = (e.clientY - r.top) / r.height * 100;
    zooms.forEach(function(z){ z.style.transformOrigin = x + "% " + y + "%"; });
  }
  imgs[0].addEventListener("load", function(){
    var w = imgs[0].naturalWidth, h = imgs[0].naturalHeight;
    if (w && h) { stage.style.aspectRatio = w + " / " + h; stage.style.width = "min(100%, calc(62vh * " + (w / h).toFixed(4) + "))"; }
  });
  var dragging = false;
  stage.addEventListener("pointerdown", function(e){
    dragging = true; stage.setPointerCapture(e.pointerId); stage.classList.add("qc-drag");
    var r = stage.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100);
  });
  stage.addEventListener("pointermove", function(e){
    if (dragging) { var r = stage.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); }
    else if (zoom > 1) origin(e);
  });
  function up(){ dragging = false; stage.classList.remove("qc-drag"); }
  stage.addEventListener("pointerup", up); stage.addEventListener("pointercancel", up);
  handle.addEventListener("keydown", function(e){
    var d = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0;
    if (e.key === "Home") { set(0); e.preventDefault(); } else if (e.key === "End") { set(100); e.preventDefault(); }
    if (d) { set(pos + d * (e.shiftKey ? 10 : 2)); e.preventDefault(); }
  });
  var zbox = wrap.querySelector(".qc-zooms");
  zbox.setAttribute("aria-label", AR ? "التكبير" : "Zoom");
  [1, 2, 4].forEach(function(z){
    var b = document.createElement("button"); b.type = "button"; b.className = "chip" + (z === 1 ? " active" : ""); b.textContent = z + "×";
    b.setAttribute("aria-pressed", z === 1 ? "true" : "false");
    b.addEventListener("click", function(){
      zoom = z;
      zbox.querySelectorAll(".chip").forEach(function(x){ var on = x === b; x.classList.toggle("active", on); x.setAttribute("aria-pressed", on ? "true" : "false"); });
      zooms.forEach(function(el){ el.style.transform = "scale(" + z + ")"; if (z === 1) el.style.transformOrigin = "50% 50%"; });
      stage.classList.toggle("qc-zoomed", z > 1);
    });
    zbox.appendChild(b);
  });
  // Swap the "after" image in place (keeps the divider and zoom), e.g. when a quality slider moves.
  wrap.qtSetAfter = function(x){ imgs[0].src = src(x); };
  set(50);
  // A short sweep shows people the line can be moved (skipped for reduced motion).
  if (!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) && typeof IntersectionObserver !== "undefined") {
    var io = new IntersectionObserver(function(en){
      if (!en[0].isIntersecting) return; io.disconnect();
      var t0 = null, keys = [50, 78, 24, 50];
      function step(ts){
        if (dragging) return;
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1500, 1), seg = Math.min(Math.floor(p * 3), 2), f = p * 3 - seg, e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
        set(keys[seg] + (keys[seg + 1] - keys[seg]) * e);
        if (p < 1) requestAnimationFrame(step);
      }
      setTimeout(function(){ requestAnimationFrame(step); }, 250);
    }, { threshold: .5 });
    io.observe(stage);
  }
  return wrap;
}

/* A "Compare" button for a result row in a list: opens the slider in a full-width row underneath. */
function qtCompareButton(li, before, after, o){
  if (typeof qtCompare !== "function" || !li) return null;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var b = document.createElement("button"); b.type = "button"; b.className = "btn btn-secondary ic-dl qc-open";
  var t1 = AR ? "قارن" : "Compare", t2 = AR ? "إخفاء المقارنة" : "Hide compare";
  b.textContent = t1; b.setAttribute("aria-expanded", "false");
  var row = null;
  b.addEventListener("click", function(){
    if (row) { row.remove(); row = null; b.textContent = t1; b.setAttribute("aria-expanded", "false"); return; }
    row = document.createElement("li"); row.className = "ic-cmp-li";
    row.appendChild(qtCompare(before, after, o));
    li.parentNode.insertBefore(row, li.nextSibling);
    b.textContent = t2; b.setAttribute("aria-expanded", "true");
    if (typeof qtEvent === "function") qtEvent("compare_opened");
  });
  return b;
}

/* ---------- Owner opt-out: open any page with #qt-notrack once per browser to stop counting your own visits ---------- */
(function(){
  var h = location.hash;
  if (h !== "#qt-notrack" && h !== "#qt-track") return;
  try {
    if (h === "#qt-notrack") { localStorage.setItem("va-disable", "1"); qtEvent("analytics_opt_out"); }
    else localStorage.removeItem("va-disable");
  } catch (e) { return; }
  history.replaceState(null, "", location.pathname + location.search);
  var ar = (document.documentElement.lang || "").indexOf("ar") === 0;
  var msg = h === "#qt-notrack" ? (ar ? "✓ لن تُحتسب زياراتك من هذا المتصفح" : "✓ Your visits from this browser won't be counted")
                                : (ar ? "✓ عادت الإحصاءات لهذا المتصفح" : "✓ Analytics re-enabled for this browser");
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function(){ qtToast(msg); }); else qtToast(msg);
})();

/* ---------- Page transitions: the clicked tool card's title morphs into the next page's heading ---------- */
(function(){
  if (!("onpageswap" in window)) return;
  var clicked = null;
  document.addEventListener("click", function(e){
    var a = e.target && e.target.closest ? e.target.closest("a.tool-card, .yours-chip, .related-grid a") : null;
    clicked = a && !e.defaultPrevented ? a : null;
  }, true);
  window.addEventListener("pageswap", function(e){
    if (!e.viewTransition || !clicked) return;
    var t = clicked.querySelector("h3") || clicked;
    t.style.viewTransitionName = "qt-title";
  });
  window.addEventListener("pagereveal", function(e){
    if (!e.viewTransition) return;
    var h1 = document.querySelector(".hero h1");
    if (!h1) return;
    h1.style.viewTransitionName = "qt-title";
    e.viewTransition.finished.finally(function(){ h1.style.viewTransitionName = ""; });
  });
  // Coming back with the browser's back button: clear the name so the next click works.
  window.addEventListener("pageshow", function(){ document.querySelectorAll('[style*="qt-title"]').forEach(function(el){ el.style.viewTransitionName = ""; }); });
})();

/* ---------- Small celebrations: a burst of sparks from an element (skipped for reduced motion) ---------- */
function qtCelebrate(el){
  if (!el || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
  var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  var colors = ["#3be2ff", "#6b6bff", "#ffd166", "#7ff0b0", "#ff8fab"];
  var box = document.createElement("div"); box.className = "qt-burst"; box.setAttribute("aria-hidden", "true");
  box.style.left = cx + "px"; box.style.top = cy + "px";
  for (var i = 0; i < 26; i++) {
    var p = document.createElement("i"), a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 110;
    p.style.setProperty("--x", Math.cos(a) * d + "px"); p.style.setProperty("--y", Math.sin(a) * d - 30 + "px");
    p.style.setProperty("--r", Math.round(Math.random() * 540 - 270) + "deg");
    p.style.background = colors[i % colors.length]; p.style.animationDelay = Math.random() * 80 + "ms";
    if (i % 3 === 0) p.style.borderRadius = "50%";
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(function(){ box.remove(); }, 1200);
}
/* Animate a number inside an element from its previous value: qtCountTo(el, 2.3, function(v){ return v.toFixed(1) + " MB"; }). */
function qtCountTo(el, to, fmt, dur){
  if (!el) return;
  var from = isFinite(el._qtv) ? el._qtv : 0; el._qtv = to;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.textContent = fmt(to); return; }
  var t0 = null; dur = dur || 600; cancelAnimationFrame(el._qtraf);
  (function step(ts){
    if (!t0) t0 = ts;
    var k = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(from + (to - from) * e);
    if (k < 1) el._qtraf = requestAnimationFrame(step);
  })(performance.now());
}

/* ---------- Hero parallax: the floating glass icons drift at different speeds while scrolling ---------- */
(function(){
  var fl = document.querySelectorAll(".hero-float");
  if (!fl.length || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) return;
  var speeds = [0.18, -0.12, 0.28, -0.22], raf = null;
  window.addEventListener("scroll", function(){
    if (raf) return;
    raf = requestAnimationFrame(function(){
      raf = null; var y = Math.min(window.scrollY, 900);
      fl.forEach(function(el, i){ el.style.translate = "0 " + (y * speeds[i % 4]).toFixed(1) + "px"; });
    });
  }, { passive: true });
})();

/* ---------- Quick tool search: Ctrl/Cmd+K or "/" anywhere, or the search button in the header ---------- */
(function(){
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var T = AR ? { ph: "ابحث عن أداة… مثل: ضغط صورة، تفقيط، معدل", none: "لا توجد نتائج", open: "بحث سريع عن أداة", hint: "↑↓ للتنقل · Enter للفتح · Esc للإغلاق" }
             : { ph: "Search tools… e.g. compress, pdf, gpa", none: "No matching tools", open: "Quick tool search", hint: "↑↓ to move · Enter to open · Esc to close" };
  var tools = null, dlg = null, input, list, sel = 0, shown = [];
  // Arabic-friendly matching: drop diacritics/tatweel, unify alef forms, ya/alef maqsura and ta marbuta.
  function norm(s){ return String(s || "").toLowerCase().replace(/[ً-ْـ]/g, "").replace(/[إأآ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه"); }
  function load(){
    if (tools) return Promise.resolve(tools);
    // The homepage cards are the catalogue (same language as this page).
    return fetch(AR ? "/ar" : "/").then(function(r){ return r.text(); }).then(function(html){
      var doc = new DOMParser().parseFromString(html, "text/html");
      tools = [].map.call(doc.querySelectorAll("a.tool-card"), function(a){
        var h = a.querySelector("h3"), d = a.querySelector("p"), im = a.querySelector(".tc-icon img");
        return { href: a.getAttribute("href"), name: h ? h.textContent.trim() : "", desc: d ? d.textContent.trim() : "", icon: im ? im.getAttribute("src") : "",
                 key: norm((h ? h.textContent : "") + " " + (a.getAttribute("data-search") || "") + " " + (d ? d.textContent : "")) };
      });
      return tools;
    }).catch(function(){ tools = []; return tools; });
  }
  function build(){
    dlg = document.createElement("div"); dlg.className = "qk"; dlg.hidden = true;
    dlg.innerHTML = '<div class="qk-back"></div><div class="qk-box" role="dialog" aria-modal="true"><div class="qk-in"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
      '<input type="text" role="combobox" aria-expanded="true" aria-controls="qkList" aria-autocomplete="list" autocomplete="off" spellcheck="false"><kbd>Esc</kbd></div><ul id="qkList" role="listbox"></ul><div class="qk-hint"></div></div>';
    document.body.appendChild(dlg);
    dlg.querySelector(".qk-box").setAttribute("aria-label", T.open);
    input = dlg.querySelector("input"); list = dlg.querySelector("ul");
    input.placeholder = T.ph; input.setAttribute("aria-label", T.open); dlg.querySelector(".qk-hint").textContent = T.hint;
    dlg.querySelector(".qk-back").addEventListener("click", close);
    input.addEventListener("input", render);
    input.addEventListener("keydown", function(e){
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (shown.length) { sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + shown.length) % shown.length; mark(); } }
      else if (e.key === "Enter" && shown[sel]) { e.preventDefault(); go(shown[sel]); }
      else if (e.key === "Escape") close();
    });
  }
  function render(){
    var q = norm(input.value).trim().split(/\s+/).filter(Boolean);
    shown = (tools || []).filter(function(t){ return q.every(function(w){ return t.key.indexOf(w) !== -1; }); })
      .sort(function(a, b){ var qa = q.length && norm(a.name).indexOf(q[0]) === 0, qb = q.length && norm(b.name).indexOf(q[0]) === 0; return (qb ? 1 : 0) - (qa ? 1 : 0); })
      .slice(0, 8);
    list.innerHTML = shown.length ? "" : '<li class="qk-none"></li>';
    if (!shown.length) list.firstChild.textContent = T.none;
    shown.forEach(function(t, i){
      var li = document.createElement("li"); li.setAttribute("role", "option"); li.id = "qk" + i;
      if (t.icon) { var im = document.createElement("img"); im.src = t.icon; im.alt = ""; im.width = 34; im.height = 34; li.appendChild(im); }
      var sp = document.createElement("span"), b = document.createElement("b"), sm = document.createElement("small");
      b.textContent = t.name; sm.textContent = t.desc; sp.appendChild(b); sp.appendChild(sm); li.appendChild(sp);
      li.addEventListener("mousemove", function(){ if (sel !== i) { sel = i; mark(); } });
      li.addEventListener("click", function(){ go(t); });
      list.appendChild(li);
    });
    sel = 0; mark();
  }
  function mark(){
    [].forEach.call(list.children, function(li, i){ li.classList.toggle("on", i === sel && shown.length > 0); li.setAttribute("aria-selected", i === sel ? "true" : "false"); });
    if (shown.length) input.setAttribute("aria-activedescendant", "qk" + sel); else input.removeAttribute("aria-activedescendant");
    var on = list.children[sel]; if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest" });
  }
  function go(t){ if (typeof qtEvent === "function") qtEvent("quick_search_open"); location.href = t.href; }
  var opener = null;
  function open(){
    if (!dlg) build();
    opener = document.activeElement;
    dlg.hidden = false; document.documentElement.classList.add("qk-lock");
    input.value = ""; input.focus();
    load().then(render);
  }
  function close(){
    if (!dlg || dlg.hidden) return;
    dlg.hidden = true; document.documentElement.classList.remove("qk-lock");
    if (opener && opener.focus) opener.focus();
  }
  document.addEventListener("keydown", function(e){
    var t = e.target || {}, typing = /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || "") || t.isContentEditable;
    if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (dlg && !dlg.hidden) close(); else open(); }
    else if (e.key === "/" && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); open(); }
  });
  // A search button next to the menu, so phones (no keyboard shortcut) can use it too.
  var nr = document.querySelector(".nav-right");
  if (nr) {
    var btn = document.createElement("button"); btn.type = "button"; btn.className = "qk-btn"; btn.setAttribute("aria-label", T.open); btn.title = T.open + " (Ctrl+K)";
    btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
    btn.addEventListener("click", open);
    nr.insertBefore(btn, nr.querySelector(".menu-toggle"));
  }
})();

/* ---------- Light / dark theme toggle (the choice is saved; otherwise the device setting is followed) ---------- */
(function(){
  var root = document.documentElement, AR = (root.lang || "").indexOf("ar") === 0;
  function saved(){ try { return localStorage.getItem("qt-theme"); } catch (e) { return null; } }
  function sys(){ return window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"; }
  function cur(){ return root.getAttribute("data-theme") || "dark"; }
  var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/></svg>';
  var btn = null;
  function paint(){
    var t = cur();
    var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute("content", t === "light" ? "#f5f6fc" : "#05060f");
    if (!btn) return;
    btn.innerHTML = t === "light" ? MOON : SUN;
    var label = t === "light" ? (AR ? "الوضع الداكن" : "Dark mode") : (AR ? "الوضع الفاتح" : "Light mode");
    btn.setAttribute("aria-label", label); btn.title = label;
  }
  function set(t, remember){
    root.classList.add("qt-theme-anim");
    root.setAttribute("data-theme", t);
    if (remember) { try { localStorage.setItem("qt-theme", t); } catch (e) {} }
    paint();
    setTimeout(function(){ root.classList.remove("qt-theme-anim"); }, 420);
  }
  if (!root.getAttribute("data-theme")) root.setAttribute("data-theme", saved() || sys());
  var nr = document.querySelector(".nav-right");
  if (nr) {
    btn = document.createElement("button"); btn.type = "button"; btn.className = "qt-theme";
    btn.addEventListener("click", function(){ set(cur() === "light" ? "dark" : "light", true); if (typeof qtEvent === "function") qtEvent("theme_toggled"); });
    nr.insertBefore(btn, nr.querySelector(".qk-btn") || nr.querySelector(".menu-toggle"));
  }
  paint();
  // Follow the device setting live until the visitor picks a theme.
  if (window.matchMedia) { var mq = matchMedia("(prefers-color-scheme: light)"); var on = function(){ if (!saved()) set(sys(), false); }; if (mq.addEventListener) mq.addEventListener("change", on); }
})();

/* ---------- Feedback under each tool: 👍/👎 and an optional "suggest a tool" note (api/qt-feedback.js) ---------- */
(function(){
  var panel = document.querySelector(".tool-panel");
  var path = location.pathname;
  if (!panel || path === "/" || path === "/ar" || /^\/(embed)\b/.test(path)) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var T = AR ? { q: "هل أفادتك هذه الأداة؟", up: "نعم، أفادتني", down: "لا", thanks: "شكرًا لك! 🙏", ask: "ما الأداة التي تتمنى أن نضيفها، أو ما الذي ينقص هذه الأداة؟", ph: "اكتب اقتراحك… (اختياري، بدون بيانات شخصية)", send: "إرسال", sent: "✓ وصل اقتراحك، شكرًا!", fail: "تعذّر الإرسال، حاول لاحقًا.", suggest: "اقترح أداة" }
             : { q: "Was this tool helpful?", up: "Yes, it helped", down: "No", thanks: "Thank you! 🙏", ask: "Which tool should we build next, or what is this one missing?", ph: "Your idea… (optional, no personal details please)", send: "Send", sent: "✓ Got it, thank you!", fail: "Couldn't send, please try again later.", suggest: "Suggest a tool" };
  var KEY = "qtVoted:" + path, voted = null;
  try { voted = localStorage.getItem(KEY); } catch (e) {}
  function post(data){
    data.page = path; data.lang = AR ? "ar" : "en";
    return fetch("/api/qt-feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  }
  var box = document.createElement("section"); box.className = "qt-fb"; box.setAttribute("aria-label", T.q);
  box.innerHTML =
    '<div class="qt-fb-row"><span class="qt-fb-q"></span><span class="qt-fb-btns"><button type="button" class="qt-fb-v" data-v="up" aria-label=""><span aria-hidden="true">👍</span></button><button type="button" class="qt-fb-v" data-v="down" aria-label=""><span aria-hidden="true">👎</span></button></span>' +
    '<button type="button" class="qt-fb-link"></button></div>' +
    '<form class="qt-fb-form" hidden><label class="qt-fb-ask"></label><textarea maxlength="500" rows="3"></textarea>' +
    '<input type="text" name="website" tabindex="-1" autocomplete="off" class="qt-fb-hp" aria-hidden="true">' +
    '<div class="qt-fb-actions"><button type="submit" class="btn"></button><span class="qt-fb-msg" role="status"></span></div></form>';
  var q = box.querySelector(".qt-fb-q"), form = box.querySelector("form"), ta = form.querySelector("textarea"), msg = box.querySelector(".qt-fb-msg");
  q.textContent = voted ? T.thanks : T.q;
  box.querySelector('[data-v="up"]').setAttribute("aria-label", T.up);
  box.querySelector('[data-v="down"]').setAttribute("aria-label", T.down);
  box.querySelector(".qt-fb-link").textContent = T.suggest;
  form.querySelector("label").textContent = T.ask; ta.placeholder = T.ph;
  var taId = "qtFbText"; ta.id = taId; form.querySelector("label").setAttribute("for", taId);
  form.querySelector(".btn").textContent = T.send;
  if (voted) box.querySelectorAll(".qt-fb-v").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-v") === voted); b.disabled = true; });
  function openForm(){ form.hidden = false; ta.focus(); }
  box.querySelectorAll(".qt-fb-v").forEach(function(b){
    b.addEventListener("click", function(){
      var v = b.getAttribute("data-v");
      b.classList.add("on", "pop"); box.querySelectorAll(".qt-fb-v").forEach(function(x){ x.disabled = true; });
      q.textContent = T.thanks;
      voted = v;
      try { localStorage.setItem(KEY, v); } catch (e) {}
      post({ vote: v }).catch(function(){});
      if (v === "up" && typeof qtCelebrate === "function") qtCelebrate(b);
      openForm();
    });
  });
  box.querySelector(".qt-fb-link").addEventListener("click", openForm);
  form.addEventListener("submit", function(e){
    e.preventDefault();
    var text = ta.value.trim(); if (!text) { ta.focus(); return; }
    var btn = form.querySelector(".btn"); btn.disabled = true;
    post({ text: text, vote: voted || null, website: form.querySelector(".qt-fb-hp").value }).then(function(r){
      if (!r.ok && r.status !== 204) throw new Error(r.status);
      msg.textContent = T.sent; msg.className = "qt-fb-msg ok"; ta.value = ""; ta.disabled = true;
    }).catch(function(){ msg.textContent = T.fail; msg.className = "qt-fb-msg bad"; btn.disabled = false; });
  });
  // After the tool's own panel (and any helper rows right below it), before the explanatory content.
  var after = panel; while (after.nextElementSibling && after.nextElementSibling.tagName === "SCRIPT") after = after.nextElementSibling;
  after.parentNode.insertBefore(box, after.nextSibling);
})();
// creator-hub: decorative preview videos play only while on screen (and never with reduced motion)
(function () {
  var vids = document.querySelectorAll("video[data-qt-autoplay]");
  if (!vids.length || typeof IntersectionObserver === "undefined") return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else if (!v.paused) v.pause();
    });
  }, { threshold: .35 });
  vids.forEach(function (v) { io.observe(v); });
})();
// /creator-hub
// gta-portal: days-to-go on the homepage banner + cinematic warp into the GTA 6 Zone
(function () {
  var launch = new Date("2026-11-19T00:00:00").getTime();
  document.querySelectorAll("[data-gta-days]").forEach(function (el) { el.textContent = String(Math.max(0, Math.ceil((launch - Date.now()) / 86400000))); });
  var reduce = (function () { try { return localStorage.getItem("qtGsMotion") === "off"; } catch (x) { return false; } })();
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]"); if (!a || reduce || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin !== location.origin || !/^\/(ar\/)?gta-6\/?$/.test(u.pathname) || u.pathname === location.pathname) return;
    e.preventDefault();
    try { sessionStorage.setItem("qtGtaWarp", "1"); } catch (x) {}
    var w = document.createElement("div"); w.className = "gta-warp"; w.style.setProperty("--wx", e.clientX + "px"); w.style.setProperty("--wy", e.clientY + "px");
    var b = document.createElement("b"); b.textContent = (document.documentElement.lang || "").indexOf("ar") === 0 ? "أهلًا بك في المنطقة" : "ENTERING THE ZONE"; w.appendChild(b);
    document.body.appendChild(w); if (typeof qtEvent === "function") qtEvent("gta_portal");
    setTimeout(function () { location.href = u.href; }, 720);
  });
})();
// /gta-portal
