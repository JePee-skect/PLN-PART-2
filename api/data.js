const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Konfigurasi Database Supabase PostgreSQL
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ngvvyvsyjucykuiqbsrr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndnZ5dnN5anVjeWt1aXFic3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU1NTE3MjksImV4cCI6MjExMTEyNzcyOX0._Dz3au1jE0bYqkBve5-j2VKldfiFeIqbWBRBfy5FMGg';
const DATA_FILE = path.join(os.tmpdir(), 'pln_visitors.json');

// Helper Validasi Otomatis Briefing K3 (Nama, PT, No. KTP)
const BRIEFING_INVALID_PLACEHOLDERS = new Set([
  '-', '--', 'tidak ada', 'none', 'pribadi', 'individu', 'umum',
  'perorangan', 'n/a', 'na', 'null', 'undefined'
]);

function normalizeKtp(ktp) {
  if (!ktp) return '';
  const digits = String(ktp).replace(/\D/g, '').trim();
  if (digits.length < 6 || /^0+$/.test(digits)) return '';
  return digits;
}

function normalizeCompany(usaha) {
  if (!usaha) return '';
  let str = String(usaha).toLowerCase().trim();
  if (BRIEFING_INVALID_PLACEHOLDERS.has(str)) return '';
  str = str.replace(/^(pt|cv|ud|po|fa|nv|pd|perum|koperasi|yayasan)\.?\s+/gi, '');
  str = str.replace(/\s+(tbk|ltd|inc|co)\.?$/gi, '');
  str = str.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (str.length < 3 || BRIEFING_INVALID_PLACEHOLDERS.has(str)) return '';
  return str;
}

function normalizePersonName(name) {
  if (!name) return '';
  let str = String(name).toLowerCase().trim();
  if (BRIEFING_INVALID_PLACEHOLDERS.has(str)) return '';
  str = str.replace(/^(bapak|bpk|ibu|bu|sdr|sdri|mr|mrs|ms|dr|ir|h|hj)\.?\s+/gi, '');
  str = str.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (str.length < 3 || BRIEFING_INVALID_PLACEHOLDERS.has(str)) return '';
  return str;
}

function matchesVisitorIdentity(target, source) {
  if (!target || !source) return false;
  const k1 = normalizeKtp(target.ktp);
  const k2 = normalizeKtp(source.ktp);
  if (k1 && k2 && k1 === k2) return true;

  const u1 = normalizeCompany(target.usaha);
  const u2 = normalizeCompany(source.usaha);
  if (u1 && u2) {
    if (u1 === u2) return true;
    if (u1.length >= 4 && u2.length >= 4 && (u1.includes(u2) || u2.includes(u1))) return true;
  }

  const n1 = normalizePersonName(target.nama);
  const n2 = normalizePersonName(source.nama);
  if (n1 && n2) {
    const n1Ph = n1.replace(/y/g, 'i');
    const n2Ph = n2.replace(/y/g, 'i');
    if (n1 === n2 || n1Ph === n2Ph) return true;
    // Toleransi spasi: "jepe cuy" vs "jepecuy"
    const n1Flat = n1Ph.replace(/\s+/g, '');
    const n2Flat = n2Ph.replace(/\s+/g, '');
    if (n1Flat && n2Flat && n1Flat === n2Flat) return true;
    // Toleransi nama tidak lengkap: "jepe" cocok dengan "jepecuy" (prefix >= 3 karakter)
    if (n1Flat && n2Flat && Math.min(n1Flat.length, n2Flat.length) >= 3) {
      const shorter = n1Flat.length <= n2Flat.length ? n1Flat : n2Flat;
      const longer  = n1Flat.length <= n2Flat.length ? n2Flat : n1Flat;
      if (longer.startsWith(shorter)) return true;
    }
    const w1 = n1Ph.split(' ').filter(Boolean);
    const w2 = n2Ph.split(' ').filter(Boolean);
    if (Math.min(w1.length, w2.length) >= 2 && (n1Ph.startsWith(n2Ph + ' ') || n2Ph.startsWith(n1Ph + ' '))) {
      return true;
    }
  }
  return false;
}

