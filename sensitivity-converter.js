// QuickTiny Sensitivity Converter — same physical turn (cm/360) across games.
// yaw = degrees the camera turns per mouse count at in-game sensitivity 1.
// Values cross-checked across several converters (csdb.gg, metabot.gg, mouse-sensitivity.com).

var QT_GAMES = [
  { id: "cs2",      name: "Counter-Strike 2",          yaw: 0.022,          dp: 3, note: "" },
  { id: "valorant", name: "Valorant",                  yaw: 0.07,           dp: 3, note: "" },
  { id: "apex",     name: "Apex Legends",              yaw: 0.022,          dp: 2, note: "Hip-fire sensitivity." },
  { id: "ow2",      name: "Overwatch 2",               yaw: 0.0066,         dp: 2, note: "" },
  { id: "cod",      name: "Call of Duty (MW, Warzone, BO6)", yaw: 0.0066,   dp: 2, note: "Hip-fire mouse sensitivity." },
  { id: "r6",       name: "Rainbow Six Siege",         yaw: 0.00572957795,  dp: 0, note: "Assumes the default MouseSensitivityMultiplierUnit of 0.02." },
  { id: "fortnite", name: "Fortnite",                  yaw: 0.005555,       dp: 1, note: "X-axis sensitivity as shown in settings (%)." },
  { id: "source",   name: "Source games (TF2, CS:S, GMod)", yaw: 0.022,     dp: 3, note: "" }
];

function qtGame(id) { return QT_GAMES.filter(function (g) { return g.id === id; })[0]; }
function qtCm360(dpi, sens, yaw) { return 360 / (dpi * sens * yaw) * 2.54; }
function qtConvert(sens, from, dpiFrom, to, dpiTo) { return sens * from.yaw * dpiFrom / (to.yaw * dpiTo); }
function qtRound(v, dp) { var f = Math.pow(10, dp); return Math.round(v * f) / f; }

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };

  function fill(sel, def) {
    QT_GAMES.forEach(function (g) { var o = document.createElement("option"); o.value = g.id; o.textContent = g.name; sel.appendChild(o); });
    sel.value = def;
  }

  function run() {
    var from = qtGame($("scFrom").value), to = qtGame($("scTo").value);
    var sens = parseFloat(String($("scSens").value).replace(",", ".")), dpiF = parseFloat($("scDpi").value), dpiT = parseFloat($("scDpiTo").value) || dpiF;
    var out = $("scOut");
    if (!(sens > 0) || !(dpiF > 0) || !(dpiT > 0)) { out.innerHTML = '<div class="result">Enter your sensitivity and DPI.</div>'; $("scTable").innerHTML = ""; return; }
    var target = qtConvert(sens, from, dpiF, to, dpiT);
    var cm = qtCm360(dpiF, sens, from.yaw);
    out.innerHTML =
      '<div class="sc-big"><span>' + to.name + ' sensitivity</span><b id="scResult">' + qtRound(target, Math.max(to.dp, 2) + 1) + '</b>' +
      '<button class="btn btn-secondary" type="button" id="scCopy">Copy</button></div>' +
      '<div class="mt-stats" style="grid-template-columns:repeat(3,minmax(0,1fr))">' +
      '<div class="stat"><div class="n">' + cm.toFixed(1) + '</div><div class="l">cm / 360°</div></div>' +
      '<div class="stat"><div class="n">' + (cm / 2.54).toFixed(1) + '</div><div class="l">inches / 360°</div></div>' +
      '<div class="stat"><div class="n">' + Math.round(dpiF * sens) + '</div><div class="l">eDPI (' + from.name.split(" (")[0] + ')</div></div></div>' +
      (to.note || from.note ? '<p class="privacy-note">' + [from.note && from.name + ": " + from.note, to.note && to.id !== from.id && to.name + ": " + to.note].filter(Boolean).join(" ") + "</p>" : "") +
      (cm < 15 ? '<p class="privacy-note">That\'s a very fast sensitivity (under 15 cm/360). Many tactical-shooter players use 25–50 cm.</p>' : "");
    $("scCopy").addEventListener("click", function () { qtCopy(String(qtRound(target, Math.max(to.dp, 2) + 1)), $("scCopyStatus"), "Copied"); });

    $("scTable").innerHTML = QT_GAMES.map(function (g) {
      var v = qtConvert(sens, from, dpiF, g, dpiT);
      return "<tr" + (g.id === to.id ? ' class="hl"' : "") + "><td>" + g.name + "</td><td><b>" + qtRound(v, Math.max(g.dp, 2) + 1) + "</b></td></tr>";
    }).join("");
    try { history.replaceState(null, "", "#" + [from.id, sens, dpiF, to.id, dpiT].join("/")); } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", function () {
    var QP = window.QT_PRESET || {};
    fill($("scFrom"), QP.from && qtGame(QP.from) ? QP.from : "valorant"); fill($("scTo"), QP.to && qtGame(QP.to) ? QP.to : "cs2");
    if (QP.sens) $("scSens").value = QP.sens;
    var h = location.hash.replace("#", "").split("/");
    if (h.length === 5 && qtGame(h[0]) && qtGame(h[3])) { $("scFrom").value = h[0]; $("scSens").value = h[1]; $("scDpi").value = h[2]; $("scTo").value = h[3]; $("scDpiTo").value = h[4]; }
    ["scFrom", "scTo", "scSens", "scDpi", "scDpiTo"].forEach(function (id) { $(id).addEventListener("input", run); $(id).addEventListener("change", run); });
    $("scSwap").addEventListener("click", function () { var a = $("scFrom").value; $("scFrom").value = $("scTo").value; $("scTo").value = a; var r = $("scResult"); if (r) $("scSens").value = r.textContent; run(); });
    run();
  });
})();

if (typeof module !== "undefined") module.exports = { QT_GAMES: QT_GAMES, qtConvert: qtConvert, qtCm360: qtCm360, qtGame: qtGame };
