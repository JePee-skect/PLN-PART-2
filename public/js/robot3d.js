/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   Robot 3D Three.js: Asisten Registrasi Tamu K3LH PLN Pusharlis
   ===================================================================== */

let renderer, scene, camera, rig, robot;
let wasDragged = false;

function initRobot3D() {
  enableDrag();
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
    camera = new THREE.PerspectiveCamera(35, 260 / 380, 0.1, 50);
    camera.position.set(0, 0, 8);

    scene.add(new THREE.AmbientLight(0xffffff, 0.75));

    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(2, 3, 4);
    scene.add(sun);

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

  fab.title = 'Geser untuk memindahkan posisi asisten';

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

    try {
      fab.setPointerCapture(e.pointerId);
    } catch (x) {}
  });

  fab.addEventListener('pointermove', (e) => {
    if (!down) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (!moved && Math.hypot(dx, dy) < 6) return;
    moved = true;
    bot.classList.add('drag');

    place(originX + dx, originY + dy);
  });

  fab.addEventListener('pointerup', end);
  fab.addEventListener('pointercancel', end);

  // Mengembalikan posisi tersimpan dari local storage
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
  // 1. Gambar canvas vektor resmi PLN sebagai tekstur instan (Opaque, tajam & anti-glitch)
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 352;
  const ctx = canvas.getContext('2d');

  function drawVectorLogo() {
    // Background putih solid
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 352);

    // Kotak Kuning Khas PLN
    ctx.fillStyle = '#ffe600';
    ctx.fillRect(16, 16, 224, 224);

    // Tiga Gelombang Air Biru
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

    // Kilatan Petir Merah PLN
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

    // Tulisan "PLN" Biru Tebal di bawah kotak kuning
    ctx.fillStyle = '#00a2e8';
    ctx.font = 'bold 74px "Poppins", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PLN', 128, 298);
  }

  drawVectorLogo();

  const canvasTex = new T.CanvasTexture(canvas);
  canvasTex.generateMipmaps = true;

  // Material standard solid opaque tanpa alpha bug
  const mat = new T.MeshStandardMaterial({
    map: canvasTex,
    transparent: false,
    roughness: 0.15,
    metalness: 0.05,
    side: T.FrontSide
  });

  // Muat file gambar resmi pln-logo.png jika berhasil diakses
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

function createNameTagTexture(T) {
  // Name Tag resmi akrilik di dada: PLN PUSHARLIS - SAFETY BUDDY
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');

  // Latar belakang gelap elegan akrilik seragam PLN
  ctx.fillStyle = '#0f2735';
  ctx.fillRect(0, 0, 320, 140);

  // Bingkai emas tipis
  ctx.strokeStyle = '#ffe600';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 314, 134);

  // Garis pemisah tipis
  ctx.strokeStyle = 'rgba(255, 230, 0, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(18, 70);
  ctx.lineTo(302, 70);
  ctx.stroke();

  // Baris 1: PLN PUSHARLIS (Kuning Khas PLN)
  ctx.fillStyle = '#ffe600';
  ctx.font = 'bold 24px "Poppins", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PLN PUSHARLIS', 160, 40);

  // Baris 2: VISITOR ASSISTANT (Bahasa Inggris Sesuai Permintaan)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 21px "Poppins", Arial, sans-serif';
  ctx.fillText('SAFETY BUDDY', 160, 102);

  const canvasTex = new T.CanvasTexture(canvas);
  canvasTex.generateMipmaps = true;

  return new T.MeshStandardMaterial({
    map: canvasTex,
    transparent: false,
    roughness: 0.2,
    metalness: 0.1,
    side: T.FrontSide
  });
}

