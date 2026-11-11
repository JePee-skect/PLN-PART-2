/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   Robot 3D Three.js: Asisten Virtual Concierge PLN Pusharlis (Ultra-Pro)
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
      antialias: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(260, 380, false);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(36, 260 / 380, 0.1, 50);
    camera.position.set(0, 0, 8.2);

    // Pencahayaan Studio Profesional PLN
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.95);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x00c8e6, 0.55); // Cyan fill
    fillLight.position.set(-3, -1, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffd500, 0.45); // Warm gold rim
    rimLight.position.set(0, 4, -4);
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
    mouseTargetX = (e.clientX / window.innerWidth - 0.5) * 0.45;
    mouseTargetY = (e.clientY / window.innerHeight - 0.5) * 0.35;
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

  fab.title = 'Geser untuk memindahkan posisi asisten virtual PLN';

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
      store.set('vms-pos', {
        x: parseFloat(bot.style.left),
        y: parseFloat(bot.style.top)
      });
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

  const saved = store.get('vms-pos', null);
  if (saved && isFinite(saved.x) && isFinite(saved.y)) {
    place(saved.x, saved.y);
  }

  window.addEventListener('resize', () => {
    if (bot.style.left) {
      place(parseFloat(bot.style.left), parseFloat(bot.style.top));
    }
  });
}

function createPLNLogoTexture(T) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 352;
  const ctx = canvas.getContext('2d');

  function drawVectorLogo() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 352);

    ctx.fillStyle = '#ffe600';
    ctx.fillRect(16, 16, 224, 224);

    ctx.strokeStyle = '#00a2e8';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let row = 0; row < 3; row++) {
      const y = 80 + row * 40;
      ctx.beginPath();
      ctx.moveTo(35, y);
      ctx.bezierCurveTo(65, y - 20, 95, y + 20, 128, y);
      ctx.bezierCurveTo(160, y - 20, 190, y + 20, 220, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#e2231a';
    ctx.beginPath();
    ctx.moveTo(135, 28);
    ctx.lineTo(82, 126);
    ctx.lineTo(122, 126);
    ctx.lineTo(112, 230);
    ctx.lineTo(172, 114);
    ctx.lineTo(132, 114);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#00a2e8';
    ctx.font = 'bold 74px "Poppins", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PLN', 128, 298);
  }

  drawVectorLogo();

  const canvasTex = new T.CanvasTexture(canvas);
  canvasTex.generateMipmaps = true;

  const mat = new T.MeshStandardMaterial({
    map: canvasTex,
    transparent: false,
    roughness: 0.15,
    metalness: 0.05,
    side: T.FrontSide
  });

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 256, 352);
      ctx.drawImage(img, 10, 10, 236, 332);
      canvasTex.needsUpdate = true;
      mat.needsUpdate = true;
    };
    img.src = 'img/pln-logo.png';
  } catch (e) {}

  return mat;
}

function createTabletScreenTexture(T) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');

  // Background Holografik Biru Gelap
  ctx.fillStyle = '#071824';
  ctx.fillRect(0, 0, 256, 360);

  // Border Glowing Cyan
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 244, 348);

  // Header Title
  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 20px "Poppins", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PLN PUSHARLIS', 128, 38);

  ctx.fillStyle = '#ffe600';
  ctx.font = 'bold 15px "Poppins", sans-serif';
  ctx.fillText('VISITOR LOG SYSTEM', 128, 62);

  // Divider
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, 78);
  ctx.lineTo(236, 78);
  ctx.stroke();

  // Checklist Items Tamu
  const items = [
    { text: 'Identitas Tamu', ok: true },
    { text: 'Tujuan Kunjungan', ok: true },
    { text: 'K3 Safety Induction', ok: true },
    { text: 'Alat Pelindung Diri', ok: true },
    { text: 'Akses Diberikan', ok: true }
  ];

  items.forEach((it, idx) => {
    const y = 115 + idx * 42;
    ctx.fillStyle = it.ok ? '#2ecc71' : '#ffe600';
    ctx.font = 'bold 18px "Poppins", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('✓', 24, y);

    ctx.fillStyle = '#ffffff';
    ctx.font = '14px "Poppins", sans-serif';
    ctx.fillText(it.text, 48, y);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(24, y + 14);
    ctx.lineTo(232, y + 14);
    ctx.stroke();
  });

  // Footer Status
  ctx.fillStyle = '#00f0ff';
  ctx.font = '12px "Poppins", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('● SYSTEM ACTIVE - SECURE', 128, 335);

  const tex = new T.CanvasTexture(canvas);
  tex.generateMipmaps = true;

  return new T.MeshStandardMaterial({
    map: tex,
    roughness: 0.15,
    metalness: 0.1,
    emissive: 0x0084cc,
    emissiveIntensity: 0.35
  });
}

