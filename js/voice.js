/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   Voice Engine: Normalizer Teks, Sintesis Suara Gadis Neural Studio & AI
   ===================================================================== */

let voices = [];
let speakTimer = null;
let currentUtterance = null;
let userVoiceIndex = store.get('vms-voice-idx', -1);
let userVoiceRate  = parseFloat(store.get('vms-voice-rate', 1.0)) || 1.0;

let voiceOn        = true;
let speaking       = false;
let audioUnlocked  = false;
let pendingSpeech  = null;
const activeUtterances = [];

/* Web Audio API Chime untuk E.V.A */
let buddyAudioCtx = null;
function getBuddyAudioContext() {
  try {
    if (!buddyAudioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) buddyAudioCtx = new AudioCtx();
    }
    if (buddyAudioCtx && buddyAudioCtx.state === 'suspended') {
      buddyAudioCtx.resume().catch(() => {});
    }
    return buddyAudioCtx;
  } catch (e) {
    return null;
  }
}

function playBuddyChime() {
  if (!voiceOn) return;
  try {
    const ctx = getBuddyAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Nada Harmonis Hangat & Lembut (F4 349.23 Hz & A4 440 Hz) - Sangat Halus & Ramah
    const o1 = ctx.createOscillator();
    const g1 = ctx.createGain();
    o1.type = 'sine';
    o1.frequency.setValueAtTime(349.23, now);
    g1.gain.setValueAtTime(0.025, now);
    g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    o1.connect(g1);
    g1.connect(ctx.destination);
    o1.start(now);
    o1.stop(now + 0.22);

    const o2 = ctx.createOscillator();
    const g2 = ctx.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(440.0, now + 0.06);
    g2.gain.setValueAtTime(0.025, now + 0.06);
    g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);
    o2.connect(g2);
    g2.connect(ctx.destination);
    o2.start(now + 0.06);
    o2.stop(now + 0.38);
  } catch (e) {}
}

/* Mode Suara: 'online' (default wanita ID), 'browser', 'easyvoice', atau 'elevenlabs' */
const OFFICIAL_EASYVOICE_KEY = 'ev_a8dd782ce24e59571a03d3cbda4039cd73c68d9a0013647a9d295a6e7cc87e16';
let voiceMode      = store.get('vms-voice-mode', 'online');
let easyVoiceKey   = store.get('vms-ev-key', OFFICIAL_EASYVOICE_KEY);
if (!easyVoiceKey || easyVoiceKey.length < 60 || (easyVoiceKey.startsWith('ev_a8dd782c') && easyVoiceKey.length < 67)) {
  easyVoiceKey = OFFICIAL_EASYVOICE_KEY;
  store.set('vms-ev-key', easyVoiceKey);
}
let easyVoiceVoice = store.get('vms-ev-voice', (typeof DEFAULT_EASYVOICE_VOICE !== 'undefined' ? DEFAULT_EASYVOICE_VOICE : 'af_heart'));

let elevenApiKey   = store.get('vms-el-key', '');
let elevenVoiceId  = store.get('vms-el-vid', '');
const audioCache   = new Map();
let currentAudioPlayer = null;
let activeTtsAbort     = null;
let voiceSelectDebounce = null;
let speechSequence     = 0;