function createRobot(T) {
  const mat = (color, opt = {}) => new T.MeshStandardMaterial({
    color,
    roughness: 0.35,
    metalness: 0.1,
    ...opt
  });

  const C = {
    white:    mat(0xfcfdff, { roughness: 0.22, metalness: 0.08 }),
    face:     mat(0xffffff, { roughness: 0.18, metalness: 0.05 }),
    blue:     mat(0x0084cc, { roughness: 0.45 }), // PLN Cyan-Blue
    yellow:   mat(0xffd500, { roughness: 0.28, metalness: 0.12 }), // PLN K3 Helmet
    ridge:    mat(0xdfba00),
    orange:   mat(0xff6a00, { roughness: 0.45, side: T.DoubleSide }), // K3 Safety Vest
    pink:     mat(0xff75aa, { roughness: 0.4 }), // Cute feminine accents
    blush:    mat(0xff4d88, { emissive: 0xff3b7b, emissiveIntensity: 1.2 }), // Glowing pink blush cheeks
    red:      mat(0xe2231a),
    glove:    mat(0xffffff, { roughness: 0.35 }), // White clean gloves
    gloveCuff:mat(0xffd500, { roughness: 0.4 }),
    boot:     mat(0x1e242b, { roughness: 0.5 }), // Safety boots
    toeCap:   mat(0xabb5be, { metalness: 0.6, roughness: 0.2 }),
    visor:    mat(0x0a1626, { roughness: 0.08, metalness: 0.5 }), // Deep sapphire visor
    metal:    mat(0xc5d0d8, { metalness: 0.6, roughness: 0.2 }),
    gold:     mat(0xf5c518, { metalness: 0.65, roughness: 0.25 }),
    strip:    mat(0xf0f5fa, { metalness: 0.75, roughness: 0.15 }), // Reflective safety stripes
    glass:    mat(0x88e6ff, { transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.2 }),
    glow:     mat(0x00f0ff, { emissive: 0x00f0ff, emissiveIntensity: 1.3 }), // Glowing cyan eyes/smile
    eyeWhite: mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.8 }), // Eye sparkle
    lash:     mat(0x0d1217, { roughness: 0.2, metalness: 0.4 }), // Dark curved eyelashes
    hair:     mat(0xf8fbff, { roughness: 0.25, metalness: 0.08 }), // Robot twintails
    hairTip:  mat(0x00b4d8, { roughness: 0.35, metalness: 0.1 }), // Hair tips in PLN blue
    lamp:     mat(0xfff3b0, { emissive: 0xffd400, emissiveIntensity: 1 })
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

  /* ================= 1. KEPALA & WAJAH FEMININ ================= */
  const head = new T.Group();
  head.position.y = 0.95;
  g.add(head);

  // Bentuk kepala android yang manis & proporsional
  ball(0.95, C.face, [1.12, 1.0, 1.0], [0, 0, 0], head);
  // Visor kaca gelap berkilau melengkung (wajah digital)
  ball(0.78, C.visor, [1.14, 0.74, 0.42], [0, 0, 0.76], head);
  ball(0.79, C.glass, [1.18, 0.50, 0.44], [0, 0.05, 0.76], head);

  // --- MATA LED ANIME/CUTE FEMALE DENGAN BULU MATA LENTIK ---
  const eyes = new T.Group();
  eyes.position.y = 0.10;
  head.add(eyes);

  const lashes = new T.Group();
  head.add(lashes);

  [-0.30, 0.30].forEach((x, idx) => {
    const side = (idx === 0) ? -1 : 1;

    // Bola mata bercahaya cyan/aquamarine (besar, ramah & ekspresif)
    ball(0.12, C.glow, [1.1, 1.6, 0.35], [x, 0, 1.08], eyes);

    // Kilau mata (Anime eye highlight sparkle) di sudut atas mata
    ball(0.038, C.eyeWhite, [1, 1, 0.5], [x + side * 0.035, 0.07, 1.13], eyes);
    ball(0.020, C.eyeWhite, [1, 1, 0.5], [x - side * 0.025, -0.05, 1.12], eyes);

    // Bulu Mata Lentik Atas (Arched Eyelash Frame)
    const lashArc = new T.Mesh(
      new T.TorusGeometry(0.15, 0.022, 8, 20, Math.PI * 0.72),
      C.lash
    );
    lashArc.rotation.z = (side === -1) ? -Math.PI * 0.22 : -Math.PI * 0.50;
    lashArc.position.set(x, 0.12, 1.08);
    lashes.add(lashArc);

    // Sayap bulu mata lentik di sudut luar (Winged outer lash flick)
    const flick = new T.Mesh(
      new T.CylinderGeometry(0.005, 0.022, 0.11, 8),
      C.lash
    );
    flick.position.set(x + side * 0.15, 0.14, 1.06);
    flick.rotation.z = side * -0.85;
    lashes.add(flick);

    // Bulu mata kedua yang lebih kecil di samping
    const flick2 = new T.Mesh(
      new T.CylinderGeometry(0.004, 0.016, 0.08, 8),
      C.lash
    );
    flick2.position.set(x + side * 0.16, 0.08, 1.05);
    flick2.rotation.z = side * -1.15;
    lashes.add(flick2);
  });

  // --- PIPI MERONA PINK (BLUSH MARKS) ---
  // Rona pipi khas karakter cewek yang membuat Safety Buddy sangat imut & ramah
  const blushGroup = new T.Group();
  head.add(blushGroup);
  [-0.42, 0.42].forEach((x) => {
    // Strip rona pipi halus di bawah mata
    ball(0.075, C.blush, [1.6, 0.55, 0.3], [x, -0.10, 1.01], blushGroup);
  });

  // --- SENYUM MANIS & ARTIKULASI MULUT ---
  const smile = new T.Mesh(new T.TorusGeometry(0.18, 0.026, 8, 28, Math.PI), C.glow);
  smile.rotation.z = Math.PI;
  smile.position.set(0, -0.04, 1.08);
  head.add(smile);

  // Mulut bicara (animasi sync suara)
  const mouth = ball(0.11, C.glow, [1.5, 0.25, 0.3], [0, -0.22, 1.08], head);
  mouth.visible = false;

  // --- HEADSET OPERATOR & BOOM MIC CS ---
  // Earmuff headset feminin di telinga kiri dan kanan dengan ring bercahaya
  [-1, 1].forEach((k) => {
    // Bantalan earcup luar putih
    const earcup = cyl(0.28, 0.28, 0.18, C.white, [k * 1.20, 0, 0], head);
    earcup.rotation.z = Math.PI / 2;

    // Cincin aksen cyan bercahaya
    const ring = new T.Mesh(new T.TorusGeometry(0.22, 0.025, 8, 24), C.glow);
    ring.position.set(k * 1.29, 0, 0);
    ring.rotation.y = Math.PI / 2;
    head.add(ring);

    // Penutup tengah pink pastel
    const cap = cyl(0.14, 0.14, 0.20, C.pink, [k * 1.22, 0, 0], head);
    cap.rotation.z = Math.PI / 2;
  });

  // Boom Microphone di sisi kiri mengarah ke dekat mulut
  const micBoom = new T.Group();
  micBoom.position.set(-1.18, -0.05, 0.15);
  head.add(micBoom);

  const boomArm = new T.Mesh(
    new T.CylinderGeometry(0.018, 0.018, 0.45, 12),
    C.metal
  );
  boomArm.rotation.x = Math.PI / 2.6;
  boomArm.rotation.z = -0.45;
  boomArm.position.set(0.18, -0.12, 0.35);
  micBoom.add(boomArm);

  // Ujung mic mini dengan lampu indikator LED
  ball(0.045, C.white, [1, 1, 1.4], [0.34, -0.21, 0.68], micBoom);
  ball(0.025, C.glow, [1, 1, 1], [0.35, -0.21, 0.72], micBoom);

  // --- KUNCIR RAMBUT ROBOTIK (FUTURISTIC ROBOTIC TWINTAILS) ---
  // Fitur khas yang langsung menegaskan karakter cewek!
  const twintails = [];
  [-1, 1].forEach((side) => {
    const tailGroup = new T.Group();
    tailGroup.position.set(side * 1.15, 0.05, -0.15);
    head.add(tailGroup);

    // Pangkal kuncir (engsel bola mekanis)
    ball(0.14, C.white, [1, 1, 1], [0, 0, 0], tailGroup);
    ball(0.10, C.pink,  [1, 1, 1], [side * 0.08, 0, 0], tailGroup);

    // Segmen rambut atas (mengalir ke bawah)
    const upperHair = cyl(0.12, 0.10, 0.50, C.hair, [side * 0.10, -0.32, 0], tailGroup);
    upperHair.rotation.z = side * -0.22;
    upperHair.rotation.x = -0.15;

    // Garis aksen cyan khas PLN di kuncir rambut
    const stripe = cyl(0.122, 0.118, 0.07, C.blue, [side * 0.10, -0.25, 0], tailGroup);
    stripe.rotation.z = side * -0.22;
    stripe.rotation.x = -0.15;

    // Segmen rambut bawah melengkung manis ke luar
    const lowerHair = cyl(0.09, 0.03, 0.45, C.hairTip, [side * 0.22, -0.72, 0.05], tailGroup);
    lowerHair.rotation.z = side * -0.38;
    lowerHair.rotation.x = 0.10;

    twintails.push(tailGroup);
  });

  /* ================= 2. SAFETY HELMET K3 PLN ================= */
  // Helm K3 kuning resmi PLN Pusharlis yang proporsional & rapi
  const dome = new T.Mesh(
    new T.SphereGeometry(0.98, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2),
    C.yellow
  );
  dome.scale.set(1.18, 0.85, 1.08);
  dome.position.y = 0.38;
  head.add(dome);

  // Brim / tepi helm pelindung K3
  const brim = new T.Mesh(
    new T.CylinderGeometry(1.22, 1.22, 0.06, 36, 1, false, -Math.PI * 0.55, Math.PI * 1.1),
    C.yellow
  );
  brim.scale.z = 1.12;
  brim.position.y = 0.40;
  head.add(brim);

  // Garis punggung aerodinamis helm
  const ridge = new T.Mesh(new T.TorusGeometry(0.96, 0.045, 8, 36, Math.PI), C.ridge);
  ridge.rotation.y = Math.PI / 2;
  ridge.scale.set(1.08, 0.84, 1);
  ridge.position.y = 0.38;
  head.add(ridge);

  // Lampu senter kecil di puncak helm (Safety Beacon)
  const tip = ball(0.08, C.lamp, [1, 1, 1], [0, 1.00, 0.68], head);

  // Tekstur Logo Resmi PLN
  const plnBadgeMat = createPLNLogoTexture(T);

  // Lencana Logo Resmi PLN di Dahi Depan Helm K3 (Besar, Jelas & Menghadap Pengguna)
  const helmetBadgeGroup = new T.Group();
  helmetBadgeGroup.position.set(0, 0.78, 1.08);
  helmetBadgeGroup.rotation.x = -0.16;
  head.add(helmetBadgeGroup);

  // Braket bingkai emas/kuning lencana helm
  const helmetBracket = new T.Mesh(new T.BoxGeometry(0.50, 0.65, 0.04), C.yellow);
  helmetBadgeGroup.add(helmetBracket);

  // Plat dasar putih solid agar logo PLN sangat kontras
  const helmetPlate = new T.Mesh(new T.BoxGeometry(0.46, 0.61, 0.05), C.white);
  helmetPlate.position.z = 0.005;
  helmetBadgeGroup.add(helmetPlate);

  // Logo resmi PLN di dahi helm
  const badge = new T.Mesh(new T.PlaneGeometry(0.42, 0.57), plnBadgeMat);
  badge.position.z = 0.035;
  helmetBadgeGroup.add(badge);

  // Lencana samping helm kiri & kanan
  [-1, 1].forEach((side) => {
    const sidePlate = new T.Mesh(new T.PlaneGeometry(0.28, 0.38), C.white);
    sidePlate.position.set(side * 1.10, 0.70, 0.32);
    sidePlate.rotation.y = side * (Math.PI / 2.2);
    sidePlate.rotation.z = side * -0.1;
    head.add(sidePlate);

    const sideBadge = new T.Mesh(new T.PlaneGeometry(0.26, 0.36), plnBadgeMat);
    sideBadge.position.set(side * 1.105, 0.70, 0.32);
    sideBadge.rotation.y = side * (Math.PI / 2.2);
    sideBadge.rotation.z = side * -0.1;
    head.add(sideBadge);
  });

  /* ================= 3. LEHER & TUBUH FEMININ ================= */
  // Leher ramping anggun
  cyl(0.20, 0.22, 0.28, C.metal, [0, -0.06, 0], g);
  cyl(0.24, 0.24, 0.06, C.strip, [0, -0.12, 0], g); // Kerah cincin perak

  // Badan atas: Wearpack Biru PLN dengan lekukan pinggang feminin
  ball(0.85, C.blue, [0.65, 0.85, 0.55], [0, -0.70, 0], g);

  // Rompi Safety K3 Oranye Reflektif (Feminine-fit Safety Vest)
  const vest = new T.Mesh(
    new T.SphereGeometry(0.86, 32, 16, 0, Math.PI * 2, Math.PI * 0.26, Math.PI * 0.48),
    C.orange
  );
  vest.scale.set(0.68, 0.88, 0.58);
  vest.position.y = -0.70;
  g.add(vest);

  // Strip reflektif perak pada rompi K3 (Dada & Pinggang)
  [[-0.58, 0.69, 0.59], [-0.88, 0.66, 0.56]].forEach(([y, sx, sz]) => {
    const s = cyl(0.88, 0.88, 0.06, C.strip, [0, y, 0], g, true);
    s.scale.set(sx, 1, sz);
  });

  // Name Tag Resmi di Dada Rompi K3: "PLN PUSHARLIS" - "SAFETY BUDDY"
  const nameTagMat = createNameTagTexture(T);
  const chestBadgeGroup = new T.Group();
  chestBadgeGroup.position.set(0, -0.45, 0.54);
  chestBadgeGroup.rotation.x = -0.1;
  g.add(chestBadgeGroup);

  const chestBracket = new T.Mesh(new T.BoxGeometry(0.54, 0.26, 0.04), C.yellow);
  chestBadgeGroup.add(chestBracket);

  const chestNameTag = new T.Mesh(new T.PlaneGeometry(0.50, 0.22), nameTagMat);
  chestNameTag.position.z = 0.025;
  chestBadgeGroup.add(chestNameTag);

  // Sabuk pinggang K3 utilitas dengan gesper perak
  cyl(0.52, 0.54, 0.12, C.boot, [0, -1.14, 0], g);
  const buckle = new T.Mesh(new T.BoxGeometry(0.20, 0.14, 0.05), C.metal);
  buckle.position.set(0, -1.14, 0.52);
  g.add(buckle);

  // --- PEPLUM / SAFETY SKIRT FLARE (Ciri Siluet Feminin yang Sangat Jelas) ---
  // Trim rok peplum seragam K3 di atas celana wearpack
  const skirt = new T.Mesh(
    new T.CylinderGeometry(0.52, 0.72, 0.26, 32, 1, true),
    C.blue
  );
  skirt.position.set(0, -1.26, 0);
  g.add(skirt);

  // Lis trim reflektif oranye pada rok peplum
  const skirtTrim = new T.Mesh(
    new T.CylinderGeometry(0.70, 0.73, 0.05, 32, 1, true),
    C.orange
  );
  skirtTrim.position.set(0, -1.37, 0);
  g.add(skirtTrim);

  /* ================= 4. LENGAN & POSE RAMAH ================= */
  // Lengan ramping feminin dengan sarung tangan putih
  const makeArm = (side) => {
    const a = new T.Group();
    a.position.set(side * 0.68, -0.48, 0);

    // Sendi bahu
    ball(0.12, C.blue,  [1, 1, 1],   [0, 0, 0], a);
    // Lengan atas
    cyl(0.10, 0.09, 0.35, C.blue,   [0, -0.20, 0], a);
    // Sendi siku perak
    ball(0.095, C.metal, [1, 1, 1], [0, -0.40, 0], a);
    // Lengan bawah putih/biru
    cyl(0.09, 0.08, 0.32, C.white,  [0, -0.58, 0], a);
    // Manset sarung tangan kuning K3
    cyl(0.10, 0.10, 0.06, C.gloveCuff, [0, -0.74, 0], a);
    // Sarung tangan putih rapi
    ball(0.12, C.glove, [0.9, 1.2, 0.8], [0, -0.84, 0], a);
    // Jempol
    ball(0.045, C.glove, [1, 1, 1],  [side * 0.08, -0.80, 0.04], a);

    g.add(a);
    return a;
  };

  // Tangan kiri anggun di samping
  const leftArm = makeArm(-1);
  leftArm.rotation.z = -0.22;
  leftArm.rotation.x = 0.10;

  // Tangan kanan melambai ramah menyapa tamu
  const rightArm = makeArm(1);
  rightArm.rotation.z = 0.35;

  /* ================= 5. KAKI & SEPATU SAFETY ================= */
  // Celana wearpack biru ramping dengan aksen strip reflektif
  [-0.24, 0.24].forEach((x) => {
    // Paha
    cyl(0.13, 0.12, 0.40, C.blue,  [x, -1.52, 0], g);
    // Lutut dengan strip reflektif perak K3
    cyl(0.135, 0.135, 0.06, C.strip, [x, -1.74, 0], g);
    // Betis
    cyl(0.12, 0.11, 0.30, C.blue,  [x, -1.90, 0], g);
    // Sepatu Safety Boots
    ball(0.18, C.boot,   [0.9, 0.65, 1.45], [x, -2.05, 0.08], g);
    // Steel toe cap pelindung depan sepatu
    ball(0.14, C.toeCap, [0.85, 0.60, 0.95], [x, -2.05, 0.35], g);
  });

  // Bayangan lembut di lantai
  const shadow = new T.Mesh(
    new T.CircleGeometry(0.85, 36),
    new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.18;
  g.add(shadow);

  return { g, head, eyes, mouth, smile, blushGroup, arm: rightArm, leftArm, twintails, tip };
}

