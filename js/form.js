/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   Formulir Tamu: Kamera Wajah, APD, KTP, Safety Induction & Validasi
   ===================================================================== */

const FIELDS = ['nama', 'usaha', 'alamat', 'telp', 'email', 'pegawai', 'perlu', 'ktp', 'kend', 'tag', 'jml'];
const REQUIRED_FIELDS = ['nama', 'usaha', 'alamat', 'telp', 'pegawai', 'perlu', 'ktp', 'kend', 'tag', 'jml'];

let camStream = null;
let ktpTimer = null;
let lastKtpMsg = '';
let apdBoxes = [];

function initForm() {
  // Inisialisasi dropdown jumlah tamu (1–99)
  const jmlSelect = $('#jml');
  if (jmlSelect) {
    jmlSelect.innerHTML =
      '<option value="">Pilih jumlah (1–99)</option>' +
      Array.from({ length: 99 }, (_, i) => `<option>${i + 1}</option>`).join('');
  }

  const f = $('#f');
  if (f) {
    f.onsubmit = (e) => {
      e.preventDefault();
      return false;
    };
  }

  const pb = $('#pb');
  if (pb) pb.onclick = openCamera;

  const pf = $('#pf');
  if (pf) {
    pf.addEventListener('cancel', () => {
      say('Foto belum dipilih. Anda dapat mencobanya kembali kapan saja.');
    });

    pf.onchange = (e) => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        return say('Berkas yang dipilih bukan gambar. Mohon pilih foto.');
      }

      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onerror = () => say('Foto gagal dimuat. Mohon pilih foto lain.');
      img.onload  = () => {
        setPhoto(img, img.width, img.height);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    };
  }

  // Purpose quick chips listeners
  $$('.purpose-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.purpose-chip').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.dataset.val;
      const perluInput = $('#perlu');
      if (perluInput) {
        perluInput.value = val;
        perluInput.dispatchEvent(new Event('input', { bubbles: true }));
        perluInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

  const perluInput = $('#perlu');
  if (perluInput) {
    perluInput.addEventListener('input', () => {
      const v = perluInput.value.trim().toLowerCase();
      $$('.purpose-chip').forEach((c) => {
        c.classList.toggle('active', c.dataset.val.toLowerCase() === v);
      });
    });
  }

  // APD Listeners
  apdBoxes = $$('#apd input[value]');
  apdBoxes.forEach((b) => b.addEventListener('change', onApdChange));

  const apdAll = $('#apdall');
  if (apdAll) {
    apdAll.addEventListener('change', (e) => {
      apdBoxes.forEach((b) => b.checked = e.target.checked);
      if (e.target.checked) {
        if ($('#apdnone')) $('#apdnone').checked = false;
        onApdDone();
      }
    });
  }

  const apdNone = $('#apdnone');
  if (apdNone) {
    apdNone.addEventListener('change', (e) => {
      if (!e.target.checked) return;
      apdBoxes.forEach((b) => b.checked = false);
      if ($('#apdall')) $('#apdall').checked = false;
      say('Anda tidak memakai APD. Demi keselamatan kerja, silakan ambil dan kenakan APD di pos petugas keamanan.');
      const apdIdx = (typeof GUIDE !== 'undefined') ? GUIDE.findIndex(g => g[0] === 'apd') : -1;
      if (typeof guideIdx !== 'undefined' && guideIdx === apdIdx && apdIdx >= 0) {
        setTimeout(() => goStep(apdIdx + 1), 7000);
      }
    });
  }

  // KTP Listeners
  const ktpInput = $('#ktp');
  if (ktpInput) {
    ktpInput.addEventListener('input', () => {
      const v   = ktpInput.value.trim();
      const err = ktpError();
      const box = $('#ktp-e');
      const partial = /^\d+$/.test(v) && v.length < 16;

      if (box) {
        box.textContent = partial ? `${v.length}/16 digit` : err;
        box.className   = partial ? 'err hint' : 'err';
      }
      ktpInput.classList.toggle('bad', !!err && !partial);

      clearTimeout(ktpTimer);
      ktpTimer = setTimeout(ktpAnnounce, 1800);
    });

    ktpInput.addEventListener('change', () => {
      clearTimeout(ktpTimer);
      ktpAnnounce();
    });
  }

  // Listener Centang Safety Induction
  const agreeInduction = $('#agree-induction');
  if (agreeInduction) {
    agreeInduction.addEventListener('change', (e) => {
      if (e.target.checked) {
        if ($('#agree-e')) $('#agree-e').style.display = 'none';
        say('Terima kasih telah membaca dan menyetujui Safety and Security Induction PLN Pusharlis.');
        const indIdx = (typeof GUIDE !== 'undefined') ? GUIDE.findIndex(g => g[0] === 'agree-induction') : -1;
        if (typeof guideIdx !== 'undefined' && guideIdx === indIdx && indIdx >= 0) {
          setTimeout(() => goStep(indIdx + 1), 400);
        }
      }
    });
  }

  // Lightbox Pembesaran Poster Safety Induction
  const imgInduction = $('#img-induction');
  if (imgInduction) {
    imgInduction.addEventListener('click', () => {
      openDialog(
        'Safety and Security Induction PT PLN (Persero) Pusharlis',
        '<div style="text-align:center;max-height:75vh;overflow:auto;padding:4px;"><img src="img/safety-induction.jpg" alt="Safety Induction Full" style="max-width:100%;height:auto;border-radius:6px;box-shadow:0 4px 20px rgba(0,0,0,0.2);"></div>',
        '<button class="btn" id="btn-close-induction-dlg" style="min-width:100px;">Tutup</button>'
      );
      const cb = $('#btn-close-induction-dlg');
      if (cb) cb.onclick = () => $('#ov').classList.add('hide');
    });
  }

  // Tombol Kirim Registrasi
  const btnSub = $('#sub');
  if (btnSub) {
    btnSub.onclick = handleSubmit;
  }

  const btnAgain = $('#again');
  if (btnAgain) {
    btnAgain.onclick = restartForm;
  }
}

