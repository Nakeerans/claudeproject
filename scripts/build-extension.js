import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '../src/browser-extension');
const distDir = path.join(sourceDir, 'dist');

console.log('Building browser extension...');

// Create dist directory
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy manifest
fs.copyFileSync(
  path.join(sourceDir, 'manifest.json'),
  path.join(distDir, 'manifest.json')
);

// Copy background scripts
const backgroundDir = path.join(distDir, 'background');
if (!fs.existsSync(backgroundDir)) {
  fs.mkdirSync(backgroundDir, { recursive: true });
}
fs.copyFileSync(
  path.join(sourceDir, 'background/service-worker.js'),
  path.join(backgroundDir, 'service-worker.js')
);

// Copy content scripts
const contentDir = path.join(distDir, 'content');
if (!fs.existsSync(contentDir)) {
  fs.mkdirSync(contentDir, { recursive: true });
}
fs.copyFileSync(
  path.join(sourceDir, 'content/content-script.js'),
  path.join(contentDir, 'content-script.js')
);

// Copy popup files
const popupDir = path.join(distDir, 'popup');
if (!fs.existsSync(popupDir)) {
  fs.mkdirSync(popupDir, { recursive: true });
}
fs.copyFileSync(
  path.join(sourceDir, 'popup/popup.html'),
  path.join(popupDir, 'popup.html')
);
fs.copyFileSync(
  path.join(sourceDir, 'popup/popup.js'),
  path.join(popupDir, 'popup.js')
);

// Create placeholder icons
const iconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('✓ Browser extension built successfully!');
console.log(`Output directory: ${distDir}`);
console.log('\nTo load in Chrome:');
console.log('1. Go to chrome://extensions/');
console.log('2. Enable "Developer mode"');
console.log('3. Click "Load unpacked"');
console.log(`4. Select: ${distDir}`);
