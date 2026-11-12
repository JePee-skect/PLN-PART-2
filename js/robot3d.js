/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   Virtual Concierge 3D Three.js: Asisten Virtual "PLN ners"
   Desain Representasi Manusia Nyata Berhijab Putih, Ramah & Profesional
   Dilengkapi Animasi Kedipan Alami, Gerakan Bicara, dan Interaksi Kursor 3D
   ===================================================================== */

let renderer, scene, camera, rig, robot;
let wasDragged = false;
let mouseTargetX = 0;
let mouseTargetY = 0;

/* State & Variasi Gerakan 3D PLN ners */
let wasSpeaking = false;
let speechStartTime = 0;
let currentMood = 0; // 0: fokus ramah, 1: miringkan kepala manis, 2: melirik ke formulir
let nextMoodTime = 0;
let avatarHovered = false;

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

    // Retina HD Ultra-Sharp Rendering (Jernih, Tajam & Bebas Buram)
    // Sesuai ukuran standar ringkas 130x190 (tidak membesar) dengan buffer HD Retina
    const pr = Math.min(window.devicePixelRatio || 1, 2.0);
    renderer.setPixelRatio(pr);
    // PENTING: updateStyle = false agar Three.js TIDAK menginjeksi inline CSS lebar/tinggi
    renderer.setSize(130, 190, false);

    if (THREE.NoToneMapping) {
      renderer.toneMapping = THREE.NoToneMapping;
    }
    if (THREE.sRGBEncoding) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    } else if (THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(34, 130 / 190, 0.1, 50);
    camera.position.set(0, 0.08, 8.2);

    // Pencahayaan Alami Studio Lembut (Menjaga Warna Asli Foto Tetap Cerah & Bersih)
    scene.add(new THREE.AmbientLight(0xffffff, 0.98));

    // Key Light Depan Lembut
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.35);
    keyLight.position.set(1.5, 2.5, 4.0);
    scene.add(keyLight);

    // Fill Light Biru Cyan PLN Halus dari Kiri
    const fillLight = new THREE.DirectionalLight(0x00d2f0, 0.25);
    fillLight.position.set(-2.0, 0.5, 3.0);
    scene.add(fillLight);

    // Rim Light Emas Lembut di Belakang
    const rimLight = new THREE.DirectionalLight(0xffe600, 0.30);
    rimLight.position.set(0, 2.8, -3.2);
    scene.add(rimLight);

    rig = new THREE.Group();
    scene.add(rig);

    robot = createHumanAvatar(THREE);
    rig.add(robot.g);

    requestAnimationFrame(animate);
  } catch (err) {
    console.warn('Three.js init error, fallback emoji:', err);
    const fab = $('#fab');
    if (fab) fab.insertAdjacentHTML('afterbegin', '<div style="font-size:70px">🧕</div>');
  }
}

function enableCursorTracking() {
  window.addEventListener('pointermove', (e) => {
    mouseTargetX = (e.clientX / window.innerWidth - 0.5) * 0.40;
    mouseTargetY = (e.clientY / window.innerHeight - 0.5) * 0.30;
  }, { passive: true });

  const fab = $('#fab');
  if (fab) {
    fab.addEventListener('pointerenter', () => { avatarHovered = true; });
    fab.addEventListener('pointerleave', () => { avatarHovered = false; });
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
 * Pembuatan Tekstur Lencana Korporat 3D untuk Dudukan Holografik
 */
function createPedestalBadgeTexture(T) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Latar Navy Teal khas PLN
  ctx.fillStyle = '#144456';
  ctx.fillRect(0, 0, 512, 128);

  // Bingkai emas mewah
  ctx.strokeStyle = '#f5c518';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 504, 120);

  // Teks Identitas
  ctx.fillStyle = '#e0f2fe';
  ctx.font = 'bold 22px "Poppins", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PT PLN (PERSERO) PUSHARLIS', 256, 42);

  ctx.fillStyle = '#ffe600';
  ctx.font = '900 32px "Poppins", Arial, sans-serif';
  ctx.fillText('PLN ners • ASISTEN VIRTUAL', 256, 88);

  const canvasTex = new T.CanvasTexture(canvas);
  canvasTex.generateMipmaps = true;
  return new T.MeshBasicMaterial({
    map: canvasTex,
    side: T.DoubleSide
  });
}

/**
 * Pembuatan Avatar Manusia Interaktif 3D "PLN ners"
 * Menggunakan foto asli berhijab putih dengan kurvatur 3D dan animasi hidup
 */
