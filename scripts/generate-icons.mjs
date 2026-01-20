
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SVG_PATH = path.join(process.cwd(), 'public', 'icons', 'icon.svg');
const ICON_192_PATH = path.join(process.cwd(), 'public', 'icons', 'icon-192x192.png');
const ICON_512_PATH = path.join(process.cwd(), 'public', 'icons', 'icon-512x512.png');

async function generate() {
  if (!fs.existsSync(SVG_PATH)) {
    console.error('SVG not found');
    process.exit(1);
  }

  console.log('Generating icons...');
  
  await sharp(SVG_PATH)
    .resize(192, 192)
    .toFile(ICON_192_PATH);
    
  await sharp(SVG_PATH)
    .resize(512, 512)
    .toFile(ICON_512_PATH);
    
  console.log('Icons generated!');
}

generate();