/* ----- Foto Tamu ----- */
function setPhoto(source, srcW, srcH) {
  const W = 168;
  const H = 233;
  const canvas = document.createElement('canvas');
  canvas.width  = W;
  canvas.height = H;

  const scale = Math.max(W / srcW, H / srcH);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(
    source,
    (W - srcW * scale) / 2,
    (H - srcH * scale) / 2,
    srcW * scale,
    srcH * scale
  );

  photo = canvas.toDataURL('image/jpeg', 0.75);
  $('#pv').src = photo;
  $('#pb').textContent = 'Ambil Ulang Foto';

  say('Foto berhasil diambil. Silakan lanjutkan mengisi nama tamu.');
  const namaIdx = (typeof GUIDE !== 'undefined') ? GUIDE.findIndex(g => g[0] === 'nama') : 1;
  if (typeof guideIdx !== 'undefined' && guideIdx === 0 && namaIdx >= 0) {
    setTimeout(() => goStep(namaIdx), 3500);
  }
}

/* Kamera WebRTC */
function stopCamera() {
  if (camStream) {
    camStream.getTracks().forEach((t) => t.stop());
  }
  camStream = null;
}

function closeCamera() {
  stopCamera();
  $('#ov').classList.add('hide');
}

async function openCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    say('Kamera tidak tersedia di perangkat ini. Silakan pilih foto dari galeri.');
    return $('#pf').click();
  }

  openDialog(
    'Ambil Foto Wajah Tamu',
    '<video id="cam" autoplay playsinline muted style="width:100%;border-radius:10px;background:#000;transform:scaleX(-1)"></video>',
    '<button class="btn ghost" id="cgal">Galeri</button>' +
    '<button class="btn ghost" id="ccan">Batal</button>' +
    '<button class="btn" id="csnap">Ambil Foto</button>'
  );

  say('Hadapkan wajah Anda ke arah kamera dengan jelas, lalu tekan tombol Ambil Foto.');

  $('#ccan').onclick = () => {
    closeCamera();
    say('Foto belum diambil. Anda dapat mencobanya kembali kapan saja.');
  };

  $('#cgal').onclick = () => {
    closeCamera();
    $('#pf').click();
  };

  $('#csnap').onclick = () => {
    const v = $('#cam');
    if (!v.videoWidth) {
      return say('Kamera belum siap, mohon tunggu sebentar.');
    }
    setPhoto(v, v.videoWidth, v.videoHeight);
    closeCamera();
  };

  try {
    camStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width:  { ideal: 720 },
        height: { ideal: 960 }
      },
      audio: false
    });
    $('#cam').srcObject = camStream;
  } catch (err) {
    closeCamera();
    say('Kamera tidak dapat diakses. Pastikan izin kamera aktif, atau pilih foto dari berkas galeri.');
    $('#pf').click();
  }
}