/* Manifest Suara Resmi PLN Gadis Neural Studio (Pre-rendered, 0ms Delay, 100% Konsisten) */
const GADIS_MANIFEST = {
  "Selamat datang di P T P L N Persero Pusharlis. Saya P L N ners, asisten virtual Anda. Dengan senang hati, saya siap memandu Bapak dan Ibu dalam proses pengisian formulir registrasi kunjungan. Silakan tekan tombol Mulai Panduan untuk bimbingan langkah demi langkah.": "4bb513dcf93e070d005849552a7b385c.mp3",
  "Selamat datang, Bapak dan Ibu Petugas. Saya P L N ners. Anda dapat memantau data tamu, melakukan check in dan check out, serta mengunduh laporan ke Excel.": "8dc9178ed83d55574ca94f059436468f.mp3",
  "Langkah pertama. Silakan tekan tombol Ambil Foto, arahkan pandangan wajah ke kamera, kemudian tekan Ambil Foto kembali untuk menyimpan potret.": "be9e5eada3f06f3a5b0dab8381293ff4.mp3",
  "Silakan tekan tombol Ambil Foto, arahkan pandangan wajah ke kamera, kemudian tekan Ambil Foto kembali untuk menyimpan potret.": "53438735eb5a7c353897603752abd0c6.mp3",
  "Langkah kedua. Mohon ketikkan nama lengkap Anda sesuai dengan kartu identitas resmi.": "e05a45fa9c22b8be2d8556b921f5f89f.mp3",
  "Mohon ketikkan nama lengkap Anda sesuai dengan kartu identitas resmi.": "73e947c5949158c8f97e5df33f384eb7.mp3",
  "Langkah ketiga. Silakan masukkan nama instansi atau perusahaan yang Anda wakili.": "b54758bd1f44060006daa0e40b853877.mp3",
  "Silakan masukkan nama instansi atau perusahaan yang Anda wakili.": "af1b804c4631e5c9b5231f8386b9cc5f.mp3",
  "Langkah keempat. Mohon isi alamat lengkap kantor atau domisili instansi Anda.": "65bbea03fc8a5f0a0ef450d01631798d.mp3",
  "Mohon isi alamat lengkap kantor atau domisili instansi Anda.": "7caa609df82db5a4bcefa9d40a010c5c.mp3",
  "Langkah kelima. Silakan tuliskan nama pejabat atau pegawai P L N yang hendak Anda temui.": "53ddb5359f2f3049ec4f071586d9d1c1.mp3",
  "Silakan tuliskan nama pejabat atau pegawai P L N yang hendak Anda temui.": "db8e05cfd2e7579621153f077c7f6c8f.mp3",
  "Langkah keenam. Demi keselamatan bersama, mohon pilih perlengkapan alat pelindung diri yang Anda kenakan. Jika tidak membawa, silakan pilih Tidak Memakai A P D.": "4acf4387f266eba5c1f9d2d580b70a1e.mp3",
  "Demi keselamatan bersama, mohon pilih perlengkapan alat pelindung diri yang Anda kenakan. Jika tidak membawa, silakan pilih Tidak Memakai A P D.": "257d1cb3195354a8579de83206da3762.mp3",
  "Langkah ketujuh. Mohon jelaskan secara singkat keperluan kunjungan kerja Anda hari ini.": "f11f0d9fea48fdd1987a2a049880dd5f.mp3",
  "Mohon jelaskan secara singkat keperluan kunjungan kerja Anda hari ini.": "1f79676928f08a684f9f2f4bd1f7ed1a.mp3",
  "Langkah kedelapan. Silakan masukkan enam belas digit nomor induk kependudukan K T P, atau nomor S I M maupun paspor Anda.": "66d2b3f4e9cf961d4432c4f9aff83388.mp3",
  "Silakan masukkan enam belas digit nomor induk kependudukan K T P, atau nomor S I M maupun paspor Anda.": "1f1cf4b8c996060413257d2fb5d96aec.mp3",
  "Langkah kesembilan. Mohon cantumkan jenis kendaraan beserta nomor polisi yang Anda gunakan.": "3e0d917d373d9e28caa35b2ac10d6719.mp3",
  "Mohon cantumkan jenis kendaraan beserta nomor polisi yang Anda gunakan.": "464bf4f0c8f9649ba3ed0cd5abf44a86.mp3",
  "Langkah kesepuluh. Silakan masukkan nomor kartu tanda pengenal tamu yang telah diberikan oleh petugas keamanan di pos.": "d5386f0580562c4f67aa4daa58e06db1.mp3",
  "Silakan masukkan nomor kartu tanda pengenal tamu yang telah diberikan oleh petugas keamanan di pos.": "acca2405cb516f329e431368d3e99710.mp3",
  "Langkah kesebelas. Silakan tentukan total jumlah tamu yang hadir dalam kunjungan Anda.": "761883da3c6bfb40512898eef2e2ab74.mp3",
  "Silakan tentukan total jumlah tamu yang hadir dalam kunjungan Anda.": "19cc1373523948ecec65a79e8a59f775.mp3",
  "Langkah kedua belas. Mohon cermati peraturan Keselamatan dan Keamanan Kerja pada poster di atas, kemudian beri tanda centang persetujuan sebagai komitmen keselamatan bersama.": "b69d1c7f018906a81c8b9a889b95b26f.mp3",
  "Mohon cermati peraturan Keselamatan dan Keamanan Kerja pada poster di atas, kemudian beri tanda centang persetujuan sebagai komitmen keselamatan bersama.": "3592cc8418492b37b88360b9d7fae83a.mp3",
  "Langkah terakhir. Seluruh data registrasi telah lengkap. Silakan tekan tombol Kirim Registrasi untuk menyelesaikan pendaftaran kunjungan Anda.": "f0ff52f9101a0354546343700a6748f6.mp3",
  "Seluruh data registrasi telah lengkap. Silakan tekan tombol Kirim Registrasi untuk menyelesaikan pendaftaran kunjungan Anda.": "3b1ec3d9843c4cc1386e9357ff86878f.mp3",
  "Apakah Bapak dan Ibu membutuhkan bantuan dalam pengisian formulir? Silakan ketuk saya untuk panduan langkah demi langkah.": "675acf4446b2a70eedb90896f335b737.mp3",
  "Sama-sama! Dengan senang hati saya siap melayani Bapak dan Ibu.": "385434a43d20defc18ac3fcf1f3ca5e4.mp3",
  "Silakan masukkan username dan password petugas admin.": "47f95fd00825f276b8c12c4e7bacc2af.mp3",
  "Login berhasil. Selamat datang, Administrator P L N.": "68e2cc16c9598bc8099b895157bdd55e.mp3",
  "Maaf, username atau password yang Anda masukkan salah.": "868ccfb6f2843f50a9a2576c082e3a2d.mp3",
  "Admin telah keluar. Mode formulir pendaftaran tamu kembali aktif.": "25092375d531ba5235a081fef31065ab.mp3",
  "Akses ditolak. Silakan login sebagai petugas admin terlebih dahulu.": "d59b0578908a8f85c6331c6af7b801ae.mp3",
  "Di menu Dashboard, tekan tombol Check In saat tamu tiba di lokasi. Saat tamu hendak pulang, tekan tombol Check Out pada baris tamu tersebut.": "b516e779a3b15ff4b3db9d7ff7eb3498.mp3",
  "Tekan tombol Export to Excel. File Excel akan langsung terunduh otomatis ke komputer Anda, dan nomor K T P sudah rapi dalam format teks enam belas digit.": "292d73ee467cdf53b6c291830ea0364d.mp3",
  "Gunakan filter Tanggal Awal dan Tanggal Akhir untuk menentukan rentang waktu, atau ketik nama tamu pada kolom pencarian.": "7df0a19691ca0e3582514feabf5814d6.mp3",
  "Safety and Security Induction P T P L N Pusharlis memuat 8 peraturan keselamatan dan keamanan kerja, termasuk kewajiban mematuhi K 3, mengenakan ID Card, larangan merokok dan narkoba, serta petunjuk evakuasi darurat.": "75a87bc4ce3bcdf24c9918e4f276e49b.mp3",
  "K 3 L H adalah Keselamatan, Kesehatan Kerja, dan Lingkungan Hidup. Di seluruh area kerja P L N Pusharlis, setiap orang wajib mematuhi protokol K 3 dan mengenakan A P D: safety helmet, rompi reflektif, safety shoes, serta kartu tanda pengenal.": "be780a5a0c157b6ff5fb5d0e0bdd6f31.mp3",
  "Isi enam belas digit angka N I K K T P Anda. Bila tidak membawa K T P fisik, Anda dapat memasukkan nomor S I M dua belas digit atau nomor paspor.": "2a5cc477f3ca57985f027efa4a098855.mp3",
  "Centang perlengkapan A P D yang Anda gunakan: safety helmet, safety shoes, rompi reflektif, atau seragam kerja.": "2b166c12c3b4f94a4bcab5de1069e69c.mp3",
  "Tuliskan jenis kendaraan beserta nomor plat polisinya, contoh: Avanza B 1234 CD.": "7d7d37b0b174c6bc89203b0d6fa12370.mp3",
  "Nomor name tag tamu tertera pada kartu fisik yang diserahkan oleh petugas pengamanan di pos gerbang masuk.": "9cabd5282b7e8b5314c44522e59cdea8.mp3",
  "Tekan tombol Ambil Foto untuk mengaktifkan kamera depan, lalu tekan tombol Ambil Foto untuk menangkap potret wajah.": "193cfbc4a51aee17ccb75106ca008408.mp3",
  "Tentukan total tamu yang ikut serta dalam kunjungan, termasuk diri Anda sendiri.": "8763dfb58a3f1a83a99f8b805132da83.mp3",
  "Pastikan seluruh kolom bertanda bintang telah terisi, kemudian tekan Kirim Registrasi.": "f97d3b41c69a16442e59d8a644c1edbf.mp3",
  "Selamat datang di P T P L N Persero Pusharlis. Saya P L N ners, asisten virtual Anda. Apakah ada yang dapat saya bantu terkait pendaftaran kunjungan Bapak dan Ibu?": "9c2278a9896674605ffc3181beca70a7.mp3",
  "Maaf, saya belum memahami pertanyaan tersebut. Anda dapat bertanya seputar K T P, A P D, kendaraan, name tag, atau tekan tombol Mulai panduan.": "243024a389e2d5965ff0ecb496454c90.mp3"
};

/**
 * Penghenti audio universal:
 * Memastikan tidak ada dua suara yang saling bertumpuk.
 */
function stopAllAudio() {
  if (activeTtsAbort) {
    try { activeTtsAbort.abort(); } catch (e) {}
    activeTtsAbort = null;
  }

  speechSequence++;

  if (currentAudioPlayer) {
    try {
      currentAudioPlayer.onended = null;
      currentAudioPlayer.onerror = null;
      currentAudioPlayer.onplay  = null;
      currentAudioPlayer.pause();
      currentAudioPlayer.src = '';
    } catch (e) {}
    currentAudioPlayer = null;
  }

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}
  }

  speaking = false;
}