// HTTP Client untuk komunikasi aman ke Supabase REST API
function supabaseRequest(method, endpoint, body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const url = new URL(SUPABASE_URL + endpoint);
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...extraHeaders,
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      },
      timeout: 8000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data || '{}');
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, error: e.message });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Supabase request timeout'));
    });
    req.on('error', reject);

    if (payload) req.write(payload);
    req.end();
  });
}

// Ambil seluruh data pengunjung dari Supabase
async function fetchSupabaseVisitors() {
  try {
    const res = await supabaseRequest('GET', '/rest/v1/visitors?select=*&order=tgl.desc,id.desc');
    if (res.status === 200 && Array.isArray(res.data)) {
      return res.data.map(r => {
        const isBriefed = (r.briefed === true || r.briefed === 'true' || r.briefed === 1 || String(r.apd || '').includes('[K3_BRIEFED]'));
        return {
          ...r,
          briefed: isBriefed
        };
      });
    }
  } catch (err) {
    console.warn('[Supabase Fetch Warn]:', err.message);
  }
  return null;
}

// Simpan atau perbarui data pengunjung (Upsert)
async function upsertSupabaseVisitors(records) {
  try {
    const list = Array.isArray(records) ? records : [records];
    if (list.length === 0) return true;
    const rows = list.map(r => {
      const isBriefed = (r.briefed === true || r.briefed === 'true' || r.briefed === 1 || String(r.apd || '').includes('[K3_BRIEFED]'));

      // Sinkronkan tag [K3_BRIEFED] ke kolom apd sebagai jaminan cloud persistence
      let apdStr = Array.isArray(r.apd) ? r.apd.join(', ') : String(r.apd || '');
      apdStr = apdStr.replace(/\|?\s*\[K3_BRIEFED\]/gi, '').trim();
      if (isBriefed) {
        apdStr = apdStr ? `${apdStr} | [K3_BRIEFED]` : '[K3_BRIEFED]';
      }

      return {
        id: String(r.id),
        tgl: r.tgl || null,
        nama: r.nama || null,
        usaha: r.usaha || null,
        alamat: r.alamat || null,
        pegawai: r.pegawai || null,
        perlu: r.perlu || null,
        ktp: r.ktp || null,
        kend: r.kend || null,
        tag: r.tag || null,
        jml: r.jml ? String(r.jml) : null,
        apd: apdStr || null,
        foto: r.foto || null,
        status: r.status || 'Check In',
        briefed: isBriefed,
        inAt: r.inAt || (r.status === 'Selesai' ? null : (r.tgl || new Date().toISOString().slice(0, 10))),
        outAt: r.outAt || null,
        createdAt: r.createdAt || new Date().toISOString()
      };
    });

    let res = await supabaseRequest('POST', '/rest/v1/visitors', rows, {
      'Prefer': 'resolution=merge-duplicates,return=representation'
    });

    // Fallback otomatis jika kolom 'briefed' belum dibuat di tabel Supabase
    if (res.status === 400 && res.raw && res.raw.includes('briefed')) {
      const rowsWithoutBriefed = rows.map(({ briefed, ...rest }) => rest);
      res = await supabaseRequest('POST', '/rest/v1/visitors', rowsWithoutBriefed, {
        'Prefer': 'resolution=merge-duplicates,return=representation'
      });
    }

    return (res.status === 200 || res.status === 201);
  } catch (err) {
    console.warn('[Supabase Upsert Warn]:', err.message);
    return false;
  }
}

// Hapus satu data pengunjung dari Supabase
async function deleteSupabaseVisitor(id) {
  try {
    const res = await supabaseRequest('DELETE', `/rest/v1/visitors?id=eq.${encodeURIComponent(id)}`);
    return (res.status === 200 || res.status === 204);
  } catch (err) {
    console.warn('[Supabase Delete Warn]:', err.message);
    return false;
  }
}

// Fallback cache lokal di /tmp
function readLocalCache() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : (parsed.data || []);
    }
  } catch (e) {}
  return [];
}

