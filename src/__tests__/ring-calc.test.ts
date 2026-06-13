import { describe, it } from 'vitest';
import { RuleEngine, matchEquipmentWithRules, parseCSVToRules } from '../lib/rule-engine';
import { EquipmentType, RankType } from '../constants/equipment-types';
import { StatType } from '../constants/stat-types';
import { SetType } from '../constants/set-types';
import { Equipment } from '../constants/interfaces';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('暴击戒指规则分计算', () => {
  it('计算所有规则分', () => {
    // 加载规则
    const csvPath = join(process.cwd(), 'public', 'rules.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    const rules = parseCSVToRules(csvContent);

    const equipment: Equipment = {
      id: 999,
      code: 'test-ring',
      name: '暴击戒指',
      level: 90,
      rank: RankType.EPIC,
      type: EquipmentType.RING,
      set: SetType.CRITICAL_SET,
      main: {
        type: StatType.EFFECTIVENESS_PERCENT,
        value: 65
      },
      substats: [
        { type: StatType.SPEED, value: 20, rolls: 5 },
        { type: StatType.HEALTH_PERCENT, value: 9, rolls: 1 },
        { type: StatType.CRITICAL_HIT_DAMAGE_PERCENT, value: 5, rolls: 1 },
        { type: StatType.EFFECT_RESISTANCE_PERCENT, value: 15, rolls: 2 }
      ],
      ct: 0, e: 0, f: '', g: 0,
      mainStatBaseValue: 0, mainStatId: '', mainStatType: '', mainStatValue: 65,
      mg: 0, op: [], p: 0, s: '', statMultiplier: 0, tierMultiplier: 0,
      gear: 'ring', enhance: 0,
      ingameId: 0, ingameEquippedId: ''
    };

    // 显示所有规则
    console.log('\n=== 所有规则 ===');
    rules.forEach(rule => {
      console.log(`${rule.checkItem}: sets=${JSON.stringify(rule.sets)}, positions=${JSON.stringify(rule.positions)}, mainStats=${JSON.stringify(rule.mainStats)}, validStats=${JSON.stringify(rule.validStats)}`);
    });

    const matches = matchEquipmentWithRules(equipment, rules);

    console.log('\n=== 暴击戒指规则分计算 ===');
    console.log(`装备: ${equipment.name}`);
    console.log(`等级: ${equipment.level}, 品质: ${equipment.rank}`);
    console.log(`套装: ${equipment.set}`);
    console.log(`部位: ${equipment.type}`);
    console.log(`主属性: ${equipment.main.type} ${equipment.main.value}`);
    console.log('副属性:');
    equipment.substats.forEach(sub => {
      console.log(`  ${sub.type}: ${sub.value} (${sub.rolls}次)`);
    });

    // 计算总分
    const score = calculateScore(equipment);
    console.log(`\n装备总分: ${score.toFixed(2)}`);

    console.log(`\n=== 匹配的规则 (${matches.length}条) ===`);
    matches.forEach(match => {
      console.log(`${match.rule.checkItem}: ${match.score.toFixed(2)}`);
      console.log(`  sets: ${JSON.stringify(match.rule.sets)}`);
      console.log(`  positions: ${JSON.stringify(match.rule.positions)}`);
      console.log(`  mainStats: ${JSON.stringify(match.rule.mainStats)}`);
      console.log(`  validStats: ${JSON.stringify(match.rule.validStats)}`);
      console.log(`  conditions: ${JSON.stringify(match.rule.conditionSets)}`);
    });
  });
});

function calculateScore(equipment: Equipment): number {
  let score = 0;
  equipment.substats.forEach(sub => {
    switch (sub.type) {
      case StatType.SPEED:
        score += sub.value * 2;
        break;
      case StatType.CRITICAL_HIT_DAMAGE_PERCENT:
        score += sub.value * (9 / 8);
        break;
      case StatType.CRITICAL_HIT_CHANCE_PERCENT:
        score += sub.value * (9 / 6);
        break;
      case StatType.ATTACK:
        score += sub.value * (3.46 / 39);
        break;
      case StatType.DEFENSE:
        score += sub.value * (4.99 / 31);
        break;
      case StatType.HEALTH:
        score += sub.value * (3.09 / 174);
        break;
      default:
        score += sub.value;
        break;
    }
  });
  return score;
}
