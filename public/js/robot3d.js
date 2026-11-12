/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   Virtual Concierge 3D Three.js: Asisten Virtual "PLN ners"
   Karakter 3D Humanoid Anime dengan Helm K3 Kuning PLN, Rompi Reflektif,
   Lanyard Pusharlis, serta Lengan & Tangan 3D Proaktif Pengarah Formulir
   ===================================================================== */

let renderer, scene, camera, rig, robot;
let wasDragged = false;
let mouseTargetX = 0;
let mouseTargetY = 0;
let isThreeInitialized = false;

/* State & Variasi Gerakan 3D PLN ners */
let wasSpeaking = false;
let speechStartTime = 0;
let currentMood = 0;
let nextMoodTime = 0;
let avatarHovered = false;

function initRobot3D() {
  if (isThreeInitialized) return;

  enableDrag();
  enableCursorTracking();

  try {
    const canvas = document.getElementById('fabc');
    if (!canvas || typeof THREE === 'undefined') return;

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });

    const pr = Math.min(window.devicePixelRatio || 1, 2.0);
    renderer.setPixelRatio(pr);
    renderer.setSize(130, 190, false);

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
    camera = new THREE.PerspectiveCamera(34, 130 / 190, 0.1, 50);
    camera.position.set(0, 0.08, 8.0);

    // Pencahayaan Studio Bersih & Hangat (Menonjolkan Karakter 3D Humanoid)
    scene.add(new THREE.AmbientLight(0xffffff, 0.92));

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
    keyLight.position.set(2.2, 3.6, 4.0);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x00d2f0, 0.40);
    fillLight.position.set(-2.4, 0.4, 3.0);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffe600, 0.45);
    rimLight.position.set(0, 3.0, -3.2);
    scene.add(rimLight);

    rig = new THREE.Group();
    scene.add(rig);

    robot = createHumanoidAvatar(THREE);
    rig.add(robot.g);

    isThreeInitialized = true;
    requestAnimationFrame(animate);
  } catch (err) {
    console.warn('Three.js init error, fallback emoji:', err);
    const fab = document.getElementById('fab');
    if (fab) fab.insertAdjacentHTML('afterbegin', '<div style="font-size:70px">👩‍💼</div>');
  }
}

function enableCursorTracking() {
  window.addEventListener('pointermove', (e) => {
    mouseTargetX = (e.clientX / window.innerWidth - 0.5) * 0.40;
    mouseTargetY = (e.clientY / window.innerHeight - 0.5) * 0.30;
  }, { passive: true });

  const fab = document.getElementById('fab');
  if (fab) {
    fab.addEventListener('pointerenter', () => { avatarHovered = true; });
    fab.addEventListener('pointerleave', () => { avatarHovered = false; });
  }
}

function enableDrag() {
  const fab = document.getElementById('fab');
  if (!fab) return;

  let isDragging = false;
  let startX = 0, startY = 0;
  let origX = 0, origY = 0;

  const onDown = (clientX, clientY) => {
    isDragging = true;
    wasDragged = false;
    startX = clientX;
    startY = clientY;
    const rect = fab.getBoundingClientRect();
    origX = rect.left;
    origY = rect.top;
    fab.style.transition = 'none';
  };

  const onMove = (clientX, clientY) => {
    if (!isDragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      wasDragged = true;
    }
    const nx = Math.max(8, Math.min(window.innerWidth - 138, origX + dx));
    const ny = Math.max(8, Math.min(window.innerHeight - 198, origY + dy));
    fab.style.left = nx + 'px';
    fab.style.top = ny + 'px';
    fab.style.right = 'auto';
    fab.style.bottom = 'auto';
  };

  const onUp = () => {
    if (!isDragging) return;
    isDragging = false;
    fab.style.transition = '';

    const rect = fab.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    if (centerX < window.innerWidth / 2) {
      fab.classList.add('left');
    } else {
      fab.classList.remove('left');
    }
  };

  fab.addEventListener('mousedown', (e) => {
    if (e.target.closest('#spk')) return;
    onDown(e.clientX, e.clientY);
  });
  window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', onUp);

  fab.addEventListener('touchstart', (e) => {
    if (e.target.closest('#spk')) return;
    const t = e.touches[0];
    onDown(t.clientX, t.clientY);
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const t = e.touches[0];
    onMove(t.clientX, t.clientY);
  }, { passive: true });
  window.addEventListener('touchend', onUp);
}

/**
 * Lambang Resmi PT PLN (Persero) untuk Helm APD (256x256)
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
  ctx.strokeRect(6, 6, 244, 244);

  // 3 Gelombang Air Biru
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
  ctx.lineTo(80, 125);
  ctx.lineTo(135, 125);
  ctx.lineTo(122, 220);
  ctx.lineTo(195, 110);
  ctx.lineTo(148, 110);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

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
 * Lencana Name Plate Holografik Bawah (512x200)
 */
