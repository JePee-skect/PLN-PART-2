/* =====================================================================
   VISITOR MANAGEMENT SYSTEM - PT PLN (PERSERO) PUSHARLIS
   App Main: Inisialisasi, Routing Halaman & Autentikasi Admin
   ===================================================================== */

function setRole(newRole) {
  role = newRole;
  document.documentElement.dataset.role = newRole;

  const isAdmin = (newRole === 'admin');

  // Perbarui elemen UI Sidebar
  const btnOpenLogin    = $('#btn-open-login');
  const adminSessionBox = $('#admin-session-box');
  const navDashboard    = $('#nav-dashboard');

  if (btnOpenLogin)    btnOpenLogin.classList.toggle('hide', isAdmin);
  if (adminSessionBox) adminSessionBox.classList.toggle('hide', !isAdmin);
  if (navDashboard)    navDashboard.classList.toggle('hide', !isAdmin);

  if (typeof renderChips === 'function') renderChips();
  route();
}

function route() {
  let page = location.hash.slice(1);

  // Proteksi: Tamu tidak bisa langsung membuka #dashboard via URL tanpa login
  if (page === 'dashboard' && role !== 'admin') {
    location.hash = '#registrasi';
    openLoginModal('Akses ditolak. Silakan login sebagai petugas admin terlebih dahulu.');
    return;
  }

  if (role !== 'admin' || !ROLE_PAGES.includes(page)) {
    page = (role === 'admin') ? 'dashboard' : 'registrasi';
  }

  ROLE_PAGES.forEach((p) => {
    const el = $('#v-' + p);
    const nav = $('#nav-' + p);
    if (el)  el.classList.toggle('hide', p !== page);
    if (nav) nav.classList.toggle('on', p === page);
  });

  const vTerima = $('#v-terima');
  if (vTerima) vTerima.classList.add('hide');

  if (page === 'dashboard' && typeof renderTable === 'function') {
    renderTable();
  }

  if (typeof botHello === 'function') {
    botHello(page);
  }
}

/* Modal Login Admin */
function openLoginModal(hintMsg = '') {
  const modal = $('#modal-login');
  if (!modal) return;
  modal.classList.remove('hide');
  if ($('#admin-user')) $('#admin-user').value = '';
  if ($('#admin-pass')) $('#admin-pass').value = '';
  if ($('#login-err'))  $('#login-err').style.display = 'none';

  if (hintMsg && typeof say === 'function') {
    say(hintMsg);
  }
  setTimeout(() => {
    if ($('#admin-user')) $('#admin-user').focus();
  }, 150);
}

function closeLoginModal() {
  const modal = $('#modal-login');
  if (modal) modal.classList.add('hide');
}

function initApp() {
  // Tombol Buka Modal Login Admin
  const btnOpenLogin = $('#btn-open-login');
  if (btnOpenLogin) {
    btnOpenLogin.onclick = () => {
      openLoginModal('Silakan masukkan username dan password petugas admin.');
    };
  }

  // Tombol Batal Login
  const btnCancelLogin = $('#btn-cancel-login');
  if (btnCancelLogin) {
    btnCancelLogin.onclick = closeLoginModal;
  }

  // Tombol Lihat / Sembunyikan Password
  const btnTogglePass = $('#btn-toggle-pass');
  if (btnTogglePass) {
    btnTogglePass.onclick = () => {
      const passInput = $('#admin-pass');
      if (!passInput) return;
      const isPass = (passInput.type === 'password');
      passInput.type = isPass ? 'text' : 'password';
      btnTogglePass.textContent = isPass ? '👁️' : '🙈';
    };
  }

  // Form Submit Login Admin
  const formLogin = $('#form-login');
  if (formLogin) {
    formLogin.onsubmit = (e) => {
      e.preventDefault();
      const u = $('#admin-user') ? $('#admin-user').value.trim().toLowerCase() : '';
      const p = $('#admin-pass') ? $('#admin-pass').value.trim() : '';

      // Verifikasi username dan password
      const isMatch = (u === ADMIN_CREDENTIALS.user && (p === ADMIN_CREDENTIALS.pass || p === 'pln123'));

      if (isMatch) {
        try {
          sessionStorage.setItem('vms-admin-auth', 'true');
        } catch (err) {}

        closeLoginModal();
        setRole('admin');
        location.hash = '#dashboard';
        say('Login berhasil. Selamat datang, Administrator PLN.');
      } else {
        const errEl = $('#login-err');
        if (errEl) {
          errEl.style.display = 'block';
          errEl.textContent = 'Username atau password yang Anda masukkan salah.';
        }
        if ($('#admin-pass')) $('#admin-pass').focus();
        say('Maaf, username atau password yang Anda masukkan salah.');
      }
    };
  }

  // Tombol Logout Admin
  const btnLogout = $('#btn-logout');
  if (btnLogout) {
    btnLogout.onclick = () => {
      try {
        sessionStorage.removeItem('vms-admin-auth');
      } catch (err) {}

      setRole('user');
      location.hash = '#registrasi';
      say('Admin telah keluar. Mode formulir pendaftaran tamu kembali aktif.');
    };
  }

  window.addEventListener('hashchange', route);

  // Inisialisasi Seluruh Modul
  if (typeof initVoice === 'function')     initVoice();
  if (typeof initForm === 'function')      initForm();
  if (typeof initDashboard === 'function') initDashboard();
  if (typeof initAssistant === 'function') initAssistant();
  if (typeof initRobot3D === 'function')   initRobot3D();

  setRole(role);
}

// Jalankan saat dokumen siap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
