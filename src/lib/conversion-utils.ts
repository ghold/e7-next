import {
  getModificationLimitsByLevel, SubstatModificationLimits,
  getAllowedSubstatsForEquipment, Equipment, StatType
} from '@/constants';
import { EquipmentRule } from '@/types/rule-engine';
import { matchEquipmentWithRules } from './rule-engine';

/**
 * Get the conversion limit for a substat based on level and rolls
 */
export function getConversionLimit(level: number, statType: string, rolls: number): number | null {
  // 85级装备先重铸再用90级配置
  const targetLevel = level === 85 ? 90 : level;
  const limits = getModificationLimitsByLevel(targetLevel);
  if (!limits) return null;

  const statLimits = (limits as unknown as Record<string, number[]>)[statType];
  if (!statLimits) return null;

  // 根据rolls获取对应档位的转换上限（索引为rolls - 1）
  const index = Math.max(0, Math.min(rolls - 1, statLimits.length - 1));
  return statLimits[index];
}

/**
 * 计算装备的潜能分（所有副属性转换后规则分数的最大值）
 */
export function calculatePotentialScore(equipment: Equipment, rules: EquipmentRule[]): number {
  if (!rules.length) return 0;

  const allRuleScores: number[] = [];
  const existingTypes = equipment.substats.map(s => s.type);
  const mainStatType = equipment.main.type;
  const allowedTypes = getAllowedSubstatsForEquipment(equipment.type);

  // 检查是否存在已转换的副属性
  const hasModifiedSubstats = equipment.substats?.some(substat => substat.modified);

  equipment.substats.forEach((substat, index) => {
    // 如果存在已转换的副属性，只处理已转换的副属性
    if (hasModifiedSubstats && !substat.modified) return;

    if (substat.rolls > 3) return;

    const targetTypes = allowedTypes.filter(t => {
      if (t === mainStatType) return false;
      if (t === substat.type) return true;
      return !existingTypes.includes(t as StatType);
    });

    targetTypes.forEach(targetType => {
      const conversionLimit = getConversionLimit(equipment.level, targetType, substat.rolls);
      if (!conversionLimit) return;

      const cloned: Equipment = JSON.parse(JSON.stringify(equipment));
      cloned.substats[index] = {
        type: targetType as StatType,
        value: conversionLimit,
        rolls: substat.rolls
      };

      const ruleResults = matchEquipmentWithRules(cloned, rules);
      ruleResults.forEach(r => {
        if (r.score !== 0) allRuleScores.push(r.score);
      });
    });
  });

  return allRuleScores.length > 0 ? Math.max(...allRuleScores) : 0;
}