function initVoice() {
  loadVoices();
  if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  // Pre-load audio sambutan agar instan saat pertama diklik
  try {
    const pre = new Audio();
    pre.preload = 'auto';
    pre.src = 'audio/tts/4bb513dcf93e070d005849552a7b385c.mp3';
  } catch (e) {}

  // Tombol Toggle Suara Aktif/Mati
  const btnSpk = $('#spk');
  if (btnSpk) {
    btnSpk.onclick = () => {
      voiceOn = !voiceOn;
      if (!voiceOn) {
        stopAllAudio();
      }
      btnSpk.textContent = voiceOn ? '🔊 Aktif' : '🔇 Mati';
    };
  }

  // Pengaturan Suara Drawer
  const btnVcfg = $('#vcfg');
  if (btnVcfg) {
    btnVcfg.onclick = (e) => {
      e.stopPropagation();
      $('#voice-settings').classList.toggle('hide');
      updateVoiceTabs();
    };
  }

  const btnVclose = $('#vclose');
  if (btnVclose) {
    btnVclose.onclick = () => {
      $('#voice-settings').classList.add('hide');
    };
  }

  // Tab 1: Online TTS Wanita Indonesia (Gadis Neural - Default Rekomendasi Resmi)
  const tabOnline = $('#tab-vonline');
  if (tabOnline) {
    tabOnline.onclick = () => {
      stopAllAudio();
      voiceMode = 'online';
      store.set('vms-voice-mode', voiceMode);
      if (typeof setAppLanguage === 'function') {
        setAppLanguage('id', false);
      } else {
        if (typeof store !== 'undefined') store.set('vms-lang', 'id');
        if (typeof currentLang !== 'undefined') currentLang = 'id';
      }
      updateVoiceTabs();
      say('Mode suara wanita Indonesia Gadis Neural aktif.');
    };
  }

  const btnTestOnline = $('#btn-test-online');
  if (btnTestOnline) {
    btnTestOnline.onclick = () => {
      stopAllAudio();
      speakWithGadisTTS('Selamat datang di PT PLN (Persero) Pusharlis. Saya E.V.A, asisten virtual Anda.');
    };
  }

  // Tab 2: EasyVoice AI Studio
  const tabEasy = $('#tab-veasyvoice');
  if (tabEasy) {
    tabEasy.onclick = () => {
      stopAllAudio();
      voiceMode = 'easyvoice';
      store.set('vms-voice-mode', voiceMode);
      if (typeof setAppLanguage === 'function') {
        setAppLanguage('en', false);
      } else {
        if (typeof store !== 'undefined') store.set('vms-lang', 'en');
        if (typeof currentLang !== 'undefined') currentLang = 'en';
      }
      updateVoiceTabs();
      say('EasyVoice AI English voice mode activated. I am E.V.A, ready to guide visitors in English.');
    };
  }

  // Tab 3: Browser TTS
  const tabBrowser = $('#tab-vbrowser');
  if (tabBrowser) {
    tabBrowser.onclick = () => {
      stopAllAudio();
      voiceMode = 'browser';
      store.set('vms-voice-mode', voiceMode);
      updateVoiceTabs();
      say('Mode suara browser diaktifkan.');
    };
  }

  // Tab 4: ElevenLabs
  const tabEleven = $('#tab-veleven');
  if (tabEleven) {
    tabEleven.onclick = () => {
      stopAllAudio();
      voiceMode = 'elevenlabs';
      store.set('vms-voice-mode', voiceMode);
      updateVoiceTabs();
      say('Mode suara ElevenLabs diaktifkan.');
    };
  }

  // Pengaturan Form EasyVoice AI
  if (!easyVoiceKey || easyVoiceKey.length < 60 || (easyVoiceKey.startsWith('ev_a8dd782c') && easyVoiceKey.length < 67)) {
    easyVoiceKey = (typeof OFFICIAL_EASYVOICE_KEY !== 'undefined') ? OFFICIAL_EASYVOICE_KEY : 'ev_a8dd782ce24e59571a03d3cbda4039cd73c68d9a0013647a9d295a6e7cc87e16';
    store.set('vms-ev-key', easyVoiceKey);
  }
  if ($('#ev-api-key')) $('#ev-api-key').value = easyVoiceKey;
  if ($('#ev-voice-select')) $('#ev-voice-select').value = easyVoiceVoice;

  const btnSaveEasy = $('#btn-save-easyvoice');
  if (btnSaveEasy) {
    btnSaveEasy.onclick = () => {
      const inputKey = $('#ev-api-key');
      const selectVoice = $('#ev-voice-select');
      const statusEl = $('#ev-status');

      if (inputKey) {
        let val = inputKey.value.trim();
        if (!val || val.length < 60 || (val.startsWith('ev_a8dd782c') && val.length < 67)) {
          val = (typeof OFFICIAL_EASYVOICE_KEY !== 'undefined') ? OFFICIAL_EASYVOICE_KEY : 'ev_a8dd782ce24e59571a03d3cbda4039cd73c68d9a0013647a9d295a6e7cc87e16';
          inputKey.value = val;
        }
        easyVoiceKey = val;
      }
      if (selectVoice) easyVoiceVoice = selectVoice.value;

      store.set('vms-ev-key', easyVoiceKey);
      store.set('vms-ev-voice', easyVoiceVoice);

      if (statusEl) {
        statusEl.textContent = '⏳ Menguji koneksi ke EasyVoice...';
        statusEl.style.color = 'var(--acc)';
      }

      speakWithEasyVoice('Hello! EasyVoice API Key saved successfully. E.V.A is ready to assist visitors in English.').then((ok) => {
        if (statusEl) {
          if (ok) {
            statusEl.textContent = '✅ Berhasil terhubung! Suara AI EasyVoice (Kokoro-82m English) aktif.';
            statusEl.style.color = '#2ecc71';
          } else {
            statusEl.textContent = '⚠️ Gagal terhubung ke API EasyVoice. Sistem beralih ke suara default.';
            statusEl.style.color = '#f39c12';
          }
        }
      });
    };
  }

  const btnTestEasy = $('#btn-test-easyvoice');
  if (btnTestEasy) {
    btnTestEasy.onclick = () => {
      const statusEl = $('#ev-status');
      if (statusEl) {
        statusEl.textContent = '⏳ Menguji pemutaran audio EasyVoice English...';
        statusEl.style.color = 'var(--acc)';
      }
      stopAllAudio();
      speakWithEasyVoice('Welcome to PT PLN Pusharlis. I am E.V.A, your virtual assistant. How may I assist your visit today?').then((ok) => {
        if (statusEl) {
          if (ok) {
            statusEl.textContent = '✅ Suara EasyVoice AI (English) berhasil diputar.';
            statusEl.style.color = '#2ecc71';
          } else {
            statusEl.textContent = '⚠️ Gagal memutar EasyVoice. Menggunakan suara cadangan.';
            statusEl.style.color = '#f39c12';
          }
        }
      });
    };
  }

  // Pengaturan Browser TTS
  const voiceSelect = $('#voice-select');
  if (voiceSelect) {
    voiceSelect.onchange = (e) => {
      userVoiceIndex = parseInt(e.target.value, 10);
      store.set('vms-voice-idx', userVoiceIndex);
      stopAllAudio();
      clearTimeout(voiceSelectDebounce);
      voiceSelectDebounce = setTimeout(() => {
        const v = voices[userVoiceIndex];
        if (v) {
          speakWithBrowser(`Suara asisten diubah ke ${v.name}.`);
        }
      }, 400);
    };
  }

  const voiceRate = $('#voice-rate');
  if (voiceRate) {
    voiceRate.value = userVoiceRate;
    if ($('#rate-val')) $('#rate-val').textContent = userVoiceRate.toFixed(1) + 'x';
    voiceRate.oninput = (e) => {
      userVoiceRate = parseFloat(e.target.value);
      if ($('#rate-val')) $('#rate-val').textContent = userVoiceRate.toFixed(1) + 'x';
      store.set('vms-voice-rate', userVoiceRate);
    };
  }

  const btnTestVoice = $('#btn-test-voice');
  if (btnTestVoice) {
    btnTestVoice.onclick = () => {
      stopAllAudio();
      speakWithBrowser('Selamat datang di PT PLN (Persero) Pusharlis. Ini adalah contoh suara browser.');
    };
  }

  // ElevenLabs Form
  if ($('#el-api-key'))  $('#el-api-key').value  = elevenApiKey;
  if ($('#el-voice-id')) $('#el-voice-id').value = elevenVoiceId;

  const btnSaveEleven = $('#btn-save-eleven');
  if (btnSaveEleven) {
    btnSaveEleven.onclick = () => {
      elevenApiKey  = $('#el-api-key').value.trim();
      elevenVoiceId = $('#el-voice-id').value.trim();
      store.set('vms-el-key', elevenApiKey);
      store.set('vms-el-vid', elevenVoiceId);

      const statusEl = $('#el-status');
      if (!elevenApiKey || !elevenVoiceId) {
        statusEl.textContent = '⚠️ Mohon isi API Key dan Voice ID Anda.';
        statusEl.style.color = '#e74c3c';
        return;
      }

      statusEl.textContent = '⏳ Menghubungkan ke ElevenLabs...';
      statusEl.style.color = 'var(--acc)';

      speakWithElevenLabs('Halo! Pengaturan ElevenLabs berhasil tersimpan.').then((ok) => {
        if (ok) {
          statusEl.textContent = '✅ Berhasil terhubung! Suara ElevenLabs aktif.';
          statusEl.style.color = '#2ecc71';
        } else {
          statusEl.textContent = '❌ Gagal. Periksa kembali API Key dan Voice ID Anda.';
          statusEl.style.color = '#e74c3c';
        }
      });
    };
  }

  const btnTestEleven = $('#btn-test-eleven');
  if (btnTestEleven) {
    btnTestEleven.onclick = () => {
      if (btnSaveEleven) btnSaveEleven.click();
    };
  }

  // Putar File Rekaman Pribadi (my-voice.mp3)
  const btnPlayMp3 = $('#btn-play-mp3');
  if (btnPlayMp3) {
    btnPlayMp3.onclick = () => {
      stopAllAudio();
      const audio = new Audio('audio/my-voice.mp3');
      currentAudioPlayer = audio;

      audio.onplay = () => {
        speaking = true;
        showBubble('Halo, Bu. Ini aku. Ibu lagi sibuk enggak? Aku telepon sebentar aja...');
      };
      audio.onended = () => { speaking = false; };
      audio.onerror = () => {
        speaking = false;
        alert('File audio/my-voice.mp3 tidak dapat diputar. Pastikan file berada di folder audio.');
      };

      audio.play().catch(() => { speaking = false; });
      addMsg('Halo, Bu. Ini aku. Ibu lagi sibuk enggak? Aku telepon sebentar aja. Soalnya tadi Ibu bilang meteran listrik di rumah bunyi terus, kan?', 'b');
    };
  }

  updateVoiceTabs();

  // Membuka izin audio browser setelah interaksi pertama pengguna
  const unlockAudio = () => {
    audioUnlocked = true;
    getBuddyAudioContext();
    if ('speechSynthesis' in window && speechSynthesis.paused) {
      speechSynthesis.resume();
    }
    if (pendingSpeech) {
      const p = pendingSpeech;
      pendingSpeech = null;
      speak(p);
    }
  };

  ['pointerdown', 'keydown', 'touchstart', 'click'].forEach((ev) => {
    window.addEventListener(ev, () => {
      if (typeof lastActivity !== 'undefined') lastActivity = Date.now();
      if (typeof idleNotified !== 'undefined') idleNotified = false;
      unlockAudio();
    }, { passive: true });
  });
}

