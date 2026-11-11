/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   Robot 3D Three.js: Asisten Virtual Concierge Putri PLN (HD & Ultra-Pro)
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
    const pr = Math.min(window.devicePixelRatio || 1, 3);
    renderer.setPixelRatio(pr);
    renderer.setSize(260, 380, false);

    if (THREE.ACESFilmicToneMapping) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
    }
    if (THREE.sRGBEncoding) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    } else if (THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(36, 260 / 380, 0.1, 50);
    camera.position.set(0, 0.1, 8.0);

    // Pencahayaan Studio Glamour & Profesional (HD Soft Lighting)
    scene.add(new THREE.AmbientLight(0xffffff, 0.90));

    // Key Light Utama (Terang & Hangat)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.05);
    keyLight.position.set(2.5, 4.0, 5.0);
    scene.add(keyLight);

    // Fill Light PLN Cyan (Memberikan refleksi biru lembut khas PLN)
    const fillLight = new THREE.DirectionalLight(0x00d2f0, 0.65);
    fillLight.position.set(-3.0, -0.5, 3.5);
    scene.add(fillLight);

    // Rim Light Emas Mewah di Belakang (Mempertegas siluet feminin)
    const rimLight = new THREE.DirectionalLight(0xffdf6d, 0.75);
    rimLight.position.set(0, 3.5, -4.5);
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

/**
 * Texture Logo Resmi PLN Ultra-HD (1024x1024)
 * Menjamin logo terlihat sangat tajam, berwarna kontras tinggi & tidak pecah.
 */
function createPLNLogoTexture(T) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');

  function drawSharpVectorLogo() {
    // Background putih bersih solid
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 700);

    // Bingkai kuning emas tipis
    ctx.strokeStyle = '#f2c94c';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 500, 688);

    // KOTAK KUNING KHAS PLN (Official Bright Yellow)
    ctx.fillStyle = '#ffe600';
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(36, 40, 440, 440, 24) : ctx.fillRect(36, 40, 440, 440);
    ctx.fill();

    // 3 Gelombang Air Biru (Official PLN Blue)
    ctx.strokeStyle = '#0093d8';
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let row = 0; row < 3; row++) {
      const y = 165 + row * 76;
      ctx.beginPath();
      ctx.moveTo(70, y);
      ctx.bezierCurveTo(130, y - 36, 190, y + 36, 256, y);
      ctx.bezierCurveTo(320, y - 36, 380, y + 36, 442, y);
      ctx.stroke();
    }

    // Kilatan Petir Merah PLN (Official Red Lightning Bolt)
    ctx.fillStyle = '#ec1c24';
    ctx.beginPath();
    ctx.moveTo(270, 65);
    ctx.lineTo(164, 255);
    ctx.lineTo(244, 255);
    ctx.lineTo(224, 460);
    ctx.lineTo(344, 235);
    ctx.lineTo(264, 235);
    ctx.closePath();
    ctx.fill();

    // Tulisan "PLN" Biru Tebal Sangat Jelas di Bawah
    ctx.fillStyle = '#0093d8';
    ctx.font = '900 135px "Poppins", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PLN', 256, 585);
  }

  drawSharpVectorLogo();

  const canvasTex = new T.CanvasTexture(canvas);
  canvasTex.generateMipmaps = true;
  canvasTex.minFilter = T.LinearMipmapLinearFilter;
  canvasTex.magFilter = T.LinearFilter;
  if (renderer && renderer.capabilities) {
    canvasTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  const mat = new T.MeshStandardMaterial({
    map: canvasTex,
    transparent: false,
    roughness: 0.12,
    metalness: 0.08,
    side: T.FrontSide
  });

  // Muat file gambar resmi asli pln-logo.png jika berhasil diakses
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 700);
      ctx.drawImage(img, 24, 24, 464, 652);
      canvasTex.needsUpdate = true;
      mat.needsUpdate = true;
    };
    img.src = 'img/pln-logo.png';
  } catch (e) {}

  return mat;
}

/**
 * Tablet Layar Sentuh Data Pengunjung Holografik
 */