function createPedestalBadgeTexture(T) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');

  function renderBadge(imgObj) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 200);

    ctx.strokeStyle = '#f2c94c';
    ctx.lineWidth = 8;
    ctx.strokeRect(5, 5, 502, 190);

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
    ctx.font = '900 46px "Poppins", Arial, sans-serif';
    ctx.fillText('PLN ners', 175, 112);

    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 18px "Poppins", Arial, sans-serif';
    ctx.fillText('● ASISTEN VIRTUAL K3 & CONCIERGE', 175, 155);
  }

  renderBadge(null);

  const canvasTex = new T.CanvasTexture(canvas);
  canvasTex.generateMipmaps = true;

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
 * Pembuat Tekstur Wajah Humanoid Anime Real-Time (512x512)
 * Mendukung status Bicara (Talk) dan Kedipan Mata (Blink)
 */
function createFaceTexture(T, isTalk, isBlink) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Latar dasar kulit hangat porselen
  ctx.fillStyle = '#ffdfd0';
  ctx.fillRect(0, 0, 512, 512);

  // Blush pipi merona lembut di pipi kiri & kanan
  const drawBlush = (cx, cy) => {
    const radGrd = ctx.createRadialGradient(cx, cy, 5, cx, cy, 48);
    radGrd.addColorStop(0, 'rgba(255, 130, 145, 0.45)');
    radGrd.addColorStop(0.6, 'rgba(255, 150, 165, 0.22)');
    radGrd.addColorStop(1, 'rgba(255, 223, 208, 0)');
    ctx.fillStyle = radGrd;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 48, 28, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  drawBlush(135, 305);
  drawBlush(377, 305);

  // Alis manis anggun
  ctx.strokeStyle = '#4e3328';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(175, 185, 45, Math.PI * 1.15, Math.PI * 1.82);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(337, 185, 45, Math.PI * 1.18, Math.PI * 1.85);
  ctx.stroke();

  // Mata Anime (Kiri & Kanan)
  const eyeCenters = [175, 337];

  if (isBlink) {
    // Mata tersenyum terpejam (^ ^)
    eyeCenters.forEach((cx) => {
      ctx.strokeStyle = '#321e17';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, 260, 42, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();

      // Bulu mata halus bawah
      ctx.strokeStyle = 'rgba(100, 60, 50, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, 275, 24, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    });
  } else {
    // Mata terbuka indah dengan iris hazel-amber & kilau catchlight
    eyeCenters.forEach((cx) => {
      const cy = 250;

      // Sclera (bagian putih mata)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 44, 54, 0, 0, Math.PI * 2);
      ctx.fill();

      // Iris hazel-amber
      const irisGrd = ctx.createLinearGradient(cx, cy - 48, cx, cy + 48);
      irisGrd.addColorStop(0, '#422216');
      irisGrd.addColorStop(0.55, '#8c4822');
      irisGrd.addColorStop(1, '#e89438');
      ctx.fillStyle = irisGrd;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 33, 46, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupil gelap dalam
      ctx.fillStyle = '#1c0c08';
      ctx.beginPath();
      ctx.ellipse(cx, cy - 8, 16, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Kilau cahaya specular utama (Catchlight besar kiri atas)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(cx - 14, cy - 20, 10, 13, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Kilau cahaya sekunder kanan bawah
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.ellipse(cx + 12, cy + 16, 6, 8, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Garis kelopak mata & bulu mata anime tebal atas
      ctx.strokeStyle = '#2c1812';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy - 4, 46, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Eyelash wing flick samping
      const side = (cx < 256) ? -1 : 1;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx + side * 40, cy - 16);
      ctx.lineTo(cx + side * 52, cy - 22);
      ctx.stroke();
    });
  }

  // Hidung mungil anime
  ctx.fillStyle = 'rgba(195, 120, 105, 0.7)';
  ctx.beginPath();
  ctx.ellipse(256, 310, 3, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mulut (Bicara vs Senyum Diam)
  const mx = 256;
  const my = 372;

  if (isTalk) {
    // Rongga mulut senyum bicara
    ctx.fillStyle = '#5c1c28';
    ctx.beginPath();
    ctx.moveTo(mx - 32, my - 6);
    ctx.quadraticCurveTo(mx, my - 8, mx + 32, my - 6);
    ctx.quadraticCurveTo(mx + 28, my + 26, mx, my + 30);
    ctx.quadraticCurveTo(mx - 28, my + 26, mx - 32, my - 6);
    ctx.closePath();
    ctx.fill();

    // Gigi atas putih bersih
    ctx.fillStyle = '#fffdfa';
    ctx.beginPath();
    ctx.moveTo(mx - 24, my - 6);
    ctx.quadraticCurveTo(mx, my - 8, mx + 24, my - 6);
    ctx.lineTo(mx + 18, my + 4);
    ctx.quadraticCurveTo(mx, my + 5, mx - 18, my + 4);
    ctx.closePath();
    ctx.fill();

    // Lidah merah muda hangat
    ctx.fillStyle = '#eb7787';
    ctx.beginPath();
    ctx.ellipse(mx, my + 18, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Garis kontur bibir
    ctx.strokeStyle = '#4a1520';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mx - 32, my - 6);
    ctx.quadraticCurveTo(mx, my - 8, mx + 32, my - 6);
    ctx.quadraticCurveTo(mx + 28, my + 26, mx, my + 30);
    ctx.quadraticCurveTo(mx - 28, my + 26, mx - 32, my - 6);
    ctx.stroke();
  } else {
    // Senyum santun tertutup
    ctx.strokeStyle = '#5c1c28';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(mx, my - 12, 28, Math.PI * 0.20, Math.PI * 0.80);
    ctx.stroke();

    // Aksen bayangan dagu bawah
    ctx.fillStyle = 'rgba(210, 140, 125, 0.4)';
    ctx.beginPath();
    ctx.ellipse(mx, my + 16, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new T.CanvasTexture(canvas);
  tex.generateMipmaps = true;
  return tex;
}

/**
 * Pembuatan Avatar 3D Humanoid Lengkap ("PLN ners")
 * Termasuk Kepala, Rambut, Helm K3, Rompi K3, ID Lanyard, serta Lengan & Tangan 3D
 */
function createHumanoidAvatar(T) {
  const g = new T.Group();

  // Palet Material 3D Standar Studio Bersih & Berkualitas Tinggi
  const mat = (col, opt = {}) => new T.MeshStandardMaterial({
    color: col,
    roughness: 0.32,
    metalness: 0.10,
    ...opt
  });

  const C = {
    skin:         mat(0xffdfd0, { roughness: 0.50, metalness: 0.04 }),
    hair:         mat(0x322018, { roughness: 0.36, metalness: 0.12 }),
    helmetYellow: mat(0xffcc00, { roughness: 0.20, metalness: 0.16 }),
    plnTeal:      mat(0x186174, { roughness: 0.25, metalness: 0.22 }),
    shirtWhite:   mat(0xf8fafc, { roughness: 0.35, metalness: 0.05 }),
    navyTie:      mat(0x122438, { roughness: 0.30, metalness: 0.15 }),
    reflective:   mat(0xe8edf2, { roughness: 0.08, metalness: 0.92, emissive: 0x778899, emissiveIntensity: 0.35 }),
    gold:         mat(0xf5c518, { roughness: 0.18, metalness: 0.85 }),
    silver:       mat(0xd4dee6, { roughness: 0.20, metalness: 0.80 }),
    cyanGlow:     mat(0x00e5ff, { emissive: 0x00e5ff, emissiveIntensity: 1.8 }),
    yellowGlow:   mat(0xffe600, { emissive: 0xffaa00, emissiveIntensity: 1.6 })
  };

  const ball = (r, m, [sx, sy, sz], [x, y, z], parent, seg = 36) => {
    const o = new T.Mesh(new T.SphereGeometry(r, seg, Math.round(seg * 0.75)), m);
    o.scale.set(sx, sy, sz);
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };

  const cyl = (rt, rb, h, m, [x, y, z], parent, open = false, seg = 32) => {
    const o = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg, 1, open), m);
    o.position.set(x, y, z);
    parent.add(o);
    return o;
  };

  /* ================= 1. KEPALA, WAJAH, RAMBUT & HELM K3 PLN ================= */
  const head = new T.Group();
  head.position.set(0, 0.95, 0);
  g.add(head);

  // Kubah kepala porselen berkontur lembut alami
  ball(0.72, C.skin, [0.98, 1.05, 0.94], [0, 0, 0], head, 44);

  // Tekstur Wajah 4 State Dinamis (Idle, Talk, Blink, TalkBlink)
  const texFaceIdle      = createFaceTexture(T, false, false);
  const texFaceTalk      = createFaceTexture(T, true,  false);
  const texFaceBlink     = createFaceTexture(T, false, true);
  const texFaceTalkBlink = createFaceTexture(T, true,  true);

  const faceMat = new T.MeshBasicMaterial({
    map: texFaceIdle,
    side: T.DoubleSide
  });

  // Mesh Wajah Melengkung di Bagian Depan Kepala
  const faceMesh = new T.Mesh(
    new T.CylinderGeometry(0.726, 0.726, 0.76, 32, 1, true, -0.66, 1.32),
    faceMat
  );
  faceMesh.position.set(0, -0.01, 0);
  faceMesh.rotation.y = Math.PI;
  head.add(faceMesh);

  // --- RAMBUT 3D ANIME (Poni Depan, Kuncir & Ekor Kuda) ---
  const hairGroup = new T.Group();
  head.add(hairGroup);

  // Volume rambut belakang kepala
  ball(0.75, C.hair, [1.02, 1.04, 0.96], [0, 0.05, -0.10], hairGroup, 36);

  // Poni depan membingkai dahi dengan anggun
  const bang1 = cyl(0.045, 0.010, 0.32, C.hair, [-0.22, 0.28, 0.62], hairGroup);
  bang1.rotation.set(0.35, 0, 0.35);

  const bang2 = cyl(0.050, 0.012, 0.35, C.hair, [-0.08, 0.27, 0.65], hairGroup);
  bang2.rotation.set(0.38, 0, 0.12);

  const bang3 = cyl(0.050, 0.012, 0.35, C.hair, [0.08, 0.27, 0.65], hairGroup);
  bang3.rotation.set(0.38, 0, -0.12);

  const bang4 = cyl(0.045, 0.010, 0.32, C.hair, [0.22, 0.28, 0.62], hairGroup);
  bang4.rotation.set(0.35, 0, -0.35);

  // Helai rambut samping (Side locks)
  const lockL = cyl(0.055, 0.015, 0.52, C.hair, [-0.44, -0.02, 0.40], hairGroup);
  lockL.rotation.set(0.15, 0, 0.12);

  const lockR = cyl(0.055, 0.015, 0.52, C.hair, [0.44, -0.02, 0.40], hairGroup);
  lockR.rotation.set(0.15, 0, -0.12);

  // Ekor Kuda (Ponytail) di Belakang Kepala
  const ponytailGroup = new T.Group();
  ponytailGroup.position.set(0, 0.15, -0.72);
  ponytailGroup.rotation.x = -0.35;
  hairGroup.add(ponytailGroup);

  // Pita pengikat ekor kuda khas PLN Teal
  cyl(0.075, 0.075, 0.05, C.plnTeal, [0, 0, 0], ponytailGroup);
  // Helai ekor kuda mengalir ke bawah
  cyl(0.085, 0.045, 0.65, C.hair, [0, -0.32, -0.08], ponytailGroup);
  ball(0.055, C.hair, [1, 1, 1], [0, -0.64, -0.12], ponytailGroup);

  // --- HELM KESELAMATAN APD K3 KUNING PLN ---
  const helmetDome = new T.Mesh(
    new T.SphereGeometry(0.86, 44, 26, 0, Math.PI * 2, 0, Math.PI * 0.48),
    C.helmetYellow
  );
  helmetDome.scale.set(1.04, 1.06, 1.04);
  helmetDome.position.set(0, 0.24, -0.02);
  helmetDome.rotation.x = -0.06;
  head.add(helmetDome);

  // Lidah / visor depan helm APD
  const helmetBrim = new T.Mesh(
    new T.TorusGeometry(0.87, 0.038, 10, 44, Math.PI * 0.62),
    C.helmetYellow
  );
  helmetBrim.position.set(0, 0.22, 0.14);
  helmetBrim.rotation.x = 0.32;
  head.add(helmetBrim);

  // Tulang penguat aerodinamis atas helm
  const helmetRidge = cyl(0.032, 0.042, 1.05, C.helmetYellow, [0, 1.08, -0.02], head);
  helmetRidge.rotation.x = Math.PI / 2.05;

  // Pita reflektif perak keselamatan K3
  const helmetReflective = new T.Mesh(
    new T.TorusGeometry(0.89, 0.018, 8, 44, Math.PI * 0.86),
    C.reflective
  );
  helmetReflective.position.set(0, 0.38, -0.02);
  helmetReflective.rotation.x = 0.12;
  head.add(helmetReflective);

  // Emblem Lambang Resmi PT PLN (Persero) di Depan Helm
  const helmetLogoMat = createHelmetPLNLogo(T);
  const helmetLogoBadge = new T.Mesh(new T.PlaneGeometry(0.22, 0.22), helmetLogoMat);
  helmetLogoBadge.position.set(0, 0.64, 0.81);
  helmetLogoBadge.rotation.x = -0.15;
  head.add(helmetLogoBadge);

  // Tali pengaman dagu helm (chinstrap)
  const strapL = cyl(0.010, 0.010, 0.42, C.hair, [-0.44, -0.08, 0.08], head);
  strapL.rotation.z = 0.25;
  const strapR = cyl(0.010, 0.010, 0.42, C.hair, [0.44, -0.08, 0.08], head);
  strapR.rotation.z = -0.25;

  /* ================= 2. LEHER, TORSO, KEMEJA & ROMPI K3 PLN ================= */
  // Leher anggun
  cyl(0.18, 0.22, 0.30, C.skin, [0, 0.38, 0.02], g);

  const torso = new T.Group();
  torso.position.set(0, -0.05, 0);
  g.add(torso);

  // Kemeja Putih Berkerah di Bawah Rompi
  ball(0.58, C.shirtWhite, [0.98, 1.02, 0.72], [0, 0.04, 0], torso, 36);
  // Kerah kemeja rapi
  const collarL = cyl(0.028, 0.045, 0.24, C.shirtWhite, [-0.14, 0.38, 0.26], torso);
  collarL.rotation.set(-0.35, 0, -0.45);
  const collarR = cyl(0.028, 0.045, 0.24, C.shirtWhite, [0.14, 0.38, 0.26], torso);
  collarR.rotation.set(-0.35, 0, 0.45);

  // Dasi Navy Korporat Elegan
  const tie = cyl(0.042, 0.028, 0.36, C.navyTie, [0, 0.16, 0.35], torso);
  tie.rotation.x = -0.12;

  // --- ROMPI K3 KESELAMATAN REFLEKTIF PLN ---
  // Badan rompi warna PLN Teal
  ball(0.61, C.plnTeal, [1.02, 1.04, 0.76], [0, -0.02, 0], torso, 40);

  // Panel Rompi Depan K3 Kuning Terang (High-Visibility Safety Yellow)
  const vestPanelL = cyl(0.12, 0.14, 0.52, C.helmetYellow, [-0.22, -0.04, 0.34], torso);
  vestPanelL.rotation.set(-0.10, 0.20, 0.05);

  const vestPanelR = cyl(0.12, 0.14, 0.52, C.helmetYellow, [0.22, -0.04, 0.34], torso);
  vestPanelR.rotation.set(-0.10, -0.20, -0.05);

  // Pita reflektif perak ganda keselamatan K3 di dada rompi
  const refStripeTop = new T.Mesh(
    new T.TorusGeometry(0.58, 0.020, 8, 36, Math.PI * 0.72),
    C.reflective
  );
  refStripeTop.position.set(0, 0.06, 0.05);
  refStripeTop.rotation.set(0.10, 0, 0);
  torso.add(refStripeTop);

  const refStripeMid = new T.Mesh(
    new T.TorusGeometry(0.59, 0.020, 8, 36, Math.PI * 0.74),
    C.reflective
  );
  refStripeMid.position.set(0, -0.14, 0.05);
  refStripeMid.rotation.set(0.10, 0, 0);
  torso.add(refStripeMid);

  // Lanyard ID Badge "PT PLN (PERSERO) PUSHARLIS"
  const lanyardStrap = new T.Mesh(
    new T.TorusGeometry(0.28, 0.012, 6, 24, Math.PI * 0.85),
    C.plnTeal
  );
  lanyardStrap.position.set(0, 0.22, 0.32);
  lanyardStrap.rotation.x = -0.32;
  torso.add(lanyardStrap);

  // Kartu ID Badge Menggantung di Dada
  const idBadge = new T.Mesh(new T.PlaneGeometry(0.14, 0.19), C.silver);
  idBadge.position.set(0, -0.08, 0.44);
  idBadge.rotation.x = -0.12;
  torso.add(idBadge);

  /* ================= 3. LENGAN & TANGAN 3D ARTICULATED (PENGARAH FORMULIR) ================= */
  function createHumanHand(side) {
    const handGroup = new T.Group();

    // Telapak tangan halus
    ball(0.080, C.skin, [0.92, 0.82, 0.40], [0, -0.065, 0.015], handGroup, 20);

    // 4 Jari berartikulasi proporsional
    const fingerOffsets = (side === -1)
      ? [0.030, 0.010, -0.010, -0.030]
      : [-0.030, -0.010, 0.010, 0.030];
    const fingerLengths = [0.115, 0.130, 0.115, 0.095];

    fingerOffsets.forEach((fx, idx) => {
      const fLen = fingerLengths[idx];
      const fGroup = new T.Group();
      fGroup.position.set(fx, -0.105, 0.015);
      handGroup.add(fGroup);

      // Ruas jari proksimal
      cyl(0.012, 0.010, fLen * 0.52, C.skin, [0, -fLen * 0.26, 0.005], fGroup, false, 12);
      // Ruas jari distal
      cyl(0.010, 0.008, fLen * 0.48, C.skin, [0, -fLen * 0.70, 0.012], fGroup, false, 12);
      // Ujung kuku/jari
      ball(0.008, C.skin, [1, 1, 1], [0, -fLen * 0.94, 0.018], fGroup, 10);
    });

    // Ibu Jari (Thumb)
    const thumbX = (side === -1) ? 0.055 : -0.055;
    const thumbGroup = new T.Group();
    thumbGroup.position.set(thumbX, -0.048, 0.020);
    thumbGroup.rotation.set(-0.25, side * 0.32, side * 0.42);
    handGroup.add(thumbGroup);

    cyl(0.013, 0.011, 0.055, C.skin, [side * -0.015, -0.028, 0.005], thumbGroup, false, 12);
    cyl(0.011, 0.009, 0.045, C.skin, [side * -0.025, -0.075, 0.012], thumbGroup, false, 12);
    ball(0.009, C.skin, [1, 1, 1], [side * -0.032, -0.098, 0.018], thumbGroup, 10);

    return handGroup;
  }

  // --- LENGAN KIRI (PENGARAH UTAMA KE FORMULIR SAAT BOT DI KANAN) ---
  const leftShoulder = new T.Group();
  leftShoulder.position.set(-0.52, 0.18, 0.02);
  torso.add(leftShoulder);

  // Sendi bahu rompi teal
  ball(0.14, C.plnTeal, [1, 1, 1], [0, 0, 0], leftShoulder, 24);

  const leftUpperArm = new T.Group();
  leftUpperArm.position.set(0, -0.05, 0);
  leftShoulder.add(leftUpperArm);

  // Lengan atas kemeja putih rapi
  cyl(0.095, 0.082, 0.30, C.shirtWhite, [0, -0.15, 0], leftUpperArm, false, 24);

  const leftForearm = new T.Group();
  leftForearm.position.set(0, -0.30, 0.012);
  leftUpperArm.add(leftForearm);

  // Lengan bawah kulit anggun
  cyl(0.078, 0.068, 0.28, C.skin, [0, -0.14, 0.008], leftForearm, false, 24);

  const leftHand = createHumanHand(-1);
  leftHand.position.set(0, -0.28, 0.008);
  leftForearm.add(leftHand);

  // --- LENGAN KANAN (POISE SANTUN CONCIERGE / PENGARAH SAAT BOT DI KIRI) ---
  const rightShoulder = new T.Group();
  rightShoulder.position.set(0.52, 0.18, 0.02);
  torso.add(rightShoulder);

  ball(0.14, C.plnTeal, [1, 1, 1], [0, 0, 0], rightShoulder, 24);

  const rightUpperArm = new T.Group();
  rightUpperArm.position.set(0, -0.05, 0);
  rightShoulder.add(rightUpperArm);

  cyl(0.095, 0.082, 0.30, C.shirtWhite, [0, -0.15, 0], rightUpperArm, false, 24);

  const rightForearm = new T.Group();
  rightForearm.position.set(0, -0.30, 0.012);
  rightUpperArm.add(rightForearm);

  cyl(0.078, 0.068, 0.28, C.skin, [0, -0.14, 0.008], rightForearm, false, 24);

  const rightHand = createHumanHand(1);
  rightHand.position.set(0, -0.28, 0.008);
  rightForearm.add(rightHand);

  /* ================= 4. DUDUKAN LEVITASI HOLOGRAFIK PLN DI BAWAH ================= */
  const ring1 = new T.Mesh(
    new T.TorusGeometry(1.08, 0.018, 8, 44),
    C.cyanGlow
  );
  ring1.position.y = -1.65;
  ring1.rotation.x = Math.PI / 2;
  g.add(ring1);

  const ring2 = new T.Mesh(
    new T.TorusGeometry(1.24, 0.014, 8, 44),
    C.yellowGlow
  );
  ring2.position.y = -1.74;
  ring2.rotation.x = Math.PI / 2;
  g.add(ring2);

  const badgeMat = createPedestalBadgeTexture(T);
  const badgeMesh = new T.Mesh(new T.PlaneGeometry(1.18, 0.28), badgeMat);
  badgeMesh.position.set(0, -1.52, 0.25);
  g.add(badgeMesh);

  const shadow = new T.Mesh(
    new T.CircleGeometry(1.02, 32),
    new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.80;
  g.add(shadow);

  return {
    g,
    head,
    torso,
    faceMat,
    texFaceIdle,
    texFaceTalk,
    texFaceBlink,
    texFaceTalkBlink,
    leftShoulder,
    leftUpperArm,
    leftForearm,
    leftHand,
    rightShoulder,
    rightUpperArm,
    rightForearm,
    rightHand,
    ring1,
    ring2,
    badgeMesh,
    shadow
  };
}

function animate(ms) {
  requestAnimationFrame(animate);

  const t = ms / 1000;
  const R = robot;
  if (!R) return;

  const isSpeaking = (typeof speaking !== 'undefined' && speaking);

  if (isSpeaking && !wasSpeaking) {
    speechStartTime = ms;
  }
  wasSpeaking = isSpeaking;

  // 1. Pernafasan & Apungan Organik Multi-Harmonis (Bebas Kaku)
  const breathY = Math.sin(t * 1.6) * 0.035 + Math.sin(t * 0.8) * 0.015;
  const swayX   = Math.cos(t * 0.9) * 0.018;

  // 2. Interaksi Tatapan Kursor 3D (Head Gaze Tracking)
  const botEl = document.getElementById('bot');
  const isDockedLeft = botEl && botEl.classList.contains('left');
  const baseAngleY = isDockedLeft ? 0.08 : -0.08;

  // 3. Gestur Khusus Saat Berbicara vs Saat Menyimak (Variatif & Hidup)
  let speechNodX = 0;
  let speechTiltZ = 0;
  let speechLeanZ = 0;
  let bowDipY = 0;

  const speechElapsed = isSpeaking ? (ms - speechStartTime) : 99999;

  if (isSpeaking) {
    // A. Gestur Awal: Anggukan Sambutan Sopan / Welcoming Bow (pada 1.2 detik pertama)
    if (speechElapsed < 1200) {
      const bowP = speechElapsed / 1200;
      const bowArc = Math.sin(bowP * Math.PI);
      speechNodX += bowArc * 0.085;
      speechTiltZ += (isDockedLeft ? 0.035 : -0.035) * bowArc;
      bowDipY = -bowArc * 0.032;
    }

    // B. Variasi Gerakan Bicara Hidup: Penekanan irama kata & ayunan luwes
    const speechRhythm = Math.sin(t * 3.6) * 0.030 + Math.sin(t * 1.5) * 0.016;
    speechNodX += speechRhythm;
    speechTiltZ += Math.sin(t * 2.0) * 0.035;
    speechLeanZ = 0.06 + Math.sin(t * 1.4) * 0.018;
  }

  // 4. Variasi Perilaku Saat Diam / Menunggu (Idle Companion Behaviors)
  let idleTiltZ = 0;
  let idlePitchX = 0;
  let idleTurnY = 0;

  if (!isSpeaking) {
    if (ms > nextMoodTime) {
      currentMood = (currentMood + 1) % 3;
      nextMoodTime = ms + 6500 + Math.random() * 2500;
    }

    if (currentMood === 1) {
      idleTiltZ = 0.065;
    } else if (currentMood === 2) {
      idleTurnY = isDockedLeft ? 0.07 : -0.07;
      idlePitchX = -0.028 + Math.sin(t * 1.2) * 0.015;
    }
  }

  // 5. Reaksi Interaktif Saat Kursor Hover di atas Asisten
  const hoverLiftY  = avatarHovered ? 0.04 : 0;
  const hoverPitchX = avatarHovered ? -0.035 : 0;

  // 6. Orientasi Tubuh Proaktif ke Formulir saat Berbicara / Memandu
  const isGuiding = (typeof waveUntil !== 'undefined' && waveUntil > performance.now()) || isSpeaking;
  let guideBodyTurnY = 0;
  let guideBodyLeanX = 0;
  if (isGuiding) {
    guideBodyTurnY = isDockedLeft ? 0.18 : -0.18;
    guideBodyLeanX = 0.045;
    if (!speechLeanZ) speechLeanZ = 0.04;
  }

  // 7. Komposisi Rotasi & Posisi 3D Halus (Smooth Interpolation)
  const targetRotY = baseAngleY + guideBodyTurnY + idleTurnY + mouseTargetX * 0.40 + Math.sin(t * 0.7) * 0.020;
  const targetRotX = -mouseTargetY * 0.26 + guideBodyLeanX + hoverPitchX + idlePitchX + speechNodX + Math.sin(t * 0.5) * 0.012;
  const targetRotZ = mouseTargetX * 0.12 + idleTiltZ + speechTiltZ;

  const lerpSpeed = isSpeaking ? 0.10 : 0.07;
  R.g.rotation.y += (targetRotY - R.g.rotation.y) * lerpSpeed;
  R.g.rotation.x += (targetRotX - R.g.rotation.x) * lerpSpeed;
  R.g.rotation.z += (targetRotZ - R.g.rotation.z) * lerpSpeed;

  R.g.position.x += (swayX - R.g.position.x) * 0.08;
  R.g.position.y += (breathY + hoverLiftY + bowDipY - R.g.position.y) * 0.08;
  R.g.position.z += (speechLeanZ - R.g.position.z) * 0.08;

  // 8. Kedipan Mata Alami
  const blinkCycle = t % 4.6;
  const isBlinking = (blinkCycle < 0.12) || (blinkCycle > 0.26 && blinkCycle < 0.38);

  // 9. Sinkronisasi Gerakan Bibir Riil Akustik & Silabel
  const isTalking = (typeof window.isMouthOpenNow === 'function')
    ? window.isMouthOpenNow()
    : (isSpeaking && (Math.sin(t * 8.0) > 0.12));

  // 10. Pergantian Tekstur Wajah 3D (State Machine Bebas Kedip/Disko)
  let nextFaceTex = R.texFaceIdle;
  if (isTalking && isBlinking) {
    nextFaceTex = R.texFaceTalkBlink;
  } else if (isTalking) {
    nextFaceTex = R.texFaceTalk;
  } else if (isBlinking) {
    nextFaceTex = R.texFaceBlink;
  } else {
    nextFaceTex = R.texFaceIdle;
  }

  if (R.faceMat && R.faceMat.map !== nextFaceTex) {
    R.faceMat.map = nextFaceTex;
    R.faceMat.needsUpdate = true;
  }

  // 11. GERAKAN LENGAN & TANGAN 3D REALISTIS PROAKTIF MENGARAHKAN FORMULIR
  const lerpArm = 0.085;

  if (R.leftUpperArm && R.leftForearm && R.leftHand && R.rightUpperArm && R.rightForearm && R.rightHand) {
    if (!isDockedLeft) {
      // DEFAULT: Bot berada di KANAN layar -> Formulir di sebelah KIRI (-X)
      // Lengan Kiri bertindak sebagai TANGAN PENGARAH FORMULIR
      let tLUX, tLUY, tLUZ, tLFX, tLFY, tLFZ, tLHX, tLHY, tLHZ;
      let tRUX, tRUY, tRUZ, tRFX, tRFY, tRFZ, tRHX, tRHY, tRHZ;

      if (isSpeaking && speechElapsed < 1800) {
        // GESTUR MENYAPA / MELAMBAI RAMAH (Welcoming Wave)
        const waveProgress = speechElapsed / 1800;
        const waveEnvelope = Math.sin(waveProgress * Math.PI);
        const waveCycle = Math.sin(t * 7.5) * 0.28;

        tLUX = -0.55;
        tLUY = -0.15;
        tLUZ = -0.45;

        tLFX = -0.95;
        tLFY = -0.20;
        tLFZ = -0.20 + waveCycle * waveEnvelope;

        tLHX = -0.20;
        tLHY = -0.30;
        tLHZ = waveCycle * waveEnvelope * 0.8;
      } else if (isGuiding) {
        // GESTUR PROAKTIF MENGARAHKAN KE FORMULIR:
        // Lengan kiri terangkat anggun ke depan-kiri, siku menekuk ~45 deg,
        // telapak tangan terbuka mempersilakan pengunjung mengisi formulir
        const guidePulse = Math.sin(t * 3.0);
        const guideDip   = Math.cos(t * 3.0);

        tLUX = -0.48 + guidePulse * 0.05;
        tLUY = -0.22 + guideDip * 0.03;
        tLUZ = -0.32 + guidePulse * 0.04;

        tLFX = -0.82 + guidePulse * 0.06;
        tLFY = -0.24 + guideDip * 0.04;
        tLFZ = -0.22 + guidePulse * 0.05;

        tLHX = -0.16 + guidePulse * 0.04;
        tLHY = -0.32;
        tLHZ = 0.18;
      } else {
        // POISE SANTUN ISTIRAHAT: Lengan rileks di depan pinggul
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
      // Bot berada di KIRI layar -> Formulir di sebelah KANAN (+X)
      // Lengan Kanan bertindak sebagai TANGAN PENGARAH
      let tRUX, tRUY, tRUZ, tRFX, tRFY, tRFZ, tRHX, tRHY, tRHZ;
      let tLUX, tLUY, tLUZ, tLFX, tLFY, tLFZ, tLHX, tLHY, tLHZ;

      if (isSpeaking && speechElapsed < 1800) {
        const waveProgress = speechElapsed / 1800;
        const waveEnvelope = Math.sin(waveProgress * Math.PI);
        const waveCycle = Math.sin(t * 7.5) * 0.28;

        tRUX = -0.55;
        tRUY = 0.15;
        tRUZ = 0.45;

        tRFX = -0.95;
        tRFY = 0.20;
        tRFZ = 0.20 - waveCycle * waveEnvelope;

        tRHX = -0.20;
        tRHY = 0.30;
        tRHZ = -waveCycle * waveEnvelope * 0.8;
      } else if (isGuiding) {
        const guidePulse = Math.sin(t * 3.0);
        const guideDip   = Math.cos(t * 3.0);

        tRUX = -0.48 + guidePulse * 0.05;
        tRUY = 0.22 - guideDip * 0.03;
        tRUZ = 0.32 - guidePulse * 0.04;

        tRFX = -0.82 + guidePulse * 0.06;
        tRFY = 0.24 - guideDip * 0.04;
        tRFZ = 0.22 - guidePulse * 0.05;

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

  // 12. Putaran & Levitasi Fisika Cincin Orbital Holografik PLN
  if (R.ring1 && R.ring2) {
    const spinSpeed = avatarHovered ? 0.024 : (isSpeaking ? 0.019 : 0.014);
    R.ring1.rotation.z += spinSpeed;
    R.ring1.rotation.x = Math.PI / 2 + Math.sin(t * 1.3) * 0.04;

    R.ring2.rotation.z -= spinSpeed * 1.25;
    R.ring2.rotation.y = Math.cos(t * 1.1) * 0.05;

    R.ring1.position.y = -1.65 + breathY * 0.45;
    R.ring2.position.y = -1.74 + breathY * 0.65;
    if (R.ring1.material) {
      R.ring1.material.emissiveIntensity = isSpeaking ? 1.8 : (avatarHovered ? 1.6 : 1.3);
    }
  }

  // 13. Animasi Lencana Sambutan & Bayangan Lantai
  if (R.badgeMesh) {
    R.badgeMesh.position.y = -1.52 + breathY * 0.50;
  }

  if (R.shadow) {
    const sScale = Math.max(0.85, 1.0 - breathY * 1.6);
    R.shadow.scale.set(sScale, sScale, 1.0);
    if (R.shadow.material) {
      R.shadow.material.opacity = 0.18 - breathY * 0.06;
    }
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Inisialisasi Otomatis saat DOM Siap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(initRobot3D, 200));
} else {
  setTimeout(initRobot3D, 200);
}
