import { describe, it, expect } from 'vitest';
import { calculateEquipmentScore } from '@/lib/equipment-scoring';
import { parseCSVToRules, RuleEngine } from '@/lib/rule-engine';
import { StatType, EquipmentType, SetType, RankType } from '@/constants';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('坦克规则分计算', () => {
  it('抗坦(坦克) 头盔', () => {
    const equipment = {
      code: '', ct: 0, e: 0, f: '', g: 0, id: 0, level: 90,
      mainStatBaseValue: 0, mainStatId: '', mainStatType: StatType.HEALTH_PERCENT,
      mainStatValue: 65, mg: 0, op: [], s: '',
      statMultiplier: 0, tierMultiplier: 0,
      type: EquipmentType.HELMET, gear: '', rank: RankType.EPIC, set: SetType.SPEED_SET,
      name: '测试头盔', enhance: 15,
      main: { type: StatType.HEALTH_PERCENT, value: 65 },
      substats: [
        { type: StatType.DEFENSE_PERCENT, value: 14, rolls: 2 },
        { type: StatType.CRITICAL_HIT_CHANCE_PERCENT, value: 5, rolls: 1 },
        { type: StatType.SPEED, value: 14, rolls: 3 },
        { type: StatType.HEALTH_PERCENT, value: 22, rolls: 3 },
      ],
      ingameId: 0, ingameEquippedId: ''
    };

    const score = calculateEquipmentScore(equipment);
    console.log('装备总分:', score.toFixed(2));

    const csvContent = readFileSync(join(process.cwd(), 'public/rules.csv'), 'utf-8');
    const rules = parseCSVToRules(csvContent);
    
    // Find the specific tank rule
    const tankRule = rules.find(r => r.checkItem.includes('抗坦') && r.positions.values?.includes('HELMET'));
    console.log('\n抗坦(坦克) 头盔规则:', tankRule ? 'found' : 'not found');
    if (tankRule) {
      console.log('  sets:', JSON.stringify(tankRule.sets));
      console.log('  positions:', JSON.stringify(tankRule.positions));
      console.log('  validStats:', JSON.stringify(tankRule.validStats));
      console.log('  conditions:', JSON.stringify(tankRule.conditionSets));
    }

    // Check all rules
    console.log('\n所有规则:');
    rules.forEach(r => {
      console.log(`  ${r.checkItem} - positions: ${JSON.stringify(r.positions)}`);
    });

    const engine = new RuleEngine({ rules, enableDebug: false });
    const results = engine.matchEquipmentWithRules(equipment);
    
    const tankResults = results.filter(r => r.rule.checkItem.includes('坦克'));
    console.log('\n坦克相关规则:');
    tankResults.forEach(r => {
      console.log(`  ${r.rule.checkItem} (${r.rule.setPosition}): score=${r.score.toFixed(2)}`);
    });

    expect(true).toBe(true);
  });
});
