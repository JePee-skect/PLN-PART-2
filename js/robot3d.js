/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   Robot 3D Three.js: Asisten Virtual Concierge K3 "PLN ners"
   Desain Futuristik, Elegan & Profesional Khas PT PLN (Persero)
   Dilengkapi Helm K3 Kuning PLN, Visor Digital, Rompi & Lencana Korporat
   ===================================================================== */

let renderer, scene, camera, rig, robot;
let wasDragged = false;
let mouseTargetX = 0;
let mouseTargetY = 0;

function initRobot3D() {
  enableDrag();
  enableCursorTracking();

  try {
    const canvas = $('#fabc');
    if (!canvas || typeof THREE === 'undefined') return;

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

    // Retina HD Ultra-Sharp Rendering
    const pr = Math.min(window.devicePixelRatio || 1, 2.5);
    renderer.setPixelRatio(pr);
    renderer.setSize(260, 380, false);

    if (THREE.ACESFilmicToneMapping) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
    }
    if (THREE.sRGBEncoding) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    } else if (THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(36, 260 / 380, 0.1, 50);
    camera.position.set(0, 0.1, 8.0);

    // Pencahayaan Studio Korporat Terang & Bersih
    scene.add(new THREE.AmbientLight(0xffffff, 0.88));

    // Key Light Utama (Putih Terang Bersih dari atas kanan)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.90);
    keyLight.position.set(2.4, 3.8, 4.2);
    scene.add(keyLight);

    // Fill Light Biru Cyan Khas PLN (Memberikan kilau futuristik dari kiri)
    const fillLight = new THREE.DirectionalLight(0x00d2f0, 0.45);
    fillLight.position.set(-2.6, 0.2, 3.2);
    scene.add(fillLight);

    // Rim Light Emas di Belakang (Mempertegas siluet helm & bahu)
    const rimLight = new THREE.DirectionalLight(0xffe600, 0.55);
    rimLight.position.set(0, 3.2, -3.5);
    scene.add(rimLight);

    rig = new THREE.Group();
    scene.add(rig);

    robot = createRobot(THREE);
    rig.add(robot.g);

    requestAnimationFrame(animate);
  } catch (err) {
    console.warn('Three.js init error, fallback emoji:', err);
    const fab = $('#fab');
    if (fab) fab.insertAdjacentHTML('afterbegin', '<div style="font-size:70px">🤖</div>');
  }
}

function enableCursorTracking() {
  window.addEventListener('pointermove', (e) => {
    mouseTargetX = (e.clientX / window.innerWidth - 0.5) * 0.40;
    mouseTargetY = (e.clientY / window.innerHeight - 0.5) * 0.30;
  }, { passive: true });
}

function enableDrag() {
  const bot = $('#bot');
  const fab = $('#fab');
  if (!bot || !fab) return;

  let startX  = 0;
  let startY  = 0;
  let originX = 0;
  let originY = 0;
  let moved   = false;
  let down    = false;

  fab.title = 'Geser untuk memindahkan posisi PLN ners';

  function place(x, y) {
    const w = bot.offsetWidth;
    const h = bot.offsetHeight;
    x = Math.max(0, Math.min(innerWidth - w, x));
    y = Math.max(0, Math.min(innerHeight - h, y));

    Object.assign(bot.style, {
      left:   x + 'px',
      top:    y + 'px',
      right:  'auto',
      bottom: 'auto'
    });

    bot.classList.toggle('left', x + w / 2 < innerWidth / 2);
    bot.classList.toggle('top',  y < 290);
  }

  function end() {
    if (!down) return;
    down = false;
    bot.classList.remove('drag');

    if (moved) {
      wasDragged = true;
      setTimeout(() => { wasDragged = false; }, 60);
      if (typeof store !== 'undefined' && store.set) {
        store.set('vms-pos', {
          x: parseFloat(bot.style.left),
          y: parseFloat(bot.style.top)
        });
      }
    }
  }

  fab.addEventListener('pointerdown', (e) => {
    down    = true;
    moved   = false;
    startX  = e.clientX;
    startY  = e.clientY;

    const r = bot.getBoundingClientRect();
    originX = r.left;
    originY = r.top;
    bot.classList.add('drag');
  });

  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    place(originX + dx, originY + dy);
  }, { passive: true });

  fab.addEventListener('pointerup', end);
  fab.addEventListener('pointercancel', end);

  if (typeof store !== 'undefined' && store.get) {
    const saved = store.get('vms-pos', null);
    if (saved && isFinite(saved.x) && isFinite(saved.y)) {
      place(saved.x, saved.y);
    }
  }

  window.addEventListener('resize', () => {
    if (bot.style.left) {
      place(parseFloat(bot.style.left), parseFloat(bot.style.top));
    }
  });
}

/**
 * Texture Logo Resmi Miniatur untuk Helm K3 PLN (256x256)
 */
