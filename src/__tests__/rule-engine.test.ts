import { describe, it, expect } from 'vitest';
import { parseCSVToRules, matchEquipmentWithRules } from '@/lib/rule-engine';
import { calculateEquipmentScore } from '@/lib/equipment-scoring';
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

// 简化的 CSV 规则用于测试
const TEST_CSV = `检测项,套装,副属性有效属性,部位,主属性,分数条件,倍率
测试规则A,全部,全部,全部,全部,分数[60-100],1
测试规则B,速度,全部,全部,全部,分数>=70,1.1
测试规则C,全部,全部,鞋子,全部,分数[50-80],1
测试规则D,全部,act on [攻击%，暴率，爆伤，速度],全部,全部,分数[60-100],1.2`;

describe('parseCSVToRules', () => {
  it('应该解析 CSV 并返回规则数组', () => {
    const rules = parseCSVToRules(TEST_CSV);
    expect(rules.length).toBe(4);
  });

  it('第一条规则应该是"测试规则A"', () => {
    const rules = parseCSVToRules(TEST_CSV);
    expect(rules[0].checkItem).toBe('测试规则A');
  });

  it('套装过滤器 "全部" 应该是 type: all', () => {
    const rules = parseCSVToRules(TEST_CSV);
    expect(rules[0].sets.type).toBe('all');
  });

  it('套装过滤器 "速度" 应该解析为 SpeedSet', () => {
    const rules = parseCSVToRules(TEST_CSV);
    expect(rules[1].sets.type).toBe('in');
    expect(rules[1].sets.values).toContain('SpeedSet');
  });

  it('部位过滤器 "鞋子" 应该解析为 boot', () => {
    const rules = parseCSVToRules(TEST_CSV);
    expect(rules[2].positions.type).toBe('is');
    expect(rules[2].positions.values).toContain('BOOTS');
  });

  it('act_on 类型应该解析有效属性列表', () => {
    const rules = parseCSVToRules(TEST_CSV);
    expect(rules[3].validStats.type).toBe('act_on');
    expect(rules[3].validStats.values).toBeDefined();
    expect(rules[3].validStats.values!.length).toBeGreaterThan(0);
  });

  it('条件 "分数[60-100]" 应该解析为 range 类型', () => {
    const rules = parseCSVToRules(TEST_CSV);
    expect(rules[0].conditionSets[0].condition.type).toBe('range');
    expect(rules[0].conditionSets[0].condition.min).toBe(60);
    expect(rules[0].conditionSets[0].condition.max).toBe(100);
  });

  it('条件 "分数>=70" 应该解析为 comparison 类型', () => {
    const rules = parseCSVToRules(TEST_CSV);
    expect(rules[1].conditionSets[0].condition.type).toBe('comparison');
    expect(rules[1].conditionSets[0].condition.operator).toBe('>=');
    expect(rules[1].conditionSets[0].condition.value).toBe(70);
  });

  it('倍率 "1" 应该解析为 baseValue', () => {
    const rules = parseCSVToRules(TEST_CSV);
    expect(rules[0].conditionSets[0].multiplier.baseValue).toBe(1);
  });

  it('倍率 "1.1" 应该解析为 baseValue', () => {
    const rules = parseCSVToRules(TEST_CSV);
    expect(rules[1].conditionSets[0].multiplier.baseValue).toBe(1.1);
  });
});

