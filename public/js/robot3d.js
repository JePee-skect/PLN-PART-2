/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   Robot 3D Three.js: Asisten Virtual Concierge K3 "PLN ners"
   Desain Minimalis Elegan, Bersih, Ultra-HD & Bebas Aksesoris Berlebih
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

    // Pencahayaan Studio Bersih & Lembut (HD Soft Balanced Lighting)
    scene.add(new THREE.AmbientLight(0xffffff, 0.85));

    // Key Light Utama (Putih Terang Bersih dari atas kanan)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
    keyLight.position.set(2.2, 3.5, 4.0);
    scene.add(keyLight);

    // Fill Light Biru Cyan PLN Lembut (Memberikan refleksi biru khas PLN dari kiri)
    const fillLight = new THREE.DirectionalLight(0x00d2f0, 0.40);
    fillLight.position.set(-2.5, 0.0, 3.0);
    scene.add(fillLight);

    // Rim Light Emas Mewah di Belakang (Mempertegas siluet cantik & helm)
    const rimLight = new THREE.DirectionalLight(0xffdf6d, 0.50);
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
 * Texture Logo Miniatur untuk Emblem Helm APD PLN (256x256)
 */
function createHelmetPLNLogo(T) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffe600';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 248, 248);

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

  ctx.fillStyle = '#ed1c24';
  ctx.strokeStyle = '#c4131b';
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

  ctx.fillStyle = '#002855';
  ctx.font = '900 52px "Poppins", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PLN', 128, 215);

  const canvasTex = new T.CanvasTexture(canvas);
  canvasTex.generateMipmaps = true;

  return new T.MeshBasicMaterial({
    map: canvasTex,
    side: T.DoubleSide
  });
}

/**
 * Texture Name Tag Logam Korporat Ramping & Elegan (512x200)
 * Desain bersih, horizontal, tidak memblok dada, dengan logo PLN & nama "PLN ners".
 */
function createCompactBadgeTexture(T) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');

  function renderBadge(imgObj) {
    // 1. Dasar plat putih bersih
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 200);

    // List emas mewah di sekeliling pin
    ctx.strokeStyle = '#f2c94c';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 502, 190);

    // 2. Sisi Kiri: Logo Resmi PLN
    if (imgObj && imgObj.complete && imgObj.naturalWidth > 0) {
      const dw = 110;
      const dh = Math.round(dw * (imgObj.height / imgObj.width));
      ctx.drawImage(imgObj, 25, (200 - Math.min(dh, 150)) / 2, dw, Math.min(dh, 150));
    } else {
      // Vektor Kotak Kuning PLN
      ctx.fillStyle = '#ffe600';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(25, 25, 110, 110, 12);
      else ctx.fillRect(25, 25, 110, 110);
      ctx.fill();

      // Gelombang biru PLN
      ctx.strokeStyle = '#0093d8';
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (let row = 0; row < 3; row++) {
        const y = 52 + row * 22;
        ctx.beginPath();
        ctx.moveTo(35, y);
        ctx.bezierCurveTo(55, y - 10, 75, y + 10, 95, y);
        ctx.bezierCurveTo(105, y - 10, 118, y + 10, 125, y);
        ctx.stroke();
      }

      // Petir Merah PLN
      ctx.fillStyle = '#ed1c24';
      ctx.beginPath();
      ctx.moveTo(90, 32);
      ctx.lineTo(55,  85);
      ctx.lineTo(80,  85);
      ctx.lineTo(75,  130);
      ctx.lineTo(110, 78);
      ctx.lineTo(88,  78);
      ctx.closePath();
      ctx.fill();

      // Tulisan PLN
      ctx.fillStyle = '#002855';
      ctx.font = '900 36px "Poppins", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PLN', 80, 175);
    }

    // 3. Garis pemisah vertikal elegan
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(155, 25);
    ctx.lineTo(155, 175);
    ctx.stroke();

    // 4. Sisi Kanan: Nama & Institusi Resmi
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Subtitle Institusi
    ctx.fillStyle = '#007a87';
    ctx.font = 'bold 20px "Poppins", Arial, sans-serif';
    ctx.fillText('PT PLN (PERSERO) PUSHARLIS', 175, 55);

    // NAMA UTAMA BESAR & TEGAS: "PLN ners"
    ctx.fillStyle = '#002855';
    ctx.font = '900 48px "Poppins", Arial, sans-serif';
    ctx.fillText('PLN ners', 175, 112);

    // Keterangan Peran K3
    ctx.fillStyle = '#27ae60';
    ctx.font = 'bold 18px "Poppins", Arial, sans-serif';
    ctx.fillText('● ASISTEN VIRTUAL & PETUGAS K3', 175, 155);
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