function loadVoices() {
  try {
    if ('speechSynthesis' in window) {
      voices = speechSynthesis.getVoices() || [];
      populateVoiceSelect();
    }
  } catch (e) {}
}

/**
 * Normalisasi teks untuk artikulasi pengucapan agar natural & fasih
 */
function cleanSpeechText(text) {
  if (!text) return '';
  return text
    .replace(/\bE\.V\.A\b/gi, 'Eva')
    .replace(/\bEVA\b/g, 'Eva')
    .replace(/\bPT\b/g, 'P T')
    .replace(/\(Persero\)/gi, 'Persero')
    .replace(/\bPLN\b/g, 'P L N')
    .replace(/\bPUSHARLIS\b/gi, 'Pusharlis')
    .replace(/\bUP2WVI\b/gi, 'U P 2 W enam')
    .replace(/\bK3LH\b/gi, 'K 3 L H')
    .replace(/\bK3\b/gi, 'K 3')
    .replace(/\bAPD\b/g, 'A P D')
    .replace(/\bKTP\b/g, 'K T P')
    .replace(/\bSIM\b/g, 'S I M')
    .replace(/\bNIK\b/g, 'N I K')
    .replace(/\bNo\.Pol\b/gi, 'Nomor Polisi')
    .replace(/\bNo\.\s*/gi, 'Nomor ')
    .replace(/Ctrl\s*V/gi, 'Control V')
    .replace(/16\s*digit/gi, 'enam belas digit')
    .replace(/12\s*digit/gi, 'dua belas digit')
    .replace(/1\s*[-–—]\s*99/g, 'satu sampai sembilan puluh sembilan')
    .replace(/([.!?])\s*/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pemilihan suara wanita alami terbaik untuk Safety Buddy (Khusus Mode Browser)
 */
function pickVoice(preferredLang) {
  if (userVoiceIndex >= 0 && voices[userVoiceIndex]) {
    return voices[userVoiceIndex];
  }

  const isMaleName = (name = '') => /ardi|andika|david|mark|male|pria|laki/i.test(name);
  const targetLang = preferredLang || ((typeof currentLang !== 'undefined' && currentLang === 'en') || voiceMode === 'easyvoice' ? 'en' : 'id');

  if (targetLang === 'en') {
    const enVoices = voices.filter(v => /^en([-_]|$)/i.test(v.lang));
    const femaleEn = enVoices.find(v => /jenny|aria|zira|samantha|victoria|karen|female/i.test(v.name) && !isMaleName(v.name));
    if (femaleEn) return femaleEn;
    const anyFemaleEn = enVoices.find(v => !isMaleName(v.name));
    if (anyFemaleEn) return anyFemaleEn;
    if (enVoices.length > 0) return enVoices[0];
  }

  const idVoices = voices.filter(v => /^id([-_]|$)/i.test(v.lang));

  // 1. Suara wanita Indonesia Neural diutamakan
  const femaleId = idVoices.find(v => /gadis|siti|reza|hana|yasmin/i.test(v.name) || /female|wanita/i.test(v.name));
  if (femaleId) return femaleId;

  // 2. Suara Indonesia Natural/Online (Edge / Chrome)
  const naturalId = idVoices.find(v => /natural|online/i.test(v.name) && !isMaleName(v.name));
  if (naturalId) return naturalId;

  // 3. Suara Indonesia pertama yang tersedia
  if (idVoices.length > 0) return idVoices[0];

  // 4. Cadangan serumpun Melayu wanita
  const msFemale = voices.find(v => /^ms([-_]|$)/i.test(v.lang) && !isMaleName(v.name));
  if (msFemale) return msFemale;

  return null;
}

function populateVoiceSelect() {
  const sel = $('#voice-select');
  if (!sel || !voices.length) return;

  const currentVoice = pickVoice();
  sel.innerHTML = voices.map((v, i) => {
    let label = v.name;
    const isId = /^id([-_]|$)/i.test(v.lang);
    const isGadis = /gadis|siti|reza|hana/i.test(v.name);
    const isNatural = /natural|online/i.test(v.name);

    if (isGadis) label = `⭐ ${v.name} (Wanita Natural - Rekomendasi)`;
    else if (isId && isNatural) label = `✨ ${v.name} (Indonesia Natural)`;
    else if (isId) label = `🇮🇩 ${v.name}`;

    return `<option value="${i}">${label}</option>`;
  }).join('');

  if (currentVoice) {
    const idx = voices.indexOf(currentVoice);
    if (idx >= 0) sel.value = idx;
  }

  const hasFemaleId = voices.some(v => /^id([-_]|$)/i.test(v.lang) && /gadis|siti|reza|hana|female|wanita/i.test(v.name));
  const tipEl = $('#voice-tip');
  if (tipEl) {
    if (hasFemaleId) {
      tipEl.innerHTML = '✅ <b>Suara Wanita Indonesia Natural aktif!</b> E.V.A siap menyambut tamu dengan ramah.';
      tipEl.style.background = 'rgba(46, 204, 113, 0.15)';
      tipEl.style.color = 'var(--text)';
    } else {
      tipEl.innerHTML = '💡 <b>Tips Suara:</b> Mode bawaan menggunakan <b>Gadis Neural Studio (96kbps)</b> yang jernih, sopan, dan konsisten di semua perangkat.';
      tipEl.style.background = 'rgba(27, 99, 120, 0.1)';
      tipEl.style.color = 'var(--muted)';
    }
  }
}

function updateVoiceTabs() {
  const isOnline  = (voiceMode === 'online');
  const isBrowser = (voiceMode === 'browser');
  const isEasy    = (voiceMode === 'easyvoice');
  const isEleven  = (voiceMode === 'elevenlabs');

  if ($('#tab-vonline'))    $('#tab-vonline').className    = isOnline ? 'btn sm' : 'btn sm ghost';
  if ($('#tab-vbrowser'))   $('#tab-vbrowser').className   = isBrowser ? 'btn sm' : 'btn sm ghost';
  if ($('#tab-veasyvoice')) $('#tab-veasyvoice').className = isEasy ? 'btn sm' : 'btn sm ghost';
  if ($('#tab-veleven'))    $('#tab-veleven').className    = isEleven ? 'btn sm' : 'btn sm ghost';

  if ($('#sec-vonline'))    $('#sec-vonline').classList.toggle('hide', !isOnline);
  if ($('#sec-vbrowser'))   $('#sec-vbrowser').classList.toggle('hide', !isBrowser);
  if ($('#sec-veasyvoice')) $('#sec-veasyvoice').classList.toggle('hide', !isEasy);
  if ($('#sec-veleven'))    $('#sec-veleven').classList.toggle('hide', !isEleven);

  const badge = $('#admin-voice-badge');
  if (badge) {
    if (isOnline) {
      badge.textContent = 'Aktif: 🎙️ Gadis Neural Studio (0ms Pre-cached)';
      badge.style.background = '#27ae60';
    } else if (isBrowser) {
      badge.textContent = 'Aktif: 🔊 Browser WebSpeech';
      badge.style.background = '#2980b9';
    } else if (isEasy) {
      badge.textContent = 'Aktif: 🤖 EasyVoice AI (English Voice)';
      badge.style.background = '#e67e22';
    } else if (isEleven) {
      badge.textContent = 'Aktif: ⚡ ElevenLabs AI';
      badge.style.background = '#8e44ad';
    }
  }
}

/* SINTESIS SUARA ONLINE WANITA INDONESIA GOOGLE (CADANGAN DARURAT) */
function splitIntoSentences(text, maxLen = 160) {
  if (text.length <= maxLen) return [text];
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
  const parts = [];
  let current = '';

  for (const s of sentences) {
    if ((current + ' ' + s).trim().length <= maxLen) {
      current = (current + ' ' + s).trim();
    } else {
      if (current) parts.push(current);
      if (s.length <= maxLen) {
        current = s.trim();
      } else {
        const words = s.split(' ');
        let temp = '';
        for (const w of words) {
          if ((temp + ' ' + w).trim().length <= maxLen) {
            temp = (temp + ' ' + w).trim();
          } else {
            if (temp) parts.push(temp);
            temp = w;
          }
        }
        current = temp;
      }
    }
  }
  if (current) parts.push(current);
  return parts;
}

function speakWithGoogleTTS(text) {
  const clean = cleanSpeechText(text);
  if (!clean) return false;

  playBuddyChime();

  if (currentAudioPlayer) {
    try { currentAudioPlayer.pause(); } catch (e) {}
    currentAudioPlayer = null;
  }

  const chunks = splitIntoSentences(clean);
  let index = 0;

  function playNext() {
    if (index >= chunks.length) {
      speaking = false;
      return;
    }

    const chunk = chunks[index++];
    const url = 'https://translate.google.com/translate_tts?ie=UTF-8&tl=id&client=tw-ob&q=' + encodeURIComponent(chunk);

    const audio = new Audio(url);
    currentAudioPlayer = audio;

    audio.onplay = () => {
      speaking = true;
    };
    audio.onended = () => {
      playNext();
    };
    audio.onerror = () => {
      speaking = false;
      speakWithBrowser(text);
    };

    audio.play().catch(() => {
      speaking = false;
      speakWithBrowser(text);
    });
  }

  playNext();
  return true;
}

/* SINTESIS SUARA GADIS NEURAL (WANITA INDONESIA ASLI, JERNIH & SANTUN) */
async function speakWithGadisTTS(text) {
  const clean = cleanSpeechText(text);
  if (!clean) return false;

  stopAllAudio();
  const mySeq = ++speechSequence;
  playBuddyChime();

  // 1. Prioritas Utama: File Audio Statis Pre-rendered (0ms delay, 100% konsisten)
  if (GADIS_MANIFEST[clean]) {
    const staticUrl = 'audio/tts/' + GADIS_MANIFEST[clean];
    if (mySeq === speechSequence) {
      playCachedAudio(staticUrl);
    }
    return true;
  }

  // 2. Cek memori audioCache lokal
  const cacheKey = 'gadis_v4_studio_' + clean;
  if (audioCache.has(cacheKey)) {
    if (mySeq === speechSequence) {
      playCachedAudio(audioCache.get(cacheKey));
    }
    return true;
  }

  // 3. Panggil endpoint server /api/tts (Dynamic msedge-tts + Disk Cache)
  if (location.protocol.startsWith('http')) {
    try {
      activeTtsAbort = new AbortController();
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine: 'gadis', text: clean }),
        signal: activeTtsAbort.signal
      });
      activeTtsAbort = null;

      if (mySeq !== speechSequence) return false;

      if (res.ok) {
        const blob = await res.blob();
        if (mySeq !== speechSequence) return false;

        const url = URL.createObjectURL(blob);
        audioCache.set(cacheKey, url);
        if (mySeq === speechSequence) {
          playCachedAudio(url);
        }
        return true;
      }
    } catch (e) {
      if (e.name === 'AbortError') return false;
      console.warn('[Gadis TTS API Warn]:', e);
    }
  }

  if (mySeq !== speechSequence) return false;

  // Cadangan: Hanya jika ada suara Indonesia resmi di browser
  if (hasNativeIndonesianVoice()) {
    speakWithBrowser(text);
    return true;
  }

  // Cadangan Terakhir
  return speakWithGoogleTTS(text);
}

