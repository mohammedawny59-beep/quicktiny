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
  try{
    await navigator.clipboard.writeText(text);
    if (statusEl) { statusEl.textContent = (label || "Copied") + " ✓"; statusEl.className = "result success"; }
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
