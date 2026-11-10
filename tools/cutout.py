# Turns a glass icon rendered on a dark background into a tight, square, transparent WebP.
# usage: cutout.py <in.png> <out.webp> [size]
import sys
from PIL import Image, ImageFilter
import numpy as np

src, dst = sys.argv[1], sys.argv[2]
size = int(sys.argv[3]) if len(sys.argv) > 3 else 192
im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.float32)

# Background estimate per row (the backdrop is a vertical gradient with a lit "floor"):
# median of the left/right edge strips of each row, smoothed vertically.
edges = np.concatenate([a[:, :40], a[:, -40:]], axis=1)
row_bg = np.median(edges, axis=1)
k = 15
pad = np.pad(row_bg, ((k, k), (0, 0)), mode="edge")
row_bg = np.stack([pad[i:i + 2 * k + 1].mean(axis=0) for i in range(a.shape[0])])
bg = row_bg[:, None, :]

# Distance from background in brightness + colour; glass is brighter/more saturated than the backdrop.
diff = np.sqrt(((a - bg) ** 2).sum(axis=2))
lo, hi = 22.0, 75.0
alpha = np.clip((diff - lo) / (hi - lo), 0, 1)
alpha = alpha * alpha * (3 - 2 * alpha)  # smoothstep

# Fade out the floor reflection: anything in the bottom 18% gets progressively weaker.
h = a.shape[0]
ramp = np.ones(h, dtype=np.float32)
start = int(h * 0.72)
ramp[start:] = np.linspace(1, 0, h - start)
alpha *= ramp[:, None]

# Un-premultiply against the background so edges don't keep a grey fringe.
safe = np.maximum(alpha, 1e-3)[..., None]
rgb = np.clip((a - bg * (1 - alpha[..., None])) / safe, 0, 255)
# Drop near-invisible haze so the crop hugs the object.
alpha = np.where(alpha < 0.08, 0, alpha)

out = Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA")
out = out.filter(ImageFilter.SMOOTH_MORE) if False else out

# Tight crop around visible pixels, then pad to a square with a small margin.
ys, xs = np.where(alpha > 0.06)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
out = out.crop((x0, y0, x1 + 1, y1 + 1))
side = int(max(out.size) * 1.08)
sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
sq.paste(out, ((side - out.size[0]) // 2, (side - out.size[1]) // 2))
sq = sq.resize((size, size), Image.LANCZOS)
sq.save(dst, "WEBP", quality=88, method=6)
print(dst, sq.size)
