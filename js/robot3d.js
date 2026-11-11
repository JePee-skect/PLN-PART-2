/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   Robot 3D Three.js: Asisten Virtual Concierge Putri PLN "PLN ners"
   Desain Ultra-HD, Feminin Anggun, Profesional & Logo PLN Berkontras Tinggi
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
      renderer.toneMappingExposure = 1.05;
    }
    if (THREE.sRGBEncoding) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    } else if (THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(36, 260 / 380, 0.1, 50);
    camera.position.set(0, 0.1, 8.0);

    // Pencahayaan Studio Halus, Seimbang & Bebas Silau (HD Soft Balanced Lighting)
    scene.add(new THREE.AmbientLight(0xffffff, 0.80));

    // Key Light Utama (Putih Bersih dari atas kanan)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
    keyLight.position.set(2.2, 3.5, 4.0);
    scene.add(keyLight);

    // Fill Light Biru Cyan PLN Lembut (Memberikan refleksi biru khas PLN dari kiri)
    const fillLight = new THREE.DirectionalLight(0x00d2f0, 0.45);
    fillLight.position.set(-2.5, 0.0, 3.0);
    scene.add(fillLight);

    // Rim Light Emas Mewah di Belakang (Mempertegas siluet cantik & rambut)
    const rimLight = new THREE.DirectionalLight(0xffdf6d, 0.55);
    rimLight.position.set(0, 3.0, -3.5);
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
 * Texture ID Card & Logo Resmi PLN Ultra-HD (512x700)
 * Menggunakan MeshBasicMaterial sehingga warna 100% cerah,
 * tidak luntur/terbakar oleh pencahayaan 3D, dan nama "PLN ners" terpampang nyata.
 */
function createPLNLogoTexture(T) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');

  function renderIDCard(imgObj) {
    // 1. Dasar ID Card putih bersih solid
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 700);

    // 2. Header Strip Biru Dongker Resmi PLN (#002855)
    ctx.fillStyle = '#002855';
    ctx.fillRect(0, 0, 512, 100);

    // Garis Aksen Emas PLN di Bawah Header
    ctx.fillStyle = '#ffe600';
    ctx.fillRect(0, 94, 512, 6);

    // Teks Header Resmi Perusahaan
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 24px "Poppins", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PT PLN (PERSERO)', 256, 50);

    // 3. Logo Resmi PLN
    if (imgObj && imgObj.complete && imgObj.naturalWidth > 0) {
      // Gambar logo asli dari img/pln-logo.png dengan rasio proporsional sempurna
      const dw = 250;
      const dh = Math.round(dw * (imgObj.height / imgObj.width));
      ctx.drawImage(imgObj, (512 - dw) / 2, 115, dw, Math.min(dh, 335));
    } else {
      // Fallback Vektor Logo PLN Super Tajam & Kontras Tinggi
      const bx = 136, by = 130, bw = 240, bh = 240;

      // Kotak Kuning Terang Khas PLN (#ffe600)
      ctx.fillStyle = '#ffe600';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 20);
      else ctx.fillRect(bx, by, bw, bh);
      ctx.fill();

      // 3 Gelombang Air Biru (#0093d8)
      ctx.strokeStyle = '#0093d8';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let row = 0; row < 3; row++) {
        const y = by + 65 + row * 45;
        ctx.beginPath();
        ctx.moveTo(bx + 20, y);
        ctx.bezierCurveTo(bx + 60, y - 22, bx + 100, y + 22, bx + 140, y);
        ctx.bezierCurveTo(bx + 180, y - 22, bx + 210, y + 22, bx + 225, y);
        ctx.stroke();
      }

      // Kilatan Petir Merah PLN (#ed1c24) dengan outline tegas
      ctx.fillStyle = '#ed1c24';
      ctx.strokeStyle = '#c4131b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx + 145, by + 18);
      ctx.lineTo(bx + 75,  by + 130);
      ctx.lineTo(bx + 128, by + 130);
      ctx.lineTo(bx + 115, by + 228);
      ctx.lineTo(bx + 190, by + 116);
      ctx.lineTo(bx + 142, by + 116);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Tulisan "PLN" Biru Dongker Tebal di Bawah Emblem
      ctx.fillStyle = '#002855';
      ctx.font = '900 80px "Poppins", Arial, sans-serif';
      ctx.fillText('PLN', 256, 420);
    }

    // 4. Unit Kerja: "PUSHARLIS UP2W VI"
    ctx.fillStyle = '#007a87';
    ctx.font = 'bold 22px "Poppins", Arial, sans-serif';
    ctx.fillText('PUSHARLIS UP2W VI', 256, 475);

    // Garis Pemisah Keamanan Hijau
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(40, 508);
    ctx.lineTo(472, 508);
    ctx.stroke();

    // 5. NAMA ASISTEN VIRTUAL: "PLN ners"
    ctx.fillStyle = '#002855';
    ctx.font = '900 46px "Poppins", Arial, sans-serif';
    ctx.fillText('PLN ners', 256, 555);

    // Jabatan / Peran
    ctx.fillStyle = '#e67e22';
    ctx.font = 'bold 18px "Poppins", Arial, sans-serif';
    ctx.fillText('VIRTUAL CONCIERGE & K3LH', 256, 595);

    // 6. Footer ID Card: Smart Chip Emas & Status
    ctx.fillStyle = '#d4af37';
    ctx.fillRect(40, 625, 48, 38);
    ctx.strokeStyle = '#b8972e';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 625, 48, 38);

    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 16px "Poppins", Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('● OFFICIAL VMS ASSISTANT', 472, 645);

    // Bingkai Luar ID Card Emas Elegan
    ctx.strokeStyle = '#f2c94c';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 502, 690);
  }

  renderIDCard(null);

  const canvasTex = new T.CanvasTexture(canvas);
  canvasTex.generateMipmaps = true;
  canvasTex.minFilter = T.LinearMipmapLinearFilter;
  canvasTex.magFilter = T.LinearFilter;
  if (renderer && renderer.capabilities) {
    canvasTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  }

  // Muat gambar pln-logo.png jika berhasil diakses
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      renderIDCard(img);
      canvasTex.needsUpdate = true;
    };
    img.src = 'img/pln-logo.png';
  } catch (e) {}

  // MeshBasicMaterial memastikan warna logo & nama selalu 100% cerah & tidak washed-out
  return new T.MeshBasicMaterial({
    map: canvasTex,
    side: T.DoubleSide
  });
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
    // Keramik porselen putih feminin anggun
    porcelain:   mat(0xfcfdff, { roughness: 0.15, metalness: 0.10 }),
    skin:        mat(0xffffff, { roughness: 0.12, metalness: 0.05 }),
    hairWhite:   mat(0xf4f7fa, { roughness: 0.20, metalness: 0.12 }),
    hairCyan:    mat(0x00d2f0, { roughness: 0.18, metalness: 0.35 }), // Highlight rambut cyan PLN
    plnTeal:     mat(0x007a87, { roughness: 0.22, metalness: 0.28 }), // Signature Teal PLN
    plnNavy:     mat(0x002855, { roughness: 0.25, metalness: 0.20 }), // Corporate Navy
    gold:        mat(0xf5c518, { roughness: 0.18, metalness: 0.85 }), // Brushed Gold
    silver:      mat(0xd8e2ec, { roughness: 0.20, metalness: 0.70 }),
    visor:       mat(0x07111c, { roughness: 0.04, metalness: 0.90 }), // Obsidian Face Shield
    glow:        mat(0x00f0ff, { emissive: 0x00f0ff, emissiveIntensity: 1.6 }), // Cyan Neon Eye/Smile
    eyeSparkle:  mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1.2 }), // Eye Star Highlight
    blush:       mat(0xff5c8a, { emissive: 0xff3366, emissiveIntensity: 0.90 }), // Pink Cheeks
    coreGlow:    mat(0x00f7ff, { emissive: 0x00f7ff, emissiveIntensity: 1.8 }), // Clean Energy Arc Core
    goldGlow:    mat(0xffd500, { emissive: 0xffaa00, emissiveIntensity: 1.4 }),
    lash:        mat(0x0a1017, { roughness: 0.15, metalness: 0.50 }),
    lanyard:     mat(0x002244, { roughness: 0.40, metalness: 0.05 })  // Pita Tali ID Card
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

  // Bentuk kepala android wanita ramping, bulat halus & proporsional
  ball(0.88, C.porcelain, [1.02, 1.08, 1.00], [0, 0, 0], head, 54);

  // Visor kaca obsidian gelap melengkung (wajah digital elegan)
  ball(0.70, C.visor, [1.00, 0.78, 0.44], [0, 0.02, 0.66], head, 48);

  // --- GAYA RAMBUT FEMININ: SLEEK CYBER-BOB HAIRSTYLE ---
  // Rambut luar putih mutiara memeluk kepala dengan potongan bob modern rapi
  const hairCap = new T.Mesh(
    new T.SphereGeometry(0.91, 48, 28, 0, Math.PI * 2, 0, Math.PI * 0.56),
    C.hairWhite
  );
  hairCap.scale.set(1.03, 1.09, 1.02);
  hairCap.position.set(0, 0.05, -0.05);
  hairCap.rotation.x = -0.12;
  head.add(hairCap);

  // Poni dahi halus melengkung (Soft rounded bangs, TIDAK ADA TANDUK / CONE YANG MENCUAT)
  ball(0.20, C.hairWhite, [1.00, 0.52, 0.30], [0, 0.42, 0.74], head);
  ball(0.16, C.hairWhite, [0.85, 0.50, 0.28], [-0.25, 0.38, 0.72], head);
  ball(0.16, C.hairWhite, [0.85, 0.50, 0.28], [0.25, 0.38, 0.72], head);

  // Helai rambut samping (Side locks menjuntai anggun membingkai pipi)
  const hairLocks = [];
  [-1, 1].forEach((side) => {
    // Rambut luar putih
    const lock = cyl(0.10, 0.035, 0.85, C.hairWhite, [side * 0.88, -0.20, 0.18], head, false, 28);
    lock.rotation.z = side * -0.15;
    lock.rotation.x = 0.05;
    hairLocks.push(lock);

    // Highlight rambut dalam Cyan PLN
    const highlight = cyl(0.045, 0.016, 0.68, C.hairCyan, [side * 0.82, -0.18, 0.25], head, false, 20);
    highlight.rotation.z = side * -0.18;

    // Jepit rambut / barrette emas elegan di pelipis
    const clip = new T.Mesh(new T.BoxGeometry(0.05, 0.14, 0.02), C.gold);
    clip.position.set(side * 0.84, 0.26, 0.45);
    clip.rotation.y = side * 0.35;
    head.add(clip);
  });

  // --- HEADSET OPERATOR CONCIERGE COMMUNICATOR (RAPAT & PAS DI KEPALA) ---
  // Bando Headset emas rapat memeluk rambut dari telinga kiri ke kanan (tanpa celah mengapung)
  const headsetBand = new T.Mesh(
    new T.TorusGeometry(0.95, 0.024, 12, 48, Math.PI),
    C.gold
  );
  headsetBand.position.set(0, 0.02, 0);
  headsetBand.rotation.x = 0.06;
  head.add(headsetBand);

  // Pin Emblem Miniatur PLN di Puncak Bando Tengah
  const topPin = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.03, 24), C.gold);
  topPin.position.set(0, 0.97, 0.04);
  topPin.rotation.x = Math.PI / 2;
  head.add(topPin);

  const topPinGlow = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.032, 24), C.glow);
  topPinGlow.position.set(0, 0.97, 0.045);
  topPinGlow.rotation.x = Math.PI / 2;
  head.add(topPinGlow);

  // Earpod Headset di telinga kiri dan kanan
  [-1, 1].forEach((k) => {
    const earpod = cyl(0.20, 0.20, 0.12, C.porcelain, [k * 0.96, 0.02, 0], head);
    earpod.rotation.z = Math.PI / 2;

    const ring = new T.Mesh(new T.TorusGeometry(0.16, 0.018, 8, 24), C.gold);
    ring.position.set(k * 1.04, 0.02, 0);
    ring.rotation.y = Math.PI / 2;
    head.add(ring);

    const led = cyl(0.10, 0.10, 0.02, C.glow, [k * 1.05, 0.02, 0], head);
    led.rotation.z = Math.PI / 2;
  });

  // Boom Mic mini di earpod kiri melengkung santun ke arah mulut
  const micArm = cyl(0.014, 0.014, 0.36, C.silver, [-0.85, -0.06, 0.30], head);
  micArm.rotation.x = Math.PI / 2.6;
  micArm.rotation.z = -0.38;
  ball(0.032, C.glow, [1, 1, 1.2], [-0.68, -0.16, 0.58], head); // LED mikrofon aktif

  // --- MATA FEMININ DIGITAL ANGGUN (100% SIMETRIS, TAMPIL MANIS & HD) ---
  const eyesGroup = new T.Group();
  head.add(eyesGroup);

  // Gunakan pencerminan scale.set(side, 1, 1) agar mata kiri dan kanan 100% simetris sempurna!
  [-1, 1].forEach((side) => {
    const eye = new T.Group();
    eye.position.set(side * 0.27, 0.04, 0.98);
    eye.scale.set(side, 1, 1); // Cerminkan sumbu X secara matematis
    eyesGroup.add(eye);

    // Eyeliner / Bulu mata atas melengkung anggun (Glossy black eyeliner arch)
    const upperLash = new T.Mesh(
      new T.TorusGeometry(0.125, 0.020, 10, 32, Math.PI * 0.65),
      C.lash
    );
    upperLash.rotation.z = Math.PI * 0.18;
    eye.add(upperLash);

    // Lengkungan iris mata digital cyan bercahaya (Bright anime cyan iris)
    const irisGlow = new T.Mesh(
      new T.TorusGeometry(0.100, 0.024, 10, 32, Math.PI * 0.62),
      C.glow
    );
    irisGlow.position.set(0, -0.01, 0.01);
    irisGlow.rotation.z = Math.PI * 0.19;
    eye.add(irisGlow);

    // Bintang kilau mata anime (Twin sparkle stars)
    ball(0.034, C.eyeSparkle, [1, 1, 0.6], [0.03, 0.05, 0.02], eye);
    ball(0.018, C.eyeSparkle, [1, 1, 0.6], [-0.04, 0.00, 0.02], eye);

    // Bulu mata lentik di sudut luar atas
    const lash1 = cyl(0.005, 0.016, 0.11, C.lash, [0.12, 0.09, 0.01], eye);
    lash1.rotation.z = -0.55;

    const lash2 = cyl(0.004, 0.012, 0.08, C.lash, [0.13, 0.05, 0.01], eye);
    lash2.rotation.z = -0.95;
  });

  // --- RONA PIPI MERONA PINK HALUS (SWEET BLUSH MARKS) ---
  const blushGroup = new T.Group();
  head.add(blushGroup);
  [-0.36, 0.36].forEach((x) => {
    ball(0.055, C.blush, [1.5, 0.6, 0.3], [x, -0.11, 0.94], blushGroup);
  });

  // --- SENYUM MANIS & GELOMBANG SUARA DIGITAL ---
  const smile = new T.Mesh(
    new T.TorusGeometry(0.11, 0.016, 8, 24, Math.PI * 0.60),
    C.glow
  );
  smile.rotation.z = Math.PI * 1.20;
  smile.position.set(0, -0.19, 0.99);
  head.add(smile);

  // Equalizer bar mulut dinamis saat berbicara
  const mouthBars = [];
  const barSpacing = 0.055;
  for (let i = -2; i <= 2; i++) {
    const bar = new T.Mesh(new T.BoxGeometry(0.020, 0.09, 0.02), C.glow);
    bar.position.set(i * barSpacing, -0.19, 1.00);
    bar.scale.y = 0.2;
    head.add(bar);
    mouthBars.push(bar);
  }

  /* ================= 2. SERAGAM KORPORAT & BLAZER PLN ================= */
  // Leher ramping feminin
  cyl(0.15, 0.17, 0.22, C.skin, [0, -0.03, 0], g);
  // Choker emas elegan di leher
  cyl(0.18, 0.18, 0.035, C.gold, [0, -0.06, 0], g);

  // Badan Utama: Tailored Corporate Suit (Siluet feminin anggun)
  const torso = new T.Group();
  torso.position.y = -0.68;
  g.add(torso);

  // Bodi keramik putih mutiara
  ball(0.78, C.porcelain, [0.74, 0.90, 0.60], [0, 0, 0], torso, 48);

  // Kerah Blazer Formal PLN Signature Teal
  [-0.26, 0.26].forEach((x, idx) => {
    const side = (idx === 0) ? -1 : 1;
    const lapel = new T.Mesh(new T.BoxGeometry(0.24, 0.54, 0.07), C.plnTeal);
    lapel.position.set(x, 0.12, 0.46);
    lapel.rotation.y = side * -0.20;
    lapel.rotation.z = side * 0.08;
    torso.add(lapel);

    const lapelGold = new T.Mesh(new T.BoxGeometry(0.028, 0.56, 0.08), C.gold);
    lapelGold.position.set(x - side * 0.12, 0.12, 0.48);
    lapelGold.rotation.y = side * -0.20;
    lapelGold.rotation.z = side * 0.08;
    torso.add(lapelGold);
  });

  // Reaktor Daya Bersih Arc Core (Cyan Glowing Center)
  const coreBezel = cyl(0.14, 0.14, 0.04, C.gold, [0, 0.18, 0.50], torso);
  coreBezel.rotation.x = Math.PI / 2;

  const arcCore = cyl(0.10, 0.10, 0.05, C.coreGlow, [0, 0.18, 0.51], torso);
  arcCore.rotation.x = Math.PI / 2;

  // Sabuk Emas Ramping di Pinggang
  const belt = cyl(0.48, 0.48, 0.05, C.gold, [0, -0.32, 0], torso);
  const beltBuckle = cyl(0.08, 0.08, 0.06, C.glow, [0, -0.32, 0.45], torso);
  beltBuckle.rotation.x = Math.PI / 2;

  /* ================= 3. LENCANA ID CARD RESMI "PLN ners" ================= */
  // Tali lanyard biru dongker melingkar dari kerah
  const lanyardGroup = new T.Group();
  torso.add(lanyardGroup);

  const strap = cyl(0.012, 0.012, 0.28, C.lanyard, [0.18, 0.38, 0.48], lanyardGroup);
  strap.rotation.z = 0.15;

  // Penjepit ID Card Emas
  const idClip = new T.Mesh(new T.BoxGeometry(0.06, 0.04, 0.03), C.gold);
  idClip.position.set(0.18, 0.28, 0.52);
  lanyardGroup.add(idClip);

  // Kartu ID Resmi: Menampilkan Logo PLN & Nama "PLN ners"
  const plnCardMat = createPLNLogoTexture(T);
  const badgeCardGroup = new T.Group();
  badgeCardGroup.position.set(0.18, 0.10, 0.52);
  badgeCardGroup.rotation.set(-0.04, -0.10, 0);
  torso.add(badgeCardGroup);

  // Papan belakang ID card dengan bingkai emas
  const badgeBacking = new T.Mesh(new T.BoxGeometry(0.38, 0.52, 0.02), C.gold);
  badgeCardGroup.add(badgeBacking);

  // Layar depan ID Card bertekstur tajam
  const badgeFront = new T.Mesh(new T.PlaneGeometry(0.36, 0.50), plnCardMat);
  badgeFront.position.z = 0.015;
  badgeCardGroup.add(badgeFront);

  /* ================= 4. TANGAN & GESTUR MENYAMBUT HANGAT ================= */
  // Pundak halus porcelain
  [-0.64, 0.64].forEach((x, idx) => {
    const side = (idx === 0) ? -1 : 1;
    ball(0.12, C.gold, [1, 1, 1], [x, 0.30, 0], torso);
    ball(0.16, C.porcelain, [1.05, 0.85, 1.0], [x + side * 0.03, 0.34, 0], torso);
  });

  // --- TANGAN KIRI (Memegang Tablet Data Tamu di Samping Pinggul) ---
  const leftArm = new T.Group();
  leftArm.position.set(-0.66, -0.34, 0);
  g.add(leftArm);

  // Lengan atas
  cyl(0.075, 0.065, 0.36, C.porcelain, [0, -0.18, 0.04], leftArm).rotation.x = 0.20;
  // Sendi siku emas
  ball(0.07, C.gold, [1, 1, 1], [0, -0.36, 0.08], leftArm);

  // Lengan bawah mengarah ke depan memegang tablet
  const leftForearm = cyl(0.065, 0.055, 0.34, C.porcelain, [0.08, -0.48, 0.22], leftArm);
  leftForearm.rotation.x = 0.65;
  leftForearm.rotation.z = -0.18;

  // Telapak tangan memegang tepi tablet
  const leftHand = ball(0.065, C.skin, [0.9, 0.5, 1.1], [0.14, -0.58, 0.36], leftArm);

  // Tablet Layar Sentuh Data Pengunjung
  const tabletGroup = new T.Group();
  tabletGroup.position.set(0.12, -0.56, 0.40);
  tabletGroup.rotation.set(-0.25, 0.38, -0.12);
  leftArm.add(tabletGroup);

  const tabletBody = new T.Mesh(new T.BoxGeometry(0.46, 0.62, 0.02), C.porcelain);
  tabletGroup.add(tabletBody);

  const tabletBezel = new T.Mesh(new T.BoxGeometry(0.48, 0.64, 0.015), C.gold);
  tabletBezel.position.z = -0.008;
  tabletGroup.add(tabletBezel);

  const tabletMat = createTabletTexture(T);
  const tabletScreen = new T.Mesh(new T.PlaneGeometry(0.42, 0.58), tabletMat);
  tabletScreen.position.z = 0.015;
  tabletGroup.add(tabletScreen);

  // --- TANGAN KANAN: GESTUR "SALAM SANTUN PLN" (Menyambut Hangat) ---
  const rightArm = new T.Group();
  rightArm.position.set(0.66, -0.34, 0);
  g.add(rightArm);

  // Lengan atas kanan turun santun
  cyl(0.075, 0.065, 0.36, C.porcelain, [0, -0.18, 0.02], rightArm);
  // Sendi siku emas
  ball(0.07, C.gold, [1, 1, 1], [0, -0.36, 0.02], rightArm);

  // Grup lengan bawah dengan engsel siku fleksibel untuk gestur melambai
  const rightForearmGroup = new T.Group();
  rightForearmGroup.position.set(0, -0.36, 0.02);
  rightForearmGroup.rotation.set(0.55, -0.18, -0.15);
  rightArm.add(rightForearmGroup);

  // Batang lengan bawah
  cyl(0.065, 0.055, 0.34, C.porcelain, [0, -0.17, 0], rightForearmGroup);
  // Cincin pergelangan tangan emas
  cyl(0.060, 0.060, 0.03, C.gold, [0, -0.32, 0], rightForearmGroup);

  // Telapak tangan terbuka menyambut anggun (Feminine Welcoming Palm)
  const rightHand = ball(0.065, C.skin, [1.0, 0.35, 1.2], [0, -0.38, 0.02], rightForearmGroup);
  rightHand.rotation.set(0.20, -0.15, 0);

  // Jari-jari feminin lentik & teratur menyambut tamu
  for (let f = -1.5; f <= 1.5; f++) {
    const finger = cyl(0.012, 0.009, 0.09, C.skin, [f * 0.022, -0.44, 0.02], rightForearmGroup);
    finger.rotation.x = 0.12;
  }
  // Ibu jari menyambut
  const thumb = cyl(0.013, 0.010, 0.07, C.skin, [-0.045, -0.39, 0.03], rightForearmGroup);
  thumb.rotation.set(0.25, 0, 0.55);

  /* ================= 5. ROK HOVER & CHASSIS LEVITASI ================= */
  // Rok Hover Anggun (Feminine Peplum Skirt Chassis)
  const hoverSkirt = cyl(0.48, 0.22, 0.54, C.porcelain, [0, -1.26, 0], g, false, 48);
  cyl(0.49, 0.40, 0.08, C.plnTeal, [0, -1.14, 0], g); // Aksen list rok teal
  cyl(0.32, 0.22, 0.05, C.gold,    [0, -1.40, 0], g); // Nozzle emas

  // Cahaya pendorong anti-gravitasi lembut
  const thrusterGlow = cyl(0.18, 0.06, 0.10, C.coreGlow, [0, -1.48, 0], g);

  // Cincin Orbital Holografik 1 (Inner Cyan)
  const ring1 = new T.Mesh(new T.TorusGeometry(0.85, 0.022, 8, 48), C.glow);
  ring1.position.y = -1.58;
  ring1.rotation.x = Math.PI / 2;
  g.add(ring1);

  // Cincin Orbital Holografik 2 (Outer Gold)
  const ring2 = new T.Mesh(new T.TorusGeometry(1.10, 0.018, 8, 48), C.goldGlow);
  ring2.position.y = -1.70;
  ring2.rotation.x = Math.PI / 2;
  g.add(ring2);

  // Bayangan ambient lembut di lantai
  const shadow = new T.Mesh(
    new T.CircleGeometry(0.92, 36),
    new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.05;
  g.add(shadow);

  return {
    g,
    head,
    eyes: eyesGroup,
    mouthBars,
    smile,
    blushGroup,
    arcCore,
    rightArm,
    rightForearmGroup,
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
  const targetHeadY = mouseTargetX * 0.70 + Math.sin(t * 0.8) * 0.08;
  const targetHeadX = -mouseTargetY * 0.50 + Math.sin(t * 0.6) * 0.025;
  const targetHeadZ = mouseTargetX * 0.15 + Math.sin(t * 0.8) * 0.025;

  R.head.rotation.y += (targetHeadY - R.head.rotation.y) * 0.08;
  R.head.rotation.x += (targetHeadX - R.head.rotation.x) * 0.08;
  R.head.rotation.z += (targetHeadZ - R.head.rotation.z) * 0.08;

  // 3. Ayunan Halus Helai Rambut (Gentle hair sway)
  if (R.hairLocks && R.hairLocks.length === 2) {
    R.hairLocks[0].rotation.z = -0.15 + Math.sin(t * 1.8) * 0.035;
    R.hairLocks[1].rotation.z =  0.15 - Math.sin(t * 1.8) * 0.035;
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

  // 8. Gerakan Tangan Menyambut Ramah ("Salam Santun PLN ners")
  const isWaving = (typeof waveUntil !== 'undefined') ? (isSpeaking || ms < waveUntil) : isSpeaking;
  if (R.rightForearmGroup) {
    const targetWaveZ = isWaving ? (-0.15 + Math.sin(t * 6.0) * 0.20) : -0.15;
    const targetWaveX = isWaving ? (0.68 + Math.sin(t * 4.5) * 0.10) : 0.55;
    R.rightForearmGroup.rotation.z += (targetWaveZ - R.rightForearmGroup.rotation.z) * 0.12;
    R.rightForearmGroup.rotation.x += (targetWaveX - R.rightForearmGroup.rotation.x) * 0.12;
  }

  // 9. Kedipan Mata Cerdas & Lembut (Natural Blink)
  const isBlinking = (Math.sin(t * 1.1) > 0.985 || (t % 4.6) > 4.5);
  R.eyes.scale.y = isBlinking ? 0.05 : 1.0;

  renderer.render(scene, camera);
}