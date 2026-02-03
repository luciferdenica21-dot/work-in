import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const pngPath = path.join(projectRoot, 'public', 'img', 'logo.png');
const outFavicon = path.join(projectRoot, 'public', 'favicon.svg');
const outSafari = path.join(projectRoot, 'public', 'safari-pinned-tab.svg');

const pngBase64 = fs.readFileSync(pngPath).toString('base64');
const dataHref = `data:image/png;base64,${pngBase64}`;

const svg = (href) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><image href="${href}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet"/></svg>`;

fs.writeFileSync(outFavicon, svg(dataHref));
fs.writeFileSync(outSafari, svg(dataHref));