function createTabletTexture(T) {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0a1d28';
  ctx.fillRect(0, 0, 384, 512);

  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 368, 496);

  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 26px "Poppins", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('PLN PUSHARLIS', 192, 54);

  ctx.fillStyle = '#ffe600';
  ctx.font = 'bold 18px "Poppins", sans-serif';
  ctx.fillText('VISITOR PASS SYSTEM', 192, 86);

  ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(30, 110);
  ctx.lineTo(354, 110);
  ctx.stroke();

  const items = [
    'Verifikasi Identitas Tamu',
    'Safety Induction K3LH',
    'Pemeriksaan APD Standar',
    'Pemberian Akses Masuk'
  ];

  items.forEach((txt, idx) => {
    const y = 160 + idx * 60;
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 24px "Poppins", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('✓', 36, y);

    ctx.fillStyle = '#ffffff';
    ctx.font = '18px "Poppins", sans-serif';
    ctx.fillText(txt, 70, y);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(36, y + 20);
    ctx.lineTo(348, y + 20);
    ctx.stroke();
  });

  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 16px "Poppins", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('● SYSTEM READY & SECURE', 192, 470);

  const tex = new T.CanvasTexture(canvas);
  tex.generateMipmaps = true;

  return new T.MeshStandardMaterial({
    map: tex,
    roughness: 0.15,
    metalness: 0.10,
    emissive: 0x007a87,
    emissiveIntensity: 0.4
  });
}

