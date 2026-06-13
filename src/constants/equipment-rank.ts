export const EQUIPMENT_RANK = {
  'NORMAL': 'Normal',
  'GOOD': 'Good',
  'RARE': 'Rare',
  'HEROIC': 'Heroic',
  'EPIC': 'Epic'
} as const;

export const EQUIPMENT_RANK_CHINESE = {
  'NORMAL': '一般',
  'GOOD': '高级',
  'RARE': '稀有',
  'HEROIC': '英雄',
  'EPIC': '传说'
} as const;

export const getRankChinese = (rank: string): string => {
  const upperRank = rank.toUpperCase();
  return EQUIPMENT_RANK_CHINESE[upperRank as keyof typeof EQUIPMENT_RANK_CHINESE] || rank;
};

export type EquipmentRankType = keyof typeof EQUIPMENT_RANK;
export type EquipmentRankChineseType = keyof typeof EQUIPMENT_RANK_CHINESE;