function writeLocalCache(records) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ success: true, data: records }, null, 2), 'utf-8');
  } catch (e) {}
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /api/data - Mengambil daftar seluruh tamu
  if (req.method === 'GET') {
    try {
      let records = await fetchSupabaseVisitors();
      if (records !== null) {
        writeLocalCache(records);
      } else {
        records = readLocalCache();
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: records.length, data: records }));
    } catch (e) {
      const fallback = readLocalCache();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: fallback.length, data: fallback }));
    }
    return;
  }

  // POST /api/data - Menambah/mengupdate/menghapus pengunjung
  if (req.method === 'POST') {
    let payload = req.body;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch (e) { payload = {}; }
    } else if (!payload && !req.readableEnded) {
      let raw = '';
      await new Promise(r => {
        req.on('data', c => raw += c);
        req.on('end', r);
        setTimeout(r, 1000);
      });
      try { payload = JSON.parse(raw || '{}'); } catch (e) { payload = {}; }
    }

    try {
      // Aksi Hapus Pengunjung Tunggal
      if (payload && payload.action === 'delete' && payload.deleteId) {
        const delId = String(payload.deleteId);
        await deleteSupabaseVisitor(delId);
        let current = await fetchSupabaseVisitors();
        if (!current) current = readLocalCache().filter(r => String(r.id) !== delId);
        writeLocalCache(current);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, count: current.length, data: current }));
        return;
      }

      const incoming = Array.isArray(payload) ? payload : (payload.data ? payload.data : (payload.id ? [payload] : []));
      let processedIncoming = incoming;

      if (incoming.length > 0) {
        const needsCheck = incoming.some(r => r && r._isNewRegistration && !r._manualBriefingOff && !r.briefed);
        if (needsCheck) {
          let existing = await fetchSupabaseVisitors();
          if (!existing) existing = readLocalCache();
          processedIncoming = incoming.map(r => {
            if (r && r._isNewRegistration && !r._manualBriefingOff) {
              const already = (r.briefed === true || r.briefed === 'true' || r.briefed === 1 || String(r.apd || '').includes('[K3_BRIEFED]'));
              const matched = !already && Array.isArray(existing) && existing.some(prev => {
                if (!prev || (prev.id && r.id && String(prev.id) === String(r.id))) return false;
                const wasBriefed = (prev.briefed === true || prev.briefed === 'true' || prev.briefed === 1 || String(prev.apd || '').includes('[K3_BRIEFED]'));
                return wasBriefed && matchesVisitorIdentity(r, prev);
              });
              if (matched) {
                let apdStr = Array.isArray(r.apd) ? r.apd.join(', ') : String(r.apd || '');
                apdStr = apdStr.replace(/\|?\s*\[K3_BRIEFED\]/gi, '').trim();
                return {
                  ...r,
                  briefed: true,
                  apd: apdStr ? `${apdStr} | [K3_BRIEFED]` : '[K3_BRIEFED]'
                };
              }
            }
            return r;
          });
        }
        await upsertSupabaseVisitors(processedIncoming);
      }

      let updated = await fetchSupabaseVisitors();
      if (!updated) {
        const local = readLocalCache();
        const map = new Map(local.map(x => [String(x.id), x]));
        for (const item of processedIncoming) {
          const cleanItem = { ...item };
          delete cleanItem._isNewRegistration;
          delete cleanItem._manualBriefingOff;
          const isBriefed = (cleanItem.briefed === true || cleanItem.briefed === 'true' || cleanItem.briefed === 1 || String(cleanItem.apd || '').includes('[K3_BRIEFED]'));
          map.set(String(cleanItem.id), { ...cleanItem, briefed: isBriefed });
        }
        updated = Array.from(map.values()).sort((a, b) => {
          const tA = Number(String(a.id || '').split('-')[0]) || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const tB = Number(String(b.id || '').split('-')[0]) || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return tB - tA;
        });
      }
      writeLocalCache(updated);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: updated.length, data: updated }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
};