/* APD Logic */
function onApdDone() {
  say('APD lengkap, sangat bagus! Terima kasih telah mengutamakan keselamatan kerja.');
  const apdIdx = (typeof GUIDE !== 'undefined') ? GUIDE.findIndex(g => g[0] === 'apd') : -1;
  if (typeof guideIdx !== 'undefined' && guideIdx === apdIdx && apdIdx >= 0) {
    setTimeout(() => goStep(apdIdx + 1), 3500);
  }
}

function onApdChange() {
  const checked = apdBoxes.filter((b) => b.checked).length;
  const missing = apdBoxes.filter((b) => !b.checked).map((b) => b.value);

  if ($('#apdall')) $('#apdall').checked = (checked === APD_LIST.length);
  if (checked > 0 && $('#apdnone')) {
    $('#apdnone').checked = false;
  }

  if (checked === APD_LIST.length) {
    return onApdDone();
  }

  if (checked > 0) {
    say(`Anda baru memakai ${checked} dari 3 APD. ${missing.join(' dan ')} belum dicentang. Demi keselamatan, silakan lengkapi di pos keamanan.`);
  }
}

/* Validasi KTP / Identitas */
function ktpError() {
  const v = $('#ktp') ? $('#ktp').value.trim() : '';
  if (!v) return '';

  if (/^\d+$/.test(v)) {
    if (v.length === 12) return ''; // Dianggap nomor SIM
    if (v.length === 16) {
      const prov = +v.slice(0, 2);
      return (prov < 11 || prov > 94)
        ? `Dua digit awal (${v.slice(0, 2)}) bukan kode provinsi yang valid. Periksa kembali nomor KTP Anda.`
        : '';
    }
    const n = v.length;
    return (n < 16)
      ? `Nomor KTP kurang ${16 - n} digit. KTP wajib 16 digit angka.`
      : `Nomor KTP kelebihan ${n - 16} digit. KTP wajib 16 digit angka.`;
  }

  return /^[A-Za-z0-9]{6,20}$/.test(v)
    ? ''
    : 'Nomor identitas salah. KTP harus 16 digit angka, atau paspor tanpa spasi dan simbol.';
}

function ktpAnnounce() {
  const ktpEl = $('#ktp');
  if (!ktpEl) return;
  const v   = ktpEl.value.trim();
  const err = ktpError();

  if ($('#ktp-e')) {
    $('#ktp-e').textContent = err;
    $('#ktp-e').className   = 'err';
  }
  ktpEl.classList.toggle('bad', !!err);

  let msg = err;
  if (!msg && /^\d{12}$/.test(v)) {
    msg = 'Nomor 12 digit ini dianggap nomor SIM. Jika menggunakan KTP, nomor harus 16 digit.';
  }

  if (msg && msg !== lastKtpMsg) {
    lastKtpMsg = msg;
    say(msg);
  }
  if (!msg) {
    lastKtpMsg = '';
  }
}

