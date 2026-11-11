const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

let MsEdgeTTS, OUTPUT_FORMAT;
try {
  const edgePkg = require('msedge-tts');
  MsEdgeTTS = edgePkg.MsEdgeTTS;
  OUTPUT_FORMAT = edgePkg.OUTPUT_FORMAT;
} catch (e) {}

const TMP_CACHE = path.join(os.tmpdir(), 'pln_tts_cache');
if (!fs.existsSync(TMP_CACHE)) {
  try { fs.mkdirSync(TMP_CACHE, { recursive: true }); } catch (e) {}
}

const DEFAULT_KEY = 'ev_a8dd782ce24e59571a03d3cbda4039cd73c68d9a0013647a9d295a6e7cc87e16';

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

let edgeTtsClient = null;
async function getEdgeTts() {
  if (!MsEdgeTTS) return null;
  try {
    if (!edgeTtsClient) {
      edgeTtsClient = new MsEdgeTTS();
      await edgeTtsClient.setMetadata('id-ID-GadisNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    }
    return edgeTtsClient;
  } catch (err) {
    edgeTtsClient = null;
    return null;
  }
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

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let payload = req.body;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch (e) { payload = {}; }
  } else if (!payload) {
    let raw = '';
    await new Promise(r => {
      req.on('data', c => raw += c);
      req.on('end', r);
    });
    try { payload = JSON.parse(raw || '{}'); } catch (e) { payload = {}; }
  }

  const rawText = payload.input || payload.text || '';
  const text    = cleanSpeechText(rawText);
  const engine  = payload.engine || 'gadis';
  const apiKey  = payload.key || payload.apiKey || DEFAULT_KEY;
  const voice   = payload.voice || 'af_heart';

  if (!text) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Text input is required' }));
    return;
  }

  const cachePrefix = (engine === 'easyvoice') ? `ev_${voice}` : 'gadis_formal_v2';
  const hash = crypto.createHash('md5').update(cachePrefix + '_' + text).digest('hex');
  const cacheFile = path.join(TMP_CACHE, `${hash}.mp3`);

  if (fs.existsSync(cacheFile)) {
    const stat = fs.statSync(cacheFile);
    if (stat.size > 1000) {
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size,
        'X-Cache': 'HIT',
        'Cache-Control': 'public, max-age=31536000'
      });
      fs.createReadStream(cacheFile).pipe(res);
      return;
    }
  }

  if (engine !== 'easyvoice') {
    try {
      const tts = await getEdgeTts();
      if (tts) {
        const { audioStream } = tts.toStream(text, { rate: '-7%', pitch: '-2Hz' });
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
            try { fs.renameSync(tempFile, cacheFile); } catch (e) {}
          } else {
            try { fs.unlinkSync(tempFile); } catch (e) {}
          }
        });

        audioStream.on('error', () => {
          fileStream.end();
          try { fs.unlinkSync(tempFile); } catch (e) {}
          res.end();
        });
        return;
      }
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
      return;
    }
  }

  // EasyVoice Fallback Proxy
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
      res.writeHead(easyRes.statusCode, { 'Content-Type': 'application/json' });
      easyRes.pipe(res);
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'X-Cache': 'MISS',
      'Cache-Control': 'public, max-age=31536000'
    });
    easyRes.pipe(res);
  });

  easyReq.on('error', err => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });

  easyReq.write(easyPayload);
  easyReq.end();
};
