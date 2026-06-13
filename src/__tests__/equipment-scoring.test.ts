import { describe, it, expect } from 'vitest';
import { calculateEquipmentScore, getEquipmentSpeed, getSubstatValue } from '@/lib/equipment-scoring';
import { Equipment, StatType, EquipmentType, SetType, RankType } from '@/constants';

function makeEquipment(overrides: Partial<Equipment> = {}): Equipment {
  return {
    code: 'test', ct: 0, e: 0, f: '', g: 0, id: 1, level: 90,
    mainStatBaseValue: 0, mainStatId: '', mainStatType: '', mainStatValue: 0,
    mg: 0, op: [], s: '', statMultiplier: 1, tierMultiplier: 1,
    type: EquipmentType.ARMOR, gear: '', rank: RankType.EPIC, set: SetType.SPEED_SET,
    name: '测试装备', enhance: 15,
    main: { type: StatType.DEFENSE_PERCENT, value: 65 },
    substats: [],
    ingameId: 1, ingameEquippedId: '',
    ...overrides,
  };
}

describe('calculateEquipmentScore', () => {
  // 基于旧项目的测试数据：速度18 + 暴击率17 + 暴伤8 + 生命%7
  it('应该正确计算混合副属性的分数', () => {
    const eq = makeEquipment({
      substats: [
        { type: StatType.SPEED, value: 18, rolls: 4 },
        { type: StatType.CRITICAL_HIT_CHANCE_PERCENT, value: 17, rolls: 3 },
        { type: StatType.CRITICAL_HIT_DAMAGE_PERCENT, value: 8, rolls: 1 },
        { type: StatType.HEALTH_PERCENT, value: 7, rolls: 1 },
      ],
    });
    // 18*2 + 17*(9/6) + 8*(9/8) + 7 = 36 + 25.5 + 9 + 7 = 77.5
    expect(calculateEquipmentScore(eq)).toBe(77.5);
  });

  it('纯速度副属性', () => {
    const eq = makeEquipment({
      substats: [{ type: StatType.SPEED, value: 20, rolls: 4 }],
    });
    expect(calculateEquipmentScore(eq)).toBe(40);
  });

  it('攻击力百分比 1:1 计分', () => {
    const eq = makeEquipment({
      substats: [{ type: StatType.ATTACK_PERCENT, value: 30, rolls: 4 }],
    });
    expect(calculateEquipmentScore(eq)).toBe(30);
  });

  it('防御力百分比 1:1 计分', () => {
    const eq = makeEquipment({
      substats: [{ type: StatType.DEFENSE_PERCENT, value: 25, rolls: 3 }],
    });
    expect(calculateEquipmentScore(eq)).toBe(25);
  });

  it('生命值百分比 1:1 计分', () => {
    const eq = makeEquipment({
      substats: [{ type: StatType.HEALTH_PERCENT, value: 20, rolls: 3 }],
    });
    expect(calculateEquipmentScore(eq)).toBe(20);
  });

  it('效果命中 1:1 计分', () => {
    const eq = makeEquipment({
      substats: [{ type: StatType.EFFECTIVENESS_PERCENT, value: 15, rolls: 2 }],
    });
    expect(calculateEquipmentScore(eq)).toBe(15);
  });

  it('效果抗性 1:1 计分', () => {
    const eq = makeEquipment({
      substats: [{ type: StatType.EFFECT_RESISTANCE_PERCENT, value: 12, rolls: 2 }],
    });
    expect(calculateEquipmentScore(eq)).toBe(12);
  });

  it('暴击率 按 9/6 计分', () => {
    const eq = makeEquipment({
      substats: [{ type: StatType.CRITICAL_HIT_CHANCE_PERCENT, value: 12, rolls: 2 }],
    });
    // 12 * (9/6) = 18
    expect(calculateEquipmentScore(eq)).toBe(18);
  });

  it('暴击伤害 按 9/8 计分', () => {
    const eq = makeEquipment({
      substats: [{ type: StatType.CRITICAL_HIT_DAMAGE_PERCENT, value: 16, rolls: 2 }],
    });
    // 16 * (9/8) = 18
    expect(calculateEquipmentScore(eq)).toBe(18);
  });

  it('攻击力 按 3.46/39 计分', () => {
    const eq = makeEquipment({
      substats: [{ type: StatType.ATTACK, value: 100, rolls: 2 }],
    });
    // 100 * (3.46/39) ≈ 8.87
    expect(calculateEquipmentScore(eq)).toBeCloseTo(8.87, 2);
  });

  it('防御力 按 4.99/31 计分', () => {
    const eq = makeEquipment({
      substats: [{ type: StatType.DEFENSE, value: 100, rolls: 2 }],
    });
    // 100 * (4.99/31) ≈ 16.1
    expect(calculateEquipmentScore(eq)).toBeCloseTo(16.1, 1);
  });

  it('生命值 按 3.09/174 计分', () => {
    const eq = makeEquipment({
      substats: [{ type: StatType.HEALTH, value: 500, rolls: 2 }],
    });
    // 500 * (3.09/174) ≈ 8.88
    expect(calculateEquipmentScore(eq)).toBeCloseTo(8.88, 2);
  });

  it('空副属性返回 0', () => {
    const eq = makeEquipment({ substats: [] });
    expect(calculateEquipmentScore(eq)).toBe(0);
  });

  it('四条满强化副属性（理想装备）', () => {
    const eq = makeEquipment({
      substats: [
        { type: StatType.SPEED, value: 24, rolls: 5 },
        { type: StatType.ATTACK_PERCENT, value: 30, rolls: 5 },
        { type: StatType.CRITICAL_HIT_CHANCE_PERCENT, value: 18, rolls: 5 },
        { type: StatType.CRITICAL_HIT_DAMAGE_PERCENT, value: 24, rolls: 5 },
      ],
    });
    // 24*2 + 30 + 18*(9/6) + 24*(9/8) = 48 + 30 + 27 + 27 = 132
    expect(calculateEquipmentScore(eq)).toBe(132);
  });
});

describe('getEquipmentSpeed', () => {
  it('返回速度副属性值', () => {
    const eq = makeEquipment({
      substats: [
        { type: StatType.SPEED, value: 18, rolls: 4 },
        { type: StatType.ATTACK_PERCENT, value: 10, rolls: 1 },
      ],
    });
    expect(getEquipmentSpeed(eq)).toBe(18);
  });

  it('没有速度副属性返回 undefined', () => {
    const eq = makeEquipment({
      substats: [{ type: StatType.ATTACK_PERCENT, value: 10, rolls: 1 }],
    });
    expect(getEquipmentSpeed(eq)).toBeUndefined();
  });
});

describe('getSubstatValue', () => {
  it('返回指定副属性值', () => {
    const eq = makeEquipment({
      substats: [
        { type: StatType.SPEED, value: 18, rolls: 4 },
        { type: StatType.CRITICAL_HIT_CHANCE_PERCENT, value: 12, rolls: 2 },
      ],
    });
    expect(getSubstatValue(eq, StatType.SPEED)).toBe(18);
    expect(getSubstatValue(eq, StatType.CRITICAL_HIT_CHANCE_PERCENT)).toBe(12);
  });

  it('不存在的副属性返回 0', () => {
    const eq = makeEquipment({
      substats: [{ type: StatType.SPEED, value: 18, rolls: 4 }],
    });
    expect(getSubstatValue(eq, StatType.ATTACK_PERCENT)).toBe(0);
  });
});
