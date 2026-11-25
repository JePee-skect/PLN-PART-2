/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   Dashboard Admin: Tabel Data Tamu, Check-in/out & Export Excel
   ===================================================================== */

function initDashboard() {
  if ($('#d1') && $('#d2')) {
    $('#d1').value = $('#d2').value = ymd();
  }
  updateFilterButtons();

  const btnShowAll = $('#btn-show-all');
  if (btnShowAll) {
    btnShowAll.onclick = () => {
      if ($('#d1')) $('#d1').value = '';
      if ($('#d2')) $('#d2').value = '';
      updateFilterButtons();
      renderTable();
      if (typeof say === 'function') {
        say(`Menampilkan seluruh data tamu yang hadir, total ${data.length} pengunjung.`);
      }
    };
  }

  const btnShowToday = $('#btn-show-today');
  if (btnShowToday) {
    btnShowToday.onclick = () => {
      const today = ymd();
      if ($('#d1')) $('#d1').value = today;
      if ($('#d2')) $('#d2').value = today;
      updateFilterButtons();
      renderTable();
      if (typeof say === 'function') {
        const count = data.filter((r) => r.tgl === today).length;
        say(`Menampilkan data tamu hari ini, total ${count} pengunjung.`);
      }
    };
  }

  // Sinkronisasi data awal & polling otomatis per 5 detik untuk admin dashboard
  if (typeof fetchVisitorsFromServer === 'function') {
    fetchVisitorsFromServer();
    if (!window._vmsDashPoll) {
      window._vmsDashPoll = setInterval(() => {
        const dash = $('#v-dashboard') || $('#dashboard');
        if (dash && !dash.classList.contains('hide')) {
          fetchVisitorsFromServer();
        }
      }, 5000);
    }
  }

  ['d1', 'd2', 'q'].forEach((id) => {
    const el = $('#' + id);
    if (el) el.oninput = renderTable;
  });

  const tb = $('#tb');
  if (tb) {
    tb.onclick = (e) => {
      const btn = e.target.closest('button[data-id]');
      if (!btn) return;

      const id = btn.dataset.id;
      const action = btn.dataset.action;

      if (action === 'detail') {
        showVisitorDetail(id);
        return;
      }

      if (action === 'toggle-briefing') {
        const isK3 = (typeof adminRole !== 'undefined' && adminRole === 'admink3');
        if (!isK3) {
          if (typeof say === 'function') {
            say('Hanya Admin K3 yang memiliki wewenang untuk mengubah status briefing.');
          }
          alert('Perhatian: Fitur status briefing ini hanya dapat diubah oleh Petugas Admin K3 (ADMINK3).');
          return;
        }

        const r = data.find((x) => String(x.id) === String(id));
        if (!r) return;

        const currentBriefed = (r.briefed === true || r.briefed === 'true' || r.briefed === 1 || String(r.apd || '').includes('[K3_BRIEFED]'));
        r.briefed = !currentBriefed;

        // Update tag APD untuk redundansi cloud database
        let apdStr = Array.isArray(r.apd) ? r.apd.join(', ') : String(r.apd || '');
        apdStr = apdStr.replace(/\|?\s*\[K3_BRIEFED\]/gi, '').trim();
        if (r.briefed) {
          apdStr = apdStr ? `${apdStr} | [K3_BRIEFED]` : '[K3_BRIEFED]';
        }
        r.apd = apdStr;

        // Simpan langsung ke cache lokal & storage persistent
        const briefedMap = (typeof store !== 'undefined' ? store.get('vms-briefed-ids', {}) : {}) || {};
        briefedMap[String(r.id)] = r.briefed;
        if (typeof store !== 'undefined') {
          store.set('vms-briefed-ids', briefedMap);
          store.set('vms-data', data);
        }

        renderTable();
        if (typeof syncDataToServer === 'function') syncDataToServer(r);

        const msg = r.briefed
          ? `Tamu ${r.nama} telah selesai diberikan safety briefing K3.`
          : `Status safety briefing untuk ${r.nama} diubah menjadi belum briefing.`;
        if (typeof say === 'function') say(msg);
        return;
      }

      const r = data.find((x) => String(x.id) === String(id));
      if (!r) return;

      if (r.status === 'Menunggu') {
        r.status = 'Check In';
        r.inAt   = ymd();
      } else {
        r.status = 'Selesai';
        r.outAt  = ymd();
      }

      store.set('vms-data', data);
      if (typeof syncDataToServer === 'function') syncDataToServer(r);
      renderTable();

      const msg = (r.status === 'Check In')
        ? `${r.nama} berhasil check in. Silakan masuk.`
        : `${r.nama} sudah check out. Terima kasih atas kunjungannya.`;
      say(msg);
    };
  }

  const btnXl = $('#xl');
  if (btnXl) {
    btnXl.onclick = () => exportToExcel();
  }
}