function createHelmetPLNLogo(T) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Latar kuning PLN
  ctx.fillStyle = '#ffe600';
  ctx.fillRect(0, 0, 256, 256);

  // Border putih & emas
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, 244, 244);

  // Tiga Gelombang Air Biru
  ctx.strokeStyle = '#0093d8';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let row = 0; row < 3; row++) {
    const y = 60 + row * 45;
    ctx.beginPath();
    ctx.moveTo(25, y);
    ctx.bezierCurveTo(70, y - 20, 110, y + 20, 145, y);
    ctx.bezierCurveTo(180, y - 20, 215, y + 20, 230, y);
    ctx.stroke();
  }

  // Kilat Petir Merah PLN
  ctx.fillStyle = '#ed1c24';
  ctx.strokeStyle = '#b8141b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(148, 16);
  ctx.lineTo(80,  125);
  ctx.lineTo(135, 125);
  ctx.lineTo(122, 220);
  ctx.lineTo(195, 110);
  ctx.lineTo(148, 110);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Teks PLN
  ctx.fillStyle = '#002855';
  ctx.font = '900 50px "Poppins", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PLN', 128, 216);

  const canvasTex = new T.CanvasTexture(canvas);
  canvasTex.generateMipmaps = true;

  return new T.MeshBasicMaterial({
    map: canvasTex,
    side: T.DoubleSide
  });
}

/**
 * Texture Name Tag Korporat Elegan "PLN ners" (512x200)
 */
function createCompactBadgeTexture(T) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');

  function renderBadge(imgObj) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 200);

    // Bingkai emas mewah
    ctx.strokeStyle = '#f2c94c';
    ctx.lineWidth = 8;
    ctx.strokeRect(5, 5, 502, 190);

    // Logo PLN di kiri
    if (imgObj && imgObj.complete && imgObj.naturalWidth > 0) {
      const dw = 110;
      const dh = Math.round(dw * (imgObj.height / imgObj.width));
      ctx.drawImage(imgObj, 25, (200 - Math.min(dh, 150)) / 2, dw, Math.min(dh, 150));
    } else {
      ctx.fillStyle = '#ffe600';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(25, 25, 110, 110, 12);
      else ctx.fillRect(25, 25, 110, 110);
      ctx.fill();

      ctx.fillStyle = '#002855';
      ctx.font = '900 36px "Poppins", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PLN', 80, 175);
    }

    // Garis pemisah vertikal
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(155, 25);
    ctx.lineTo(155, 175);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#007a87';
    ctx.font = 'bold 20px "Poppins", Arial, sans-serif';
    ctx.fillText('PT PLN (PERSERO) PUSHARLIS', 175, 55);

    ctx.fillStyle = '#002855';
    ctx.font = '900 48px "Poppins", Arial, sans-serif';
    ctx.fillText('PLN ners', 175, 112);

    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 18px "Poppins", Arial, sans-serif';
    ctx.fillText('● ASISTEN VIRTUAL K3 & CONCIERGE', 175, 155);
  }

  renderBadge(null);

  const canvasTex = new T.CanvasTexture(canvas);
  canvasTex.generateMipmaps = true;
  canvasTex.minFilter = T.LinearMipmapLinearFilter;
  canvasTex.magFilter = T.LinearFilter;
  if (renderer && renderer.capabilities) {
    canvasTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      renderBadge(img);
      canvasTex.needsUpdate = true;
    };
    img.src = 'img/pln-logo.png';
  } catch (e) {}

  return new T.MeshBasicMaterial({
    map: canvasTex,
    side: T.DoubleSide
  });
}

/**
 * Pembuatan Model 3D Robot Asisten Virtual PLN ners
 * Desain Bersih, Modern, Formal & Ramah
 */
