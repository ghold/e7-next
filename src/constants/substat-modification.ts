// 第七史诗装备分析工具 - 副属性转换相关常量

import { EquipmentType } from './equipment-types';

export interface SubstatModificationLimits {
  Speed: number[];
  Health: number[];
  Defense: number[];
  Attack: number[];
  CriticalHitChancePercent: number[];
  CriticalHitDamagePercent: number[];
  AttackPercent: number[];
  DefensePercent: number[];
  HealthPercent: number[];
  EffectivenessPercent: number[];
  EffectResistancePercent: number[];
}

export const LEVEL_88_MODIFICATION_LIMITS: SubstatModificationLimits = {
  Speed: [4, 5, 6, 8, 9, 10],
  Health: [203, 336, 422, 461, 578, 659],
  Defense: [35, 61, 76, 80, 97, 111],
  Attack: [47, 77, 101, 109, 129, 151],
  CriticalHitChancePercent: [4, 6, 8, 10, 11, 12],
  CriticalHitDamagePercent: [7, 9, 12, 15, 16, 17],
  AttackPercent: [8, 11, 14, 17, 18, 19],
  DefensePercent: [8, 11, 14, 17, 18, 19],
  HealthPercent: [8, 11, 14, 17, 18, 19],
  EffectivenessPercent: [8, 11, 14, 17, 18, 19],
  EffectResistancePercent: [8, 11, 14, 17, 18, 19]
};

export const LEVEL_90_MODIFICATION_LIMITS: SubstatModificationLimits = {
  Speed: [4, 6, 8, 11, 13, 14],
  Health: [259, 448, 590, 685, 858, 995],
  Defense: [44, 79, 103, 116, 142, 165],
  Attack: [58, 99, 134, 153, 184, 217],
  CriticalHitChancePercent: [5, 8, 11, 14, 16, 18],
  CriticalHitDamagePercent: [8, 11, 15, 19, 22, 24],
  AttackPercent: [9, 14, 18, 22, 25, 27],
  DefensePercent: [9, 14, 18, 22, 25, 27],
  HealthPercent: [9, 14, 18, 22, 25, 27],
  EffectivenessPercent: [9, 14, 18, 22, 25, 27],
  EffectResistancePercent: [9, 14, 18, 22, 25, 27]
};

export type AllowedSubstatTypes = {
  [K in EquipmentType]: string[];
};

export const EQUIPMENT_ALLOWED_SUBSTATS: AllowedSubstatTypes = {
  [EquipmentType.WEAPON]: [
    'Speed', 'Health', 'CriticalHitChancePercent', 'CriticalHitDamagePercent',
    'AttackPercent', 'HealthPercent', 'EffectivenessPercent', 'EffectResistancePercent'
  ],
  [EquipmentType.HELMET]: [
    'Speed', 'Attack', 'Defense', 'DefensePercent', 'CriticalHitChancePercent',
    'CriticalHitDamagePercent', 'AttackPercent', 'HealthPercent',
    'EffectivenessPercent', 'EffectResistancePercent'
  ],
  [EquipmentType.ARMOR]: [
    'Speed', 'Health', 'DefensePercent', 'CriticalHitChancePercent',
    'CriticalHitDamagePercent', 'HealthPercent', 'EffectivenessPercent',
    'EffectResistancePercent'
  ],
  [EquipmentType.NECKLACE]: [
    'Speed', 'Attack', 'Health', 'Defense', 'DefensePercent',
    'CriticalHitChancePercent', 'CriticalHitDamagePercent', 'AttackPercent',
    'HealthPercent', 'EffectivenessPercent', 'EffectResistancePercent'
  ],
  [EquipmentType.RING]: [
    'Speed', 'Attack', 'Health', 'Defense', 'DefensePercent',
    'CriticalHitChancePercent', 'CriticalHitDamagePercent', 'AttackPercent',
    'HealthPercent', 'EffectivenessPercent', 'EffectResistancePercent'
  ],
  [EquipmentType.BOOTS]: [
    'Speed', 'Attack', 'Health', 'Defense', 'DefensePercent',
    'CriticalHitChancePercent', 'CriticalHitDamagePercent', 'AttackPercent',
    'HealthPercent', 'EffectivenessPercent', 'EffectResistancePercent'
  ]
};

export function getModificationLimitsByLevel(level: number): SubstatModificationLimits | null {
  switch (level) {
    case 88:
      return LEVEL_88_MODIFICATION_LIMITS;
    case 90:
      return LEVEL_90_MODIFICATION_LIMITS;
    default:
      return null;
  }
}

export function getAllowedSubstatsForEquipment(equipmentType: EquipmentType): string[] {
  return EQUIPMENT_ALLOWED_SUBSTATS[equipmentType] || [];
}
