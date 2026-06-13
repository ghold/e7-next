import {
  Equipment, EquipmentType, SetType, RankType, StatType,
  RawStatType, RawStatToStatType, MainStat, SubStat, RuleMatchResult
} from '@/constants';
import { matchEquipmentWithRules } from './rule-engine';
import { calculateReforgeValuesTypeValueAndRolls } from './reforge-calculator';
import { calculatePotentialScore } from './conversion-utils';

function parseEquipmentType(type: string): EquipmentType {
  const typeMap: Record<string, EquipmentType> = {
    'weapon': EquipmentType.WEAPON,
    'helm': EquipmentType.HELMET,
    'armor': EquipmentType.ARMOR,
    'boot': EquipmentType.BOOTS,
    'neck': EquipmentType.NECKLACE,
    'ring': EquipmentType.RING
  };
  return typeMap[type] || EquipmentType.WEAPON;
}

function parseSetType(set: string): SetType {
  const validSets = Object.values(SetType);
  if (validSets.includes(set as SetType)) {
    return set as SetType;
  }
  return SetType.SPEED_SET;
}

function parseStatType(rawType: string): StatType {
  const statType = RawStatToStatType[rawType as RawStatType];
  return statType || StatType.ATTACK;
}

function parseRankType(rank: string): RankType {
  return rank as RankType || RankType.EPIC;
}

function parseMainStat(main: { type: string; value: number }): MainStat {
  return {
    type: parseStatType(main.type),
    value: main.value
  };
}

function parseSubStats(substats: any[]): SubStat[] {
  return substats.map(substat => ({
    type: parseStatType(substat.type),
    value: substat.value,
    rolls: substat.rolls,
    modified: substat.modified,
    originalValue: substat.originalValue,
    reforged: substat.reforged
  }));
}

function parseEquipment(rawEquipment: any | Equipment): Equipment {
  // Already parsed
  if ('bestRule' in rawEquipment || 'bestScore' in rawEquipment || 'allRuleResults' in rawEquipment) {
    return rawEquipment as Equipment;
  }

  if (rawEquipment.substats?.length > 0 &&
      rawEquipment.substats.some((sub: any) => 'reforged' in sub || 'originalValue' in sub)) {
    return rawEquipment as Equipment;
  }

  const equipment: Equipment = {
    code: rawEquipment.code,
    ct: rawEquipment.ct,
    e: rawEquipment.e,
    f: rawEquipment.f,
    g: rawEquipment.g,
    id: rawEquipment.id,
    l: rawEquipment.l,
    level: rawEquipment.level,
    mainStatBaseValue: rawEquipment.mainStatBaseValue,
    mainStatId: rawEquipment.mainStatId,
    mainStatType: rawEquipment.mainStatType,
    mainStatValue: rawEquipment.mainStatValue,
    mg: rawEquipment.mg,
    op: rawEquipment.op,
    p: rawEquipment.p,
    s: rawEquipment.s,
    statMultiplier: rawEquipment.statMultiplier,
    tierMultiplier: rawEquipment.tierMultiplier,
    type: parseEquipmentType(rawEquipment.type),
    gear: rawEquipment.gear,
    rank: parseRankType(rawEquipment.rank),
    set: parseSetType(rawEquipment.set),
    name: rawEquipment.name,
    enhance: rawEquipment.enhance,
    main: parseMainStat(rawEquipment.main),
    substats: parseSubStats(rawEquipment.substats),
    ingameId: rawEquipment.ingameId,
    ingameEquippedId: rawEquipment.ingameEquippedId
  };

  // Apply reforge for level 85 equipment
  if (equipment.level === 85) {
    equipment.substats = equipment.substats.map(substat => {
      if (substat.reforged) return substat;

      const originalValue = substat.originalValue || substat.value;
      const reforgedValue = calculateReforgeValuesTypeValueAndRolls(
        false, substat.type, originalValue, substat.rolls, equipment.level
      );

      return {
        ...substat,
        originalValue,
        value: reforgedValue,
        reforged: true
      };
    });
  }

  return equipment;
}

