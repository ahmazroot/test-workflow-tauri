# Tauri Auto-Updater Workflow Guide

Panduan ini berisi langkah-langkah untuk melakukan rilis versi baru aplikasi Tauri Anda menggunakan GitHub Actions dan fitur Auto-Updater.

---

## 📋 Prasyarat Penting
1. **Repository Public:** Agar link updater `latest.json` dapat diakses oleh aplikasi tanpa token autentikasi, pastikan repositori GitHub Anda berstatus **Public**.
2. **GitHub Secrets:** Pastikan kunci privat `TAURI_PRIVATE_KEY` sudah terdaftar di repository settings GitHub Anda.

---

## 🚀 Langkah Rilis Versi Baru (Step-by-step)

Setiap kali Anda ingin merilis versi baru (misalnya dari `0.2.0` ke `0.3.0`):

### Langkah 1: Naikkan Versi Aplikasi (Version Bump)
Ubah nomor versi di kedua berkas berikut:
1. **`package.json`**:
   ```json
   "version": "0.3.0"
   ```
2. **`src-tauri/tauri.conf.json`**:
   ```json
   "version": "0.3.0"
   ```

> [!IMPORTANT]
   > **Kedua berkas di atas HARUS memiliki nomor versi yang sama persis.**
   > * `package.json` mengatur versi sisi frontend.
   > * `tauri.conf.json` mengatur versi sisi backend/native bundler.
   > Jika tidak sama, proses update otomatis (auto-updater) akan mengalami konflik deteksi versi dan gagal berfungsi dengan benar.

### Langkah 2: Commit dan Push Perubahan ke GitHub
Jalankan perintah git berikut untuk mengirim perubahan ke branch utama:
```bash
git add package.json src-tauri/tauri.conf.json src/App.tsx
git commit -m "release: bump version to 0.3.0"
git push origin main
```

### Langkah 3: Buat dan Push Tag Versi Baru
Tag inilah yang akan memicu workflow rilis otomatis di GitHub Actions:
```bash
git tag v0.3.0
git push origin v0.3.0
```

### Langkah 4: Publikasikan Rilis di GitHub (Wajib)
Setelah workflow kompilasi selesai di GitHub Actions (sekitar 3-4 menit):
1. Buka halaman rilis di browser: [https://github.com/ahmazroot/test-workflow-tauri/releases](https://github.com/ahmazroot/test-workflow-tauri/releases)
2. Anda akan melihat rilis baru bertanda **Draft** (kuning/abu-abu).
3. Klik tombol **Edit** (ikon pensil) pada rilis tersebut.
4. Klik tombol **Publish Release** di bagian paling bawah.

---

## 🧪 Cara Menguji Fitur Auto-Update secara Lokal

1. **Instal Versi Lama:** Unduh dan instal aplikasi versi lama (misalnya `v0.1.0`) di komputer Anda.
2. **Buka Aplikasi:** Jalankan aplikasi versi lama tersebut.
3. **Cek Update:** Tekan tombol **Check for Update** di antarmuka aplikasi.
4. **Instal:** Aplikasi akan mendeteksi rilis terbaru (misalnya `v0.2.0`), menampilkan progres unduhan, dan setelah selesai, klik **Install & Relaunch** untuk beralih ke versi baru secara otomatis!