/* Submit Handler */
function handleSubmit() {
  const isEn  = (typeof currentLang !== 'undefined' && currentLang === 'en');
  const apd   = apdBoxes.filter((b) => b.checked).map((b) => b.value);
  const noApd = $('#apdnone') ? $('#apdnone').checked : false;

  const empty = (typeof REQUIRED_FIELDS !== 'undefined' ? REQUIRED_FIELDS : FIELDS).find((id) => !$('#' + id) || !$('#' + id).value.trim());
  if (empty) {
    const labelEl = $(`label[for="${empty}"]`);
    const labelParts = labelEl ? labelEl.textContent.replace('*', '').split('/') : [empty];
    const labelText = isEn
      ? ((labelParts[1] || labelParts[0]).trim())
      : (labelParts[0].trim());
    say(isEn ? `Please complete the ${labelText} field first.` : `Mohon lengkapi kolom ${labelText} terlebih dahulu.`);
    return $('#' + empty).focus();
  }

  const ktpErr = ktpError();
  if (ktpErr) {
    say(isEn ? 'Please enter a valid 16-digit National ID (NIK) or ID number.' : ktpErr);
    return $('#ktp').focus();
  }

  if (!apd.length && !noApd) {
    say(isEn ? 'Please select the PPE you are wearing, or choose No PPE.' : 'Mohon pilih APD yang Anda kenakan, atau centang Tidak memakai APD.');
    return $('#apdl').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const agree = $('#agree-induction');
  if (agree && !agree.checked) {
    if ($('#agree-e')) $('#agree-e').style.display = 'block';
    say(isEn ? 'Please review and accept the Safety and Security Induction before submitting.' : 'Mohon baca dan centang persetujuan Safety and Security Induction terlebih dahulu.');
    agree.scrollIntoView({ behavior: 'smooth', block: 'center' });
    agree.focus();
    return;
  }

  showConfirm(apd, noApd, () => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const rec = {
      id:        uniqueId,
      tgl:       ymd(),
      apd:       noApd ? 'Tidak memakai APD' : apd.join(', '),
      foto:      photo,
      status:    'Menunggu',
      createdAt: new Date().toISOString()
    };

    FIELDS.forEach((id) => {
      rec[id] = $('#' + id) ? $('#' + id).value.trim() : '';
    });

    data.unshift(rec);
    store.set('vms-data', data);
    if (typeof syncDataToServer === 'function') syncDataToServer(rec);

    $('#f').reset();
    photo = '';
    $('#pv').src = PHOTO_PLACEHOLDER;
    $('#pb').textContent = 'Ambil Foto';
    if ($('#ktp-e')) $('#ktp-e').textContent = '';
    $('#ktp').classList.remove('bad');
    if ($('#agree-induction')) $('#agree-induction').checked = false;
    if ($('#agree-e')) $('#agree-e').style.display = 'none';
    $$('.purpose-chip').forEach(c => c.classList.remove('active'));

    const lacking = APD_LIST.filter((x) => !apd.includes(x));
    const apdNote = lacking.length
      ? (isEn
          ? ` Recommended PPE you are not wearing: ${lacking.join(', ')}. Please obtain them at the security post.`
          : ` APD yang belum Anda kenakan: ${lacking.join(', ')}. Harap ambil di petugas keamanan.`)
      : '';

    say(isEn
      ? `Registration successful. Thank you, ${rec.nama}. Please proceed to the security post to pick up your visitor badge.${apdNote}`
      : `Registrasi berhasil. Terima kasih, ${rec.nama}. Silakan menuju petugas keamanan untuk mengambil kartu name tag.${apdNote}`);
    showDone(rec.nama);
  });
}

function openDialog(title, bodyHtml, actionsHtml) {
  $('#ovt').textContent = title;
  $('#ovb').innerHTML   = bodyHtml;
  $('#ova').innerHTML   = actionsHtml;
  $('#ov').classList.remove('hide');
}