function exportToExcel() {
  if (!data || data.length === 0) {
    alert('Belum ada data tamu untuk diekspor ke Excel.');
    return;
  }

  const today = ymd();
  const fileName = `Data_Tamu_PLN_Pusharlis_${today}.xlsx`;

  // Ambil filter yang sedang aktif jika ada
  const from  = $('#d1') ? $('#d1').value : '';
  const to    = $('#d2') ? $('#d2').value : '';
  const query = $('#q') ? $('#q').value.toLowerCase() : '';

  const filteredData = data.filter((r) => {
    const matchDate  = (!from || r.tgl >= from) && (!to || r.tgl <= to);
    const matchQuery = !query || r.nama.toLowerCase().includes(query);
    return matchDate && matchQuery;
  });

  const exportRows = (filteredData.length > 0) ? filteredData : data;

  const headers = [
    'No',
    'Tanggal Kunjungan',
    'Nama Tamu',
    'No. KTP / Identitas',
    'Nama Perusahaan',
    'Alamat Perusahaan',
    'Pegawai Yang Dituju',
    'Pemakaian APD',
    'Keperluan Kunjungan',
    'Kendaraan (Jenis / No.Pol)',
    'No Name Tag Tamu',
    'Jumlah Tamu',
    'Status Kunjungan',
    'Status Briefing K3'
  ];

  // Susun data dengan nomor KTP dan Name Tag sebagai STRING murni
  const rows = exportRows.map((r, i) => [
    i + 1,
    r.tgl || '',
    r.nama || '',
    String(r.ktp || ''), // Memastikan string murni agar tidak menjadi format ilmiah 1.26E+15
    r.usaha || '',
    r.alamat || '',
    r.pegawai || '',
    Array.isArray(r.apd) ? r.apd.join(', ') : String(r.apd || '').replace(/\|?\s*\[K3_BRIEFED\]/gi, '').trim(),
    r.perlu || '',
    r.kend || '',
    String(r.tag || ''),
    Number(r.jml) || 1,
    r.status || '',
    (r.briefed === true || r.briefed === 'true' || r.briefed === 1) ? 'Sudah Briefing' : 'Belum Briefing'
  ]);

  // JIKA LIBRARY XLSX (SheetJS) TERSEDIA
  if (typeof XLSX !== 'undefined') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Format kolom No. KTP (c:3) dan Name Tag (c:10)
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      [3, 10].forEach((cIdx) => {
        const cellRef = XLSX.utils.encode_cell({ r: R, c: cIdx });
        if (ws[cellRef]) {
          ws[cellRef].t = 's'; // Tipe data teks (String)
          ws[cellRef].z = '@'; // Format angka sebagai teks di Excel
        }
      });
    }

    // Penataan lebar kolom agar rapi saat dibuka di Microsoft Excel
    ws['!cols'] = [
      { wch: 6 },  // No
      { wch: 18 }, // Tanggal
      { wch: 25 }, // Nama Tamu
      { wch: 24 }, // No KTP
      { wch: 26 }, // Perusahaan
      { wch: 30 }, // Alamat
      { wch: 24 }, // Pegawai Dituju
      { wch: 30 }, // APD
      { wch: 32 }, // Keperluan
      { wch: 22 }, // Kendaraan
      { wch: 18 }, // Name Tag
      { wch: 12 }, // Jumlah
      { wch: 16 }, // Status
      { wch: 20 }  // Status Briefing
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Data Tamu');

    // Buat file blob .xlsx dan unduh langsung secara instan
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    downloadBlob(blob, fileName);
    if (typeof say === 'function') {
      say('File Excel berhasil diunduh. Silakan buka file tersebut untuk melihat data tamu.');
    }
    return;
  }

  // FALLBACK NATIVE XML: Jika XLSX belum termuat, unduh format SpreadsheetML .xls
  downloadExcelXmlFallback(headers, rows, fileName.replace('.xlsx', '.xls'));
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function downloadExcelXmlFallback(headers, rows, fileName) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<?mso-application progid="Excel.Sheet"?>\n' +
    '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n' +
    ' xmlns:o="urn:schemas-microsoft-com:office:office"\n' +
    ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n' +
    ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">\n' +
    '<Styles>\n' +
    ' <Style ss:ID="Header">\n' +
    '  <Font ss:Bold="1" ss:Color="#FFFFFF"/>\n' +
    '  <Interior ss:Color="#17435A" ss:Pattern="Solid"/>\n' +
    '  <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\n' +
    ' </Style>\n' +
    ' <Style ss:ID="TextFormat">\n' +
    '  <NumberFormat ss:Format="@"/>\n' +
    ' </Style>\n' +
    '</Styles>\n' +
    '<Worksheet ss:Name="Data Tamu">\n' +
    '<Table>\n' +
    '<Row ss:StyleID="Header">\n';

  headers.forEach((h) => {
    xml += ` <Cell><Data ss:Type="String">${esc(h)}</Data></Cell>\n`;
  });
  xml += '</Row>\n';

  rows.forEach((row) => {
    xml += '<Row>\n';
    row.forEach((val, colIdx) => {
      const isNum = (colIdx === 0 || colIdx === 11) && !isNaN(val) && val !== '';
      const type = isNum ? 'Number' : 'String';
      const styleAttr = (colIdx === 3 || colIdx === 10) ? ' ss:StyleID="TextFormat"' : '';
      xml += ` <Cell${styleAttr}><Data ss:Type="${type}">${esc(String(val))}</Data></Cell>\n`;
    });
    xml += '</Row>\n';
  });

  xml += '</Table>\n</Worksheet>\n</Workbook>';

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
  downloadBlob(blob, fileName);
  if (typeof say === 'function') {
    say('File Excel berhasil diunduh. Silakan buka file tersebut untuk melihat data.');
  }
}

