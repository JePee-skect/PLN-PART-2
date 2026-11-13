/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   Asisten Virtual: Panduan Langkah Demi Langkah, Tanya Jawab & Chat
   ===================================================================== */

const STEP_LABELS = [
  'Langkah pertama.',
  'Langkah kedua.',
  'Langkah ketiga.',
  'Langkah keempat.',
  'Langkah kelima.',
  'Langkah keenam.',
  'Langkah ketujuh.',
  'Langkah kedelapan.',
  'Langkah kesembilan.',
  'Langkah kesepuluh.',
  'Langkah kesebelas.',
  'Langkah kedua belas.',
  'Langkah ketiga belas.',
  'Langkah keempat belas.',
  'Langkah terakhir.'
];

const STEP_LABELS_EN = [
  'Step one.',
  'Step two.',
  'Step three.',
  'Step four.',
  'Step five.',
  'Step six.',
  'Step seven.',
  'Step eight.',
  'Step nine.',
  'Step ten.',
  'Step eleven.',
  'Step twelve.',
  'Step thirteen.',
  'Step fourteen.',
  'Final step.'
];

const GUIDE = [
  ['pb',              'Silakan tekan tombol Ambil Foto, arahkan pandangan wajah ke kamera, kemudian tekan Ambil Foto kembali untuk menyimpan potret.'],
  ['nama',            'Mohon ketikkan nama lengkap Anda sesuai dengan kartu identitas resmi.'],
  ['usaha',           'Silakan masukkan nama instansi atau perusahaan yang Anda wakili.'],
  ['alamat',          'Mohon isi alamat lengkap kantor atau domisili instansi Anda.'],
  ['telp',            'Silakan masukkan nomor telepon atau WhatsApp aktif yang dapat dihubungi.'],
  ['email',           'Silakan cantumkan alamat email Anda jika ada, atau lewati jika tidak memiliki email.'],
  ['pegawai',         'Silakan tuliskan nama pejabat atau pegawai PLN yang hendak Anda temui.'],
  ['apd',             'Demi keselamatan bersama, mohon pilih perlengkapan alat pelindung diri yang Anda kenakan. Jika tidak membawa, silakan pilih Tidak Memakai APD.'],
  ['perlu',           'Mohon jelaskan secara singkat keperluan kunjungan kerja Anda, atau pilih opsi cepat yang tersedia.'],
  ['ktp',             'Silakan masukkan enam belas digit nomor induk kependudukan KTP, atau nomor SIM maupun paspor Anda.'],
  ['kend',            'Mohon cantumkan jenis kendaraan beserta nomor polisi yang Anda gunakan.'],
  ['tag',             'Silakan masukkan nomor kartu tanda pengenal tamu yang telah diberikan oleh petugas keamanan di pos.'],
  ['jml',             'Silakan tentukan total jumlah tamu yang hadir dalam kunjungan Anda.'],
  ['agree-induction', 'Mohon cermati peraturan Keselamatan dan Keamanan Kerja pada poster di atas, kemudian beri tanda centang persetujuan sebagai komitmen keselamatan bersama.'],
  ['sub',             'Seluruh data registrasi telah lengkap. Silakan tekan tombol Kirim Registrasi untuk menyelesaikan pendaftaran kunjungan Anda.']
];

const GUIDE_EN = [
  ['pb',              'Please click the Take Photo button, look directly at the camera, then click Capture to save your picture.'],
  ['nama',            'Please enter your full name as shown on your official identification.'],
  ['usaha',           'Please enter the company or institution you represent.'],
  ['alamat',          'Please provide the full address of your company or institution.'],
  ['telp',            'Please enter an active phone or WhatsApp number where you can be reached.'],
  ['email',           'Please enter your email address if available, or skip if you do not have one.'],
  ['pegawai',         'Please enter the name of the PLN personnel or division you wish to visit.'],
  ['apd',             'For safety compliance, please select the Personal Protective Equipment you are wearing. If none, select No PPE.'],
  ['perlu',           'Please describe the purpose of your visit, or select one of the quick options.'],
  ['ktp',             'Please enter your sixteen-digit National ID number, driver license, or passport number.'],
  ['kend',            'Please specify your vehicle type and license plate number.'],
  ['tag',             'Please enter the visitor badge number provided by security.'],
  ['jml',             'Please select the total number of visitors in your party.'],
  ['agree-induction', 'Please review the workplace Safety and Security Induction above and check the agreement box.'],
  ['sub',             'All details have been completed. Please click Submit Registration to finish your visitor registration.']
];

