/**
 * Rule Engine Constants
 */
import { StatType } from './stat-types';

export const positionTypeMapping: Record<string, string> = {
  '武器': 'WEAPON',
  '头盔': 'HELMET',
  '盔甲': 'ARMOR',
  '防具': 'ARMOR',
  '项链': 'NECKLACE',
  '戒指': 'RING',
  '鞋子': 'BOOTS',
  '靴子': 'BOOTS'
};

export const positionDisplay: Record<string, string> = {
  'WEAPON': '武器',
  'HELMET': '头盔',
  'ARMOR': '防具',
  'NECKLACE': '项链',
  'RING': '戒指',
  'BOOTS': '鞋子'
};

export const setTypeMapping: Record<string, string> = {
  '速度': 'SpeedSet',
  '攻击': 'AttackSet',
  '生命': 'HealthSet',
  '防御': 'DefenseSet',
  '暴击': 'CriticalSet',
  '命中': 'HitSet',
  '抵抗': 'ResistSet',
  '破灭': 'DestructionSet',
  '憎恨': 'RevengeSet',
  '吸血': 'LifestealSet',
  '反击': 'CounterSet',
  '免疫': 'ImmunitySet',
  '伤口': 'InjurySet',
  '穿透': 'PenetrationSet',
  '守护': 'ProtectionSet',
  '愤怒': 'RageSet',
  '激流': 'TorrentSet',
  '夹攻': 'UnitySet',
  '回击': 'RiposteSet',
  '逆袭': 'ReversalSet',
  '开战': 'WarfareSet',
  '追击': 'PursuitSet',
  '弱化': 'WeakeningSet',
  '全力': 'FervorSet'
};

export const setNameMap: Record<string, string> = {
  '速度': 'speed',
  '攻击': 'attack',
  '生命': 'health',
  '防御': 'defense',
  '暴击': 'critical',
  '命中': 'hit',
  '抵抗': 'resist',
  '破灭': 'destruction',
  '憎恨': 'revenge',
  '吸血': 'lifesteal',
  '反击': 'counter',
  '免疫': 'immunity',
  '伤口': 'injury',
  '穿透': 'penetration',
  '守护': 'protection',
  '愤怒': 'rage',
  '激流': 'torrent',
  '夹攻': 'unity',
  '回击': 'riposte',
  '逆袭': 'reversal',
  '开战': 'warfare',
  '追击': 'pursuit',
  '弱化': 'weakening',
  '全力': 'fervor'
};

export const positionMap: Record<string, string> = {
  '武器': 'weapon',
  '头盔': 'helmet',
  '衣服': 'armor',
  '盔甲': 'armor',
  '防具': 'armor',
  '项链': 'necklace',
  '戒指': 'ring',
  '鞋子': 'boots',
  '靴子': 'boots'
};

export const statMap: Record<string, StatType> = {
  '攻击%': StatType.ATTACK_PERCENT,
  '攻击力%': StatType.ATTACK_PERCENT,
  '攻击': StatType.ATTACK,
  '攻击力': StatType.ATTACK,
  '暴率': StatType.CRITICAL_HIT_CHANCE_PERCENT,
  '暴击率': StatType.CRITICAL_HIT_CHANCE_PERCENT,
  '暴击率%': StatType.CRITICAL_HIT_CHANCE_PERCENT,
  '爆伤': StatType.CRITICAL_HIT_DAMAGE_PERCENT,
  '暴击伤害': StatType.CRITICAL_HIT_DAMAGE_PERCENT,
  '暴击伤害%': StatType.CRITICAL_HIT_DAMAGE_PERCENT,
  '速度': StatType.SPEED,
  '生命%': StatType.HEALTH_PERCENT,
  '生命值%': StatType.HEALTH_PERCENT,
  '生命': StatType.HEALTH,
  '生命值': StatType.HEALTH,
  '防御%': StatType.DEFENSE_PERCENT,
  '防御力%': StatType.DEFENSE_PERCENT,
  '防御': StatType.DEFENSE,
  '防御力': StatType.DEFENSE,
  '抵抗': StatType.EFFECT_RESISTANCE_PERCENT,
  '效果抗性': StatType.EFFECT_RESISTANCE_PERCENT,
  '效果抗性%': StatType.EFFECT_RESISTANCE_PERCENT,
  '命中': StatType.EFFECTIVENESS_PERCENT,
  '效果命中': StatType.EFFECTIVENESS_PERCENT,
  '效果命中%': StatType.EFFECTIVENESS_PERCENT
};

export const CSV_EXPORT_HEADER = [
  '检测项', '套装', '副属性有效属性', '部位', '主属性',
  '分数条件', '倍率', '分数条件', '倍率',
  '分数条件', '倍率', '分数条件', '倍率'
];

export const DEFAULT_VALUES = {
  ALL: '全部',
  NOT_BOOT: '非鞋子',
  EMPTY_STRING: '',
  MAX_SPEED: 999,
  MIN_SPEED: 0,
  MAX_SCORE: Infinity,
  MIN_SCORE: 0
} as const;

export const REGEX_PATTERNS = {
  SIMPLE_NUMBER: /^\d+(\.\d+)?$/,
  SPEED_RANGE: /速度(\d+)-(\d+)/,
  SPEED_COMPARISON: /^速度(>=|>|<=|<|==)(\d+(?:\.\d+)?)$/,
  SPEED_WITH_SCORE: /速度(>=|>|<=|<|==)?(\d+(?:\.\d+)?)/,
  SCORE_RANGE: /分数\[(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\]/,
  SCORE_COMPARISON: /分数(>=|>|<=|<|==)(\d+(?:\.\d+)?)/,
  LIST_SEPARATOR: /[，,\s]+/
} as const;
