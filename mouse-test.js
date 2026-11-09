// QuickTiny Mouse Test — CPS, reaction time, double-click (switch chatter) detection and
// browser-observed polling rate. Everything runs locally.

(function () {
  var $ = function (id) { return document.getElementById(id); };
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  // ---------- Tabs ----------
  function showTab(name) {
    document.querySelectorAll("#mtTabs .chip").forEach(function (b) {
      var on = b.getAttribute("data-tab") === name;
      b.classList.toggle("active", on); b.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.querySelectorAll(".mt-panel").forEach(function (p) { p.hidden = p.id !== "mt-" + name; });
  }

  // ---------- CPS ----------
  var cps = { running: false, done: false, clicks: 0, start: 0, dur: 5, timer: null };
  function cpsBest() { return Number(store("qt_cps_best_" + cps.dur)) || 0; }
  function cpsRender() {
    var el = (performance.now() - cps.start) / 1000;
    var t = cps.running ? Math.max(0, cps.dur - el) : (cps.done ? 0 : cps.dur);
    var rate = cps.running ? cps.clicks / Math.max(el, 0.05) : (cps.done ? cps.clicks / cps.dur : 0);
    $("cpsTime").textContent = t.toFixed(1) + "s";
    $("cpsClicks").textContent = cps.clicks;
    $("cpsRate").textContent = rate.toFixed(2);
    $("cpsBest").textContent = cpsBest() ? cpsBest().toFixed(2) : "—";
  }
  function cpsClick(e) {
    e.preventDefault();
    if (cps.done) return;
    if (!cps.running) {
      cps.running = true; cps.clicks = 0; cps.start = performance.now();
      $("cpsArea").classList.add("live"); $("cpsArea").querySelector("strong").textContent = "Keep clicking!";
      cps.timer = setInterval(function () {
        cpsRender();
        if ((performance.now() - cps.start) / 1000 >= cps.dur) cpsFinish();
      }, 50);
    }
    cps.clicks++;
    var r = $("cpsArea").getBoundingClientRect(), dot = document.createElement("i");
    dot.className = "mt-ripple"; dot.style.left = (e.clientX - r.left) + "px"; dot.style.top = (e.clientY - r.top) + "px";
    $("cpsArea").appendChild(dot); setTimeout(function () { dot.remove(); }, 500);
    cpsRender();
  }
  function cpsFinish() {
    clearInterval(cps.timer); cps.running = false; cps.done = true;
    var rate = cps.clicks / cps.dur, best = cpsBest(), isBest = rate > best;
    if (isBest) store("qt_cps_best_" + cps.dur, String(rate));
    $("cpsArea").classList.remove("live");
    $("cpsArea").querySelector("strong").textContent = rate.toFixed(2) + " CPS" + (isBest ? " — new best!" : "");
    $("cpsArea").querySelector("span").textContent = "Click “Try again” to restart";
    $("cpsRetry").hidden = false;
    cpsRender();
    qtTrack("mouse_cps_done", { duration: cps.dur });
  }
  function cpsReset() {
    clearInterval(cps.timer); cps = { running: false, done: false, clicks: 0, start: 0, dur: Number($("cpsDur").value), timer: null };
    $("cpsArea").querySelector("strong").textContent = "Click here to start";
    $("cpsArea").querySelector("span").textContent = "The timer starts on your first click";
    $("cpsRetry").hidden = true; cpsRender();
  }

  // ---------- Reaction time ----------
  var rx = { state: "idle", t0: 0, timer: null, results: [] };
  var RX_ROUNDS = 5;
  function rxSet(state, title, sub) {
    rx.state = state; var a = $("rxArea");
    a.className = "mt-area mt-rx " + state;
    a.querySelector("strong").textContent = title; a.querySelector("span").textContent = sub || "";
  }
  function rxArm() {
    rxSet("wait", "Wait for green…", "Round " + (rx.results.length + 1) + " of " + RX_ROUNDS);
    rx.timer = setTimeout(function () { rx.t0 = performance.now(); rxSet("go", "CLICK!", ""); }, 1200 + Math.random() * 2800);
  }
  function rxDown(e) {
    e.preventDefault();
    if (rx.state === "idle" || rx.state === "result" || rx.state === "early") { if (rx.state === "result") rx.results = []; rxArm(); return; }
    if (rx.state === "wait") { clearTimeout(rx.timer); rxSet("early", "Too soon!", "Click to try this round again"); return; }
    if (rx.state === "go") {
      var ms = performance.now() - rx.t0; rx.results.push(ms);
      rxList();
      if (rx.results.length >= RX_ROUNDS) {
        var avg = rx.results.reduce(function (a, b) { return a + b; }, 0) / rx.results.length;
        var best = Number(store("qt_rx_best")) || 0;
        if (!best || avg < best) store("qt_rx_best", String(avg));
        rxSet("result", Math.round(avg) + " ms average", (avg < 200 ? "Excellent — pro-level reflexes." : avg < 250 ? "Good — faster than most people." : "Average. Warm up and try again!") + " Click to play again.");
        qtTrack("mouse_reaction_done");
      } else rxSet("between", Math.round(ms) + " ms", "Click to continue");
    }
    if (rx.state === "between") return;
  }
  function rxClickBetween(e) { if (rx.state === "between") { e.preventDefault(); rxArm(); } }
  function rxList() {
    var best = Number(store("qt_rx_best")) || 0;
    $("rxResults").innerHTML = rx.results.map(function (m, i) { return "<li>Round " + (i + 1) + ": <b>" + Math.round(m) + " ms</b></li>"; }).join("") +
      (best ? '<li class="muted">Your best average: ' + Math.round(best) + " ms</li>" : "");
  }

  // ---------- Double-click / chatter ----------
  var BTN = ["Left", "Middle", "Right", "Back", "Forward"];
  var dc = { last: {}, counts: {}, flags: {}, minGap: {} };
  var DC_THRESHOLD = 80; // ms — a human can't click the same button twice this fast
  function dcDown(e) {
    e.preventDefault();
    var b = e.button, now = performance.now();
    dc.counts[b] = (dc.counts[b] || 0) + 1;
    if (dc.last[b] !== undefined) {
      var gap = now - dc.last[b];
      dc.minGap[b] = Math.min(dc.minGap[b] || Infinity, gap);
      if (gap < DC_THRESHOLD) {
        dc.flags[b] = (dc.flags[b] || 0) + 1;
        var a = $("dcArea"); a.classList.remove("flash"); void a.offsetWidth; a.classList.add("flash");
      }
    }
    dc.last[b] = now;
    dcRender();
  }
  function dcRender() {
    $("dcTable").innerHTML = BTN.map(function (name, b) {
      var n = dc.counts[b] || 0, f = dc.flags[b] || 0, g = dc.minGap[b];
      var status = !n ? "—" : f ? '<span class="bad">⚠ ' + f + " double-click" + (f > 1 ? "s" : "") + "</span>" : '<span class="good">OK</span>';
      return "<tr><td>" + name + "</td><td>" + n + "</td><td>" + (g && isFinite(g) ? Math.round(g) + " ms" : "—") + "</td><td>" + status + "</td></tr>";
    }).join("");
  }

  // ---------- Polling rate ----------
  var pr = { times: [], samples: [], peak: 0, last: 0 };
  var STANDARD_HZ = [125, 250, 500, 1000, 2000, 4000, 8000];
  function prEvent(e) {
    var list = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    if (!list.length) list = [e];
    var now = performance.now();
    list.forEach(function (ev) { pr.times.push(ev.timeStamp || now); });
    // keep 300 ms of history
    var cut = now - 300;
    while (pr.times.length && pr.times[0] < cut) pr.times.shift();
    if (now - pr.last > 100 && pr.times.length > 5) {
      pr.last = now;
      var span = pr.times[pr.times.length - 1] - pr.times[0];
      if (span > 150) {
        var hz = (pr.times.length - 1) / (span / 1000);
        pr.samples.push(hz); if (pr.samples.length > 60) pr.samples.shift();
        pr.peak = Math.max(pr.peak, hz);
        prRender(hz);
      }
    }
  }
  function nearest(hz) { return STANDARD_HZ.reduce(function (a, b) { return Math.abs(b - hz) < Math.abs(a - hz) ? b : a; }); }
  function prRender(hz) {
    var sorted = pr.samples.slice().sort(function (a, b) { return a - b; });
    var median = sorted[Math.floor(sorted.length / 2)] || 0;
    $("prNow").textContent = Math.round(hz);
    $("prAvg").textContent = Math.round(median);
    $("prPeak").textContent = Math.round(pr.peak);
    $("prGuess").textContent = median ? "≈ " + nearest(median) + " Hz mouse" : "—";
  }
  function prReset() { pr = { times: [], samples: [], peak: 0, last: 0 }; ["prNow", "prAvg", "prPeak"].forEach(function (id) { $(id).textContent = "0"; }); $("prGuess").textContent = "—"; }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("#mtTabs .chip").forEach(function (b) {
      b.addEventListener("click", function () { var t = b.getAttribute("data-tab"); showTab(t); history.replaceState(null, "", "#" + t); });
    });
    var hash = location.hash.replace("#", "");
    if (["cps", "reaction", "double-click", "polling"].indexOf(hash) !== -1) showTab(hash);
    else if (window.QT_PRESET && window.QT_PRESET.tab) showTab(window.QT_PRESET.tab);

    $("cpsArea").addEventListener("pointerdown", cpsClick);
    $("cpsDur").addEventListener("change", cpsReset);
    $("cpsRetry").addEventListener("click", cpsReset);
    cpsReset();

    $("rxArea").addEventListener("pointerdown", function (e) { if (rx.state === "between") rxClickBetween(e); else rxDown(e); });
    rxList();

    var dca = $("dcArea");
    dca.addEventListener("pointerdown", dcDown);
    dca.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    dca.addEventListener("auxclick", function (e) { e.preventDefault(); });
    $("dcReset").addEventListener("click", function () { dc = { last: {}, counts: {}, flags: {}, minGap: {} }; dcRender(); });
    dcRender();

    var pa = $("prArea");
    var evt = "onpointerrawupdate" in window ? "pointerrawupdate" : "pointermove";
    $("prApi").textContent = evt === "pointerrawupdate" ? "high-precision raw events" : "standard pointer events (may cap below your real rate)";
    pa.addEventListener(evt, prEvent);
    $("prReset").addEventListener("click", prReset);
  });
})();