const ADMIN_HELP = {
  how: 'Di menu Dashboard, tekan tombol Check In saat tamu tiba di lokasi. Saat tamu hendak pulang, tekan tombol Check Out pada baris tamu tersebut.',
  exp: 'Tekan tombol Export to Excel. File Excel akan langsung terunduh otomatis ke komputer Anda, dan nomor KTP sudah rapi dalam format teks 16 digit.',
  fil: 'Gunakan filter Tanggal Awal dan Tanggal Akhir untuk menentukan rentang waktu, atau ketik nama tamu pada kolom pencarian.'
};

const FAQ = [
  [
    /induksi|induction|safety induction|poster|tata tertib|aturan/,
    'Safety and Security Induction PT PLN Pusharlis memuat 8 peraturan keselamatan dan keamanan kerja, termasuk kewajiban mematuhi K3, mengenakan ID Card, larangan merokok dan narkoba, serta petunjuk evakuasi darurat.'
  ],
  [
    /k3|keselamatan|safety/,
    'K3LH adalah Keselamatan, Kesehatan Kerja, dan Lingkungan Hidup. Di seluruh area kerja PLN Pusharlis, setiap orang wajib mematuhi protokol K3 dan mengenakan APD: safety helmet, rompi reflektif, safety shoes, serta kartu tanda pengenal.'
  ],
  [
    /ktp|identitas|sim|paspor|nik/,
    'Isi 16 digit angka NIK KTP Anda. Bila tidak membawa KTP fisik, Anda dapat memasukkan nomor SIM 12 digit atau nomor paspor.'
  ],
  [
    /apd|helm|rompi|sepatu|seragam/,
    'Centang perlengkapan APD yang Anda gunakan: safety helmet, safety shoes, rompi reflektif, atau seragam kerja.'
  ],
  [
    /kendaraan|polisi|plat|nopol|motor|mobil/,
    'Tuliskan jenis kendaraan beserta nomor plat polisinya, contoh: Avanza B 1234 CD.'
  ],
  [
    /tag|name|kartu/,
    'Nomor name tag tamu tertera pada kartu fisik yang diserahkan oleh petugas pengamanan di pos gerbang masuk.'
  ],
  [
    /foto|kamera|potret/,
    'Tekan tombol Ambil Foto untuk mengaktifkan kamera depan, lalu tekan tombol Ambil Foto untuk menangkap potret wajah.'
  ],
  [
    /jumlah|rombongan|orang/,
    'Tentukan total tamu yang ikut serta dalam kunjungan, termasuk diri Anda sendiri.'
  ],
  [
    /kirim|simpan|selesai|submit/,
    'Pastikan seluruh kolom bertanda bintang telah terisi, kemudian tekan Kirim Registrasi.'
  ],
  [
    /halo|hai|selamat|pagi|siang|sore|malam/,
    'Selamat datang di PT PLN (Persero) Pusharlis. Saya E.V.A, asisten virtual Anda. Apakah ada yang dapat saya bantu terkait pendaftaran kunjungan Bapak dan Ibu?'
  ],
  [
    /mulai|panduan|bimbingan|bantu/,
    null
  ]
];