function showConfirm(apd, noApd, onOk) {
  const isEn = (typeof currentLang !== 'undefined' && currentLang === 'en');
  const labels = {
    nama:    'Nama Lengkap / Full Name',
    usaha:   'Nama Perusahaan / Company / Institution',
    alamat:  'Alamat Perusahaan Tamu / Company Address',
    telp:    'Nomor Telepon/WA / Phone/WhatsApp Number',
    email:   'Alamat Email / Email Address',
    pegawai: 'Nama Pegawai Dituju / Person to Visit',
    perlu:   'Keperluan Kunjungan / Purpose of Visit',
    ktp:     'No. KTP atau Identitas / ID Number',
    kend:    'Kendaraan (Jenis / No. Pol) / Vehicle',
    tag:     'Nomor Name Tag Tamu / Visitor Badge Number',
    jml:     'Jumlah Tamu / Number of Visitors'
  };

  const rows = Object.keys(labels)
    .filter((k) => $('#' + k) && $('#' + k).value.trim())
    .map((k) => `<dt>${labels[k]}</dt><dd>${esc($('#' + k).value.trim())}</dd>`)
    .join('');

  const confirmTitle = isEn ? 'Confirm Registration Details' : 'Konfirmasi Data Registrasi';
  const apdLabel = isEn ? 'Personal Protective Equipment (PPE)' : 'Pemakaian APD / PPE';
  const apdText = noApd
    ? (isEn ? 'No PPE' : 'Tidak memakai APD')
    : apd.join(', ');

  const btnReview = isEn ? 'Review Again' : 'Periksa Lagi';
  const btnConfirm = isEn ? 'Confirm' : 'Konfirmasi';

  openDialog(
    confirmTitle,
    `<dl>${rows}<dt>${apdLabel}</dt><dd>${esc(apdText)}</dd></dl>`,
    `<button class="btn ghost" id="ovn">${btnReview}</button>` +
    `<button class="btn" id="ovy">${btnConfirm}</button>`
  );

  if (typeof lastHint !== 'undefined') lastHint = '';
  say(isEn
    ? 'Please review your registration details. If everything is correct, click Confirm.'
    : 'Mohon periksa kembali kelengkapan data Anda. Jika sudah sesuai, tekan Konfirmasi.');

  $('#ovn').onclick = () => {
    $('#ov').classList.add('hide');
    say(isEn ? 'Please check and revise your details if needed.' : 'Silakan periksa dan perbaiki data Anda jika diperlukan.');
  };

  $('#ovy').onclick = () => {
    $('#ov').classList.add('hide');
    onOk();
  };
}

function showDone(name) {
  const isEn = (typeof currentLang !== 'undefined' && currentLang === 'en');
  openDialog(
    isEn ? '✓ Registration Successful' : '✓ Registrasi Berhasil',
    isEn
      ? `<p>Thank you, <b>${esc(name)}</b>. Your visit details have been registered in our system. Please proceed to the security post to pick up your visitor badge.</p>`
      : `<p>Terima kasih, <b>${esc(name)}</b>. Data kunjungan Anda sudah tersimpan di sistem. Silakan menuju petugas keamanan untuk mengambil name tag tamu.</p>`,
    `<button class="btn" id="ovd">${isEn ? 'Finish' : 'Selesai'}</button>`
  );

  $('#ovd').onclick = () => {
    $('#ov').classList.add('hide');
    showThanks(name);
  };
}

function showThanks(name) {
  $('#v-registrasi').classList.add('hide');
  $('#v-terima').classList.remove('hide');
  $('#thanks-title').textContent = name ? `Terima kasih, ${name}!` : 'Terima Kasih!';
  $('#thanks-text').textContent  = 'Semoga urusan kunjungan kerja Anda di PLN berjalan lancar.';
  scrollTo({ top: 0, behavior: 'smooth' });
  say('Terima kasih. Semoga kunjungan Anda lancar. Jika ada tamu berikutnya, tekan tombol Isi Formulir Lagi.');
}

function restartForm() {
  $('#v-terima').classList.add('hide');
  $('#v-registrasi').classList.remove('hide');
  if ($('#agree-induction')) $('#agree-induction').checked = false;
  if ($('#agree-e')) $('#agree-e').style.display = 'none';
  $$('.purpose-chip').forEach(c => c.classList.remove('active'));
  if (typeof guideIdx !== 'undefined') guideIdx = -1;
  if (typeof lastHint !== 'undefined') lastHint = '';
  scrollTo({ top: 0, behavior: 'smooth' });
  say('Silakan isi formulir untuk tamu berikutnya. Tekan Mulai panduan jika membutuhkan arahan.');
}