describe('matchEquipmentWithRules', () => {
  const rules = parseCSVToRules(TEST_CSV);

  it('空副属性装备不应该匹配需要分数的规则', () => {
    const eq = makeEquipment({ substats: [] });
    const results = matchEquipmentWithRules(eq, rules);
    expect(results.filter(r => r.score > 0).length).toBe(0);
  });

  it('高分装备（101分）不满足规则A的分数条件[60-100)', () => {
    const eq = makeEquipment({
      substats: [
        { type: StatType.SPEED, value: 20, rolls: 4 },
        { type: StatType.ATTACK_PERCENT, value: 25, rolls: 4 },
        { type: StatType.CRITICAL_HIT_CHANCE_PERCENT, value: 12, rolls: 2 },
        { type: StatType.CRITICAL_HIT_DAMAGE_PERCENT, value: 16, rolls: 2 },
      ],
    });
    const score = calculateEquipmentScore(eq);
    expect(score).toBe(101);

    const results = matchEquipmentWithRules(eq, rules);
    const ruleA = results.find(r => r.rule.checkItem === '测试规则A');
    // 规则匹配了过滤器，但条件不满足，score=0
    expect(ruleA).toBeDefined();
    expect(ruleA!.score).toBe(0);
  });

  it('中等分数装备（77.5分）应该满足规则A的分数条件[60-100)', () => {
    const eq = makeEquipment({
      substats: [
        { type: StatType.SPEED, value: 18, rolls: 4 },
        { type: StatType.CRITICAL_HIT_CHANCE_PERCENT, value: 17, rolls: 3 },
        { type: StatType.CRITICAL_HIT_DAMAGE_PERCENT, value: 8, rolls: 1 },
        { type: StatType.HEALTH_PERCENT, value: 7, rolls: 1 },
      ],
    });
    const score = calculateEquipmentScore(eq);
    expect(score).toBe(77.5);

    const results = matchEquipmentWithRules(eq, rules);
    const ruleA = results.find(r => r.rule.checkItem === '测试规则A');
    expect(ruleA).toBeDefined();
    expect(ruleA!.score).toBe(77.5); // 倍率为1
  });

  it('速度套装装备应该匹配规则B', () => {
    const eq = makeEquipment({
      set: SetType.SPEED_SET,
      substats: [
        { type: StatType.SPEED, value: 18, rolls: 4 },
        { type: StatType.ATTACK_PERCENT, value: 15, rolls: 2 },
        { type: StatType.CRITICAL_HIT_CHANCE_PERCENT, value: 10, rolls: 2 },
        { type: StatType.HEALTH_PERCENT, value: 8, rolls: 1 },
      ],
    });
    const score = calculateEquipmentScore(eq);
    // 18*2 + 15 + 10*(9/6) + 8 = 36 + 15 + 15 + 8 = 74
    expect(score).toBe(74);

    const results = matchEquipmentWithRules(eq, rules);
    const ruleB = results.find(r => r.rule.checkItem === '测试规则B');
    expect(ruleB).toBeDefined();
    expect(ruleB!.matched).toBe(true);
    // 倍率 1.1：score * 1.1 = 74 * 1.1 = 81.4
    expect(ruleB!.score).toBeCloseTo(74 * 1.1, 1);
  });

  it('非速度套装装备不应该匹配规则B', () => {
    const eq = makeEquipment({
      set: SetType.CRITICAL_SET,
      substats: [
        { type: StatType.SPEED, value: 18, rolls: 4 },
        { type: StatType.ATTACK_PERCENT, value: 15, rolls: 2 },
        { type: StatType.CRITICAL_HIT_CHANCE_PERCENT, value: 10, rolls: 2 },
        { type: StatType.HEALTH_PERCENT, value: 8, rolls: 1 },
      ],
    });

    const results = matchEquipmentWithRules(eq, rules);
    const ruleB = results.find(r => r.rule.checkItem === '测试规则B');
    expect(ruleB).toBeUndefined();
  });

  it('鞋子装备应该匹配规则C（部位过滤器）', () => {
    const eq = makeEquipment({
      type: EquipmentType.BOOTS,
      substats: [
        { type: StatType.SPEED, value: 15, rolls: 3 },
        { type: StatType.ATTACK_PERCENT, value: 15, rolls: 2 },
        { type: StatType.HEALTH_PERCENT, value: 8, rolls: 1 },
        { type: StatType.DEFENSE_PERCENT, value: 8, rolls: 1 },
      ],
    });
    const score = calculateEquipmentScore(eq);
    // 15*2 + 15 + 8 + 8 = 61
    expect(score).toBe(61);

    const results = matchEquipmentWithRules(eq, rules);
    const ruleC = results.find(r => r.rule.checkItem === '测试规则C');
    expect(ruleC).toBeDefined();
    expect(ruleC!.matched).toBe(true);
    expect(ruleC!.score).toBe(61); // 倍率为1
  });

  it('非鞋子装备不应该匹配规则C', () => {
    const eq = makeEquipment({
      type: EquipmentType.ARMOR,
      substats: [
        { type: StatType.SPEED, value: 15, rolls: 3 },
        { type: StatType.ATTACK_PERCENT, value: 15, rolls: 2 },
        { type: StatType.HEALTH_PERCENT, value: 10, rolls: 1 },
        { type: StatType.DEFENSE_PERCENT, value: 10, rolls: 1 },
      ],
    });

    const results = matchEquipmentWithRules(eq, rules);
    const ruleC = results.find(r => r.rule.checkItem === '测试规则C');
    expect(ruleC).toBeUndefined();
  });

  it('匹配结果应该按分数降序排列', () => {
    const eq = makeEquipment({
      set: SetType.SPEED_SET,
      substats: [
        { type: StatType.SPEED, value: 18, rolls: 4 },
        { type: StatType.ATTACK_PERCENT, value: 20, rolls: 3 },
        { type: StatType.CRITICAL_HIT_CHANCE_PERCENT, value: 10, rolls: 2 },
        { type: StatType.HEALTH_PERCENT, value: 8, rolls: 1 },
      ],
    });

    const results = matchEquipmentWithRules(eq, rules);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
    }
  });
});

