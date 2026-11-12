// GTA 6 Zone — illustrative 3D map of Leonida (NOT the official map; Rockstar releases that on launch day).
// Leonida is Rockstar's take on Florida, so our land is shaped after Florida's real, public-domain geography.
// Look: an original AI-painted top-down texture (assets/gta6/leonida-map.webp) draped over 3D terrain whose
// heightmap, night lights and building footprints are all derived from that painting (tools/gta_map_assets.py),
// so relief, city blocks and coastline line up. The outline helpers below are kept for tests and pin sanity.
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

// heightmap byte -> world height: 128..255 land, 0..127 sea depth (see tools/gta_map_assets.py)
function qtMapDecode(b) { return b >= 128 ? (b - 128) / 127 : -(127 - b) / 127; }
function qtMapLoadImg(src) { return new Promise(function (ok, bad) { var im = new Image(); im.decoding = "async"; im.onload = function () { ok(im); }; im.onerror = bad; im.src = src; }); }

async function build() {
  var box = document.getElementById("gsMap");
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var places = []; try { places = JSON.parse(document.getElementById("gsPlacesData").textContent); } catch (e) {}
  var fallback = function () { box.classList.add("nogl"); };
  var test = document.createElement("canvas"); if (!(test.getContext("webgl2") || test.getContext("webgl"))) return fallback();
  var A = "/assets/gta6/leonida-";
  var loaded; try {
    loaded = await Promise.all([import("https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.min.js"), qtMapLoadImg(A + "height.png"), fetch(A + "city.json").then(function (r) { return r.json(); })]);
  } catch (e) { return fallback(); }
  var THREE = loaded[0], himg = loaded[1], city = loaded[2];
  var reduce = !!window.qtGsStill, small = innerWidth < 760;
  var W = box.clientWidth, H = box.clientHeight, S = 14, Y = .9, SEA = .07;
  var X = function (u) { return (u - .5) * S; }, Z = function (v) { return (v - .5) * S; };
  // heightmap sampler (bilinear)
  var hc = document.createElement("canvas"), HN = himg.width; hc.width = hc.height = HN; var hx = hc.getContext("2d", { willReadFrequently: true }); hx.drawImage(himg, 0, 0);
  var hd = hx.getImageData(0, 0, HN, HN).data;
  function hAt(u, v) {
    var x = Math.max(0, Math.min(HN - 1.001, u * HN - .5)), y = Math.max(0, Math.min(HN - 1.001, v * HN - .5)), x0 = x | 0, y0 = y | 0, fx = x - x0, fy = y - y0;
    var p = function (i, j) { return qtMapDecode(hd[((y0 + j) * HN + x0 + i) * 4]); };
    return p(0, 0) * (1 - fx) * (1 - fy) + p(1, 0) * fx * (1 - fy) + p(0, 1) * (1 - fx) * fy + p(1, 1) * fx * fy;
  }
  var groundY = function (u, v) { var h = hAt(u, v); return h > 0 ? .004 + h * h * Y * 1.6 + h * Y * .2 : h * SEA; }; // gentle shores, shallow water

  var renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(small ? 1.5 : 1.25, window.devicePixelRatio || 1)); renderer.setSize(W, H);
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.08;
  if (!small) { renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; }
  box.insertBefore(renderer.domElement, box.firstChild); renderer.domElement.setAttribute("aria-hidden", "true");
  var scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(38, W / H, .05, 120);
  var maxAniso = renderer.capabilities.getMaxAnisotropy();
  var texL = new THREE.TextureLoader();
  function tex(src, srgb) { return new Promise(function (ok, bad) { texL.load(src, function (t) { if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, maxAniso); ok(t); }, undefined, bad); }); }
  var tx; try { tx = await Promise.all([tex(A + "map.webp", true), tex(A + "lights.webp", true)]); } catch (e) { return fallback(); }

  // ---------- sky + lights ----------
  function skyTex(stops) { var c = document.createElement("canvas"); c.width = 2; c.height = 256; var g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 0, 256); stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); g.fillStyle = gr; g.fillRect(0, 0, 2, 256); var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
  var SKY = { day: skyTex([[0, "#2b1060"], [.45, "#7a2a8a"], [.72, "#ff6f7d"], [.88, "#ffb26b"], [1, "#ffe1a0"]]), night: skyTex([[0, "#02010a"], [.6, "#0b0a2e"], [1, "#24124a"]]) };
  var hemi = new THREE.HemisphereLight(0xfff0f6, 0x2a3a5a, 1.25); scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xffc28a, 2.4); sun.position.set(-6, 6.5, 4); scene.add(sun);
  if (!small) { sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); var sc = sun.shadow.camera; sc.left = -8; sc.right = 8; sc.top = 8; sc.bottom = -8; sc.near = 1; sc.far = 28; sun.shadow.bias = -.0005; sun.shadow.normalBias = .03; }
  scene.fog = new THREE.Fog(0x8a4a7e, 16, 38);

  // ---------- painted terrain ----------
  var N = small ? 200 : 300, geo = new THREE.PlaneGeometry(S, S, N, N); geo.rotateX(-Math.PI / 2);
  var pos = geo.attributes.position;
  for (var i = 0; i < pos.count; i++) pos.setY(i, groundY(pos.getX(i) / S + .5, pos.getZ(i) / S + .5));
  geo.computeVertexNormals();
  var landMat = new THREE.MeshStandardMaterial({ map: tx[0], emissiveMap: tx[1], emissive: 0xffffff, emissiveIntensity: 0, roughness: .92, metalness: 0 });
  var land = new THREE.Mesh(geo, landMat); land.receiveShadow = !small; scene.add(land);
  // skirt + far ocean so the edges never show the sky
  var ocean = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ color: 0x0b4f8f, roughness: .3 })); ocean.rotation.x = -Math.PI / 2; ocean.position.y = -SEA * 1.05; scene.add(ocean);
  // glossy water film with a gentle swell (sun glints)
  var wgeo = new THREE.PlaneGeometry(S, S, 64, 64); wgeo.rotateX(-Math.PI / 2);
  var waterMat = new THREE.MeshStandardMaterial({ color: 0x47c8e0, transparent: true, opacity: .16, roughness: .05, metalness: .6, depthWrite: false });
  var water = new THREE.Mesh(wgeo, waterMat); water.position.y = -.004; scene.add(water); var wbase = Float32Array.from(wgeo.attributes.position.array);

  // ---------- 3D buildings on the painted city blocks ----------
  var wc = document.createElement("canvas"); wc.width = 32; wc.height = 64; var wg = wc.getContext("2d"); wg.fillStyle = "#7d8aa6"; wg.fillRect(0, 0, 32, 64);
  var R = function (s) { var x = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
  for (var wy = 3; wy < 62; wy += 5) for (var wx = 2; wx < 31; wx += 5) { var r0 = R(wx * 7 + wy * 13); wg.fillStyle = r0 > .5 ? "#ffd98a" : r0 > .42 ? "#7ad8ff" : "#55607a"; wg.fillRect(wx, wy, 3, 3); }
  var winTex = new THREE.CanvasTexture(wc); winTex.colorSpace = THREE.SRGBColorSpace; winTex.magFilter = THREE.NearestFilter;
  var dark = document.createElement("canvas"); dark.width = 32; dark.height = 64; var dg = dark.getContext("2d"); dg.drawImage(wc, 0, 0); var id = dg.getImageData(0, 0, 32, 64);
  for (var p4 = 0; p4 < id.data.length; p4 += 4) { var lit = id.data[p4] > 230 && id.data[p4 + 2] < 160 || id.data[p4 + 2] > 230 && id.data[p4] < 140; if (!lit) { id.data[p4] = id.data[p4 + 1] = id.data[p4 + 2] = 0; } } dg.putImageData(id, 0, 0);
  var glowTex = new THREE.CanvasTexture(dark); glowTex.colorSpace = THREE.SRGBColorSpace; glowTex.magFilter = THREE.NearestFilter;
  var bMat = new THREE.MeshStandardMaterial({ map: winTex, emissiveMap: glowTex, emissive: 0xffffff, emissiveIntensity: 0, roughness: .45, metalness: .25 });
  city = city.filter(function (b) { return b[3] > .05; });
  var blds = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), bMat, city.length); blds.castShadow = !small; blds.receiveShadow = !small;
  var m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc3 = new THREE.Vector3(), p3 = new THREE.Vector3(), tints = [0xffffff, 0xcfe4ff, 0xf3e6ff, 0xe8f6ff, 0xd8fff6];
  city.forEach(function (b, k) {
    var w = b[2] * S * .8, h = b[3] * 2.4; p3.set(X(b[0]), groundY(b[0], b[1]) + h / 2 - .005, Z(b[1])); sc3.set(w, h, w * (.75 + R(k) * .5));
    m4.compose(p3, q, sc3); blds.setMatrixAt(k, m4); blds.setColorAt(k, new THREE.Color(tints[k % tints.length]));
  });
  scene.add(blds);

  // ---------- clouds ----------
  var cc = document.createElement("canvas"); cc.width = cc.height = 64; var cg = cc.getContext("2d"), rg = cg.createRadialGradient(32, 32, 2, 32, 32, 32); rg.addColorStop(0, "rgba(255,255,255,.9)"); rg.addColorStop(1, "rgba(255,255,255,0)"); cg.fillStyle = rg; cg.fillRect(0, 0, 64, 64);
  var cloudTex = new THREE.CanvasTexture(cc), clouds = [];
  for (var k4 = 0; k4 < (small ? 7 : 14); k4++) { var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, color: 0xffffff, transparent: true, opacity: .3, depthWrite: false })); sp.position.set((R(k4 * 3) - .5) * 18, 2.6 + R(k4) * 1.2, (R(k4 * 7) - .5) * 16); sp.scale.set(2.6 + R(k4 * 5) * 2.2, 1 + R(k4 * 6), 1); scene.add(sp); clouds.push(sp); }

  // ---------- pins ----------
  var pins = [], layer = document.getElementById("gsMapPins");
  places.forEach(function (p) {
    var y = Math.max(groundY(p.u, p.v), 0), x = X(p.u), z = Z(p.v), col = p.color || 0xff2d95;
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(.015, .04, 1.4, 10, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .5, depthWrite: false, blending: THREE.AdditiveBlending })); beam.position.set(x, y + .7, z); scene.add(beam);
    var ring = new THREE.Mesh(new THREE.RingGeometry(.1, .135, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.set(x, y + .02, z); scene.add(ring);
    var orb = new THREE.Mesh(new THREE.SphereGeometry(.06, 16, 12), new THREE.MeshBasicMaterial({ color: col })); orb.position.set(x, y + 1.42, z); scene.add(orb);
    var btn = document.createElement("button"); btn.type = "button"; btn.className = "gs-pin"; btn.textContent = p.name; btn.style.setProperty("--pc", p.css || "#ff2d95");
    btn.addEventListener("click", function () { focus(p); }); layer.appendChild(btn);
    pins.push({ p: p, v: new THREE.Vector3(x, y + 1.55, z), btn: btn, orb: orb, ring: ring });
  });

  // ---------- day / night ----------
  var tools = box.querySelector(".gs-maptools"), moodBtn = document.createElement("button"); moodBtn.type = "button"; moodBtn.className = "chip"; tools.insertBefore(moodBtn, tools.firstChild);
  var night = false;
  function mood(n) {
    night = n; scene.background = n ? SKY.night : SKY.day;
    hemi.intensity = n ? .5 : 1.25; sun.intensity = n ? .3 : 2.4; sun.color.set(n ? 0x8fa8ff : 0xffc28a);
    landMat.color.set(n ? 0x7880b8 : 0xffffff); landMat.emissiveIntensity = n ? 3 : 0; bMat.emissiveIntensity = n ? 2.2 : 0;
    ocean.material.color.set(n ? 0x061a36 : 0x0b4f8f); waterMat.color.set(n ? 0x1a2a6a : 0x47c8e0);
    scene.fog.color.set(n ? 0x0b0a26 : 0x8a4a7e); clouds.forEach(function (s) { s.material.color.set(n ? 0x5a4a8a : 0xffffff); s.material.opacity = n ? .14 : .3; });
    moodBtn.textContent = n ? (AR ? "☀️ نهار" : "☀️ Day") : (AR ? "🌙 ليل" : "🌙 Night");
  }
  moodBtn.addEventListener("click", function () { mood(!night); }); mood(false);

  // ---------- camera rig ----------
  var HOME = { az: -.28, el: 1.0, dist: 14.5, x: .4, z: .5 };
  var rig = { az: HOME.az, el: HOME.el, dist: HOME.dist, tAz: HOME.az, tEl: HOME.el, tDist: HOME.dist, target: new THREE.Vector3(HOME.x, 0, HOME.z), tTarget: new THREE.Vector3(HOME.x, 0, HOME.z) }, idle = 0, card = document.getElementById("gsMapCard");
  function focus(p) {
    rig.tTarget.set(X(p.u), Math.max(groundY(p.u, p.v), 0), Z(p.v)); rig.tDist = 3.6; rig.tEl = .58; idle = -8;
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
    if (ids.length === 2) { var o = pts[ids[0] == e.pointerId ? ids[1] : ids[0]], prev = pts[e.pointerId], d0 = Math.hypot(prev[0] - o[0], prev[1] - o[1]), d1 = Math.hypot(e.clientX - o[0], e.clientY - o[1]); rig.tDist = Math.max(1.6, Math.min(20, rig.tDist * d0 / Math.max(1, d1))); }
    else if (drag && drag.pan) { var f = rig.dist * .0016, dx = e.clientX - drag.x, dy = e.clientY - drag.y, ca = Math.cos(rig.az), sa = Math.sin(rig.az); rig.tTarget.set(Math.max(-7, Math.min(7, drag.t.x - (dx * ca + dy * sa) * f)), drag.t.y, Math.max(-7, Math.min(7, drag.t.z - (-dx * sa + dy * ca) * f))); }
    else if (drag) { rig.tAz = drag.az - (e.clientX - drag.x) * .006; rig.tEl = Math.max(.2, Math.min(1.45, drag.el + (e.clientY - drag.y) * .004)); }
    pts[e.pointerId] = [e.clientX, e.clientY];
  });
  var up = function (e) { delete pts[e.pointerId]; drag = null; }; el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  el.addEventListener("wheel", function (e) { e.preventDefault(); rig.tDist = Math.max(1.6, Math.min(20, rig.tDist * (1 + e.deltaY * .001))); idle = -5; }, { passive: false });

  // ---------- render loop (only while visible) ----------
  var visible = false, last = performance.now(), v3 = new THREE.Vector3();
  new IntersectionObserver(function (es) { var was = visible; visible = es[0].isIntersecting; if (visible && !was) { last = performance.now(); requestAnimationFrame(loop); } }, { threshold: .02 }).observe(box);
  addEventListener("resize", function () { W = box.clientWidth; H = box.clientHeight; renderer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); });
  function loop(now) {
    if (!visible || document.hidden) { visible = visible && !document.hidden; return; }
    var dt = Math.min(.05, (now - last) / 1000); last = now; idle += dt;
    if (idle > 3 && !reduce) rig.tAz += dt * .045;
    var k = 1 - Math.pow(.003, dt); rig.az += (rig.tAz - rig.az) * k; rig.el += (rig.tEl - rig.el) * k; rig.dist += (rig.tDist - rig.dist) * k; rig.target.lerp(rig.tTarget, k);
    camera.position.set(rig.target.x + Math.cos(rig.el) * Math.sin(rig.az) * rig.dist, rig.target.y + Math.sin(rig.el) * rig.dist, rig.target.z + Math.cos(rig.el) * Math.cos(rig.az) * rig.dist); camera.lookAt(rig.target);
    var tt = now / 1000;
    if (!reduce) {
      var a = wgeo.attributes.position.array; for (var i = 1; i < a.length; i += 3) a[i] = Math.sin(wbase[i - 1] * 1.6 + tt) * .006 + Math.cos(wbase[i + 1] * 1.3 + tt * .8) * .006; wgeo.attributes.position.needsUpdate = true;
      clouds.forEach(function (s, i2) { s.position.x += dt * (.08 + i2 % 3 * .03); if (s.position.x > 10) s.position.x = -10; });
    }
    pins.forEach(function (o, i3) {
      var ph = (tt * .8 + i3 * .3) % 1; o.orb.scale.setScalar(1 + .25 * Math.sin(tt * 3 + i3)); o.ring.scale.setScalar(1 + ph * 1.6); o.ring.material.opacity = .85 * (1 - ph);
      v3.copy(o.v).project(camera); var sx = (v3.x * .5 + .5) * W, sy = Math.max(46, (-v3.y * .5 + .5) * H);
      o.btn.style.transform = "translate(-50%,-100%) translate(" + sx.toFixed(1) + "px," + sy.toFixed(1) + "px)"; o.btn.style.opacity = v3.z < 1 && sx > -40 && sx < W + 40 ? 1 : 0;
    });
    renderer.render(scene, camera); requestAnimationFrame(loop);
  }
}
if (typeof module !== "undefined") module.exports = { qtMapInside: qtMapInside, qtMapHeight: qtMapHeight, qtMapDist: qtMapDist, qtMapDecode: qtMapDecode, QT_MAP_OUTLINE: QT_MAP_OUTLINE, QT_MAP_ROADS: QT_MAP_ROADS };
