import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sourceImage = 'C:\\Users\\Guill\\.gemini\\antigravity-ide\\brain\\b7fba8e2-10e2-47e6-83ad-945a46fc4008\\sintonia_app_icon_1793640103698.jpg';
const publicDir = path.resolve('public');
const iconsDir = path.resolve('public/icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generate() {
  console.log('Generating PWA icons from:', sourceImage);

  // 192x192
  await sharp(sourceImage)
    .resize(192, 192)
    .toFormat('png')
    .toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('Generated icon-192.png');

  // 512x512
  await sharp(sourceImage)
    .resize(512, 512)
    .toFormat('png')
    .toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('Generated icon-512.png');

  // 512x512 maskable (padded 10% to fit safe area)
  await sharp(sourceImage)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: '#0f172a'
    })
    .toFormat('png')
    .toFile(path.join(iconsDir, 'icon-512-maskable.png'));
  console.log('Generated icon-512-maskable.png');

  // Apple touch icon (180x180)
  await sharp(sourceImage)
    .resize(180, 180)
    .toFormat('png')
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  // Logo for in-app headers
  await sharp(sourceImage)
    .resize(256, 256)
    .toFormat('png')
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('Generated logo.png');

  // Favicon (64x64)
  await sharp(sourceImage)
    .resize(64, 64)
    .toFormat('png')
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('Generated favicon.ico');

  console.log('All icons generated successfully!');
}

generate().catch(console.error);
