/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   Formulir Tamu: Kamera Wajah, APD, KTP, Safety Induction & Validasi
   ===================================================================== */

const FIELDS = ['nama', 'usaha', 'alamat', 'pegawai', 'perlu', 'ktp', 'kend', 'tag', 'jml'];

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
      if (typeof guideIdx !== 'undefined' && guideIdx === 5) {
        setTimeout(() => goStep(6), 7000);
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
        if (typeof guideIdx !== 'undefined' && guideIdx === 11) {
          setTimeout(() => goStep(12), 400);
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
  if (typeof guideIdx !== 'undefined' && guideIdx === 0) {
    setTimeout(() => goStep(1), 3500);
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
  if (typeof guideIdx !== 'undefined' && guideIdx === 5) {
    setTimeout(() => goStep(6), 3500);
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
  const apd   = apdBoxes.filter((b) => b.checked).map((b) => b.value);
  const noApd = $('#apdnone') ? $('#apdnone').checked : false;

  const empty = FIELDS.find((id) => !$('#' + id) || !$('#' + id).value.trim());
  if (empty) {
    const labelText = $(`label[for=${empty}]`).textContent.replace('*', '').trim();
    say(`Mohon lengkapi kolom ${labelText} terlebih dahulu.`);
    return $('#' + empty).focus();
  }

  const ktpErr = ktpError();
  if (ktpErr) {
    say(ktpErr);
    return $('#ktp').focus();
  }

  if (!apd.length && !noApd) {
    say('Mohon pilih APD yang Anda kenakan, atau centang Tidak memakai APD.');
    return $('#apdl').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  const agree = $('#agree-induction');
  if (agree && !agree.checked) {
    if ($('#agree-e')) $('#agree-e').style.display = 'block';
    say('Mohon baca dan centang persetujuan Safety and Security Induction terlebih dahulu.');
    agree.scrollIntoView({ behavior: 'smooth', block: 'center' });
    agree.focus();
    return;
  }

  showConfirm(apd, noApd, () => {
    const rec = {
      id:     Date.now(),
      tgl:    ymd(),
      apd:    noApd ? 'Tidak memakai APD' : apd.join(', '),
      foto:   photo,
      status: 'Menunggu'
    };

    FIELDS.forEach((id) => {
      rec[id] = $('#' + id).value.trim();
    });

    data.unshift(rec);
    store.set('vms-data', data);
    if (typeof syncDataToServer === 'function') syncDataToServer();

    $('#f').reset();
    photo = '';
    $('#pv').src = PHOTO_PLACEHOLDER;
    $('#pb').textContent = 'Ambil Foto';
    if ($('#ktp-e')) $('#ktp-e').textContent = '';
    $('#ktp').classList.remove('bad');
    if ($('#agree-induction')) $('#agree-induction').checked = false;
    if ($('#agree-e')) $('#agree-e').style.display = 'none';

    const lacking = APD_LIST.filter((x) => !apd.includes(x));
    const apdNote = lacking.length
      ? ` APD yang belum Anda kenakan: ${lacking.join(', ')}. Harap ambil di petugas keamanan.`
      : '';

    say(`Registrasi berhasil. Terima kasih, ${rec.nama}. Silakan menuju petugas keamanan untuk mengambil kartu name tag.${apdNote}`);
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
  const labels = {
    nama:    'Nama Tamu',
    usaha:   'Perusahaan',
    pegawai: 'Pegawai Dituju',
    perlu:   'Keperluan',
    ktp:     'No. Identitas',
    jml:     'Jumlah Tamu'
  };

  const rows = Object.keys(labels)
    .map((k) => `<dt>${labels[k]}</dt><dd>${esc($('#' + k).value.trim())}</dd>`)
    .join('');

  const apdText = noApd ? 'Tidak memakai APD' : apd.join(', ');

  openDialog(
    'Konfirmasi Data Registrasi',
    `<dl>${rows}<dt>APD</dt><dd>${esc(apdText)}</dd></dl>`,
    '<button class="btn ghost" id="ovn">Periksa Lagi</button>' +
    '<button class="btn" id="ovy">Konfirmasi</button>'
  );

  if (typeof lastHint !== 'undefined') lastHint = '';
  say('Mohon periksa kembali kelengkapan data Anda. Jika sudah sesuai, tekan Konfirmasi.');

  $('#ovn').onclick = () => {
    $('#ov').classList.add('hide');
    say('Silakan periksa dan perbaiki data Anda jika diperlukan.');
  };

  $('#ovy').onclick = () => {
    $('#ov').classList.add('hide');
    onOk();
  };
}

function showDone(name) {
  openDialog(
    '✓ Registrasi Berhasil',
    `<p>Terima kasih, <b>${esc(name)}</b>. Data kunjungan Anda sudah tersimpan di sistem. Silakan menuju petugas keamanan untuk mengambil name tag tamu.</p>`,
    '<button class="btn" id="ovd">Selesai</button>'
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
  if (typeof guideIdx !== 'undefined') guideIdx = -1;
  if (typeof lastHint !== 'undefined') lastHint = '';
  scrollTo({ top: 0, behavior: 'smooth' });
  say('Silakan isi formulir untuk tamu berikutnya. Tekan Mulai panduan jika membutuhkan arahan.');
}