function createRobot(T) {
  const mat = (color, opt = {}) => new T.MeshStandardMaterial({
    color,
    roughness: 0.28,
    metalness: 0.15,
    ...opt
  });

  const C = {
    white:       mat(0xfcfdff, { roughness: 0.16, metalness: 0.20 }), // Pearlescent White Porcelain
    plnTeal:     mat(0x007a87, { roughness: 0.25, metalness: 0.30 }), // PLN Signature Teal
    plnCyan:     mat(0x00a2e8, { roughness: 0.20, metalness: 0.35 }), // PLN Electric Cyan
    gold:        mat(0xf2c94c, { roughness: 0.22, metalness: 0.80 }), // Brushed Corporate Gold
    metal:       mat(0xc8d4de, { roughness: 0.20, metalness: 0.70 }), // Sleek Silver Alloy
    titanium:    mat(0x131c26, { roughness: 0.35, metalness: 0.50 }), // Dark Titanium Inset
    visor:       mat(0x060f18, { roughness: 0.04, metalness: 0.90 }), // Obsidian Curved Face Shield
    glow:        mat(0x00f0ff, { emissive: 0x00f0ff, emissiveIntensity: 1.6 }), // Electric Cyan Neon
    glowDim:     mat(0x00a2e8, { emissive: 0x00a2e8, emissiveIntensity: 0.9 }),
    goldGlow:    mat(0xffd500, { emissive: 0xffaa00, emissiveIntensity: 1.4 }), // Gold Orbital Neon
    coreGlow:    mat(0x00f7ff, { emissive: 0x00f7ff, emissiveIntensity: 1.9 }), // Clean Energy Arc Core
    glass:       mat(0x7de6ff, { transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.2 })
  };

  const ball = (r, m, [sx, sy, sz], [x, y, z], parent) => {
    const o = new T.Mesh(new T.SphereGeometry(r, 32, 20), m);
    o.scale.set(sx, sy, sz);
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };

  const cyl = (rt, rb, h, m, [x, y, z], parent, open = false) => {
    const o = new T.Mesh(new T.CylinderGeometry(rt, rb, h, 36, 1, open), m);
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };

  const g = new T.Group();

  /* ================= 1. KEPALA & VISOR CYBER CONCIERGE ================= */
  const head = new T.Group();
  head.position.y = 1.05;
  g.add(head);

  // Bentuk kepala android aerodinamis & proporsional
  ball(0.92, C.white, [1.08, 1.14, 1.02], [0, 0, 0], head);

  // Inset kontur samping kepala (PLN Teal & Gold pinstripe)
  [-1, 1].forEach((side) => {
    const browAccent = new T.Mesh(
      new T.TorusGeometry(0.85, 0.024, 8, 24, Math.PI * 0.45),
      C.gold
    );
    browAccent.position.set(side * 0.15, 0.45, 0.40);
    browAccent.rotation.y = side * 0.25;
    browAccent.rotation.z = side * -0.35;
    head.add(browAccent);
  });

  // Visor kaca obsidian gelap melengkung (wajah digital interaktif)
  const visorFace = ball(0.74, C.visor, [1.06, 0.78, 0.44], [0, 0.04, 0.72], head);
  ball(0.75, C.glass, [1.10, 0.82, 0.46], [0, 0.04, 0.73], head);

  // --- MATA DIGITAL CYBER (RAMAH, ELEGAN & CERDAS) ---
  const eyes = new T.Group();
  eyes.position.set(0, 0.10, 1.05);
  head.add(eyes);

  [-0.28, 0.28].forEach((x, idx) => {
    const side = (idx === 0) ? -1 : 1;

    // Lengkungan mata digital bercahaya cyan (Friendly arched glance)
    const eyeArc = new T.Mesh(
      new T.TorusGeometry(0.12, 0.024, 8, 20, Math.PI * 0.85),
      C.glow
    );
    eyeArc.position.set(x, -0.02, 0);
    eyeArc.rotation.z = (side === -1) ? -Math.PI * 0.08 : -Math.PI * 0.92;
    eyes.add(eyeArc);

    // Titik kilau kecerdasan digital
    ball(0.028, C.glow, [1, 1, 1], [x + side * 0.04, 0.06, 0.02], eyes);
  });

  // --- GELOMBANG AUDIO SUARA DIGITAL (EQUALIZER WAVEFORM MOUTH) ---
  // 5 bar equalizer digital yang bergerak aktif saat berbicara
  const mouthBars = [];
  const barSpacing = 0.07;
  for (let i = -2; i <= 2; i++) {
    const bar = new T.Mesh(new T.BoxGeometry(0.026, 0.12, 0.02), C.glow);
    bar.position.set(i * barSpacing, -0.22, 1.05);
    bar.scale.y = 0.25; // default rendah membentuk senyum
    head.add(bar);
    mouthBars.push(bar);
  }

  // Lengkungan senyum idle halus
  const smileArc = new T.Mesh(
    new T.TorusGeometry(0.14, 0.018, 8, 20, Math.PI * 0.7),
    C.glowDim
  );
  smileArc.rotation.z = Math.PI * 1.15;
  smileArc.position.set(0, -0.21, 1.04);
  head.add(smileArc);

  // --- HEADSET OPERATOR COMMUNICATOR & BOOM MIC ---
  [-1, 1].forEach((k) => {
    // Earpod bundar putih keramik
    const earpod = cyl(0.24, 0.24, 0.16, C.white, [k * 1.12, 0.02, 0], head);
    earpod.rotation.z = Math.PI / 2;

    // Ring bercahaya cyan khas PLN
    const ring = new T.Mesh(new T.TorusGeometry(0.18, 0.022, 8, 24), C.glow);
    ring.position.set(k * 1.20, 0.02, 0);
    ring.rotation.y = Math.PI / 2;
    head.add(ring);

    // Center disc emas
    const goldCenter = cyl(0.09, 0.09, 0.18, C.gold, [k * 1.14, 0.02, 0], head);
    goldCenter.rotation.z = Math.PI / 2;
  });

  // Boom Mic mini di sisi kiri mengarah ke dekat mulut
  const micArm = cyl(0.015, 0.015, 0.42, C.metal, [-0.98, -0.10, 0.38], head);
  micArm.rotation.x = Math.PI / 2.5;
  micArm.rotation.z = -0.42;
  ball(0.038, C.glow, [1, 1, 1.2], [-0.78, -0.22, 0.72], head); // Mic indicator LED

  // --- CREST FIN AERODINAMIS DI ATAS KEPALA (PREMIUM FUTURISTIC CROWN) ---
  const crest = new T.Mesh(
    new T.BoxGeometry(0.08, 0.22, 1.15),
    C.plnTeal
  );
  crest.position.set(0, 1.02, -0.05);
  crest.rotation.x = -0.15;
  head.add(crest);

  // Pinstripe emas di atas fin
  const crestStripe = new T.Mesh(new T.BoxGeometry(0.025, 0.23, 1.16), C.gold);
  crestStripe.position.set(0, 1.02, -0.05);
  crestStripe.rotation.x = -0.15;
  head.add(crestStripe);

  // Lampu status mini di ujung fin
  const statusBeacon = ball(0.045, C.glow, [1, 1, 1], [0, 1.12, 0.42], head);

  /* ================= 2. LEHER & BADAN KORPORAT PLN ================= */
  // Leher artikulasi titanium dengan ring perak
  cyl(0.18, 0.20, 0.26, C.titanium, [0, -0.02, 0], g);
  cyl(0.23, 0.23, 0.05, C.metal, [0, -0.08, 0], g);

  // Badan Utama: Porcelain White Shell dengan lekukan elegan
  const torso = new T.Group();
  torso.position.y = -0.72;
  g.add(torso);

  // Chassis dada & punggung
  ball(0.86, C.white, [0.82, 0.95, 0.65], [0, 0, 0], torso);

  // Panel Dada Kiri & Kanan PLN Teal (Tailored Corporate Blazer Insets)
  [-0.32, 0.32].forEach((x, idx) => {
    const side = (idx === 0) ? -1 : 1;
    const panel = new T.Mesh(
      new T.BoxGeometry(0.34, 0.62, 0.08),
      C.plnTeal
    );
    panel.position.set(x, 0.08, 0.52);
    panel.rotation.y = side * -0.22;
    panel.rotation.z = side * 0.06;
    torso.add(panel);

    // Garis aksen emas di tepi blazer
    const lapel = new T.Mesh(new T.BoxGeometry(0.035, 0.64, 0.09), C.gold);
    lapel.position.set(x - side * 0.16, 0.08, 0.54);
    lapel.rotation.y = side * -0.22;
    lapel.rotation.z = side * 0.06;
    torso.add(lapel);
  });

  // Kerah Formal Emas di Leher
  const collar = new T.Mesh(new T.TorusGeometry(0.38, 0.035, 8, 32, Math.PI * 1.2), C.gold);
  collar.position.set(0, 0.58, 0.15);
  collar.rotation.x = Math.PI / 2.3;
  torso.add(collar);

  // --- CORE REAKTOR ENERGI LISTRIK PLN (ARC REACTOR CLEAN ENERGY) ---
  const coreBezel = cyl(0.18, 0.18, 0.06, C.gold, [0, 0.16, 0.56], torso);
  coreBezel.rotation.x = Math.PI / 2;

  const arcCore = cyl(0.13, 0.13, 0.07, C.coreGlow, [0, 0.16, 0.57], torso);
  arcCore.rotation.x = Math.PI / 2;

  // --- ID BADGE RESMI PLN PUSHARLIS DI DADA KIRI ---
  const badgeGroup = new T.Group();
  badgeGroup.position.set(-0.35, 0.22, 0.58);
  badgeGroup.rotation.y = 0.24;
  badgeGroup.rotation.x = -0.08;
  torso.add(badgeGroup);

  const badgePlate = new T.Mesh(new T.BoxGeometry(0.32, 0.44, 0.03), C.white);
  badgeGroup.add(badgePlate);

  const badgeFrame = new T.Mesh(new T.BoxGeometry(0.34, 0.46, 0.02), C.gold);
  badgeFrame.position.z = -0.01;
  badgeGroup.add(badgeFrame);

  const plnLogoMat = createPLNLogoTexture(T);
  const badgeLogo = new T.Mesh(new T.PlaneGeometry(0.28, 0.40), plnLogoMat);
  badgeLogo.position.z = 0.025;
  badgeGroup.add(badgeLogo);

  // Bahu Aerodinamis Porcelain & Gold
  [-0.72, 0.72].forEach((x, idx) => {
    const side = (idx === 0) ? -1 : 1;
    // Bola sendi bahu emas
    ball(0.16, C.gold, [1, 1, 1], [x, 0.36, 0], torso);
    // Tutup bahu porcelain
    const pauldron = ball(0.22, C.white, [1.2, 0.9, 1.1], [x + side * 0.06, 0.42, 0], torso);
  });

  /* ================= 3. TANGAN & GESTUR CONCIERGE ================= */
  // --- TANGAN KIRI: MEMEGANG TABLET DATA PENGUNJUNG HOLOGRAFIK ---
  const leftArm = new T.Group();
  leftArm.position.set(-0.76, -0.35, 0);
  g.add(leftArm);

  // Lengan atas
  cyl(0.10, 0.09, 0.45, C.white, [0, -0.22, 0.10], leftArm).rotation.x = 0.4;
  ball(0.095, C.gold, [1, 1, 1], [0, -0.42, 0.20], leftArm);

  // Lengan bawah mengarah ke depan memegang tablet
  const leftForearm = cyl(0.085, 0.075, 0.40, C.white, [0.08, -0.42, 0.38], leftArm);
  leftForearm.rotation.x = Math.PI / 2.3;
  leftForearm.rotation.z = -0.25;

  // Telapak tangan memegang tablet
  ball(0.09, C.white, [0.9, 0.6, 1.2], [0.12, -0.42, 0.58], leftArm);

  // TABLET DATA HOLOGRAFIK PLN PUSHARLIS
  const tabletGroup = new T.Group();
  tabletGroup.position.set(0.15, -0.32, 0.72);
  tabletGroup.rotation.x = -0.35;
  tabletGroup.rotation.y = 0.30;
  tabletGroup.rotation.z = -0.15;
  leftArm.add(tabletGroup);

  // Bodi tablet titanium hitam tipis
  const tabletBody = new T.Mesh(new T.BoxGeometry(0.70, 0.95, 0.03), C.titanium);
  tabletGroup.add(tabletBody);

  const tabletBezel = new T.Mesh(new T.BoxGeometry(0.72, 0.97, 0.02), C.gold);
  tabletBezel.position.z = -0.01;
  tabletGroup.add(tabletBezel);

  // Layar holografik interaktif
  const tabletMat = createTabletScreenTexture(T);
  const tabletScreen = new T.Mesh(new T.PlaneGeometry(0.64, 0.89), tabletMat);
  tabletScreen.position.z = 0.025;
  tabletGroup.add(tabletScreen);

  // --- TANGAN KANAN: GESTUR MENYAMBUT RAMAH (WELCOMING CONCIERGE) ---
  const rightArm = new T.Group();
  rightArm.position.set(0.76, -0.35, 0);
  g.add(rightArm);

  // Lengan atas
  cyl(0.10, 0.09, 0.45, C.white, [0, -0.22, 0], rightArm);
  ball(0.095, C.gold, [1, 1, 1], [0, -0.45, 0], rightArm);

  // Lengan bawah terbuka ke depan ramah
  const rightForearm = cyl(0.085, 0.075, 0.42, C.white, [0.06, -0.65, 0.16], rightArm);
  rightForearm.rotation.x = 0.55;
  rightForearm.rotation.z = 0.20;

  // Telapak tangan kanan terbuka menyambut
  const rightHand = ball(0.09, C.white, [1.1, 0.45, 1.3], [0.10, -0.80, 0.32], rightArm);
  rightHand.rotation.x = 0.4;
  rightHand.rotation.y = -0.3;

  /* ================= 4. BASE LEVITASI & CINCIN ORBITAL HOLOGRAFIK ================= */
  // Bagian bawah tubuh mengecil aerodinamis (Hover Thruster Pod)
  const thrusterBase = cyl(0.55, 0.24, 0.65, C.white, [0, -1.35, 0], g);
  cyl(0.56, 0.45, 0.12, C.plnTeal, [0, -1.18, 0], g); // Strip teal
  cyl(0.38, 0.25, 0.06, C.gold, [0, -1.48, 0], g);    // Nozzle emas

  // Nozzle cahaya pendorong anti-gravitasi
  const thrusterGlow = cyl(0.22, 0.08, 0.14, C.coreGlow, [0, -1.58, 0], g);

  // Cincin Orbital Holografik 1 (Inner Cyan)
  const ring1 = new T.Mesh(new T.TorusGeometry(0.85, 0.022, 8, 48), C.glow);
  ring1.position.y = -1.65;
  ring1.rotation.x = Math.PI / 2;
  g.add(ring1);

  // Cincin Orbital Holografik 2 (Outer Gold)
  const ring2 = new T.Mesh(new T.TorusGeometry(1.15, 0.018, 8, 48), C.goldGlow);
  ring2.position.y = -1.78;
  ring2.rotation.x = Math.PI / 2;
  g.add(ring2);

  // Bayangan ambient lembut di lantai
  const shadow = new T.Mesh(
    new T.CircleGeometry(0.95, 36),
    new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.15;
  g.add(shadow);

  return {
    g,
    head,
    eyes,
    mouthBars,
    smileArc,
    arcCore,
    arm: rightArm,
    leftArm,
    statusBeacon,
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

  // 1. Levitation Floating Smooth Bobbing (Melayang Elegan)
  R.g.position.y = Math.sin(t * 1.8) * 0.06;

  // 2. Interaktif Gaze & Head Tracking Mengikuti Cursor
  const targetHeadY = mouseTargetX * 0.8 + Math.sin(t * 0.8) * 0.12;
  const targetHeadX = -mouseTargetY * 0.6 + Math.sin(t * 0.6) * 0.03;
  const targetHeadZ = mouseTargetX * 0.2;

  R.head.rotation.y += (targetHeadY - R.head.rotation.y) * 0.08;
  R.head.rotation.x += (targetHeadX - R.head.rotation.x) * 0.08;
  R.head.rotation.z += (targetHeadZ - R.head.rotation.z) * 0.08;

  // 3. Putaran Cincin Orbital Holografik Anti-Gravitasi
  if (R.ring1 && R.ring2) {
    R.ring1.rotation.z += 0.018;
    R.ring1.rotation.x = Math.PI / 2 + Math.sin(t * 1.4) * 0.10;

    R.ring2.rotation.z -= 0.024;
    R.ring2.rotation.y = Math.cos(t * 1.1) * 0.12;
  }

  // 4. Denyut Cahaya Reaktor Energi Listrik PLN (Arc Core Pulse)
  if (R.arcCore) {
    const corePulse = isSpeaking
      ? (1.7 + Math.sin(t * 12) * 0.6)
      : (1.0 + Math.sin(t * 2.2) * 0.35);
    R.arcCore.material.emissiveIntensity = corePulse;
  }

  // 5. Animasi Mulut Gelombang Suara (Dynamic Waveform EQ Bars)
  if (R.mouthBars && R.mouthBars.length === 5) {
    R.mouthBars.forEach((bar, idx) => {
      let targetH = 0.25;
      if (isSpeaking) {
        // Equalizer wave aktif menari mengikuti ritme suara
        const wave = Math.abs(Math.sin(t * 16 + idx * 1.35));
        targetH = 0.35 + wave * 1.35;
      } else {
        // Idle smile curve
        const curve = [0.20, 0.30, 0.40, 0.30, 0.20];
        targetH = curve[idx] || 0.25;
      }
      bar.scale.y += (targetH - bar.scale.y) * 0.35;
    });

    if (R.smileArc) {
      R.smileArc.visible = !isSpeaking;
    }
  }

  // 6. Gerakan Tangan Menyambut (Welcoming Concierge Gesture)
  const isWaving = (typeof waveUntil !== 'undefined') ? (isSpeaking || ms < waveUntil) : isSpeaking;
  const targetArmZ = isWaving ? (0.45 + Math.sin(t * 6) * 0.18) : 0.12;
  const targetArmX = isWaving ? (0.28 + Math.sin(t * 5) * 0.12) : 0;
  R.arm.rotation.z += (targetArmZ - R.arm.rotation.z) * 0.12;
  R.arm.rotation.x += (targetArmX - R.arm.rotation.x) * 0.12;

  // 7. Kedipan Mata Digital Halus (Smart Blink)
  const isBlinking = (Math.sin(t * 1.1) > 0.985 || (t % 4.8) > 4.7);
  R.eyes.scale.y = isBlinking ? 0.05 : 1.0;

  // 8. Lampu Indikator Status di Puncak Fin
  if (R.statusBeacon) {
    R.statusBeacon.material.emissiveIntensity = 0.8 + Math.sin(t * 3) * 0.5;
  }

  renderer.render(scene, camera);
}
