import { Equipment, StatType } from '@/constants';

/**
 * 计算装备总分数
 * 分数 = 攻击力*(3.46/39) + 防御力*(4.99/31) + 生命值*(3.09/174) + 攻击% + 防御% + 生命% + 抗性 + 命中 + 爆伤*(9/8) + 暴率*(9/6) + 速度*2
 */
export function calculateEquipmentScore(equipment: Equipment): number {
  let score = 0;

  for (const substat of equipment.substats) {
    switch (substat.type) {
      case StatType.ATTACK:
        score += substat.value * (3.46 / 39);
        break;
      case StatType.DEFENSE:
        score += substat.value * (4.99 / 31);
        break;
      case StatType.HEALTH:
        score += substat.value * (3.09 / 174);
        break;
      case StatType.ATTACK_PERCENT:
      case StatType.DEFENSE_PERCENT:
      case StatType.HEALTH_PERCENT:
      case StatType.EFFECT_RESISTANCE_PERCENT:
      case StatType.EFFECTIVENESS_PERCENT:
        score += substat.value;
        break;
      case StatType.CRITICAL_HIT_DAMAGE_PERCENT:
        score += substat.value * (9 / 8);
        break;
      case StatType.CRITICAL_HIT_CHANCE_PERCENT:
        score += substat.value * (9 / 6);
        break;
      case StatType.SPEED:
        score += substat.value * 2;
        break;
    }
  }

  return Math.round(score * 100) / 100;
}

export function getEquipmentSpeed(equipment: Equipment): number | undefined {
  const speedStat = equipment.substats.find(stat => stat.type === StatType.SPEED);
  return speedStat?.value;
}

export function getSubstatValue(equipment: Equipment, statType: StatType): number {
  const substat = equipment.substats?.find(s => s.type === statType);
  return substat?.value || 0;
}
