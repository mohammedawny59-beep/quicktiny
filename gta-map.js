// GTA 6 Zone — illustrative 3D map of Leonida (NOT the official map; Rockstar releases that on launch day).
// Leonida is Rockstar's take on Florida, so the land is shaped after Florida's real, public-domain geography:
// panhandle, peninsula, a big inland lake, swamps in the south, a chain of keys with a long bridge.
// Everything is generated here (three.js 0.179.1 from jsDelivr): terrain with beaches / farmland / swamp pools /
// forests, turquoise shallows, a dense city with lit windows, highways with moving traffic, sunset + night modes.
// three.js is only downloaded when the map is about to scroll into view, and it renders only while visible.
var QT_MAP_OUTLINE = [[.02, .10], [.20, .09], [.40, .10], [.56, .09], [.60, .08], [.63, .12], [.66, .20], [.69, .29], [.72, .38], [.76, .47], [.80, .56], [.83, .64], [.86, .72], [.875, .79], [.87, .85], [.85, .89], [.81, .905], [.76, .895], [.72, .875], [.69, .85], [.665, .81], [.645, .77], [.62, .72], [.60, .67], [.585, .62], [.575, .57], [.56, .53], [.545, .48], [.53, .43], [.51, .38], [.48, .33], [.44, .28], [.39, .245], [.33, .23], [.27, .225], [.21, .215], [.15, .205], [.09, .20], [.04, .19], [.02, .15]];
var QT_MAP_KEYS = [[.80, .925, .012], [.77, .94, .011], [.74, .952, .012], [.71, .962, .010], [.68, .97, .012], [.65, .976, .011], [.62, .981, .013], [.595, .985, .014]];
var QT_MAP_LAKE = [.71, .62, .04, .033]; // centre u,v + radii — the big lake beside Ambrosia
var QT_MAP_ROADS = [
  { id: "east", w: .028, pts: [[.60, .10], [.645, .2], [.69, .33], [.74, .45], [.79, .57], [.83, .68], [.85, .78], [.835, .86], [.81, .895]] },
  { id: "keys", w: .022, bridge: true, pts: [[.81, .895], [.80, .925], [.77, .94], [.74, .952], [.71, .962], [.68, .97], [.65, .976], [.62, .981], [.595, .985]] },
  { id: "panhandle", w: .026, pts: [[.04, .15], [.16, .16], [.30, .165], [.45, .155], [.56, .15], [.60, .10]] },
  { id: "central", w: .022, pts: [[.56, .15], [.57, .27], [.61, .40], [.66, .50], [.69, .56], [.74, .66], [.78, .72], [.85, .78]] },
  { id: "alley", w: .02, pts: [[.63, .735], [.70, .745], [.77, .75], [.845, .765]] },
  { id: "gulf", w: .02, pts: [[.50, .30], [.53, .40], [.565, .52], [.595, .63], [.625, .72], [.63, .735]] }
];
var QT_MAP_TOWNS = [ // [u, v, radius, count, maxHeight]
  [.848, .79, .05, 520, .9], [.16, .19, .03, 110, .22], [.72, .56, .022, 60, .14], [.66, .27, .02, 50, .16], [.555, .47, .02, 60, .2], [.78, .58, .018, 40, .14], [.5, .2, .014, 30, .1], [.30, .2, .014, 30, .1], [.68, .97, .01, 18, .06]
];
function qtMapSegDist(px, py, a, b) {
  var dx = b[0] - a[0], dy = b[1] - a[1], t = ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy || 1);
  t = Math.max(0, Math.min(1, t)); var x = a[0] + t * dx - px, y = a[1] + t * dy - py; return Math.sqrt(x * x + y * y);
}
function qtMapInPoly(u, v) {
  var c = false, P = QT_MAP_OUTLINE; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var a = P[i], b = P[j]; if ((a[1] > v) !== (b[1] > v) && u < (b[0] - a[0]) * (v - a[1]) / (b[1] - a[1]) + a[0]) c = !c; }
  return c;
}
// signed distance to the coast in map units: > 0 on land, < 0 at sea
function qtMapDist(u, v) {
  var P = QT_MAP_OUTLINE, d = 9; for (var i = 0, j = P.length - 1; i < P.length; j = i++) d = Math.min(d, qtMapSegDist(u, v, P[j], P[i]));
  var best = qtMapInPoly(u, v) ? d : -d;
  for (var k = 0; k < QT_MAP_KEYS.length; k++) { var K = QT_MAP_KEYS[k], kd = K[2] - Math.hypot(u - K[0], v - K[1]); if (kd > best) best = kd; }
  return best;
}
function qtMapInside(u, v) { return qtMapDist(u, v) > 0; }
function qtMapNoise(x, y) { // cheap smooth value noise
  var s = function (a, b) { var n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); };
  var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
  var a = s(xi, yi), b = s(xi + 1, yi), c = s(xi, yi + 1), d = s(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
}
function qtMapFbm(x, y) { var h = 0, amp = .5, f = 1; for (var o = 0; o < 4; o++) { h += qtMapNoise(x * f, y * f) * amp; amp *= .5; f *= 2.03; } return h; }
function qtMapLake(u, v) { var L = QT_MAP_LAKE, x = (u - L[0]) / L[2], y = (v - L[1]) / L[3]; return (x * x + y * y) * (.8 + qtMapNoise(u * 60, v * 60) * .4); }
function qtMapSwamp(u, v) { return Math.exp(-((u - .72) * (u - .72) / .006 + (v - .80) * (v - .80) / .003)); }
function qtMapHeight(u, v) {
  var d = qtMapDist(u, v);
  if (d <= 0) return -.012 - Math.min(-d, .2) * 2.2;                       // sea floor: shallow near the coast
  var shore = Math.min(1, d / .03), h = .01 + (.02 + qtMapFbm(u * 9, v * 9) * .1) * shore;
  h += Math.max(0, .3 - v) * qtMapFbm(u * 14 + 3, v * 14) * .5 * shore;    // rolling hills up north
  h += Math.exp(-((u - .50) * (u - .50) + (v - .17) * (v - .17)) / .0035) * (.85 + qtMapNoise(u * 40, v * 40) * .2); // Mount Kalaga
  var sw = qtMapSwamp(u, v); h = h * (1 - sw * .85) + sw * .012;
  if (sw > .25 && qtMapNoise(u * 70, v * 70) > .64) h = -.015;             // Grassrivers pools
  var lk = qtMapLake(u, v); if (lk < 1.6) h = Math.min(h, -.12 * (1.6 - lk) / 1.6 + (lk > 1 ? .01 : -.02));
  return h;
}

