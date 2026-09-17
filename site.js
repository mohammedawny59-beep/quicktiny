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