function formatApdBadges(apd) {
  if (!apd) return '<span class="apd-tag none">Tidak Ada</span>';
  let rawApd = Array.isArray(apd) ? apd.join(', ') : String(apd);
  rawApd = rawApd.replace(/\|?\s*\[K3_BRIEFED\]/gi, '').trim();
  if (!rawApd) return '<span class="apd-tag none">Tidak Ada</span>';
  if (rawApd.toLowerCase().includes('tidak')) {
    return '<span class="apd-tag none">⚠️ Tidak memakai APD</span>';
  }
  const list = rawApd.split(',').map(s => s.trim()).filter(Boolean);
  if (list.length === 0) return '<span class="apd-tag none">Tidak Ada</span>';
  return list.map(item => `<span class="apd-tag">${esc(item)}</span>`).join(' ');
}

function formatStatusBadge(status) {
  if (status === 'Check In') {
    return '<span class="status-badge in">🟢 Check In</span>';
  }
  if (status === 'Selesai') {
    return '<span class="status-badge done">⚪ Selesai</span>';
  }
  return '<span class="status-badge wait">🟡 Menunggu</span>';
}

function showVisitorDetail(id) {
  const r = data.find((x) => String(x.id) === String(id));
  if (!r) return;

  const photoSrc = r.foto || PHOTO_PLACEHOLDER;
  const apdDisplay = formatApdBadges(r.apd);
  const statusDisplay = formatStatusBadge(r.status);

  const detailHtml = `
    <div class="visitor-detail-modal" style="display:flex;flex-direction:column;gap:16px;">
      <div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap;">
        <div style="flex-shrink:0;text-align:center;margin:0 auto;">
          <img src="${photoSrc}" alt="${esc(r.nama)}" style="width:130px;height:175px;object-fit:cover;border-radius:10px;border:2px solid var(--acc);box-shadow:0 6px 18px rgba(0,0,0,0.35);">
          <div style="margin-top:6px;font-size:11px;color:var(--muted);font-family:monospace;">ID: ${esc(String(r.id))}</div>
        </div>
        <div style="flex:1;min-width:200px;">
          <h3 style="margin:0 0 6px;color:var(--pri);font-size:19px;">${esc(r.nama)}</h3>
          <div style="margin-bottom:10px;">${statusDisplay}</div>
          <div style="font-size:13px;line-height:1.65;">
            <div>🏢 <b>Nama Perusahaan:</b> ${esc(r.usaha || '—')}</div>
            <div>📍 <b>Alamat Perusahaan:</b> ${esc(r.alamat || '—')}</div>
            <div>👤 <b>Pegawai PLN Tujuan:</b> ${esc(r.pegawai || '—')}</div>
            <div>🎯 <b>Keperluan:</b> ${esc(r.perlu || '—')}</div>
          </div>
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.04);border:1px solid var(--line);border-radius:10px;padding:12px 14px;font-size:13px;display:grid;grid-template-columns:repeat(auto-fit, minmax(180px, 1fr));gap:10px;">
        <div><b>🪪 No. KTP / Identitas:</b><br><span style="font-family:monospace;letter-spacing:1px;font-weight:600;">${esc(r.ktp || '—')}</span></div>
        <div><b>🏷️ No. Name Tag:</b><br><span class="tag-badge">${esc(r.tag || '—')}</span></div>
        <div><b>🚗 Kendaraan:</b><br>${esc(r.kend || '—')}</div>
        <div><b>👥 Jumlah Tamu:</b><br>${esc(r.jml || '1')} Orang</div>
        <div><b>📅 Tanggal Masuk:</b><br>${esc(r.tgl || '—')}</div>
        <div><b>⏱️ Waktu Check In:</b><br>${esc(r.inAt || '—')}</div>
        <div><b>🕒 Waktu Check Out:</b><br>${esc(r.outAt || '—')}</div>
        <div><b>🛡️ Safety Briefing K3:</b><br>${(r.briefed === true || r.briefed === 'true' || r.briefed === 1) ? '<span style="color:#27ae60;font-weight:700;">✅ Sudah Dibriefing</span>' : '<span style="color:#e5483b;font-weight:700;">❌ Belum Dibriefing</span>'}</div>
      </div>

      <div>
        <b style="font-size:13px;display:block;margin-bottom:6px;">🦺 Pemakaian APD Standar K3LH:</b>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${apdDisplay}</div>
      </div>
    </div>
  `;

  const isBriefed = (r.briefed === true || r.briefed === 'true' || r.briefed === 1);
  const isK3 = (typeof adminRole !== 'undefined' && adminRole === 'admink3');

  let actionBtns = `<button class="btn ghost" onclick="$('#ov').classList.add('hide')">Tutup</button>`;
  actionBtns += `<button class="btn ghost" style="color:#e5483b;border-color:rgba(229,72,59,0.5);" onclick="deleteVisitor('${r.id}')" title="Hapus data tamu ini"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:4px;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>Hapus</button>`;

  if (isK3) {
    const briefActionLabel = isBriefed
      ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:4px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>Batal Briefing'
      : '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px;margin-right:4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>Selesai Briefing';
    actionBtns += `<button class="btn ghost" style="border-color:${isBriefed ? '#e5483b' : '#27ae60'};color:${isBriefed ? '#e5483b' : '#27ae60'};" onclick="toggleVisitorBriefing('${r.id}')" title="Ubah status safety briefing (Khusus Admin K3)">${briefActionLabel}</button>`;
  }

  if (r.status === 'Menunggu') {
    actionBtns += `<button class="btn" onclick="updateVisitorStatus('${r.id}', 'Check In')">Check In Sekarang</button>`;
  } else if (r.status === 'Check In') {
    actionBtns += `<button class="btn" onclick="updateVisitorStatus('${r.id}', 'Selesai')">Check Out Sekarang</button>`;
  }

  if (typeof openDialog === 'function') {
    openDialog('Rincian Lengkap Data Tamu PLN', detailHtml, actionBtns);
  }
}

