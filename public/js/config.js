/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   Config & State: Utilitas Dasar, LocalStorage & Kredensial
   ===================================================================== */

// Selektor DOM Cepat
const $  = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

// LocalStorage Helper
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }
};

// Format Tanggal & Keamanan Teks
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
}[c]));

// Sesi Login Admin (Default selalu 'user' untuk tamu yang baru membuka web)
let isAdminSession = false;
try {
  isAdminSession = (sessionStorage.getItem('vms-admin-auth') === 'true');
} catch (e) {}

let role  = isAdminSession ? 'admin' : 'user';
let data  = store.get('vms-data', []);
let photo = '';

const ROLE_PAGES = ['dashboard', 'registrasi'];
const APD_LIST = ['Safety Helmet', 'Safety Shoes', 'Rompi Reflektif', 'Seragam Kerja'];
const PHOTO_PLACEHOLDER = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 168 233\'%3E%3Crect width=\'168\' height=\'233\' fill=\'%23bdbdbd\'/%3E%3Ccircle cx=\'84\' cy=\'70\' r=\'34\' fill=\'%238a8a8a\'/%3E%3Cpath d=\'M20 170c0-45 30-60 64-60s64 15 64 60z\' fill=\'%238a8a8a\'/%3E%3Ctext x=\'84\' y=\'195\' font-size=\'22\' fill=\'%23f2f2f2\' text-anchor=\'middle\' font-family=\'sans-serif\'%3ENo Image%3C/text%3E%3Ctext x=\'84\' y=\'220\' font-size=\'22\' fill=\'%23f2f2f2\' text-anchor=\'middle\' font-family=\'sans-serif\'%3EAvailable%3C/text%3E%3C/svg%3E';

// Kredensial Resmi Admin (Tersimpan aman di logika internal)
const ADMIN_CREDENTIALS = {
  user: 'admin',
  pass: 'admin123'
};

// Konfigurasi Suara AI EasyVoice (Key Resmi Pengguna)
const DEFAULT_EASYVOICE_KEY = 'ev_a8dd782ce24e59571a03d3cbda4039cd73c68d9a0013647a9d295a6e7cc87e16';
const DEFAULT_EASYVOICE_VOICE = 'af_heart';

// Sinkronisasi Data Pengunjung Real-time Lintas Perangkat (Cloud Database)
async function fetchVisitorsFromServer() {
  if (!location.protocol.startsWith('http')) return;
  try {
    const res = await fetch('/api/data');
    if (!res.ok) return;
    const json = await res.json();
    if (json && Array.isArray(json.data)) {
      const map = new Map();
      (data || []).forEach(r => {
        if (r && (r.id || r.nama)) {
          const k = String(r.id || `${r.tgl}_${r.ktp}_${r.nama}`);
          map.set(k, r);
        }
      });
      json.data.forEach(r => {
        if (r && (r.id || r.nama)) {
          const k = String(r.id || `${r.tgl}_${r.ktp}_${r.nama}`);
          if (map.has(k)) {
            map.set(k, { ...map.get(k), ...r });
          } else {
            map.set(k, r);
          }
        }
      });
      data = Array.from(map.values()).sort((a, b) => {
        const tA = Number(String(a.id || '').split('-')[0]) || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const tB = Number(String(b.id || '').split('-')[0]) || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return tB - tA;
      });
      store.set('vms-data', data);
      if (typeof renderTable === 'function') renderTable();
    }
  } catch (e) {
    // Abaikan error koneksi
  }
}

async function syncDataToServer(payload = data) {
  if (!location.protocol.startsWith('http')) return;
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) return;
    const json = await res.json();
    if (json && Array.isArray(json.data)) {
      data = json.data;
      store.set('vms-data', data);
      if (typeof renderTable === 'function') renderTable();
    }
    return json;
  } catch (e) {
    // Abaikan jika offline
  }
}

// Inisialisasi pengambilan data server pertama kali saat halaman dimuat
if (location.protocol.startsWith('http')) {
  fetchVisitorsFromServer();
}
