const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let MsEdgeTTS, OUTPUT_FORMAT;
try {
  const edgePkg = require('msedge-tts');
  MsEdgeTTS = edgePkg.MsEdgeTTS;
  OUTPUT_FORMAT = edgePkg.OUTPUT_FORMAT;
} catch (e) {
  console.warn('[Warning] msedge-tts package not loaded:', e.message);
}

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const CACHE_DIR = path.join(ROOT, 'audio_cache');
const DEFAULT_KEY = 'ev_a8dd782ce24e59571a03d3cbda4039cd73c68d9a0013647a9d295a6e7cc87e16';

// Pastikan direktori cache audio lokal dan direktori data ada
if (!fs.existsSync(CACHE_DIR)) {
  try { fs.mkdirSync(CACHE_DIR, { recursive: true }); } catch (e) {}
}
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'visitors.json');
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
}

// Konfigurasi Database Supabase PostgreSQL
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ngvvyvsyjucykuiqbsrr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ndnZ5dnN5anVjeWt1aXFic3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU1NTE3MjksImV4cCI6MjExMTEyNzcyOX0._Dz3au1jE0bYqkBve5-j2VKldfiFeIqbWBRBfy5FMGg';

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

async function deleteSupabaseVisitor(id) {
  try {
    const res = await supabaseRequest('DELETE', `/rest/v1/visitors?id=eq.${encodeURIComponent(id)}`);
    return (res.status === 200 || res.status === 204);
  } catch (err) {
    console.warn('[Supabase Delete Warn]:', err.message);
    return false;
  }
}

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

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.mp3':  'audio/mpeg',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

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
    .replace(/1\s*[-–—]\s*99/g, 'satu sampai sembilan puluh sembilan')
    .replace(/([.!?])\s*/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Singleton MsEdgeTTS client
let edgeTtsClient = null;
async function getEdgeTts() {
  if (!MsEdgeTTS) return null;
  try {
    if (!edgeTtsClient) {
      edgeTtsClient = new MsEdgeTTS();
      await edgeTtsClient.setMetadata('id-ID-GadisNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
    }
    return edgeTtsClient;
  } catch (err) {
    console.warn('[EdgeTTS Init Error]:', err.message);
    edgeTtsClient = null;
    return null;
  }
}

const PURGED_IDS = new Set([
  '1794798197275-ouvpwz',
  '1794795914255-rhpiwj',
  '1794681120848-ncgvkq',
  '1794399629857-kzdtcg',
  '1794399110702-83dw83',
  '1794384138323',
  '1794380051648-b3eqd2',
  '1794374977824-lly8tf',
  '1794374802339-jvugjs'
]);

const server = http.createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const pathname = req.url.split('?')[0];

  // API Data Pengunjung: GET & POST /api/data (Sinkronisasi Supabase Real-Time)
  if (pathname === '/api/data') {
    if (req.method === 'GET') {
      try {
        let records = await fetchSupabaseVisitors();
        let local = [];
        if (fs.existsSync(DATA_FILE)) {
          try {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            local = Array.isArray(parsed) ? parsed : (parsed.data || []);
          } catch (e) {}
        }

        if (records !== null) {
          try {
            fs.writeFileSync(DATA_FILE, JSON.stringify({ success: true, data: records }, null, 2), 'utf-8');
          } catch (e) {}
        } else {
          records = local;
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, count: records.length, data: records }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const parsed = JSON.parse(body || '{}');

          // Aksi Hapus Pengunjung Tunggal
          if (parsed && parsed.action === 'delete' && parsed.deleteId) {
            const delId = String(parsed.deleteId);
            await deleteSupabaseVisitor(delId);
            let current = await fetchSupabaseVisitors();
            if (!current && fs.existsSync(DATA_FILE)) {
              try {
                const raw = fs.readFileSync(DATA_FILE, 'utf-8');
                const p = JSON.parse(raw);
                current = (Array.isArray(p) ? p : (p.data || [])).filter(r => String(r.id) !== delId);
              } catch (e) { current = []; }
            }
            try {
              fs.writeFileSync(DATA_FILE, JSON.stringify({ success: true, data: current || [] }, null, 2), 'utf-8');
            } catch (e) {}
            res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
            res.end(JSON.stringify({ success: true, count: (current || []).length, data: current || [] }));
            return;
          }

          const incoming = Array.isArray(parsed) ? parsed : (parsed.data ? parsed.data : (parsed.id ? [parsed] : []));
          if (incoming.length > 0) {
            await upsertSupabaseVisitors(incoming);
          }

          let updated = await fetchSupabaseVisitors();
          if (!updated && fs.existsSync(DATA_FILE)) {
            try {
              const raw = fs.readFileSync(DATA_FILE, 'utf-8');
              const p = JSON.parse(raw);
              updated = Array.isArray(p) ? p : (p.data || []);
            } catch (e) { updated = []; }
          }

          try {
            fs.writeFileSync(DATA_FILE, JSON.stringify({ success: true, data: updated || [] }, null, 2), 'utf-8');
          } catch (e) {}

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, count: (updated || []).length, data: updated || [] }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON data' }));
        }
      });
      return;
    }
  }

  // TTS Proxy & Synthesis Endpoint: POST /api/tts
  if (pathname === '/api/tts' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const rawText = payload.input || payload.text || '';
        const text = cleanSpeechText(rawText);
        const engine = payload.engine || 'gadis'; // 'gadis' (default native ID), 'easyvoice', 'google'
        let apiKey = payload.key || payload.apiKey;
        if (!apiKey || apiKey.length < 60 || (apiKey.startsWith('ev_a8dd782c') && apiKey.length < 67)) {
          apiKey = DEFAULT_KEY;
        }
        const voice = payload.voice || 'af_heart';

        if (!text) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Text input is required' }));
          return;
        }

        // 1. Cek Disk Cache & Static Pre-rendered Audio
        const cachePrefix = (engine === 'easyvoice') ? `ev_${voice}` : 'gadis_v4_studio';
        const hash = crypto.createHash('md5').update(cachePrefix + '_' + text).digest('hex');
        const cacheFile = path.join(CACHE_DIR, `${hash}.mp3`);
        const staticFile = path.join(ROOT, 'audio', 'tts', `${hash}.mp3`);
        const fileToServe = fs.existsSync(cacheFile) ? cacheFile : (fs.existsSync(staticFile) ? staticFile : null);

        if (fileToServe) {
          const stat = fs.statSync(fileToServe);
          if (stat.size > 1000) {
            console.log(`[Cache Hit] ${hash.slice(0, 8)} (${stat.size} bytes) - "${text.slice(0, 30)}..."`);
            res.writeHead(200, {
              'Content-Type': 'audio/mpeg',
              'Content-Length': stat.size,
              'X-Cache': 'HIT',
              'Cache-Control': 'public, max-age=31536000'
            });
            fs.createReadStream(fileToServe).pipe(res);
            return;
          }
        }

        // 2A. OPSI DEFAULT & TERBAIK: Microsoft Gadis Neural (Format Jernih, Studio 96kbps, Natural & Santun)
        if (engine !== 'easyvoice') {
          try {
            console.log(`[TTS Gadis Studio] Menghasilkan suara wanita formal, jernih & santun (96kbps): "${text.slice(0, 35)}..."`);
            const tts = await getEdgeTts();
            if (tts) {
              const { audioStream } = tts.toStream(text, { rate: '+0%', pitch: '+0Hz' });
              const tempFile = `${cacheFile}.tmp`;
              const fileStream = fs.createWriteStream(tempFile);
              let totalBytes = 0;

              res.writeHead(200, {
                'Content-Type': 'audio/mpeg',
                'X-Cache': 'MISS',
                'Cache-Control': 'public, max-age=31536000'
              });

              audioStream.on('data', chunk => {
                totalBytes += chunk.length;
                fileStream.write(chunk);
                res.write(chunk);
              });

              audioStream.on('end', () => {
                fileStream.end();
                res.end();
                if (totalBytes > 1000) {
                  try {
                    fs.renameSync(tempFile, cacheFile);
                    console.log(`[TTS Gadis Saved] Berhasil disimpan ke cache disk (${totalBytes} bytes).`);
                  } catch (e) {}
                } else {
                  try { fs.unlinkSync(tempFile); } catch (e) {}
                }
              });

              audioStream.on('error', (streamErr) => {
                console.error('[Stream Error]:', streamErr.message);
                fileStream.end();
                try { fs.unlinkSync(tempFile); } catch (e) {}
                res.end();
              });
              return;
            }
          } catch (gadisErr) {
            console.warn('[Gadis Error, fallback to Google]:', gadisErr.message);
          }
        }

        // 2B. OPSI EASYVOICE (Jika user secara eksplisit memilih EasyVoice)
        console.log(`[TTS EasyVoice] Menghubungi EasyVoice untuk: "${text.slice(0, 35)}..."`);

        const easyPayload = JSON.stringify({
          model: 'kokoro-82m',
          input: text,
          voice
        });

        const easyReq = https.request('https://easyvoice.ae/api/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(easyPayload)
          },
          timeout: 7000
        }, (easyRes) => {
          if (easyRes.statusCode !== 200) {
            console.warn(`[EasyVoice Warn] Status code ${easyRes.statusCode}`);
            res.writeHead(easyRes.statusCode, { 'Content-Type': 'application/json' });
            easyRes.pipe(res);
            return;
          }

          const fileStream = fs.createWriteStream(cacheFile);
          res.writeHead(200, {
            'Content-Type': 'audio/mpeg',
            'X-Cache': 'MISS',
            'Cache-Control': 'public, max-age=31536000'
          });

          easyRes.on('data', chunk => {
            fileStream.write(chunk);
            res.write(chunk);
          });

          easyRes.on('end', () => {
            fileStream.end();
            res.end();
            console.log(`[TTS EasyVoice Saved] Berhasil disimpan.`);
          });
        });

        easyReq.on('timeout', () => {
          console.warn('[EasyVoice Timeout]');
          easyReq.destroy();
          res.writeHead(504, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'EasyVoice timeout' }));
        });

        easyReq.on('error', (err) => {
          console.error('[EasyVoice Proxy Error]:', err.message);
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to connect to EasyVoice server', details: err.message }));
        });

        easyReq.write(easyPayload);
        easyReq.end();
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON request' }));
      }
    });
    return;
  }

  // Static File Serving
  let reqPath = decodeURIComponent(pathname);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  let filePath = path.join(ROOT, 'public', reqPath);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(ROOT, reqPath);
  }

  // Security check
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`\n========================================================`);
  console.log(`⚡ PLN PUSHARLIS VISITOR MANAGEMENT SYSTEM`);
  console.log(`🚀 Local Server aktif di: http://localhost:${PORT}`);
  console.log(`🎙️ Suara Asli Indonesia (Gadis Neural): http://localhost:${PORT}/api/tts`);
  console.log(`========================================================\n`);
});
