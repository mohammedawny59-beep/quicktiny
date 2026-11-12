# Builds the GTA 6 Zone 3D-map assets from one painted top-down texture (original AI art, our own Florida-shaped
# silhouette — not Rockstar's map). Outputs into assets/gta6/:
#   leonida-map.webp     colour texture (2048²)
#   leonida-height.png   512² heightmap: 0..127 = sea depth, 128..255 = land height (decoded in gta-map.js)
#   leonida-lights.webp  1024² night-lights emissive map (towns + city glow)
#   leonida-city.json    building footprints [u, v, size, height] sampled from the painted city blocks
# usage: python -I tools/gta_map_assets.py <repo> <painted.png>
import io, json, math, os, sys
import numpy as np
from PIL import Image, ImageFilter
repo, src = sys.argv[1], sys.argv[2]
out = os.path.join(repo, "assets", "gta6")
img = Image.open(src).convert("RGB")
img.resize((2048, 2048), Image.LANCZOS).save(os.path.join(out, "leonida-map.webp"), "WEBP", quality=80, method=6)

N = 512
a = np.asarray(img.resize((N, N), Image.LANCZOS)).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
water = (b > r + 22) & (b >= g * .82)
land = ~water
mask = Image.fromarray((land * 255).astype(np.uint8))
# tidy specks, then a smooth shore ramp and a far-reaching depth ramp
mask = mask.filter(ImageFilter.MedianFilter(5))
L = np.asarray(mask).astype(np.float32) / 255
near = np.asarray(mask.filter(ImageFilter.GaussianBlur(4))).astype(np.float32) / 255
far = np.asarray(mask.filter(ImageFilter.GaussianBlur(26))).astype(np.float32) / 255
yy, xx = np.mgrid[0:N, 0:N] / N
def gauss(u, v, s): return np.exp(-((xx - u) ** 2 + (yy - v) ** 2) / s)
rng = np.random.default_rng(7)
noise = np.asarray(Image.fromarray((rng.random((64, 64)) * 255).astype(np.uint8)).resize((N, N), Image.BICUBIC)).astype(np.float32) / 255
lum = (r * .3 + g * .59 + b * .11) / 255
forest = np.clip((g - r) / 60, 0, 1) * np.clip((g - b) / 40, 0, 1)          # dark-green woods sit a bit higher
shore = np.clip((near - .5) * 2, 0, 1)
h = shore * (.06 + .10 * noise + .10 * forest * (yy < .45) + .12 * np.clip(.4 - yy, 0, 1) * noise)
h += gauss(.50, .145, .0012) * (.9 + .25 * (1 - lum))                         # the painted mountain
swamp = gauss(.72, .79, .004); h = h * (1 - .8 * swamp)
land_h = np.clip(h, 0, 1)
depth = np.clip(1 - far, 0, 1)
enc = np.where(L > .5, 128 + land_h * 127, 127 - depth * 110 - (1 - near) * 10)
Image.fromarray(np.clip(enc, 0, 255).astype(np.uint8)).save(os.path.join(out, "leonida-height.png"), optimize=True)

# city / town pixels: low-saturation grey on land
M = 1024
c = np.asarray(img.resize((M, M), Image.LANCZOS)).astype(np.float32)
cr, cg, cb = c[..., 0], c[..., 1], c[..., 2]
mx, mn = c.max(-1), c.min(-1)
Lm = np.asarray(mask.resize((M, M))) > 127
urban = Lm & ((mx - mn) < 28) & (mx > 70) & (mx < 215)
urb = Image.fromarray((urban * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(3))
U = np.asarray(urb) > 127
dens = np.asarray(urb.filter(ImageFilter.GaussianBlur(10))).astype(np.float32) / 255
spark = (np.random.default_rng(3).random((M, M)) < .3) & U & ~(((np.mgrid[0:M, 0:M][1] / M - .5) ** 2 + (np.mgrid[0:M, 0:M][0] / M - .145) ** 2) < .004)
glow = np.asarray(urb.filter(ImageFilter.GaussianBlur(6))).astype(np.float32) / 255
lights = np.zeros((M, M, 3), np.float32)
warm = np.array([255, 196, 120], np.float32); pink = np.array([255, 90, 200], np.float32); cyan = np.array([80, 230, 255], np.float32)
pick = np.random.default_rng(5).random((M, M))
col = np.where(pick[..., None] < .75, warm, np.where(pick[..., None] < .88, pink, cyan))
lights += spark[..., None] * col
lights += glow[..., None] * np.array([150, 70, 140], np.float32) * .55
Image.fromarray(np.clip(lights, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.6)).save(os.path.join(out, "leonida-lights.webp"), "WEBP", quality=75, method=6)

# buildings: sample urban pixels, taller where the city is densest (the south-east metropolis)
rs = np.random.default_rng(11); ys, xs = np.nonzero(U); blds = []; taken = set()
order = rs.permutation(len(xs))
for k in order:
    if len(blds) >= 900: break
    x, y = int(xs[k]), int(ys[k]); cell = (x // 5, y // 5)
    if cell in taken: continue
    d = float(dens[y, x])
    u0, v0 = (x + .5) / M, (y + .5) / M
    if d < .22 or (u0 - .5) ** 2 + (v0 - .145) ** 2 < .004 or rs.random() > .25 + d: continue  # blocks only: no lone road pixels or mountain rock
    taken.add(cell)
    u, v = (x + .5) / M, (y + .5) / M
    core = math.exp(-((u - .855) ** 2 + (v - .70) ** 2) / .0015)
    hgt = .015 + d * .05 + core * (.08 + rs.random() * .32) * (1.6 if rs.random() > .93 else 1)
    blds.append([round(u, 4), round(v, 4), round(.0032 + rs.random() * .0022, 4), round(hgt, 3)])
io.open(os.path.join(out, "leonida-city.json"), "w", encoding="utf-8").write(json.dumps(blds, separators=(",", ":")))
print("land %.1f%%  urban px %d  buildings %d" % (L.mean() * 100, U.sum(), len(blds)))