/* =====================================================================
   TERJEMAHAN SUARA BAHASA INGGRIS (EASYVOICE AI KOKORO-82M)
   Mengonversi teks panduan E.V.A ke bahasa Inggris alami & fasih
   ===================================================================== */
const EN_SPEECH_MAP = {
  // 1. Panduan Langkah Formulir (Guide Steps)
  'Silakan tekan tombol Ambil Foto, arahkan pandangan wajah ke kamera, kemudian tekan Ambil Foto kembali untuk menyimpan potret.':
    'Please click the Take Photo button, look directly at the camera, then click Capture to save your photo.',
  'Mohon ketikkan nama lengkap Anda sesuai dengan kartu identitas resmi.':
    'Please enter your full name as shown on your official identification.',
  'Silakan masukkan enam belas digit nomor induk kependudukan KTP, atau nomor SIM maupun paspor Anda.':
    'Please enter your sixteen-digit National ID number, driver license, or passport number.',
  'Silakan masukkan nama instansi atau perusahaan yang Anda wakili.':
    'Please enter the company or institution you represent.',
  'Mohon isi alamat lengkap kantor atau domisili instansi Anda.':
    'Please provide the full address of your company or institution.',
  'Silakan masukkan nomor telepon atau WhatsApp aktif yang dapat dihubungi.':
    'Please enter an active phone or WhatsApp number where you can be reached.',
  'Silakan cantumkan alamat email Anda jika ada, atau lewati jika tidak memiliki email.':
    'Please enter your email address if available, or skip if you do not have one.',
  'Silakan tuliskan nama pejabat atau pegawai PLN yang hendak Anda temui.':
    'Please enter the name of the PLN personnel or division you wish to visit.',
  'Mohon pilih atau ketikkan tujuan kedatangan Anda, seperti rapat, kunjungan kerja, atau pengiriman barang.':
    'Please select or enter the purpose of your visit, such as a meeting, official visit, or delivery.',
  'Demi keselamatan bersama, mohon pilih perlengkapan alat pelindung diri yang Anda kenakan. Jika tidak membawa, silakan pilih Tidak Memakai APD.':
    'For safety compliance, please select the Personal Protective Equipment you are wearing. If none, select No PPE.',
  'Mohon cantumkan jenis kendaraan beserta nomor polisi yang Anda gunakan.':
    'Please specify your vehicle type and license plate number.',
  'Silakan masukkan nomor kartu tanda pengenal tamu yang telah diberikan oleh petugas keamanan di pos.':
    'Please enter the visitor badge number provided by security.',
  'Silakan tentukan total jumlah tamu yang hadir dalam kunjungan Anda.':
    'Please select the total number of visitors in your party.',
  'Mohon cermati peraturan Keselamatan dan Keamanan Kerja pada poster di atas, kemudian beri tanda centang persetujuan sebagai komitmen keselamatan bersama.':
    'Please review the workplace Safety and Security Induction above and check the agreement box.',
  'Seluruh data registrasi telah lengkap. Silakan tekan tombol Kirim Registrasi untuk menyelesaikan pendaftaran kunjungan Anda.':
    'All details have been completed. Please click Submit Registration to finish your visitor registration.',

  // 2. Sambutan Asisten & FAQ
  'Selamat datang di PT PLN (Persero) Pusharlis. Saya E.V.A, asisten virtual Anda. Apakah ada yang dapat saya bantu terkait pendaftaran kunjungan Bapak dan Ibu?':
    'Welcome to PT PLN Pusharlis. I am E.V.A, your virtual assistant. How may I assist your visit registration today?',
  'Selamat datang di PT PLN (Persero) Pusharlis. Saya E.V.A, asisten virtual Anda. Dengan senang hati, saya siap memandu Bapak dan Ibu dalam proses pengisian formulir registrasi kunjungan. Silakan tekan tombol Mulai Panduan untuk bimbingan langkah demi langkah.':
    'Welcome to PT PLN Pusharlis. I am E.V.A, your virtual assistant. I am delighted to guide you through the registration process. Please click Start Guide for step-by-step assistance.',
  'Selamat datang, Bapak dan Ibu Petugas. Saya E.V.A. Anda dapat memantau data tamu, melakukan check in dan check out, serta mengunduh laporan ke Excel.':
    'Welcome, officers. I am E.V.A. You can monitor visitor logs, check in and check out guests, and download reports to Excel.',
  'Apakah Bapak dan Ibu membutuhkan bantuan dalam pengisian formulir? Silakan ketuk saya untuk panduan langkah demi langkah.':
    'Do you need assistance filling out the form? Tap on me for step-by-step guidance.',
  'Sama-sama! Dengan senang hati saya siap melayani Bapak dan Ibu.':
    'You are very welcome! It is my pleasure to assist you.',

  // 3. Foto & Kamera
  'Hadapkan wajah Anda ke arah kamera dengan jelas, lalu tekan tombol Ambil Foto.':
    'Please position your face clearly in front of the camera, then click the Take Photo button.',
  'Foto berhasil diambil. Silakan lanjutkan mengisi nama tamu.':
    'Photo captured successfully. Please proceed with entering your full name.',
  'Foto belum diambil. Anda dapat mencobanya kembali kapan saja.':
    'Photo was not captured. You may try again anytime.',
  'Foto belum dipilih. Anda dapat mencobanya kembali kapan saja.':
    'No photo selected. You can take or choose a photo anytime.',
  'Berkas yang dipilih bukan gambar. Mohon pilih foto.':
    'The selected file is not an image. Please choose a valid photo.',
  'Foto gagal dimuat. Mohon pilih foto lain.':
    'Failed to load photo. Please choose another image.',
  'Kamera tidak tersedia di perangkat ini. Silakan pilih foto dari galeri.':
    'Camera is not available on this device. Please select a photo from your gallery.',
  'Kamera tidak dapat diakses. Pastikan izin kamera aktif, atau pilih foto dari berkas galeri.':
    'Cannot access camera. Please allow camera permissions, or upload from your gallery.',
  'Kamera belum siap, mohon tunggu sebentar.':
    'Camera is still initializing, please wait a moment.',

  // 4. APD & Safety Induction
  'APD lengkap, sangat bagus! Terima kasih telah mengutamakan keselamatan kerja.':
    'All safety equipment checked, excellent! Thank you for prioritizing workplace safety.',
  'Anda tidak memakai APD. Demi keselamatan kerja, silakan ambil dan kenakan APD di pos petugas keamanan.':
    'You are not wearing safety equipment. For your safety, please collect and wear PPE at the security checkpoint.',
  'Terima kasih telah membaca dan menyetujui Safety and Security Induction PLN Pusharlis.':
    'Thank you for reading and accepting the Safety and Security Induction of PLN Pusharlis.',

  // 5. Konfirmasi & Submit
  'Mohon periksa kembali kelengkapan data Anda. Jika sudah sesuai, tekan Konfirmasi.':
    'Please verify your registration details. If correct, press Confirm.',
  'Silakan periksa dan perbaiki data Anda jika diperlukan.':
    'Please review and adjust your information if needed.',
  'Mohon pilih APD yang Anda kenakan, atau centang Tidak memakai APD.':
    'Please select the PPE you are wearing, or check No PPE.',
  'Mohon baca dan centang persetujuan Safety and Security Induction terlebih dahulu.':
    'Please read and check the Safety and Security Induction agreement before submitting.',
  'Terima kasih. Semoga kunjungan Anda lancar. Jika ada tamu berikutnya, tekan tombol Isi Formulir Lagi.':
    'Thank you! We hope you have a productive visit. For the next visitor, please click Fill Form Again.',
  'Silakan isi formulir untuk tamu berikutnya. Tekan Mulai panduan jika membutuhkan arahan.':
    'Please fill out the form for the next visitor. Click Start Guide if you need directions.',

  // 6. Admin & Bantuan
  'Di menu Dashboard, tekan tombol Check In saat tamu tiba di lokasi. Saat tamu hendak pulang, tekan tombol Check Out pada baris tamu tersebut.':
    'In the Dashboard, click Check In when guests arrive. When guests depart, click Check Out on their row.',
  'Tekan tombol Export to Excel. File Excel akan langsung terunduh otomatis ke komputer Anda, dan nomor KTP sudah rapi dalam format teks 16 digit.':
    'Click Export to Excel. The spreadsheet file will automatically download with formatted ID numbers.',
  'Gunakan filter Tanggal Awal dan Tanggal Akhir untuk menentukan rentang waktu, atau ketik nama tamu pada kolom pencarian.':
    'Use the start and end date filters to set the time period, or type visitor names in the search box.',
  'File Excel berhasil diunduh. Silakan buka file tersebut untuk melihat data tamu.':
    'Excel file downloaded successfully. Please open the file to view visitor records.',
  'File Excel berhasil diunduh. Silakan buka file tersebut untuk melihat data.':
    'Excel file downloaded successfully. Please open the file to view records.',
  'Login berhasil. Selamat datang, Administrator PLN.':
    'Login successful. Welcome, PLN Administrator.',
  'Maaf, username atau password yang Anda masukkan salah.':
    'Sorry, the username or password entered is incorrect.',
  'Admin telah keluar. Mode formulir pendaftaran tamu kembali aktif.':
    'Administrator logged out. Visitor registration form is active.'
};

