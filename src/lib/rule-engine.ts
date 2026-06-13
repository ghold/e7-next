import {
  Equipment, StatType, SetType, EquipmentType,
  StatTypeDisplay, SetTypeDisplay, EquipmentTypeDisplay,
  positionTypeMapping, setTypeMapping, setNameMap, positionMap, statMap,
  CSV_EXPORT_HEADER
} from '@/constants';
import {
  EquipmentRule, RuleMatchResult, RuleEngineConfig, ScoreCondition,
  RuleMultiplier, RuleConditionSet, ScoringContext, EvaluationContext,
  ParseError, EvaluationError, SetFilter, PositionFilter, MainStatFilter,
  SubStatFilter, SpecialCheckType
} from '@/types/rule-engine';
import { calculateEquipmentScore } from './equipment-scoring';
import { evaluateExpression } from './expression-eval';

export class RuleEngine {
  private rules: EquipmentRule[] = [];
  private debugMode: boolean = false;

  constructor(config?: RuleEngineConfig) {
    if (config) {
      this.rules = config.rules;
      this.debugMode = config.enableDebug || false;
    }
  }

  parseCSVToRules(csvContent: string): EquipmentRule[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
      throw new ParseError('CSV content is empty or invalid');
    }

    const header = lines[0].split(',');
    const rules: EquipmentRule[] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(',');
      if (row.length < header.length) continue;

