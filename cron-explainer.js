// QuickTiny Cron Explainer — plain-English description, field breakdown, next run times (local or UTC),
// supports 5-field crontab, 6-field with seconds, @macros, names, L, nL and n#k. All local.

var QT_CRON_MACROS = { "@yearly": "0 0 1 1 *", "@annually": "0 0 1 1 *", "@monthly": "0 0 1 * *", "@weekly": "0 0 * * 0", "@daily": "0 0 * * *", "@midnight": "0 0 * * *", "@hourly": "0 * * * *" };
var QT_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
var QT_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
var QT_CRON_FIELDS = {
  sec: { name: "Second", min: 0, max: 59 }, min: { name: "Minute", min: 0, max: 59 }, hour: { name: "Hour", min: 0, max: 23 },
  dom: { name: "Day of month", min: 1, max: 31 }, mon: { name: "Month", min: 1, max: 12, names: ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] },
  dow: { name: "Day of week", min: 0, max: 7, names: ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] }
};

function qtCronField(raw, key) {
  var f = QT_CRON_FIELDS[key], set = new Array(f.max + 1).fill(false), extra = { last: false, nth: [], lastDow: [] }, tokens = [];
  function num(s) {
    var u = s.toUpperCase();
    if (f.names) { var i = f.names.indexOf(u); if (i !== -1) return key === "mon" ? i + 1 : i; }
    if (!/^\d+$/.test(s)) throw new Error(f.name + ': "' + s + '" is not a number' + (f.names ? " or a name like " + f.names[1] : ""));
    var n = +s;
    if (n < f.min || n > f.max) throw new Error(f.name + " must be " + f.min + "–" + (key === "dow" ? 6 : f.max) + (key === "dow" ? " (0 or 7 = Sunday)" : "") + " — got " + n);
    return n;
  }
  raw.split(",").forEach(function (part) {
    if (part === "") throw new Error(f.name + ": empty value (check your commas)");
    var m;
    if (key === "dom" && /^L$/i.test(part)) { extra.last = true; tokens.push({ t: "L" }); return; }
    if (key === "dow" && (m = /^(\w+)L$/i.exec(part))) { var d = num(m[1]) % 7; extra.lastDow.push(d); tokens.push({ t: "lastDow", v: d }); return; }
    if (key === "dow" && (m = /^(\w+)#([1-5])$/.exec(part))) { var d2 = num(m[1]) % 7; extra.nth.push([d2, +m[2]]); tokens.push({ t: "nth", v: d2, n: +m[2] }); return; }
    var step = 1, range = part, sm = /^(.*)\/(\d+)$/.exec(part);
    if (sm) { range = sm[1]; step = +sm[2]; if (step < 1) throw new Error(f.name + ": step must be at least 1"); }
    var lo, hi, kind;
    if (range === "*" || range === "?") { if (range === "?" && key !== "dom" && key !== "dow") throw new Error('"?" is only allowed in day-of-month or day-of-week'); lo = f.min; hi = key === "dow" ? 6 : f.max; kind = sm ? "step" : "all"; }
    else if ((m = /^([^-]+)-([^-]+)$/.exec(range))) { lo = num(m[1]); hi = num(m[2]); kind = sm ? "rangeStep" : "range"; if (lo > hi && !(key === "dow" && hi === 0)) throw new Error(f.name + ": range " + range + " goes backwards"); if (key === "dow" && hi === 0) hi = 7; }
    else { lo = num(range); hi = sm ? (key === "dow" ? 6 : f.max) : lo; kind = sm ? "step" : "single"; }
    for (var v = lo; v <= hi; v += step) set[key === "dow" ? v % 7 : v] = true;
    tokens.push({ t: kind, lo: lo, hi: hi, step: step, raw: part, star: range === "*" || range === "?" });
  });
  if (key === "dow") set[7] = false;
  return { raw: raw, set: set, extra: extra, tokens: tokens, star: /^[*?]/.test(raw) };
}

function qtCronParse(expr) {
  var e = String(expr).trim().replace(/\s+/g, " ");
  if (!e) throw new Error("Type a cron expression, e.g. */15 * * * *");
  if (/^@reboot$/i.test(e)) return { reboot: true, expr: e };
  var macro = QT_CRON_MACROS[e.toLowerCase()];
  if (e.charAt(0) === "@" && !macro) throw new Error("Unknown macro " + e + " — use @yearly, @monthly, @weekly, @daily, @hourly or @reboot");
  var parts = (macro || e).split(" ");
  if (parts.length === 7) parts = parts.slice(0, 6); // Quartz year field: ignored
  if (parts.length !== 5 && parts.length !== 6) throw new Error("Cron needs 5 fields (minute hour day month weekday) — or 6 with seconds first. This has " + parts.length + ".");
  var hasSec = parts.length === 6, keys = hasSec ? ["sec", "min", "hour", "dom", "mon", "dow"] : ["min", "hour", "dom", "mon", "dow"], c = { expr: e, macro: macro || null, hasSec: hasSec, f: {} };
  keys.forEach(function (k, i) { c.f[k] = qtCronField(parts[i], k); });
  if (!hasSec) c.f.sec = qtCronField("0", "sec");
  return c;
}

function qtDim(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); } // m is 1-based
function qtCronDayMatch(c, y, mo, d, dow) {
  var D = c.f.dom, W = c.f.dow, dim = qtDim(y, mo);
  var domOk = D.set[d] || (D.extra.last && d === dim);
  var dowOk = W.set[dow] || W.extra.nth.some(function (x) { return x[0] === dow && Math.ceil(d / 7) === x[1]; }) || W.extra.lastDow.some(function (x) { return x === dow && d + 7 > dim; });
  if (D.star && W.star) return true;
  if (D.star) return dowOk;
  if (W.star) return domOk;
  return domOk || dowOk; // classic cron: both restricted -> either one
}

// Next `count` run times after `from` (Date). utc=true evaluates the schedule in UTC.
function qtCronNext(c, from, count, utc) {
  if (c.reboot) return [];
  var out = [], f = c.f, t = new Date(from.getTime() + 1000);
  var G = utc ? { y: "getUTCFullYear", m: "getUTCMonth", d: "getUTCDate", h: "getUTCHours", mi: "getUTCMinutes", s: "getUTCSeconds", w: "getUTCDay" } : { y: "getFullYear", m: "getMonth", d: "getDate", h: "getHours", mi: "getMinutes", s: "getSeconds", w: "getDay" };
  var make = function (y, mo, d, h, mi, s) { return utc ? new Date(Date.UTC(y, mo - 1, d, h, mi, s)) : new Date(y, mo - 1, d, h, mi, s); };
  var Y = t[G.y](), M = t[G.m]() + 1, D = t[G.d](), h0 = t[G.h](), m0 = t[G.mi](), s0 = t[G.s]();
  for (var day = 0; day < 366 * 6 && out.length < count; day++) {
    var dimNow = qtDim(Y, M);
    if (f.mon.set[M]) {
      var wd = make(Y, M, D, 12, 0, 0)[G.w]();
      if (qtCronDayMatch(c, Y, M, D, wd)) {
        for (var h = h0; h < 24 && out.length < count; h++) {
          if (!f.hour.set[h]) continue;
          for (var mi = h === h0 ? m0 : 0; mi < 60 && out.length < count; mi++) {
            if (!f.min.set[mi]) continue;
            for (var s = (h === h0 && mi === m0) ? s0 : 0; s < 60 && out.length < count; s++) {
              if (!f.sec.set[s]) continue;
              var r = make(Y, M, D, h, mi, s);
              if (r[G.h]() !== h || r[G.mi]() !== mi) continue; // skipped by a DST change
              if (out.length && r <= out[out.length - 1]) continue;
              if (r > from) out.push(r);
            }
          }
        }
      }
    }
    D++; h0 = 0; m0 = 0; s0 = 0;
    if (D > dimNow) { D = 1; M++; if (M > 12) { M = 1; Y++; } }
  }
  return out;
}

// ---------- plain-English description ----------
function qtPad(n) { return (n < 10 ? "0" : "") + n; }
function qtList(a) { return a.length <= 1 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }
function qtOrd(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
function qtValues(fd, max) { var a = []; for (var i = 0; i <= max; i++) if (fd.set[i]) a.push(i); return a; }
function qtSingle(fd) { return fd.tokens.length === 1 && fd.tokens[0].t === "single" ? fd.tokens[0].lo : null; }

function qtUnitDesc(fd, unit, fmt) {
  fmt = fmt || function (v) { return String(v); };
  return qtList(fd.tokens.map(function (k) {
    if (k.t === "all") return "every " + unit;
    if (k.t === "single") return unit + " " + fmt(k.lo);
    if (k.t === "range") return "every " + unit + " from " + fmt(k.lo) + " through " + fmt(k.hi);
    if (k.t === "step") return k.star ? "every " + k.step + " " + unit + "s" : "every " + k.step + " " + unit + "s starting at " + fmt(k.lo);
    if (k.t === "rangeStep") return "every " + k.step + " " + unit + "s from " + fmt(k.lo) + " through " + fmt(k.hi);
    return k.raw;
  }));
}

function qtCronDescribe(c) {
  if (c.reboot) return "Once, every time the machine (or cron service) starts.";
  var f = c.f, sec = c.hasSec ? qtSingle(f.sec) : 0, mn = qtSingle(f.min), hr = qtSingle(f.hour), time;
  var hours = qtValues(f.hour, 23), mins = qtValues(f.min, 59);
  var secPart = c.hasSec && sec === null ? qtUnitDesc(f.sec, "second") + ", " : "";
  var clock = function (h, m) { return qtPad(h) + ":" + qtPad(m) + (c.hasSec && sec !== null && sec !== 0 ? ":" + qtPad(sec) : ""); };
  var everyMin = f.min.tokens.length === 1 && f.min.tokens[0].t === "all";
  var everyHour = f.hour.tokens.length === 1 && f.hour.tokens[0].t === "all";
  if (mn !== null && hours.length && hours.length <= 8 && !everyHour) time = "At " + qtList(hours.map(function (h) { return clock(h, mn); }));
  else if (mins.length <= 4 && mn === null && hr !== null) time = "At " + qtList(mins.map(function (m) { return clock(hr, m); }));
  else if (mn !== null && everyHour) time = c.hasSec && sec ? "At minute " + mn + ", second " + sec + " of every hour" : mn === 0 ? "Every hour, on the hour" : "At minute " + mn + " of every hour";
  else if (everyMin && everyHour) time = c.hasSec && sec === null ? "" : "Every minute";
  else if (everyHour) time = qtUnitDesc(f.min, "minute").replace(/^every/, "Every");
  else if (everyMin) time = "Every minute " + (hr !== null ? "from " + qtPad(hr) + ":00 through " + qtPad(hr) + ":59" : "during " + qtUnitDesc(f.hour, "hour", function (h) { return qtPad(h) + ":00"; }).replace(/hour (\d\d:00)/g, "$1"));
  else {
    var mDesc = mn !== null ? "At minute " + mn : qtUnitDesc(f.min, "minute").replace(/^every/, "Every");
    var range = f.hour.tokens.length === 1 && f.hour.tokens[0].t === "range" ? f.hour.tokens[0] : null;
    time = mDesc + (range ? ", between " + qtPad(range.lo) + ":00 and " + qtPad(range.hi) + ":59" : " past " + qtUnitDesc(f.hour, "hour", function (h) { return qtPad(h) + ":00"; }).replace(/hour (\d\d:00)/g, "$1"));
  }
  if (c.hasSec && sec === null) time = (secPart.replace(/, $/, "") + (time ? ", " + time.charAt(0).toLowerCase() + time.slice(1) : "")).replace(/^every/, "Every");
  // day part
  var D = f.dom, W = f.dow, day = [], monthTxt = "";
  var dayName = function (d) { return QT_DAYS[d % 7]; };
  var domTxt = function () {
    return qtList(D.tokens.map(function (k) {
      if (k.t === "L") return "the last day of the month";
      if (k.t === "single") return "day " + k.lo;
      if (k.t === "range") return "days " + k.lo + " through " + k.hi;
      if (k.t === "step") return "every " + k.step + " days" + (k.lo > 1 ? " starting on day " + k.lo : "");
      if (k.t === "rangeStep") return "every " + k.step + " days from day " + k.lo + " through " + k.hi;
      return k.raw;
    })) + (D.tokens.every(function (k) { return k.t === "L"; }) ? "" : " of the month");
  };
  var dowTxt = function () {
    return qtList(W.tokens.map(function (k) {
      if (k.t === "nth") return "the " + ["", "first", "second", "third", "fourth", "fifth"][k.n] + " " + dayName(k.v) + " of the month";
      if (k.t === "lastDow") return "the last " + dayName(k.v) + " of the month";
      if (k.t === "single") return dayName(k.lo);
      if (k.t === "range") return dayName(k.lo) + " through " + dayName(k.hi);
      if (k.t === "all") return "every day";
      if (k.t === "step" || k.t === "rangeStep") return qtList(qtValues(W, 6).map(dayName));
      return k.raw;
    }));
  };
  var dSingle = qtSingle(D), mSingle = qtSingle(f.mon);
  if (dSingle !== null && mSingle !== null && W.star) { day.push("on " + QT_MONTHS[mSingle - 1] + " " + dSingle); f = Object.assign({}, f, { mon: qtCronField("*", "mon") }); }
  else if (!D.star && !W.star) day.push("on " + domTxt() + " or on " + dowTxt() + " (either one — standard cron rule)");
  else if (!D.star) day.push("on " + domTxt());
  else if (!W.star) day.push(/^the /.test(dowTxt()) ? "on " + dowTxt() : W.tokens.length === 1 && W.tokens[0].t === "range" ? dowTxt() : W.tokens.length === 1 && W.tokens[0].t === "single" ? "every " + dowTxt() : "on " + dowTxt());
  else if (D.tokens[0].t === "step") day.push("on " + domTxt());
  else if (W.tokens[0].t === "step") day.push("on " + dowTxt());
  var Mo = f.mon;
  if (!(Mo.tokens.length === 1 && Mo.tokens[0].t === "all")) {
    var mv = qtValues(Mo, 12).map(function (m) { return QT_MONTHS[m - 1]; });
    var mt = Mo.tokens.length === 1 ? Mo.tokens[0] : null;
    monthTxt = mt && mt.t === "range" ? "from " + QT_MONTHS[mt.lo - 1] + " through " + QT_MONTHS[mt.hi - 1]
      : mt && (mt.t === "step" || mt.t === "rangeStep") ? "every " + mt.step + " months (" + qtList(mv) + ")" : "in " + qtList(mv);
  }
  var s = [time].concat(day).concat(monthTxt ? [monthTxt] : []).filter(Boolean).join(", ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

var QT_CRON_PRESETS = [
  ["Every minute", "* * * * *"], ["Every 5 minutes", "*/5 * * * *"], ["Every 15 minutes", "*/15 * * * *"], ["Every hour", "0 * * * *"],
  ["Every day at midnight", "0 0 * * *"], ["Weekdays at 9:00", "0 9 * * 1-5"], ["Every Monday 8:30", "30 8 * * MON"],
  ["Twice a day", "0 9,21 * * *"], ["1st of the month", "0 0 1 * *"], ["Last day of month", "0 18 L * *"],
  ["Every quarter", "0 0 1 */3 *"], ["First Monday", "0 10 * * 1#1"], ["Every 30 s (6 fields)", "*/30 * * * * *"], ["Office hours", "*/10 9-17 * * 1-5"]
];

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); };
  var tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || "local time";

  function compress(vals, names) {
    var out = [], i = 0;
    while (i < vals.length) { var j = i; while (j + 1 < vals.length && vals[j + 1] === vals[j] + 1) j++; var a = names ? names(vals[i]) : vals[i], b = names ? names(vals[j]) : vals[j]; out.push(j - i >= 2 ? a + "–" + b : j > i ? a + ", " + b : String(a)); i = j + 1; }
    return out.join(", ");
  }
  function rel(ms) {
    var s = Math.round(ms / 1000), a = Math.abs(s);
    if (a < 60) return "in " + s + " s"; if (a < 3600) return "in " + Math.round(s / 60) + " min";
    if (a < 86400) return "in " + Math.floor(s / 3600) + " h " + Math.round((s % 3600) / 60) + " min"; return "in " + Math.round(s / 86400) + " days";
  }
  function run() {
    var e = $("crIn").value, c;
    try { c = qtCronParse(e); } catch (err) { $("crIn").classList.add("cr-bad"); $("crDesc").textContent = err.message; $("crDesc").className = "cr-desc cr-err"; $("crFields").innerHTML = ""; $("crNext").innerHTML = ""; $("crNotes").innerHTML = ""; return; }
    $("crIn").classList.remove("cr-bad");
    $("crDesc").className = "cr-desc"; $("crDesc").textContent = qtCronDescribe(c);
    if (c.reboot) { $("crFields").innerHTML = ""; $("crNext").innerHTML = '<li class="cr-dim">Runs at startup — no clock schedule.</li>'; $("crNotes").innerHTML = ""; return; }
    var keys = c.hasSec ? ["sec", "min", "hour", "dom", "mon", "dow"] : ["min", "hour", "dom", "mon", "dow"];
    $("crFields").innerHTML = keys.map(function (k) {
      var fd = c.f[k], meta = QT_CRON_FIELDS[k], vals = qtValues(fd, k === "dow" ? 6 : meta.max).filter(function (v) { return v >= meta.min; });
      var shown = fd.tokens.length === 1 && fd.tokens[0].t === "all" ? "any" : compress(vals, k === "mon" ? function (v) { return QT_MONTHS[v - 1].slice(0, 3); } : k === "dow" ? function (v) { return QT_DAYS[v].slice(0, 3); } : null);
      var x = [];
      if (fd.extra.last) x.push("last day"); fd.extra.nth.forEach(function (n) { x.push(qtOrd(n[1]) + " " + QT_DAYS[n[0]].slice(0, 3)); }); fd.extra.lastDow.forEach(function (d) { x.push("last " + QT_DAYS[d].slice(0, 3)); });
      if (x.length) shown = (vals.length ? shown + ", " : "") + x.join(", ");
      return '<div class="cr-f"><code>' + esc(fd.raw) + "</code><b>" + meta.name + "</b><span>" + esc(shown || "—") + "</span></div>";
    }).join("");
    var utc = $("crTz").value === "utc", now = new Date(), runs = qtCronNext(c, now, 10, utc);
    var fmt = function (d, inUtc) { return d.toLocaleString(undefined, { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: c.hasSec ? "2-digit" : undefined, hour12: false, timeZone: inUtc ? "UTC" : undefined }); };
    $("crNext").innerHTML = runs.length ? runs.map(function (d) {
      return "<li><span class=\"cr-when\">" + esc(fmt(d, utc)) + "</span><span class=\"cr-rel\">" + rel(d - now) + "</span><span class=\"cr-alt\">" + (utc ? esc(fmt(d, false)) + " your time" : esc(fmt(d, true)) + " UTC") + "</span></li>";
    }).join("") : '<li class="cr-dim">No run in the next 6 years — check the day and month (e.g. 31 February never happens).</li>';
    var notes = [];
    if (c.hasSec) notes.push("This uses a seconds field (6 fields). Standard crontab, GitHub Actions and Kubernetes only accept 5 fields — remove the first field there.");
    if (!c.f.dom.star && !c.f.dow.star) notes.push("Both day-of-month and day-of-week are set, so it runs when <b>either</b> matches (classic cron). Quartz and some schedulers use AND instead.");
    if (runs.length > 1) { var gap = Math.min.apply(null, runs.slice(1).map(function (d, i) { return d - runs[i]; })); if (gap < 5 * 60000) notes.push("Runs more often than every 5 minutes — GitHub Actions won't schedule workflows faster than that."); }
    if (c.f.dow.extra.nth.length || c.f.dow.extra.lastDow.length || c.f.dom.extra.last) notes.push("<code>L</code> and <code>#</code> are Quartz / Spring / AWS extensions — classic crontab doesn't support them.");
    notes.push("Cron on servers usually runs in the server's time zone (often UTC). Your browser time zone is <b>" + esc(tz) + "</b>.");
    $("crNotes").innerHTML = notes.map(function (n) { return "<li>" + n + "</li>"; }).join("");
    try { history.replaceState(null, "", "#" + encodeURIComponent(e.trim()).replace(/%20/g, "_")); } catch (er) {}
  }
  document.addEventListener("DOMContentLoaded", function () {
    $("crPresets").innerHTML = QT_CRON_PRESETS.map(function (p, i) { return '<button type="button" class="chip" data-i="' + i + '" title="' + esc(p[1]) + '">' + esc(p[0]) + "</button>"; }).join("");
    document.querySelectorAll("#crPresets .chip").forEach(function (b) { b.addEventListener("click", function () { $("crIn").value = QT_CRON_PRESETS[+b.getAttribute("data-i")][1]; run(); qtTrack("cron_preset"); }); });
    $("crIn").addEventListener("input", run);
    $("crTz").addEventListener("change", run);
    $("crTz").options[0].textContent = "Your time (" + tz + ")";
    $("crCopy").addEventListener("click", function () { qtCopy($("crIn").value.trim(), $("crStatus"), "Expression copied"); });
    $("crCopyDesc").addEventListener("click", function () { qtCopy($("crDesc").textContent, $("crStatus"), "Description copied"); });
    var hand = typeof qtHandoffConsume === "function" ? qtHandoffConsume("/cron-explainer") : null;
    if (hand && hand.value) $("crIn").value = hand.value.trim();
    else if (location.hash.length > 1) { try { $("crIn").value = decodeURIComponent(location.hash.slice(1)).replace(/_/g, " "); } catch (e) {} }
    run();
    setInterval(run, 30000);
  });
})();

if (typeof module !== "undefined") module.exports = { qtCronParse: qtCronParse, qtCronNext: qtCronNext, qtCronDescribe: qtCronDescribe };