export function parseEquipmentData(fileContent: string, rules?: any[]): Equipment[] {
  try {
    const rawData = JSON.parse(fileContent);

    let equipmentList: Equipment[];

    if (Array.isArray(rawData)) {
      equipmentList = rawData.map(parseEquipment);
    } else if (rawData.items && Array.isArray(rawData.items)) {
      equipmentList = rawData.items.map(parseEquipment);
    } else {
      throw new Error('无效的数据格式：期望数组或包含items字段的对象');
    }

    if (rules && rules.length > 0) {
      equipmentList = equipmentList.map(equipment => {
        try {
          const ruleResults = matchEquipmentWithRules(equipment, rules);

          let bestRule = '';
          let bestScore = 0;
          const allRuleResults: RuleMatchResult[] = [];

          ruleResults.forEach(result => {
            if (result.score > 0) {
              allRuleResults.push({
                ruleName: result.rule.checkItem,
                score: result.score
              });
              if (result.score > bestScore) {
                bestScore = result.score;
                bestRule = result.rule.checkItem;
              }
            }
          });

          const potentialScore = calculatePotentialScore(equipment, rules);

          return {
            ...equipment,
            bestRule: bestRule || undefined,
            bestScore: bestScore > 0 ? bestScore : undefined,
            allRuleResults: allRuleResults.length > 0 ? allRuleResults : undefined,
            potentialScore: potentialScore !== 0 ? potentialScore : undefined
          };
        } catch (error) {
          console.warn(`装备 ${equipment.name} 规则匹配失败:`, error);
          return equipment;
        }
      });
    }

    return equipmentList;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('JSON格式错误：请检查文件内容是否为有效的JSON格式');
    }
    throw error;
  }
}

export function validateEquipmentData(equipment: Equipment[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(equipment)) {
    errors.push('装备数据必须是数组格式');
    return { isValid: false, errors, warnings };
  }

  if (equipment.length === 0) {
    warnings.push('装备数据为空');
  }

  equipment.forEach((item, index) => {
    if (!item.id) errors.push(`装备 ${index + 1}: 缺少ID字段`);
    if (!item.name) warnings.push(`装备 ${index + 1}: 缺少名称字段`);
    if (!item.type) errors.push(`装备 ${index + 1}: 缺少类型字段`);
    if (!item.set) errors.push(`装备 ${index + 1}: 缺少套装字段`);
  });

  return { isValid: errors.length === 0, errors, warnings };
}

export function getEquipmentStats(equipment: Equipment[]) {
  const stats = {
    total: equipment.length,
    byType: {} as Record<EquipmentType, number>,
    bySet: {} as Record<SetType, number>,
    byRank: {} as Record<RankType, number>,
    enhancementLevels: { min: 0, max: 0, average: 0 }
  };

  Object.values(EquipmentType).forEach(type => { stats.byType[type] = 0; });
  Object.values(SetType).forEach(set => { stats.bySet[set] = 0; });
  Object.values(RankType).forEach(rank => { stats.byRank[rank] = 0; });

  if (equipment.length === 0) return stats;

  let totalEnhancement = 0;
  let minEnhancement = equipment[0].enhance;
  let maxEnhancement = equipment[0].enhance;

  equipment.forEach(item => {
    stats.byType[item.type]++;
    stats.bySet[item.set]++;
    stats.byRank[item.rank]++;
    totalEnhancement += item.enhance;
    minEnhancement = Math.min(minEnhancement, item.enhance);
    maxEnhancement = Math.max(maxEnhancement, item.enhance);
  });

  stats.enhancementLevels = {
    min: minEnhancement,
    max: maxEnhancement,
    average: Math.round(totalEnhancement / equipment.length * 100) / 100
  };

  return stats;
}
