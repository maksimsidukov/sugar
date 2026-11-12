import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const source = new URL('../public/icons/icon.svg', import.meta.url);
const svg = await readFile(source);
const icons = [
  { size: 192, file: 'icon-192.png' },
  { size: 512, file: 'icon-512.png' },
  { size: 180, file: 'apple-touch-icon.png' },
];

await Promise.all(icons.map(({ size, file }) =>
  sharp(svg, { density: 300 })
    .resize(size, size)
    .png()
    .toFile(fileURLToPath(new URL(`../public/icons/${file}`, import.meta.url))),
));
