// GTA 6 Zone — illustrative 3D map of Leonida (NOT the official map, which Rockstar releases on launch day).
// Procedural terrain (three.js 0.179.1 from jsDelivr), sunset sky, neon Vice City, glowing pins for the six regions
// Rockstar has named. Fly-to on tap, drag to orbit, wheel/pinch to zoom; renders only while visible.
var QT_MAP_OUTLINE = [[0.05, 0.10], [0.30, 0.06], [0.45, 0.12], [0.62, 0.10], [0.72, 0.16], [0.78, 0.30], [0.84, 0.48], [0.86, 0.62], [0.83, 0.76], [0.76, 0.86], [0.66, 0.90], [0.58, 0.84], [0.52, 0.72], [0.46, 0.60], [0.40, 0.46], [0.36, 0.34], [0.28, 0.26], [0.16, 0.22], [0.06, 0.20]];
var QT_MAP_KEYS = [[0.70, 0.92, .022], [0.65, 0.945, .018], [0.60, 0.962, .02], [0.55, 0.972, .016], [0.50, 0.978, .018], [0.45, 0.982, .014], [0.40, 0.985, .02]];
function qtMapInside(u, v) {
  var c = false, P = QT_MAP_OUTLINE; for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var a = P[i], b = P[j]; if ((a[1] > v) !== (b[1] > v) && u < (b[0] - a[0]) * (v - a[1]) / (b[1] - a[1]) + a[0]) c = !c; }
  if (c) return true;
  for (var k = 0; k < QT_MAP_KEYS.length; k++) { var dx = u - QT_MAP_KEYS[k][0], dy = v - QT_MAP_KEYS[k][1]; if (dx * dx + dy * dy < QT_MAP_KEYS[k][2] * QT_MAP_KEYS[k][2]) return true; }
  return false;
}
function qtMapNoise(x, y) { // cheap smooth value noise
  var s = function (a, b) { var n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); };
  var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), w = yf * yf * (3 - 2 * yf);
  var a = s(xi, yi), b = s(xi + 1, yi), c = s(xi, yi + 1), d = s(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * w + (a - b - c + d) * u * w;
}
function qtMapHeight(u, v) {
  if (!qtMapInside(u, v)) return -0.35;
  var h = 0, amp = .5, f = 6; for (var o = 0; o < 4; o++) { h += qtMapNoise(u * f, v * f) * amp; amp *= .5; f *= 2.1; }
  h = .06 + h * .35;
  var mk = Math.exp(-((u - .55) * (u - .55) + (v - .22) * (v - .22)) / .006); h += mk * 1.1;      // Mount Kalaga hills
  var sw = Math.exp(-((u - .63) * (u - .63) + (v - .75) * (v - .75)) / .01); h = h * (1 - sw * .8) + sw * .03; // Grassrivers flats
  var lk = Math.exp(-((u - .62) * (u - .62) + (v - .53) * (v - .53)) / .0016); h -= lk * .5;     // the big lake near Ambrosia
  return h;
}

