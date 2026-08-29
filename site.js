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