function createRobot(T) {
  const mat = (color, opt = {}) => new T.MeshStandardMaterial({
    color,
    roughness: 0.22,
    metalness: 0.15,
    ...opt
  });

  const C = {
    // Sasis keramik putih aerodinamis mengkilap
    ceramic:       mat(0xffffff, { roughness: 0.14, metalness: 0.08 }),
    chassisDark:   mat(0x13232c, { roughness: 0.25, metalness: 0.40 }),
    plnTeal:       mat(0x186174, { roughness: 0.20, metalness: 0.30 }),
    plnNavy:       mat(0x144456, { roughness: 0.22, metalness: 0.25 }),
    gold:          mat(0xf5c518, { roughness: 0.16, metalness: 0.85 }),
    silver:        mat(0xd4dee6, { roughness: 0.18, metalness: 0.75 }),
    visor:         mat(0x060e15, { roughness: 0.04, metalness: 0.94 }),
    cyanGlow:      mat(0x00e5ff, { emissive: 0x00e5ff, emissiveIntensity: 1.8 }),
    yellowGlow:    mat(0xffe600, { emissive: 0xffaa00, emissiveIntensity: 1.6 }),
    eyeSparkle:    mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1.4 }),
    helmetYellow:  mat(0xffcc00, { roughness: 0.18, metalness: 0.15 }),
    reflective:    mat(0xf8fafc, { roughness: 0.08, metalness: 0.95, emissive: 0x8899aa, emissiveIntensity: 0.30 })
  };

  const ball = (r, m, [sx, sy, sz], [x, y, z], parent, seg = 48) => {
    const o = new T.Mesh(new T.SphereGeometry(r, seg, Math.round(seg * 0.75)), m);
    o.scale.set(sx, sy, sz);
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };

  const cyl = (rt, rb, h, m, [x, y, z], parent, open = false, seg = 40) => {
    const o = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg, 1, open), m);
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };

  const g = new T.Group();

  /* ================= 1. KEPALA, VISOR DIGITAL & HELM K3 PLN ================= */
  const head = new T.Group();
  head.position.y = 1.02;
  g.add(head);

  // Kubah kepala keramik putih mulus berproporsi ramah (smooth droid egg head)
  ball(0.86, C.ceramic, [1.02, 1.06, 0.98], [0, 0, 0], head, 52);

  // Visor kaca obsidian gelap melengkung (wajah digital resolusi tinggi)
  ball(0.72, C.visor, [0.98, 0.78, 0.44], [0, 0.01, 0.64], head, 48);

  // Bezel/frame emas elegan melingkari visor
  const visorTrim = new T.Mesh(
    new T.TorusGeometry(0.72, 0.024, 10, 48, Math.PI * 0.85),
    C.gold
  );
  visorTrim.position.set(0, 0.01, 0.60);
  visorTrim.rotation.x = 0.18;
  head.add(visorTrim);

  // --- HELM KESELAMATAN APD K3 KUNING PLN ---
  // Kubah atas helm
  const helmetDome = new T.Mesh(
    new T.SphereGeometry(0.95, 48, 28, 0, Math.PI * 2, 0, Math.PI * 0.48),
    C.helmetYellow
  );
  helmetDome.scale.set(1.05, 1.08, 1.05);
  helmetDome.position.set(0, 0.22, -0.02);
  helmetDome.rotation.x = -0.08;
  head.add(helmetDome);

  // Lidah / visor depan helm APD K3
  const helmetBrim = new T.Mesh(
    new T.TorusGeometry(0.96, 0.042, 12, 48, Math.PI * 0.64),
    C.helmetYellow
  );
  helmetBrim.position.set(0, 0.20, 0.14);
  helmetBrim.rotation.x = 0.30;
  head.add(helmetBrim);

  // Tulang rusuk penguat aerodinamis atas helm (aerodynamic helmet crown ridge)
  const helmetRidge = cyl(0.038, 0.048, 1.18, C.helmetYellow, [0, 1.18, -0.02], head);
  helmetRidge.rotation.x = Math.PI / 2.05;

  // Pita reflektif perak keselamatan K3 (High-visibility reflective safety strip)
  const helmetReflective = new T.Mesh(
    new T.TorusGeometry(0.99, 0.020, 8, 48, Math.PI * 0.88),
    C.reflective
  );
  helmetReflective.position.set(0, 0.38, -0.02);
  helmetReflective.rotation.x = 0.12;
  head.add(helmetReflective);

  // Emblem Lambang Resmi PT PLN (Persero) di Depan Helm
  const helmetLogoMat = createHelmetPLNLogo(T);
  const helmetLogoBadge = new T.Mesh(new T.PlaneGeometry(0.24, 0.24), helmetLogoMat);
  helmetLogoBadge.position.set(0, 0.68, 0.90);
  helmetLogoBadge.rotation.x = -0.15;
  head.add(helmetLogoBadge);

  const helmetBadgeBezel = new T.Mesh(new T.BoxGeometry(0.26, 0.26, 0.015), C.gold);
  helmetBadgeBezel.position.set(0, 0.68, 0.89);
  helmetBadgeBezel.rotation.x = -0.15;
  head.add(helmetBadgeBezel);

  // --- COMMUNICATOR AUDIO & BOOM MIC PADA TELINGA ---
  [-1, 1].forEach((side) => {
    // Earpod sasis keramik
    const earpod = cyl(0.22, 0.22, 0.14, C.ceramic, [side * 0.94, 0.02, 0], head);
    earpod.rotation.z = Math.PI / 2;

    // Ring emas
    const ring = new T.Mesh(new T.TorusGeometry(0.18, 0.020, 8, 28), C.gold);
    ring.position.set(side * 1.02, 0.02, 0);
    ring.rotation.y = Math.PI / 2;
    head.add(ring);

    // Indikator LED cyan bercahaya
    const led = cyl(0.11, 0.11, 0.025, C.cyanGlow, [side * 1.03, 0.02, 0], head);
    led.rotation.z = Math.PI / 2;
  });

  // Boom Mic di telinga kiri mengarah ke mulut
  const micArm = cyl(0.015, 0.015, 0.38, C.silver, [-0.85, -0.06, 0.32], head);
  micArm.rotation.x = Math.PI / 2.6;
  micArm.rotation.z = -0.36;
  ball(0.035, C.cyanGlow, [1, 1, 1.2], [-0.68, -0.16, 0.60], head);

  // --- MATA DIGITAL LED CYAN RAMAH & MODERN ---
  const eyesGroup = new T.Group();
  head.add(eyesGroup);

  [-1, 1].forEach((side) => {
    const eye = new T.Group();
    eye.position.set(side * 0.28, 0.04, 0.97);
    eye.scale.set(side, 1, 1);
    eyesGroup.add(eye);

    // Bentuk mata LED melengkung ramah (friendly smiling curved capsule)
    const eyeArc = new T.Mesh(
      new T.TorusGeometry(0.125, 0.028, 10, 32, Math.PI * 0.68),
      C.cyanGlow
    );
    eyeArc.rotation.z = Math.PI * 0.16;
    eye.add(eyeArc);

    // Titik kilau LED digital
    ball(0.032, C.eyeSparkle, [1, 1, 0.6], [0.03, 0.05, 0.02], eye);
    ball(0.018, C.eyeSparkle, [1, 1, 0.6], [-0.04, 0.00, 0.02], eye);
  });

  // --- MULUT INDIKATOR GELOMBANG DIGITAL (VOICE WAVEFORM) ---
  const smile = new T.Mesh(
    new T.TorusGeometry(0.10, 0.016, 8, 24, Math.PI * 0.58),
    C.cyanGlow
  );
  smile.rotation.z = Math.PI * 1.21;
  smile.position.set(0, -0.18, 0.98);
  head.add(smile);

  const mouthBars = [];
  const barSpacing = 0.052;
  for (let i = -2; i <= 2; i++) {
    const bar = new T.Mesh(new T.BoxGeometry(0.022, 0.09, 0.02), C.cyanGlow);
    bar.position.set(i * barSpacing, -0.18, 0.99);
    bar.scale.y = 0.2;
    head.add(bar);
    mouthBars.push(bar);
  }

  /* ================= 2. LEHER & BADAN KORPORAT PLN ================= */
  // Sendi leher mekanis titanium
  cyl(0.18, 0.22, 0.20, C.silver, [0, 0.02, 0], g);
  const neckRing = cyl(0.24, 0.24, 0.035, C.gold, [0, 0.00, 0], g);
  cyl(0.20, 0.20, 0.015, C.cyanGlow, [0, 0.04, 0], g);

  const torso = new T.Group();
  torso.position.y = -0.66;
  g.add(torso);

  // Bodi sasis keramik putih aerodinamis
  ball(0.78, C.ceramic, [0.78, 0.92, 0.60], [0, 0, 0], torso, 48);

  // Rompi Keselamatan K3 PLN Signature Teal & High-Vis Yellow
  [-0.26, 0.26].forEach((x, idx) => {
    const side = (idx === 0) ? -1 : 1;
    // Panel dada teal
    const vestPanel = new T.Mesh(new T.BoxGeometry(0.25, 0.54, 0.06), C.plnTeal);
    vestPanel.position.set(x, 0.12, 0.46);
    vestPanel.rotation.y = side * -0.20;
    vestPanel.rotation.z = side * 0.08;
    torso.add(vestPanel);

    // Garis strip kuning keselamatan K3
    const vestYellow = new T.Mesh(new T.BoxGeometry(0.038, 0.56, 0.07), C.helmetYellow);
    vestYellow.position.set(x - side * 0.11, 0.12, 0.48);
    vestYellow.rotation.y = side * -0.20;
    vestYellow.rotation.z = side * 0.08;
    torso.add(vestYellow);

    // Strip reflektif perak
    const vestReflective = new T.Mesh(new T.BoxGeometry(0.018, 0.56, 0.075), C.reflective);
    vestReflective.position.set(x - side * 0.08, 0.12, 0.49);
    vestReflective.rotation.y = side * -0.20;
    vestReflective.rotation.z = side * 0.08;
    torso.add(vestReflective);
  });

  // Reaktor Daya Listrik Pusat / Arc Core Petir PLN di Tengah Dada
  const coreBezel = cyl(0.14, 0.14, 0.04, C.gold, [0, 0.18, 0.50], torso);
  coreBezel.rotation.x = Math.PI / 2;

  const arcCore = cyl(0.10, 0.10, 0.05, C.cyanGlow, [0, 0.18, 0.51], torso);
  arcCore.rotation.x = Math.PI / 2;

  // Lambang kilat emas di atas reaktor
  const lightningCore = new T.Mesh(new T.ConeGeometry(0.04, 0.08, 3), C.yellowGlow);
  lightningCore.position.set(0, 0.18, 0.54);
  lightningCore.rotation.z = Math.PI;
  torso.add(lightningCore);

  // Lencana Name Tag "PLN ners"
  const compactBadgeMat = createCompactBadgeTexture(T);
  const badgeMesh = new T.Mesh(new T.PlaneGeometry(0.36, 0.14), compactBadgeMat);
  badgeMesh.position.set(0.18, 0.18, 0.54);
  badgeMesh.rotation.set(-0.04, -0.16, 0);
  torso.add(badgeMesh);

  const badgeBackplate = new T.Mesh(new T.BoxGeometry(0.38, 0.16, 0.015), C.gold);
  badgeBackplate.position.set(0.18, 0.18, 0.53);
  badgeBackplate.rotation.set(-0.04, -0.16, 0);
  torso.add(badgeBackplate);

  // Sabuk pinggang navy & emas
  cyl(0.48, 0.48, 0.045, C.plnNavy, [0, -0.32, 0], torso);
  const beltTrim = cyl(0.49, 0.49, 0.015, C.gold, [0, -0.32, 0], torso);
  const beltBuckle = cyl(0.07, 0.07, 0.05, C.cyanGlow, [0, -0.32, 0.45], torso);
  beltBuckle.rotation.x = Math.PI / 2;

  /* ================= 3. LENGAN & TANGAN ROBOTIK ARTICULATED ================= */
  function createAndroidHand(side) {
    const handGroup = new T.Group();

    // Telapak tangan robotik putih aerodinamis
    ball(0.092, C.ceramic, [0.95, 0.85, 0.45], [0, -0.068, 0.018], handGroup, 24);
    ball(0.024, C.cyanGlow, [1, 0.6, 0.4], [0, -0.060, -0.028], handGroup, 14);

    // 4 Jari berartikulasi proporsional
    const fingerOffsets = (side === -1)
      ? [0.034, 0.011, -0.011, -0.034]
      : [-0.034, -0.011, 0.011, 0.034];
    const fingerLengths = [0.130, 0.145, 0.128, 0.105];

    fingerOffsets.forEach((fx, idx) => {
      const fLen = fingerLengths[idx];
      const fGroup = new T.Group();
      fGroup.position.set(fx, -0.120, 0.018);
      handGroup.add(fGroup);

      // Buku jari emas
      ball(0.015, C.gold, [1, 1, 1], [0, 0, 0], fGroup, 14);

      // Ruas proksimal
      cyl(0.014, 0.012, fLen * 0.50, C.ceramic, [0, -fLen * 0.25, 0.006], fGroup, false, 14);

      // Sendi tengah perak
      ball(0.012, C.silver, [1, 1, 1], [0, -fLen * 0.50, 0.012], fGroup, 12);

      // Ruas distal
      cyl(0.012, 0.010, fLen * 0.45, C.ceramic, [0, -fLen * 0.725, 0.018], fGroup, false, 14);

      // Ujung jari halus
      ball(0.010, C.silver, [1, 1, 1], [0, -fLen * 0.95, 0.025], fGroup, 12);
    });

    // Ibu Jari (Thumb) di sisi dalam
    const thumbX = (side === -1) ? 0.062 : -0.062;
    const thumbGroup = new T.Group();
    thumbGroup.position.set(thumbX, -0.052, 0.024);
    thumbGroup.rotation.set(-0.25, side * 0.35, side * 0.45);
    handGroup.add(thumbGroup);

    ball(0.016, C.gold, [1, 1, 1], [0, 0, 0], thumbGroup, 14);
    cyl(0.015, 0.013, 0.065, C.ceramic, [side * -0.018, -0.032, 0.006], thumbGroup, false, 14);
    ball(0.012, C.silver, [1, 1, 1], [side * -0.028, -0.065, 0.012], thumbGroup, 12);
    cyl(0.012, 0.010, 0.050, C.ceramic, [side * -0.038, -0.090, 0.018], thumbGroup, false, 14);
    ball(0.010, C.silver, [1, 1, 1], [side * -0.045, -0.115, 0.025], thumbGroup, 12);

    return handGroup;
  }

  // --- LENGAN KIRI (PENGARAH KE FORMULIR) ---
  const leftShoulder = new T.Group();
  leftShoulder.position.set(-0.56, 0.20, 0.04);
  torso.add(leftShoulder);

  ball(0.16, C.ceramic, [1, 1, 1], [0, 0, 0], leftShoulder, 32);
  cyl(0.11, 0.11, 0.035, C.gold, [0, -0.06, 0], leftShoulder, false, 24);

  const leftUpperArm = new T.Group();
  leftUpperArm.position.set(0, -0.06, 0);
  leftShoulder.add(leftUpperArm);

  cyl(0.11, 0.095, 0.32, C.ceramic, [0, -0.16, 0], leftUpperArm, false, 28);
  ball(0.092, C.gold, [1, 1, 1], [0, -0.32, 0.015], leftUpperArm, 24);
  cyl(0.085, 0.085, 0.024, C.silver, [0, -0.32, 0.015], leftUpperArm, false, 20);

  const leftForearm = new T.Group();
  leftForearm.position.set(0, -0.32, 0.015);
  leftUpperArm.add(leftForearm);

  cyl(0.092, 0.082, 0.30, C.ceramic, [0, -0.15, 0.010], leftForearm, false, 28);
  // Strip cyan bercahaya di lengan bawah
  cyl(0.085, 0.085, 0.030, C.cyanGlow, [0, -0.28, 0.010], leftForearm, false, 24);
  ball(0.072, C.silver, [1, 1, 1], [0, -0.30, 0.010], leftForearm, 20);

  const leftHand = createAndroidHand(-1);
  leftHand.position.set(0, -0.30, 0.010);
  leftForearm.add(leftHand);

  // --- LENGAN KANAN (POISE SANTUN CONCIERGE) ---
  const rightShoulder = new T.Group();
  rightShoulder.position.set(0.56, 0.20, 0.04);
  torso.add(rightShoulder);

  ball(0.16, C.ceramic, [1, 1, 1], [0, 0, 0], rightShoulder, 32);
  cyl(0.11, 0.11, 0.035, C.gold, [0, -0.06, 0], rightShoulder, false, 24);

  const rightUpperArm = new T.Group();
  rightUpperArm.position.set(0, -0.06, 0);
  rightShoulder.add(rightUpperArm);

  cyl(0.11, 0.095, 0.32, C.ceramic, [0, -0.16, 0], rightUpperArm, false, 28);
  ball(0.092, C.gold, [1, 1, 1], [0, -0.32, 0.015], rightUpperArm, 24);
  cyl(0.085, 0.085, 0.024, C.silver, [0, -0.32, 0.015], rightUpperArm, false, 20);

  const rightForearm = new T.Group();
  rightForearm.position.set(0, -0.32, 0.015);
  rightUpperArm.add(rightForearm);

  cyl(0.092, 0.082, 0.30, C.ceramic, [0, -0.15, 0.010], rightForearm, false, 28);
  cyl(0.085, 0.085, 0.030, C.cyanGlow, [0, -0.28, 0.010], rightForearm, false, 24);
  ball(0.072, C.silver, [1, 1, 1], [0, -0.30, 0.010], rightForearm, 20);

  const rightHand = createAndroidHand(1);
  rightHand.position.set(0, -0.30, 0.010);
  rightForearm.add(rightHand);

  /* ================= 4. BASE LEVITASI & PROPULSI ANTI-GRAVITASI ================= */
  // Skirt propulsi keramik aerodinamis
  cyl(0.46, 0.20, 0.52, C.ceramic, [0, -1.24, 0], g, false, 48);
  cyl(0.47, 0.38, 0.08, C.plnTeal,  [0, -1.12, 0], g);
  cyl(0.30, 0.20, 0.05, C.gold,     [0, -1.38, 0], g);

  // Nozel plasma cyan terang di dasar
  const thrusterGlow = cyl(0.17, 0.06, 0.10, C.cyanGlow, [0, -1.46, 0], g);

  // Cincin Orbital Holografik Ganda
  const ring1 = new T.Mesh(new T.TorusGeometry(0.82, 0.022, 8, 48), C.cyanGlow);
  ring1.position.y = -1.56;
  ring1.rotation.x = Math.PI / 2;
  g.add(ring1);

  const ring2 = new T.Mesh(new T.TorusGeometry(1.06, 0.018, 8, 48), C.yellowGlow);
  ring2.position.y = -1.68;
  ring2.rotation.x = Math.PI / 2;
  g.add(ring2);

  // Bayangan halus di lantai
  const shadow = new T.Mesh(
    new T.CircleGeometry(0.88, 36),
    new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.02;
  g.add(shadow);

  return {
    g,
    head,
    eyes: eyesGroup,
    mouthBars,
    smile,
    arcCore,
    leftUpperArm,
    leftForearm,
    leftHand,
    rightUpperArm,
    rightForearm,
    rightHand,
    ring1,
    ring2,
    thrusterGlow
  };
}

