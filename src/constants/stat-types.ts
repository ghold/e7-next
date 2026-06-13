// 第七史诗装备分析工具 - 属性类型相关常量
// Epic Seven Equipment Analysis Tool - Stat Types Constants

// 属性类型枚举
export enum StatType {
  HEALTH = 'Health',
  ATTACK = 'Attack',
  DEFENSE = 'Defense',
  ATTACK_PERCENT = 'AttackPercent',
  HEALTH_PERCENT = 'HealthPercent',
  DEFENSE_PERCENT = 'DefensePercent',
  CRITICAL_HIT_DAMAGE_PERCENT = 'CriticalHitDamagePercent',
  CRITICAL_HIT_CHANCE_PERCENT = 'CriticalHitChancePercent',
  EFFECTIVENESS_PERCENT = 'EffectivenessPercent',
  EFFECT_RESISTANCE_PERCENT = 'EffectResistancePercent',
  SPEED = 'Speed'
}

// 原始属性类型枚举
export enum RawStatType {
  HEALTH = 'Health',
  ATTACK = 'Attack',
  DEFENSE = 'Defense',
  ATTACK_PERCENT = 'AttackPercent',
  HEALTH_PERCENT = 'HealthPercent',
  DEFENSE_PERCENT = 'DefensePercent',
  CRITICAL_HIT_DAMAGE_PERCENT = 'CriticalHitDamagePercent',
  CRITICAL_HIT_CHANCE_PERCENT = 'CriticalHitChancePercent',
  EFFECTIVENESS_PERCENT = 'EffectivenessPercent',
  EFFECT_RESISTANCE_PERCENT = 'EffectResistancePercent',
  SPEED = 'Speed'
}

// 原始属性类型到显示属性类型的映射
export const RawStatToStatType: Record<RawStatType, StatType> = {
  [RawStatType.HEALTH]: StatType.HEALTH,
  [RawStatType.ATTACK]: StatType.ATTACK,
  [RawStatType.DEFENSE]: StatType.DEFENSE,
  [RawStatType.ATTACK_PERCENT]: StatType.ATTACK_PERCENT,
  [RawStatType.HEALTH_PERCENT]: StatType.HEALTH_PERCENT,
  [RawStatType.DEFENSE_PERCENT]: StatType.DEFENSE_PERCENT,
  [RawStatType.CRITICAL_HIT_DAMAGE_PERCENT]: StatType.CRITICAL_HIT_DAMAGE_PERCENT,
  [RawStatType.CRITICAL_HIT_CHANCE_PERCENT]: StatType.CRITICAL_HIT_CHANCE_PERCENT,
  [RawStatType.EFFECTIVENESS_PERCENT]: StatType.EFFECTIVENESS_PERCENT,
  [RawStatType.EFFECT_RESISTANCE_PERCENT]: StatType.EFFECT_RESISTANCE_PERCENT,
  [RawStatType.SPEED]: StatType.SPEED
};

// 属性类型显示名称映射
export const StatTypeDisplay: Record<StatType, string> = {
  [StatType.HEALTH]: '生命值',
  [StatType.ATTACK]: '攻击力',
  [StatType.DEFENSE]: '防御力',
  [StatType.ATTACK_PERCENT]: '攻击力%',
  [StatType.HEALTH_PERCENT]: '生命值%',
  [StatType.DEFENSE_PERCENT]: '防御力%',
  [StatType.CRITICAL_HIT_DAMAGE_PERCENT]: '暴击伤害%',
  [StatType.CRITICAL_HIT_CHANCE_PERCENT]: '暴击率%',
  [StatType.EFFECTIVENESS_PERCENT]: '效果命中%',
  [StatType.EFFECT_RESISTANCE_PERCENT]: '效果抗性%',
  [StatType.SPEED]: '速度'
};

export const STAT_TYPES = Object.values(StatType);
export const RAW_STAT_TYPES = Object.values(RawStatType);

export function getStatTypeFromRaw(rawStatType: string): StatType | undefined {
  return RawStatToStatType[rawStatType as RawStatType];
}

export function getStatTypeDisplay(statType: StatType): string {
  return StatTypeDisplay[statType] || statType;
}
