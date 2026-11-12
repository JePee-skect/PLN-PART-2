/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   Voice Engine: Normalizer Teks, Sintesis Suara Safety Buddy (Female) & ElevenLabs
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

/* Web Audio API Chime untuk PLN ners */
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
// Auto-heal jika key di localStorage pernah terpotong atau rusak
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

/**
 * Penghenti audio universal:
 * Memastikan tidak ada dua suara yang saling bertumpuk (HTML5 Audio, Browser SpeechSynthesis, atau Fetch in-flight).
 */
function stopAllAudio() {
  // 1. Batalkan fetch async yang sedang berjalan di background
  if (activeTtsAbort) {
    try { activeTtsAbort.abort(); } catch (e) {}
    activeTtsAbort = null;
  }

  // 2. Tingkatkan sequence agar semua callback async tertunda otomatis diabaikan
  speechSequence++;

  // 3. Hentikan dan bersihkan pemutar audio HTML5
  if (currentAudioPlayer) {
    try {
      currentAudioPlayer.onended = null;
      currentAudioPlayer.onerror = null;
      currentAudioPlayer.onplay  = null;
      currentAudioPlayer.pause();
      currentAudioPlayer.src = '';
      currentAudioPlayer.load();
    } catch (e) {}
    currentAudioPlayer = null;
  }

  // 4. Hentikan dan resume SpeechSynthesis browser jika sedang bicara
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

  // Tab 1: Online TTS Wanita Indonesia (Gadis Neural - Default Rekomendasi)
  const tabOnline = $('#tab-vonline');
  if (tabOnline) {
    tabOnline.onclick = () => {
      stopAllAudio();
      voiceMode = 'online';
      store.set('vms-voice-mode', voiceMode);
      updateVoiceTabs();
      say('Mode suara wanita Indonesia aktif.');
    };
  }

  const btnTestOnline = $('#btn-test-online');
  if (btnTestOnline) {
    btnTestOnline.onclick = () => {
      stopAllAudio();
      speakWithGadisTTS('Selamat datang di PT PLN (Persero) Pusharlis. Saya PLN ners, asisten virtual Anda.');
    };
  }

  // Tab 2: EasyVoice AI Studio
  const tabEasy = $('#tab-veasyvoice');
  if (tabEasy) {
    tabEasy.onclick = () => {
      stopAllAudio();
      voiceMode = 'easyvoice';
      store.set('vms-voice-mode', voiceMode);
      updateVoiceTabs();
      say('Mode suara EasyVoice AI diaktifkan.');
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
        // Otomatis pulihkan jika key terpotong
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

      speakWithEasyVoice('Halo! API Key EasyVoice berhasil disimpan. PLN ners siap menyambut tamu dengan suara AI yang ramah.').then((ok) => {
        if (statusEl) {
          if (ok) {
            statusEl.textContent = '✅ Berhasil terhubung! Suara AI EasyVoice (Kokoro-82m) aktif.';
            statusEl.style.color = '#2ecc71';
          } else {
            statusEl.textContent = '⚠️ Gagal terhubung ke API EasyVoice. Sistem beralih ke suara browser.';
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
        statusEl.textContent = '⏳ Menguji pemutaran audio EasyVoice...';
        statusEl.style.color = 'var(--acc)';
      }
      stopAllAudio();
      speakWithEasyVoice('Selamat datang di PT PLN (Persero) Pusharlis. Saya PLN ners, asisten virtual Anda.').then((ok) => {
        if (statusEl) {
          if (ok) {
            statusEl.textContent = '✅ Suara EasyVoice AI berhasil diputar.';
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
      if (currentAudioPlayer) {
        currentAudioPlayer.pause();
        currentAudioPlayer = null;
      }
      if ('speechSynthesis' in window) {
        try { speechSynthesis.cancel(); } catch (e) {}
      }

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
    .replace(/1–99/g, 'satu sampai sembilan puluh sembilan')
    .replace(/([.!?])\s*/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Pemilihan suara wanita alami terbaik untuk Safety Buddy
 */
function pickVoice() {
  if (userVoiceIndex >= 0 && voices[userVoiceIndex]) {
    return voices[userVoiceIndex];
  }

  const isMaleName = (name = '') => /ardi|andika|david|mark|male|pria|laki/i.test(name);
  const idVoices = voices.filter(v => /^id([-_]|$)/i.test(v.lang));

  // 1. Suara wanita Indonesia Neural paling diutamakan (Microsoft Gadis / Siti / Reza / Hana)
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

  // 5. Suara wanita yang ada di Windows (seperti Microsoft Zira)
  const winFemale = voices.find(v => /zira|susan|catherine|hazel|heera|helena|female/i.test(v.name));
  if (winFemale) return winFemale;

  // 6. Suara default sistem
  const def = voices.find(v => v.default) || voices[0];
  return def || null;
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
      tipEl.innerHTML = '✅ <b>Suara Wanita Indonesia Natural aktif!</b> PLN ners siap menyambut tamu dengan ramah.';
      tipEl.style.background = 'rgba(46, 204, 113, 0.15)';
      tipEl.style.color = 'var(--text)';
    } else {
      tipEl.innerHTML = '💡 <b>Tips Suara:</b> Buka di <b>Microsoft Edge</b> untuk suara wanita Indonesia <b>Microsoft Gadis (Natural)</b> yang paling jernih & ramah.';
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
      badge.textContent = 'Aktif: 🌟 Gadis Neural (Studio 96kbps)';
      badge.style.background = '#27ae60';
    } else if (isBrowser) {
      badge.textContent = 'Aktif: 🔊 Browser WebSpeech';
      badge.style.background = '#2980b9';
    } else if (isEasy) {
      badge.textContent = 'Aktif: ✨ EasyVoice AI';
      badge.style.background = '#e67e22';
    } else if (isEleven) {
      badge.textContent = 'Aktif: 🎙️ ElevenLabs AI';
      badge.style.background = '#8e44ad';
    }
  }
}

/* SINTESIS SUARA ONLINE WANITA INDONESIA (DIRECT STREAMING - BEBAS CORS) */
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
    audio.onerror = (e) => {
      console.warn('Google TTS error, fallback ke suara browser:', e);
      speaking = false;
      speakWithBrowser(text);
    };

    audio.play().catch((err) => {
      console.warn('Google TTS play failed, fallback ke suara browser:', err);
      speaking = false;
      speakWithBrowser(text);
    });
  }

  playNext();
  return true;
}

let speechSequence = 0;

/* SINTESIS SUARA GADIS NEURAL (WANITA INDONESIA ASLI, JERNIH & SOPAN) */
async function speakWithGadisTTS(text) {
  const clean = cleanSpeechText(text);
  if (!clean) return false;

  stopAllAudio();
  const mySeq = ++speechSequence;
  playBuddyChime();

  const cacheKey = 'gadis_v4_studio_' + clean;
  if (audioCache.has(cacheKey)) {
    if (mySeq === speechSequence) {
      playCachedAudio(audioCache.get(cacheKey));
    }
    return true;
  }

  // Jika web diakses melalui Local Server (http/https), panggil /api/tts (Gadis Neural + Disk Cache)
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
      console.warn('[Gadis TTS API Warn, beralih ke Browser]:', e);
    }
  }

  if (mySeq !== speechSequence) return false;

  // Cadangan 1: Browser Native TTS (Di Edge otomatis Microsoft Gadis Natural)
  if ('speechSynthesis' in window) {
    speakWithBrowser(text);
    return true;
  }

  // Cadangan 2: Google TTS jika browser tidak mendukung
  return speakWithGoogleTTS(text);
}

/* SINTESIS SUARA EASYVOICE AI (KOKORO-82M) */
async function speakWithEasyVoice(text) {
  const clean = cleanSpeechText(text);
  if (!clean) return false;

  if (!easyVoiceKey || easyVoiceKey.length < 60 || (easyVoiceKey.startsWith('ev_a8dd782c') && easyVoiceKey.length < 67)) {
    easyVoiceKey = (typeof OFFICIAL_EASYVOICE_KEY !== 'undefined') ? OFFICIAL_EASYVOICE_KEY : 'ev_a8dd782ce24e59571a03d3cbda4039cd73c68d9a0013647a9d295a6e7cc87e16';
    store.set('vms-ev-key', easyVoiceKey);
  }

  stopAllAudio();
  const mySeq = ++speechSequence;
  playBuddyChime();

  const cacheKey = 'ev_' + (easyVoiceVoice || 'af_heart') + '_' + clean;
  if (audioCache.has(cacheKey)) {
    if (mySeq === speechSequence) {
      playCachedAudio(audioCache.get(cacheKey));
    }
    return true;
  }

  // Gunakan proxy backend /api/tts (aman dari batasan CORS dan terlindungi enkripsi)
  const targetUrl = '/api/tts';
  const reqHeaders = { 'Content-Type': 'application/json' };

  const payload = {
    engine: 'easyvoice',
    model: 'kokoro-82m',
    input: clean,
    voice: easyVoiceVoice || 'af_heart',
    key: easyVoiceKey
  };

  try {
    activeTtsAbort = new AbortController();
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify(payload),
      signal: activeTtsAbort.signal
    });
    activeTtsAbort = null;

    if (mySeq !== speechSequence) return false;

    if (!res.ok) {
      console.warn('EasyVoice API error, status:', res.status);
      return false;
    }

    const blob = await res.blob();
    if (mySeq !== speechSequence) return false;

    const url  = URL.createObjectURL(blob);
    audioCache.set(cacheKey, url);

    if (mySeq === speechSequence) {
      playCachedAudio(url);
    }
    return true;
  } catch (err) {
    if (err.name === 'AbortError') return false;
    console.warn('EasyVoice fetch failed, fallback ke Gadis TTS:', err);
    return speakWithGadisTTS(text);
  }
}

/* SINTESIS SUARA ELEVENLABS */
async function speakWithElevenLabs(text) {
  const clean = cleanSpeechText(text);
  if (!clean || !elevenApiKey || !elevenVoiceId) return false;

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
      console.warn('ElevenLabs API error, fallback to Gadis TTS:', res.status);
      return speakWithGadisTTS(text);
    }

    const blob = await res.blob();
    if (mySeq !== speechSequence) return false;

    const url  = URL.createObjectURL(blob);
    audioCache.set(clean, url);
    if (mySeq === speechSequence) {
      playCachedAudio(url);
    }
    return true;
  } catch (err) {
    if (err.name === 'AbortError') return false;
    console.warn('Gagal memanggil ElevenLabs, fallback ke Gadis:', err);
    return speakWithGadisTTS(text);
  }
}

function playCachedAudio(url) {
  if (currentAudioPlayer) {
    try {
      currentAudioPlayer.onended = null;
      currentAudioPlayer.onerror = null;
      currentAudioPlayer.onplay  = null;
      currentAudioPlayer.pause();
      currentAudioPlayer.src = '';
      currentAudioPlayer.load();
    } catch (e) {}
    currentAudioPlayer = null;
  }

  if ('speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
  }

  const audio = new Audio();
  currentAudioPlayer = audio;

  audio.onplay  = () => { speaking = true; };
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

/* SINTESIS SUARA BROWSER (NATIVE TTS) */
function speakWithBrowser(text) {
  try {
    if (!('speechSynthesis' in window)) return;
    stopAllAudio();
    const mySeq = ++speechSequence;

    if (!voices.length) loadVoices();
    const voice = pickVoice();

    playBuddyChime();

    const spokenText = cleanSpeechText(text);
    if (!spokenText) return;

    const u = new SpeechSynthesisUtterance(spokenText);

    if (voice) {
      u.voice = voice;
      u.lang  = voice.lang || 'id-ID';
    } else {
      u.lang = 'id-ID';
    }

    // Deteksi apakah suara terpilih wanita atau pria
    const isMale = voice && /ardi|andika|david|mark|male|pria|laki/i.test(voice.name);
    const isFemale = voice && /gadis|siti|reza|hana|yasmin|female|wanita|zira/i.test(voice.name);

    if (isFemale) {
      u.pitch = 1.0; // Artikulasi jernih & cerah
      u.rate  = userVoiceRate * 0.98; // Tempo bicara natural & jelas
    } else if (isMale) {
      u.pitch = 1.15;
      u.rate  = userVoiceRate * 0.96;
    } else {
      u.pitch = 1.0;
      u.rate  = userVoiceRate * 0.98;
    }

    u.volume = 1.0;

    // Simpan utterance ke array global untuk mencegah garbage collection bug di Chromium/Edge
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

    // Pastikan tidak dalam keadaan paused
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

/* Fungsi Utama Speak (Respon Instan Bebas Delay) */
function speak(text) {
  if (!voiceOn) return;
  if (!text || !text.trim()) return;

  // Jika suara belum diizinkan oleh interaksi pengguna di browser, simpan antrian
  if (!audioUnlocked) {
    pendingSpeech = text;
    return;
  }

  stopAllAudio();

  const clean = cleanSpeechText(text);
  const cacheKey = 'gadis_v4_studio_' + clean;

  // 1. Jika audio sudah ada di memori cache, putar seketika (0ms delay)
  if (audioCache.has(cacheKey)) {
    speakWithGadisTTS(text);
    return;
  }

  // 2. Respon Super Cepat (<50ms): Jika browser memiliki suara wanita Indonesia alami
  // (seperti Microsoft Gadis Natural di Edge/Windows atau Google ID di Android),
  // bicara seketika tanpa jeda/delay jaringan internet!
  if (hasNativeIndonesianVoice() || voiceMode === 'browser') {
    speakWithBrowser(text);
    return;
  }

  // 3. Mode Suara Online Gadis Neural (jika browser belum terpasang suara ID)
  if (voiceMode === 'online') {
    speakWithGadisTTS(text);
    return;
  }

  // 4. EasyVoice AI
  if (voiceMode === 'easyvoice') {
    speakWithEasyVoice(text).then((success) => {
      if (!success) speakWithBrowser(text);
    });
    return;
  }

  // 5. ElevenLabs
  if (voiceMode === 'elevenlabs' && elevenApiKey && elevenVoiceId) {
    speakWithElevenLabs(text).then((success) => {
      if (!success) speakWithBrowser(text);
    });
    return;
  }

  // 6. Cadangan Browser Universal
  speakWithBrowser(text);
}

// Preload audio sambutan & panduan di background agar selalu instan
setTimeout(() => {
  try {
    if (typeof fetch === 'undefined') return;
    const preloads = [
      'Selamat datang di PT PLN (Persero) Pusharlis. Saya PLN ners, asisten virtual Anda. Dengan senang hati, saya siap memandu Bapak dan Ibu dalam proses pengisian formulir registrasi kunjungan. Silakan tekan tombol Mulai Panduan untuk bimbingan langkah demi langkah.',
      'Langkah pertama. Silakan tekan tombol Ambil Foto, arahkan pandangan wajah ke kamera, kemudian tekan Ambil Foto kembali untuk menyimpan potret.'
    ];
    preloads.forEach((txt) => {
      const clean = cleanSpeechText(txt);
      const cacheKey = 'gadis_v4_studio_' + clean;
      if (!audioCache.has(cacheKey)) {
        fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ engine: 'gadis', text: clean })
        }).then(r => r.ok ? r.blob() : null).then(b => {
          if (b) audioCache.set(cacheKey, URL.createObjectURL(b));
        }).catch(() => {});
      }
    });
  } catch (e) {}
}, 1200);