const FAQ_EN = [
  [
    /induksi|induction|safety induction|poster|rules|regulation/,
    'The Safety and Security Induction of PT PLN Pusharlis outlines 8 workplace safety and security regulations, including compliance with HSE rules, wearing ID cards, no smoking or illicit drugs, and emergency evacuation procedures.'
  ],
  [
    /k3|hse|safety|helmet|ppe|boot|vest/,
    'HSE stands for Health, Safety, and Environment. Within all PT PLN Pusharlis facilities, everyone must comply with safety protocols and wear required PPE: safety helmet, reflective vest, safety shoes, and an official visitor ID badge.'
  ],
  [
    /ktp|identitas|sim|paspor|passport|id|nik/,
    'Please enter your 16-digit National ID (NIK), driver license, or passport number.'
  ],
  [
    /apd|vest|shoes|helmet|uniform/,
    'Please select the PPE you are currently wearing: safety helmet, safety shoes, reflective vest, or work uniform. If you do not have any, choose No PPE.'
  ],
  [
    /vehicle|car|motorcycle|plate|police|kendaraan|mobil|motor/,
    'Please specify your vehicle type and license plate number, for example: Avanza B 1234 CD or Pedestrian.'
  ],
  [
    /tag|name|badge|card|kartu/,
    'Your visitor badge number is printed on the physical visitor card handed to you by security at the entrance post.'
  ],
  [
    /photo|camera|picture|foto/,
    'Click the Take Photo button to activate your camera, position your face clearly in the frame, and click Capture to save.'
  ],
  [
    /number of visitors|party|guests|jumlah|orang/,
    'Please specify the total number of persons in your visit party, including yourself.'
  ],
  [
    /submit|send|finish|kirim|simpan/,
    'Please ensure all fields marked with an asterisk are filled, then click Submit Registration.'
  ],
  [
    /hello|hi|good morning|good afternoon|good evening|halo|hai/,
    'Welcome to PT PLN Pusharlis. I am E.V.A, your virtual assistant. How may I assist your visit today?'
  ],
  [
    /start|guide|guide me|bimbingan|bantu|panduan/,
    null
  ]
];

/* State Asisten */
let guideIdx     = -1;
let lastHint     = '';
let quiet        = false;
let waveUntil    = 0;
let lastActivity = Date.now();
let idleNotified = false;
let bubbleTimer  = null;
const greeted    = {};

let currentLang = (typeof store !== 'undefined' ? store.get('vms-lang', 'id') : 'id');

function setAppLanguage(lang, announce = true) {
  currentLang = (lang === 'en') ? 'en' : 'id';
  if (typeof store !== 'undefined') store.set('vms-lang', currentLang);

  if (currentLang === 'en') {
    voiceMode = 'easyvoice';
    if (typeof store !== 'undefined') store.set('vms-voice-mode', 'easyvoice');
  } else {
    voiceMode = 'online';
    if (typeof store !== 'undefined') store.set('vms-voice-mode', 'online');
  }
  if (typeof updateVoiceTabs === 'function') updateVoiceTabs();

  const isEn = (currentLang === 'en');
  if ($('#btn-lang-id'))  $('#btn-lang-id').classList.toggle('on', !isEn);
  if ($('#btn-lang-en'))  $('#btn-lang-en').classList.toggle('on', isEn);
  if ($('#chat-lang-id')) $('#chat-lang-id').classList.toggle('on', !isEn);
  if ($('#chat-lang-en')) $('#chat-lang-en').classList.toggle('on', isEn);

  renderChips();

  if (announce) {
    if (isEn) {
      say('Welcome to PT PLN Pusharlis. I am E.V.A, your virtual assistant. How may I assist your visit today?');
    } else {
      say('Selamat datang di PT PLN (Persero) Pusharlis. Saya E.V.A, asisten virtual Anda. Ada yang dapat saya bantu?');
    }
  }
}
window.setAppLanguage = setAppLanguage;

