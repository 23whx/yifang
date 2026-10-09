interface Localized {
  zh: string;
  en: string;
}

export interface HistoryEntry {
  year: string;
  title: Localized;
  body: Localized;
}

export const cubeHistory: HistoryEntry[] = [
  {
    year: "1974",
    title: { zh: "布达佩斯的一个教具", en: "A teaching aid in Budapest" },
    body: {
      zh: "匈牙利建筑学教师厄尔诺·鲁比克（Ernő Rubik）为了向学生解释三维空间关系，做出了第一个可以转动的立方体模型。他自己花了一个多月才把它第一次还原。",
      en: "Hungarian architecture lecturer Ernő Rubik built the first working cube to help students grasp three-dimensional relationships. It took him over a month to solve it for the first time.",
    },
  },
  {
    year: "1975",
    title: { zh: "匈牙利专利", en: "Hungarian patent" },
    body: {
      zh: "鲁比克申请了匈牙利专利。产品以「魔术方块」（Bűvös kocka）之名于 1977 年在布达佩斯的玩具店上市。",
      en: "Rubik filed for a Hungarian patent. The toy went on sale in Budapest shops in 1977 as Bűvös kocka, the \"magic cube\".",
    },
  },
  {
    year: "1980",
    title: { zh: "走向世界，改名 Rubik's Cube", en: "Global launch as Rubik's Cube" },
    body: {
      zh: "美国 Ideal Toy 公司取得国际发行权，以发明者的名字重新命名。当年获德国「年度最佳游戏」奖，之后数年内售出上亿个，成为史上最畅销的玩具之一。",
      en: "Ideal Toy Corporation licensed it for international release and renamed it after its inventor. It won Germany's Game of the Year, and over a hundred million were sold within a few years.",
    },
  },
  {
    year: "1981",
    title: { zh: "十二岁的畅销书作者", en: "A twelve-year-old bestseller" },
    body: {
      zh: "英国少年 Patrick Bossert 出版《You Can Do the Cube》，全球销量超过 150 万册。同一年，魔方进入纽约现代艺术博物馆的永久收藏。",
      en: "British schoolboy Patrick Bossert published You Can Do the Cube, which sold over 1.5 million copies. The same year the cube entered the permanent collection of New York's Museum of Modern Art.",
    },
  },
  {
    year: "1982",
    title: { zh: "第一届世界锦标赛", en: "The first World Championship" },
    body: {
      zh: "在布达佩斯举行，来自 19 个国家的选手参加。美国的 Minh Thai 以 22.95 秒夺冠。此后热潮消退，比赛中断了二十一年。",
      en: "Held in Budapest with competitors from 19 countries. Minh Thai of the USA won with 22.95 seconds. The craze faded soon after and competition paused for 21 years.",
    },
  },
  {
    year: "2003",
    title: { zh: "复兴：多伦多世锦赛", en: "Revival: Toronto Worlds" },
    body: {
      zh: "互联网让分散各地的爱好者重新聚集，第二届世锦赛在多伦多举行。次年世界魔方协会（WCA）成立，统一了规则与成绩记录。",
      en: "The internet reconnected scattered enthusiasts and a second World Championship was held in Toronto. The World Cube Association followed in 2004, standardising rules and records.",
    },
  },
  {
    year: "2010",
    title: { zh: "上帝之数 = 20", en: "God's Number is 20" },
    body: {
      zh: "Tomas Rokicki、Herbert Kociemba、Morley Davidson 与 John Dethridge 借助 Google 捐赠的算力，证明任何状态都可以在 20 步以内还原。",
      en: "Tomas Rokicki, Herbert Kociemba, Morley Davidson and John Dethridge, using computing time donated by Google, proved every position can be solved in 20 moves or fewer.",
    },
  },
  {
    year: "2018",
    title: { zh: "跨过四秒", en: "Under four seconds" },
    body: {
      zh: "5 月 Feliks Zemdegs 做出 4.22 秒；11 月中国选手杜宇生在芜湖以 3.47 秒刷新世界纪录，这一纪录保持了近五年。",
      en: "Feliks Zemdegs set 4.22 in May; in November Yusheng Du of China set 3.47 in Wuhu, a record that stood for almost five years.",
    },
  },
  {
    year: "2023",
    title: { zh: "3.13 秒", en: "3.13 seconds" },
    body: {
      zh: "6 月，美国选手 Max Park 在加州以 3.13 秒创造三阶单次世界纪录。",
      en: "In June, Max Park of the USA set the 3x3 single world record of 3.13 seconds in California.",
    },
  },
];
