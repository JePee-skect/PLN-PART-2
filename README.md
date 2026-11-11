# Visitor Management System – PT PLN (Persero) Pusharlis UP2WVI

Sistem Manajemen Tamu & Keselamatan Kerja (K3) interaktif berbasis web, dilengkapi dengan **Asisten Registrasi Tamu 3D**, panduan suara cerdas (*Voice Assistance*), poster induksi keselamatan (*Safety & Security Induction*), serta Dashboard Monitoring Petugas Admin.

---

## 📁 Struktur Direktori & File (Modular)

Proyek ini telah dirapikan dari file monolitik 3.000+ baris menjadi arsitektur modular yang bersih, mudah dikelola, dan dapat langsung dibuka di peramban (browser):

```text
PROJEK PLN/
├── index.html                    # Halaman utama aplikasi (bersih, semantik, ~350 baris)
├── index.monolith.html.bak       # Cadangan (backup) lengkap file kode monolitik lama
├── package.json                  # Metadata proyek dan skrip npm
├── README.md                     # Dokumentasi arsitektur & panduan penggunaan
│
├── css/                          # Kumpulan berkas gaya tampilan antarmuka
│   ├── style.css                 # Tema PLN, layout dashboard, form tamu, modal login, poster induksi
│   └── assistant.css             # Desain widget chatbot, bubble bicara, drawer pengaturan suara
│
├── js/                           # Kumpulan berkas logika JavaScript terpisah
│   ├── config.js                 # Konfigurasi global, helper DOM, kredensial admin & state aplikasi
│   ├── voice.js                  # Engine suara: Edge Ardi (Natural), ElevenLabs Voice Cloning, audio lokal
│   ├── robot3d.js                # Engine Three.js untuk rendering & animasi 3D Asisten Petugas K3
│   ├── form.js                   # Validasi form tamu, kamera WebRTC, KTP check, poster induksi K3
│   ├── dashboard.js              # Tabel pemantauan tamu, filter tanggal/nama, ekspor data ke Excel
│   ├── assistant.js              # Logika asisten interaktif, panduan langkah per langkah, chip FAQ
│   └── app.js                    # Inisialisasi utama aplikasi, routing halaman, & otentikasi login admin
│
├── img/                          # Aset visual & gambar resmi
│   ├── pln-logo.png              # Logo resmi PT PLN (Persero)
│   └── safety-induction.jpg      # Poster resmi Safety & Security Induction PLN Pusharlis
│
└── audio/                        # Aset suara & rekaman audio
    └── my-voice.mp3              # File audio rekaman suara hasil kloning untuk asisten
```

---

## 🚀 Fitur-Fitur Utama

1. **Struktur Bersih & Terpisah (Modular)**:
   - Tidak ada lagi ribuan baris menumpuk di 1 file. Setiap logika (tampilan, form, suara, robot 3D, admin) memiliki berkasnya masing-masing.
2. **Asisten Virtual 3D & Identitas Resmi ("Visitor Assistant")**:
   - Dibuat dengan Three.js menggunakan APD K3 lengkap: Helm K3 kuning dengan logo resmi PLN di bagian dahi, Name Tag resmi **"PLN PUSHARLIS - VISITOR ASSISTANT"** di dada rompi, dan seragam rapi tanpa logo berlebih di bagian bawah/sepatu.
   - Dilengkapi identitas resmi **"Visitor Assistant"** pada bilah judul chatbot, balasan chat, balon bicara (*speech bubble*), drawer suara, dan lencana widget.
   - Interaktif, dapat digeser (*drag-and-drop*), melambaikan tangan, dan berkedip.
3. **Panduan Suara (*Voice Assistance*)**:
   - **Microsoft Ardi (Natural)**: Suara bahasa Indonesia alami jika dibuka melalui Microsoft Edge.
   - **ElevenLabs AI Voice Cloning**: Integrasi pemutaran suara sendiri yang telah dikloning.
   - **Audio Lokal**: Mendukung pemutaran file langsung `audio/my-voice.mp3`.
4. **Formulir Registrasi Tamu & Validasi K3**:
   - Pengambilan foto langsung lewat kamera webcam.
   - Pemilihan APD standar K3LH (*Safety Helmet, Safety Shoes, Seragam Kerja*).
   - Validasi nomor KTP 16-digit dengan notifikasi audio peringatan jika tidak sesuai.
   - Poster **Safety and Security Induction PT PLN (Persero) Pusharlis** resolusi tinggi dengan fitur perbesar (lightbox) dan kotak centang persetujuan wajib.
5. **Dashboard & Login Admin Aman**:
   - Halaman registrasi tamu tetap menjadi halaman utama publik bagi tamu.
   - Akses dashboard admin diamankan dengan modal login khusus tanpa membocorkan kredensial.
   - Fitur pencarian nama tamu, filter tanggal kunjungan, aksi *Check-in / Check-out*, serta **Ekspor Langsung ke Excel (.xlsx)**: Sekali klik tombol "Export to Excel", file `.xlsx` langsung terunduh otomatis dan saat dibuka kolom No. KTP 16-digit tetap utuh sebagai teks murni tanpa berubah menjadi format ilmiah eksponensial (`1.26E+15`).

---

## 💻 Cara Menjalankan

1. **Langsung Buka di Browser (Paling Mudah)**:
   - Klik ganda (double-click) pada berkas `index.html`.
   - Disarankan menggunakan **Microsoft Edge** atau **Google Chrome** untuk kualitas audio dan performa 3D terbaik.
2. **Menggunakan Web Server Lokal (Opsional)**:
   - Jika memiliki Node.js, jalankan di terminal folder proyek:
     ```bash
     npx serve .
     ```
   - Buka alamat `http://localhost:3000` di peramban Anda.