function toggleVisitorBriefing(id) {
  const isK3 = (typeof adminRole !== 'undefined' && adminRole === 'admink3');
  if (!isK3) {
    alert('Perhatian: Fitur status briefing ini hanya dapat diubah oleh Petugas Admin K3 (ADMINK3).');
    return;
  }
  const r = data.find((x) => String(x.id) === String(id));
  if (!r) return;
  const currentBriefed = (r.briefed === true || r.briefed === 'true' || r.briefed === 1 || String(r.apd || '').includes('[K3_BRIEFED]'));
  r.briefed = !currentBriefed;

  let apdStr = Array.isArray(r.apd) ? r.apd.join(', ') : String(r.apd || '');
  apdStr = apdStr.replace(/\|?\s*\[K3_BRIEFED\]/gi, '').trim();
  if (r.briefed) {
    apdStr = apdStr ? `${apdStr} | [K3_BRIEFED]` : '[K3_BRIEFED]';
  }
  r.apd = apdStr;

  const briefedMap = (typeof store !== 'undefined' ? store.get('vms-briefed-ids', {}) : {}) || {};
  briefedMap[String(r.id)] = r.briefed;
  if (typeof store !== 'undefined') {
    store.set('vms-briefed-ids', briefedMap);
    store.set('vms-data', data);
  }

  renderTable();
  showVisitorDetail(id);
  if (typeof syncDataToServer === 'function') syncDataToServer(r);
  const msg = r.briefed
    ? `Tamu ${r.nama} telah selesai diberikan safety briefing K3.`
    : `Status safety briefing untuk ${r.nama} diubah menjadi belum briefing.`;
  if (typeof say === 'function') say(msg);
}

