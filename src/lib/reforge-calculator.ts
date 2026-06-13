/**
 * 重铸计算工具模块
 * 用于计算85级和90级装备的重铸后属性值
 */

export function calculateReforgeValuesTypeValueAndRolls(
  gaveleets: boolean,
  type: string,
  value: number,
  rolls: number,
  level: number
): number {
  if (level !== 85 && level !== 90) {
    return value;
  }

  if (gaveleets) {
    return value;
  }

  const plainStats = [
    "AttackPercent",
    "DefensePercent",
    "HealthPercent",
    "EffectivenessPercent",
    "EffectResistancePercent",
  ];

  const plainStatRollsToValue: Record<number, number> = {
    1: 1, 2: 3, 3: 4, 4: 5, 5: 7, 6: 8,
  };

  const critDamageRollsToValue: Record<number, number> = {
    1: 1, 2: 2, 3: 3, 4: 4, 5: 6, 6: 7,
  };

  const speedRollsToValue: Record<number, number> = {
    1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 4,
  };

  if (plainStats.includes(type)) {
    return value + (plainStatRollsToValue[rolls] ?? 0);
  }
  if (type === "CriticalHitChancePercent") {
    return value + rolls;
  }
  if (type === "CriticalHitDamagePercent") {
    return value + (critDamageRollsToValue[rolls] ?? 0);
  }
  if (type === "Attack") {
    return value + 11 * rolls;
  }
  if (type === "Defense") {
    return value + 9 * rolls;
  }
  if (type === "Health") {
    return value + 56 * rolls;
  }
  if (type === "Speed") {
    return value + (speedRollsToValue[rolls] ?? 0);
  }
  return value;
}