function initAssistant() {
  renderChips();

  ['btn-lang-id', 'chat-lang-id'].forEach(id => {
    const el = $('#' + id);
    if (el) el.onclick = () => setAppLanguage('id');
  });
  ['btn-lang-en', 'chat-lang-en'].forEach(id => {
    const el = $('#' + id);
    if (el) el.onclick = () => setAppLanguage('en');
  });
  setAppLanguage(currentLang, false);

  const cs = $('#cs');
  if (cs) cs.onclick = ask;

  const ci = $('#ci');
  if (ci) {
    ci.onkeydown = (e) => {
      if (e.key === 'Enter') ask();
    };
  }

  const chips = $('#chips');
  if (chips) {
    chips.onclick = (e) => {
      const c = e.target.dataset.c;
      if (!c) return;

      if (c === 'sum')  return say(todaySummary());
      if (c === 'how')  return say(ADMIN_HELP.how);
      if (c === 'exp')  return say(ADMIN_HELP.exp);

      openForm();
      if (c === 'start') goStep(0);
      if (c === 'next')  goStep(guideIdx + 1);
      if (c === 'again') goStep(Math.max(guideIdx, 0));
    };
  }

  const fab = $('#fab');
  if (fab) {
    fab.onclick = () => {
      if (typeof wasDragged !== 'undefined' && wasDragged) {
        wasDragged = false;
        return;
      }

      if ($('#bub')) $('#bub').classList.add('hide');
      if ($('#panel')) $('#panel').classList.toggle('hide');

      if ($('#panel') && !$('#panel').classList.contains('hide')) {
        const isReg = (location.hash === '#registrasi' || role !== 'admin');
        botHello(isReg ? 'registrasi' : 'dashboard', true);
      } else {
        try {
          speechSynthesis.cancel();
        } catch (e) {}
      }
    };
  }

  const pclose = $('#pclose');
  if (pclose) {
    pclose.onclick = (e) => {
      e.stopPropagation();
      if ($('#panel')) $('#panel').classList.add('hide');
    };
  }

  const bub = $('#bub');
  if (bub && fab) {
    bub.onclick = () => fab.click();
  }

  /* Maju otomatis saat kolom formulir selesai diisi */
  GUIDE.forEach(([id], i) => {
    if (id === 'apd' || id === 'sub' || id === 'agree-induction') return;

    const el = $('#' + id);
    if (!el) return;

    el.addEventListener('change', () => {
      const isCurrentStep = (guideIdx === i);
      const hasValue      = el.value ? el.value.trim() : '';
      const hasKtpError   = (id === 'ktp' && typeof ktpError === 'function' && ktpError());

      if (isCurrentStep && hasValue && !hasKtpError) {
        setTimeout(() => goStep(i + 1), 400);
      }
    });
  });

  /* Panduan audio otomatis saat input difokuskan */
  let focusDebounceTimer = null;
  document.addEventListener('focusin', (e) => {
    if (quiet || e.target.id === 'pb') return;

    const i = GUIDE.findIndex((g) => g[0] === e.target.id);
    if (i < 0 || e.target.id === lastHint) return;

    lastHint = e.target.id;
    guideIdx = i;

    // Jeda debounce 400ms: cegah suara terpotong saat pengguna berpindah antar kolom input
    clearTimeout(focusDebounceTimer);
    focusDebounceTimer = setTimeout(() => {
      const isEn = (currentLang === 'en' || voiceMode === 'easyvoice');
      const textToSpeak = isEn && GUIDE_EN[i] ? GUIDE_EN[i][1] : GUIDE[i][1];
      say(textToSpeak);
    }, 400);
  });

  /* Menawarkan bantuan bila pengguna terdiam lama di formulir */
  setInterval(() => {
    const isIdle = (Date.now() - lastActivity > 25000);
    const formEl = $('#v-registrasi');
    const isFormActive = formEl && !formEl.classList.contains('hide');

    if (isIdle && !idleNotified && isFormActive) {
      idleNotified = true;
      const isEn = (currentLang === 'en' || voiceMode === 'easyvoice');
      say(isEn
        ? 'Do you need assistance with filling out the form? Please tap on me for step-by-step guidance.'
        : 'Apakah Bapak dan Ibu membutuhkan bantuan dalam pengisian formulir? Silakan ketuk saya untuk panduan langkah demi langkah.');
    }
  }, 5000);
}