function deleteVisitor(id) {
  const r = data.find((x) => String(x.id) === String(id));
  const nama = r ? r.nama : 'tamu ini';
  if (!confirm(`Apakah Anda yakin ingin menghapus data ${nama}?`)) return;

  data = data.filter((x) => String(x.id) !== String(id));
  store.set('vms-data', data);
  if ($('#ov')) $('#ov').classList.add('hide');
  renderTable();

  // Sinkronkan penghapusan ke cloud server
  if (location.protocol.startsWith('http')) {
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', deleteId: String(id) })
    }).catch(() => {});
  }
}

function updateVisitorStatus(id, newStatus) {
  const r = data.find((x) => String(x.id) === String(id));
  if (!r) return;
  r.status = newStatus;
  if (newStatus === 'Check In') r.inAt = ymd();
  if (newStatus === 'Selesai') r.outAt = ymd();
  store.set('vms-data', data);
  if (typeof syncDataToServer === 'function') syncDataToServer(r);
  renderTable();
  if ($('#ov')) $('#ov').classList.add('hide');
  if (typeof say === 'function') {
    say(`${r.nama} berhasil diubah statusnya menjadi ${newStatus}.`);
  }
}

window.showVisitorDetail = showVisitorDetail;
window.updateVisitorStatus = updateVisitorStatus;
window.deleteVisitor = deleteVisitor;
window.toggleVisitorBriefing = toggleVisitorBriefing;

function updateDbStatus(isConnected, count = (data || []).length) {}
window.updateDbStatus = updateDbStatus;

function updateFilterButtons() {
  const d1Val = $('#d1') ? $('#d1').value : '';
  const d2Val = $('#d2') ? $('#d2').value : '';
  const today = ymd();

  const isToday = (d1Val === today && d2Val === today);
  const isAll = (!d1Val && !d2Val);

  if ($('#btn-show-today')) $('#btn-show-today').classList.toggle('on', isToday);
  if ($('#btn-show-all')) $('#btn-show-all').classList.toggle('on', isAll);
}
window.updateFilterButtons = updateFilterButtons;