function translateToEnglish(text) {
  if (!text) return '';
  const trimmed = text.trim();
  if (EN_SPEECH_MAP[trimmed]) return EN_SPEECH_MAP[trimmed];

  // Format langkah panduan
  const mStep = trimmed.match(/^Langkah (pertama|kedua|ketiga|keempat|kelima|keenam|ketujuh|kedelapan|kesembilan|kesepuluh|kesebelas|kedua belas|ketiga belas|keempat belas|terakhir)\.\s*(.*)$/i);
  if (mStep) {
    const stepWords = {
      'pertama': 'Step one.', 'kedua': 'Step two.', 'ketiga': 'Step three.', 'keempat': 'Step four.',
      'kelima': 'Step five.', 'keenam': 'Step six.', 'ketujuh': 'Step seven.', 'kedelapan': 'Step eight.',
      'kesembilan': 'Step nine.', 'kesepuluh': 'Step ten.', 'kesebelas': 'Step eleven.',
      'kedua belas': 'Step twelve.', 'ketiga belas': 'Step thirteen.', 'keempat belas': 'Step fourteen.',
      'terakhir': 'Final step.'
    };
    const enPrefix = stepWords[mStep[1].toLowerCase()] || 'Next step.';
    const subText = mStep[2].trim();
    const enSub = EN_SPEECH_MAP[subText] || translateToEnglish(subText);
    return `${enPrefix} ${enSub}`;
  }

  // Notifikasi registrasi berhasil
  const mReg = trimmed.match(/Registrasi berhasil\. Terima kasih,?\s*([^.]+)\.\s*Silakan menuju petugas keamanan untuk mengambil kartu name tag(.*)/i);
  if (mReg) {
    const name = mReg[1].trim();
    return `Registration successful. Thank you, ${name}. Please proceed to the security post to pick up your visitor badge.`;
  }

  // Kolom belum lengkap
  const mEmpty = trimmed.match(/Mohon lengkapi kolom (.+?) terlebih dahulu\./i);
  if (mEmpty) {
    return `Please complete the ${mEmpty[1].trim()} field first.`;
  }

  // Status check in / check out
  const mIn = trimmed.match(/(.+) berhasil check in\. Silakan masuk\./i);
  if (mIn) {
    return `${mIn[1].trim()} has successfully checked in. Welcome!`;
  }
  const mOut = trimmed.match(/(.+) sudah check out\. Terima kasih atas kunjungannya\./i);
  if (mOut) {
    return `${mOut[1].trim()} has checked out. Thank you for your visit.`;
  }

  // Validasi digit KTP
  const mKtpLess = trimmed.match(/Nomor KTP kurang (\d+) digit\./i);
  if (mKtpLess) {
    return `National ID number is missing ${mKtpLess[1]} digits. A valid Indonesian ID must have 16 digits.`;
  }
  const mKtpMore = trimmed.match(/Nomor KTP kelebihan (\d+) digit\./i);
  if (mKtpMore) {
    return `National ID number has ${mKtpMore[1]} extra digits. A valid Indonesian ID must have 16 digits.`;
  }

  // Mode pengaktifan EasyVoice
  if (trimmed.includes('Mode suara EasyVoice AI')) {
    return 'EasyVoice AI English voice mode is now active. I am E.V.A, ready to assist international visitors in English.';
  }

  // Fallback salam bila menyapa
  if (/selamat datang/i.test(trimmed) && /pusharlis/i.test(trimmed)) {
    return 'Welcome to PT PLN Pusharlis. I am E.V.A, your virtual assistant. How may I assist your visit today?';
  }

  return trimmed;
}

