# Adds hreflang alternates + EN/AR switch to an English page that has an Arabic twin.
# usage: pair_en.py <repo> <en_slug> <ar_slug>
import io, re, sys, os
root, en, ar = sys.argv[1:4]; os.chdir(root)
B = "https://quicktinyv2.vercel.app"
p = en + ".html"; s = io.open(p, encoding="utf-8").read()
s = re.sub(r'\s*<link rel="alternate" hreflang="[^"]*"[^>]*>', "", s)
can = '<link rel="canonical" href="%s/%s">' % (B, en)
assert can in s, "canonical missing"
s = s.replace(can, can + '\n  <link rel="alternate" hreflang="en" href="%s/%s">\n  <link rel="alternate" hreflang="ar" href="%s/%s">\n  <link rel="alternate" hreflang="x-default" href="%s/%s">' % (B, en, B, ar, B, en), 1)
if 'class="lang-switch"' not in s:
    sw = '  <div class="lang-switch">\n    <a href="/%s" class="active">EN</a>\n    <a href="/%s" lang="ar">AR</a>\n  </div>\n' % (en, ar)
    s = re.sub(r'(<div class="breadcrumb">.*?</div>\n)', lambda m: m.group(1) + sw, s, count=1, flags=re.S)
io.open(p, "w", encoding="utf-8", newline="").write(s)
print("paired", en, "<->", ar)
