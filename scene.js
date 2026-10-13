(function () {
  var ART = window.ART || {};
  var scrolly = document.getElementById('scrolly');
  var canvas = document.getElementById('gl');
  var chaps = Array.prototype.slice.call(document.querySelectorAll('.chap'));
  var ORANGE = 0xe0985f, GREEN = 0x4f8a6a, BROWN = 0xa8704a, CREAM = 0xefe6dc, DEEP = 0x0b110d;

  function fallback() {
    scrolly.classList.add('nogl'); canvas.style.display = 'none';
    chaps.forEach(function (c) { c.classList.add('on'); });
  }
  if (!window.THREE) return fallback();
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); }
  catch (e) { return fallback(); }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setClearColor(0x0b110d, 1);

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(DEEP, 0.035);
  var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  var loader = new THREE.TextureLoader();
  function loadTex(src, cb) { loader.load(src, function (t) { t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; cb(t); }); }
  function hex(c) { return '#' + c.toString(16).padStart(6, '0'); }
  function canvasTex(w, h, draw) {
    var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4; return t;
  }
  function wrapText(x, text, cx, y, maxW, lh) {
    var words = text.split(' '), line = '', lines = [];
    words.forEach(function (w) { var test = line ? line + ' ' + w : w; if (x.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; });
    lines.push(line);
    lines.forEach(function (l, i) { x.fillText(l, cx, y + i * lh); });
  }
  function label(text, color) {
    var t = canvasTex(256, 64, function (x) { x.font = '700 28px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = hex(color); x.fillText(text, 128, 32); });
    var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(1.2, 0.3, 1); return s;
  }

  // --- 1. Vinilo con el avatar de Alí en la etiqueta
  var vinyl = new THREE.Group(); scene.add(vinyl);
  var disc = new THREE.Mesh(new THREE.CircleGeometry(1.7, 80), new THREE.MeshBasicMaterial({ color: 0x0f1a14 })); vinyl.add(disc);
  [0.7, 0.95, 1.2, 1.45, 1.68].forEach(function (r, i) {
    var g = new THREE.Mesh(new THREE.RingGeometry(r - 0.012, r, 96), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x2a4636 : 0x1d3125, side: THREE.DoubleSide })); g.position.z = 0.002; vinyl.add(g);
  });
  var rim = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.03, 8, 96), new THREE.MeshBasicMaterial({ color: ORANGE })); vinyl.add(rim);
  var labelDisc = new THREE.Mesh(new THREE.CircleGeometry(0.62, 64), new THREE.MeshBasicMaterial({ color: ORANGE })); labelDisc.position.z = 0.01; vinyl.add(labelDisc);
  if (ART.avatar) loadTex(ART.avatar, function (t) { t.repeat.set(0.74, 0.74); t.offset.set(0.13, 0.13); labelDisc.material.map = t; labelDisc.material.color.set(0xffffff); labelDisc.material.needsUpdate = true; });
  var shine = new THREE.Mesh(new THREE.CircleGeometry(1.66, 64, 0.2, 0.7), new THREE.MeshBasicMaterial({ color: CREAM, transparent: true, opacity: 0.07, depthWrite: false })); shine.position.z = 0.02; vinyl.add(shine);
  var halo = new THREE.Mesh(new THREE.CircleGeometry(2.6, 64), new THREE.MeshBasicMaterial({ color: ORANGE, transparent: true, opacity: 0.08, depthWrite: false })); halo.position.z = -0.1; vinyl.add(halo);
  vinyl.rotation.y = 0.35;

  // póster: ilustración de su cuarto de estudio
  var poster = new THREE.Group(); scene.add(poster);
  var pFrame = new THREE.Mesh(new THREE.BoxGeometry(1.64, 2.14, 0.05), new THREE.MeshBasicMaterial({ color: BROWN })); poster.add(pFrame);
  var pPic = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.0), new THREE.MeshBasicMaterial({ color: 0x222222 })); pPic.position.z = 0.03; poster.add(pPic);
  if (ART.room) loadTex(ART.room, function (t) { pPic.material.map = t; pPic.material.color.set(0xffffff); pPic.material.needsUpdate = true; });

  // --- 2. Cuatro portadas con los discos que lo motivan (y = -6)
  var sleeves = new THREE.Group(); sleeves.position.y = -6; scene.add(sleeves);
  var SL = [['Drake', 0x7a4e33], ['Mac Miller', 0x1f3d2e], ['Catriel y Paco Amoroso', 0xc27a43], ['Horus', 0x2b2118]];
  var sleeveMeshes = SL.map(function (s, i) {
    var g = new THREE.Group();
    var t = canvasTex(512, 512, function (x, w, h) {
      x.fillStyle = hex(s[1]); x.fillRect(0, 0, w, h);
      x.strokeStyle = 'rgba(239,230,220,.35)'; x.lineWidth = 6; x.strokeRect(24, 24, w - 48, h - 48);
      x.fillStyle = '#efe6dc'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '700 64px Georgia, serif';
      wrapText(x, s[0], w / 2, h / 2 - (s[0].length > 12 ? 40 : 0), w - 120, 76);
    });
    var m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: t })); g.add(m);
    var f = new THREE.Mesh(new THREE.BoxGeometry(1.58, 1.58, 0.04), new THREE.MeshBasicMaterial({ color: CREAM })); f.position.z = -0.03; g.add(f);
    sleeves.add(g); return g;
  });

  // --- 3. Cuatro esferas con los géneros (y = -12)
  var orbs = new THREE.Group(); orbs.position.y = -12; scene.add(orbs);
  var GN = [['Lofi drill', ORANGE], ['R&B dancehall', GREEN], ['Lofi dancehall', BROWN], ['Lofi hip hop', CREAM]];
  var orbMeshes = GN.map(function (g) {
    var grp = new THREE.Group();
    grp.add(new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), new THREE.MeshBasicMaterial({ color: g[1], transparent: true, opacity: 0.35 })));
    grp.add(new THREE.Mesh(new THREE.SphereGeometry(0.52, 14, 10), new THREE.MeshBasicMaterial({ color: g[1], wireframe: true })));
    var lb = label(g[0], g[1]); lb.position.y = -0.95; grp.add(lb);
    orbs.add(grp); return grp;
  });

  // --- 4. Tres fotogramas: intro, desarrollo, conclusión (y = -18)
  var film = new THREE.Group(); film.position.y = -18; scene.add(film);
  var ACTS = [['I', 'Intro', 'La escena y a quién le hablo', 0x1f3d2e], ['II', 'Desarrollo', 'Lo que viví y lo que cambió', 0x7a4e33], ['III', 'Conclusión', 'Lo que aprendí', 0xc27a43]];
  var frameMeshes = ACTS.map(function (a) {
    var t = canvasTex(640, 360, function (x, w, h) {
      var gr = x.createLinearGradient(0, 0, w, h); gr.addColorStop(0, hex(a[3])); gr.addColorStop(1, '#0b110d'); x.fillStyle = gr; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(11,17,13,.85)'; for (var i = 0; i < 12; i++) { x.fillRect(14 + i * 52, 8, 26, 14); x.fillRect(14 + i * 52, h - 22, 26, 14); }
      x.fillStyle = '#efe6dc'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '400 italic 40px Georgia, serif'; x.fillText('Acto ' + a[0], w / 2, 110);
      x.font = '700 64px Georgia, serif'; x.fillText(a[1], w / 2, 180);
      x.font = '400 26px system-ui, sans-serif'; x.fillText(a[2], w / 2, 250);
    });
    var g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.35), new THREE.MeshBasicMaterial({ map: t })));
    var f = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.45, 0.04), new THREE.MeshBasicMaterial({ color: CREAM })); f.position.z = -0.03; g.add(f);
    film.add(g); return g;
  });

  // --- partículas del hero y túnel
  function points(n, spread, color2) {
    var pos = new Float32Array(n * 3), col = new Float32Array(n * 3), ca = new THREE.Color(ORANGE), cb = new THREE.Color(color2);
    for (var i = 0; i < n; i++) { spread(pos, i); var c = Math.random() < .5 ? ca : cb; col.set([c.r, c.g, c.b], i * 3); }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ size: 0.045, vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false }));
  }
  var dust = points(800, function (p, i) { p[i * 3] = (Math.random() - .5) * 16; p[i * 3 + 1] = Math.random() * -24 + 4; p[i * 3 + 2] = (Math.random() - .5) * 8 - 1; }, GREEN);
  scene.add(dust);
  scene.add(points(900, function (p, i) { p[i * 3] = (Math.random() - .5) * 12; p[i * 3 + 1] = (Math.random() - .5) * 8; p[i * 3 + 2] = Math.random() * -88 + 4; }, BROWN));
  var rings = new THREE.Group(); scene.add(rings);
  var RC = [ORANGE, GREEN, BROWN];
  for (var k = 0; k < 18; k++) {
    var ring = new THREE.Mesh(new THREE.TorusGeometry(2.4 + Math.random() * 1.2, 0.025, 8, 80), new THREE.MeshBasicMaterial({ color: RC[k % 3] }));
    ring.position.set((Math.random() - .5) * 0.8, (Math.random() - .5) * 0.8, -6 - k * 4.5);
    ring.userData.rx = (Math.random() - .5) * 0.9; ring.userData.spin = (k % 2 ? 1 : -1) * (0.002 + Math.random() * 0.004); rings.add(ring);
    if (k % 3 === 0) {
      var gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.28 + Math.random() * 0.2), new THREE.MeshBasicMaterial({ color: RC[(k + 1) % 3], wireframe: true }));
      gem.position.set((Math.random() < .5 ? -1 : 1) * (1.2 + Math.random() * 1.2), (Math.random() - .5) * 2.4, -4 - k * 4.5); gem.userData.gem = true; rings.add(gem);
    }
  }

  // --- cámara por capítulos
  var keys = [], mobile = false, scaleAll = 1;
  function layout() {
    var w = window.innerWidth, h = window.innerHeight, a = w / h;
    renderer.setSize(w, h, false); camera.aspect = a; camera.updateProjectionMatrix();
    mobile = a < 0.8; scaleAll = mobile ? 0.7 : 1;
    var fitW = function (half) { return Math.max(4.2, half / (0.414 * a)); };
    vinyl.position.set(mobile ? 0 : -1.5, mobile ? 0.6 : 0, 0); vinyl.scale.setScalar(mobile ? 0.8 : 1);
    poster.position.set(mobile ? 0 : 2.5, mobile ? -1.5 : 0, 0.3); poster.scale.setScalar(mobile ? 0.55 : 1); poster.rotation.y = -0.3;
    var sx = mobile ? 1.0 : 1.75;
    sleeveMeshes.forEach(function (g, i) { g.userData.by = mobile ? (i < 2 ? 0.95 : -0.95) : 0; g.position.set(mobile ? ((i % 2) - 0.5) * 1.15 : (i - 1.5) * sx, g.userData.by, 0); g.scale.setScalar(mobile ? 0.62 : 1); g.rotation.y = (i - 1.5) * -0.12; });
    var ox = mobile ? 0.85 : 1.9;
    orbMeshes.forEach(function (g, i) { g.position.set(mobile ? ((i % 2) - 0.5) * 1.4 : (i - 1.5) * ox, mobile ? (i < 2 ? 0.9 : -0.7) : 0, 0); g.scale.setScalar(mobile ? 0.8 : 1); });
    var fx = mobile ? 0 : 2.8;
    frameMeshes.forEach(function (g, i) { g.position.set((i - 1) * fx, mobile ? (1 - i) * 1.6 : 0, 0); g.scale.setScalar(mobile ? 0.9 : 1); g.rotation.y = (i - 1) * -0.18; });
    var z0 = fitW(mobile ? 2.6 : 4.4);
    keys = [
      { p: new THREE.Vector3(0, 0, z0), l: new THREE.Vector3(0, mobile ? -0.2 : 0, 0) },
      { p: new THREE.Vector3(0, -6 + 0.1, mobile ? 7 : fitW(3.7)), l: new THREE.Vector3(0, -6 + (mobile ? -0.3 : -0.4), 0) },
      { p: new THREE.Vector3(0, -12 + 0.1, mobile ? 8 : fitW(3.7)), l: new THREE.Vector3(0, -12 + (mobile ? -0.3 : -0.4), 0) },
      { p: new THREE.Vector3(0, -18 + 0.1, mobile ? 9 : fitW(4.4)), l: new THREE.Vector3(0, -18 + (mobile ? -0.3 : -0.4), 0) },
      { p: new THREE.Vector3(0, 0.3, z0 * 1.2), l: new THREE.Vector3(0, 0, 0) }
    ];
  }
  layout(); window.addEventListener('resize', layout);

  var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var target = 0, cur = 0, cp = 0, cpS = 0, tx = 0, ty = 0, cx = 0, cy = 0, active = -1;
  function readScroll() {
    var r = scrolly.getBoundingClientRect(), span = r.height - window.innerHeight;
    target = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    var heroEnd = y + r.bottom - window.innerHeight;
    var maxY = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    cp = Math.min(1, Math.max(0, (y - heroEnd) / Math.max(1, maxY - heroEnd)));
  }
  window.addEventListener('scroll', readScroll, { passive: true }); window.addEventListener('resize', readScroll); readScroll();
  window.addEventListener('pointermove', function (e) { tx = (e.clientX / window.innerWidth - .5) * 2; ty = (e.clientY / window.innerHeight - .5) * 2; });

  function ease(t) { return t * t * (3 - 2 * t); }
  var revealSel = '.phase, .card, .tablewrap, .note, .swatches, .themes, section.panel > h1, section.panel > h2, section.panel > p, section.panel > dl';
  var reveals = Array.prototype.slice.call(document.querySelectorAll(revealSel));
  reveals.forEach(function (el) { el.classList.add('r'); });
  function applyReveals() {
    if (still) return;
    var vh = window.innerHeight, vw = window.innerWidth, rects = reveals.map(function (el) { return el.getBoundingClientRect(); });
    reveals.forEach(function (el, n) {
      var r = rects[n];
      if (r.bottom < -80 || r.top > vh + 80) { el.style.opacity = '0'; return; }
      var inP = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.4))), outP = Math.min(1, Math.max(0, (r.bottom - 40) / (vh * 0.25)));
      var e = ease(inP), o = ease(outP), sx = ((r.left + r.width / 2) / vw - .5);
      el.style.opacity = String(Math.min(e, o));
      el.style.transform = 'perspective(1000px) translate3d(0,' + ((1 - e) * 70 - (1 - o) * 30).toFixed(1) + 'px,' + (-(1 - e) * 220 - (1 - o) * 120).toFixed(1) + 'px) rotateX(' + ((1 - e) * 32 - (1 - o) * 18).toFixed(2) + 'deg) rotateY(' + (sx * -8 * (1 - e * o * 0.6)).toFixed(2) + 'deg)';
    });
  }

  var tmpP = new THREE.Vector3(), tmpL = new THREE.Vector3(), t0 = performance.now();
  function frame(now) {
    var t = (now - t0) / 1000;
    cur += (target - cur) * (still ? 1 : 0.08); cpS += (cp - cpS) * (still ? 1 : 0.1);
    var s = cur * 4, i = Math.min(3, Math.floor(s)), f = ease(s - i);
    tmpP.copy(keys[i].p).lerp(keys[i + 1].p, f); tmpL.copy(keys[i].l).lerp(keys[i + 1].l, f);
    var tunnel = cpS > 0.0005;
    if (tunnel) {
      var z = keys[4].p.z + (-78 - keys[4].p.z) * cpS;
      tmpP.set(Math.sin(cpS * 14) * 0.7, 0.3 + Math.sin(cpS * 9) * 0.5, z); tmpL.set(Math.sin(cpS * 14 + 0.6) * 0.3, 0.2, z - 8);
    }
    if (!still) { cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06; tmpP.x += cx * 0.25; tmpP.y -= cy * 0.12; }
    camera.position.copy(tmpP); camera.lookAt(tmpL);
    if (tunnel && !still) camera.rotation.z += Math.sin(cpS * 10) * 0.06;

    var fc = 1 - ease(Math.min(1, cpS / 0.04));
    var vs = (mobile ? 0.8 : 1) * Math.max(0.001, fc); vinyl.scale.setScalar(vs);
    poster.scale.setScalar(Math.max(0.001, (mobile ? 0.55 : 1) * fc));
    if (!still) { vinyl.rotation.z -= 0.006; shine.rotation.z += 0.012; vinyl.position.y = (mobile ? 0.6 : 0) + Math.sin(t * .8) * 0.06; poster.position.y = (mobile ? -1.5 : 0) + Math.sin(t * .7 + 2) * 0.07; poster.rotation.y = -0.3 + Math.sin(t * .6) * 0.05; dust.rotation.y = t * 0.015; }
    var inTunnel = tunnel;
    sleeves.visible = orbs.visible = film.visible = !inTunnel;
    sleeveMeshes.forEach(function (g, n) { if (!still) g.position.y = g.userData.by + Math.sin(t * .8 + n) * 0.06; });
    orbMeshes.forEach(function (g, n) { if (!still) { g.rotation.y += 0.008 + n * 0.001; g.rotation.x += 0.004; } });
    frameMeshes.forEach(function (g, n) { if (!still) g.position.y = (mobile ? (1 - n) * 1.6 : 0) + Math.sin(t * .7 + n * 1.3) * 0.05; });
    rings.children.forEach(function (m, n) {
      if (m.userData.gem) { m.rotation.y += 0.01; m.rotation.x += 0.006; return; }
      if (!still) { m.rotation.z += m.userData.spin; m.rotation.x = m.userData.rx + Math.sin(t * .4 + n) * 0.12; m.scale.setScalar(1 + Math.sin(t * 1.2 + n) * 0.03); }
    });
    applyReveals();
    var ch = Math.round(cur * 4);
    if (ch !== active) { active = ch; chaps.forEach(function (c, n) { c.classList.toggle('on', n === ch); }); }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