function animate(ms) {
  requestAnimationFrame(animate);
  const t = ms / 1000;
  const R = robot;
  if (!R) return;

  // Gerakan menoleh halus, bernapas & sedikit tilt anggun
  R.head.rotation.y = Math.sin(t * 0.8) * 0.22;
  R.head.rotation.z = Math.sin(t * 0.8) * 0.04; // Head tilt manis
  R.head.rotation.x = Math.sin(t * 0.6) * 0.04;
  R.head.position.y = 0.95 + Math.sin(t * 1.6) * 0.025;

  // Ayunan lembut kuncir rambut robotik (Twintails gentle sway)
  if (R.twintails && R.twintails.length) {
    R.twintails[0].rotation.z = -Math.sin(t * 1.6) * 0.08 - 0.05;
    R.twintails[1].rotation.z =  Math.sin(t * 1.6) * 0.08 + 0.05;
  }

  // Gerakan artikulasi mulut saat berbicara
  const isSpeaking = (typeof speaking !== 'undefined' && speaking);
  const talk = isSpeaking ? 0.25 + Math.abs(Math.sin(t * 14)) * 0.85 : 0.2;
  R.mouth.scale.y += (talk - R.mouth.scale.y) * 0.4;
  R.mouth.visible = isSpeaking;
  R.smile.visible = !isSpeaking;

  // Rona pipi berdenyut hangat saat berbicara
  if (R.blushGroup) {
    const blushScale = isSpeaking ? (1.0 + Math.sin(t * 6) * 0.15) : 1.0;
    R.blushGroup.scale.set(blushScale, blushScale, 1.0);
  }

  // Gerakan melambaikan tangan kanan ramah
  const isWaving = (typeof waveUntil !== 'undefined') ? (isSpeaking || ms < waveUntil) : isSpeaking;
  const targetArmZ = isWaving ? (2.4 + Math.sin(t * 8) * 0.35) : 0.35;
  R.arm.rotation.z += (targetArmZ - R.arm.rotation.z) * 0.15;

  // Kedipan mata periodik (Cute blink)
  const isBlinking = (Math.sin(t * 1.3) > 0.982 || (t % 4.5) > 4.4);
  R.eyes.scale.y = isBlinking ? 0.08 : 1;

  // Efek kedip lampu senter di atas helm
  R.tip.material.emissiveIntensity = 0.6 + Math.sin(t * 4) * 0.4;

  renderer.render(scene, camera);
}