function createRobot(T) {
  const mat = (color, opt = {}) => new T.MeshStandardMaterial({
    color,
    roughness: 0.25,
    metalness: 0.15,
    ...opt
  });

  const C = {
    // Porositas & kilau porselen wanita anggun
    porcelain:   mat(0xfcfdff, { roughness: 0.14, metalness: 0.12 }),
    skin:        mat(0xffffff, { roughness: 0.10, metalness: 0.05 }),
    hairWhite:   mat(0xf6f9fc, { roughness: 0.22, metalness: 0.15 }),
    hairCyan:    mat(0x00b4d8, { roughness: 0.20, metalness: 0.35 }), // Highlight rambut cyan PLN
    plnTeal:     mat(0x007a87, { roughness: 0.22, metalness: 0.30 }), // Signature Teal PLN
    plnCyan:     mat(0x00a2e8, { roughness: 0.20, metalness: 0.35 }), // Electric Cyan
    gold:        mat(0xf5c518, { roughness: 0.18, metalness: 0.85 }), // Brushed Gold Berkelas
    silver:      mat(0xd8e2ec, { roughness: 0.20, metalness: 0.70 }),
    visor:       mat(0x07111c, { roughness: 0.04, metalness: 0.90 }), // Obsidian Curved Face Shield
    glow:        mat(0x00f0ff, { emissive: 0x00f0ff, emissiveIntensity: 1.6 }), // Cyan Neon Eye/Smile
    eyeSparkle:  mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1.1 }), // Eye Star Highlight
    blush:       mat(0xff6999, { emissive: 0xff3366, emissiveIntensity: 0.85 }), // Cheerful Pink Cheeks
    coreGlow:    mat(0x00f7ff, { emissive: 0x00f7ff, emissiveIntensity: 1.9 }), // Clean Energy Arc Core
    goldGlow:    mat(0xffd500, { emissive: 0xffaa00, emissiveIntensity: 1.4 }),
    lash:        mat(0x0a1017, { roughness: 0.15, metalness: 0.50 })
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

  /* ================= 1. KEPALA & WAJAH FEMININ ANGGUN ================= */
  const head = new T.Group();
  head.position.y = 1.05;
  g.add(head);

  // Bentuk kepala android wanita ramping, halus & proporsional
  ball(0.90, C.porcelain, [1.02, 1.12, 1.00], [0, 0, 0], head, 54);

  // Visor kaca obsidian gelap melengkung (wajah digital elegan)
  ball(0.72, C.visor, [1.02, 0.78, 0.44], [0, 0.02, 0.68], head, 48);

  // --- GAYA RAMBUT FEMININ: FUTURISTIC CYBER-BOB HAIRSTYLE ---
  // Rambut luar putih mutiara memeluk kepala dengan potongan bob modern
  const hairCap = new T.Mesh(
    new T.SphereGeometry(0.93, 48, 28, 0, Math.PI * 2, 0, Math.PI * 0.58),
    C.hairWhite
  );
  hairCap.scale.set(1.04, 1.14, 1.02);
  hairCap.position.set(0, 0.08, -0.06);
  hairCap.rotation.x = -0.15;
  head.add(hairCap);

  // Poni samping anggun (Side bangs melengkung di dahi kiri & kanan)
  const bangL = cyl(0.12, 0.03, 0.62, C.hairWhite, [-0.42, 0.42, 0.70], head, false, 24);
  bangL.rotation.z = 0.55;
  bangL.rotation.x = 0.35;

  const bangR = cyl(0.11, 0.02, 0.52, C.hairWhite, [0.38, 0.46, 0.72], head, false, 24);
  bangR.rotation.z = -0.65;
  bangR.rotation.x = 0.30;

  // Helai rambut samping (Side locks menjuntai anggun membingkai pipi hingga pundak)
  const hairLocks = [];
  [-1, 1].forEach((side) => {
    // Rambut luar putih
    const lock = cyl(0.13, 0.04, 0.95, C.hairWhite, [side * 0.94, -0.22, 0.15], head, false, 28);
    lock.rotation.z = side * -0.18;
    lock.rotation.x = 0.08;
    hairLocks.push(lock);

    // Aksen highlight helai rambut dalam warna Cyan PLN (Mempercantik nuansa cewek)
    const highlight = cyl(0.06, 0.02, 0.78, C.hairCyan, [side * 0.88, -0.20, 0.28], head, false, 20);
    highlight.rotation.z = side * -0.22;
    highlight.rotation.x = 0.12;

    // Jepit rambut / aksesoris emas elegan di pelipis
    const clip = new T.Mesh(new T.BoxGeometry(0.08, 0.18, 0.03), C.gold);
    clip.position.set(side * 0.86, 0.38, 0.45);
    clip.rotation.y = side * 0.40;
    clip.rotation.z = side * -0.30;
    head.add(clip);
  });

  // Bando Tiara emas tipis di atas kepala
  const tiara = new T.Mesh(
    new T.TorusGeometry(0.92, 0.024, 8, 36, Math.PI * 0.85),
    C.gold
  );
  tiara.rotation.x = Math.PI * 0.38;
  tiara.position.set(0, 0.52, 0.10);
  head.add(tiara);

  // Logo Miniatur PLN di Puncak Tiara / Dahi Atas
  const plnMat = createPLNLogoTexture(T);
  const tiaraBadge = new T.Mesh(new T.PlaneGeometry(0.24, 0.32), plnMat);
  tiaraBadge.position.set(0, 0.96, 0.45);
  tiaraBadge.rotation.x = -0.22;
  head.add(tiaraBadge);

  // --- MATA FEMININ DIGITAL ANGGUN (RAMAH, BERSIH & JELAS) ---
  const eyes = new T.Group();
  eyes.position.set(0, 0.08, 1.02);
  head.add(eyes);

  const lashes = new T.Group();
  head.add(lashes);

  [-0.27, 0.27].forEach((x, idx) => {
    const side = (idx === 0) ? -1 : 1;

    // Lengkungan kelopak mata digital cyan (Large feminine anime eye glance)
    const eyeArc = new T.Mesh(
      new T.TorusGeometry(0.125, 0.026, 8, 24, Math.PI * 0.82),
      C.glow
    );
    eyeArc.position.set(x, -0.01, 0);
    eyeArc.rotation.z = (side === -1) ? -Math.PI * 0.09 : -Math.PI * 0.91;
    eyes.add(eyeArc);

    // Kilauan mata anime (Twin sparkle stars yang membuat mata sangat hidup & ramah)
    ball(0.032, C.eyeSparkle, [1, 1, 0.6], [x + side * 0.035, 0.06, 0.02], eyes);
    ball(0.018, C.eyeSparkle, [1, 1, 0.6], [x - side * 0.025, -0.04, 0.02], eyes);

    // Bulu Mata Lentik Atas (Curved feminine winged eyelashes)
    const lashWing = new T.Mesh(
      new T.CylinderGeometry(0.006, 0.022, 0.12, 10),
      C.lash
    );
    lashWing.position.set(x + side * 0.14, 0.13, 0.99);
    lashWing.rotation.z = side * -0.75;
    lashes.add(lashWing);

    const lashWing2 = new T.Mesh(
      new T.CylinderGeometry(0.004, 0.016, 0.09, 8),
      C.lash
    );
    lashWing2.position.set(x + side * 0.15, 0.08, 0.98);
    lashWing2.rotation.z = side * -1.05;
    lashes.add(lashWing2);
  });

  // --- RONA PIPI MERONA PINK HALUS (SWEET BLUSH MARKS) ---
  const blushGroup = new T.Group();
  head.add(blushGroup);
  [-0.38, 0.38].forEach((x) => {
    ball(0.065, C.blush, [1.6, 0.6, 0.3], [x, -0.10, 0.96], blushGroup);
  });

  // --- SENYUM MANIS & GELOMBANG SUARA DIGITAL ---
  // Senyum halus saat idle
  const smile = new T.Mesh(
    new T.TorusGeometry(0.12, 0.018, 8, 24, Math.PI * 0.68),
    C.glow
  );
  smile.rotation.z = Math.PI * 1.16;
  smile.position.set(0, -0.20, 1.01);
  head.add(smile);

  // Waveform equalizer bar mulut yang bergerak dinamis saat berbicara
  const mouthBars = [];
  const barSpacing = 0.065;
  for (let i = -2; i <= 2; i++) {
    const bar = new T.Mesh(new T.BoxGeometry(0.022, 0.10, 0.02), C.glow);
    bar.position.set(i * barSpacing, -0.20, 1.015);
    bar.scale.y = 0.2;
    head.add(bar);
    mouthBars.push(bar);
  }

  // --- HEADSET OPERATOR COMMUNICATOR CS (RAPI & MENEMPEL) ---
  [-1, 1].forEach((k) => {
    const earpod = cyl(0.22, 0.22, 0.14, C.porcelain, [k * 1.08, 0, 0], head);
    earpod.rotation.z = Math.PI / 2;

    const ring = new T.Mesh(new T.TorusGeometry(0.16, 0.020, 8, 24), C.glow);
    ring.position.set(k * 1.15, 0, 0);
    ring.rotation.y = Math.PI / 2;
    head.add(ring);
  });

  // Boom Mic mini di pipi kiri (Rapi menyatu ke earpod)
  const micArm = cyl(0.014, 0.014, 0.38, C.silver, [-0.92, -0.08, 0.32], head);
  micArm.rotation.x = Math.PI / 2.6;
  micArm.rotation.z = -0.38;
  ball(0.035, C.glow, [1, 1, 1.2], [-0.74, -0.18, 0.62], head); // LED indicator

  /* ================= 2. SERAGAM KORPORAT KELAS SATU PLN ================= */
  // Leher ramping feminin
  cyl(0.16, 0.18, 0.25, C.skin, [0, -0.04, 0], g);
  // Choker emas elegan di leher
  cyl(0.19, 0.19, 0.04, C.gold, [0, -0.08, 0], g);

  // Badan Utama: Tailored Corporate Suit (Pinggang ramping & dada anggun)
  const torso = new T.Group();
  torso.position.y = -0.68;
  g.add(torso);

  // Bodi keramik putih mutiara
  ball(0.80, C.porcelain, [0.76, 0.92, 0.62], [0, 0, 0], torso, 48);

  // Kerah Blazer Formal PLN Signature Teal
  [-0.28, 0.28].forEach((x, idx) => {
    const side = (idx === 0) ? -1 : 1;
    const lapel = new T.Mesh(new T.BoxGeometry(0.28, 0.58, 0.08), C.plnTeal);
    lapel.position.set(x, 0.12, 0.48);
    lapel.rotation.y = side * -0.22;
    lapel.rotation.z = side * 0.08;
    torso.add(lapel);

    const lapelGold = new T.Mesh(new T.BoxGeometry(0.032, 0.60, 0.09), C.gold);
    lapelGold.position.set(x - side * 0.14, 0.12, 0.50);
    lapelGold.rotation.y = side * -0.22;
    lapelGold.rotation.z = side * 0.08;
    torso.add(lapelGold);
  });

  // Reaktor Daya Bersih Arc Core (Cyan Glowing Center)
  const coreBezel = cyl(0.16, 0.16, 0.05, C.gold, [0, 0.18, 0.52], torso);
  coreBezel.rotation.x = Math.PI / 2;

  const arcCore = cyl(0.12, 0.12, 0.06, C.coreGlow, [0, 0.18, 0.53], torso);
  arcCore.rotation.x = Math.PI / 2;

  // ================= 3. LENCANA LOGO RESMI PLN SANGAT BESAR & JELAS =================
  // Lencana Dada Resmi Akrilik PLN Pusharlis (Besar, Terbuka, Tanpa Tertutup Apapun)
  const badgeGroup = new T.Group();
  badgeGroup.position.set(0.32, 0.24, 0.55); // Di dada kanan robot (kiri pandangan user), 100% bebas dari tablet!
  badgeGroup.rotation.y = -0.22;
  badgeGroup.rotation.x = -0.06;
  torso.add(badgeGroup);

  // Plat dasar putih tebal kontras
  const badgePlate = new T.Mesh(new T.BoxGeometry(0.44, 0.58, 0.04), C.skin);
  badgeGroup.add(badgePlate);

  // Bingkai emas mewah akrilik
  const badgeFrame = new T.Mesh(new T.BoxGeometry(0.47, 0.61, 0.025), C.gold);
  badgeFrame.position.z = -0.01;
  badgeGroup.add(badgeFrame);

  // Texture logo PLN resmi ultra-tajam
  const badgeLogo = new T.Mesh(new T.PlaneGeometry(0.40, 0.54), plnMat);
  badgeLogo.position.z = 0.026;
  badgeGroup.add(badgeLogo);

  /* ================= 4. TANGAN & GESTUR MENYAMBUT (Bebas Halangan) ================= */
  // Pundak halus porcelain feminin
  [-0.66, 0.66].forEach((x, idx) => {
    const side = (idx === 0) ? -1 : 1;
    ball(0.13, C.gold, [1, 1, 1], [x, 0.32, 0], torso);
    ball(0.18, C.porcelain, [1.1, 0.85, 1.0], [x + side * 0.04, 0.36, 0], torso);
  });

  // --- TANGAN KIRI (Pegang Tablet di Samping Pinggul - TIDAK MENUTUPI DADA) ---
  const leftArm = new T.Group();
  leftArm.position.set(-0.70, -0.32, 0);
  g.add(leftArm);

  cyl(0.085, 0.075, 0.40, C.porcelain, [0, -0.20, 0.06], leftArm).rotation.x = 0.25;
  ball(0.08, C.gold, [1, 1, 1], [0, -0.38, 0.12], leftArm);

  const leftForearm = cyl(0.075, 0.065, 0.38, C.porcelain, [-0.05, -0.55, 0.25], leftArm);
  leftForearm.rotation.x = 0.65;
  leftForearm.rotation.z = 0.20;

  // Telapak tangan memegang tablet
  ball(0.075, C.skin, [0.9, 0.5, 1.1], [-0.06, -0.68, 0.42], leftArm);

  // Tablet Data Tamu diletakkan di samping luar badan (Miring elegan menghadap user)
  const tabletGroup = new T.Group();
  tabletGroup.position.set(-0.25, -0.68, 0.55);
  tabletGroup.rotation.set(-0.25, 0.45, -0.15);
  leftArm.add(tabletGroup);

  const tabletBody = new T.Mesh(new T.BoxGeometry(0.55, 0.74, 0.025), C.porcelain);
  tabletGroup.add(tabletBody);

  const tabletBezel = new T.Mesh(new T.BoxGeometry(0.57, 0.76, 0.015), C.gold);
  tabletBezel.position.z = -0.01;
  tabletGroup.add(tabletBezel);

  const tabletMat = createTabletTexture(T);
  const tabletScreen = new T.Mesh(new T.PlaneGeometry(0.50, 0.69), tabletMat);
  tabletScreen.position.z = 0.02;
  tabletGroup.add(tabletScreen);

  // --- TANGAN KANAN: GESTUR MENYAMBUT RAMAH ("Selamat Datang di PLN") ---
  const rightArm = new T.Group();
  rightArm.position.set(0.70, -0.32, 0);
  g.add(rightArm);

  cyl(0.085, 0.075, 0.40, C.porcelain, [0, -0.18, 0], rightArm);
  ball(0.08, C.gold, [1, 1, 1], [0, -0.38, 0], rightArm);

  // Lengan bawah terangkat santun menyambut
  const rightForearm = cyl(0.075, 0.065, 0.38, C.porcelain, [0.08, -0.56, 0.18], rightArm);
  rightForearm.rotation.x = 0.75;
  rightForearm.rotation.z = -0.25;

  // Telapak tangan terbuka menyambut anggun
  const rightHand = ball(0.08, C.skin, [1.0, 0.4, 1.2], [0.15, -0.70, 0.35], rightArm);
  rightHand.rotation.x = 0.35;
  rightHand.rotation.y = -0.35;

  /* ================= 5. BASE LEVITASI & ROK HOVER FEMININ ================= */
  // Rok Hover Anggun (Feminine Hover Skirt Chassis)
  const hoverSkirt = cyl(0.50, 0.22, 0.60, C.porcelain, [0, -1.30, 0], g, false, 48);
  cyl(0.51, 0.42, 0.10, C.plnTeal, [0, -1.15, 0], g); // Aksen list rok teal
  cyl(0.35, 0.24, 0.05, C.gold,    [0, -1.45, 0], g); // Nozzle emas

  // Cahaya pendorong anti-gravitasi lembut
  const thrusterGlow = cyl(0.20, 0.06, 0.12, C.coreGlow, [0, -1.54, 0], g);

  // Cincin Orbital Holografik 1 (Inner Cyan)
  const ring1 = new T.Mesh(new T.TorusGeometry(0.85, 0.022, 8, 48), C.glow);
  ring1.position.y = -1.62;
  ring1.rotation.x = Math.PI / 2;
  g.add(ring1);

  // Cincin Orbital Holografik 2 (Outer Gold)
  const ring2 = new T.Mesh(new T.TorusGeometry(1.12, 0.018, 8, 48), C.goldGlow);
  ring2.position.y = -1.74;
  ring2.rotation.x = Math.PI / 2;
  g.add(ring2);

  // Bayangan ambient lembut di lantai
  const shadow = new T.Mesh(
    new T.CircleGeometry(0.95, 36),
    new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.12;
  g.add(shadow);

  return {
    g,
    head,
    eyes,
    mouthBars,
    smile,
    blushGroup,
    arcCore,
    arm: rightArm,
    leftArm,
    hairLocks,
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

  // 1. Levitasi Mengapung Anggun & Halus (Smooth Floating Physics)
  R.g.position.y = Math.sin(t * 1.8) * 0.055;

  // 2. Interaksi Pandangan & Head Tracking Halus Mengikuti Kursor
  const targetHeadY = mouseTargetX * 0.75 + Math.sin(t * 0.8) * 0.10;
  const targetHeadX = -mouseTargetY * 0.55 + Math.sin(t * 0.6) * 0.025;
  const targetHeadZ = mouseTargetX * 0.18 + Math.sin(t * 0.8) * 0.03; // Head tilt manis feminin

  R.head.rotation.y += (targetHeadY - R.head.rotation.y) * 0.08;
  R.head.rotation.x += (targetHeadX - R.head.rotation.x) * 0.08;
  R.head.rotation.z += (targetHeadZ - R.head.rotation.z) * 0.08;

  // 3. Ayunan Halus Helai Rambut (Gentle hair sway)
  if (R.hairLocks && R.hairLocks.length === 2) {
    R.hairLocks[0].rotation.z = -0.18 + Math.sin(t * 1.8) * 0.04;
    R.hairLocks[1].rotation.z =  0.18 - Math.sin(t * 1.8) * 0.04;
  }

  // 4. Putaran Cincin Orbital Holografik Anti-Gravitasi
  if (R.ring1 && R.ring2) {
    R.ring1.rotation.z += 0.016;
    R.ring1.rotation.x = Math.PI / 2 + Math.sin(t * 1.4) * 0.08;

    R.ring2.rotation.z -= 0.022;
    R.ring2.rotation.y = Math.cos(t * 1.1) * 0.10;
  }

  // 5. Denyut Hangat Reaktor Listrik PLN (Arc Core Pulse)
  if (R.arcCore) {
    const corePulse = isSpeaking
      ? (1.7 + Math.sin(t * 12) * 0.5)
      : (1.0 + Math.sin(t * 2.2) * 0.3);
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

  // 7. Rona Pipi Merona Lembut Saat Berbicara
  if (R.blushGroup) {
    const blushScale = isSpeaking ? (1.0 + Math.sin(t * 6) * 0.12) : 1.0;
    R.blushGroup.scale.set(blushScale, blushScale, 1.0);
  }

  // 8. Gerakan Tangan Menyambut Ramah
  const isWaving = (typeof waveUntil !== 'undefined') ? (isSpeaking || ms < waveUntil) : isSpeaking;
  const targetArmZ = isWaving ? (-0.42 + Math.sin(t * 6) * 0.18) : -0.25;
  const targetArmX = isWaving ? (0.85 + Math.sin(t * 5) * 0.12) : 0.75;
  R.arm.rotation.z += (targetArmZ - R.arm.rotation.z) * 0.12;
  R.arm.rotation.x += (targetArmX - R.arm.rotation.x) * 0.12;

  // 9. Kedipan Mata Cerdas & Lembut (Natural Blink)
  const isBlinking = (Math.sin(t * 1.1) > 0.985 || (t % 4.6) > 4.5);
  R.eyes.scale.y = isBlinking ? 0.05 : 1.0;

  renderer.render(scene, camera);
}