(async function () {
  if (typeof document === "undefined") return;
  var box = document.getElementById("gsMap"); if (!box) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0;
  var places = []; try { places = JSON.parse(document.getElementById("gsPlacesData").textContent); } catch (e) {}
  var fallback = function () { box.classList.add("nogl"); };
  var test = document.createElement("canvas"); if (!(test.getContext("webgl2") || test.getContext("webgl"))) return fallback();
  var THREE; try { THREE = await import("https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.min.js"); } catch (e) { return fallback(); }
  var reduce = !!window.qtGsStill;
  var W = box.clientWidth, H = box.clientHeight;
  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1)); renderer.setSize(W, H); renderer.outputColorSpace = THREE.SRGBColorSpace;
  box.insertBefore(renderer.domElement, box.firstChild); renderer.domElement.setAttribute("aria-hidden", "true");
  var scene = new THREE.Scene();
  // sunset sky
  var sky = document.createElement("canvas"); sky.width = 2; sky.height = 256; var sg = sky.getContext("2d"), gr = sg.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, "#0b0420"); gr.addColorStop(.45, "#3a0b5c"); gr.addColorStop(.75, "#c2185b"); gr.addColorStop(1, "#ff8a3d"); sg.fillStyle = gr; sg.fillRect(0, 0, 2, 256);
  var skyTex = new THREE.CanvasTexture(sky); skyTex.colorSpace = THREE.SRGBColorSpace; scene.background = skyTex;
  scene.fog = new THREE.Fog(0x6a1e6e, 9, 26);
  var camera = new THREE.PerspectiveCamera(42, W / H, .1, 100);
  scene.add(new THREE.HemisphereLight(0xffc6f0, 0x1a0630, 1.1));
  var sun = new THREE.DirectionalLight(0xffb070, 2.2); sun.position.set(-6, 5, 4); scene.add(sun);
  // terrain
  var S = 12, N = 180, geo = new THREE.PlaneGeometry(S, S, N, N); geo.rotateX(-Math.PI / 2);
  var pos = geo.attributes.position, colors = new Float32Array(pos.count * 3), col = new THREE.Color();
  for (var i = 0; i < pos.count; i++) {
    var u = pos.getX(i) / S + .5, v = pos.getZ(i) / S + .5, h = qtMapHeight(u, v); pos.setY(i, Math.max(h, -.35) * 1.4);
    var sw = Math.exp(-((u - .63) * (u - .63) + (v - .75) * (v - .75)) / .01);
    if (h < -.2) col.set(0x0a3a5a); else if (h < .05) col.set(0xe9cf96); else if (h < .3) col.set(0x3f8f4e).lerp(new THREE.Color(0x6b6a2a), sw); else if (h < .7) col.set(0x225c34); else col.set(0x8a8f86);
    colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3)); geo.computeVertexNormals();
  scene.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .9, flatShading: true })));
  // water with a slow shimmer
  var wgeo = new THREE.PlaneGeometry(40, 40, 60, 60); wgeo.rotateX(-Math.PI / 2);
  var water = new THREE.Mesh(wgeo, new THREE.MeshStandardMaterial({ color: 0x0fb6c8, transparent: true, opacity: .78, roughness: .25, metalness: .2, emissive: 0x08304a, flatShading: true }));
  water.position.y = .02; scene.add(water); var wbase = Float32Array.from(wgeo.attributes.position.array);
  // Vice City: neon towers on the south-east coast
  var vc = places.find(function (p) { return p.id === "vice-city"; }) || { u: .8, v: .7 };
  var towers = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x251040, emissive: 0xff2d95, emissiveIntensity: .35, roughness: .4 }), 70);
  var m4 = new THREE.Matrix4(), R = function (s) { var x = Math.sin(s * 999) * 10000; return x - Math.floor(x); };
  for (var t = 0; t < 70; t++) {
    var tu = vc.u - .03 + R(t) * .06, tv = vc.v - .05 + R(t + 50) * .1; if (!qtMapInside(tu, tv)) { tu = vc.u - .02; tv = vc.v; }
    var th = .12 + R(t + 99) * .55, tw = .06 + R(t + 7) * .07, bx = (tu - .5) * S, bz = (tv - .5) * S, by = Math.max(qtMapHeight(tu, tv), .02) * 1.4 + th / 2;
    m4.makeScale(tw, th, tw); m4.setPosition(bx, by, bz); towers.setMatrixAt(t, m4); towers.setColorAt(t, new THREE.Color(R(t + 3) > .5 ? 0x3cf0ff : 0xff2d95));
  }
  scene.add(towers);
  // pins
  var pins = [], layer = document.getElementById("gsMapPins");
  places.forEach(function (p) {
    var y = Math.max(qtMapHeight(p.u, p.v), .02) * 1.4, x = (p.u - .5) * S, z = (p.v - .5) * S;
    var beam = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, 1.6, 8, 1, true), new THREE.MeshBasicMaterial({ color: p.color || 0xff2d95, transparent: true, opacity: .55 }));
    beam.position.set(x, y + .8, z); scene.add(beam);
    var orb = new THREE.Mesh(new THREE.SphereGeometry(.09, 16, 12), new THREE.MeshBasicMaterial({ color: p.color || 0xff2d95 })); orb.position.set(x, y + 1.62, z); scene.add(orb);
    var btn = document.createElement("button"); btn.type = "button"; btn.className = "gs-pin"; btn.textContent = p.name; btn.style.setProperty("--pc", p.css || "#ff2d95");
    btn.addEventListener("click", function () { focus(p); }); layer.appendChild(btn);
    pins.push({ p: p, v: new THREE.Vector3(x, y + 1.75, z), btn: btn, orb: orb });
  });
  // camera rig: spherical coords around a target, eased
  var rig = { az: -.5, el: .85, dist: 13, tAz: -.5, tEl: .85, tDist: 13, target: new THREE.Vector3(0, 0, 0), tTarget: new THREE.Vector3(0, 0, 0) }, idle = 0, card = document.getElementById("gsMapCard");
  function focus(p) {
    rig.tTarget.set((p.u - .5) * S, .3, (p.v - .5) * S); rig.tDist = 6.2; rig.tEl = .7; idle = -6;
    card.hidden = false; card.querySelector("img").src = p.img; card.querySelector("img").alt = p.name; card.querySelector("b").textContent = p.name; card.querySelector("p").textContent = p.desc; card.querySelector("em").textContent = p.real || "";
    pins.forEach(function (q) { q.btn.classList.toggle("on", q.p === p); });
    if (typeof qtEvent === "function") qtEvent("gta_map_pin");
  }
  document.getElementById("gsMapReset").addEventListener("click", function () { rig.tTarget.set(0, 0, 0); rig.tDist = 13; rig.tEl = .85; card.hidden = true; pins.forEach(function (q) { q.btn.classList.remove("on"); }); });
  card.querySelector(".gs-x").addEventListener("click", function () { card.hidden = true; });
  // input: drag to orbit, wheel/pinch to zoom
  var drag = null, el = renderer.domElement, pts = {};
  el.addEventListener("pointerdown", function (e) { pts[e.pointerId] = [e.clientX, e.clientY]; drag = { x: e.clientX, y: e.clientY, az: rig.tAz, el: rig.tEl }; el.setPointerCapture(e.pointerId); idle = -4; });
  el.addEventListener("pointermove", function (e) {
    if (!pts[e.pointerId]) return; var ids = Object.keys(pts);
    if (ids.length === 2) { var o = pts[ids[0] == e.pointerId ? ids[1] : ids[0]], prev = pts[e.pointerId], d0 = Math.hypot(prev[0] - o[0], prev[1] - o[1]), d1 = Math.hypot(e.clientX - o[0], e.clientY - o[1]); rig.tDist = Math.max(4, Math.min(18, rig.tDist * d0 / Math.max(1, d1))); }
    else if (drag) { rig.tAz = drag.az - (e.clientX - drag.x) * .006; rig.tEl = Math.max(.25, Math.min(1.35, drag.el + (e.clientY - drag.y) * .004)); }
    pts[e.pointerId] = [e.clientX, e.clientY];
  });
  var up = function (e) { delete pts[e.pointerId]; drag = null; }; el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
  el.addEventListener("wheel", function (e) { e.preventDefault(); rig.tDist = Math.max(4, Math.min(18, rig.tDist * (1 + e.deltaY * .001))); idle = -4; }, { passive: false });
  // render loop only while visible
  var visible = false, last = performance.now(), v3 = new THREE.Vector3();
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { last = performance.now(); requestAnimationFrame(loop); } }, { threshold: .05 }).observe(box);
  addEventListener("resize", function () { W = box.clientWidth; H = box.clientHeight; renderer.setSize(W, H); camera.aspect = W / H; camera.updateProjectionMatrix(); });
  function loop(now) {
    if (!visible || document.hidden) return;
    var dt = Math.min(.05, (now - last) / 1000); last = now; idle += dt;
    if (idle > 2 && !reduce) rig.tAz += dt * .06;
    var k = 1 - Math.pow(.002, dt); rig.az += (rig.tAz - rig.az) * k; rig.el += (rig.tEl - rig.el) * k; rig.dist += (rig.tDist - rig.dist) * k; rig.target.lerp(rig.tTarget, k);
    camera.position.set(rig.target.x + Math.cos(rig.el) * Math.sin(rig.az) * rig.dist, rig.target.y + Math.sin(rig.el) * rig.dist, rig.target.z + Math.cos(rig.el) * Math.cos(rig.az) * rig.dist); camera.lookAt(rig.target);
    if (!reduce) { var a = wgeo.attributes.position.array, tt = now / 1000; for (var i = 1; i < a.length; i += 3) a[i] = wbase[i] + Math.sin(wbase[i - 1] * 1.3 + tt) * .025 + Math.cos(wbase[i + 1] * 1.1 + tt * .8) * .025; wgeo.attributes.position.needsUpdate = true; }
    pins.forEach(function (q, i) { q.orb.scale.setScalar(1 + .25 * Math.sin(now / 300 + i)); v3.copy(q.v).project(camera); var sx = (v3.x * .5 + .5) * W, sy = (-v3.y * .5 + .5) * H; q.btn.style.transform = "translate(-50%,-100%) translate(" + sx.toFixed(1) + "px," + sy.toFixed(1) + "px)"; q.btn.style.opacity = v3.z < 1 ? 1 : 0; });
    renderer.render(scene, camera); requestAnimationFrame(loop);
  }
})();
if (typeof module !== "undefined") module.exports = { qtMapInside: qtMapInside, qtMapHeight: qtMapHeight, QT_MAP_OUTLINE: QT_MAP_OUTLINE };