function addMsg(text, cls) {
  const msgBox = $('#msgs');
  if (!msgBox) return;
  const d = document.createElement('div');
  d.className = 'm ' + cls;
  if (cls === 'b') {
    d.innerHTML = `
      <div class="msg-sender">
        <span class="msg-bot-name">E.V.A</span>
      </div>
      <div class="msg-content">${esc(text)}</div>
    `;
  } else {
    d.textContent = text;
  }
  msgBox.appendChild(d);
  msgBox.scrollTop = 1e9;
}

function say(text) {
  if (typeof stopAllAudio === 'function') {
    stopAllAudio();
  }
  // Aktifkan gestur tangan mengarahkan user selama pesan diucapkan
  waveUntil = performance.now() + Math.max(3800, (text || '').length * 85);
  addMsg(text, 'b');
  if (typeof speak === 'function') speak(text);
  showBubble(text);
}

function showBubble(text) {
  const panel = $('#panel');
  if (panel && !panel.classList.contains('hide')) return;
  const b = $('#bub');
  if (!b) return;
  b.innerHTML = `
    <div class="bub-brand">
      <span>E.V.A • PLN Pusharlis</span>
    </div>
    <div class="bub-text">${esc(text)}</div>
    <div class="bub-hint">💬 Ketuk balon untuk buka Chat AI</div>
  `;
  b.classList.remove('hide');
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => {
    b.classList.add('hide');
  }, Math.max(7000, text.length * 85));
}

function botHello(page, force = false) {
  const isEn = (currentLang === 'en' || voiceMode === 'easyvoice');
  const key = page + role + (isEn ? '_en' : '_id');
  if (greeted[key] && !force) return;
  greeted[key] = true;

  if (page === 'registrasi') {
    if (isEn) {
      say('Welcome to PT PLN Pusharlis. I am E.V.A, your virtual assistant. I am delighted to guide you through the registration process. Please click Start Guide for step-by-step assistance.');
    } else {
      say('Selamat datang di PT PLN (Persero) Pusharlis. Saya E.V.A, asisten virtual Anda. Dengan senang hati, saya siap memandu Bapak dan Ibu dalam proses pengisian formulir registrasi kunjungan. Silakan tekan tombol Mulai Panduan untuk bimbingan langkah demi langkah.');
    }
  } else {
    if (isEn) {
      say('Welcome, officers. I am E.V.A. You can monitor visitor logs, check in and check out guests, and download reports to Excel.');
    } else {
      say('Selamat datang, Bapak dan Ibu Petugas. Saya E.V.A. Anda dapat memantau data tamu, melakukan check in dan check out, serta mengunduh laporan ke Excel.');
    }
  }
}

