import { describe, it, expect } from 'vitest';
import { calculateReforgeValuesTypeValueAndRolls } from '@/lib/reforge-calculator';

describe('calculateReforgeValuesTypeValueAndRolls', () => {
  // 非85/90等级不做重铸
  it('等级88不重铸', () => {
    expect(calculateReforgeValuesTypeValueAndRolls(false, 'Speed', 10, 2, 88)).toBe(10);
  });

  it('等级88不重铸', () => {
    expect(calculateReforgeValuesTypeValueAndRolls(false, 'Speed', 10, 2, 88)).toBe(10);
  });

  // gaveleets=true 不重铸
  it('gaveleets=true 时不重铸', () => {
    expect(calculateReforgeValuesTypeValueAndRolls(true, 'Speed', 10, 2, 85)).toBe(10);
  });

  // 速度重铸
  describe('Speed 重铸', () => {
    const speedCases = [
      { rolls: 1, expected: 0 },  // speedRollsToValue[1] = 0
      { rolls: 2, expected: 1 },  // speedRollsToValue[2] = 1
      { rolls: 3, expected: 2 },  // speedRollsToValue[3] = 2
      { rolls: 4, expected: 3 },  // speedRollsToValue[4] = 3
      { rolls: 5, expected: 4 },  // speedRollsToValue[5] = 4
      { rolls: 6, expected: 4 },  // speedRollsToValue[6] = 4
    ];

    speedCases.forEach(({ rolls, expected }) => {
      it(`85级速度 ${rolls}次强化 → +${expected}`, () => {
        const base = 4;
        expect(calculateReforgeValuesTypeValueAndRolls(false, 'Speed', base, rolls, 85)).toBe(base + expected);
      });
    });

    it('85级速度 4次强化 基础值4 → 7', () => {
      expect(calculateReforgeValuesTypeValueAndRolls(false, 'Speed', 4, 4, 85)).toBe(7);
    });

    it('85级速度 2次强化 基础值3 → 4', () => {
      expect(calculateReforgeValuesTypeValueAndRolls(false, 'Speed', 3, 2, 85)).toBe(4);
    });
  });

  // 暴击率重铸
  describe('CriticalHitChancePercent 重铸', () => {
    it('85级暴击率 3次强化 基础值5 → 8', () => {
      expect(calculateReforgeValuesTypeValueAndRolls(false, 'CriticalHitChancePercent', 5, 3, 85)).toBe(8);
    });

    it('85级暴击率 1次强化 基础值3 → 4', () => {
      expect(calculateReforgeValuesTypeValueAndRolls(false, 'CriticalHitChancePercent', 3, 1, 85)).toBe(4);
    });

    it('85级暴击率 5次强化 基础值11 → 16', () => {
      expect(calculateReforgeValuesTypeValueAndRolls(false, 'CriticalHitChancePercent', 11, 5, 85)).toBe(16);
    });
  });

  // 暴击伤害重铸
  describe('CriticalHitDamagePercent 重铸', () => {
    const critDmgCases = [
      { rolls: 1, expected: 1 },
      { rolls: 2, expected: 2 },
      { rolls: 3, expected: 3 },
      { rolls: 4, expected: 4 },
      { rolls: 5, expected: 6 },
      { rolls: 6, expected: 7 },
    ];

    critDmgCases.forEach(({ rolls, expected }) => {
      it(`85级暴伤 ${rolls}次强化 → +${expected}`, () => {
        const base = 7;
        expect(calculateReforgeValuesTypeValueAndRolls(false, 'CriticalHitDamagePercent', base, rolls, 85)).toBe(base + expected);
      });
    });
  });

  // 百分比重铸 (AttackPercent, DefensePercent, HealthPercent, EffectivenessPercent, EffectResistancePercent)
  describe('百分比重铸', () => {
    const plainStatCases = [
      { rolls: 1, expected: 1 },
      { rolls: 2, expected: 3 },
      { rolls: 3, expected: 4 },
      { rolls: 4, expected: 5 },
      { rolls: 5, expected: 7 },
      { rolls: 6, expected: 8 },
    ];

    const percentTypes = [
      'AttackPercent',
      'DefensePercent',
      'HealthPercent',
      'EffectivenessPercent',
      'EffectResistancePercent',
    ];

    percentTypes.forEach(type => {
      plainStatCases.forEach(({ rolls, expected }) => {
        it(`85级${type} ${rolls}次强化 → +${expected}`, () => {
          const base = 8;
          expect(calculateReforgeValuesTypeValueAndRolls(false, type, base, rolls, 85)).toBe(base + expected);
        });
      });
    });

    it('85级攻击% 3次强化 基础值7 → 11', () => {
      expect(calculateReforgeValuesTypeValueAndRolls(false, 'AttackPercent', 7, 3, 85)).toBe(11);
    });

    it('85级生命% 2次强化 基础值8 → 11', () => {
      expect(calculateReforgeValuesTypeValueAndRolls(false, 'HealthPercent', 8, 2, 85)).toBe(11);
    });
  });

  // 攻击力重铸
  describe('Attack 重铸', () => {
    it('85级攻击力 1次强化 基础值39 → 50', () => {
      expect(calculateReforgeValuesTypeValueAndRolls(false, 'Attack', 39, 1, 85)).toBe(50);
    });

    it('85级攻击力 3次强化 基础值80 → 113', () => {
      expect(calculateReforgeValuesTypeValueAndRolls(false, 'Attack', 80, 3, 85)).toBe(113);
    });
  });

  // 防御力重铸
  describe('Defense 重铸', () => {
    it('85级防御力 1次强化 基础值27 → 36', () => {
      expect(calculateReforgeValuesTypeValueAndRolls(false, 'Defense', 27, 1, 85)).toBe(36);
    });

    it('85级防御力 3次强化 基础值50 → 77', () => {
      expect(calculateReforgeValuesTypeValueAndRolls(false, 'Defense', 50, 3, 85)).toBe(77);
    });
  });

  // 生命值重铸
  describe('Health 重铸', () => {
    it('85级生命值 1次强化 基础值174 → 230', () => {
      expect(calculateReforgeValuesTypeValueAndRolls(false, 'Health', 174, 1, 85)).toBe(230);
    });

    it('85级生命值 3次强化 基础值300 → 468', () => {
      expect(calculateReforgeValuesTypeValueAndRolls(false, 'Health', 300, 3, 85)).toBe(468);
    });
  });

  // 85级重铸
  it('85级装备应该重铸', () => {
    const result = calculateReforgeValuesTypeValueAndRolls(false, 'AttackPercent', 8, 2, 85);
    expect(result).toBe(11); // 8 + 3
  });

  // 未知类型不重铸
  it('未知属性类型不重铸', () => {
    expect(calculateReforgeValuesTypeValueAndRolls(false, 'UnknownStat', 100, 3, 85)).toBe(100);
  });
});