(function () {
  if (typeof document === "undefined") return;
  var box = document.getElementById("gsMap"); if (!box) return;
  var started = false;
  if (typeof IntersectionObserver === "undefined") return start();
  var pre = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { pre.disconnect(); start(); } }, { rootMargin: "120% 0px" });
  pre.observe(box);
  function start() { if (started) return; started = true; build().catch(function () { box.classList.add("nogl"); }); }
})();

async function build() {
  var box = document.getElementById("gsMap");
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var places = []; try { places = JSON.parse(document.getElementById("gsPlacesData").textContent); } catch (e) {}
  var fallback = function () { box.classList.add("nogl"); };
  var test = document.createElement("canvas"); if (!(test.getContext("webgl2") || test.getContext("webgl"))) return fallback();
  var THREE; try { THREE = await import("https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.min.js"); } catch (e) { return fallback(); }
  var reduce = !!window.qtGsStill, small = innerWidth < 760;
  var W = box.clientWidth, H = box.clientHeight, S = 14, Y = 1.25;
  var X = function (u) { return (u - .5) * S; }, Z = function (v) { return (v - .5) * S; };
  var groundY = function (u, v) { var h = qtMapHeight(u, v); return h > 0 ? h * Y : h; };
  var R = function (s) { var x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };

  var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(small ? 1.5 : 1.25, window.devicePixelRatio || 1)); renderer.setSize(W, H);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  if (!small) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
  box.insertBefore(renderer.domElement, box.firstChild); renderer.domElement.setAttribute("aria-hidden", "true");
  var scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, W / H, .05, 120);

  // ---------- sky + lights (two moods) ----------
  function skyTex(stops) { var c = document.createElement("canvas"); c.width = 2; c.height = 256; var g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256); stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); g.fillStyle = gr; g.fillRect(0, 0, 2, 256); var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  var SKY = { sunset: skyTex([[0, "#140736"], [.42, "#4a1470"], [.7, "#d12c6e"], [.86, "#ff8a3d"], [1, "#ffd27a"]]), night: skyTex([[0, "#02010a"], [.6, "#0d0830"], [1, "#2a0f4a"]]) };
  var hemi = new THREE.HemisphereLight(0xffd6f0, 0x203048, 1.15); scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xffb27a, 2.6); sun.position.set(-7, 7, 5); scene.add(sun);
  if (!small) { sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 30; sun.shadow.bias = -.0006; sun.shadow.normalBias = .02; }
  scene.fog = new THREE.Fog(0x7a2a6e, 14, 34);

  // ---------- terrain ----------
  var N = small ? 180 : 260, geo = new THREE.PlaneGeometry(S, S, N, N); geo.rotateX(-Math.PI / 2);
  var pos = geo.attributes.position, colors = new Float32Array(pos.count * 3), c = new THREE.Color(), c2 = new THREE.Color();
  var C = { deep: new THREE.Color(0x0b2a5c), shallow: new THREE.Color(0x46e6d2), sand: new THREE.Color(0xeedaa6), grass: new THREE.Color(0x5aa452), grass2: new THREE.Color(0x3f8a45), forest: new THREE.Color(0x2b6136), swamp: new THREE.Color(0x56683a), pool: new THREE.Color(0x2c6f6a), farmA: new THREE.Color(0xa9be4e), farmB: new THREE.Color(0xd2b85c), rock: new THREE.Color(0x8d8a80), snow: new THREE.Color(0xd8d2c8), urban: new THREE.Color(0x77707e) };
  for (var i = 0; i < pos.count; i++) {
    var u = pos.getX(i) / S + .5, v = pos.getZ(i) / S + .5, h = qtMapHeight(u, v), d = qtMapDist(u, v), n = qtMapNoise(u * 55, v * 55);
    pos.setY(i, h > 0 ? h * Y : h);
    if (d <= 0) c.copy(C.deep).lerp(C.shallow, Math.max(0, 1 + h * 2.4));
    else if (h <= 0) c.copy(C.pool);
    else {
      c.copy(C.grass).lerp(C.grass2, n);
      var sw = qtMapSwamp(u, v); if (sw > .05) c.lerp(C.swamp, Math.min(1, sw * 1.6));
      var lk = qtMapLake(u, v), farm = Math.exp(-((u - .7) * (u - .7) + (v - .6) * (v - .6)) / .004);
      if (farm * (.6 + qtMapNoise(u * 25, v * 25) * .8) > .3 && lk > 1.4) c.copy(Math.sin(u * 420 + Math.floor(v * 60) * 1.7) > 0 ? C.farmA : C.farmB).lerp(C.grass, .2);
      if (v < .33 && sw < .1) c.lerp(C.forest, Math.min(1, (.33 - v) * 6) * (.6 + n * .4));
      if (h > .45) c.copy(C.forest).lerp(C.rock, Math.min(1, (h - .45) * 2.6)); if (h > .82) c.lerp(C.snow, .5);
      var town = 0; for (var t = 0; t < QT_MAP_TOWNS.length; t++) { var T0 = QT_MAP_TOWNS[t]; town = Math.max(town, Math.exp(-((u - T0[0]) * (u - T0[0]) + (v - T0[1]) * (v - T0[1])) / (T0[2] * T0[2]))); }
      if (town > .25) c.lerp(C.urban, Math.min(.85, town));
      if (d < .006) c.lerp(C.sand, 1 - d / .006);
    }
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3)); geo.computeVertexNormals();
  var land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 })); land.receiveShadow = true; scene.add(land);
  // water: translucent so the turquoise shallows show through, with gentle swell
  var wgeo = new THREE.PlaneGeometry(60, 60, 48, 48); wgeo.rotateX(-Math.PI / 2);
  var waterMat = new THREE.MeshStandardMaterial({ color: 0x1aa6c4, transparent: true, opacity: .55, roughness: .12, metalness: .35, emissive: 0x062a44 });
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshBasicMaterial({ color: 0x0a2550 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.47; scene.add(floor);
  var water = new THREE.Mesh(wgeo, waterMat); water.position.y = 0; scene.add(water); var wbase = Float32Array.from(wgeo.attributes.position.array);

  // ---------- buildings with lit windows ----------
  var wc = document.createElement("canvas"); wc.width = 32; wc.height = 64; var wg = wc.getContext("2d"); wg.fillStyle = "#1b1426"; wg.fillRect(0, 0, 32, 64);
  for (var wy = 2; wy < 64; wy += 5) for (var wx = 2; wx < 32; wx += 5) { var r0 = R(wx * 7 + wy * 13); wg.fillStyle = r0 > .55 ? (r0 > .9 ? "#3cf0ff" : r0 > .82 ? "#ff6bd6" : "#ffd98a") : "#2a2238"; wg.fillRect(wx, wy, 3, 3); }
  var winTex = new THREE.CanvasTexture(wc); winTex.colorSpace = THREE.SRGBColorSpace; winTex.magFilter = THREE.NearestFilter;
  var bMat = new THREE.MeshStandardMaterial({ map: winTex, emissiveMap: winTex, emissive: 0xffffff, emissiveIntensity: .25, roughness: .6, metalness: .15 });
  var total = QT_MAP_TOWNS.reduce(function (a, t) { return a + t[3]; }, 0), blds = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bMat, total);
  blds.castShadow = !small; blds.receiveShadow = !small;
  var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc3 = new THREE.Vector3(), p3 = new THREE.Vector3(), bi = 0, seed = 1;
  var used = {};
  var tint = [0xffffff, 0xd7e8ff, 0xffe1f0, 0xfff1d6, 0xc9fff6];
  QT_MAP_TOWNS.forEach(function (T0, ti) {
    for (var k = 0; k < T0[3]; k++) {
      var blk = .0075, gx = Math.round((R(seed++) - .5) * 2 * T0[2] / blk), gz = Math.round((R(seed++) - .5) * 2 * T0[2] / blk), bu = T0[0] + gx * blk + (R(seed++) - .5) * .002, bv = T0[1] + gz * blk + (R(seed++) - .5) * .002, rr = Math.hypot(gx * blk, gz * blk); if (rr > T0[2]) { k--; seed++; if (seed > 1e5) break; continue; } var key = ti + ":" + gx + ":" + gz; if (used[key]) continue; used[key] = 1;
      if (qtMapHeight(bu, bv) <= .004 || qtMapDist(bu, bv) < .004) { bu = T0[0]; bv = T0[1]; if (qtMapHeight(bu, bv) <= 0) continue; }
      var core = 1 - rr / T0[2], hgt = .03 + Math.pow(core, 2.2) * T0[4] * (.4 + R(seed++) * .9), wdt = .035 + R(seed++) * .05;
      if (ti === 0 && R(seed++) > .965) hgt *= 1.7; // a few Vice City skyscrapers
      p3.set(X(bu), groundY(bu, bv) + hgt / 2, Z(bv)); q.identity(); sc3.set(Math.min(wdt, blk * S * .8), hgt, Math.min(wdt * (.7 + R(seed++) * .6), blk * S * .8));
      m4.compose(p3, q, sc3); blds.setMatrixAt(bi, m4); blds.setColorAt(bi, new THREE.Color(tint[Math.floor(R(seed++) * tint.length)])); bi++;
    }
  });
  blds.count = bi; scene.add(blds);

  // ---------- forests ----------
  var TREES = small ? 900 : 2200, trees = new THREE.InstancedMesh(new THREE.ConeGeometry(.045, .14, 6), new THREE.MeshStandardMaterial({ color: 0x2f6e3a, roughness: 1 }), TREES), tc = 0;
  trees.castShadow = !small;
  for (var tt = 0; tt < TREES * 4 && tc < TREES; tt++) {
    var tu = .02 + R(tt * 3.1) * .9, tv = .08 + R(tt * 5.7) * .35, th = qtMapHeight(tu, tv);
    if (th < .05 || th > .7 || qtMapDist(tu, tv) < .012 || qtMapNoise(tu * 30, tv * 30) < .42) continue;
    var near = false; for (var t2 = 0; t2 < QT_MAP_TOWNS.length; t2++) if (Math.hypot(tu - QT_MAP_TOWNS[t2][0], tv - QT_MAP_TOWNS[t2][1]) < QT_MAP_TOWNS[t2][2]) near = true; if (near) continue;
    var ts = .7 + R(tt) * .7; m4.compose(p3.set(X(tu), th * Y + .06 * ts, Z(tv)), q.identity(), sc3.set(ts, ts, ts)); trees.setMatrixAt(tc, m4); trees.setColorAt(tc, new THREE.Color().setHSL(.3 + R(tt + 1) * .06, .45, .2 + R(tt + 2) * .1)); tc++;
  }
  trees.count = tc; scene.add(trees);

  // ---------- highways, the keys bridge, traffic ----------
  var roadMat = new THREE.MeshStandardMaterial({ color: 0x45404c, roughness: .6, emissive: 0xffb347, emissiveIntensity: .08 }), routes = [];
  QT_MAP_ROADS.forEach(function (rd) {
    var pts = []; for (var s = 0; s < rd.pts.length - 1; s++) { var a = rd.pts[s], b = rd.pts[s + 1], n2 = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / .004); for (var k = 0; k < n2; k++) pts.push([a[0] + (b[0] - a[0]) * k / n2, a[1] + (b[1] - a[1]) * k / n2]); }
    pts.push(rd.pts[rd.pts.length - 1]);
    var verts = [], idx = [], path = [], halfW = rd.w * S * .5 * .2;
    pts.forEach(function (p, k) {
      var pn = pts[Math.min(pts.length - 1, k + 1)], pp = pts[Math.max(0, k - 1)], dx = (pn[0] - pp[0]) * S, dz = (pn[1] - pp[1]) * S, L = Math.hypot(dx, dz) || 1, nx = -dz / L, nz = dx / L;
      var gy = groundY(p[0], p[1]), y = rd.bridge || gy < .02 ? Math.max(gy, 0) + .06 : gy + .012;
      verts.push(X(p[0]) + nx * halfW, y, Z(p[1]) + nz * halfW, X(p[0]) - nx * halfW, y, Z(p[1]) - nz * halfW);
      if (k) { var o = (k - 1) * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
      path.push(new THREE.Vector3(X(p[0]), y + .02, Z(p[1])));
    });
    var g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3)); g.setIndex(idx); g.computeVertexNormals();
    var mesh = new THREE.Mesh(g, roadMat); mesh.receiveShadow = !small; scene.add(mesh);
    if (rd.bridge) { var pil = new THREE.InstancedMesh(new THREE.CylinderGeometry(.012, .012, .1, 6), new THREE.MeshStandardMaterial({ color: 0xcfc6d8 }), Math.ceil(path.length / 4)), pc = 0; for (var k2 = 0; k2 < path.length; k2 += 4) { m4.makeTranslation(path[k2].x, .02, path[k2].z); pil.setMatrixAt(pc++, m4); } pil.count = pc; scene.add(pil); }
    var len = [0]; for (var k3 = 1; k3 < path.length; k3++) len.push(len[k3 - 1] + path[k3].distanceTo(path[k3 - 1]));
    routes.push({ path: path, len: len, total: len[len.length - 1] });
  });
  var CARS = small ? 90 : 180, carMat = new THREE.MeshBasicMaterial({ color: 0xffffff }), cars = new THREE.InstancedMesh(new THREE.SphereGeometry(.018, 6, 4), carMat, CARS), carState = [];
  for (var cI = 0; cI < CARS; cI++) { var rI = cI % routes.length; carState.push({ r: routes[rI], s: R(cI * 9) * routes[rI].total, sp: (.25 + R(cI * 4) * .25) * (R(cI * 2) > .5 ? 1 : -1) }); cars.setColorAt(cI, new THREE.Color(carState[cI].sp > 0 ? 0xfff2c4 : 0xff3b4e)); }
  scene.add(cars);
  function placeCar(cs, i) { var r = cs.r, s = ((cs.s % r.total) + r.total) % r.total, lo = 0, hi = r.len.length - 1; while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (r.len[mid] < s) lo = mid; else hi = mid; } var f = (s - r.len[lo]) / ((r.len[hi] - r.len[lo]) || 1); p3.copy(r.path[lo]).lerp(r.path[hi], f); m4.makeTranslation(p3.x, p3.y, p3.z); cars.setMatrixAt(i, m4); }

  // ---------- clouds ----------
  var cc = document.createElement("canvas"); cc.width = cc.height = 64; var cg = cc.getContext("2d"), rg = cg.createRadialGradient(32, 32, 2, 32, 32, 32); rg.addColorStop(0, "rgba(255,255,255,.9)"); rg.addColorStop(1, "rgba(255,255,255,0)"); cg.fillStyle = rg; cg.fillRect(0, 0, 64, 64);
  var cloudTex = new THREE.CanvasTexture(cc), clouds = [];
  for (var k4 = 0; k4 < (small ? 8 : 16); k4++) { var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, color: 0xffd6ec, transparent: true, opacity: .35, depthWrite: false })); sp.position.set((R(k4 * 3) - .5) * 18, 2.2 + R(k4) * 1.2, (R(k4 * 7) - .5) * 16); sp.scale.set(2.4 + R(k4 * 5) * 2, 1 + R(k4 * 6), 1); scene.add(sp); clouds.push(sp); }

  // ---------- pins ----------
  var pins = [], layer = document.getElementById("gsMapPins");
  places.forEach(function (p) {
    var y = Math.max(groundY(p.u, p.v), 0), x = X(p.u), z = Z(p.v), col = p.color || 0xff2d95;
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(.02, .05, 1.5, 10, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .45, depthWrite: false, blending: THREE.AdditiveBlending })); beam.position.set(x, y + .75, z); scene.add(beam);
    var ring = new THREE.Mesh(new THREE.RingGeometry(.12, .16, 32), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(x, y + .03, z); scene.add(ring);
    var orb = new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 12), new THREE.MeshBasicMaterial({ color: col })); orb.position.set(x, y + 1.52, z); scene.add(orb);
    var btn = document.createElement("button"); btn.type = "button"; btn.className = "gs-pin"; btn.textContent = p.name; btn.style.setProperty("--pc", p.css || "#ff2d95");
    btn.addEventListener("click", function () { focus(p); }); layer.appendChild(btn);
    pins.push({ p: p, v: new THREE.Vector3(x, y + 1.65, z), btn: btn, orb: orb, ring: ring });
  });

  // ---------- moods ----------
  var tools = box.querySelector(".gs-maptools"), moodBtn = document.createElement("button"); moodBtn.type = "button"; moodBtn.className = "chip"; tools.insertBefore(moodBtn, tools.firstChild);
  var night = false;
  function mood(n) {
    night = n; scene.background = n ? SKY.night : SKY.sunset;
    hemi.intensity = n ? .35 : 1.15; sun.intensity = n ? .35 : 2.6; sun.color.set(n ? 0x8fa8ff : 0xffb27a);
    scene.fog.color.set(n ? 0x120a2a : 0x7a2a6e); bMat.emissiveIntensity = n ? 1.6 : .25; roadMat.emissiveIntensity = n ? .9 : .12;
    waterMat.emissive.set(n ? 0x02101e : 0x062a44); clouds.forEach(function (s) { s.material.color.set(n ? 0x6a5a9a : 0xffd6ec); s.material.opacity = n ? .18 : .35; });
    moodBtn.textContent = n ? (AR ? "🌅 غروب" : "🌅 Sunset") : (AR ? "🌙 ليل" : "🌙 Night");
  }
  moodBtn.addEventListener("click", function () { mood(!night); }); mood(false);

  // ---------- camera rig ----------
  var HOME = { az: -.35, el: .9, dist: 15.5, x: .3, z: .4 };
  var rig = { az: HOME.az, el: HOME.el, dist: HOME.dist, tAz: HOME.az, tEl: HOME.el, tDist: HOME.dist, target: new THREE.Vector3(HOME.x, 0, HOME.z), tTarget: new THREE.Vector3(HOME.x, 0, HOME.z) }, idle = 0, card = document.getElementById("gsMapCard");
  function focus(p) {
    rig.tTarget.set(X(p.u), Math.max(groundY(p.u, p.v), 0), Z(p.v)); rig.tDist = 4.2; rig.tEl = .62; idle = -8;
    card.hidden = false; var im = card.querySelector("img"); im.src = p.img; im.alt = p.name; card.querySelector("b").textContent = p.name; card.querySelector("p").textContent = p.desc; card.querySelector("em").textContent = p.real || "";
    pins.forEach(function (o) { o.btn.classList.toggle("on", o.p === p); });
    if (typeof qtEvent === "function") qtEvent("gta_map_pin");
  }
  document.getElementById("gsMapReset").addEventListener("click", function () { rig.tTarget.set(HOME.x, 0, HOME.z); rig.tDist = HOME.dist; rig.tEl = HOME.el; card.hidden = true; pins.forEach(function (o) { o.btn.classList.remove("on"); }); });
  card.querySelector(".gs-x").addEventListener("click", function () { card.hidden = true; });
  var drag = null, el = renderer.domElement, pts = {};
  el.addEventListener("pointerdown", function (e) { pts[e.pointerId] = [e.clientX, e.clientY]; drag = { x: e.clientX, y: e.clientY, az: rig.tAz, el: rig.tEl, t: rig.tTarget.clone(), pan: e.button === 2 || e.shiftKey }; el.setPointerCapture(e.pointerId); idle = -5; });
  el.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  el.addEventListener("pointermove", function (e) {
    if (!pts[e.pointerId]) return; var ids = Object.keys(pts);
    if (ids.length === 2) { var o = pts[ids[0] == e.pointerId ? ids[1] : ids[0]], prev = pts[e.pointerId], d0 = Math.hypot(prev[0] - o[0], prev[1] - o[1]), d1 = Math.hypot(e.clientX - o[0], e.clientY - o[1]); rig.tDist = Math.max(2.2, Math.min(20, rig.tDist * d0 / Math.max(1, d1))); }
    else if (drag && drag.pan) { var f = rig.dist * .0016, dx = e.clientX - drag.x, dy = e.clientY - drag.y, ca = Math.cos(rig.az), sa = Math.sin(rig.az); rig.tTarget.set(Math.max(-7, Math.min(7, drag.t.x - (dx * ca + dy * sa) * f)), drag.t.y, Math.max(-7, Math.min(7, drag.t.z - (-dx * sa + dy * ca) * f))); }
    else if (drag) { rig.tAz = drag.az - (e.clientX - drag.x) * .006; rig.tEl = Math.max(.22, Math.min(1.4, drag.el + (e.clientY - drag.y) * .004)); }
    pts[e.pointerId] = [e.clientX, e.clientY];
  });
  var up = function (e) { delete pts[e.pointerId]; drag = null; }; el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  el.addEventListener("wheel", function (e) { e.preventDefault(); rig.tDist = Math.max(2.2, Math.min(20, rig.tDist * (1 + e.deltaY * .001))); idle = -5; }, { passive: false });

  // ---------- render loop (only while visible) ----------
  var visible = false, last = performance.now(), v3 = new THREE.Vector3();
  new IntersectionObserver(function (es) { var was = visible; visible = es[0].isIntersecting; if (visible && !was) { last = performance.now(); requestAnimationFrame(loop); } }, { threshold: .02 }).observe(box);
  addEventListener("resize", function () { W = box.clientWidth; H = box.clientHeight; renderer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); });
  function loop(now) {
    if (!visible || document.hidden) { visible = visible && !document.hidden; return; }
    var dt = Math.min(.05, (now - last) / 1000); last = now; idle += dt;
    if (idle > 3 && !reduce) rig.tAz += dt * .05;
    var k = 1 - Math.pow(.003, dt); rig.az += (rig.tAz - rig.az) * k; rig.el += (rig.tEl - rig.el) * k; rig.dist += (rig.tDist - rig.dist) * k; rig.target.lerp(rig.tTarget, k);
    camera.position.set(rig.target.x + Math.cos(rig.el) * Math.sin(rig.az) * rig.dist, rig.target.y + Math.sin(rig.el) * rig.dist, rig.target.z + Math.cos(rig.el) * Math.cos(rig.az) * rig.dist); camera.lookAt(rig.target);
    var tt = now / 1000;
    if (!reduce) {
      var a = wgeo.attributes.position.array; for (var i = 1; i < a.length; i += 3) a[i] = Math.sin(wbase[i - 1] * 1.4 + tt) * .012 + Math.cos(wbase[i + 1] * 1.2 + tt * .8) * .012; wgeo.attributes.position.needsUpdate = true;
      for (var c5 = 0; c5 < carState.length; c5++) { carState[c5].s += carState[c5].sp * dt; placeCar(carState[c5], c5); } cars.instanceMatrix.needsUpdate = true;
      clouds.forEach(function (s, i2) { s.position.x += dt * (.08 + i2 % 3 * .03); if (s.position.x > 10) s.position.x = -10; });
    } else if (!cars.userData.placed) { carState.forEach(placeCar); cars.instanceMatrix.needsUpdate = true; cars.userData.placed = true; }
    pins.forEach(function (o, i3) {
      o.orb.scale.setScalar(1 + .25 * Math.sin(tt * 3 + i3)); o.ring.scale.setScalar(1 + ((tt * .8 + i3 * .3) % 1) * 1.6); o.ring.material.opacity = .8 * (1 - ((tt * .8 + i3 * .3) % 1));
      v3.copy(o.v).project(camera); var sx = (v3.x * .5 + .5) * W, sy = Math.max(46, (-v3.y * .5 + .5) * H);
      o.btn.style.transform = "translate(-50%,-100%) translate(" + sx.toFixed(1) + "px," + sy.toFixed(1) + "px)"; o.btn.style.opacity = v3.z < 1 && sx > -40 && sx < W + 40 ? 1 : 0;
    });
    renderer.render(scene, camera); requestAnimationFrame(loop);
  }
}
if (typeof module !== "undefined") module.exports = { qtMapInside: qtMapInside, qtMapHeight: qtMapHeight, qtMapDist: qtMapDist, QT_MAP_OUTLINE: QT_MAP_OUTLINE, QT_MAP_ROADS: QT_MAP_ROADS };
