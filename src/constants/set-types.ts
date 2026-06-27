// 第七史诗装备分析工具 - 套装类型相关常量

export enum SetType {
  SPEED_SET = 'SpeedSet',
  ATTACK_SET = 'AttackSet',
  HEALTH_SET = 'HealthSet',
  CRITICAL_SET = 'CriticalSet',
  COUNTER_SET = 'CounterSet',
  DEFENSE_SET = 'DefenseSet',
  DESTRUCTION_SET = 'DestructionSet',
  HIT_SET = 'HitSet',
  IMMUNITY_SET = 'ImmunitySet',
  INJURY_SET = 'InjurySet',
  LIFESTEAL_SET = 'LifestealSet',
  PENETRATION_SET = 'PenetrationSet',
  PROTECTION_SET = 'ProtectionSet',
  RAGE_SET = 'RageSet',
  RESIST_SET = 'ResistSet',
  REVENGE_SET = 'RevengeSet',
  TORRENT_SET = 'TorrentSet',
  UNITY_SET = 'UnitySet',
  REVERSAL_SET = "ReversalSet",
  RIPOSTE_SET = "RiposteSet",
  WARFARE_SET = "WarfareSet",
  PERSUIT_SET = "PursuitSet",
  WEAKENING_SET = "WeakeningSet",
  FERVOR_SET = "FervorSet"
}

export const SetTypeDisplay: Record<SetType, string> = {
  [SetType.SPEED_SET]: '速度',
  [SetType.ATTACK_SET]: '攻击',
  [SetType.HEALTH_SET]: '生命',
  [SetType.CRITICAL_SET]: '暴击',
  [SetType.COUNTER_SET]: '反击',
  [SetType.DEFENSE_SET]: '防御',
  [SetType.DESTRUCTION_SET]: '破灭',
  [SetType.HIT_SET]: '命中',
  [SetType.IMMUNITY_SET]: '免疫',
  [SetType.INJURY_SET]: '伤口',
  [SetType.LIFESTEAL_SET]: '吸血',
  [SetType.PENETRATION_SET]: '穿透',
  [SetType.PROTECTION_SET]: '守护',
  [SetType.RAGE_SET]: '愤怒',
  [SetType.RESIST_SET]: '抵抗',
  [SetType.REVENGE_SET]: '憎恨',
  [SetType.TORRENT_SET]: '激流',
  [SetType.UNITY_SET]: '夹击',
  [SetType.REVERSAL_SET]: '逆袭',
  [SetType.RIPOSTE_SET]: '回击',
  [SetType.WARFARE_SET]: '开战',
  [SetType.PERSUIT_SET]: '追击',
  [SetType.WEAKENING_SET]: '弱化',
  [SetType.FERVOR_SET]: '全力'
};

export const SET_TYPES = Object.values(SetType);

export function getSetTypeDisplay(setType: SetType): string {
  return SetTypeDisplay[setType] || setType;
}