function animate(ms) {
  requestAnimationFrame(animate);

  const t = ms / 1000;
  const R = robot;
  if (!R) return;

  const isSpeaking = (typeof speaking !== 'undefined' && speaking);

  // 1. Levitasi Mengapung Halus & Alami
  R.g.position.y = Math.sin(t * 1.8) * 0.055;

  // 2. Interaksi Pandangan & Head Tracking Halus Mengikuti Kursor
  const targetHeadY = mouseTargetX * 0.70 + Math.sin(t * 0.8) * 0.06;
  const targetHeadX = -mouseTargetY * 0.50 + Math.sin(t * 0.6) * 0.025;
  const targetHeadZ = mouseTargetX * 0.15 + Math.sin(t * 0.8) * 0.025;

  R.head.rotation.y += (targetHeadY - R.head.rotation.y) * 0.08;
  R.head.rotation.x += (targetHeadX - R.head.rotation.x) * 0.08;
  R.head.rotation.z += (targetHeadZ - R.head.rotation.z) * 0.08;

  // 3. Kedipan Mata Digital Halus & Alami (Blink Cycle)
  const blinkCycle = t % 4.2;
  let eyeScaleY = 1.0;
  if (blinkCycle < 0.15) {
    eyeScaleY = Math.max(0.08, 1.0 - Math.sin((blinkCycle / 0.15) * Math.PI) * 0.92);
  }
  if (R.eyes) {
    R.eyes.scale.y = eyeScaleY;
  }

  // 4. Putaran Cincin Orbital Holografik
  if (R.ring1 && R.ring2) {
    R.ring1.rotation.z += 0.016;
    R.ring1.rotation.x = Math.PI / 2 + Math.sin(t * 1.4) * 0.08;

    R.ring2.rotation.z -= 0.022;
    R.ring2.rotation.y = Math.cos(t * 1.1) * 0.10;
  }

  // 5. Denyut Hangat Reaktor Daya Listrik PLN (Arc Core Pulse)
  if (R.arcCore) {
    const corePulse = isSpeaking
      ? (1.8 + Math.sin(t * 12) * 0.5)
      : (1.1 + Math.sin(t * 2.2) * 0.35);
    R.arcCore.material.emissiveIntensity = corePulse;
  }

  // 6. Artikulasi Mulut Waveform Digital Saat Berbicara
  if (R.mouthBars && R.mouthBars.length === 5) {
    R.mouthBars.forEach((bar, idx) => {
      let targetH = 0.2;
      if (isSpeaking) {
        const wave = Math.abs(Math.sin(t * 16 + idx * 1.35));
        targetH = 0.35 + wave * 1.4;
      } else {
        const curve = [0.15, 0.25, 0.35, 0.25, 0.15];
        targetH = curve[idx] || 0.2;
      }
      bar.scale.y += (targetH - bar.scale.y) * 0.35;
    });

    if (R.smile) {
      R.smile.visible = !isSpeaking;
    }
  }

  // 7. Gerakan Lengan & Tangan Realistis Mengarahkan Pengguna
  const isWaving = (typeof waveUntil !== 'undefined') ? (isSpeaking || ms < waveUntil) : isSpeaking;
  const isGuiding = isWaving || isSpeaking;

  // Deteksi adaptif posisi bot (kiri atau kanan layar)
  const botEl = document.getElementById('bot');
  const isDockedLeft = botEl && botEl.classList.contains('left');

  // LERP damping rate untuk pergerakan sendi yang halus dan luwes
  const lerpArm = 0.085;

  if (R.leftUpperArm && R.leftForearm && R.leftHand && R.rightUpperArm && R.rightForearm && R.rightHand) {
    if (!isDockedLeft) {
      // DEFAULT: Robot di kanan bawah -> Formulir berada di sebelah KIRI (-X)
      // Lengan Kiri bertindak sebagai TANGAN PENGARAH
      let tLUX, tLUY, tLUZ, tLFX, tLFY, tLFZ, tLHX, tLHY, tLHZ;
      let tRUX, tRUY, tRUZ, tRFX, tRFY, tRFZ, tRHX, tRHY, tRHZ;

      if (isGuiding) {
        // GESTUR MENGARAHKAN KE FORMULIR: Lengan kiri terangkat anggun ke depan-kiri,
        // siku menekuk natural, telapak tangan terbuka "mempersilakan"
        const guidePulse = Math.sin(t * 3.0);
        const guideDip   = Math.cos(t * 3.0);

        tLUX = -0.46 + guidePulse * 0.05;
        tLUY = -0.20 + guideDip * 0.03;
        tLUZ = -0.30 + guidePulse * 0.04;

        tLFX = -0.82 + guidePulse * 0.07;
        tLFY = -0.25 + guideDip * 0.04;
        tLFZ = -0.24 + guidePulse * 0.05;

        tLHX = -0.16 + guidePulse * 0.04;
        tLHY = -0.32;
        tLHZ = 0.18;
      } else {
        // POISE SANTUN ISTIRAHAT: Lengan kiri rileks di depan pinggul
        tLUX = -0.12;
        tLUY = 0.04;
        tLUZ = -0.14;

        tLFX = -0.55 + Math.sin(t * 1.8) * 0.02;
        tLFY = 0.08;
        tLFZ = 0.22;

        tLHX = -0.10;
        tLHY = 0.12;
        tLHZ = 0.10;
      }

      // Lengan Kanan: Sikap Santun Concierge di depan pinggang
      tRUX = -0.10;
      tRUY = -0.04;
      tRUZ = 0.14;

      tRFX = -0.58 + Math.sin(t * 1.8) * 0.025;
      tRFY = -0.08;
      tRFZ = -0.24;

      tRHX = -0.10;
      tRHY = -0.14;
      tRHZ = -0.10;

      // Terapkan LERP halus ke lengan kiri
      R.leftUpperArm.rotation.x += (tLUX - R.leftUpperArm.rotation.x) * lerpArm;
      R.leftUpperArm.rotation.y += (tLUY - R.leftUpperArm.rotation.y) * lerpArm;
      R.leftUpperArm.rotation.z += (tLUZ - R.leftUpperArm.rotation.z) * lerpArm;

      R.leftForearm.rotation.x  += (tLFX - R.leftForearm.rotation.x) * lerpArm;
      R.leftForearm.rotation.y  += (tLFY - R.leftForearm.rotation.y) * lerpArm;
      R.leftForearm.rotation.z  += (tLFZ - R.leftForearm.rotation.z) * lerpArm;

      R.leftHand.rotation.x     += (tLHX - R.leftHand.rotation.x) * lerpArm;
      R.leftHand.rotation.y     += (tLHY - R.leftHand.rotation.y) * lerpArm;
      R.leftHand.rotation.z     += (tLHZ - R.leftHand.rotation.z) * lerpArm;

      // Terapkan LERP halus ke lengan kanan
      R.rightUpperArm.rotation.x += (tRUX - R.rightUpperArm.rotation.x) * lerpArm;
      R.rightUpperArm.rotation.y += (tRUY - R.rightUpperArm.rotation.y) * lerpArm;
      R.rightUpperArm.rotation.z += (tRUZ - R.rightUpperArm.rotation.z) * lerpArm;

      R.rightForearm.rotation.x  += (tRFX - R.rightForearm.rotation.x) * lerpArm;
      R.rightForearm.rotation.y  += (tRFY - R.rightForearm.rotation.y) * lerpArm;
      R.rightForearm.rotation.z  += (tRFZ - R.rightForearm.rotation.z) * lerpArm;

      R.rightHand.rotation.x     += (tRHX - R.rightHand.rotation.x) * lerpArm;
      R.rightHand.rotation.y     += (tRHY - R.rightHand.rotation.y) * lerpArm;
      R.rightHand.rotation.z     += (tRHZ - R.rightHand.rotation.z) * lerpArm;
    } else {
      // Robot di sisi KIRI layar -> Formulir berada di sebelah KANAN (+X)
      // Lengan Kanan bertindak sebagai TANGAN PENGARAH
      let tRUX, tRUY, tRUZ, tRFX, tRFY, tRFZ, tRHX, tRHY, tRHZ;
      let tLUX, tLUY, tLUZ, tLFX, tLFY, tLFZ, tLHX, tLHY, tLHZ;

      if (isGuiding) {
        const guidePulse = Math.sin(t * 3.0);
        const guideDip   = Math.cos(t * 3.0);

        tRUX = -0.46 + guidePulse * 0.05;
        tRUY = 0.20 - guideDip * 0.03;
        tRUZ = 0.30 - guidePulse * 0.04;

        tRFX = -0.82 + guidePulse * 0.07;
        tRFY = 0.25 - guideDip * 0.04;
        tRFZ = 0.24 - guidePulse * 0.05;

        tRHX = -0.16 + guidePulse * 0.04;
        tRHY = 0.32;
        tRHZ = -0.18;
      } else {
        tRUX = -0.12;
        tRUY = -0.04;
        tRUZ = 0.14;

        tRFX = -0.55 + Math.sin(t * 1.8) * 0.02;
        tRFY = -0.08;
        tRFZ = -0.22;

        tRHX = -0.10;
        tRHY = -0.12;
        tRHZ = -0.10;
      }

      tLUX = -0.10;
      tLUY = 0.04;
      tLUZ = -0.14;

      tLFX = -0.58 + Math.sin(t * 1.8) * 0.025;
      tLFY = 0.08;
      tLFZ = 0.24;

      tLHX = -0.10;
      tLHY = 0.14;
      tLHZ = 0.10;

      R.rightUpperArm.rotation.x += (tRUX - R.rightUpperArm.rotation.x) * lerpArm;
      R.rightUpperArm.rotation.y += (tRUY - R.rightUpperArm.rotation.y) * lerpArm;
      R.rightUpperArm.rotation.z += (tRUZ - R.rightUpperArm.rotation.z) * lerpArm;

      R.rightForearm.rotation.x  += (tRFX - R.rightForearm.rotation.x) * lerpArm;
      R.rightForearm.rotation.y  += (tRFY - R.rightForearm.rotation.y) * lerpArm;
      R.rightForearm.rotation.z  += (tRFZ - R.rightForearm.rotation.z) * lerpArm;

      R.rightHand.rotation.x     += (tRHX - R.rightHand.rotation.x) * lerpArm;
      R.rightHand.rotation.y     += (tRHY - R.rightHand.rotation.y) * lerpArm;
      R.rightHand.rotation.z     += (tRHZ - R.rightHand.rotation.z) * lerpArm;

      R.leftUpperArm.rotation.x += (tLUX - R.leftUpperArm.rotation.x) * lerpArm;
      R.leftUpperArm.rotation.y += (tLUY - R.leftUpperArm.rotation.y) * lerpArm;
      R.leftUpperArm.rotation.z += (tLUZ - R.leftUpperArm.rotation.z) * lerpArm;

      R.leftForearm.rotation.x  += (tLFX - R.leftForearm.rotation.x) * lerpArm;
      R.leftForearm.rotation.y  += (tLFY - R.leftForearm.rotation.y) * lerpArm;
      R.leftForearm.rotation.z  += (tLFZ - R.leftForearm.rotation.z) * lerpArm;

      R.leftHand.rotation.x     += (tLHX - R.leftHand.rotation.x) * lerpArm;
      R.leftHand.rotation.y     += (tLHY - R.leftHand.rotation.y) * lerpArm;
      R.leftHand.rotation.z     += (tLHZ - R.leftHand.rotation.z) * lerpArm;
    }
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}
