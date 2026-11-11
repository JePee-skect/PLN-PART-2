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
      const id = e.target.dataset.id;
      if (!id) return;

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
    const matchQuery = !query || r.nama.toLowerCase().includes(query);
    return matchDate && matchQuery;
  });

  const getActionBtn = (r) => {
    if (r.status === 'Selesai') return '—';
    const label = r.status === 'Menunggu' ? 'Check In' : 'Check Out';
    return `<button class="btn sm" data-id="${r.id}">${label}</button>`;
  };

  if (rows.length > 0) {
    tb.innerHTML = rows.map((r, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${r.tgl}</td>
        <td>${esc(r.nama)}</td>
        <td>${esc(r.pegawai)}</td>
        <td>${esc(r.perlu)}</td>
        <td>${r.status}</td>
        <td>${getActionBtn(r)}</td>
      </tr>
    `).join('');
  } else {
    tb.innerHTML = '<tr><td colspan="7" class="e">Tidak ada data tamu.</td></tr>';
  }
}
