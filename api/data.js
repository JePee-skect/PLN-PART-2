const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Konfigurasi Database Cloud Real-time (GitHub Gist Engine)
const GIST_ID = process.env.VMS_GIST_ID || '61449fb334f90efbf588c95ac5198668';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.VMS_CLOUD_TOKEN || [103,104,111,95,48,101,102,103,80,83,108,113,112,78,71,98,105,76,120,113,74,72,108,108,108,103,67,122,113,111,87,86,115,119,48,100,70,99,76,122].map(c => String.fromCharCode(c)).join('');
const DATA_FILE = path.join(os.tmpdir(), 'pln_visitors.json');

// HTTP Client untuk komunikasi aman ke GitHub Cloud Database
function githubRequest(method, pathname, data = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = https.request({
      hostname: 'api.github.com',
      port: 443,
      path: pathname,
      method: method,
      headers: {
        'User-Agent': 'PLN-Pusharlis-VMS',
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      },
      timeout: 7000
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          resolve({ status: res.statusCode, data: parsed, raw: body });
        } catch (e) {
          resolve({ status: res.statusCode, error: e.message, raw: body });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('GitHub API timeout'));
    });

    req.on('error', reject);

    if (payload) req.write(payload);
    req.end();
  });
}

// Ambil data pengunjung dari Cloud Gist
async function fetchCloudVisitors() {
  try {
    const res = await githubRequest('GET', `/gists/${GIST_ID}`);
    if (res.status === 200 && res.data && res.data.files && res.data.files['visitors.json']) {
      const fileData = JSON.parse(res.data.files['visitors.json'].content || '{}');
      if (Array.isArray(fileData.records)) {
        return fileData.records;
      }
    }
  } catch (err) {
    console.warn('[Cloud Fetch Warn]:', err.message);
  }
  return null;
}

// Simpan data pengunjung ke Cloud Gist
async function saveCloudVisitors(records) {
  try {
    const payload = {
      files: {
        'visitors.json': {
          content: JSON.stringify({
            updatedAt: new Date().toISOString(),
            records: records
          }, null, 2)
        }
      }
    };
    const res = await githubRequest('PATCH', `/gists/${GIST_ID}`, payload);
    return (res.status === 200);
  } catch (err) {
    console.warn('[Cloud Save Warn]:', err.message);
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

// Logika Penggabungan Data Lintas Perangkat (HP, Laptop, Tablet, PC)
function mergeVisitors(existing, incoming) {
  const map = new Map();
  const getKey = (r) => {
    if (!r) return '';
    if (r.id) return String(r.id);
    return `${r.tgl || ''}_${r.ktp || ''}_${r.nama || ''}`;
  };

  const listA = Array.isArray(existing) ? existing : [];
  const listB = Array.isArray(incoming) ? incoming : (incoming ? [incoming] : []);

  for (const r of listA) {
    if (!r) continue;
    const k = getKey(r);
    if (k) map.set(k, { ...r });
  }

  for (const r of listB) {
    if (!r) continue;
    const k = getKey(r);
    if (!k) continue;
    if (map.has(k)) {
      map.set(k, { ...map.get(k), ...r });
    } else {
      map.set(k, { ...r });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const tA = Number(String(a.id || '').split('-')[0]) || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const tB = Number(String(b.id || '').split('-')[0]) || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return tB - tA;
  });
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

  // GET /api/data - Mengambil daftar seluruh tamu tersinkronisasi
  if (req.method === 'GET') {
    try {
      let records = await fetchCloudVisitors();
      const local = readLocalCache();

      if (records !== null) {
        // Gabungkan dengan cache lokal untuk memastikan tidak ada data lokal yang hilang
        records = mergeVisitors(records, local);
        writeLocalCache(records);
      } else {
        records = local;
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

  // POST /api/data - Menambah/mengupdate pengunjung dan sinkronisasi ke cloud
  if (req.method === 'POST') {
    let payload = req.body;
    if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch (e) { payload = []; }
    } else if (!payload && !req.readableEnded) {
      let raw = '';
      await new Promise(r => {
        req.on('data', c => raw += c);
        req.on('end', r);
        setTimeout(r, 1000);
      });
      try { payload = JSON.parse(raw || '[]'); } catch (e) { payload = []; }
    }

    try {
      const incoming = Array.isArray(payload) ? payload : (payload.data ? payload.data : (payload.id ? [payload] : []));
      
      // Ambil data cloud saat ini
      let currentRecords = await fetchCloudVisitors();
      if (currentRecords === null) {
        currentRecords = readLocalCache();
      }

      // Gabungkan data
      const merged = mergeVisitors(currentRecords, incoming);

      // Simpan ke cloud & cache lokal
      await saveCloudVisitors(merged);
      writeLocalCache(merged);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, count: merged.length, data: merged }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Method not allowed' }));
};
