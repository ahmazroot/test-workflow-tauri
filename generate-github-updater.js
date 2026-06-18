import fs from 'fs';
import path from 'path';

const APP_NAME = 'tauri-app'; // Sesuai dengan productName di tauri.conf.json
const VERSION = JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version;
const GITHUB_USER = 'ahmazroot'; // Username GitHub Anda
const GITHUB_REPO = 'test-app-releases'; // Nama repositori publik untuk rilis

const RELEASE_DIR = './src-tauri/target/release/bundle';
const OUTPUT_DIR = './updater-dist';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// Hapus isi folder output sebelumnya
const oldFiles = fs.readdirSync(OUTPUT_DIR);
for (const file of oldFiles) {
  fs.unlinkSync(path.join(OUTPUT_DIR, file));
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

// URL unduhan rilis GitHub publik
const GITHUB_RELEASE_URL = `https://github.com/${GITHUB_USER}/${GITHUB_REPO}/releases/download/v${VERSION}`;

// Tambahkan macOS ARM64
if (fs.existsSync(macArmGz) && getSig(macArmSig)) {
  const filename = path.basename(macArmGz);
  fs.copyFileSync(macArmGz, path.join(OUTPUT_DIR, filename));
  latestJson.platforms['darwin-aarch64'] = {
    signature: getSig(macArmSig),
    url: `${GITHUB_RELEASE_URL}/${filename}`
  };
}

// Tambahkan macOS Intel x64
if (fs.existsSync(macIntelGz) && getSig(macIntelSig)) {
  const filename = path.basename(macIntelGz);
  fs.copyFileSync(macIntelGz, path.join(OUTPUT_DIR, filename));
  latestJson.platforms['darwin-x86_64'] = {
    signature: getSig(macIntelSig),
    url: `${GITHUB_RELEASE_URL}/${filename}`
  };
}

// Tambahkan Windows x64
if (fs.existsSync(winZip) && getSig(winSig)) {
  const filename = path.basename(winZip);
  fs.copyFileSync(winZip, path.join(OUTPUT_DIR, filename));
  latestJson.platforms['windows-x86_64'] = {
    signature: getSig(winSig),
    url: `${GITHUB_RELEASE_URL}/${filename}`
  };
}

fs.writeFileSync(path.join(OUTPUT_DIR, 'latest.json'), JSON.stringify(latestJson, null, 2));
console.log('\n==================================================');
console.log('✅ BERHASIL GENERATE UPDATER ASSETS!');
console.log('==================================================');
console.log(`Folder output: ${path.resolve(OUTPUT_DIR)}`);
console.log('File yang siap di-upload ke GitHub Releases:');
fs.readdirSync(OUTPUT_DIR).forEach(f => console.log(`  - ${f}`));
console.log('==================================================\n');
