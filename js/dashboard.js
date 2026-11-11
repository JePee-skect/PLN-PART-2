/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   Dashboard Admin: Tabel Data Tamu, Check-in/out & Export Excel
   ===================================================================== */

function initDashboard() {
  if ($('#d1') && $('#d2')) {
    $('#d1').value = $('#d2').value = ymd();
  }

  // Sinkronisasi data awal & polling otomatis per 5 detik untuk admin dashboard
  if (typeof fetchVisitorsFromServer === 'function') {
    fetchVisitorsFromServer();
    if (!window._vmsDashPoll) {
      window._vmsDashPoll = setInterval(() => {
        const dash = $('#dashboard');
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
    'Nama Perusahaan',
    'Pegawai Yang Dituju',
    'Pemakaian APD',
    'Keperluan Kunjungan',
    'No. KTP / Identitas',
    'Kendaraan (Jenis / No.Pol)',
    'No Name Tag Tamu',
    'Jumlah Tamu',
    'Status Kunjungan'
  ];

  // Susun data dengan nomor KTP dan Name Tag sebagai STRING murni
  const rows = exportRows.map((r, i) => [
    i + 1,
    r.tgl || '',
    r.nama || '',
    r.usaha || '',
    r.pegawai || '',
    Array.isArray(r.apd) ? r.apd.join(', ') : (r.apd || ''),
    r.perlu || '',
    String(r.ktp || ''), // Memastikan string murni agar tidak menjadi format ilmiah 1.26E+15
    r.kend || '',
    String(r.tag || ''),
    Number(r.jml) || 1,
    r.status || ''
  ]);

  // JIKA LIBRARY XLSX (SheetJS) TERSEDIA
  if (typeof XLSX !== 'undefined') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Format kolom No. KTP (kolom indeks 7 / kolom H) dan Name Tag (kolom indeks 9 / kolom J)
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const ktpRef = XLSX.utils.encode_cell({ r: R, c: 7 });
      if (ws[ktpRef]) {
        ws[ktpRef].t = 's'; // Tipe data teks (String)
        ws[ktpRef].z = '@'; // Format angka sebagai teks di Excel
      }
      const tagRef = XLSX.utils.encode_cell({ r: R, c: 9 });
      if (ws[tagRef]) {
        ws[tagRef].t = 's';
        ws[tagRef].z = '@';
      }
    }

    // Penataan lebar kolom agar rapi saat dibuka di Microsoft Excel
    ws['!cols'] = [
      { wch: 6 },  // No
      { wch: 18 }, // Tanggal
      { wch: 25 }, // Nama Tamu
      { wch: 26 }, // Perusahaan
      { wch: 24 }, // Pegawai Dituju
      { wch: 30 }, // APD
      { wch: 32 }, // Keperluan
      { wch: 24 }, // No KTP (Lebar pas untuk 16 digit NIK)
      { wch: 22 }, // Kendaraan
      { wch: 18 }, // Name Tag
      { wch: 12 }, // Jumlah
      { wch: 16 }  // Status
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
      const isNum = (colIdx === 0 || colIdx === 10) && !isNaN(val) && val !== '';
      const type = isNum ? 'Number' : 'String';
      const styleAttr = (colIdx === 7 || colIdx === 9) ? ' ss:StyleID="TextFormat"' : '';
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
  if (typeof apd === 'string' && apd.toLowerCase().includes('tidak')) {
    return '<span class="apd-tag none">⚠️ Tidak memakai APD</span>';
  }
  const list = Array.isArray(apd) ? apd : String(apd).split(',').map(s => s.trim()).filter(Boolean);
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
      </div>

      <div>
        <b style="font-size:13px;display:block;margin-bottom:6px;">🦺 Pemakaian APD Standar K3LH:</b>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${apdDisplay}</div>
      </div>
    </div>
  `;

  let actionBtns = `<button class="btn ghost" onclick="$('#ov').classList.add('hide')">Tutup</button>`;
  if (r.status === 'Menunggu') {
    actionBtns += `<button class="btn" onclick="updateVisitorStatus('${r.id}', 'Check In')">Check In Sekarang</button>`;
  } else if (r.status === 'Check In') {
    actionBtns += `<button class="btn" onclick="updateVisitorStatus('${r.id}', 'Selesai')">Check Out Sekarang</button>`;
  }

  if (typeof openDialog === 'function') {
    openDialog('Rincian Lengkap Data Tamu PLN', detailHtml, actionBtns);
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

function renderTable() {
  const tb = $('#tb');
  if (!tb) return;

  const today = ymd();
  const from  = $('#d1') ? $('#d1').value : '';
  const to    = $('#d2') ? $('#d2').value : '';
  const query = $('#q') ? $('#q').value.toLowerCase() : '';

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
      return `<button class="btn sm ghost" data-action="detail" data-id="${r.id}" title="Lihat detail lengkap">🔍 Detail</button>`;
    }
    const label = r.status === 'Menunggu' ? 'Check In' : 'Check Out';
    return `
      <div style="display:flex;gap:6px;align-items:center;">
        <button class="btn sm" data-action="status" data-id="${r.id}">${label}</button>
        <button class="btn sm ghost" data-action="detail" data-id="${r.id}" title="Lihat detail lengkap">🔍 Detail</button>
      </div>
    `;
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
        <td>${getActionBtn(r)}</td>
      </tr>
    `).join('');
  } else {
    tb.innerHTML = '<tr><td colspan="14" class="e">Tidak ada data tamu.</td></tr>';
  }
}
