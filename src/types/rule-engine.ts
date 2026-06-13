import { Equipment, StatType, SetType, EquipmentType } from '@/constants';

export enum SpecialCheckType {
  SPECIAL_CHECK_ONE = 'special_check_one',
  SPECIAL_CHECK_THREE = 'special_check_three'
}

export interface ScoreCondition {
  type: 'range' | 'comparison' | 'speed_range';
  min?: number;
  max?: number;
  operator?: '>=' | '>' | '<=' | '<' | '==';
  value?: number;
  speedMin?: number;
  speedMax?: number;
  scoreMin?: number;
  scoreMax?: number;
  useEffectiveScore?: boolean;
}

export interface RuleMultiplier {
  expression: string;
  baseValue?: number;
}

export interface RuleConditionSet {
  id: string;
  condition: ScoreCondition;
  multiplier: RuleMultiplier;
}

export interface SetFilter {
  type: 'all' | 'in';
  values?: string[];
}

export interface PositionFilter {
  type: 'all' | 'not_boot' | 'is';
  values?: string[];
}

export interface MainStatFilter {
  type: 'all' | 'in';
  values?: string[];
}

export interface SubStatFilter {
  type: 'all' | 'act_on' | 'act_on_special' | 'have';
  values?: string[];
  specialCheckTypes?: SpecialCheckType[];
}

export interface EquipmentRule {
  id: string;
  checkItem: string;
  sets: SetFilter;
  validStats: SubStatFilter;
  positions: PositionFilter;
  mainStats: MainStatFilter;
  conditionSets: RuleConditionSet[];
}

export interface RuleMatchResult {
  rule: EquipmentRule;
  matched: boolean;
  score: number;
  totalScore: number;
  appliedCondition?: RuleConditionSet;
  matchedConditions?: Array<{
    condition: ScoreCondition | string;
    score: number;
    multiplier: number;
  }>;
  details: {
    setMatch: boolean;
    positionMatch: boolean;
    mainStatMatch: boolean;
    validStatMatch: boolean;
    scoreCalculated: number;
  };
}

export interface ScoringContext {
  equipment: Equipment;
  calculatedScore: number;
  speedValue?: number;
  effectiveScore?: number;
}

export interface RuleEngineConfig {
  rules: EquipmentRule[];
  enableDebug?: boolean;
}

export interface ParsedCSVRule {
  checkItem: string;
  sets: string;
  validStats: string;
  position: string;
  mainStat: string;
  conditions: Array<{
    scoreCondition: string;
    multiplier: string;
  }>;
}

export interface EvaluationContext {
  score: number;
  speed?: number;
  effectiveScore?: number;
  [key: string]: number | undefined;
}

export class RuleEngineError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'RuleEngineError';
  }
}

export class ParseError extends RuleEngineError {
  constructor(message: string) {
    super(message, 'PARSE_ERROR');
  }
}

export class EvaluationError extends RuleEngineError {
  constructor(message: string) {
    super(message, 'EVALUATION_ERROR');
  }
}

export type RuleMatchResults = RuleMatchResult[];
export type RuleValidator = (equipment: Equipment) => boolean;
export type ScoreCalculator = (equipment: Equipment) => number;