function cleanEnglishSpeechText(text) {
  if (!text) return '';
  return text
    .replace(/\bPT\b/g, 'P T')
    .replace(/\bPLN\b/g, 'P L N')
    .replace(/\bPUSHARLIS\b/gi, 'Pusharlis')
    .replace(/\bUP2WVI\b/gi, 'U P 2 W six')
    .replace(/\bK3LH\b/gi, 'Occupational Safety')
    .replace(/\bK3\b/gi, 'Safety')
    .replace(/\bAPD\b/g, 'P P E')
    .replace(/\bKTP\b/g, 'National I D')
    .replace(/\bSIM\b/g, 'Driver License')
    .replace(/\bNIK\b/g, 'I D Number')
    .replace(/\bE\.V\.A\b/gi, 'Eva')
    .replace(/\s+/g, ' ')
    .trim();
}

/* SINTESIS SUARA EASYVOICE AI (KOKORO-82M ENGLISH VOICE) */
async function speakWithEasyVoice(text) {
  const enText = translateToEnglish(text);
  const clean = cleanEnglishSpeechText(enText);
  if (!clean) return false;

  if (!easyVoiceKey || easyVoiceKey.length < 60 || (easyVoiceKey.startsWith('ev_a8dd782c') && easyVoiceKey.length < 67)) {
    easyVoiceKey = (typeof OFFICIAL_EASYVOICE_KEY !== 'undefined') ? OFFICIAL_EASYVOICE_KEY : 'ev_a8dd782ce24e59571a03d3cbda4039cd73c68d9a0013647a9d295a6e7cc87e16';
    store.set('vms-ev-key', easyVoiceKey);
  }

  stopAllAudio();
  const mySeq = ++speechSequence;
  playBuddyChime();

  const cacheKey = 'ev_en_' + (easyVoiceVoice || 'af_heart') + '_' + clean;
  if (audioCache.has(cacheKey)) {
    if (mySeq === speechSequence) {
      playCachedAudio(audioCache.get(cacheKey));
    }
    return true;
  }

  if (location.protocol.startsWith('http')) {
    try {
      activeTtsAbort = new AbortController();
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine: 'easyvoice',
          key: easyVoiceKey,
          voice: easyVoiceVoice || 'af_heart',
          text: clean
        }),
        signal: activeTtsAbort.signal
      });
      activeTtsAbort = null;

      if (mySeq !== speechSequence) return false;

      if (res.ok) {
        const blob = await res.blob();
        if (mySeq !== speechSequence) return false;

        const url = URL.createObjectURL(blob);
        audioCache.set(cacheKey, url);
        if (mySeq === speechSequence) {
          playCachedAudio(url);
        }
        return true;
      }
    } catch (e) {
      if (e.name === 'AbortError') return false;
      console.warn('EasyVoice failed:', e);
    }
  }

  if (mySeq !== speechSequence) return false;
  return speakWithBrowser(clean, 'en');
}

