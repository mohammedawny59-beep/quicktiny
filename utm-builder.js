// QuickTiny UTM Builder — campaign links with consistent naming, a multi-channel matrix,
// naming checks, local history and a hand-off to the QR generator. All local.

(function () {
  var $ = function (id) { return document.getElementById(id); };
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  var CHANNELS = [
    { id: "facebook",  label: "Facebook",      source: "facebook",  medium: "social" },
    { id: "fbads",     label: "Facebook Ads",  source: "facebook",  medium: "paid_social" },
    { id: "instagram", label: "Instagram",     source: "instagram", medium: "social" },
    { id: "igstory",   label: "IG Story",      source: "instagram", medium: "story" },
    { id: "tiktok",    label: "TikTok",        source: "tiktok",    medium: "social" },
    { id: "x",         label: "X / Twitter",   source: "x",         medium: "social" },
    { id: "linkedin",  label: "LinkedIn",      source: "linkedin",  medium: "social" },
    { id: "youtube",   label: "YouTube",       source: "youtube",   medium: "video" },
    { id: "whatsapp",  label: "WhatsApp",      source: "whatsapp",  medium: "messaging" },
    { id: "email",     label: "Newsletter",    source: "newsletter", medium: "email" },
    { id: "google",    label: "Google Ads",    source: "google",    medium: "cpc" },
    { id: "qr",        label: "QR / print",    source: "flyer",     medium: "qr" },
    { id: "influencer", label: "Influencer",   source: "influencer", medium: "referral" }
  ];
  var KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id"];

  function clean(s) {
    s = String(s || "").trim();
    if ($("utmLower").checked) s = s.toLowerCase();
    if ($("utmSpaces").checked) s = s.replace(/\s+/g, "_");
    return s;
  }
  function baseUrl() {
    var u = $("utmUrl").value.trim();
    if (!u) return null;
    if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = "https://" + u;
    try { return new URL(u); } catch (e) { return null; }
  }
  function build(params) {
    var u = baseUrl(); if (!u) return "";
    KEYS.forEach(function (k) { u.searchParams.delete(k); });
    KEYS.forEach(function (k) { if (params[k]) u.searchParams.set(k, params[k]); });
    return u.toString(); // URL keeps #fragment after the query, where it belongs
  }
  function fields() { var p = {}; KEYS.forEach(function (k) { p[k] = clean($(k).value); }); return p; }

  function lint(p) {
    var w = [], raw = {};
    KEYS.forEach(function (k) { raw[k] = $(k).value; });
    if (!p.utm_source) w.push("utm_source is required — where the traffic comes from (instagram, newsletter…).");
    if (!p.utm_medium) w.push("utm_medium is required — the type of traffic (social, email, cpc, qr…).");
    if (!p.utm_campaign) w.push("utm_campaign is recommended — otherwise all your campaigns mix together.");
    KEYS.forEach(function (k) {
      if (/[A-Z]/.test(raw[k]) && !$("utmLower").checked) w.push(k + " has capital letters. Analytics treats \"Facebook\" and \"facebook\" as two different sources.");
      if (/\s/.test(raw[k].trim()) && !$("utmSpaces").checked) w.push(k + " contains spaces — they become %20 in the link. Use _ or -.");
    });
    var u = baseUrl();
    if ($("utmUrl").value.trim() && !u) w.push("That link doesn't look valid.");
    if (u && KEYS.some(function (k) { return u.searchParams.has(k); })) w.push("The link already had UTM tags; they've been replaced by yours.");
    if (u && u.protocol === "http:") w.push("The link uses http:// — use https:// if your site supports it.");
    // consistency with history: same source spelled differently
    var hist = history();
    ["utm_source", "utm_medium"].forEach(function (k) {
      if (!p[k]) return;
      var near = hist.map(function (h) { return h.params[k]; }).filter(function (x) { return x && x !== p[k] && x.replace(/[\s_-]/g, "").toLowerCase() === p[k].replace(/[\s_-]/g, "").toLowerCase(); });
      if (near.length) w.push(k + " \"" + p[k] + "\" is close to \"" + near[0] + "\" from your earlier links — keep one spelling so reports stay together.");
    });
    return w;
  }

  function history() { try { return JSON.parse(store("qt_utm_hist") || "[]"); } catch (e) { return []; } }
  function remember(link, p) {
    if (!link) return;
    var h = history().filter(function (x) { return x.link !== link; });
    h.unshift({ link: link, params: p, at: Date.now() });
    store("qt_utm_hist", JSON.stringify(h.slice(0, 30)));
    renderHistory();
  }
  function renderHistory() {
    var h = history(), box = $("utmHist");
    $("utmHistWrap").hidden = !h.length;
    box.innerHTML = "";
    h.forEach(function (x) {
      var row = document.createElement("div"); row.className = "utm-row";
      var a = document.createElement("code"); a.textContent = x.link;
      var b = document.createElement("button"); b.type = "button"; b.className = "btn btn-secondary utm-mini"; b.textContent = "Copy";
      b.addEventListener("click", function () { qtCopy(x.link, $("utmStatus"), "Copied"); });
      row.appendChild(a); row.appendChild(b); box.appendChild(row);
    });
  }

  function render() {
    var p = fields(), link = build(p);
    $("utmOut").textContent = link || "—";
    $("utmOut").classList.toggle("empty", !link);
    ["utmCopy", "utmQr", "utmOpen"].forEach(function (id) { $(id).disabled = !link; });
    $("utmWarn").innerHTML = lint(p).map(function (w) { return "<li>" + w + "</li>"; }).join("");
    // breakdown
    $("utmParts").innerHTML = link ? KEYS.filter(function (k) { return p[k]; }).map(function (k) { return "<span><b>" + k.replace("utm_", "") + "</b> " + p[k] + "</span>"; }).join("") : "";
    renderMatrix(p);
  }

  function selectedChannels() { return CHANNELS.filter(function (c) { var el = document.querySelector('[data-ch="' + c.id + '"]'); return el && el.classList.contains("active"); }); }
  function renderMatrix(p) {
    var sel = selectedChannels(), box = $("utmMatrix");
    $("utmMatrixWrap").hidden = !sel.length;
    if (!sel.length) return;
    var rows = sel.map(function (c) {
      var q = Object.assign({}, p, { utm_source: clean(c.source), utm_medium: clean(c.medium) });
      return { ch: c.label, link: build(q) };
    });
    box.innerHTML = "";
    rows.forEach(function (r) {
      var row = document.createElement("div"); row.className = "utm-row";
      row.innerHTML = '<span class="utm-ch">' + r.ch + "</span>";
      var code = document.createElement("code"); code.textContent = r.link || "—"; row.appendChild(code);
      var b = document.createElement("button"); b.type = "button"; b.className = "btn btn-secondary utm-mini"; b.textContent = "Copy"; b.disabled = !r.link;
      b.addEventListener("click", function () { qtCopy(r.link, $("utmStatus"), "Copied"); remember(r.link, p); });
      row.appendChild(b); box.appendChild(row);
    });
    $("utmMatrixCsv").onclick = function () {
      var csv = "channel,link\r\n" + rows.map(function (r) { return '"' + r.ch + '","' + r.link.replace(/"/g, '""') + '"'; }).join("\r\n") + "\r\n";
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv" })); a.download = (p.utm_campaign || "campaign") + "-links.csv"; a.click();
    };
    $("utmMatrixCopy").onclick = function () { qtCopy(rows.map(function (r) { return r.ch + ": " + r.link; }).join("\n"), $("utmStatus"), "All links copied"); };
  }

  document.addEventListener("DOMContentLoaded", function () {
    var chips = $("utmChannels");
    CHANNELS.forEach(function (c) {
      var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = c.label; b.setAttribute("data-ch", c.id);
      b.addEventListener("click", function () { b.classList.toggle("active"); render(); });
      chips.appendChild(b);
    });
    var presets = $("utmPresets");
    CHANNELS.forEach(function (c) {
      var b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = c.label;
      b.addEventListener("click", function () { $("utm_source").value = c.source; $("utm_medium").value = c.medium; render(); });
      presets.appendChild(b);
    });
    ["utmUrl", "utmLower", "utmSpaces"].concat(KEYS).forEach(function (id) { $(id).addEventListener("input", render); $(id).addEventListener("change", render); });
    $("utmCopy").addEventListener("click", function () { var l = $("utmOut").textContent; qtCopy(l, $("utmStatus"), "Copied"); remember(l, fields()); qtTrack("utm_copy"); });
    $("utmOpen").addEventListener("click", function () { window.open($("utmOut").textContent, "_blank", "noopener"); });
    $("utmQr").addEventListener("click", function () { var l = $("utmOut").textContent; remember(l, fields()); qtHandoffSet({ tool: "/qr-code-generator", action: "url", value: l }); location.href = "/qr-code-generator"; });
    $("utmClearHist").addEventListener("click", function () { store("qt_utm_hist", "[]"); renderHistory(); render(); });
    renderHistory(); render();
  });
})();
