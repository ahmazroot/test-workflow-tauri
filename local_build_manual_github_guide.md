# Tauri Auto-Updater: Metode Build Lokal & Upload Manual ke GitHub (Gratis & Kode Tetap Private)

Jika Anda ingin menyimpan kode sumber di repositori **Private** dan melakukan proses **build/kompilasi secara lokal** di komputer Anda (tanpa CI/CD GitHub Actions), lalu mengunggah hasilnya secara manual ke repositori **Public** khusus rilis, panduan ini adalah solusi terbaik.

---

## 🗺️ Skema Cara Kerja

1. **Kode Sumber Aman:** Seluruh pengerjaan kode berada di repositori **Private** Anda atau komputer lokal.
2. **Build Lokal:** Komputer Anda yang melakukan kompilasi file (misal `.tar.gz`, `.sig`, `.dmg`).
3. **Penyusunan Otomatis:** Skrip Node.js otomatis menyusun berkas update dan signature ke folder `updater-dist/latest.json`.
4. **Distribusi Publik:** Anda mengunggah isi folder `updater-dist` secara manual ke repositori **Public** khusus rilis (misal `test-app-releases`) di GitHub.

---

## 🛠️ Langkah 1: Buat Repositori Rilis Publik

1. Buat repositori baru di GitHub Anda: **`test-app-releases`**.
2. Atur visibilitas repositori ini menjadi **Public** (agar file rilis bisa diunduh gratis tanpa token).
3. Biarkan repositori ini kosong (tidak perlu diisi kode sumber apa pun).

---

## ⚙️ Langkah 2: Konfigurasi `tauri.conf.json`

Di proyek **Private** Anda, ubah bagian `"updater"` di file `src-tauri/tauri.conf.json` untuk mengarah ke repositori publik:

```json
"updater": {
  "active": true,
  "endpoints": [
    "https://github.com/ahmazroot/test-app-releases/releases/latest/download/latest.json"
  ],
  "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6..."
}
```
*(Ganti `ahmazroot` dengan username GitHub Anda dan `test-app-releases` dengan nama repositori publik Anda)*.

---

## 🚀 Langkah 3: Proses Rilis (Setiap Kali Ada Update)

Lakukan 4 langkah mudah ini setiap kali Anda ingin mengirim update baru ke user:

### 1. Naikkan Versi Aplikasi
Pastikan versi aplikasi di `package.json` dan `src-tauri/tauri.conf.json` sudah sama dan dinaikkan (misal ke `"0.2.2"`).

### 2. Bangun Aplikasi di Komputer Lokal
Jalankan kompilasi lokal di terminal komputer Anda dengan memasukkan kunci privat minisign Anda:

```bash
# Ganti dengan kunci privat minisign asli milik Anda
export TAURI_SIGNING_PRIVATE_KEY="dW50cnVzdGVkIGNvbW1lbnQ6..."

# Jalankan build produksi
npm run tauri build
```

### 3. Generate Folder Distribusi Update
Jalankan skrip yang telah kita buat sebelumnya untuk menyusun tanda tangan digital (signature) dan file updater:

```bash
node generate-github-updater.js
```

Skrip ini akan membuat folder baru bernama **`updater-dist`** di root proyek Anda yang berisi:
*   `latest.json` (berisi tanda tangan digital & tautan unduh otomatis)
*   `tauri-app_0.2.2_aarch64.app.tar.gz` (file updater macOS)

### 4. Upload Manual ke GitHub Releases Publik
1. Buka halaman rilis repositori **Public** Anda di browser:  
   `https://github.com/ahmazroot/test-app-releases/releases`
2. Klik tombol **Draft a new release** (atau **Create a new release**).
3. Masukkan tag versi baru (misalnya **`v0.2.2`** - *pastikan ada huruf `v` di depannya*).
4. Beri judul rilis (misalnya `Release v0.2.2`).
5. Pada bagian **Attach binaries...**, drag & drop **seluruh file** yang ada di dalam folder **`updater-dist`** Anda.
6. Klik tombol **Publish Release**.

---

## 🧪 Langkah 4: Uji Coba

1. Buka aplikasi versi lama Anda (misal `v0.1.0`).
2. Klik tombol **Check for Update**.
3. Aplikasi secara otomatis akan mendeteksi file `latest.json` publik dari repo rilis, mengunduh file `.tar.gz`, memverifikasi signature, dan melakukan update instan!