function createHumanAvatar(T) {
  const g = new T.Group();

  // Load 4 status tekstur avatar resolusi tinggi
  const texLoader = new T.TextureLoader();

  function loadAvatarTex(path) {
    const tex = texLoader.load(path);
    tex.generateMipmaps = true;
    tex.minFilter = T.LinearMipmapLinearFilter;
    tex.magFilter = T.LinearFilter;
    if (renderer && renderer.capabilities) {
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }
    return tex;
  }

  const CACHE_V = '?v=20261112i';
  const texIdle       = loadAvatarTex('img/human-avatar.png' + CACHE_V);
  const texBlink      = loadAvatarTex('img/human-avatar-blink.png' + CACHE_V);
  const texTalk       = loadAvatarTex('img/human-avatar-talk.png' + CACHE_V);
  const texTalkBlink  = loadAvatarTex('img/human-avatar-talk-blink.png' + CACHE_V);

  // Bidang 3D bervolume kurvatur halus (Cylindrical depth mapping)
  // Ukuran proporsional & rapi, pas di dalam kanvas (tidak membesar)
  const meshW = 2.45;
  const meshH = 3.30;
  const geom = new T.PlaneGeometry(meshW, meshH, 24, 24);

  const posAttr = geom.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    // Lengkungan silindris lembut pada bahu dan sisi kepala
    const depth = -(vx * vx) * 0.08 - (vy < -0.8 ? 0.05 : 0);
    posAttr.setZ(i, depth);
  }
  geom.computeVertexNormals();

  const avatarMat = new T.MeshBasicMaterial({
    map: texIdle,
    transparent: true,
    alphaTest: 0.02,
    side: T.DoubleSide
  });

  const avatarMesh = new T.Mesh(geom, avatarMat);
  avatarMesh.position.set(0, 0.14, 0);
  g.add(avatarMesh);

  // Dudukan Levitasi Holografik Futuristik PLN di Bawah
  const ring1 = new T.Mesh(
    new T.TorusGeometry(1.10, 0.020, 8, 48),
    new T.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 1.6 })
  );
  ring1.position.y = -1.65;
  ring1.rotation.x = Math.PI / 2;
  g.add(ring1);

  const ring2 = new T.Mesh(
    new T.TorusGeometry(1.28, 0.015, 8, 48),
    new T.MeshStandardMaterial({ color: 0xffe600, emissive: 0xffaa00, emissiveIntensity: 1.4 })
  );
  ring2.position.y = -1.74;
  ring2.rotation.x = Math.PI / 2;
  g.add(ring2);

  // Lencana Name Plate di Bagian Bawah
  const badgeMat = createPedestalBadgeTexture(T);
  const badgeMesh = new T.Mesh(new T.PlaneGeometry(1.18, 0.28), badgeMat);
  badgeMesh.position.set(0, -1.52, 0.25);
  g.add(badgeMesh);

  // Bayangan ambient lembut di lantai
  const shadow = new T.Mesh(
    new T.CircleGeometry(1.05, 36),
    new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.80;
  g.add(shadow);

  return {
    g,
    avatarMesh,
    avatarMat,
    texIdle,
    texBlink,
    texTalk,
    texTalkBlink,
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

  // Deteksi transisi mulai berbicara untuk gestur salam awal (Welcoming Bow)
  if (isSpeaking && !wasSpeaking) {
    speechStartTime = ms;
  }
  wasSpeaking = isSpeaking;

  // 1. Pernafasan & Apungan Organik Multi-Harmonis (Bebas Kaku)
  const breathY = Math.sin(t * 1.6) * 0.038 + Math.sin(t * 0.8) * 0.016;
  const swayX   = Math.cos(t * 0.9) * 0.020;

  // 2. Interaksi Tatapan Kursor 3D (Head Gaze Tracking)
  const botEl = document.getElementById('bot');
  const isDockedLeft = botEl && botEl.classList.contains('left');
  const baseAngleY = isDockedLeft ? 0.08 : -0.08;

  // 3. Gestur Khusus Saat Berbicara vs Saat Menyimak (Variatif & Hidup)
  let speechNodX = 0;
  let speechTiltZ = 0;
  let speechLeanZ = 0;
  let bowDipY = 0;

  if (isSpeaking) {
    const speechElapsed = ms - speechStartTime;

    // A. Gestur Awal: Anggukan Sambutan Sopan / Welcoming Bow (pada 1.2 detik pertama)
    if (speechElapsed < 1200) {
      const bowP = speechElapsed / 1200;
      const bowArc = Math.sin(bowP * Math.PI);
      speechNodX += bowArc * 0.085;
      speechTiltZ += (isDockedLeft ? 0.035 : -0.035) * bowArc;
      bowDipY = -bowArc * 0.032; // merendah santun saat menyapa
    }

    // B. Variasi Gerakan Bicara Hidup: Penekanan irama kata & ayunan luwes
    const speechRhythm = Math.sin(t * 3.6) * 0.032 + Math.sin(t * 1.5) * 0.018;
    speechNodX += speechRhythm;
    speechTiltZ += Math.sin(t * 2.0) * 0.038;
    speechLeanZ = 0.06 + Math.sin(t * 1.4) * 0.020; // condong ke depan ke arah pengunjung
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
      // Mood 1: Miringkan kepala manis (curious friendly companion tilt)
      idleTiltZ = 0.065;
    } else if (currentMood === 2) {
      // Mood 2: Melirik ke arah formulir & menyimak dengan anggukan lembut
      idleTurnY = isDockedLeft ? 0.07 : -0.07;
      idlePitchX = -0.028 + Math.sin(t * 1.2) * 0.015;
    }
  }

  // 5. Reaksi Interaktif Saat Kursor Hover di atas Asisten
  const hoverLiftY  = avatarHovered ? 0.04 : 0;
  const hoverPitchX = avatarHovered ? -0.035 : 0;

  // 5. Orientasi Tubuh Proaktif ke Formulir saat Berbicara / Memandu
  const isGuiding = (typeof waveUntil !== 'undefined' && waveUntil > performance.now());
  let guideBodyTurnY = 0;
  let guideBodyLeanX = 0;
  if (isGuiding || isSpeaking) {
    // Menoleh proaktif ke arah formulir input dan condong antusias
    guideBodyTurnY = isDockedLeft ? 0.28 : -0.28;
    guideBodyLeanX = 0.055;
    if (!speechLeanZ) speechLeanZ = 0.06;
  }

  // 6. Komposisi Rotasi & Posisi 3D yang Halus (Smooth Interpolation)
  const targetRotY = baseAngleY + guideBodyTurnY + idleTurnY + mouseTargetX * 0.40 + Math.sin(t * 0.7) * 0.020;
  const targetRotX = -mouseTargetY * 0.26 + guideBodyLeanX + hoverPitchX + idlePitchX + speechNodX + Math.sin(t * 0.5) * 0.012;
  const targetRotZ = mouseTargetX * 0.12 + idleTiltZ + speechTiltZ;

  const lerpSpeed = isSpeaking ? 0.10 : 0.07;
  R.avatarMesh.rotation.y += (targetRotY - R.avatarMesh.rotation.y) * lerpSpeed;
  R.avatarMesh.rotation.x += (targetRotX - R.avatarMesh.rotation.x) * lerpSpeed;
  R.avatarMesh.rotation.z += (targetRotZ - R.avatarMesh.rotation.z) * lerpSpeed;

  R.avatarMesh.position.x += (swayX - R.avatarMesh.position.x) * 0.08;
  R.avatarMesh.position.y += (0.14 + breathY + hoverLiftY + bowDipY - R.avatarMesh.position.y) * 0.08;
  R.avatarMesh.position.z += (speechLeanZ - R.avatarMesh.position.z) * 0.08;

  // 7. Kedipan Mata Alami (Kombinasi Kedipan Tunggal & Ganda Alami)
  const blinkCycle = t % 4.6;
  const isBlinking = (blinkCycle < 0.12) || (blinkCycle > 0.26 && blinkCycle < 0.38);

  // 8. Sinkronisasi Gerakan Bibir Riil Akustik & Silabel (True Lip-Sync)
  const isTalking = (typeof window.isMouthOpenNow === 'function')
    ? window.isMouthOpenNow()
    : (isSpeaking && (Math.sin(t * 8.0) > 0.12));

  // 9. Pergantian Tekstur Realistis (State Machine)
  let nextTex = R.texIdle;
  if (isTalking && isBlinking) {
    nextTex = R.texTalkBlink;
  } else if (isTalking) {
    nextTex = R.texTalk;
  } else if (isBlinking) {
    nextTex = R.texBlink;
  } else {
    nextTex = R.texIdle;
  }

  if (R.avatarMat.map !== nextTex && nextTex) {
    R.avatarMat.map = nextTex;
    R.avatarMat.needsUpdate = true;
  }

  // 10. Putaran & Levitasi Fisika Cincin Orbital Holografik PLN
  if (R.ring1 && R.ring2) {
    const spinSpeed = avatarHovered ? 0.024 : (isSpeaking ? 0.019 : 0.014);
    R.ring1.rotation.z += spinSpeed;
    R.ring1.rotation.x = Math.PI / 2 + Math.sin(t * 1.3) * 0.04;

    R.ring2.rotation.z -= spinSpeed * 1.25;
    R.ring2.rotation.y = Math.cos(t * 1.1) * 0.05;

    R.ring1.position.y = -1.65 + breathY * 0.45;
    R.ring2.position.y = -1.74 + breathY * 0.65;
    R.ring1.material.emissiveIntensity = isSpeaking ? 1.6 : (avatarHovered ? 1.5 : 1.3);
  }

  // 11. Animasi Lencana Sambutan & Bayangan Lantai
  if (R.badgeMesh) {
    R.badgeMesh.position.y = -1.52 + breathY * 0.50;
  }

  if (R.shadow) {
    const sScale = Math.max(0.85, 1.0 - breathY * 1.6);
    R.shadow.scale.set(sScale, sScale, 1.0);
    R.shadow.material.opacity = 0.18 - breathY * 0.06;
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}
