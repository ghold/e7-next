import { describe, it, expect } from 'vitest';
import { getConversionLimit } from '@/lib/conversion-utils';
import { StatType } from '@/constants';

describe('getConversionLimit', () => {
  // 88级装备
  describe('88级装备', () => {
    it('Speed 1次强化', () => {
      expect(getConversionLimit(88, 'Speed', 1)).toBe(4);
    });

    it('Speed 3次强化', () => {
      expect(getConversionLimit(88, 'Speed', 3)).toBe(6);
    });

    it('AttackPercent 1次强化', () => {
      expect(getConversionLimit(88, 'AttackPercent', 1)).toBe(8);
    });

    it('AttackPercent 3次强化', () => {
      expect(getConversionLimit(88, 'AttackPercent', 3)).toBe(14);
    });

    it('CriticalHitChancePercent 1次强化', () => {
      expect(getConversionLimit(88, 'CriticalHitChancePercent', 1)).toBe(4);
    });

    it('Health 1次强化', () => {
      expect(getConversionLimit(88, 'Health', 1)).toBe(203);
    });
  });

  // 90级装备
  describe('90级装备', () => {
    it('Speed 1次强化', () => {
      expect(getConversionLimit(90, 'Speed', 1)).toBe(4);
    });

    it('Speed 3次强化', () => {
      expect(getConversionLimit(90, 'Speed', 3)).toBe(8);
    });

    it('AttackPercent 1次强化', () => {
      expect(getConversionLimit(90, 'AttackPercent', 1)).toBe(9);
    });

    it('AttackPercent 3次强化', () => {
      expect(getConversionLimit(90, 'AttackPercent', 3)).toBe(18);
    });

    it('CriticalHitDamagePercent 1次强化', () => {
      expect(getConversionLimit(90, 'CriticalHitDamagePercent', 1)).toBe(8);
    });

    it('Health 1次强化', () => {
      expect(getConversionLimit(90, 'Health', 1)).toBe(259);
    });
  });

  // 85级装备重铸后使用90级配置
  it('85级装备使用90级配置', () => {
    expect(getConversionLimit(85, 'Speed', 1)).toBe(4); // 90级Speed的1次强化限制
  });

  it('未知属性返回 null', () => {
    expect(getConversionLimit(88, 'UnknownStat', 1)).toBeNull();
  });

  // rolls 超出范围时应该返回最大值
  it('rolls 超出范围返回最后一个值', () => {
    expect(getConversionLimit(88, 'Speed', 10)).toBe(10); // 6次强化的最大值
  });

  // rolls=0 时返回第一个值
  it('rolls=0 返回第一个值', () => {
    expect(getConversionLimit(88, 'Speed', 0)).toBe(4);
  });
});
