import type { Locale } from '@/lib/i18n';
import type { GameSlug } from '@/content/games';

type Card = { title: string; line?: string; tags: string[]; alt: string };

/** Text baked into the share cards in public/social (scripts/generate-social-images.cjs) and their alt text. */
export const socialCards: { site: Record<Locale, Card & { line: string }>; games: Record<GameSlug, Record<Locale, Card>> } = {
  site: {
    zh: { title: '学规则，动手练习', line: '象棋、围棋、国际象棋、将棋、麻将、德州扑克与魔方，从零开始。', tags: ['图解教程', '人机对弈', '好友对战', '免费免注册'],
      alt: '弈方分享图：学规则，动手练习——棋类、麻将、扑克与魔方入门' },
    en: { title: 'Learn the rules, then play', line: 'Chess, xiangqi, Go, shogi, mahjong, poker and the Rubik’s Cube from zero.', tags: ['Lessons', 'Vs computer', 'With friends', 'Free, no sign-up'],
      alt: 'Yifang share card: learn the rules, then play — board games, mahjong, poker and the cube' },
  },
  games: {
    cube: { zh: { title: '三阶魔方入门', tags: ['层先法图解', '3D 模拟器', '免费'], alt: '弈方三阶魔方入门：层先法图解与 3D 模拟器' },
      en: { title: 'Solve the Rubik’s Cube', tags: ['Step by step', '3D simulator', 'Free'], alt: 'Yifang: learn to solve the Rubik’s Cube with a 3D simulator' } },
    chess: { zh: { title: '国际象棋入门', tags: ['规则教程', '人机对弈', '好友对战', '免费'], alt: '弈方国际象棋入门：规则教程、人机对弈与好友对战' },
      en: { title: 'Chess for beginners', tags: ['Lessons', 'Vs computer', 'With friends', 'Free'], alt: 'Yifang: chess lessons for beginners, play the computer or friends' } },
    xiangqi: { zh: { title: '中国象棋入门', tags: ['规则教程', '人机对弈', '好友对战', '免费'], alt: '弈方中国象棋入门：规则教程、人机对弈与好友对战' },
      en: { title: 'Xiangqi for beginners', tags: ['Lessons', 'Vs computer', 'With friends', 'Free'], alt: 'Yifang: xiangqi (Chinese chess) lessons, play the computer or friends' } },
    shogi: { zh: { title: '日本将棋入门', tags: ['规则教程', '人机对弈', '好友对战', '免费'], alt: '弈方日本将棋入门：规则教程、人机对弈与好友对战' },
      en: { title: 'Shogi for beginners', tags: ['Lessons', 'Vs computer', 'With friends', 'Free'], alt: 'Yifang: shogi lessons for beginners, play the computer or friends' } },
    go: { zh: { title: '围棋入门', tags: ['规则教程', '死活练习', '好友对战', '免费'], alt: '弈方围棋入门：规则教程、死活练习与好友对战' },
      en: { title: 'Go for beginners', tags: ['Lessons', 'Puzzles', 'With friends', 'Free'], alt: 'Yifang: Go lessons for beginners, puzzles and games with friends' } },
    mahjong: { zh: { title: '麻将规则入门', tags: ['日麻', '国标', '四川', '好友房'], alt: '弈方麻将入门：日本麻将、国标麻将、四川麻将规则与好友房' },
      en: { title: 'Learn mahjong', tags: ['Riichi', 'Chinese Official', 'Sichuan', 'With friends'], alt: 'Yifang: learn Riichi, Chinese Official and Sichuan mahjong, play with friends' } },
    holdem: { zh: { title: '德州扑克入门', tags: ['规则教程', '牌型练习', '好友对战', '免费'], alt: '弈方德州扑克入门：规则教程、牌型练习与好友对战' },
      en: { title: 'Texas Hold’em basics', tags: ['Lessons', 'Hand drills', 'With friends', 'Free'], alt: 'Yifang: Texas Hold’em rules, hand-ranking drills and games with friends' } },
    baccarat: { zh: { title: '百家乐规则', tags: ['补牌规则', '计分练习', '只学不赌'], alt: '弈方百家乐规则：补牌规则与计分练习，只学不赌' },
      en: { title: 'Baccarat rules', tags: ['Drawing rules', 'Scoring drills', 'No gambling'], alt: 'Yifang: baccarat drawing rules and scoring drills, no gambling' } },
  },
};
