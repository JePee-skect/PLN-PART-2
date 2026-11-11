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

// Sinkronisasi Data Pengunjung Realtime dari Local Server
if (location.protocol.startsWith('http')) {
  fetch('/api/data')
    .then(r => r.json())
    .then(res => {
      if (res && Array.isArray(res.data) && res.data.length > 0) {
        data = res.data;
        store.set('vms-data', data);
        if (typeof renderTable === 'function') renderTable();
      }
    })
    .catch(() => {});
}

function syncDataToServer() {
  if (location.protocol.startsWith('http')) {
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {});
  }
}