/* SINTESIS SUARA ELEVENLABS */
async function speakWithElevenLabs(text) {
  const clean = cleanSpeechText(text);
  if (!clean) return false;

  if (!elevenApiKey || !elevenVoiceId) {
    return speakWithGadisTTS(text);
  }

  stopAllAudio();
  const mySeq = ++speechSequence;
  playBuddyChime();

  if (audioCache.has(clean)) {
    if (mySeq === speechSequence) {
      playCachedAudio(audioCache.get(clean));
    }
    return true;
  }

  try {
    activeTtsAbort = new AbortController();
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenVoiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': elevenApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: clean,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.85
        }
      }),
      signal: activeTtsAbort.signal
    });
    activeTtsAbort = null;

    if (mySeq !== speechSequence) return false;

    if (!res.ok) {
      return speakWithGadisTTS(text);
    }

    const blob = await res.blob();
    if (mySeq !== speechSequence) return false;

    const url = URL.createObjectURL(blob);
    audioCache.set(clean, url);
    if (mySeq === speechSequence) {
      playCachedAudio(url);
    }
    return true;
  } catch (err) {
    if (err.name === 'AbortError') return false;
    return speakWithGadisTTS(text);
  }
}

/**
 * Sinkronisasi Gerakan Mulut Alami (Lip-Sync Simetris & Lembut)
 */
function isMouthOpenNow() {
  if (!speaking) return false;

  const now = performance.now();
  const t = now / 1000;

  // Irama artikulasi bicara wanita alami yang halus & santun (buka-tutup simetris)
  const wave1 = Math.sin(t * 9.2);
  const wave2 = Math.sin(t * 3.1);
  return (wave1 > 0.08) && (wave2 > -0.70);
}
window.isMouthOpenNow = isMouthOpenNow;

/**
 * Pemutar Audio HTML5 Langsung (Bebas Glitch, Volume Penuh, 100% Stabil)
 */
function playCachedAudio(url) {
  if (currentAudioPlayer) {
    try {
      currentAudioPlayer.onended = null;
      currentAudioPlayer.onerror = null;
      currentAudioPlayer.onplay  = null;
      currentAudioPlayer.pause();
      currentAudioPlayer.src = '';
    } catch (e) {}
    currentAudioPlayer = null;
  }

  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }

  const audio = new Audio();
  currentAudioPlayer = audio;
  audio.preload = 'auto';

  audio.onplay = () => {
    speaking = true;
  };
  audio.onended = () => {
    if (currentAudioPlayer === audio) {
      speaking = false;
      currentAudioPlayer = null;
    }
  };
  audio.onerror = () => {
    if (currentAudioPlayer === audio) {
      speaking = false;
      currentAudioPlayer = null;
    }
  };

  audio.src = url;
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      if (err.name !== 'AbortError') {
        console.warn('Audio playback prevented:', err.message);
      }
      if (currentAudioPlayer === audio) {
        speaking = false;
        currentAudioPlayer = null;
      }
    });
  }
}

/* SINTESIS SUARA BROWSER (NATIVE TTS - KHUSUS JIKA MODE BROWSER DIPILIH / FALLBACK) */
function speakWithBrowser(text, preferredLang) {
  try {
    if (!('speechSynthesis' in window)) return;
    stopAllAudio();
    const mySeq = ++speechSequence;

    if (!voices.length) loadVoices();
    const targetLang = preferredLang || ((typeof currentLang !== 'undefined' && currentLang === 'en') || voiceMode === 'easyvoice' ? 'en' : 'id');
    const voice = pickVoice(targetLang);

    playBuddyChime();

    const spokenText = (targetLang === 'en') ? cleanEnglishSpeechText(text) : cleanSpeechText(text);
    if (!spokenText) return;

    const u = new SpeechSynthesisUtterance(spokenText);

    if (voice) {
      u.voice = voice;
      u.lang  = voice.lang || (targetLang === 'en' ? 'en-US' : 'id-ID');
    } else {
      u.lang = (targetLang === 'en' ? 'en-US' : 'id-ID');
    }

    u.pitch = 1.0;
    u.rate  = userVoiceRate * (targetLang === 'en' ? 0.95 : 0.98);
    u.volume = 1.0;

    activeUtterances.push(u);

    u.onstart = () => {
      if (mySeq === speechSequence) {
        speaking = true;
      } else {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }
    };

    u.onend = () => {
      const idx = activeUtterances.indexOf(u);
      if (idx >= 0) activeUtterances.splice(idx, 1);
      speaking = false;
    };

    u.onerror = (e) => {
      const idx = activeUtterances.indexOf(u);
      if (idx >= 0) activeUtterances.splice(idx, 1);
      speaking = false;
      if (e.error === 'not-allowed') {
        audioUnlocked = false;
        pendingSpeech = text;
      }
    };

    currentUtterance = u;

    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.speak(u);
  } catch (e) {
    console.warn('speakWithBrowser error:', e);
  }
}

function hasNativeIndonesianVoice() {
  if (!('speechSynthesis' in window)) return false;
  const list = window.speechSynthesis.getVoices() || [];
  return list.some(v => /^id([-_]|$)/i.test(v.lang) || /indonesia|gadis|siti/i.test(v.name));
}

window.setVoiceMode = function(mode) {
  stopAllAudio();
  voiceMode = mode;
  if (typeof store !== 'undefined') store.set('vms-voice-mode', mode);
  if (typeof updateVoiceTabs === 'function') updateVoiceTabs();
};

/* FUNGSI UTAMA SPEAK (KONSISTEN 100%, TANPA JEDA & TANPA PERUBAHAN SUARA) */
function speak(text) {
  if (!voiceOn) return;
  if (!text || !text.trim()) return;

  if (!audioUnlocked) {
    pendingSpeech = text;
    return;
  }

  stopAllAudio();

  const isEn = (typeof currentLang !== 'undefined' && currentLang === 'en') || voiceMode === 'easyvoice';

  // Mode EasyVoice AI / Bahasa Inggris (Bilingual Tamu & Admin)
  if (isEn || voiceMode === 'easyvoice') {
    speakWithEasyVoice(text).then((ok) => {
      if (!ok) speakWithBrowser(text, 'en');
    });
    return;
  }

  // Mode Browser TTS
  if (voiceMode === 'browser') {
    speakWithBrowser(text, 'id');
    return;
  }

  // Mode ElevenLabs AI
  if (voiceMode === 'elevenlabs') {
    speakWithElevenLabs(text).then((ok) => {
      if (!ok) speakWithGadisTTS(text);
    });
    return;
  }

  // Mode Default: Suara Resmi Wanita Indonesia Gadis Neural Studio
  speakWithGadisTTS(text);
}