function renderTable() {
  const tb = $('#tb');
  if (!tb) return;
  updateFilterButtons();

  const today = ymd();
  const from  = $('#d1') ? $('#d1').value : '';
  const to    = $('#d2') ? $('#d2').value : '';
  const query = $('#q') ? $('#q').value.trim().toLowerCase() : '';

  if ($('#s1')) $('#s1').textContent = data.filter((r) => r.tgl === today).length;
  if ($('#s2')) $('#s2').textContent = data.filter((r) => r.inAt === today).length;
  if ($('#s3')) $('#s3').textContent = data.filter((r) => r.outAt === today).length;

  const rows = data.filter((r) => {
    const matchDate  = (!from || r.tgl >= from) && (!to || r.tgl <= to);
    const matchQuery = !query || (r.nama && r.nama.toLowerCase().includes(query)) || (r.usaha && r.usaha.toLowerCase().includes(query));
    return matchDate && matchQuery;
  });

  const getActionBtn = (r) => {
    if (r.status === 'Selesai') {
      return `<button class="btn sm ghost" data-action="detail" data-id="${r.id}" title="Lihat detail lengkap" style="display:inline-flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><span>Detail</span></button>`;
    }
    const label = r.status === 'Menunggu' ? 'Check In' : 'Check Out';
    return `
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn sm" data-action="status" data-id="${r.id}">${label}</button>
        <button class="btn sm ghost" data-action="detail" data-id="${r.id}" title="Lihat detail lengkap" style="display:inline-flex;align-items:center;gap:4px;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><span>Detail</span></button>
      </div>
    `;
  };

  const getBriefingBtn = (r) => {
    const isBriefed = (r.briefed === true || r.briefed === 'true' || r.briefed === 1 || String(r.apd || '').includes('[K3_BRIEFED]'));
    const isK3 = (typeof adminRole !== 'undefined' && adminRole === 'admink3');

    const checkIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    const crossIcon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;

    if (isBriefed) {
      if (isK3) {
        return `<button class="btn sm" data-action="toggle-briefing" data-id="${r.id}" style="background:#27ae60;border-color:#219150;color:#fff;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;cursor:pointer;padding:5px 11px;font-size:12px;font-weight:600;" title="Klik untuk membatalkan status briefing (Khusus Admin K3)">${checkIcon}<span>Sudah</span></button>`;
      } else {
        return `<button class="btn sm" data-action="toggle-briefing" data-id="${r.id}" disabled style="background:#27ae60;border-color:#219150;color:#fff;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;opacity:0.75;cursor:not-allowed;padding:5px 11px;font-size:12px;font-weight:600;" title="Sudah briefing K3 (Hanya Admin K3 yang dapat mengubah)">${checkIcon}<span>Sudah</span></button>`;
      }
    } else {
      if (isK3) {
        return `<button class="btn sm ghost" data-action="toggle-briefing" data-id="${r.id}" style="color:#e5483b;border-color:rgba(229,72,59,0.6);background:rgba(229,72,59,0.06);white-space:nowrap;display:inline-flex;align-items:center;gap:5px;cursor:pointer;padding:5px 11px;font-size:12px;font-weight:600;" title="Klik untuk menandai sudah briefing K3 (Khusus Admin K3)">${crossIcon}<span>Belum</span></button>`;
      } else {
        return `<button class="btn sm ghost" data-action="toggle-briefing" data-id="${r.id}" disabled style="color:#e5483b;border-color:rgba(229,72,59,0.6);background:rgba(229,72,59,0.06);white-space:nowrap;display:inline-flex;align-items:center;gap:5px;opacity:0.75;cursor:not-allowed;padding:5px 11px;font-size:12px;font-weight:600;" title="Belum briefing K3 (Hanya Admin K3 yang dapat mengubah)">${crossIcon}<span>Belum</span></button>`;
      }
    }
  };

  if (rows.length > 0) {
    tb.innerHTML = rows.map((r, i) => `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td style="text-align:center;">
          <img src="${r.foto || PHOTO_PLACEHOLDER}" alt="${esc(r.nama)}" class="tb-thumb" onclick="showVisitorDetail('${r.id}')" title="Klik untuk lihat foto & detail lengkap">
        </td>
        <td>${r.tgl || '—'}</td>
        <td><strong class="tb-name" onclick="showVisitorDetail('${r.id}')" title="Klik untuk lihat detail">${esc(r.nama)}</strong></td>
        <td class="wrap">${esc(r.usaha || '—')}</td>
        <td class="wrap">${esc(r.pegawai || '—')}</td>
        <td class="wrap">${formatApdBadges(r.apd)}</td>
        <td class="wrap">${esc(r.perlu || '—')}</td>
        <td><span style="font-family:monospace;letter-spacing:0.5px;">${esc(r.ktp || '—')}</span></td>
        <td>${esc(r.kend || '—')}</td>
        <td style="text-align:center;"><span class="tag-badge">${esc(r.tag || '—')}</span></td>
        <td style="text-align:center;">${esc(r.jml || '1')} Orang</td>
        <td style="text-align:center;">${formatStatusBadge(r.status)}</td>
        <td style="text-align:center;">${getBriefingBtn(r)}</td>
        <td>${getActionBtn(r)}</td>
      </tr>
    `).join('');
  } else {
    tb.innerHTML = '<tr><td colspan="15" class="e">Tidak ada data tamu.</td></tr>';
  }
}
