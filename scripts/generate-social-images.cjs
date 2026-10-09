// Static social previews work on ordinary file hosting, without an image API.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const output = path.resolve(__dirname, '../public/social');
const copy = {
  zh: ['弈方 · Yifang', '学规则，动手练习', '魔方 · 国际象棋 · 象棋 · 将棋 · 围棋', '麻将与牌桌规则教学 · 无需注册'],
  en: ['Yifang', 'Learn the rules. Practice the moves.', 'CHESS · GO · SHOGI · XIANGQI · RUBIK’S CUBE', 'Mahjong & table-game lessons · No account needed'],
};
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
(async () => {
  fs.mkdirSync(output, { recursive: true });
  for (const [locale, lines] of Object.entries(copy)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#21170f"/>
      <rect x="36" y="36" width="1128" height="558" fill="#f3e7cd" stroke="#ae8550" stroke-width="3"/>
      <path d="M84 190H1116 M84 484H1116" stroke="#ae8550" stroke-width="2"/>
      <g fill="#392616" font-family="Noto Serif SC, Microsoft YaHei, Georgia, serif">
        <text x="84" y="145" font-size="56" font-weight="700">${escape(lines[0])}</text>
        <text x="84" y="310" font-size="${locale === 'zh' ? 68 : 48}" font-weight="700">${escape(lines[1])}</text>
        <text x="84" y="395" font-size="28">${escape(lines[2])}</text>
        <text x="84" y="545" font-size="26">${escape(lines[3])}</text>
      </g>
    </svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(output, `${locale}.png`));
  }
  console.log('Generated bilingual 1200×630 social previews.');
})().catch(error => { console.error(error); process.exitCode = 1; });