describe('集成测试: 基于旧项目的测试数据', () => {
  it('旧项目测试装备: 速度18 + 暴击率17 + 暴伤8 + 生命%7', () => {
    const eq = makeEquipment({
      type: EquipmentType.ARMOR,
      set: SetType.CRITICAL_SET,
      substats: [
        { type: StatType.SPEED, value: 18, rolls: 4 },
        { type: StatType.CRITICAL_HIT_CHANCE_PERCENT, value: 17, rolls: 3 },
        { type: StatType.CRITICAL_HIT_DAMAGE_PERCENT, value: 8, rolls: 1 },
        { type: StatType.HEALTH_PERCENT, value: 7, rolls: 1 },
      ],
    });

    // 验证分数计算与旧项目一致
    const score = calculateEquipmentScore(eq);
    expect(score).toBe(77.5);
  });

  it('85级装备重铸后分数应该更高', () => {
    const eq85 = makeEquipment({
      level: 85,
      substats: [
        { type: StatType.SPEED, value: 4, rolls: 1, originalValue: 4, reforged: true },
        { type: StatType.ATTACK_PERCENT, value: 8, rolls: 1, originalValue: 7, reforged: true },
        { type: StatType.CRITICAL_HIT_CHANCE_PERCENT, value: 4, rolls: 1, originalValue: 3, reforged: true },
        { type: StatType.HEALTH_PERCENT, value: 8, rolls: 1, originalValue: 7, reforged: true },
      ],
    });

    const eq90 = makeEquipment({
      level: 90,
      substats: [
        { type: StatType.SPEED, value: 4, rolls: 1 },
        { type: StatType.ATTACK_PERCENT, value: 7, rolls: 1 },
        { type: StatType.CRITICAL_HIT_CHANCE_PERCENT, value: 3, rolls: 1 },
        { type: StatType.HEALTH_PERCENT, value: 7, rolls: 1 },
      ],
    });

    const score85 = calculateEquipmentScore(eq85);
    const score90 = calculateEquipmentScore(eq90);

    // 重铸后的85级装备分数应该高于未重铸的90级
    expect(score85).toBeGreaterThan(score90);
  });
});
