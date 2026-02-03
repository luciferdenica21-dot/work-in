import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const inputPath = path.join(projectRoot, 'public', 'img', 'logo.png');

const outputs = [
  { file: 'favicon-16x16.png', size: 16, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  { file: 'favicon-32x32.png', size: 32, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  { file: 'apple-touch-icon.png', size: 180, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  { file: 'android-chrome-192x192.png', size: 192, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  { file: 'android-chrome-512x512.png', size: 512, background: { r: 0, g: 0, b: 0, alpha: 0 } }
];

const makeSquareIcon = async ({ file, size, background }) => {
  const outPath = path.join(projectRoot, 'public', file);
  await sharp(inputPath)
    .trim()
    .resize(size, size, { fit: 'contain', background })
    .png()
    .toFile(outPath);
  console.log(`Generated: ${outPath}`);
};

await Promise.all(outputs.map(makeSquareIcon));
