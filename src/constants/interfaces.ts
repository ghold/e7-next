// 第七史诗装备分析工具 - 接口定义

import { StatType } from './stat-types';
import { EquipmentType, RankType } from './equipment-types';
import { SetType } from './set-types';

export interface MainStat {
  type: StatType;
  value: number;
}

export interface SubStat {
  type: StatType;
  value: number;
  rolls: number;
  modified?: boolean;
  originalValue?: number;
  reforged?: boolean;
}

export interface RuleMatchResult {
  ruleName: string;
  score: number;
}

export interface Equipment {
  code: string;
  ct: number;
  e: number;
  f: string;
  g: number;
  id: number;
  l?: boolean;
  level: number;
  mainStatBaseValue: number;
  mainStatId: string;
  mainStatType: string;
  mainStatValue: number;
  mg: number;
  op: any[];
  p?: number;
  s: string;
  statMultiplier: number;
  tierMultiplier: number;
  type: EquipmentType;
  gear: string;
  rank: RankType;
  set: SetType;
  name: string;
  enhance: number;
  main: MainStat;
  substats: SubStat[];
  ingameId: number;
  ingameEquippedId: string | number;
  bestRule?: string;
  bestScore?: number;
  allRuleResults?: RuleMatchResult[];
  potentialScore?: number;
}

export interface EquipmentData {
  items: Equipment[];
}
