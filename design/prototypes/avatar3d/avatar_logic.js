class Component extends DCLogic {
  scanDefaults() { return { fw: 52, jaw: 40, eye: 55, sp: 45, nose: 45, lips: 45, brow: 55, skin: 1, eyeColor: 0, hairColor: 0, hair: 'short', glasses: false, beard: false, view: 0.55 }; }
  constructor(p) {
    super(p);
    this.state = this.scanDefaults();
    this.setHost = (el) => { this.host = el; };
  }
  componentDidMount() { this.init3d(); }
  componentDidUpdate(pp, ps) {
    if (!this.scene) return;
    const s = this.state;
    if (ps.view !== s.view) this.targetRot = s.view;
    const keys = ['fw', 'jaw', 'eye', 'sp', 'nose', 'lips', 'brow', 'skin', 'eyeColor', 'hairColor', 'hair', 'glasses', 'beard'];
    if (keys.some(k => ps[k] !== s[k])) this.rebuild();
  }
  componentWillUnmount() {
    cancelAnimationFrame(this.raf);
    if (this.cleanup) this.cleanup();
    if (this.renderer) this.renderer.dispose();
  }

  // ---------------------------------------------------------------- 3D setup
  init3d() {
    const T = window.THREE;
    if (!T || !this.host) return;
    const w = this.host.clientWidth || 350, h = this.host.clientHeight || 380;
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h);
    renderer.outputEncoding = T.sRGBEncoding;
    this.host.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(26, w / h, 0.1, 100);
    camera.position.set(0, -0.25, 9.4);
    camera.lookAt(0, -0.45, 0);
    scene.add(new T.HemisphereLight(0xf4f2ff, 0x2a2640, 0.42));
    const key = new T.DirectionalLight(0xffffff, 0.78); key.position.set(-1.2, 2.2, 5); scene.add(key);
    const rim = new T.DirectionalLight(0x9aa5ff, 0.7); rim.position.set(3.5, 2, -3.5); scene.add(rim);
    const grad = new T.DataTexture(new Uint8Array([120, 120, 120, 255, 185, 185, 185, 255, 235, 235, 235, 255, 255, 255, 255, 255]), 4, 1, T.RGBAFormat);
    grad.minFilter = grad.magFilter = T.NearestFilter; grad.needsUpdate = true;
    this.T = T; this.scene = scene; this.camera = camera; this.renderer = renderer; this.grad = grad;
    this.rotY = this.state.view; this.targetRot = this.state.view; this.dragging = false;
    this.rebuild();
    const el = renderer.domElement;
    let lastX = 0;
    const down = (e) => { this.dragging = true; lastX = e.clientX; el.setPointerCapture && el.setPointerCapture(e.pointerId); };
    const move = (e) => { if (!this.dragging) return; this.rotY = Math.max(-1.3, Math.min(1.3, this.rotY + (e.clientX - lastX) * 0.012)); this.targetRot = this.rotY; lastX = e.clientX; };
    const up = () => { this.dragging = false; };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up); el.addEventListener('pointerleave', up);
    el.style.touchAction = 'none'; el.style.cursor = 'grab';
    this.cleanup = () => { el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointerleave', up); };
    const t0 = performance.now();
    const tick = () => {
      const t = (performance.now() - t0) / 1000;
      if (!this.dragging) this.rotY += (this.targetRot - this.rotY) * 0.08;
      if (this.avatar) {
        this.avatar.rotation.y = this.rotY + Math.sin(t * 0.6) * 0.04;
        this.avatar.rotation.x = Math.sin(t * 0.45) * 0.015;
        this.avatar.position.y = Math.sin(t * 1.6) * 0.012;
        const b = (t % 4.2);
        const open = b < 0.07 ? 1 - b / 0.07 : (b < 0.14 ? (b - 0.07) / 0.07 : 1);
        (this.eyes || []).forEach(e => { e.scale.y = e.userData.sy * Math.max(0.08, open); });
      }
      renderer.render(scene, camera);
      this.raf = requestAnimationFrame(tick);
    };
    tick();
  }

  rebuild() {
    const T = this.T;
    if (this.avatar) { this.scene.remove(this.avatar); this.avatar.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } }); }
    this.avatar = this.buildAvatar(T, this.state);
    this.scene.add(this.avatar);
  }

  // ---------------------------------------------------------------- the avatar
  buildAvatar(T, s) {
    const n = (k) => s[k] / 100;
    const SKIN = ['#FBE6DA', '#F3D0B8', '#DDAA88', '#B98060', '#8C5C40', '#5F3D2A'][s.skin];
    const HAIR = ['#2B2735', '#5A3A2A', '#8D8A9C', '#D8B46E'][s.hairColor];
    const IRIS = ['#6B3F28', '#2C2440', '#3E6E8E', '#7A6A2E'][s.eyeColor];
    const LINE = 0x1b1620;
    const grad = this.grad;
    const col = (c) => new T.Color(c).convertSRGBToLinear();
    const toon = (c, extra) => new T.MeshToonMaterial(Object.assign({ color: col(c), gradientMap: grad }, extra || {}));
    const outline = (mesh, k) => {
      const o = new T.Mesh(mesh.geometry, new T.MeshBasicMaterial({ color: col('#1b1620'), side: T.BackSide }));
      o.scale.setScalar(1 + (k || 0.035));
      mesh.add(o);
      return mesh;
    };
    const root = new T.Group();

    // --- head shape: anime proportions (big cranium, soft cheeks, small pointed chin)
    const fw = n('fw'), jaw = n('jaw');
    const deform = (x, y, z) => {
      let X = x, Y = y, Z = z;
      const wide = 0.9 + fw * 0.16;
      if (Y > 0) { Y *= 1.06; Z *= 1.03; }
      else {
        const t = Math.min(1, -Y);
        const taper = 1 + ((0.5 + jaw * 0.28) - 1) * Math.pow(t, 1.7);
        X *= taper;
        if (Z > 0) Z *= 1 - 0.16 * Math.pow(t, 2);
        const front = Math.max(0, Math.min(1, (Z + 0.25) / 0.85));
        Y *= 1 + (0.14 + (1 - jaw) * 0.1) * front;
        if (Z > 0) Z += 0.06 * Math.pow(t, 3);
      }
      X *= wide;
      if (Z > 0.32) Z = 0.32 + (Z - 0.32) * 0.8;
      if (Z < 0) Z *= 1.06;
      return [X, Y, Z];
    };
    const surf = (u, v, out) => {
      const z = Math.sqrt(Math.max(0, 1 - u * u - v * v));
      const p = deform(u, v, z);
      const k = 1 + (out || 0);
      return new T.Vector3(p[0] * k, p[1] * k, p[2] * k);
    };
    const hg = new T.SphereGeometry(1, 128, 96);
    const pos = hg.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const base = col(SKIN), blush = col('#EE8C8C'), beardC = col(HAIR);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const p = deform(x, y, z);
      pos.setXYZ(i, p[0], p[1], p[2]);
      const c = base.clone();
      if (z > 0.4) {
        const d = Math.min((x - 0.46) ** 2, (x + 0.46) ** 2) + (y + 0.26) ** 2;
        c.lerp(blush, 0.28 * Math.exp(-d / 0.012));
      }
      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    }
    hg.setAttribute('color', new T.BufferAttribute(colors, 3));
    hg.computeVertexNormals();
    const head = outline(new T.Mesh(hg, toon('#ffffff', { vertexColors: true })), 0.025);
    root.add(head);

    // beard: a sculpted shell on the chin/jaw
    if (s.beard) {
      const bg = new T.SphereGeometry(1, 64, 24, Math.PI * 0.12, Math.PI * 0.76, Math.PI * 0.72, Math.PI * 0.28);
      const bp = bg.attributes.position;
      for (let i = 0; i < bp.count; i++) {
        const p = deform(bp.getX(i), bp.getY(i), bp.getZ(i));
        bp.setXYZ(i, p[0] * 1.018, p[1] * 1.018 - 0.01, p[2] * 1.018 + 0.012);
      }
      bg.computeVertexNormals();
      root.add(outline(new T.Mesh(bg, toon(HAIR, { side: T.DoubleSide })), 0.015));
      const must = new T.Mesh(new T.CapsuleGeometry(0.035, 0.22, 4, 12), toon(HAIR));
      must.rotation.z = Math.PI / 2; must.position.copy(surf(0, -0.43, 0.025)); must.scale.z = 0.6;
      root.add(must);
    }

    // ears
    const earX = deform(1, -0.05, 0)[0];
    [-1, 1].forEach(sd => {
      const e = new T.Mesh(new T.SphereGeometry(1, 24, 16), toon(SKIN));
      e.scale.set(0.11, 0.22, 0.13); e.position.set(sd * (earX - 0.02), -0.08, -0.02);
      root.add(outline(e, 0.12));
    });

    // neck + shoulders (hoodie in class colour)
    const neck = new T.Mesh(new T.CylinderGeometry(0.28, 0.33, 0.8, 32), toon(SKIN));
    neck.position.set(0, -1.3, -0.12); root.add(outline(neck, 0.04));
    const torso = new T.Mesh(new T.CapsuleGeometry(0.62, 1.35, 8, 24), toon('#2E2B5C'));
    torso.rotation.z = Math.PI / 2; torso.scale.set(1, 1, 0.62); torso.position.set(0, -2.15, -0.1);
    root.add(outline(torso, 0.03));
    const collar = new T.Mesh(new T.TorusGeometry(0.42, 0.11, 12, 32), toon('#3B3878'));
    collar.rotation.x = Math.PI / 2; collar.position.set(0, -1.68, -0.06); root.add(outline(collar, 0.05));
    const chest = new T.Mesh(new T.PlaneGeometry(0.42, 0.08), new T.MeshBasicMaterial({ color: 0x818cf8 }));
    chest.position.set(0, -1.98, 0.31); root.add(chest);

    // --- painted anime eyes
    const canvasTex = (w, h, draw) => {
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const g = cv.getContext('2d'); draw(g, w, h);
      const tx = new T.CanvasTexture(cv); tx.encoding = T.sRGBEncoding; tx.anisotropy = 4;
      return tx;
    };
    const eyeTex = canvasTex(256, 256, (g, W, H) => {
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#FFFFFF';
      g.beginPath(); g.moveTo(30, 140); g.quadraticCurveTo(128, 40, 226, 118); g.quadraticCurveTo(140, 236, 30, 140); g.fill();
      g.save(); g.clip();
      const ir = g.createLinearGradient(0, 60, 0, 220);
      ir.addColorStop(0, '#120E18'); ir.addColorStop(0.55, IRIS); ir.addColorStop(1, '#E9E1F5');
      g.fillStyle = ir; g.beginPath(); g.ellipse(132, 140, 62, 80, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#0D0A12'; g.beginPath(); g.ellipse(132, 140, 26, 36, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#0D0A12'; g.lineWidth = 5; g.beginPath(); g.ellipse(132, 140, 62, 80, 0, 0, Math.PI * 2); g.stroke();
      g.restore();
      g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(108, 112, 17, 22, -0.4, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(156, 176, 8, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#17121D'; g.lineCap = 'round'; g.lineWidth = 16;
      g.beginPath(); g.moveTo(22, 146); g.quadraticCurveTo(120, 34, 232, 112); g.stroke();
      g.lineWidth = 10; g.beginPath(); g.moveTo(222, 108); g.lineTo(246, 92); g.stroke();
      g.lineWidth = 4; g.strokeStyle = 'rgba(23,18,29,0.55)';
      g.beginPath(); g.moveTo(70, 196); g.quadraticCurveTo(140, 222, 200, 176); g.stroke();
    });
    const eyeSize = 0.46 * (0.82 + n('eye') * 0.36);
    const eu = 0.3 + n('sp') * 0.1, ev = -0.17;
    this.eyes = [];
    [-1, 1].forEach(sd => {
      const m = new T.Mesh(new T.PlaneGeometry(eyeSize, eyeSize), new T.MeshBasicMaterial({ map: eyeTex, transparent: true, depthWrite: false }));
      const p = surf(sd * eu, ev, 0.012);
      m.position.copy(p);
      m.lookAt(p.clone().multiplyScalar(2).setY(p.y));
      m.scale.x = sd; m.userData.sy = 1;
      m.renderOrder = 2;
      root.add(m); this.eyes.push(m);
    });

    // brows
    const bw = 6 + n('brow') * 10;
    const browTex = canvasTex(256, 64, (g, W, H) => {
      g.clearRect(0, 0, W, H); g.strokeStyle = HAIR; g.lineCap = 'round';
      g.lineWidth = bw; g.beginPath(); g.moveTo(20, 44); g.quadraticCurveTo(120, 14, 236, 30); g.stroke();
    });
    [-1, 1].forEach(sd => {
      const m = new T.Mesh(new T.PlaneGeometry(0.34, 0.085), new T.MeshBasicMaterial({ map: browTex, transparent: true, depthWrite: false }));
      const p = surf(sd * (eu + 0.01), ev + 0.26, 0.016);
      m.position.copy(p); m.lookAt(p.clone().multiplyScalar(2).setY(p.y)); m.scale.x = sd; m.renderOrder = 2;
      root.add(m);
    });

    // nose: small sculpted wedge
    const nw = 0.035 + n('nose') * 0.04;
    const nose = new T.Mesh(new T.ConeGeometry(nw, 0.17, 4), toon(SKIN));
    const np = surf(0, -0.33, -0.005);
    nose.position.copy(np).add(new T.Vector3(0, 0.02, 0.03));
    nose.rotation.x = -0.35; nose.rotation.y = Math.PI / 4; nose.scale.z = 0.7;
    root.add(nose);

    // mouth
    const lw = 0.5 + n('lips') * 0.5;
    const mouthTex = canvasTex(256, 96, (g, W, H) => {
      g.clearRect(0, 0, W, H);
      const half = 70 * lw;
      g.strokeStyle = '#6E2A35'; g.lineCap = 'round'; g.lineWidth = 7;
      g.beginPath(); g.moveTo(128 - half, 40); g.quadraticCurveTo(128, 58 + lw * 8, 128 + half, 40); g.stroke();
      g.fillStyle = 'rgba(214,120,128,0.45)';
      g.beginPath(); g.ellipse(128, 62, half * 0.45, 7 + lw * 4, 0, 0, Math.PI * 2); g.fill();
    });
    const mouth = new T.Mesh(new T.PlaneGeometry(0.42, 0.16), new T.MeshBasicMaterial({ map: mouthTex, transparent: true, depthWrite: false }));
    const mp = surf(0, -0.5, 0.014); mouth.position.copy(mp); mouth.lookAt(mp.clone().multiplyScalar(2).setY(mp.y)); mouth.renderOrder = 2;
    root.add(mouth);

    // --- hair: cap + layered strands
    const hairMat = () => toon(HAIR);
    const strand = (from, to, r, flat) => {
      const dir = to.clone().sub(from); const len = dir.length(); dir.normalize();
      const g = new T.ConeGeometry(r, len, 7, 1);
      const m = new T.Mesh(g, hairMat());
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
      m.position.copy(from).add(dir.clone().multiplyScalar(len / 2));
      m.scale.z = flat || 0.55;
      return outline(m, 0.06);
    };
    const style = s.hair;
    const W = 0.9 + fw * 0.16;
    if (style !== 'none') {
      const fade = style === 'fade';
      const cap = new T.Mesh(new T.SphereGeometry(1, 64, 40, 0, Math.PI * 2, 0, Math.PI * (fade ? 0.52 : 0.6)), hairMat());
      cap.scale.set((fade ? 1.015 : 1.045) * W, fade ? 1.07 : 1.1, fade ? 1.03 : 1.06);
      cap.rotation.x = fade ? -0.6 : -0.55; cap.position.set(0, fade ? 0.04 : 0.06, -0.02);
      root.add(outline(cap, 0.02));
      const nape = new T.Mesh(new T.SphereGeometry(1, 48, 24, Math.PI * 0.88, Math.PI * 1.24, Math.PI * 0.42, Math.PI * (fade ? 0.2 : 0.26)), hairMat());
      nape.scale.set((fade ? 1.01 : 1.035) * W, 1.08, fade ? 1.05 : 1.08); nape.position.set(0, 0.02, -0.02);
      root.add(outline(nape, 0.02));
    }
    if (style === 'short' || style === 'long') {
      const fr = [-0.66, -0.5, -0.33, -0.16, 0, 0.17, 0.34, 0.5, 0.66];
      const lens = [0.26, 0.36, 0.42, 0.33, 0.45, 0.3, 0.4, 0.34, 0.24];
      fr.forEach((u, i) => {
        const from = surf(u * 0.9, 0.66, 0.05);
        const to = surf(u * 1.0 + u * 0.08, 0.66 - lens[i] - 0.12, 0.07);
        root.add(strand(from, to, 0.17, 0.34));
      });
      [-1, 1].forEach(sd => {
        root.add(strand(surf(sd * 0.84, 0.42, 0.08), new T.Vector3(sd * 0.96 * W, style === 'long' ? -0.95 : -0.38, 0.16), 0.15, 0.45));
        root.add(strand(surf(sd * 0.7, 0.62, 0.08), new T.Vector3(sd * 0.98 * W, 0.05, 0.36), 0.13, 0.4));
      });
      const tuft = strand(new T.Vector3(0.05, 1.08, 0.2), new T.Vector3(0.32, 1.42, 0.05), 0.07, 0.6);
      root.add(tuft);
    }
    if (style === 'short') {
      for (let i = 0; i < 7; i++) {
        const a = -1.1 + i * 0.37;
        const from = new T.Vector3(Math.sin(a) * 1.0 * W, 0.35, -Math.cos(a) * 1.1);
        root.add(strand(from, new T.Vector3(Math.sin(a) * 0.92 * W, -0.72, -Math.cos(a) * 1.0), 0.26, 0.5));
      }
    }
    if (style === 'long') {
      const curtain = new T.Mesh(new T.CylinderGeometry(1.0 * W, 1.14 * W, 2.3, 48, 1, true, 1.3, Math.PI * 2 - 2.6), toon(HAIR, { side: T.DoubleSide }));
      curtain.position.set(0, -0.72, -0.06); curtain.scale.z = 0.95;
      root.add(curtain);
      for (let i = 0; i < 11; i++) {
        const a = -1.45 + i * 0.29;
        const from = new T.Vector3(Math.sin(a) * 1.03 * W, -1.6, -Math.cos(a) * 0.95);
        root.add(strand(from, new T.Vector3(Math.sin(a) * 1.06 * W, -2.3 - (i % 3) * 0.12, -Math.cos(a) * 0.9), 0.2, 0.5));
      }
    }
    if (style === 'curly') {
      for (let i = 0; i < 90; i++) {
        const phi = Math.acos(1 - (i + 0.5) / 90 * 1.35);
        const th = i * 2.399;
        const d = new T.Vector3(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
        if (d.z > 0.35 && d.y < 0.62) continue;
        const b = new T.Mesh(new T.IcosahedronGeometry(0.2, 1), hairMat());
        b.position.set(d.x * 1.04 * W, d.y * 1.12 + 0.06, d.z * 1.06);
        root.add(outline(b, 0.07));
      }
    }

    // glasses
    if (s.glasses) {
      const gm = toon('#1F1C2B');
      [-1, 1].forEach(sd => {
        const p = surf(sd * eu, ev, 0.09);
        const rim = new T.Mesh(new T.TorusGeometry(eyeSize * 0.5, 0.018, 8, 40), gm);
        rim.position.copy(p); rim.lookAt(p.clone().multiplyScalar(2).setY(p.y)); rim.scale.set(1.18, 0.86, 1);
        root.add(rim);
        const arm = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 0.9, 8), gm);
        arm.rotation.x = Math.PI / 2; arm.position.set(sd * (earX - 0.05), ev + 0.02, -0.12);
        root.add(arm);
      });
      const bridge = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, (eu - eyeSize * 0.55) * 2, 8), gm);
      bridge.rotation.z = Math.PI / 2; bridge.position.copy(surf(0, ev + 0.04, 0.08));
      root.add(bridge);
    }

    root.position.y = 0.2;
    return root;
  }

  // ---------------------------------------------------------------- template values
  renderVals() {
    const st = this.state, SCAN = this.scanDefaults();
    const sliders = [['fw', 'Face width'], ['jaw', 'Jaw'], ['eye', 'Eye size'], ['sp', 'Eye spacing'], ['nose', 'Nose'], ['lips', 'Lips'], ['brow', 'Brows']].map(([k, label]) => {
      const edited = st[k] !== SCAN[k];
      return { label, v: st[k], tag: edited ? 'edited' : 'from scan', tagFg: edited ? '#FBBF24' : '#86EFAC', set: (e) => this.setState({ [k]: Number(e.target.value) }) };
    });
    const sw = (list, key, names) => list.map((hex, i) => ({ hex, label: names + ' ' + (i + 1), ring: st[key] === i ? '#F5F5F2' : 'transparent', pick: () => this.setState({ [key]: i }) }));
    const skins = sw(['#FBE6DA', '#F3D0B8', '#DDAA88', '#B98060', '#8C5C40', '#5F3D2A'], 'skin', 'Skin tone');
    const eyesC = sw(['#6B3F28', '#2C2440', '#3E6E8E', '#7A6A2E'], 'eyeColor', 'Eye colour');
    const hairC = sw(['#2B2735', '#5A3A2A', '#8D8A9C', '#D8B46E'], 'hairColor', 'Hair colour');
    const chip = (label, on, pick) => ({ label, pick, bg: on ? '#F5F5F2' : 'transparent', fg: on ? '#111113' : '#D4D4D8', border: on ? '#F5F5F2' : '#3F3F46' });
    const chips = [['short', 'Short'], ['fade', 'Fade'], ['long', 'Long'], ['curly', 'Curly'], ['none', 'No hair']].map(([h, l]) => chip(l, st.hair === h, () => this.setState({ hair: h })))
      .concat([chip('Glasses', st.glasses, () => this.setState({ glasses: !st.glasses })), chip('Beard', st.beard, () => this.setState({ beard: !st.beard }))]);
    const views = [['Front', 0], ['¾', 0.55], ['Side', 1.2]].map(([l, v]) => chip(l, Math.abs(st.view - v) < 0.01, () => this.setState({ view: v })));
    return { setHost: this.setHost, sliders, skins, eyesC, hairC, chips, views, reset: () => this.setState(this.scanDefaults()) };
  }
}
