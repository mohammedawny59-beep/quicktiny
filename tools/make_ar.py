# Builds Arabic (RTL) pages from compress-image.html's <head> skeleton.
# usage: make_ar.py <repo> <spec.json>
import io, re, sys, os, json
root, spec_path = sys.argv[1], sys.argv[2]
os.chdir(root)
spec = json.load(io.open(spec_path, encoding="utf-8"))
here = os.path.dirname(os.path.abspath(spec_path))
src = io.open("compress-image.html", encoding="utf-8").read()
head = src[:src.index("</head>")]
BASE = "https://quicktinyv2.vercel.app"

footer = io.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates", "footer_ar.html"), encoding="utf-8").read()

for page in spec["pages"]:
    slug = page["slug"]            # e.g. "ar/word-counter"
    url = BASE + "/" + slug
    h = head.replace('<html lang="en">', '<html lang="ar" dir="rtl">')
    h = re.sub(r"<title>.*?</title>", lambda m: "<title>" + page["title"] + "</title>", h)
    for pat in [r'(<meta name="description" content=")[^"]*', r'(<meta property="og:description" content=")[^"]*']:
        h = re.sub(pat, lambda m: m.group(1) + page["desc"], h)
    h = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + page["title"], h)
    h = h.replace(BASE + "/compress-image", url)
    h = re.sub(r'\s*<link rel="alternate" hreflang="[^"]*"[^>]*>', "", h)
    alts = "".join('\n  <link rel="alternate" hreflang="%s" href="%s/%s">' % (lang, BASE, path) for lang, path in page["alternates"])
    h = h.replace('<link rel="canonical" href="%s">' % url, '<link rel="canonical" href="%s">' % url + alts)
    h = h.replace('<meta property="og:type"', '<meta property="og:locale" content="ar_AR">\n  <meta property="og:type"')
    if page.get("style"):
        h = h.replace('<link rel="stylesheet" href="/styles.css">', '<link rel="stylesheet" href="/styles.css">\n' + io.open(os.path.join(here, page["style"]), encoding="utf-8").read().rstrip())
    body = io.open(os.path.join(here, page["body"]), encoding="utf-8").read()
    nav = '''<body>
<div class="aurora" aria-hidden="true"></div>
<div class="grain" aria-hidden="true"></div>

<header class="site-header">
  <div class="wrap nav">
    <a class="logo" href="/ar">QuickTiny<span class="dot">.</span></a>
    <div class="nav-right">
      <nav class="nav-links" id="navLinks">
        <a href="/ar#tools">الأدوات</a>
        <a href="/batch-image-compressor">Pro</a>
        <a href="/privacy">الخصوصية</a>
      </nav>
      <button class="menu-toggle" id="menuToggle" aria-label="فتح القائمة" aria-expanded="false" aria-controls="navLinks">☰</button>
    </div>
  </div>
</header>
'''
    langs = "".join('\n    <a href="/%s"%s>%s</a>' % (path, ' class="active"' if path == slug else "", label) for label, path in page["switch"])
    switch = '  <div class="lang-switch">' + langs + "\n  </div>\n"
    body = body.replace("<!--LANG-SWITCH-->", switch)
    plain = lambda s: s.replace("&amp;", "&")
    ld = ('<script type="application/ld+json">%s</script>\n' % json.dumps({
            "@context": "https://schema.org", "@type": "WebApplication", "name": page["app_name"], "url": url,
            "description": plain(page["desc"]), "applicationCategory": page["category"], "operatingSystem": "Any",
            "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}, "isAccessibleForFree": True, "inLanguage": "ar"}, ensure_ascii=False)
          + '<script type="application/ld+json">%s</script>\n' % json.dumps({
            "@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "الرئيسية", "item": BASE + "/"},
              {"@type": "ListItem", "position": 2, "name": page["crumb"], "item": url}]}, ensure_ascii=False))
    if page.get("faq"):
        ld += '<script type="application/ld+json">%s</script>\n' % json.dumps({
            "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
              {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in page["faq"]]}, ensure_ascii=False)
    out = h + "</head>\n" + nav + body + footer + ld + "</body>\n</html>\n"
    if os.path.dirname(slug): os.makedirs(os.path.dirname(slug), exist_ok=True)
    io.open(slug + ".html", "w", encoding="utf-8", newline="").write(out)
    print("written", slug + ".html")
