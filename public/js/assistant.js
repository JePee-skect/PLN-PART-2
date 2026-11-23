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
  'Final step.'
];

const GUIDE = [
  ['pb',              'Silakan tekan tombol Ambil Foto, arahkan pandangan wajah ke kamera, kemudian tekan Ambil Foto kembali untuk menyimpan potret.'],
  ['nama',            'Mohon ketikkan nama lengkap Anda sesuai dengan kartu identitas resmi.'],
  ['usaha',           'Silakan masukkan nama instansi atau perusahaan yang Anda wakili.'],
  ['alamat',          'Mohon isi alamat lengkap kantor atau domisili instansi Anda.'],
  ['pegawai',         'Silakan tuliskan nama pejabat atau pegawai PLN yang hendak Anda temui.'],
  ['apd',             'Demi keselamatan bersama, mohon pilih perlengkapan alat pelindung diri yang Anda kenakan. Jika tidak membawa, silakan pilih Tidak Memakai APD.'],
  ['perlu',           'Mohon jelaskan secara singkat keperluan kunjungan kerja Anda hari ini.'],
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
  ['pegawai',         'Please enter the name of the PLN personnel or division you wish to visit.'],
  ['apd',             'For safety compliance, please select the Personal Protective Equipment you are wearing. If none, select No PPE.'],
  ['perlu',           'Please briefly describe the purpose of your visit today.'],
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

let savedVoiceMode = (typeof store !== 'undefined' ? store.get('vms-voice-mode', 'online') : 'online');
let currentLang = (typeof store !== 'undefined' ? store.get('vms-lang', (savedVoiceMode === 'easyvoice' ? 'en' : 'id')) : 'id');
if (savedVoiceMode === 'easyvoice') {
  currentLang = 'en';
}

function setAppLanguage(lang, announce = false) {
  currentLang = (lang === 'en') ? 'en' : 'id';
  if (typeof store !== 'undefined') store.set('vms-lang', currentLang);

  if (currentLang === 'en') {
    voiceMode = 'easyvoice';
    if (typeof store !== 'undefined') store.set('vms-voice-mode', 'easyvoice');
  } else {
    if (voiceMode === 'easyvoice') {
      voiceMode = 'online';
      if (typeof store !== 'undefined') store.set('vms-voice-mode', 'online');
    }
  }
  if (typeof updateVoiceTabs === 'function') updateVoiceTabs();

  const isEn = (currentLang === 'en');
  if ($('#btn-lang-id'))  $('#btn-lang-id').classList.toggle('on', !isEn);
  if ($('#btn-lang-en'))  $('#btn-lang-en').classList.toggle('on', isEn);

  if ($('#pb') && typeof camStream !== 'undefined' && !camStream) {
    $('#pb').textContent = isEn ? 'Take Photo' : 'Ambil Foto / Take Photo';
  }
  if ($('#sub')) {
    $('#sub').textContent = isEn ? 'Submit Registration' : 'Kirim Registrasi / Submit Registration';
  }
  if ($('#again')) {
    $('#again').textContent = isEn ? 'Fill Form Again' : 'Isi Formulir Lagi / Fill Form Again';
  }
}
window.setAppLanguage = setAppLanguage;

function initAssistant() {
  ['btn-lang-id'].forEach(id => {
    const el = $('#' + id);
    if (el) el.onclick = () => setAppLanguage('id', false);
  });
  ['btn-lang-en'].forEach(id => {
    const el = $('#' + id);
    if (el) el.onclick = () => setAppLanguage('en', false);
  });
  setAppLanguage(currentLang, false);
}

// Chatbot dinonaktifkan sepenuhnya agar tidak mengganggu pengisian formulir
function addMsg() {}
function say() {}
function showBubble() {}
function botHello() {}
function goStep() {}
function openForm() {}
function ask() {}
function renderChips() {}
