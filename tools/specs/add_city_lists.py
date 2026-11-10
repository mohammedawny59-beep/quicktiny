# Adds the "prayer times by city" link list to /prayer-times and /ar/prayer-times (run after rebuilding those pages).
import io, re, json, os, sys
os.chdir(sys.argv[1] if len(sys.argv) > 1 else ".")
src = io.open("prayer-cities.js", encoding="utf-8").read()
cities = [{k: v.strip('"') for k, v in re.findall(r'(\w+): ("[^"]*"|-?[\d.]+)', m)} for m in re.findall(r"\{([^{}]+)\}", src.split("[", 1)[1])]
en_slugs = {p["slug"].split("/")[1] for p in json.load(io.open("tools/specs/landing_prayer_en.json", encoding="utf-8")) if p["slug"].startswith("prayer-times/")}
for path, ar in (("ar/prayer-times.html", True), ("prayer-times.html", False)):
    s = io.open(path, encoding="utf-8").read()
    if 'aria-label="المدن"' in s or 'aria-label="Cities"' in s: continue
    items = [c for c in cities if ar or c["slug"] in en_slugs]
    links = "".join('<a class="chip" href="/%sprayer-times/%s">%s</a>' % ("ar/" if ar else "", c["slug"], c["ar"] if ar else c["en"]) for c in items)
    block = '  <div class="section"><h2 class="related-title">%s</h2><nav class="task-links" aria-label="%s" style="margin-top:12px">%s</nav></div>\n\n' % ("مواقيت الصلاة في المدن" if ar else "Prayer times by city", "المدن" if ar else "Cities", links)
    s = s.replace('  <div class="section related-section">', block + '  <div class="section related-section">', 1)
    io.open(path, "w", encoding="utf-8", newline="").write(s)
print("city lists added")
