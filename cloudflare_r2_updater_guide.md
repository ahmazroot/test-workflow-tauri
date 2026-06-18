# Tauri Auto-Updater dengan Cloudflare R2 (Private Repo)

Panduan ini menjelaskan cara mengonfigurasi fitur auto-update Tauri menggunakan **Cloudflare R2** sebagai tempat penyimpanan (storage) file update. Metode ini menjaga kode sumber Anda tetap aman di repositori **Private**, namun memungkinkan aplikasi klien mengunduh update secara publik.

---

## 🛠️ Langkah 1: Setup Bucket di Cloudflare R2

1. **Buat Bucket R2:**
   * Masuk ke dashboard [Cloudflare](https://dash.cloudflare.com/).
   * Buka menu **R2 Object Storage** -> klik **Create bucket**.
   * Beri nama bucket Anda, misalnya: `tauri-updates`.
   * Pilih lokasi bucket yang terdekat (atau biarkan default/automatic), lalu klik **Create bucket**.

2. **Aktifkan Akses Publik (Public Read):**
   * Di dalam bucket yang baru dibuat, klik tab **Settings**.
   * Scroll ke bawah ke bagian **Public Sharing**.
   * Anda bisa memilih antara:
     * **Custom Domain:** Menghubungkan subdomain milik Anda sendiri (misal `updates.domainanda.com`) — *Sangat Direkomendasikan*.
     * **R2.dev Subdomain:** Mengaktifkan subdomain gratis dari Cloudflare (klik **Allow**).
   * Catat domain publik tersebut, misalnya: `https://updates.domainanda.com` atau `https://pub-xxx.r2.dev`.

3. **Buat R2 API Credentials (untuk Upload):**
   * Kembali ke halaman utama **R2**.
   * Klik **Manage R2 API Tokens** di sisi kanan atas.
   * Klik **Create API Token**.
   * Beri nama token, pilih izin **Edit** (Read & Write), lalu klik **Create API Token**.
   * **Simpan data penting berikut:**
     * `Access Key ID`
     * `Secret Access Key`
     * `Endpoint` (misal: `https://<account_id>.r2.cloudflarestorage.com`)

---

## ⚙️ Langkah 2: Konfigurasi `tauri.conf.json`

Ubah konfigurasi updater di berkas `src-tauri/tauri.conf.json` proyek Anda untuk mengarah ke R2:

```json
"updater": {
  "active": true,
  "endpoints": [
    "https://updates.domainanda.com/latest.json"
  ],
  "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWdu..."
}
```
*Ganti `https://updates.domainanda.com` dengan domain R2 publik Anda.*

---

## 📦 Langkah 3: Skrip Otomatisasi Pembuatan `latest.json` (Node.js)

Agar Anda tidak perlu menulis file `latest.json` secara manual setiap kali melakukan rilis, buat skrip pembantu bernama `generate-updater.js` di root folder proyek Anda.

Pasang dependensi pembantu terlebih dahulu:
```bash
npm install -D mime-types
```

Buat berkas **`generate-updater.js`**:
```javascript
import fs from 'fs';
import path from 'path';

const APP_NAME = 'tauri-app'; // Sesuai dengan productName di tauri.conf.json
const VERSION = JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version;

const RELEASE_DIR = './src-tauri/target/release/bundle';
const OUTPUT_DIR = './updater-dist';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// 1. Tentukan path file updater & signature
const macArmGz = path.join(RELEASE_DIR, `macos/${APP_NAME}_${VERSION}_aarch64.app.tar.gz`);
const macArmSig = macArmGz + '.sig';

const macIntelGz = path.join(RELEASE_DIR, `macos/${APP_NAME}_${VERSION}_x64.app.tar.gz`);
const macIntelSig = macIntelGz + '.sig';

const winZip = path.join(RELEASE_DIR, `msi/${APP_NAME}_${VERSION}_x64_en-US.msi.zip`);
const winSig = winZip + '.sig';

// 2. Baca isi signature file
const getSig = (p) => fs.existsSync(p) ? fs.readFileSync(p, 'utf8').trim() : null;

const latestJson = {
  version: VERSION,
  notes: `Rilis versi ${VERSION}`,
  pub_date: new Date().toISOString(),
  platforms: {}
};

// Hubungkan ke R2 URL Anda
const R2_URL = 'https://updates.domainanda.com'; 

// Tambahkan macOS ARM64
if (fs.existsSync(macArmGz) && getSig(macArmSig)) {
  fs.copyFileSync(macArmGz, path.join(OUTPUT_DIR, path.basename(macArmGz)));
  latestJson.platforms['darwin-aarch64'] = {
    signature: getSig(macArmSig),
    url: `${R2_URL}/${path.basename(macArmGz)}`
  };
}

// Tambahkan macOS Intel x64
if (fs.existsSync(macIntelGz) && getSig(macIntelSig)) {
  fs.copyFileSync(macIntelGz, path.join(OUTPUT_DIR, path.basename(macIntelGz)));
  latestJson.platforms['darwin-x86_64'] = {
    signature: getSig(macIntelSig),
    url: `${R2_URL}/${path.basename(macIntelGz)}`
  };
}

// Tambahkan Windows x64
if (fs.existsSync(winZip) && getSig(winSig)) {
  fs.copyFileSync(winZip, path.join(OUTPUT_DIR, path.basename(winZip)));
  latestJson.platforms['windows-x86_64'] = {
    signature: getSig(winSig),
    url: `${R2_URL}/${path.basename(winZip)}`
  };
}

fs.writeFileSync(path.join(OUTPUT_DIR, 'latest.json'), JSON.stringify(latestJson, null, 2));
console.log('✅ Berhasil menyusun folder updater-dist/ dan file latest.json!');
```

---

## 🚀 Langkah 4: Alur Rilis Lokal (Manual Upload)

Setiap kali Anda ingin memperbarui versi aplikasi Anda secara manual:

1. **Naikkan Versi:** Ganti versi di `package.json` dan `tauri.conf.json`.
2. **Build Aplikasi:**
   ```bash
   export TAURI_SIGNING_PRIVATE_KEY="kunci_privat_minisign_anda"
   npm run tauri build
   ```
3. **Jalankan Skrip Pembuat JSON:**
   ```bash
   node generate-updater.js
   ```
4. **Upload ke Cloudflare R2:**
   Buka dashboard Cloudflare R2, masuk ke bucket `tauri-updates`, lalu unggah semua file yang berada di dalam folder **`updater-dist/`** (`latest.json`, `.tar.gz`, `.zip`, dll.).

---

## 🤖 Langkah 5: Otomatisasi via Private GitHub Actions

Jika Anda ingin proses build dan upload berjalan otomatis saat Anda membuat tag git baru, ubah file workflow Anda (`.github/workflows/publish.yml`) menjadi seperti ini:

```yaml
name: Build & Upload Updates to Cloudflare R2

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-deploy:
    runs-on: macos-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-size: 20

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install dependencies
        run: npm install

      - name: Build Tauri App
        run: npm run tauri build
        env:
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}

      - name: Generate Updater Files
        run: node generate-updater.js

      - name: Upload to Cloudflare R2
        uses: jakejarvis/s3-sync-action@master
        with:
          args: --acl public-read --follow-symlinks --delete
        env:
          AWS_S3_BUCKET: 'tauri-updates' # Nama bucket R2 Anda
          AWS_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          AWS_S3_ENDPOINT: 'https://<account_id>.r2.cloudflarestorage.com' # Endpoint R2 Anda
          SOURCE_DIR: 'updater-dist'
```

*Catatan: Pastikan Anda menambahkan variabel `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` ke dalam **GitHub Secrets** repositori private Anda.*
