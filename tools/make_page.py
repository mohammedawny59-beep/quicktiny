# Builds a tool page from compress-image.html's header/footer.
# usage: make_page.py <repo> <slug> <title> <description> <app_name> <crumb> <style.html> <body.html> <app_category>
import io, re, sys, os
root, slug, title, desc, app_name, crumb, style_path, body_path, category = sys.argv[1:10]
os.chdir(root)
src = io.open("compress-image.html", encoding="utf-8").read()
head_end = src.index('<div class="wrap" id="main" role="main" tabindex="-1">\n  <div class="breadcrumb">')
footer_start = src.index("<footer>")
footer_end = src.index('<script type="application/ld+json">')
header = src[:head_end]
footer = src[footer_start:footer_end]
# compress-image.html loads its own tool script; new pages must not inherit it.
footer = footer.replace('<script src="/compress-image.js" defer></script>' + chr(10), "")
url = "https://quicktinyv2.vercel.app/" + slug
header = re.sub(r"<title>.*?</title>", lambda m: "<title>" + title + "</title>", header)
for pat in [r'(<meta name="description" content=")[^"]*', r'(<meta property="og:description" content=")[^"]*']:
    header = re.sub(pat, lambda m: m.group(1) + desc, header)
header = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + title, header)
header = header.replace("https://quicktinyv2.vercel.app/compress-image", url)
header = re.sub(r'\s*<link rel="alternate" hreflang="(hi|en|ar|x-default)"[^>]*>', "", header)
style = io.open(style_path, encoding="utf-8").read() if style_path != "-" else ""
body = io.open(body_path, encoding="utf-8").read()
body = body.replace('<div class="wrap">', '<div class="wrap" id="main" role="main" tabindex="-1">', 1)
if style:
    header = header.replace('<link rel="stylesheet" href="/styles.css">', '<link rel="stylesheet" href="/styles.css">\n' + style.rstrip())
plain = lambda s: s.replace("&amp;", "&")
ld = ('<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"%s","url":"%s","description":"%s","applicationCategory":"%s","operatingSystem":"Any","offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},"isAccessibleForFree":true}</script>\n'
      '<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://quicktinyv2.vercel.app/"},{"@type":"ListItem","position":2,"name":"%s","item":"%s"}]}</script>\n'
      "</body>\n</html>\n") % (app_name, url, plain(desc), category, crumb, url)
io.open(slug + ".html", "w", encoding="utf-8", newline="").write(header + body + footer + ld)
print("written", slug + ".html")
