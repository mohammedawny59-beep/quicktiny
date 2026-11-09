// QuickTiny SERP & Social Preview — Google snippet (pixel-width checks), social cards,
// import from pasted HTML, and ready-to-paste meta tags. All local.

(function () {
  var $ = function (id) { return document.getElementById(id); };
  var img = null; // data URL of the uploaded share image
  var ctx = document.createElement("canvas").getContext("2d");
  function px(text, font) { ctx.font = font; return Math.round(ctx.measureText(text).width); }
  function esc(s) { return String(s || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function vals() {
    var url = $("mpUrl").value.trim();
    var host = "", path = "";
    try { var u = new URL(/^https?:/i.test(url) ? url : "https://" + (url || "example.com")); host = u.hostname.replace(/^www\./, ""); path = u.pathname.replace(/\/$/, "").split("/").filter(Boolean).join(" › "); } catch (e) { host = url; }
    return { url: url, host: host, path: path, title: $("mpTitle").value.trim(), desc: $("mpDesc").value.trim(), site: $("mpSite").value.trim() || host, handle: $("mpHandle").value.trim() };
  }

  function meter(id, value, okMax, warnMax, unit, label) {
    var el = $(id), cls = value === 0 ? "" : value <= okMax ? "ok" : value <= warnMax ? "warn" : "bad";
    el.className = "mp-meter " + cls;
    el.innerHTML = '<i style="width:' + Math.min(100, value / warnMax * 100) + '%"></i><span>' + label + ": " + value + " " + unit + (cls === "bad" ? " — will be cut off" : cls === "warn" ? " — close to the limit" : "") + "</span>";
  }

  function render() {
    var v = vals();
    var tPx = px(v.title, "20px Arial"), dLen = v.desc.length;
    meter("mpTitleMeter", tPx, 560, 600, "px", "Title width (Google desktop ≈ 600 px)");
    meter("mpDescMeter", dLen, 155, 160, "chars", "Description");
    $("mpTitleCount").textContent = v.title.length + " chars";

    var favicon = '<span class="g-fav">' + esc((v.site || "?").charAt(0).toUpperCase()) + "</span>";
    var gHead = '<div class="g-head">' + favicon + '<div><div class="g-site">' + esc(v.site) + '</div><div class="g-url">' + esc("https://" + v.host + (v.path ? " › " + v.path : "")) + "</div></div></div>";
    $("mpGoogle").innerHTML = gHead + '<div class="g-title">' + esc(v.title || "Your page title appears here") + '</div><div class="g-desc">' + esc(v.desc || "Write a description that makes people want to click. Google may use it as the snippet under your title.") + "</div>";
    $("mpGoogleM").innerHTML = gHead + '<div class="g-title m">' + esc(v.title || "Your page title appears here") + '</div><div class="g-desc m">' + esc(v.desc || "Write a description…") + "</div>";

    var image = img ? '<div class="s-img" style="background-image:url(' + img + ')"></div>' : '<div class="s-img empty">Add a 1200×630 image</div>';
    $("mpFacebook").innerHTML = image + '<div class="s-body fb"><div class="s-host">' + esc(v.host.toUpperCase()) + '</div><div class="s-title">' + esc(v.title || "Page title") + '</div><div class="s-desc">' + esc(v.desc) + "</div></div>";
    $("mpLinkedIn").innerHTML = image + '<div class="s-body li"><div class="s-title">' + esc(v.title || "Page title") + '</div><div class="s-host">' + esc(v.host) + "</div></div>";
    $("mpX").innerHTML = '<div class="x-wrap">' + image + '<span class="x-host">' + esc(v.host) + "</span></div>" + '<div class="x-title">' + esc(v.title || "Page title") + "</div>";
    $("mpWhatsApp").innerHTML = '<div class="wa-card">' + (img ? '<div class="wa-img" style="background-image:url(' + img + ')"></div>' : "") + '<div class="wa-body"><div class="wa-title">' + esc(v.title || "Page title") + '</div><div class="wa-desc">' + esc(v.desc) + '</div><div class="wa-host">' + esc(v.host) + "</div></div></div>" + '<div class="wa-link">' + esc(v.url || "https://" + v.host) + "</div>";

    var tags = [
      "<title>" + esc(v.title) + "</title>",
      '<meta name="description" content="' + esc(v.desc) + '">',
      v.url ? '<link rel="canonical" href="' + esc(v.url) + '">' : "",
      "",
      '<meta property="og:type" content="website">',
      '<meta property="og:title" content="' + esc(v.title) + '">',
      '<meta property="og:description" content="' + esc(v.desc) + '">',
      v.url ? '<meta property="og:url" content="' + esc(v.url) + '">' : "",
      '<meta property="og:site_name" content="' + esc(v.site) + '">',
      '<meta property="og:image" content="' + esc($("mpImgUrl").value.trim() || "https://" + v.host + "/og-image.png") + '">',
      '<meta property="og:image:width" content="1200">',
      '<meta property="og:image:height" content="630">',
      "",
      '<meta name="twitter:card" content="summary_large_image">',
      v.handle ? '<meta name="twitter:site" content="' + esc(v.handle.charAt(0) === "@" ? v.handle : "@" + v.handle) + '">' : ""
    ].filter(function (l, i, a) { return l !== "" || (a[i - 1] !== "" && i > 0); });
    $("mpCode").textContent = tags.join("\n").trim();

    var tips = [];
    if (!v.title) tips.push("Add a title.");
    if (v.title && v.title.length < 25) tips.push("The title is short — add the main keyword and a reason to click.");
    if (!v.desc) tips.push("Add a description, or Google will pick text from the page.");
    if (v.desc && v.desc.length < 70) tips.push("The description is short — 120–155 characters works best.");
    if (!img) tips.push("Add a share image (1200×630). Links with images get far more clicks on social media.");
    $("mpTips").innerHTML = tips.map(function (t) { return "<li>" + t + "</li>"; }).join("");
  }

  function importHtml() {
    var html = $("mpHtml").value, doc = new DOMParser().parseFromString(html, "text/html");
    function meta(sel) { var m = doc.querySelector(sel); return m ? (m.getAttribute("content") || m.getAttribute("href") || "") : ""; }
    var title = meta('meta[property="og:title"]') || (doc.querySelector("title") ? doc.querySelector("title").textContent : "");
    var found = 0;
    [["mpTitle", (doc.querySelector("title") || {}).textContent || title], ["mpDesc", meta('meta[name="description"]') || meta('meta[property="og:description"]')],
     ["mpUrl", meta('link[rel="canonical"]') || meta('meta[property="og:url"]')], ["mpSite", meta('meta[property="og:site_name"]')],
     ["mpImgUrl", meta('meta[property="og:image"]')], ["mpHandle", meta('meta[name="twitter:site"]')]].forEach(function (p) {
      if (p[1]) { $(p[0]).value = p[1].trim(); found++; }
    });
    $("mpImportStatus").textContent = found ? "Imported " + found + " tags ✓ (the share image itself can't be loaded from another site — upload it to preview)" : "No meta tags found in that HTML.";
    $("mpImportStatus").className = found ? "result success" : "result error";
    render();
  }

  document.addEventListener("DOMContentLoaded", function () {
    ["mpUrl", "mpTitle", "mpDesc", "mpSite", "mpHandle", "mpImgUrl"].forEach(function (id) { $(id).addEventListener("input", render); });
    $("mpImg").addEventListener("change", function () {
      var f = this.files[0]; if (!f) return;
      var r = new FileReader(); r.onload = function () { img = r.result; render(); }; r.readAsDataURL(f);
    });
    $("mpImport").addEventListener("click", importHtml);
    $("mpCopy").addEventListener("click", function () { qtCopy($("mpCode").textContent, $("mpCopyStatus"), "Copied"); qtTrack("meta_copy"); });
    render();
  });

  window.qtMeta = { px: px, render: render };
})();
