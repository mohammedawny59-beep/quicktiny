# Wires new tools into the site: homepage cards (EN/AR), footer links, popular-task chips, sitemap, tool counts.
# usage: wire.py <repo> <spec.json>
# spec: {"en_cards":[{slug,icon,cat,name,desc,search}], "ar_cards":[{slug,icon,cat,name,desc,search}],
#        "footer":[[slug,name]], "popular_en":[[slug,label]], "popular_ar":[[slug,label]], "sitemap":[slug], "count_add": n}
import io, os, re, sys, glob, json
root, spec_path = sys.argv[1], sys.argv[2]; os.chdir(root)
spec = json.load(io.open(spec_path, encoding="utf-8"))
def rd(p): return io.open(p, encoding="utf-8").read()
def wr(p, s): io.open(p, "w", encoding="utf-8", newline="").write(s)
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
def card(c, open_label, ar=False):
    cat = ' data-cat="%s"' % c["cat"] if not ar else ""
    return ('      <a class="tool-card" href="/%s"%s data-search="%s">\n        <div class="tc-head">\n          <span class="tc-icon tc-3d"><img src="/assets/icons/%s.webp" alt="" width="58" height="58" loading="lazy" decoding="async"></span>\n'
            '          <span class="cat-badge">%s</span>\n        </div>\n        <h3>%s</h3>\n        <p>%s</p>\n        <span class="go">%s %s</span>\n      </a>\n') % (c["slug"], cat, c["search"], c["icon"], c["badge"], c["name"], c["desc"], open_label, GO)
log = []
s = rd("index.html")
for c in spec.get("en_cards", []):
    if 'href="/%s" data-cat' % c["slug"] in s: continue
    anchor = '      <a class="tool-card" href="/compress-image"'
    s = s.replace(anchor, card(c, "Open tool") + anchor, 1); log.append("card " + c["slug"])
if spec.get("en_chip") and 'data-cat="%s"' % spec["en_chip"] not in s.split('id="catChips"')[1][:2000]:
    s = s.replace('      <button class="chip" data-cat="Developer">Developer</button>', '      <button class="chip" data-cat="Developer">Developer</button>\n      <button class="chip" data-cat="%s">%s</button>' % (spec["en_chip"], spec["en_chip"]), 1)
for sl, label in spec.get("popular_en", []):
    if 'class="chip" href="/%s"' % sl not in s:
        s = re.sub(r'(<nav class="task-links" aria-label="Popular tasks">.*?)(\n    </nav>)', lambda m: m.group(1) + '\n      <a class="chip" href="/%s">%s</a>' % (sl, label) + m.group(2), s, count=1, flags=re.S)
n = spec.get("count_add", 0)
if n:
    s = re.sub(r"(\d+) tools &middot; (\d+) free", lambda m: "%d tools &middot; %d free" % (int(m.group(1)) + n, int(m.group(2)) + n), s)
    s = re.sub(r"(\d+) browser tools &mdash; (\d+) free", lambda m: "%d browser tools &mdash; %d free" % (int(m.group(1)) + n, int(m.group(2)) + n), s)
    a = rd("about-quicktiny.html")
    a = re.sub(r"collection of (\d+) browser utilities", lambda m: "collection of %d browser utilities" % (int(m.group(1)) + n), a)
    a = re.sub(r"QuickTiny has (\d+) free tools", lambda m: "QuickTiny has %d free tools" % (int(m.group(1)) + n), a)
    wr("about-quicktiny.html", a)
wr("index.html", s)

a = rd("ar.html")
for c in spec.get("ar_cards", []):
    if 'href="/%s" data-search' % c["slug"] in a: continue
    a = a.replace('    <div class="tools-grid" id="arGrid">\n', '    <div class="tools-grid" id="arGrid">\n' + card(c, "افتح الأداة", True), 1); log.append("ar card " + c["slug"])
for sl, label in spec.get("popular_ar", []):
    if 'class="chip" href="/%s"' % sl not in a:
        a = re.sub(r'(<nav class="task-links" aria-label="مهام شائعة">.*?)(\n    </nav>)', lambda m: m.group(1) + '\n      <a class="chip" href="/%s">%s</a>' % (sl, label) + m.group(2), a, count=1, flags=re.S)
wr("ar.html", a)

# footer links (EN footer "More Tools" column) — appended after the last developer-pack link
fl = spec.get("footer", [])
if fl:
    cnt = 0
    for p in glob.glob("**/*.html", recursive=True):
        t = rd(p); anchor = '        <a href="/cron-explainer">Cron Explainer</a>'
        if anchor not in t: continue
        add = "".join('\n        <a href="/%s">%s</a>' % (sl, nm) for sl, nm in fl if 'href="/%s">%s</a>' % (sl, nm) not in t)
        if add: wr(p, t.replace(anchor, anchor + add, 1)); cnt += 1
    log.append("footers %d" % cnt)

m = rd("sitemap.xml"); add = ""
for sl in spec.get("sitemap", []):
    u = "https://quicktinyv2.vercel.app/" + sl
    if "<loc>%s</loc>" % u not in m:
        add += "  <url>\n    <loc>%s</loc>\n    <lastmod>2026-11-10</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n" % u
wr("sitemap.xml", m.replace("</urlset>", add + "</urlset>"))
log.append("sitemap +%d" % add.count("<url>"))
print("; ".join(log))
