/**
 * 3D views (Three.js):
 *   'site'  — the real LOLA terrain around the landing site (84 × 84 km), lit by
 *             the Sun from its true direction with cast shadows, the 400 km
 *             horizon silhouette, the Sun and Earth at their true sizes and
 *             positions, their tracks over the stay, and catalogue stars.
 *   'globe' — the whole Moon, relief from LOLA LDEM_4, lit from the true
 *             sub-solar point, with the site, the sub-Earth point and the poles.
 *
 * Adapted from the team's SELENE prototype (public/js/scene.js) for a static
 * site: terrain comes from data/patches.i16 instead of a server.
 * Scene units are kilometres. +X east, +Y up, −Z north.
 */
import * as THREE from '../vendor/three/three.module.min.js';

const DEG = Math.PI / 180;
const R_KM = 1737.4;
const HORIZON_R = 62;     // where the horizon silhouette ring is drawn
const BODY_R = 220;       // distance at which the Sun and Earth are drawn
const STAR_R = 900;
const COL = { indigo: 0x4350ce, rose: 0xe888a0, ice: 0xbfedf8, mist: 0xc9c7db };

class Orbit {
  constructor(camera, dom, target, opts = {}) {
    Object.assign(this, { camera, dom, target, theta: 0, phi: 1.2, radius: 60, minRadius: 14, maxRadius: 190, minPhi: 0.12, maxPhi: Math.PI / 2 - 0.02, enabled: true }, opts);
    this.home = { theta: this.theta, phi: this.phi, radius: this.radius };
    this.pointers = new Map();
    this.pinch = 0;
    const down = e => {
      if (!this.enabled || (e.button !== undefined && e.button > 0)) return;
      try { dom.setPointerCapture?.(e.pointerId); } catch { /* synthetic pointer */ }
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 2) { const [a, b] = [...this.pointers.values()]; this.pinch = Math.hypot(a.x - b.x, a.y - b.y); }
    };
    const move = e => {
      if (!this.enabled || !this.pointers.has(e.pointerId)) return;
      const prev = this.pointers.get(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.pinch > 0) this.zoom(this.pinch / d);
        this.pinch = d;
        return;
      }
      this.theta -= (e.clientX - prev.x) * 0.005;
      this.phi = Math.min(this.maxPhi, Math.max(this.minPhi, this.phi - (e.clientY - prev.y) * 0.005));
    };
    const up = e => { this.pointers.delete(e.pointerId); this.pinch = 0; };
    const wheel = e => {
      if (!this.enabled || !(e.ctrlKey || e.metaKey)) return; // plain scrolling still scrolls the page
      e.preventDefault();
      this.zoom(Math.exp(e.deltaY * 0.0012));
    };
    dom.addEventListener('pointerdown', down);
    dom.addEventListener('pointermove', move);
    dom.addEventListener('pointerup', up);
    dom.addEventListener('pointercancel', up);
    dom.addEventListener('wheel', wheel, { passive: false });
  }
  zoom(f) { this.radius = Math.min(this.maxRadius, Math.max(this.minRadius, this.radius * f)); }
  reset() { Object.assign(this, this.home); }
  update() {
    const s = Math.sin(this.phi), c = Math.cos(this.phi);
    this.camera.position.set(this.target.x + this.radius * s * Math.sin(this.theta), this.target.y + this.radius * c, this.target.z + this.radius * s * Math.cos(this.theta));
    this.camera.lookAt(this.target);
  }
}

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(255,255,255,0.9)');
  gr.addColorStop(0.32, 'rgba(255,255,255,0.26)'); gr.addColorStop(0.62, 'rgba(255,255,255,0.05)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function labelSprite(text, color = '#c9c7db', px = 96) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d');
  g.font = `600 ${px}px Archivo, system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = color; g.fillText(text, 128, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, depthTest: false }));
}

const dirFrom = (azDeg, elDeg) => {
  const a = azDeg * DEG, e = elDeg * DEG;
  return new THREE.Vector3(Math.cos(e) * Math.sin(a), Math.sin(e), -Math.cos(e) * Math.cos(a));
};
/** Moon-fixed lat/lon → unit vector for the globe (lon 0 toward +X, north +Y). */
const moonVec = (lat, lon) => new THREE.Vector3(Math.cos(lat * DEG) * Math.cos(lon * DEG), Math.sin(lat * DEG), -Math.cos(lat * DEG) * Math.sin(lon * DEG));

export class Scene3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x000000, 1);
    this.mode = 'site';
    this.exaggeration = 2;
    this.active = true;
    this.glow = glowTexture();
    this._buildSite();
    this._buildGlobe();
    this._frame = this._frame.bind(this);
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.resize();
    requestAnimationFrame(this._frame);
  }

  /* ------------------------------------------------------------ plumbing */
  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (w < 2 || h < 2) return;
    this.renderer.setSize(w, h, false);
    for (const cam of [this.cam, this.gcam]) { cam.aspect = w / h; cam.updateProjectionMatrix(); }
  }
  _frame() {
    requestAnimationFrame(this._frame);
    if (!this.active || this.canvas.clientWidth < 2) return;
    if (this.mode === 'site') {
      this.orbit.update();
      // keep the camera above the ground it is flying over
      const g = this._groundAt(this.cam.position.x, this.cam.position.z) * this.exaggeration + 2.5;
      if (this.cam.position.y < g) { this.cam.position.y = g; this.cam.lookAt(this.orbit.target); }
      this.renderer.render(this.scene, this.cam);
    }
    else { this.gorbit.update(); this.renderer.render(this.gscene, this.gcam); }
  }
  setActive(on) { this.active = on; if (on) this.resize(); }
  setMode(mode) { this.mode = mode; this.orbit.enabled = mode === 'site'; this.gorbit.enabled = mode === 'globe'; }
  resetView() { (this.mode === 'site' ? this.orbit : this.gorbit).reset(); }
  zoom(f) { (this.mode === 'site' ? this.orbit : this.gorbit).zoom(f); }

  /* ------------------------------------------------------------ site view */
  _buildSite() {
    const s = this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(46, 1, 0.1, 2600);
    this.orbit = new Orbit(this.cam, this.canvas, new THREE.Vector3(0, 1.5, 0), { phi: 1.12, radius: 70 });
    s.add(new THREE.AmbientLight(0x5a60a8, 0.5));              // faint fill so shadowed relief stays readable
    this.sun = new THREE.DirectionalLight(0xfff1ea, 2.6);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -62, right: 62, top: 62, bottom: -62, near: 10, far: 420 });
    this.sun.shadow.bias = -0.0008; this.sun.shadow.normalBias = 0.6;
    s.add(this.sun, this.sun.target);

    this.terrain = new THREE.Group(); s.add(this.terrain);
    this.horizon = new THREE.Group(); s.add(this.horizon);
    this.paths = new THREE.Group(); s.add(this.paths);

    // Sun
    this.sunMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffe3ea }));
    this.sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: COL.rose, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending }));
    // Earth, shaded by the same parallel sunlight so its phase is right
    this.earthMat = new THREE.ShaderMaterial({
      uniforms: { sunDir: { value: new THREE.Vector3(1, 0, 0) }, tint: { value: new THREE.Color(COL.ice) } },
      vertexShader: 'varying vec3 vN; void main(){ vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 sunDir; uniform vec3 tint; varying vec3 vN; void main(){ float l = smoothstep(-0.05, 0.25, dot(normalize(vN), sunDir)); gl_FragColor = vec4(tint * (0.06 + 0.94 * l), 1.0); }'
    });
    this.earthMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), this.earthMat);
    this.earthGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.glow, color: COL.ice, transparent: true, opacity: 0.25, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.earthLink = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)]),
      new THREE.LineDashedMaterial({ color: COL.ice, transparent: true, opacity: 0.35, dashSize: 2, gapSize: 2, depthWrite: false }));
    s.add(this.sunMesh, this.sunGlow, this.earthMesh, this.earthGlow, this.earthLink);

    // Site marker
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.08;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    mast.position.y = 1.1;
    this.marker = new THREE.Group(); this.marker.add(ring, mast); s.add(this.marker);

    // Compass
    const comp = new THREE.Group();
    for (const [txt, az] of [['N', 0], ['E', 90], ['S', 180], ['W', 270]]) {
      const sp = labelSprite(txt, az === 0 ? '#ffffff' : '#c9c7db');
      const d = dirFrom(az, 0).multiplyScalar(HORIZON_R + 3.5);
      sp.position.set(d.x, 2.2, d.z); sp.scale.set(5, 2.5, 1); comp.add(sp);
    }
    s.add(comp);

    this.stars = null;
  }

  /**
   * @param {object} patch { size, halfM, heights:Int16Array (m above sphere), ground (m) }
   */
  setTerrain(patch) {
    this.terrain.clear();
    this._patch = patch;
    if (!patch) return;
    const n = patch.size, half = patch.halfM / 1000, step = 2 * half / (n - 1);
    const pos = new Float32Array(n * n * 3), col = new Float32Array(n * n * 3);
    let lo = Infinity, hi = -Infinity;
    const ys = new Float32Array(n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = -half + i * step, north = half - j * step, d = Math.hypot(x, north);
      const y = (patch.heights[j * n + i] - patch.ground) / 1000 - R_KM * (1 - Math.cos(d / R_KM)); // curvature drop
      ys[j * n + i] = y; lo = Math.min(lo, y); hi = Math.max(hi, y);
    }
    this._ys = ys;
    const a = new THREE.Color(0x56546e), b = new THREE.Color(0xd9d7e6), c = new THREE.Color();
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const k = j * n + i;
      pos[k * 3] = -half + i * step; pos[k * 3 + 1] = ys[k]; pos[k * 3 + 2] = -(half - j * step);
      c.copy(a).lerp(b, (ys[k] - lo) / Math.max(1e-6, hi - lo));
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    }
    const idx = new Uint32Array((n - 1) * (n - 1) * 6);
    let q = 0;
    for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
      const p = j * n + i;
      idx[q++] = p; idx[q++] = p + n; idx[q++] = p + 1; idx[q++] = p + 1; idx[q++] = p + n; idx[q++] = p + n + 1;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 }));
    mesh.castShadow = mesh.receiveShadow = true;
    this.terrain.add(mesh);
    // 10 km range rings for scale
    for (const r of [10, 20, 30, 40]) {
      const pts = [];
      for (let k = 0; k <= 96; k++) { const t = k / 96 * Math.PI * 2; pts.push(new THREE.Vector3(Math.sin(t) * r, 0, Math.cos(t) * r)); }
      const ringLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: COL.indigo, transparent: true, opacity: 0.35, depthTest: false }));
      ringLine.userData.flat = true;
      this.terrain.add(ringLine);
    }
    this.setExaggeration(this.exaggeration);
  }

  _groundAt(x, z) {
    const p = this._patch;
    if (!p || !this._ys) return -Infinity;
    const half = p.halfM / 1000, n = p.size;
    const i = Math.round((Math.max(-half, Math.min(half, x)) + half) / (2 * half) * (n - 1));
    const j = Math.round((half + Math.max(-half, Math.min(half, z))) / (2 * half) * (n - 1));
    return this._ys[j * n + i];
  }

  setExaggeration(f) {
    this.exaggeration = f;
    this.terrain.scale.y = f;
    this.terrain.children.forEach(ch => { if (ch.userData.flat) ch.scale.y = 1 / f; });
  }

  /** Far horizon (out to 400 km) as a silhouette wall at HORIZON_R. */
  setHorizon(elevs) {
    this.horizon.clear();
    if (!elevs) return;
    const n = elevs.length, pos = [], idx = [], top = [];
    for (let b = 0; b < n; b++) {
      const d = dirFrom(b * 360 / n, 0);
      const y = Math.tan(Math.max(-4, Math.min(30, elevs[b])) * DEG) * HORIZON_R;
      top.push(new THREE.Vector3(d.x * HORIZON_R, y, d.z * HORIZON_R));
      pos.push(d.x * HORIZON_R, y, d.z * HORIZON_R, d.x * HORIZON_R, -30, d.z * HORIZON_R);
    }
    for (let b = 0; b < n; b++) { const a = b * 2, c = ((b + 1) % n) * 2; idx.push(a, a + 1, c, c, a + 1, c + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
    this.horizon.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0x0b0d24, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })));
    this.horizon.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([...top, top[0]]), new THREE.LineBasicMaterial({ color: COL.mist, transparent: true, opacity: 0.8 })));
  }

  setPaths(samples) {
    this.paths.clear();
    const build = (azK, elK, visK, color) => {
      let run = [], vis = null;
      const flush = () => {
        if (run.length > 1) this.paths.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(run), new THREE.LineBasicMaterial({ color, transparent: true, opacity: vis ? 0.9 : 0.25, depthWrite: false })));
      };
      for (const s of samples) {
        const p = dirFrom(s[azK], s[elK]).multiplyScalar(BODY_R * 0.97);
        if (vis !== null && s[visK] !== vis) { run.push(p); flush(); run = []; }
        vis = s[visK]; run.push(p);
      }
      flush();
    };
    build('sunAz', 'sunEl', 'sun', COL.rose);
    build('earthAz', 'earthEl', 'earth', COL.ice);
  }

  /** @param {object} s timeline sample; sky: 9-number J2000→ENU matrix */
  setState(s, sky) {
    const sd = dirFrom(s.sunAz, s.sunEl), ed = dirFrom(s.earthAz, s.earthEl);
    const sp = sd.clone().multiplyScalar(BODY_R), ep = ed.clone().multiplyScalar(BODY_R);
    const sr = BODY_R * Math.tan(0.2666 * DEG), er = BODY_R * Math.tan(0.95 * DEG); // true angular radii
    this.sunMesh.position.copy(sp); this.sunMesh.scale.setScalar(sr);
    this.sunGlow.position.copy(sp); this.sunGlow.scale.setScalar(sr * 14);
    this.earthMesh.position.copy(ep); this.earthMesh.scale.setScalar(er);
    this.earthGlow.position.copy(ep); this.earthGlow.scale.setScalar(er * 3.2);
    this.earthMat.uniforms.sunDir.value.copy(sd);
    this.sunGlow.material.opacity = s.sun ? 0.9 : 0.25;
    this.earthMesh.material.opacity = 1;
    this.sun.position.copy(sd).multiplyScalar(200);
    this.sun.target.position.set(0, 0, 0);
    this.sun.intensity = s.sun ? 2.6 : 0;   // far terrain (beyond this patch) already blocks the Sun
    const lp = this.earthLink.geometry.getAttribute('position');
    lp.setXYZ(0, 0, 0.4, 0); lp.setXYZ(1, ep.x, ep.y, ep.z); lp.needsUpdate = true;
    this.earthLink.computeLineDistances();
    this.earthLink.visible = s.earth;
    if (sky) this._placeStars(sky);
  }

  lookToward(azDeg) { this.orbit.theta = -azDeg * DEG; this.orbit.phi = 1.12; this.orbit.home = { theta: this.orbit.theta, phi: 1.12, radius: 70 }; this.orbit.radius = 70; }

  setStars(catalogue) {
    const n = catalogue.length;
    this._eq = new Float32Array(n * 3);
    const col = new Float32Array(n * 3), size = new Float32Array(n);
    catalogue.forEach((st, i) => {
      const ra = st.ra * 15 * DEG, dec = st.dec * DEG;
      this._eq.set([Math.cos(dec) * Math.cos(ra), Math.cos(dec) * Math.sin(ra), Math.sin(dec)], i * 3);
      const b = Math.max(0.25, Math.min(1.4, 1.3 - (st.mag ?? 4) * 0.2));
      size[i] = b; col.set([0.82 * b, 0.84 * b, 0.95 * b], i * 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    const m = new THREE.ShaderMaterial({
      vertexShader: 'attribute float aSize; varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = clamp(aSize * 3.2, 1.0, 5.0); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'varying vec3 vC; void main(){ float d = length(gl_PointCoord - vec2(0.5)); float a = smoothstep(0.5, 0.05, d); if (a < 0.02) discard; gl_FragColor = vec4(vC, a); }',
      vertexColors: true, transparent: true, depthWrite: false
    });
    this.stars = new THREE.Points(g, m); this.stars.frustumCulled = false;
    this.scene.add(this.stars);
    if (this._sky) this._placeStars(this._sky);
  }
  _placeStars(m) {
    this._sky = m;
    if (!this.stars) return;
    const attr = this.stars.geometry.getAttribute('position'), a = attr.array, e = this._eq;
    for (let i = 0; i < attr.count; i++) {
      const x = e[i * 3], y = e[i * 3 + 1], z = e[i * 3 + 2];
      const east = m[0] * x + m[1] * y + m[2] * z, north = m[3] * x + m[4] * y + m[5] * z, up = m[6] * x + m[7] * y + m[8] * z;
      a[i * 3] = east * STAR_R; a[i * 3 + 1] = up > -0.02 ? up * STAR_R : -5000; a[i * 3 + 2] = -north * STAR_R;
    }
    attr.needsUpdate = true;
  }

  /* ----------------------------------------------------------- globe view */
  _buildGlobe() {
    const s = this.gscene = new THREE.Scene();
    this.gcam = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
    this.gorbit = new Orbit(this.gcam, this.canvas, new THREE.Vector3(), { phi: Math.PI / 2, radius: 46, minRadius: 16, maxRadius: 90, minPhi: 0.05, maxPhi: Math.PI - 0.05, enabled: false });
    s.add(new THREE.AmbientLight(0x4350ce, 0.22));
    this.gsun = new THREE.DirectionalLight(0xffffff, 2.8); s.add(this.gsun);
    // Sphere with our own UVs: u = lon/360 (0..360 E), v = (lat+90)/180
    const W = 192, H = 96, pos = [], uv = [], idx = [];
    for (let j = 0; j <= H; j++) for (let i = 0; i <= W; i++) {
      const lat = 90 - j * 180 / H, lon = i * 360 / W, v = moonVec(lat, lon).multiplyScalar(10);
      pos.push(v.x, v.y, v.z); uv.push(i / W, 1 - j / H);
    }
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const a = j * (W + 1) + i, b = a + W + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map(v => v / 10), 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    this.moonMat = new THREE.MeshStandardMaterial({ color: 0xb9b7c9, roughness: 1, metalness: 0 });
    this.moon = new THREE.Mesh(g, this.moonMat); s.add(this.moon);
    // markers
    const dot = (color, r) => new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshBasicMaterial({ color }));
    this.gSite = dot(0xffffff, 0.16); this.gSiteRing = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 8, 40), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    this.gEarthDot = dot(COL.ice, 0.14); this.gSunDot = dot(COL.rose, 0.14);
    const line = color => new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 1, 0)]), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 }));
    this.gEarthLine = line(COL.ice); this.gSunLine = line(COL.rose);
    const axis = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -12.5, 0), new THREE.Vector3(0, 12.5, 0)]), new THREE.LineBasicMaterial({ color: COL.indigo, transparent: true, opacity: 0.8 }));
    this.gEarthLbl = labelSprite('Earth', '#bfedf8', 64); this.gEarthLbl.scale.set(3.4, 1.7, 1);
    this.gSunLbl = labelSprite('Sun', '#e888a0', 64); this.gSunLbl.scale.set(3.4, 1.7, 1);
    const nl = labelSprite('N', '#c9c7db', 72); nl.position.set(0, 13.4, 0); nl.scale.set(2.4, 1.2, 1);
    const sl = labelSprite('S', '#c9c7db', 72); sl.position.set(0, -13.4, 0); sl.scale.set(2.4, 1.2, 1);
    s.add(this.gSite, this.gSiteRing, this.gEarthDot, this.gSunDot, this.gEarthLine, this.gSunLine, axis, this.gEarthLbl, this.gSunLbl, nl, sl);
  }

  /**
   * Load NASA's Moon model (SVS 14959, moon_small.glb: a cube-sphere with one
   * colour texture, no compression) with a minimal GLB reader, and replace the
   * LOLA-shaded sphere with it. The model has north on +Y and longitude 0 on
   * −Z, found by matching its albedo to LOLA elevation; our globe frame has
   * longitude 0 on +X, hence the −90° turn about Y.
   */
  /** Fetch with progress so the UI can show how much of the 14 MB model has arrived. */
  async _fetchBuffer(url, onProgress) {
    // Keep the model in the browser's Cache Storage so later visits skip the download.
    // Every copy is checked before it is used or stored, so a broken download can never stick.
    let cache = null;
    try {
      cache = await caches.open(MODEL_CACHE);
      caches.keys().then(ks => ks.filter(k => k.startsWith('aphelion-models') && k !== MODEL_CACHE).forEach(k => caches.delete(k))).catch(() => {});
      const hit = await cache.match(url);
      if (hit) {
        const buf = await hit.arrayBuffer();
        if (glbComplete(buf)) { onProgress?.(1); return buf; }
        await cache.delete(url);
      }
    } catch { cache = null; }
    const buf = await this._download(url, onProgress);
    if (!glbComplete(buf)) throw new Error(`incomplete download of ${url} (${buf.byteLength} bytes)`);
    try { await cache?.put(url, new Response(buf.slice(0), { headers: { 'content-type': 'model/gltf-binary' } })); } catch { /* storage full or blocked: fine */ }
    return buf;
  }

  /** Download in chunks so progress can be shown. Content-Length is the compressed size when the
   *  server gzips the file, so it is only used for the progress estimate, never to size the buffer. */
  async _download(url, onProgress) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    if (!res.body || !onProgress) return res.arrayBuffer();
    const expect = Number(res.headers.get('x-glb-bytes')) || this._expectedBytes || Number(res.headers.get('content-length')) || 0;
    const reader = res.body.getReader(), parts = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value); got += value.length;
      if (expect) onProgress(Math.min(0.99, got / expect));
    }
    const out = new Uint8Array(got);
    let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
    onProgress(1);
    return out.buffer;
  }

  /** Decode the embedded texture. Tries createImageBitmap, then an <img>; shrinks it if the GPU cannot hold it. */
  async _decodeTexture(blob) {
    let src;
    try { src = await createImageBitmap(blob); }
    catch {
      const u = URL.createObjectURL(blob);
      try { src = await new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => no(new Error('texture decode failed')); im.src = u; }); }
      finally { setTimeout(() => URL.revokeObjectURL(u), 1000); }
    }
    const max = Math.min(this.renderer.capabilities.maxTextureSize, 8192), w = src.width, h = src.height;
    if (w > max || h > max) {
      const k = max / Math.max(w, h), c = document.createElement('canvas');
      c.width = Math.round(w * k); c.height = Math.round(h * k);
      c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
      src = c;
    }
    return src;
  }

  async loadMoonModel(url, onProgress, expectedBytes) {
    if (onProgress) this._progress = onProgress;
    if (this._modelPromise) return this._modelPromise;
    this._expectedBytes = expectedBytes;
    this._modelPromise = (async () => {
      const buf = await this._fetchBuffer(url, f => this._progress?.(f));
      const dv = new DataView(buf);
      if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('not a GLB file');
      const jl = dv.getUint32(12, true);
      const json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl)));
      const bin = 20 + jl + 8;
      const view = (i, Type, n) => {
        const a = json.accessors[i], v = json.bufferViews[a.bufferView];
        return new Type(buf.slice(bin + (v.byteOffset || 0) + (a.byteOffset || 0), bin + (v.byteOffset || 0) + (a.byteOffset || 0) + a.count * n * Type.BYTES_PER_ELEMENT));
      };
      const prim = json.meshes[0].primitives[0];
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(view(prim.attributes.POSITION, Float32Array, 3), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(view(prim.attributes.NORMAL, Float32Array, 3), 3));
      g.setAttribute('uv', new THREE.BufferAttribute(view(prim.attributes.TEXCOORD_0, Float32Array, 2), 2));
      const it = json.accessors[prim.indices].componentType;
      g.setIndex(new THREE.BufferAttribute(view(prim.indices, it === 5125 ? Uint32Array : Uint16Array, 1), 1));
      g.computeBoundingSphere();
      const img = json.images[json.textures[json.materials[prim.material ?? 0].pbrMetallicRoughness.baseColorTexture.index].source];
      const iv = json.bufferViews[img.bufferView];
      const pic = await this._decodeTexture(new Blob([buf.slice(bin + (iv.byteOffset || 0), bin + (iv.byteOffset || 0) + iv.byteLength)], { type: img.mimeType || 'image/png' }));
      const tex = new THREE.Texture(pic);
      tex.flipY = false; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy()); tex.needsUpdate = true;
      const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 }));
      mesh.scale.setScalar(10 / g.boundingSphere.radius);
      mesh.rotation.y = -Math.PI / 2;
      this.gscene.add(mesh);
      this.moon.visible = false;
      this.moonModel = mesh; this.modelError = null;
      return true;
    })().catch(err => { console.warn('[3D] NASA Moon model unavailable, using LOLA relief sphere', err); this.modelError = String(err?.message || err); this._modelPromise = null; return false; });
    return this._modelPromise;
  }

  /** Build colour + normal maps from the LOLA LDEM_4 global grid (1440 × 720, lon 0..360). */
  setGlobeRelief(dem) {
    if (this._relief || !dem) return;
    this._relief = true;
    const w = dem.samples, h = dem.rows, d = dem.data, sc = dem.dnScale;
    const cc = document.createElement('canvas'), nc = document.createElement('canvas');
    cc.width = nc.width = w; cc.height = nc.height = h;
    const cg = cc.getContext('2d'), ng = nc.getContext('2d');
    const ci = cg.createImageData(w, h), ni = ng.createImageData(w, h);
    const cell = 2 * Math.PI * 1737400 / w, EX = 6; // relief exaggeration for legibility at globe scale
    for (let y = 0; y < h; y++) {
      const lat = 90 - (y + 0.5) * 180 / h, cl = Math.max(0.05, Math.cos(lat * DEG));
      const yu = Math.max(0, y - 1), yd = Math.min(h - 1, y + 1);
      for (let x = 0; x < w; x++) {
        const xl = (x + w - 1) % w, xr = (x + 1) % w, k = (y * w + x) * 4;
        const dzdx = (d[y * w + xr] - d[y * w + xl]) * sc / (2 * cell * cl);
        const dzdy = (d[yu * w + x] - d[yd * w + x]) * sc / ((yd - yu) * cell);
        let nx = -dzdx * EX, ny = -dzdy * EX, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
        ni.data[k] = (nx * 0.5 + 0.5) * 255; ni.data[k + 1] = (ny * 0.5 + 0.5) * 255; ni.data[k + 2] = (nz * 0.5 + 0.5) * 255; ni.data[k + 3] = 255;
        const t = Math.max(0, Math.min(1, (d[y * w + x] * sc + 6000) / 12000)), v = 105 + 150 * t;
        ci.data[k] = v; ci.data[k + 1] = v; ci.data[k + 2] = v * 1.04; ci.data[k + 3] = 255;
      }
    }
    cg.putImageData(ci, 0, 0); ng.putImageData(ni, 0, 0);
    const ct = new THREE.CanvasTexture(cc), nt = new THREE.CanvasTexture(nc);
    ct.colorSpace = THREE.SRGBColorSpace; ct.wrapS = nt.wrapS = THREE.RepeatWrapping;
    this.moonMat.map = ct; this.moonMat.normalMap = nt; this.moonMat.color.set(0xffffff); this.moonMat.needsUpdate = true;
  }

  /** @param {object} g { lat, lon, sun:{lat,lon}, earth:{lat,lon} } all Moon-fixed degrees */
  setGlobeState(g, recenter) {
    const site = moonVec(g.lat, g.lon), sun = moonVec(g.sun.lat, g.sun.lon), earth = moonVec(g.earth.lat, g.earth.lon);
    this.gsun.position.copy(sun).multiplyScalar(100);
    this.gSite.position.copy(site).multiplyScalar(10.05);
    this.gSiteRing.position.copy(site).multiplyScalar(10.06); this.gSiteRing.lookAt(site.clone().multiplyScalar(30));
    const put = (dot, ln, lbl, v) => {
      dot.position.copy(v).multiplyScalar(10.05);
      const p = ln.geometry.getAttribute('position'); const a = v.clone().multiplyScalar(10.1), b = v.clone().multiplyScalar(15);
      p.setXYZ(0, a.x, a.y, a.z); p.setXYZ(1, b.x, b.y, b.z); p.needsUpdate = true;
      lbl.position.copy(v).multiplyScalar(16.4);
    };
    put(this.gEarthDot, this.gEarthLine, this.gEarthLbl, earth);
    put(this.gSunDot, this.gSunLine, this.gSunLbl, sun);
    if (recenter) {
      // Look at the site from slightly toward the equator so polar sites sit near the limb, not dead centre.
      const viewLat = Math.max(-62, Math.min(62, g.lat));
      this.gorbit.phi = (90 - viewLat) * DEG; this.gorbit.theta = Math.atan2(site.x, site.z);
      if (Math.abs(g.lat) > 89.9) this.gorbit.theta = 0;
      this.gorbit.radius = 46; this.gorbit.home = { theta: this.gorbit.theta, phi: this.gorbit.phi, radius: 46 };
    }
  }
}

const MODEL_CACHE = 'aphelion-models-v2';

/** True when the buffer is a whole GLB file: right magic number and the length its header declares. */
function glbComplete(buf) {
  if (!buf || buf.byteLength < 20) return false;
  const dv = new DataView(buf);
  return dv.getUint32(0, true) === 0x46546c67 && dv.getUint32(8, true) === buf.byteLength;
}

export function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch { return false; }
}