      try {
        const rule = this.parseCSVRow(row, i);
        if (rule) rules.push(rule);
      } catch (error) {
        if (this.debugMode) {
          console.warn(`Failed to parse row ${i + 1}:`, error);
        }
      }
    }

    this.rules = rules;
    return rules;
  }

  private parseCSVRow(row: string[], rowIndex: number): EquipmentRule | null {
    if (row.length < 7) return null;

    const [checkItem, sets, validStats, position, mainStat, ...conditionData] = row;
    const parsedValidStats = this.parseSubStatFilter(validStats);

    const conditionSets: RuleConditionSet[] = [];
    for (let i = 0; i < conditionData.length; i += 2) {
      const conditionStr = conditionData[i]?.trim();
      const multiplierStr = conditionData[i + 1]?.trim();

      if (conditionStr && multiplierStr) {
        try {
          const condition = this.parseCondition(conditionStr);
          const multiplier = this.parseMultiplier(multiplierStr);

          if (parsedValidStats.type === 'act_on' || parsedValidStats.type === 'act_on_special') {
            condition.useEffectiveScore = true;
          }

          conditionSets.push({ id: `condition_${rowIndex}_${i}`, condition, multiplier });
        } catch (error) {
          if (this.debugMode) {
            console.warn(`Failed to parse condition set at row ${rowIndex + 1}:`, error);
          }
        }
      }
    }

    return {
      id: `rule_${rowIndex}`,
      checkItem: checkItem.trim(),
      sets: this.parseSetFilter(sets),
      validStats: parsedValidStats,
      positions: this.parsePositionFilter(position),
      mainStats: this.parseMainStatFilter(mainStat),
      conditionSets
    };
  }

  private parseCondition(conditionStr: string): ScoreCondition {
    const condition = conditionStr.trim();
    const useEffectiveScore = condition.includes('有效分数');

    // Speed + score compound conditions
    if (condition.includes('速度') && (condition.includes('分数') || condition.includes('有效分数'))) {
      const speedMatch = condition.match(/速度(>=|>|<=|<|==)?(\d+(?:\.\d+)?)/);

      const scoreRangeMatch = condition.match(/(分数|有效分数)\[(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\]/);
      if (speedMatch && scoreRangeMatch) {
        const speedOperator = speedMatch[1] || '>=';
        const speedValue = parseFloat(speedMatch[2]);
        return {
          type: 'speed_range',
          speedMin: speedOperator === '>=' || speedOperator === '>' ? speedValue : 0,
          speedMax: speedOperator === '<=' || speedOperator === '<' ? speedValue : 999,
          scoreMin: parseFloat(scoreRangeMatch[2]),
          scoreMax: parseFloat(scoreRangeMatch[3]),
          useEffectiveScore
        };
      }

      const scoreComparisonMatch = condition.match(/(分数|有效分数)(>=|>|<=|<|==)(\d+(?:\.\d+)?)/);
      if (speedMatch && scoreComparisonMatch) {
        const speedOperator = speedMatch[1] || '>=';
        const speedValue = parseFloat(speedMatch[2]);
        const scoreOperator = scoreComparisonMatch[2];
        const scoreValue = parseFloat(scoreComparisonMatch[3]);

        let scoreMin: number | undefined;
        let scoreMax: number | undefined;

        if (scoreOperator === '>=' || scoreOperator === '>') scoreMin = scoreValue;
        else if (scoreOperator === '<=' || scoreOperator === '<') scoreMax = scoreValue;
        else if (scoreOperator === '==') { scoreMin = scoreValue; scoreMax = scoreValue; }

        return {
          type: 'speed_range',
          speedMin: speedOperator === '>=' || speedOperator === '>' ? speedValue : 0,
          speedMax: speedOperator === '<=' || speedOperator === '<' ? speedValue : 999,
          scoreMin, scoreMax, useEffectiveScore
        };
      }
    }

    // Simple speed range like "速度22-24"
    if (condition.includes('速度') && condition.includes('-') && !condition.includes('分数')) {
      const match = condition.match(/速度(\d+)-(\d+)/);
      if (match) {
        return {
          type: 'speed_range',
          speedMin: parseInt(match[1]),
          speedMax: parseInt(match[2])
        };
      }
    }

    // Simple speed comparison like "速度>=27"
    const speedComparisonMatch = condition.match(/^速度(>=|>|<=|<|==)(\d+(?:\.\d+)?)$/);
    if (speedComparisonMatch) {
      const operator = speedComparisonMatch[1];
      const value = parseFloat(speedComparisonMatch[2]);

      if (operator === '>=' || operator === '>') {
        return { type: 'speed_range', speedMin: value, speedMax: 999 };
      } else if (operator === '<=' || operator === '<') {
        return { type: 'speed_range', speedMin: 0, speedMax: value };
      }
    }

    // Score comparison like "分数>=75"
    const comparisonMatch = condition.match(/(分数|有效分数)(>=|>|<=|<|==)(\d+(?:\.\d+)?)/);
    if (comparisonMatch) {
      return {
        type: 'comparison',
        operator: comparisonMatch[2] as any,
        value: parseFloat(comparisonMatch[3]),
        useEffectiveScore
      };
    }

    // Score range like "分数[65-73]"
    const rangeMatch = condition.match(/(分数|有效分数)\[(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)\]/);
    if (rangeMatch) {
      return {
        type: 'range',
        min: parseFloat(rangeMatch[2]),
        max: parseFloat(rangeMatch[3]),
        useEffectiveScore
      };
    }

    throw new ParseError(`Unable to parse condition: ${condition}`);
  }

  private parseMultiplier(multiplierStr: string): RuleMultiplier {
    const multiplier = multiplierStr.trim();
    if (/^\d+(\.\d+)?$/.test(multiplier)) {
      return { expression: multiplier, baseValue: parseFloat(multiplier) };
    }
    return { expression: multiplier };
  }

  private parseListString(str: string): string[] {
    if (!str || str.trim() === '全部') return ['all'];
    return str.split(/[，,\s]+/).map(s => s.trim()).filter(s => s.length > 0);
  }

  private parsePositionFilter(str: string): PositionFilter {
    if (!str || str.trim() === '全部') return { type: 'all' };
    const trimmed = str.trim();
    if (trimmed === '非鞋子' || trimmed.toLowerCase() === 'not boot') return { type: 'not_boot' };

    const positionNames = str.split(/[，,\s]+/).map(s => s.trim()).filter(s => s.length > 0);
    const mappedValues = positionNames.map(name => positionTypeMapping[name] || name.toUpperCase());
    return { type: 'is', values: mappedValues };
  }

  private parseMainStatFilter(str: string): MainStatFilter {
    if (!str || str.trim() === '全部') return { type: 'all' };
    const statNames = str.split(/[，,\s]+/).map(s => s.trim()).filter(s => s.length > 0);
    const mappedValues = statNames.map(name => this.normalizeStatName(name));
    return { type: 'in', values: mappedValues };
  }

  private parseSubStatFilter(subStatStr: string): SubStatFilter {
    if (!subStatStr || subStatStr.trim() === '' || subStatStr.trim() === '全部') {
      return { type: 'all', values: [] };
    }

    const trimmed = subStatStr.trim();

    if (trimmed.startsWith('have ')) {
      const statName = trimmed.substring(5).trim();
      return { type: 'have', values: [this.normalizeStatName(statName)] };
    }

    if (trimmed.startsWith('act on ')) {
      const content = trimmed.substring(7).trim();

      if (content.includes('；')) {
        const [listPart, specialPart] = content.split('；', 2);
        const listContent = listPart.trim();
        const specialRule = specialPart.trim();

        if (listContent.startsWith('[') && listContent.endsWith(']')) {
          const listStr = listContent.slice(1, -1);
          const stats = listStr.split('，').map(s => s.trim()).filter(s => s);
          const normalizedStats = stats.map(stat => this.normalizeStatName(stat));

          let specialCheckTypes: SpecialCheckType[] = [];
          if (specialRule === 'special check one') {
            specialCheckTypes = [SpecialCheckType.SPECIAL_CHECK_ONE];
          } else if (specialRule === 'special check three') {
            specialCheckTypes = [SpecialCheckType.SPECIAL_CHECK_THREE];
          } else if (specialRule.includes('需要包含至少一条命中或抵抗，且攻击%不可与命中抵抗同时存在')) {
            specialCheckTypes = [SpecialCheckType.SPECIAL_CHECK_ONE, SpecialCheckType.SPECIAL_CHECK_THREE];
          } else if (specialRule.includes('需要包含至少一条命中或抵抗')) {
            specialCheckTypes = [SpecialCheckType.SPECIAL_CHECK_ONE];
          }

          return { type: 'act_on_special', values: normalizedStats, specialCheckTypes };
        }
      } else {
        if (content.startsWith('[') && content.endsWith(']')) {
          const listStr = content.slice(1, -1);
          const stats = listStr.split('，').map(s => s.trim()).filter(s => s);
          const normalizedStats = stats.map(stat => this.normalizeStatName(stat));
          return { type: 'act_on', values: normalizedStats };
        }
      }
    }

    const normalizedStat = this.normalizeStatName(trimmed);
    return { type: 'have', values: [normalizedStat] };
  }

  private parseSetFilter(str: string): SetFilter {
    if (!str || str.trim() === '全部') return { type: 'all' };
    const setNames = str.split(/[，,\s]+/).map(s => s.trim()).filter(s => s.length > 0);
    const mappedValues = setNames.map(name => setTypeMapping[name] || name);
    return { type: 'in', values: mappedValues };
  }

  // 速度检测项的前置依赖：必须有这些检测项之一得分 > 0
  private static readonly SPEED_DEPENDENCY_CHECK_ITEMS = [
    '输出', '输出（必爆）', '抗坦(坦克)', '纯肉(坦克)',
    '命坦(双效)', '双效', '半肉(血防)', '半肉', '半肉(白字)'
  ];

  matchEquipmentWithRules(equipment: Equipment): RuleMatchResult[] {
    const results: RuleMatchResult[] = [];

    for (const rule of this.rules) {
      const scoringContext = this.createScoringContext(equipment, rule);
      const result = this.matchSingleRule(equipment, rule, scoringContext);
      if (result.matched) results.push(result);
    }

    // 速度检测项门控：只有当依赖检测项中至少一个得分 > 0 时才保留速度分数
    const hasEligibleDependency = results.some(
      r => r.score > 0 && RuleEngine.SPEED_DEPENDENCY_CHECK_ITEMS.includes(r.rule.checkItem)
    );

    for (const result of results) {
      if (result.rule.checkItem === '速度' && result.score > 0 && !hasEligibleDependency) {
        result.score = 0;
        result.totalScore = 0;
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private matchSingleRule(equipment: Equipment, rule: EquipmentRule, context: ScoringContext): RuleMatchResult {
    const details = {
      setMatch: this.checkSetMatch(equipment, rule),
      positionMatch: this.checkPositionMatch(equipment, rule),
      mainStatMatch: this.checkMainStatMatch(equipment, rule),
      validStatMatch: this.checkValidStatMatch(equipment, rule),
      scoreCalculated: context.calculatedScore
    };

    const matched = details.setMatch && details.positionMatch && details.mainStatMatch && details.validStatMatch;
    let score = 0;
    let appliedCondition: RuleConditionSet | undefined;

    if (matched) {
      const conditionResult = this.evaluateConditions(rule.conditionSets, context);
      score = conditionResult.score;
      appliedCondition = conditionResult.appliedCondition;
    }

    return { rule, matched, score, totalScore: score, appliedCondition, details };
  }

  private calculateActOnScore(equipment: Equipment, validStats: string[]): number {
    const normalizedValidStats = validStats.map(stat => this.normalizeStatName(stat) as StatType);

    // 鞋子部位 + 有效属性包含速度：速度倍率从 2 降为 1.4
    const isBoots = equipment.type === EquipmentType.BOOTS;
    const hasSpeedInValid = normalizedValidStats.includes(StatType.SPEED);

    const modifiedSubstats = equipment.substats.map(substat => {
      if (!normalizedValidStats.includes(substat.type)) return { ...substat, value: 0 };
      if (isBoots && hasSpeedInValid && substat.type === StatType.SPEED) {
        return { ...substat, value: substat.value * 0.7 };
      }
      return substat;
    });

    return calculateEquipmentScore({ ...equipment, substats: modifiedSubstats });
  }

  private createScoringContext(equipment: Equipment, rule?: EquipmentRule): ScoringContext {
    const calculatedScore = calculateEquipmentScore(equipment);
    const speedValue = this.getSpeedValue(equipment);

    let effectiveScore: number | undefined;
    if (rule && (rule.validStats.type === 'act_on' || rule.validStats.type === 'act_on_special')) {
      if (rule.validStats.values) {
        effectiveScore = this.calculateActOnScore(equipment, rule.validStats.values);
      }
    }

    return { equipment, calculatedScore, speedValue, effectiveScore };
  }

  private getSpeedValue(equipment: Equipment): number | undefined {
    return equipment.substats.find(stat => stat.type === StatType.SPEED)?.value;
  }

  private checkSetMatch(equipment: Equipment, rule: EquipmentRule): boolean {
    if (rule.sets.type === 'all') return true;
    if (rule.sets.type === 'in' && rule.sets.values) return rule.sets.values.includes(equipment.set);
    return false;
  }

  private checkPositionMatch(equipment: Equipment, rule: EquipmentRule): boolean {
    const positionFilter = rule.positions;
    switch (positionFilter.type) {
      case 'all': return true;
      case 'not_boot': return equipment.type !== EquipmentType.BOOTS;
      case 'is':
        if (!positionFilter.values?.length) return false;
        return positionFilter.values.some(allowedType => {
          if (allowedType.toLowerCase() === equipment.type.toLowerCase()) return true;
          const equipmentPositionName = EquipmentTypeDisplay[equipment.type] || equipment.type;
          return this.normalizePositionName(allowedType) === this.normalizePositionName(equipmentPositionName);
        });
      default: return false;
    }
  }

  private checkMainStatMatch(equipment: Equipment, rule: EquipmentRule): boolean {
    if (rule.mainStats.type === 'all') return true;
    if (rule.mainStats.type === 'in' && rule.mainStats.values) {
      return rule.mainStats.values.some(ruleMainStat =>
        this.normalizeStatName(ruleMainStat) === equipment.main.type
      );
    }
    return false;
  }

  private implementSpecialCheckOne(equipment: Equipment): boolean {
    if (equipment.main &&
        (equipment.main.type === StatType.EFFECTIVENESS_PERCENT ||
         equipment.main.type === StatType.EFFECT_RESISTANCE_PERCENT)) {
      return true;
    }
    if (equipment.set === SetType.HIT_SET || equipment.set === SetType.RESIST_SET) return true;
    return equipment.substats.some(stat =>
      stat.type === StatType.EFFECTIVENESS_PERCENT ||
      stat.type === StatType.EFFECT_RESISTANCE_PERCENT
    );
  }

  private implementSpecialCheckThree(equipment: Equipment): boolean {
    const allStats = equipment.main ?
      [equipment.main.type, ...equipment.substats.map(s => s.type)] :
      equipment.substats.map(s => s.type);

    const hasEffectivenessHit = allStats.includes(StatType.EFFECTIVENESS_PERCENT);
    const hasEffectivenessResist = allStats.includes(StatType.EFFECT_RESISTANCE_PERCENT);
    const hasAttackPercent = allStats.includes(StatType.ATTACK_PERCENT);

    switch (equipment.set) {
      case SetType.HIT_SET:
        return !(hasEffectivenessResist && hasAttackPercent);
      case SetType.RESIST_SET:
        return !(hasEffectivenessHit && hasAttackPercent);
      case SetType.SPEED_SET:
      case SetType.HEALTH_SET:
      case SetType.DEFENSE_SET:
      case SetType.COUNTER_SET:
      case SetType.IMMUNITY_SET:
        if (hasAttackPercent && hasEffectivenessHit && hasEffectivenessResist) return false;
        return true;
      default:
        return true;
    }
  }

  private checkValidStatMatch(equipment: Equipment, rule: EquipmentRule): boolean {
    const subStatFilter = rule.validStats;

    switch (subStatFilter.type) {
      case 'all': return true;
      case 'have': {
        const equipmentStatTypes = equipment.substats.map(stat => stat.type);
        return subStatFilter.values?.some(requiredStat =>
          equipmentStatTypes.includes(this.normalizeStatName(requiredStat) as StatType)
        ) ?? false;
      }
      case 'act_on': return true;
      case 'act_on_special': {
        if (subStatFilter.specialCheckTypes?.length) {
          for (const checkType of subStatFilter.specialCheckTypes) {
            let checkResult = true;
            switch (checkType) {
              case SpecialCheckType.SPECIAL_CHECK_ONE:
                checkResult = this.implementSpecialCheckOne(equipment);
                break;
              case SpecialCheckType.SPECIAL_CHECK_THREE:
                checkResult = this.implementSpecialCheckThree(equipment);
                break;
              default:
                checkResult = true;
            }
            if (!checkResult) return false;
          }
        }
        return true;
      }
      default: return false;
    }
  }

  private evaluateConditions(conditionSets: RuleConditionSet[], context: ScoringContext): { score: number; appliedCondition?: RuleConditionSet } {
    for (const conditionSet of conditionSets) {
      if (this.evaluateCondition(conditionSet.condition, context)) {
        const score = this.evaluateMultiplier(conditionSet.multiplier, context);
        return { score, appliedCondition: conditionSet };
      }
    }
    return { score: 0 };
  }

  private evaluateCondition(condition: ScoreCondition, context: ScoringContext): boolean {
    const { calculatedScore, speedValue, effectiveScore } = context;
    const scoreToUse = condition.useEffectiveScore ? (effectiveScore ?? calculatedScore) : calculatedScore;

    switch (condition.type) {
      case 'range':
        return scoreToUse >= (condition.min || 0) && scoreToUse < (condition.max || Infinity);
      case 'comparison': {
        const value = condition.value || 0;
        switch (condition.operator) {
          case '>=': return scoreToUse >= value;
          case '>': return scoreToUse > value;
          case '<=': return scoreToUse <= value;
          case '<': return scoreToUse < value;
          case '==': return scoreToUse === value;
          default: return false;
        }
      }
      case 'speed_range': {
        if (speedValue === undefined) return false;
        const speedMatch = speedValue >= (condition.speedMin || 0) &&
          (condition.speedMax === undefined || speedValue < condition.speedMax);

        if (condition.scoreMin !== undefined || condition.scoreMax !== undefined) {
          const scoreMin = condition.scoreMin || 0;
          const scoreMax = condition.scoreMax || Infinity;
          return speedMatch && (scoreToUse >= scoreMin && scoreToUse < scoreMax);
        }
        return speedMatch;
      }
      default: return false;
    }
  }

  private evaluateMultiplier(multiplier: RuleMultiplier, context: ScoringContext): number {
    if (multiplier.baseValue !== undefined) {
      // 常数倍率：直接返回baseValue作为规则分
      return multiplier.baseValue;
    }

    try {
      const evaluationContext: EvaluationContext = {
        score: context.calculatedScore,
        speed: context.speedValue,
        effectiveScore: context.effectiveScore
      };
      return evaluateExpression(multiplier.expression, evaluationContext);
    } catch (error) {
      if (this.debugMode) {
        console.warn('Failed to evaluate multiplier:', multiplier.expression, error);
      }
      return 0;
    }
  }

  private normalizeSetName(name: string): string {
    if (!name) return '';
    return setNameMap[name] || name.toLowerCase();
  }

  private normalizePositionName(name: string): string {
    if (!name) return '';
    return positionMap[name] || name.toLowerCase();
  }

  private normalizeStatName(name: string): string {
    if (!name) return '';
    return (statMap[name] as string) || name;
  }

  public getRules(): EquipmentRule[] {
    return [...this.rules];
  }

  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
}

// Standalone utility functions
export function parseCSVToRules(csvContent: string): EquipmentRule[] {
  const engine = new RuleEngine();
  return engine.parseCSVToRules(csvContent);
}

export function matchEquipmentWithRules(equipment: Equipment, rules: EquipmentRule[]): RuleMatchResult[] {
  const engine = new RuleEngine({ rules });
  return engine.matchEquipmentWithRules(equipment);
}

export function exportRulesToCSV(rules: EquipmentRule[]): string {
  const rows = [CSV_EXPORT_HEADER.join(',')];

  for (const rule of rules) {
    const mainStatStr = rule.mainStats.type === 'all' ? '全部' : rule.mainStats.values!.join('，');
    const setsStr = rule.sets.type === 'all' ? '全部' : rule.sets.values!.join('，');
    const positionsStr = rule.positions.type === 'all' ? '全部' :
      rule.positions.type === 'not_boot' ? '非鞋子' : rule.positions.values!.join('，');
    const row = [
      rule.checkItem, setsStr, rule.validStats.values?.join('，') || '全部',
      positionsStr, mainStatStr
    ];

    for (let i = 0; i < 4; i++) {
      const conditionSet = rule.conditionSets[i];
      if (conditionSet) {
        row.push(conditionToString(conditionSet.condition));
        row.push(conditionSet.multiplier.expression);
      } else {
        row.push('', '');
      }
    }

    rows.push(row.join(','));
  }

  return rows.join('\n');
}

function conditionToString(condition: ScoreCondition): string {
  const label = condition.useEffectiveScore ? '有效分数' : '分数';
  switch (condition.type) {
    case 'range':
      return `${label}[${condition.min}-${condition.max}]`;
    case 'comparison':
      return `${label}${condition.operator}${condition.value}`;
    case 'speed_range':
      if (condition.scoreMin !== undefined && condition.scoreMax !== undefined) {
        return `速度>=${condition.speedMin}，${label}[${condition.scoreMin}-${condition.scoreMax}]`;
      }
      return `速度${condition.speedMin}-${condition.speedMax}`;
    default:
      return '';
  }
}
