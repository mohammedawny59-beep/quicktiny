# Builds RSS 2.0 feeds of what's new on the site: /feed.xml (English) and /ar/feed.xml (Arabic).
# Items come from sitemap.xml (newest lastmod first) with title/description read from each page.
# City prayer-time pages are left out so the feed stays a list of tools and guides, not 70 near-identical items.
# usage: python tools/feeds.py <repo>
import io, os, re, sys, html
from datetime import datetime, timezone
root = sys.argv[1] if len(sys.argv) > 1 else "."; os.chdir(root)
B = "https://quicktinyv2.vercel.app"
MAX = 40
sm = io.open("sitemap.xml", encoding="utf-8").read()
entries = re.findall(r"<url>\s*<loc>([^<]+)</loc>\s*(?:<lastmod>([^<]+)</lastmod>)?", sm)
def page_file(url):
    p = url.replace(B, "").strip("/") or "index"
    return p + ".html"
def meta(s, name):
    m = re.search(r'<meta (?:name|property)="%s" content="([^"]*)"' % re.escape(name), s)
    return html.unescape(m.group(1)) if m else ""
def skip(url):
    path = url.replace(B, "")
    return bool(re.match(r"^/(ar/)?prayer-times/[^/]+$", path)) or path in ("", "/", "/ar") or "/embed" in path
items = {"en": [], "ar": []}
for url, lastmod in entries:
    if skip(url): continue
    f = page_file(url)
    if not os.path.exists(f): continue
    s = io.open(f, encoding="utf-8").read()
    if 'name="robots" content="noindex' in s: continue
    t = re.search(r"<title>(.*?)</title>", s, re.S)
    title = html.unescape(re.sub(r"\s*\|\s*QuickTiny\s*$", "", t.group(1).strip())) if t else url
    lang = "ar" if url.startswith(B + "/ar/") else "en"
    items[lang].append((lastmod or "2026-09-01", url, title, meta(s, "description")))
def rfc822(d): return datetime.strptime(d, "%Y-%m-%d").replace(hour=9, tzinfo=timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
def esc(x): return html.escape(x, quote=False)
CH = {"en": dict(path="feed.xml", title="QuickTiny — new tools and guides", link=B + "/", desc="New free browser tools and practical guides from QuickTiny. Everything runs in your browser — no upload, no sign-up."),
      "ar": dict(path="ar/feed.xml", title="QuickTiny بالعربي — أدوات وشروحات جديدة", link=B + "/ar", desc="أدوات مجانية جديدة وشروحات عملية من QuickTiny — كل شيء يعمل داخل متصفحك بدون رفع وبدون تسجيل.")}
for lang, c in CH.items():
    its = sorted(items[lang], key=lambda x: (x[0], x[1]), reverse=True)[:MAX]
    last = rfc822(its[0][0]) if its else rfc822("2026-09-01")
    body = "".join("""  <item>
    <title>%s</title>
    <link>%s</link>
    <guid isPermaLink="true">%s</guid>
    <pubDate>%s</pubDate>
    <description>%s</description>
  </item>
""" % (esc(t), u, u, rfc822(d), esc(ds)) for d, u, t, ds in its)
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>{esc(c['title'])}</title>
  <link>{c['link']}</link>
  <description>{esc(c['desc'])}</description>
  <language>{'ar' if lang == 'ar' else 'en'}</language>
  <lastBuildDate>{last}</lastBuildDate>
  <atom:link href="{B}/{c['path']}" rel="self" type="application/rss+xml"/>
{body}</channel>
</rss>
"""
    io.open(c["path"], "w", encoding="utf-8", newline="\n").write(xml)
    print(c["path"], len(its), "items")
# Advertise the feeds (<link rel="alternate">) on the home pages and guide pages.
def add_link(path, href, title):
    s = io.open(path, encoding="utf-8").read()
    if 'type="application/rss+xml"' in s: return
    s = s.replace("</head>", '  <link rel="alternate" type="application/rss+xml" title="%s" href="%s">\n</head>' % (title, href), 1)
    io.open(path, "w", encoding="utf-8", newline="").write(s)
for p in ["index.html", "guides.html"] + ["guides/" + f for f in os.listdir("guides")]: add_link(p, "/feed.xml", CH["en"]["title"])
for p in ["ar.html", "ar/guides.html"] + ["ar/guides/" + f for f in os.listdir("ar/guides")]: add_link(p, "/ar/feed.xml", CH["ar"]["title"])
