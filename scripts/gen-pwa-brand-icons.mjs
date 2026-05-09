/**
 * 根据 app/favicon.ico 的视觉风格生成 PWA PNG（纯色底 + 手写体 wm）。
 * 色值从 favicon 最大帧采样：底约 #00ffff，字约 #fe01ff。
 * 字体依赖本机已安装的手写体（macOS 常见有 Snell Roundhand / Brush Script MT）。
 *
 * 用法：node scripts/gen-pwa-brand-icons.mjs
 */
import sharp from 'sharp';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');

/** 与 favicon 采样一致的纯色底与字色 */
const BG = '#00ffff';
const INK = '#fe01ff';

/**
 * @param {number} side 画布边长
 */
function wmSvg(side) {
  // 字号约为画布 0.42～0.48，便于留白；略上移抵消手写体视觉重心
  const fontSize = Math.round(side * 0.44);
  const dy = Math.round(side * 0.02);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" viewBox="0 0 ${side} ${side}">
  <rect width="100%" height="100%" fill="${BG}"/>
  <text
    x="50%"
    y="50%"
    dx="0"
    dy="${dy}"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="Snell Roundhand, &quot;Brush Script MT&quot;, &quot;Segoe Script&quot;, &quot;Apple Chancery&quot;, cursive"
    font-size="${fontSize}"
    font-weight="500"
    fill="${INK}"
    letter-spacing="${Math.round(-side * 0.015)}"
  >wm</text>
</svg>`;
}

const svg512 = wmSvg(512);
const png512 = await sharp(Buffer.from(svg512)).png().toBuffer();

await sharp(png512).resize(192, 192).png().toFile(join(publicDir, 'icon-192.png'));
await sharp(png512).toFile(join(publicDir, 'icon-512.png'));
