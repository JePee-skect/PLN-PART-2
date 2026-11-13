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

const GUIDE = [
  ['pb',              'Silakan tekan tombol Ambil Foto, arahkan pandangan wajah ke kamera, kemudian tekan Ambil Foto kembali untuk menyimpan potret.'],
  ['nama',            'Mohon ketikkan nama lengkap Anda sesuai dengan kartu identitas resmi.'],
  ['ktp',             'Silakan masukkan enam belas digit nomor induk kependudukan KTP, atau nomor SIM maupun paspor Anda.'],
  ['usaha',           'Silakan masukkan nama instansi atau perusahaan yang Anda wakili.'],
  ['alamat',          'Mohon isi alamat lengkap kantor atau domisili instansi Anda.'],
  ['telp',            'Silakan masukkan nomor telepon atau WhatsApp aktif yang dapat dihubungi.'],
  ['email',           'Silakan cantumkan alamat email Anda jika ada, atau lewati jika tidak memiliki email.'],
  ['pegawai',         'Silakan tuliskan nama pejabat atau pegawai PLN yang hendak Anda temui.'],
  ['perlu',           'Mohon pilih atau ketikkan tujuan kedatangan Anda, seperti rapat, kunjungan kerja, atau pengiriman barang.'],
  ['apd',             'Demi keselamatan bersama, mohon pilih perlengkapan alat pelindung diri yang Anda kenakan. Jika tidak membawa, silakan pilih Tidak Memakai APD.'],
  ['kend',            'Mohon cantumkan jenis kendaraan beserta nomor polisi yang Anda gunakan.'],
  ['tag',             'Silakan masukkan nomor kartu tanda pengenal tamu yang telah diberikan oleh petugas keamanan di pos.'],
  ['jml',             'Silakan tentukan total jumlah tamu yang hadir dalam kunjungan Anda.'],
  ['agree-induction', 'Mohon cermati peraturan Keselamatan dan Keamanan Kerja pada poster di atas, kemudian beri tanda centang persetujuan sebagai komitmen keselamatan bersama.'],
  ['sub',             'Seluruh data registrasi telah lengkap. Silakan tekan tombol Kirim Registrasi untuk menyelesaikan pendaftaran kunjungan Anda.']
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

/* State Asisten */
let guideIdx     = -1;
let lastHint     = '';
let quiet        = false;
let waveUntil    = 0;
let lastActivity = Date.now();
let idleNotified = false;
let bubbleTimer  = null;
const greeted    = {};

function initAssistant() {
  renderChips();

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
      say(GUIDE[i][1]);
    }, 400);
  });

  /* Menawarkan bantuan bila pengguna terdiam lama di formulir */
  setInterval(() => {
    const isIdle = (Date.now() - lastActivity > 25000);
    const formEl = $('#v-registrasi');
    const isFormActive = formEl && !formEl.classList.contains('hide');

    if (isIdle && !idleNotified && isFormActive) {
      idleNotified = true;
      say('Apakah Bapak dan Ibu membutuhkan bantuan dalam pengisian formulir? Silakan ketuk saya untuk panduan langkah demi langkah.');
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
  const key = page + role;
  if (greeted[key] && !force) return;
  greeted[key] = true;

  if (page === 'registrasi') {
    say('Selamat datang di PT PLN (Persero) Pusharlis. Saya E.V.A, asisten virtual Anda. Dengan senang hati, saya siap memandu Bapak dan Ibu dalam proses pengisian formulir registrasi kunjungan. Silakan tekan tombol Mulai Panduan untuk bimbingan langkah demi langkah.');
  } else {
    say('Selamat datang, Bapak dan Ibu Petugas. Saya E.V.A. Anda dapat memantau data tamu, melakukan check in dan check out, serta mengunduh laporan ke Excel.');
  }
}

function goStep(i) {
  if (i < 0 || i >= GUIDE.length) return;
  guideIdx = i;

  const [id, text] = GUIDE[i];
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
  const stepPrefix = (typeof STEP_LABELS !== 'undefined' && STEP_LABELS[i]) ? STEP_LABELS[i] : `Langkah ${i + 1}.`;
  say(`${stepPrefix} ${text}`);
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
  if (/terima\s*kasih|makasih|thanks?|thank you/i.test(q)) {
    const vReg = $('#v-registrasi');
    const onForm = vReg && !vReg.classList.contains('hide');
    return onForm ? showThanks('') : say('Sama-sama! Dengan senang hati saya siap melayani Bapak dan Ibu.');
  }

  if (role === 'admin') {
    if (/ringkas|rekap|hari ini|berapa/i.test(q)) return say(todaySummary());
    if (/check|masuk|keluar/i.test(q))            return say(ADMIN_HELP.how);
    if (/export|excel|unduh|salin/i.test(q))      return say(ADMIN_HELP.exp);
    if (/cari|filter|tanggal/i.test(q))          return say(ADMIN_HELP.fil);
  }

  const hit = FAQ.find(([re]) => re.test(q));
  if (hit && hit[1] === null) {
    openForm();
    return goStep(0);
  }

  say(hit ? hit[1] : 'Maaf, saya belum memahami pertanyaan tersebut. Anda dapat bertanya seputar KTP, APD, kendaraan, name tag, atau tekan tombol Mulai panduan.');
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
  chips.innerHTML = (role === 'admin')
    ? '<button data-c="sum">Ringkasan hari ini</button>' +
      '<button data-c="how">Cara check in/out</button>' +
      '<button data-c="exp">Export data</button>' +
      '<button data-c="start">Panduan formulir</button>'
    : '<button data-c="start">Mulai panduan</button>' +
      '<button data-c="next">Lanjut</button>' +
      '<button data-c="again">Ulangi</button>';
}
