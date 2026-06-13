// 第七史诗装备分析工具 - 装备类型相关常量

export enum EquipmentType {
  WEAPON = 'weapon',
  HELMET = 'helm',
  ARMOR = 'armor',
  BOOTS = 'boot',
  NECKLACE = 'neck',
  RING = 'ring'
}

export const EquipmentTypeDisplay: Record<EquipmentType, string> = {
  [EquipmentType.WEAPON]: '武器',
  [EquipmentType.HELMET]: '头盔',
  [EquipmentType.ARMOR]: '防具',
  [EquipmentType.BOOTS]: '鞋子',
  [EquipmentType.NECKLACE]: '项链',
  [EquipmentType.RING]: '戒指'
};

export enum RankType {
  EPIC = 'Epic'
}

export const RankTypeDisplay: Record<RankType, string> = {
  [RankType.EPIC]: '史诗'
};

export const EQUIPMENT_TYPES = Object.values(EquipmentType);
export const RANK_TYPES = Object.values(RankType);

export function getEquipmentTypeDisplay(equipmentType: EquipmentType): string {
  return EquipmentTypeDisplay[equipmentType] || equipmentType;
}

export function getRankTypeDisplay(rankType: RankType): string {
  return RankTypeDisplay[rankType] || rankType;
}
