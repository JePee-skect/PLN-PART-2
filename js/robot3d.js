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
    camera.position.set(0, 0.05, 7.8);

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

  const texIdle       = loadAvatarTex('img/human-avatar.png');
  const texBlink      = loadAvatarTex('img/human-avatar-blink.png');
  const texTalk       = loadAvatarTex('img/human-avatar-talk.png');
  const texTalkBlink  = loadAvatarTex('img/human-avatar-talk-blink.png');

  // Bidang 3D bervolume kurvatur halus (Cylindrical depth mapping)
  // Memberikan kedalaman perspektif 3D yang nyata saat kepala menoleh
  const meshW = 3.10;
  const meshH = 4.15;
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

  const avatarMat = new T.MeshStandardMaterial({
    map: texIdle,
    transparent: true,
    roughness: 0.55,
    metalness: 0.02,
    alphaTest: 0.03,
    side: T.DoubleSide
  });

  const avatarMesh = new T.Mesh(geom, avatarMat);
  avatarMesh.position.set(0, 0.12, 0);
  g.add(avatarMesh);

  // Dudukan Levitasi Holografik Futuristik PLN di Bawah
  const ring1 = new T.Mesh(
    new T.TorusGeometry(1.22, 0.022, 8, 48),
    new T.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 1.6 })
  );
  ring1.position.y = -2.12;
  ring1.rotation.x = Math.PI / 2;
  g.add(ring1);

  const ring2 = new T.Mesh(
    new T.TorusGeometry(1.44, 0.016, 8, 48),
    new T.MeshStandardMaterial({ color: 0xffe600, emissive: 0xffaa00, emissiveIntensity: 1.4 })
  );
  ring2.position.y = -2.22;
  ring2.rotation.x = Math.PI / 2;
  g.add(ring2);

  // Lencana Name Plate di Bagian Bawah
  const badgeMat = createPedestalBadgeTexture(T);
  const badgeMesh = new T.Mesh(new T.PlaneGeometry(1.30, 0.32), badgeMat);
  badgeMesh.position.set(0, -1.98, 0.25);
  g.add(badgeMesh);

  // Bayangan ambient lembut di lantai
  const shadow = new T.Mesh(
    new T.CircleGeometry(1.20, 36),
    new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -2.30;
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
    badgeMesh
  };
}

function animate(ms) {
  requestAnimationFrame(animate);

  const t = ms / 1000;
  const R = robot;
  if (!R) return;

  const isSpeaking = (typeof speaking !== 'undefined' && speaking);

  // 1. Gerakan Mengapung & Nafas Alami (Natural Breathing & Floating Bob)
  const breath = Math.sin(t * 1.8) * 0.038;
  R.avatarMesh.position.y = 0.12 + breath;

  // 2. Interaksi Tatapan Kursor 3D (3D Head & Eye Gaze Tracking)
  // Menoleh dan memiringkan kepala secara halus mengikuti gerakan kursor pengguna
  const botEl = document.getElementById('bot');
  const isDockedLeft = botEl && botEl.classList.contains('left');

  // Jika bot di kanan, tubuh sedikit menghadap kiri (-0.08) ke arah form; jika di kiri sebaliknya (+0.08)
  const baseAngleY = isDockedLeft ? 0.08 : -0.08;

  const targetRotY = baseAngleY + mouseTargetX * 0.48 + Math.sin(t * 0.8) * 0.025;
  const targetRotX = -mouseTargetY * 0.32 + Math.sin(t * 0.6) * 0.015;
  const targetRotZ = mouseTargetX * 0.10 + Math.sin(t * 0.8) * 0.012;

  const lerpSpeed = 0.08;
  R.avatarMesh.rotation.y += (targetRotY - R.avatarMesh.rotation.y) * lerpSpeed;
  R.avatarMesh.rotation.x += (targetRotX - R.avatarMesh.rotation.x) * lerpSpeed;
  R.avatarMesh.rotation.z += (targetRotZ - R.avatarMesh.rotation.z) * lerpSpeed;

  // 3. Siklus Kedipan Mata Alami (Natural Blink Cycle: tiap ~4 detik selama 140ms)
  const blinkCycle = t % 4.0;
  const isBlinking = blinkCycle < 0.14;

  // 4. Siklus Gerakan Bibir Berbicara (Lip Articulation Sync saat speaking)
  // Mengikuti irama frekuensi suku kata bahasa Indonesia (~5-6 suku kata per detik)
  const isTalking = isSpeaking && (Math.sin(t * 16.0) > 0.10);

  // 5. Pergantian Tekstur Realistis (State Machine)
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

  // 6. Putaran Halus Cincin Orbital Holografik PLN
  if (R.ring1 && R.ring2) {
    R.ring1.rotation.z += 0.016;
    R.ring1.rotation.x = Math.PI / 2 + Math.sin(t * 1.4) * 0.05;

    R.ring2.rotation.z -= 0.022;
    R.ring2.rotation.y = Math.cos(t * 1.1) * 0.06;

    // Denyut cahaya cincin saat berbicara
    const ringPulse = isSpeaking ? (1.8 + Math.sin(t * 10) * 0.4) : (1.4 + Math.sin(t * 2.0) * 0.25);
    R.ring1.material.emissiveIntensity = ringPulse;
  }

  // 7. Animasi Lencana Sambutan Interaktif
  if (R.badgeMesh) {
    R.badgeMesh.position.y = -1.98 + breath * 0.5;
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}