function createRobot(T) {
  const mat = (color, opt = {}) => new T.MeshStandardMaterial({
    color,
    roughness: 0.25,
    metalness: 0.15,
    ...opt
  });

  const C = {
    // Keramik porselen putih feminin anggun & bersih
    porcelain:     mat(0xfcfdff, { roughness: 0.15, metalness: 0.10 }),
    skin:          mat(0xffffff, { roughness: 0.12, metalness: 0.05 }),
    hairWhite:     mat(0xf4f7fa, { roughness: 0.20, metalness: 0.12 }),
    hairCyan:      mat(0x00d2f0, { roughness: 0.18, metalness: 0.35 }), // Highlight rambut cyan PLN
    plnTeal:       mat(0x007a87, { roughness: 0.22, metalness: 0.28 }), // Signature Teal PLN
    plnNavy:       mat(0x002855, { roughness: 0.25, metalness: 0.20 }), // Corporate Navy
    gold:          mat(0xf5c518, { roughness: 0.18, metalness: 0.85 }), // Brushed Gold
    silver:        mat(0xd8e2ec, { roughness: 0.20, metalness: 0.70 }),
    visor:         mat(0x07111c, { roughness: 0.04, metalness: 0.90 }), // Obsidian Face Shield
    glow:          mat(0x00f0ff, { emissive: 0x00f0ff, emissiveIntensity: 1.6 }), // Cyan Neon Eye/Smile
    eyeSparkle:    mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1.2 }), // Eye Star Highlight
    blush:         mat(0xff5c8a, { emissive: 0xff3366, emissiveIntensity: 0.90 }), // Pink Cheeks
    coreGlow:      mat(0x00f7ff, { emissive: 0x00f7ff, emissiveIntensity: 1.8 }), // Clean Energy Arc Core
    goldGlow:      mat(0xffd500, { emissive: 0xffaa00, emissiveIntensity: 1.4 }),
    lash:          mat(0x0a1017, { roughness: 0.15, metalness: 0.50 }),

    // --- APD RESMI: HELM KESELAMATAN K3 PLN (BERSIH & IKONIK) ---
    helmetYellow:  mat(0xffe600, { roughness: 0.15, metalness: 0.18 }), // Helm Kuning Khas PLN High-Gloss
    reflective:    mat(0xffffff, { roughness: 0.08, metalness: 0.95, emissive: 0x778899, emissiveIntensity: 0.22 }) // Pita Reflektif Scotchlite
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

  /* ================= 1. KEPALA, WAJAH & HELM APD K3 PLN ================= */
  const head = new T.Group();
  head.position.y = 1.05;
  g.add(head);

  // Kepala android porselen bulat anggun
  ball(0.88, C.porcelain, [1.02, 1.08, 1.00], [0, 0, 0], head, 54);

  // Visor kaca obsidian gelap melengkung (wajah digital elegan)
  ball(0.70, C.visor, [1.00, 0.78, 0.44], [0, 0.02, 0.66], head, 48);

  // Rambut bob mutiara di bawah helm
  const hairCap = new T.Mesh(
    new T.SphereGeometry(0.91, 48, 28, 0, Math.PI * 2, 0, Math.PI * 0.56),
    C.hairWhite
  );
  hairCap.scale.set(1.03, 1.09, 1.02);
  hairCap.position.set(0, 0.05, -0.05);
  hairCap.rotation.x = -0.12;
  head.add(hairCap);

  // Poni dahi anggun menyembul rapi di bawah lidah helm
  ball(0.18, C.hairWhite, [0.95, 0.50, 0.28], [0, 0.40, 0.74], head);
  ball(0.15, C.hairWhite, [0.80, 0.48, 0.26], [-0.24, 0.36, 0.72], head);
  ball(0.15, C.hairWhite, [0.80, 0.48, 0.26], [0.24, 0.36, 0.72], head);

  // Helai rambut samping membingkai pipi
  const hairLocks = [];
  [-1, 1].forEach((side) => {
    const lock = cyl(0.10, 0.035, 0.85, C.hairWhite, [side * 0.88, -0.20, 0.18], head, false, 28);
    lock.rotation.z = side * -0.15;
    lock.rotation.x = 0.05;
    hairLocks.push(lock);

    const highlight = cyl(0.045, 0.016, 0.68, C.hairCyan, [side * 0.82, -0.18, 0.25], head, false, 20);
    highlight.rotation.z = side * -0.18;

    const clip = new T.Mesh(new T.BoxGeometry(0.05, 0.14, 0.02), C.gold);
    clip.position.set(side * 0.84, 0.26, 0.45);
    clip.rotation.y = side * 0.35;
    head.add(clip);
  });

  // --- HELM KESELAMATAN K3 KUNING PLN (IKONIK, BERSIH, TANPA GOGGLES BERLEBIH) ---
  // Kubah Helm Safety Kuning PLN
  const helmetDome = new T.Mesh(
    new T.SphereGeometry(0.96, 48, 28, 0, Math.PI * 2, 0, Math.PI * 0.48),
    C.helmetYellow
  );
  helmetDome.scale.set(1.06, 1.08, 1.06);
  helmetDome.position.set(0, 0.20, -0.04);
  helmetDome.rotation.x = -0.10;
  head.add(helmetDome);

  // Lidah Pelindung Depan Helm (Brim Helm K3)
  const helmetBrim = new T.Mesh(
    new T.TorusGeometry(0.98, 0.038, 12, 48, Math.PI * 0.62),
    C.helmetYellow
  );
  helmetBrim.position.set(0, 0.18, 0.12);
  helmetBrim.rotation.x = 0.32;
  head.add(helmetBrim);

  // Tulang Penguat Tengah Helm K3 (Spine Ridge)
  const helmetRidge = cyl(0.035, 0.045, 1.15, C.helmetYellow, [0, 1.16, -0.04], head);
  helmetRidge.rotation.x = Math.PI / 2.05;

  // Emblem Resmi Logo PLN di Dahi Depan Helm
  const helmetLogoMat = createHelmetPLNLogo(T);
  const helmetLogoBadge = new T.Mesh(new T.PlaneGeometry(0.22, 0.22), helmetLogoMat);
  helmetLogoBadge.position.set(0, 0.66, 0.90);
  helmetLogoBadge.rotation.x = -0.15;
  head.add(helmetLogoBadge);

  const helmetBadgeBezel = new T.Mesh(new T.BoxGeometry(0.24, 0.24, 0.015), C.gold);
  helmetBadgeBezel.position.set(0, 0.66, 0.89);
  helmetBadgeBezel.rotation.x = -0.15;
  head.add(helmetBadgeBezel);

  // Pita Reflektif Perak Scotchlite 3M di Sekeliling Helm
  const helmetReflective = new T.Mesh(
    new T.TorusGeometry(1.01, 0.018, 8, 48, Math.PI * 0.85),
    C.reflective
  );
  helmetReflective.position.set(0, 0.36, -0.02);
  helmetReflective.rotation.x = 0.12;
  head.add(helmetReflective);

  // Headset Earpods di telinga kiri dan kanan
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

  // Boom Mic mini di earpod kiri
  const micArm = cyl(0.014, 0.014, 0.36, C.silver, [-0.85, -0.06, 0.30], head);
  micArm.rotation.x = Math.PI / 2.6;
  micArm.rotation.z = -0.38;
  ball(0.032, C.glow, [1, 1, 1.2], [-0.68, -0.16, 0.58], head);

  // --- MATA FEMININ DIGITAL ANGGUN (100% SIMETRIS & HD) ---
  const eyesGroup = new T.Group();
  head.add(eyesGroup);

  [-1, 1].forEach((side) => {
    const eye = new T.Group();
    eye.position.set(side * 0.27, 0.04, 0.98);
    eye.scale.set(side, 1, 1);
    eyesGroup.add(eye);

    const upperLash = new T.Mesh(
      new T.TorusGeometry(0.125, 0.020, 10, 32, Math.PI * 0.65),
      C.lash
    );
    upperLash.rotation.z = Math.PI * 0.18;
    eye.add(upperLash);

    const irisGlow = new T.Mesh(
      new T.TorusGeometry(0.100, 0.024, 10, 32, Math.PI * 0.62),
      C.glow
    );
    irisGlow.position.set(0, -0.01, 0.01);
    irisGlow.rotation.z = Math.PI * 0.19;
    eye.add(irisGlow);

    ball(0.034, C.eyeSparkle, [1, 1, 0.6], [0.03, 0.05, 0.02], eye);
    ball(0.018, C.eyeSparkle, [1, 1, 0.6], [-0.04, 0.00, 0.02], eye);

    const lash1 = cyl(0.005, 0.016, 0.11, C.lash, [0.12, 0.09, 0.01], eye);
    lash1.rotation.z = -0.55;

    const lash2 = cyl(0.004, 0.012, 0.08, C.lash, [0.13, 0.05, 0.01], eye);
    lash2.rotation.z = -0.95;
  });

  // Rona pipi pink
  const blushGroup = new T.Group();
  head.add(blushGroup);
  [-0.36, 0.36].forEach((x) => {
    ball(0.055, C.blush, [1.5, 0.6, 0.3], [x, -0.11, 0.94], blushGroup);
  });

  // Senyum manis & equalizer bar
  const smile = new T.Mesh(
    new T.TorusGeometry(0.11, 0.016, 8, 24, Math.PI * 0.60),
    C.glow
  );
  smile.rotation.z = Math.PI * 1.20;
  smile.position.set(0, -0.19, 0.99);
  head.add(smile);

  const mouthBars = [];
  const barSpacing = 0.055;
  for (let i = -2; i <= 2; i++) {
    const bar = new T.Mesh(new T.BoxGeometry(0.020, 0.09, 0.02), C.glow);
    bar.position.set(i * barSpacing, -0.19, 1.00);
    bar.scale.y = 0.2;
    head.add(bar);
    mouthBars.push(bar);
  }

  /* ================= 2. SERAGAM KORPORAT BERSIH & RAMPING (MINIMALIS) ================= */
  // Leher ramping feminin
  cyl(0.15, 0.17, 0.22, C.skin, [0, -0.03, 0], g);
  // Choker emas elegan di leher
  cyl(0.18, 0.18, 0.035, C.gold, [0, -0.06, 0], g);

  // Badan Utama: Tailored Clean Corporate Uniform
  const torso = new T.Group();
  torso.position.y = -0.68;
  g.add(torso);

  // Bodi porselen putih mulus
  ball(0.78, C.porcelain, [0.74, 0.90, 0.60], [0, 0, 0], torso, 48);

  // Kerah Blazer PLN Signature Teal yang rapi & berkelas
  [-0.26, 0.26].forEach((x, idx) => {
    const side = (idx === 0) ? -1 : 1;
    const lapel = new T.Mesh(new T.BoxGeometry(0.24, 0.54, 0.06), C.plnTeal);
    lapel.position.set(x, 0.12, 0.46);
    lapel.rotation.y = side * -0.20;
    lapel.rotation.z = side * 0.08;
    torso.add(lapel);

    const lapelGold = new T.Mesh(new T.BoxGeometry(0.024, 0.56, 0.07), C.gold);
    lapelGold.position.set(x - side * 0.12, 0.12, 0.48);
    lapelGold.rotation.y = side * -0.20;
    lapelGold.rotation.z = side * 0.08;
    torso.add(lapelGold);
  });

  // Reaktor Daya Bersih Arc Core di Tengah Dada (Pusat Energi Cyan)
  const coreBezel = cyl(0.14, 0.14, 0.04, C.gold, [0, 0.18, 0.50], torso);
  coreBezel.rotation.x = Math.PI / 2;

  const arcCore = cyl(0.10, 0.10, 0.05, C.coreGlow, [0, 0.18, 0.51], torso);
  arcCore.rotation.x = Math.PI / 2;

  // Satu-Satunya Lencana Dada: Name Tag Horizontal Logam Emas "PLN ners"
  // (Ramping, pas di kerah kiri, tidak menutupi badan & sangat jelas terbaca)
  const compactBadgeMat = createCompactBadgeTexture(T);
  const badgeMesh = new T.Mesh(new T.PlaneGeometry(0.36, 0.14), compactBadgeMat);
  badgeMesh.position.set(0.18, 0.18, 0.53);
  badgeMesh.rotation.set(-0.04, -0.16, 0);
  torso.add(badgeMesh);

  const badgeBackplate = new T.Mesh(new T.BoxGeometry(0.38, 0.16, 0.015), C.gold);
  badgeBackplate.position.set(0.18, 0.18, 0.52);
  badgeBackplate.rotation.set(-0.04, -0.16, 0);
  torso.add(badgeBackplate);

  // Sabuk Emas Ramping di Pinggang
  const belt = cyl(0.48, 0.48, 0.045, C.gold, [0, -0.32, 0], torso);
  const beltBuckle = cyl(0.07, 0.07, 0.05, C.glow, [0, -0.32, 0.45], torso);
  beltBuckle.rotation.x = Math.PI / 2;

  /* ================= 3. LENGAN & TANGAN BERSIH (BEBAS TABLET MENUMPUK) ================= */
  // Pundak halus porcelain
  [-0.64, 0.64].forEach((x, idx) => {
    const side = (idx === 0) ? -1 : 1;
    ball(0.12, C.gold, [1, 1, 1], [x, 0.30, 0], torso);
    ball(0.16, C.porcelain, [1.05, 0.85, 1.0], [x + side * 0.03, 0.34, 0], torso);
  });

  // --- LENGAN KIRI: POISE TENANG DI SAMPING PINGGUL (BERSIH & ALAMI) ---
  const leftArm = new T.Group();
  leftArm.position.set(-0.66, -0.34, 0);
  g.add(leftArm);

  cyl(0.075, 0.065, 0.38, C.porcelain, [0, -0.18, 0.02], leftArm).rotation.x = 0.15;
  ball(0.07, C.gold, [1, 1, 1], [0, -0.36, 0.04], leftArm);

  // Lengan bawah kiri istirahat santun di samping pinggul
  const leftForearm = cyl(0.065, 0.055, 0.36, C.porcelain, [-0.02, -0.52, 0.12], leftArm);
  leftForearm.rotation.x = 0.35;
  leftForearm.rotation.z = 0.15;

  cyl(0.062, 0.062, 0.03, C.gold, [-0.04, -0.68, 0.20], leftArm); // Manset emas
  const leftHand = ball(0.065, C.skin, [0.9, 0.45, 1.1], [-0.04, -0.74, 0.24], leftArm);
  leftHand.rotation.set(0.15, 0.20, 0);

  // --- LENGAN KANAN: GESTUR "SALAM SANTUN PLN" (Menyambut Hangat Tamu) ---
  const rightArm = new T.Group();
  rightArm.position.set(0.66, -0.34, 0);
  g.add(rightArm);

  cyl(0.075, 0.065, 0.36, C.porcelain, [0, -0.18, 0.02], rightArm);
  ball(0.07, C.gold, [1, 1, 1], [0, -0.36, 0.02], rightArm);

  const rightForearmGroup = new T.Group();
  rightForearmGroup.position.set(0, -0.36, 0.02);
  rightForearmGroup.rotation.set(0.55, -0.18, -0.15);
  rightArm.add(rightForearmGroup);

  cyl(0.065, 0.055, 0.34, C.porcelain, [0, -0.17, 0], rightForearmGroup);
  cyl(0.060, 0.060, 0.03, C.gold, [0, -0.32, 0], rightForearmGroup); // Cincin manset emas

  // Telapak tangan feminin terbuka menyambut santun
  const rightHand = ball(0.065, C.skin, [1.0, 0.35, 1.2], [0, -0.38, 0.02], rightForearmGroup);
  rightHand.rotation.set(0.20, -0.15, 0);

  for (let f = -1.5; f <= 1.5; f++) {
    const finger = cyl(0.012, 0.009, 0.09, C.skin, [f * 0.022, -0.44, 0.02], rightForearmGroup);
    finger.rotation.x = 0.12;
  }
  const thumb = cyl(0.013, 0.010, 0.07, C.skin, [-0.045, -0.39, 0.03], rightForearmGroup);
  thumb.rotation.set(0.25, 0, 0.55);

  /* ================= 4. ROK HOVER & CHASSIS LEVITASI ELEGAN ================= */
  const hoverSkirt = cyl(0.48, 0.22, 0.54, C.porcelain, [0, -1.26, 0], g, false, 48);
  cyl(0.49, 0.40, 0.08, C.plnTeal, [0, -1.14, 0], g); // Aksen list rok teal
  cyl(0.32, 0.22, 0.05, C.gold,    [0, -1.40, 0], g); // Nozzle emas

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