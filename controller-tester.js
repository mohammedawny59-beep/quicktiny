// QuickTiny Controller Tester — Gamepad API, all local. Live buttons/triggers/sticks,
// stick-drift check, vibration test and a raw readout for non-standard controllers.

(function () {
  var $ = function (id) { return document.getElementById(id); };
  var selected = null;          // gamepad index
  var trails = { L: [], R: [] };
  var drift = null;             // running drift sample {until, L:[], R:[]}
  var pressed = {};             // button index -> times pressed (this session)
  var lastPressed = {};
  var rafId = null;

  // Standard-mapping button names (https://w3c.github.io/gamepad/#remapping)
  var NAMES = ["A / Cross", "B / Circle", "X / Square", "Y / Triangle", "LB / L1", "RB / R1", "LT / L2", "RT / R2",
    "Back / Share", "Start / Options", "L-stick press", "R-stick press", "D-pad up", "D-pad down", "D-pad left", "D-pad right", "Home / PS"];

  function pads() { return [].slice.call(navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean); }

  function refreshList() {
    var list = pads(), sel = $("ctPad");
    var prev = selected;
    sel.innerHTML = "";
    list.forEach(function (p) {
      var o = document.createElement("option");
      o.value = p.index; o.textContent = "#" + (p.index + 1) + " — " + p.id;
      sel.appendChild(o);
    });
    if (!list.length) {
      selected = null;
      $("ctEmpty").hidden = false; $("ctLive").hidden = true;
      return;
    }
    if (prev === null || !list.some(function (p) { return p.index === prev; })) selected = list[0].index;
    sel.value = String(selected);
    $("ctEmpty").hidden = true; $("ctLive").hidden = false;
    if (!rafId) loop();
  }

  function fmt(v) { return (v >= 0 ? "+" : "") + v.toFixed(3); }

  function drawStick(canvas, x, y, trail) {
    var ctx = canvas.getContext("2d"), s = canvas.width, c = s / 2, r = s / 2 - 10;
    ctx.clearRect(0, 0, s, s);
    ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(c, c, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(c, c, r * 0.1, 0, Math.PI * 2); ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(c - r, c); ctx.lineTo(c + r, c); ctx.moveTo(c, c - r); ctx.lineTo(c, c + r); ctx.stroke();
    // trail
    for (var i = 1; i < trail.length; i++) {
      ctx.strokeStyle = "rgba(59,226,255," + (i / trail.length * 0.6).toFixed(3) + ")"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(c + trail[i - 1][0] * r, c + trail[i - 1][1] * r); ctx.lineTo(c + trail[i][0] * r, c + trail[i][1] * r); ctx.stroke();
    }
    var g = ctx.createRadialGradient(c + x * r, c + y * r, 0, c + x * r, c + y * r, 14);
    g.addColorStop(0, "#ffffff"); g.addColorStop(0.4, "#7b7bff"); g.addColorStop(1, "rgba(91,91,255,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c + x * r, c + y * r, 14, 0, Math.PI * 2); ctx.fill();
  }

  function setBtn(i, b) {
    var el = document.querySelector('[data-btn="' + i + '"]');
    var on = b && (b.pressed || b.value > 0.15);
    if (el) el.classList.toggle("on", !!on);
    if (on && !lastPressed[i]) { pressed[i] = (pressed[i] || 0) + 1; }
    lastPressed[i] = !!on;
  }

  function loop() {
    rafId = requestAnimationFrame(loop);
    if (selected === null) return;
    var p = navigator.getGamepads()[selected];
    if (!p) return;

    for (var i = 0; i < p.buttons.length; i++) setBtn(i, p.buttons[i]);
    var lt = p.buttons[6] ? p.buttons[6].value : 0, rt = p.buttons[7] ? p.buttons[7].value : 0;
    $("ctLT").style.height = (lt * 100) + "%"; $("ctLTv").textContent = Math.round(lt * 100) + "%";
    $("ctRT").style.height = (rt * 100) + "%"; $("ctRTv").textContent = Math.round(rt * 100) + "%";

    var lx = p.axes[0] || 0, ly = p.axes[1] || 0, rx = p.axes[2] || 0, ry = p.axes[3] || 0;
    [["L", lx, ly], ["R", rx, ry]].forEach(function (s) {
      var t = trails[s[0]]; t.push([s[1], s[2]]); if (t.length > 50) t.shift();
      drawStick($("ct" + s[0] + "Canvas"), s[1], s[2], t);
      $("ct" + s[0] + "Val").textContent = "X " + fmt(s[1]) + "   Y " + fmt(s[2]);
      var dot = document.querySelector('[data-stick="' + s[0] + '"]');
      if (dot) dot.setAttribute("transform", "translate(" + (s[1] * 9).toFixed(1) + " " + (s[2] * 9).toFixed(1) + ")");
    });

    if (drift) {
      drift.L.push(Math.hypot(lx, ly)); drift.R.push(Math.hypot(rx, ry));
      var left = Math.max(0, drift.until - performance.now());
      $("ctDriftBtn").textContent = "Keep hands off… " + (left / 1000).toFixed(1) + "s";
      if (!left) finishDrift();
    }

    // Raw readout (all buttons/axes, for non-standard controllers)
    if (!$("ctRaw").hidden) {
      $("ctRawAxes").textContent = p.axes.map(function (a, k) { return "axis " + k + ": " + fmt(a); }).join("\n");
      $("ctRawBtns").textContent = p.buttons.map(function (b, k) {
        return "btn " + k + (NAMES[k] && p.mapping === "standard" ? " (" + NAMES[k] + ")" : "") + ": " + b.value.toFixed(2) + (b.pressed ? "  ●" : "") + (pressed[k] ? "  ×" + pressed[k] : "");
      }).join("\n");
    }
    $("ctMeta").textContent = (p.mapping === "standard" ? "Standard layout" : "Non-standard layout — use the raw view") + " · " + p.buttons.length + " buttons · " + p.axes.length + " axes";
  }

  // Drift: sample both sticks for 3 s while untouched. Resting offset beyond a typical
  // deadzone means the stick doesn't return to centre.
  function startDrift() {
    if (selected === null) return;
    drift = { until: performance.now() + 3000, L: [], R: [] };
    $("ctDriftBtn").disabled = true;
    $("ctDriftOut").innerHTML = "";
  }
  function verdict(samples) {
    var max = Math.max.apply(null, samples), avg = samples.reduce(function (a, b) { return a + b; }, 0) / samples.length;
    var level = max < 0.05 ? ["good", "No drift"] : max < 0.12 ? ["warn", "Slight drift — usually hidden by the game's deadzone"] : ["bad", "Drift detected — the stick doesn't return to centre"];
    return { max: max, avg: avg, level: level };
  }
  function finishDrift() {
    var L = verdict(drift.L), R = verdict(drift.R);
    drift = null;
    $("ctDriftBtn").disabled = false; $("ctDriftBtn").textContent = "Run drift test again";
    $("ctDriftOut").innerHTML = [["Left stick", L], ["Right stick", R]].map(function (row) {
      var v = row[1];
      return '<div class="ct-drift ' + v.level[0] + '"><strong>' + row[0] + ":</strong> " + v.level[1] +
        '<span>resting offset max ' + (v.max * 100).toFixed(1) + "% · avg " + (v.avg * 100).toFixed(1) + "%</span></div>";
    }).join("");
    qtTrack("controller_drift_test");
  }

  function rumble(strong, weak) {
    var p = selected !== null && navigator.getGamepads()[selected];
    var out = $("ctRumbleOut");
    if (!p || !p.vibrationActuator) { out.textContent = "This browser or controller doesn't expose vibration (try Chrome or Edge)."; out.className = "result"; return; }
    p.vibrationActuator.playEffect("dual-rumble", { duration: 900, strongMagnitude: strong, weakMagnitude: weak })
      .then(function () { out.textContent = "Did you feel it? If not, that motor may be weak or broken."; out.className = "result"; })
      .catch(function () { out.textContent = "Vibration request was rejected by the browser."; out.className = "result error"; });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!("getGamepads" in navigator)) {
      $("ctEmpty").innerHTML = "<strong>Your browser doesn't support the Gamepad API.</strong> Try a recent Chrome, Edge, Firefox or Safari.";
      return;
    }
    window.addEventListener("gamepadconnected", function () { refreshList(); qtTrack("controller_connected"); });
    window.addEventListener("gamepaddisconnected", refreshList);
    $("ctPad").addEventListener("change", function () { selected = Number(this.value); trails = { L: [], R: [] }; });
    $("ctDriftBtn").addEventListener("click", startDrift);
    $("ctRumbleBoth").addEventListener("click", function () { rumble(1, 1); });
    $("ctRumbleStrong").addEventListener("click", function () { rumble(1, 0); });
    $("ctRumbleWeak").addEventListener("click", function () { rumble(0, 1); });
    $("ctRawToggle").addEventListener("click", function () { var r = $("ctRaw"); r.hidden = !r.hidden; this.textContent = r.hidden ? "Show raw values" : "Hide raw values"; });
    // Some browsers only list pads after a button press; poll briefly as a fallback.
    var tries = 0, t = setInterval(function () { if (pads().length || ++tries > 600) { clearInterval(t); if (pads().length) refreshList(); } }, 500);
  });
})();