function goStep(i) {
  if (i < 0 || i >= GUIDE.length) return;
  guideIdx = i;

  const isEn = (currentLang === 'en' || voiceMode === 'easyvoice');
  const [id, idText] = GUIDE[i];
  const enText = (GUIDE_EN[i] && GUIDE_EN[i][1]) ? GUIDE_EN[i][1] : idText;

  const targetEl = (id === 'apd')
    ? $('#apdl')
    : (id === 'agree-induction')
      ? $('#induction-container')
      : $('#' + id);

  if (targetEl) {
    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  quiet = true;
  if (id !== 'apd' && id !== 'agree-induction' && $('#' + id)) {
    $('#' + id).focus({ preventScroll: true });
  }
  setTimeout(() => { quiet = false; }, 600);

  lastHint = id;
  const stepPrefix = isEn
    ? (typeof STEP_LABELS_EN !== 'undefined' ? STEP_LABELS_EN[i] : `Step ${i + 1}.`)
    : ((typeof STEP_LABELS !== 'undefined' && STEP_LABELS[i]) ? STEP_LABELS[i] : `Langkah ${i + 1}.`);

  const spoken = isEn ? `${stepPrefix} ${enText}` : `${stepPrefix} ${idText}`;
  say(spoken);
}

function openForm() {
  const vReg = $('#v-registrasi');
  if (vReg && vReg.classList.contains('hide')) {
    location.hash = '#registrasi';
  }
}

function todaySummary() {
  const t       = ymd();
  const today   = data.filter((r) => r.tgl === t);
  const waiting = today.filter((r) => r.status === 'Menunggu').length;
  const inside  = today.filter((r) => r.status === 'Check In').length;
  const out     = data.filter((r) => r.outAt === t).length;

  return `Hari ini tercatat ${today.length} tamu: ${waiting} sedang menunggu, ${inside} sedang berada di lokasi, dan ${out} telah check out.`;
}

function answer(q) {
  const isEn = (currentLang === 'en' || voiceMode === 'easyvoice');

  if (/terima\s*kasih|makasih|thanks?|thank you/i.test(q)) {
    const vReg = $('#v-registrasi');
    const onForm = vReg && !vReg.classList.contains('hide');
    return onForm
      ? showThanks('')
      : say(isEn ? 'You are very welcome! I am delighted to assist you.' : 'Sama-sama! Dengan senang hati saya siap melayani Bapak dan Ibu.');
  }

  if (role === 'admin') {
    if (/ringkas|rekap|hari ini|berapa|summary|today/i.test(q)) return say(todaySummary());
    if (/check|masuk|keluar/i.test(q))                         return say(ADMIN_HELP.how);
    if (/export|excel|unduh|salin|download/i.test(q))           return say(ADMIN_HELP.exp);
    if (/cari|filter|tanggal|search|filter/i.test(q))           return say(ADMIN_HELP.fil);
  }

  const activeFaq = isEn ? FAQ_EN : FAQ;
  const hit = activeFaq.find(([re]) => re.test(q));
  if (hit && hit[1] === null) {
    openForm();
    return goStep(0);
  }

  if (hit) return say(hit[1]);

  // Fallback ke FAQ bahasa lain jika tidak cocok
  const fallbackFaq = isEn ? FAQ : FAQ_EN;
  const fallbackHit = fallbackFaq.find(([re]) => re.test(q));
  if (fallbackHit && fallbackHit[1] === null) {
    openForm();
    return goStep(0);
  }
  if (fallbackHit) return say(fallbackHit[1]);

  say(isEn
    ? 'I apologize, I did not quite understand that. You can ask about ID/Passport, PPE, vehicle, visitor badge, or click Start Guide.'
    : 'Maaf, saya belum memahami pertanyaan tersebut. Anda dapat bertanya seputar KTP, APD, kendaraan, name tag, atau tekan tombol Mulai panduan.');
}

function ask() {
  const ci = $('#ci');
  if (!ci) return;
  const text = ci.value.trim();
  if (!text) return;

  ci.value = '';
  addMsg(text, 'u');
  answer(text.toLowerCase());
}

function renderChips() {
  const chips = $('#chips');
  if (!chips) return;
  const isEn = (currentLang === 'en');

  if (role === 'admin') {
    chips.innerHTML = isEn
      ? '<button data-c="sum">Today\'s Summary</button>' +
        '<button data-c="how">How to Check In/Out</button>' +
        '<button data-c="exp">Export to Excel</button>' +
        '<button data-c="start">Form Guidance</button>'
      : '<button data-c="sum">Ringkasan hari ini</button>' +
        '<button data-c="how">Cara check in/out</button>' +
        '<button data-c="exp">Export data</button>' +
        '<button data-c="start">Panduan formulir</button>';
  } else {
    chips.innerHTML = isEn
      ? '<button data-c="start">▶️ Start Guide</button>' +
        '<button data-c="next">➡️ Next Step</button>' +
        '<button data-c="again">🔄 Repeat Step</button>'
      : '<button data-c="start">Mulai panduan</button>' +
        '<button data-c="next">Lanjut</button>' +
        '<button data-c="again">Ulangi</button>';
  }
}
