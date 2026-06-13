import { describe, it } from 'vitest';
import { calculatePotentialScore } from '../lib/conversion-utils';
import { matchEquipmentWithRules, parseCSVToRules } from '../lib/rule-engine';
import { EquipmentType, RankType } from '../constants/equipment-types';
import { StatType } from '../constants/stat-types';
import { SetType } from '../constants/set-types';
import { Equipment } from '../constants/interfaces';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('潜能分计算', () => {
  it('速度头盔潜能分 - 有已转换属性', () => {
    const csvPath = join(process.cwd(), 'public', 'rules.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    const rules = parseCSVToRules(csvContent);

    const equipment: Equipment = {
      id: 999,
      code: 'test-helm',
      name: '速度头盔',
      level: 90,
      rank: RankType.EPIC,
      type: EquipmentType.HELMET,
      set: SetType.SPEED_SET,
      main: {
        type: StatType.HEALTH,
        value: 2835
      },
      substats: [
        { type: StatType.SPEED, value: 23, rolls: 5 },
        { type: StatType.HEALTH_PERCENT, value: 9, rolls: 1, modified: true },  // 已转换
        { type: StatType.ATTACK_PERCENT, value: 8, rolls: 1 },
        { type: StatType.EFFECTIVENESS_PERCENT, value: 17, rolls: 2 }
      ],
      ct: 0, e: 0, f: '', g: 0,
      mainStatBaseValue: 0, mainStatId: '', mainStatType: '', mainStatValue: 2835,
      mg: 0, op: [], p: 0, s: '', statMultiplier: 0, tierMultiplier: 0,
      gear: 'helm', enhance: 0,
      ingameId: 0, ingameEquippedId: ''
    };

    console.log('\n=== 潜能分计算测试 ===');
    console.log('副属性:');
    equipment.substats.forEach(sub => {
      console.log(`  ${sub.type}: ${sub.value} (${sub.rolls}次) ${sub.modified ? '(已转换)' : ''}`);
    });

    const potentialScore = calculatePotentialScore(equipment, rules);
    console.log(`\n潜能分: ${potentialScore.toFixed(2)}`);
    console.log('期望值: 35.00');
  });

  it('速度头盔潜能分 - 无已转换属性', () => {
    const csvPath = join(process.cwd(), 'public', 'rules.csv');
    const csvContent = readFileSync(csvPath, 'utf-8');
    const rules = parseCSVToRules(csvContent);

    const equipment: Equipment = {
      id: 999,
      code: 'test-helm',
      name: '速度头盔',
      level: 90,
      rank: RankType.EPIC,
      type: EquipmentType.HELMET,
      set: SetType.SPEED_SET,
      main: {
        type: StatType.HEALTH,
        value: 2835
      },
      substats: [
        { type: StatType.SPEED, value: 23, rolls: 5 },
        { type: StatType.HEALTH_PERCENT, value: 9, rolls: 1 },  // 未转换
        { type: StatType.ATTACK_PERCENT, value: 8, rolls: 1 },
        { type: StatType.EFFECTIVENESS_PERCENT, value: 17, rolls: 2 }
      ],
      ct: 0, e: 0, f: '', g: 0,
      mainStatBaseValue: 0, mainStatId: '', mainStatType: '', mainStatValue: 2835,
      mg: 0, op: [], p: 0, s: '', statMultiplier: 0, tierMultiplier: 0,
      gear: 'helm', enhance: 0,
      ingameId: 0, ingameEquippedId: ''
    };

    console.log('\n=== 潜能分计算测试 (无已转换) ===');
    console.log('副属性:');
    equipment.substats.forEach(sub => {
      console.log(`  ${sub.type}: ${sub.value} (${sub.rolls}次) ${sub.modified ? '(已转换)' : ''}`);
    });

    const potentialScore = calculatePotentialScore(equipment, rules);
    console.log(`\n潜能分: ${potentialScore.toFixed(2)}`);
    console.log('期望值: 39.00');
  });
});
