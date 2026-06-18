#!/bin/bash

# Hentikan eksekusi jika terjadi kesalahan apa pun
set -e

# Konfigurasi Kunci Enkripsi Tauri untuk Bypass Password
export TAURI_SIGNING_PRIVATE_KEY="dW50cnVzdGVkIGNvbW1lbnQ6IHJzaWduIGVuY3J5cHRlZCBzZWNyZXQga2V5ClJXUlRZMEl5WWppMXJjQWMweFB5cURSck42b1VnVkNpTm1GRkFZVmYvL2FXeGNHbm12c0FBQkFBQUFBQUFBQUFBQUlBQUFBQXlCQmdHaitocWdSOHZhczY1SGFsSWg5SEFwSGQwSExMVmV4Y2RMWitrYWxzdVNlZDhabnNxMlVGNmZCcmRvcEpneDlFTldhRXNlZnRWeFFmWDFxMjFzelA5U0xxcjJ0aThJK0UvSjdYUzFidkp4Y0h4cEk1SUQyY3hBbzROYTdpa09lRjlwdEs2VXc9Cg=="
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=""

# Baca versi saat ini dari package.json
CURRENT_VERSION=$(node -e "console.log(require('./package.json').version)")

echo "=================================================="
echo "      🚀 TAURI AUTOMATED BUILDER & PACKAGER      "
echo "=================================================="
echo "Versi aplikasi saat ini: v$CURRENT_VERSION"
echo "--------------------------------------------------"
echo "Pilih tindakan versi:"
echo "1) Patch Update (e.g., v$CURRENT_VERSION -> $(node -e "let v = '$CURRENT_VERSION'.split('.'); v[2]++; console.log(v.join('.'))"))"
echo "2) Minor Update (e.g., v$CURRENT_VERSION -> $(node -e "let v = '$CURRENT_VERSION'.split('.'); v[1]++; v[2]=0; console.log(v.join('.'))"))"
echo "3) Major Update (e.g., v$CURRENT_VERSION -> $(node -e "let v = '$CURRENT_VERSION'.split('.'); v[0]++; v[1]=0; v[2]=0; console.log(v.join('.'))"))"
echo "4) Gunakan Versi Saat Ini (Lewati Kenaikan Versi)"
echo "--------------------------------------------------"
read -p "Masukkan pilihan Anda [1-4]: " CHOICE

case $CHOICE in
  1)
    BUMP_TYPE="patch"
    ;;
  2)
    BUMP_TYPE="minor"
    ;;
  3)
    BUMP_TYPE="major"
    ;;
  4)
    BUMP_TYPE="none"
    ;;
  *)
    echo "❌ Pilihan tidak valid. Membatalkan build."
    exit 1
    ;;
esac

if [ "$BUMP_TYPE" != "none" ]; then
  echo "Mengupdate versi package.json..."
  # Ubah versi package.json
  NEW_VERSION=$(npm version $BUMP_TYPE --no-git-tag-version)
  # Hilangkan karakter 'v' dari depan versi
  NEW_VERSION=${NEW_VERSION#v}
  
  echo "Menyamakan versi di src-tauri/tauri.conf.json menjadi v$NEW_VERSION..."
  # Update tauri.conf.json menggunakan node script inline
  node -e "
    const fs = require('fs');
    const config = JSON.parse(fs.readFileSync('./src-tauri/tauri.conf.json', 'utf-8'));
    config.version = '$NEW_VERSION';
    fs.writeFileSync('./src-tauri/tauri.conf.json', JSON.stringify(config, null, 2));
  "
  echo "✅ Versi berhasil diperbarui menjadi v$NEW_VERSION!"
else
  NEW_VERSION=$CURRENT_VERSION
  echo "ℹ️ Menggunakan versi aktif: v$NEW_VERSION"
fi

echo "--------------------------------------------------"
echo "🏗️  Memulai proses kompilasi rilis Tauri..."
echo "--------------------------------------------------"

# Jalankan build tauri
npm run tauri build

echo "--------------------------------------------------"
echo "📦 Menyusun berkas pembaruan (updater-dist)..."
echo "--------------------------------------------------"

# Jalankan generator updater
node generate-github-updater.js

echo "=================================================="
echo "🎉 PROSES SELESAI DENGAN SUKSES!"
echo "=================================================="
echo "Langkah manual berikutnya:"
echo "1. Buka repositori rilis publik Anda di GitHub."
echo "2. Buat Draft/Release Baru dengan tag 'v$NEW_VERSION'."
echo "3. Unggah seluruh file di dalam folder 'updater-dist' ke bagian Assets."
echo "4. Publish rilis tersebut!"
echo "=================================================="
