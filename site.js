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
