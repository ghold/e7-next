'use client';

import { useState } from 'react';
import {
  StatType, StatTypeDisplay, EquipmentType, EquipmentTypeDisplay,
  SetType, SetTypeDisplay, RankType, STAT_TYPES, EQUIPMENT_TYPES, SET_TYPES,
  getAllowedSubstatsForEquipment, Equipment, SubStat
} from '@/constants';
import { EquipmentRule, RuleMatchResult } from '@/types/rule-engine';
import { calculateEquipmentScore } from '@/lib/equipment-scoring';
import { parseCSVToRules, matchEquipmentWithRules } from '@/lib/rule-engine';
import { calculateReforgeValuesTypeValueAndRolls } from '@/lib/reforge-calculator';
import { getConversionLimit, calculatePotentialScore } from '@/lib/conversion-utils';
import { useRules } from '@/hooks/use-rules';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { ArrowLeftRight, Calculator } from 'lucide-react';

interface SubstatConfig {
  type: StatType | '';
  value: string;
  rolls: string;
  modified?: boolean;
}

interface ConversionResult {
  substatIndex: number;
  originalType: StatType;
  originalValue: number;
  conversions: Array<{
    targetType: StatType;
    targetValue: number;
    score: number;
    scoreDiff: number;
    ruleResults: Array<{ ruleName: string; score: number }>;
  }>;
}

export default function ConverterPage() {
  const { rules, loading: rulesLoading } = useRules();

  const [enhance, setEnhance] = useState('15');
  const [level, setLevel] = useState('88');
  const [equipmentType, setEquipmentType] = useState<EquipmentType>(EquipmentType.WEAPON);
  const [setType, setSetType] = useState<SetType>(SetType.SPEED_SET);
  const [mainStatType, setMainStatType] = useState<StatType>(StatType.ATTACK_PERCENT);
  const [mainStatValue, setMainStatValue] = useState('65');
  const [substats, setSubstats] = useState<SubstatConfig[]>([
    { type: StatType.SPEED, value: '4', rolls: '1' },
    { type: StatType.ATTACK_PERCENT, value: '7', rolls: '1' },
    { type: StatType.CRITICAL_HIT_CHANCE_PERCENT, value: '5', rolls: '1' },
    { type: StatType.CRITICAL_HIT_DAMAGE_PERCENT, value: '7', rolls: '1' },
  ]);

  const [results, setResults] = useState<ConversionResult[] | null>(null);
  const [ruleMatches, setRuleMatches] = useState<RuleMatchResult[]>([]);
  const [calculatedScore, setCalculatedScore] = useState(0);
  const [potentialScore, setPotentialScore] = useState(0);

  const updateSubstat = (index: number, field: keyof SubstatConfig, value: string | boolean) => {
    setSubstats(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const toggleModified = (index: number) => {
    setSubstats(prev => prev.map((s, i) => ({
      ...s,
      modified: i === index ? !s.modified : false,
    })));
  };

  const buildEquipment = (): Equipment => {
    const lvl = parseInt(level);
    const substatObjects: SubStat[] = substats
      .filter(s => s.type)
      .map(s => {
        const type = s.type as StatType;
        const value = parseFloat(s.value) || 0;
        const rolls = parseInt(s.rolls) || 1;
        return { type, value, rolls, modified: s.modified };
      });

    if (lvl === 85) {
      substatObjects.forEach(sub => {
        const originalValue = sub.value;
        sub.value = calculateReforgeValuesTypeValueAndRolls(false, sub.type, originalValue, sub.rolls, lvl);
        sub.originalValue = originalValue;
        sub.reforged = true;
      });
    }

    return {
      code: '', ct: 0, e: 0, f: '', g: 0, id: 0, level: lvl,
      mainStatBaseValue: 0, mainStatId: '', mainStatType: mainStatType,
      mainStatValue: parseFloat(mainStatValue) || 0, mg: 0, op: [], s: '',
      statMultiplier: 0, tierMultiplier: 0,
      type: equipmentType, gear: '', rank: RankType.EPIC, set: setType,
      name: '手动配置装备', enhance: parseInt(enhance) || 0,
      main: { type: mainStatType, value: parseFloat(mainStatValue) || 0 },
      substats: substatObjects,
      ingameId: 0, ingameEquippedId: ''
    };
  };

  const handleCalculate = () => {
    const equipment = buildEquipment();
    const score = calculateEquipmentScore(equipment);
    setCalculatedScore(score);

    const matches = matchEquipmentWithRules(equipment, rules);
    setRuleMatches(matches);

    const convResults: ConversionResult[] = [];

    equipment.substats.forEach((substat, index) => {
      if (substat.rolls > 3) return;

      const allowedTypes = getAllowedSubstatsForEquipment(equipment.type);
      const existingTypes = equipment.substats.map(s => s.type);
      const targetTypes = allowedTypes.filter(t => {
        if (t === equipment.main.type) return false;
        if (t === substat.type) return true;
        return !existingTypes.includes(t as StatType);
      });

      const conversions = targetTypes.map(targetType => {
        const conversionLimit = getConversionLimit(equipment.level, targetType, substat.rolls);
        if (!conversionLimit) return null;

        const cloned: Equipment = JSON.parse(JSON.stringify(equipment));
        cloned.substats[index].type = targetType as StatType;
        cloned.substats[index].value = conversionLimit;
        cloned.substats[index].modified = true;

        const newScore = calculateEquipmentScore(cloned);
        const newMatches = matchEquipmentWithRules(cloned, rules);
        const ruleResults = newMatches
          .filter(r => r.score > 0)
          .map(r => ({ ruleName: r.rule.checkItem, score: r.score }));

        return {
          targetType: targetType as StatType,
          targetValue: conversionLimit,
          score: newScore,
          scoreDiff: newScore - score,
          ruleResults
        };
      }).filter((c): c is NonNullable<typeof c> => c !== null);

      conversions.sort((a, b) => b.scoreDiff - a.scoreDiff);
      convResults.push({
        substatIndex: index,
        originalType: substat.type,
        originalValue: substat.originalValue || substat.value,
        conversions
      });
    });

    setResults(convResults);
    setPotentialScore(calculatePotentialScore(equipment, rules));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-5">
        <div className="grid grid-cols-[380px_1fr] gap-4 items-start">

          {/* LEFT: input form */}
          <div className="space-y-3">
            <div className="border border-steel-800 rounded bg-card/30 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-steel-800 bg-steel-950/30">
                <ArrowLeftRight className="h-3.5 w-3.5 text-gold-500" />
                <span className="text-[11px] font-mono text-gold-400 uppercase tracking-wider font-medium">副属性转换估算器</span>
              </div>
              <div className="p-4 space-y-4">
                {/* Row 1: 4 equal columns */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">装备类型</Label>
                    <Select value={equipmentType} onValueChange={v => setEquipmentType((v ?? EquipmentType.WEAPON) as EquipmentType)}>
                      <SelectTrigger className="h-8 text-xs border-steel-700 bg-steel-900/50 font-mono"><span>{EquipmentTypeDisplay[equipmentType]}</span></SelectTrigger>
                      <SelectContent className="border-steel-700 bg-steel-900">
                        {EQUIPMENT_TYPES.map(t => (
                          <SelectItem key={t} value={t}>{EquipmentTypeDisplay[t]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">套装</Label>
                    <Select value={setType} onValueChange={v => setSetType((v ?? SetType.SPEED_SET) as SetType)}>
                      <SelectTrigger className="h-8 text-xs border-steel-700 bg-steel-900/50 font-mono"><span>{SetTypeDisplay[setType]}</span></SelectTrigger>
                      <SelectContent className="border-steel-700 bg-steel-900">
                        {SET_TYPES.map(s => (
                          <SelectItem key={s} value={s}>{SetTypeDisplay[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">装备等级</Label>
                    <Select value={level} onValueChange={(v) => setLevel(v ?? '88')}>
                      <SelectTrigger className="h-8 text-xs border-steel-700 bg-steel-900/50 font-mono">
                        <span>{{ '85': '85', '88': '88', '90': '90' }[level]}</span>
                      </SelectTrigger>
                      <SelectContent className="border-steel-700 bg-steel-900">
                        <SelectItem value="85">85</SelectItem>
                        <SelectItem value="88">88</SelectItem>
                        <SelectItem value="90">90</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">强化等级</Label>
                    <Input type="number" value={enhance} onChange={e => setEnhance(e.target.value)} max={15} min={0}
                      className="h-8 text-xs border-steel-700 bg-steel-900/50 font-mono" />
                  </div>
                </div>

                <div className="h-px bg-steel-800" />

                {/* Attribute table */}
                <div className="space-y-1.5">
                  <div className="grid grid-cols-[1fr_72px_72px_44px] gap-2">
                    <span className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">属性类型</span>
                    <span className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">数值</span>
                    <span className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">强化次数</span>
                    <span className="text-[10px] font-mono text-steel-500 uppercase tracking-wider text-center">转换</span>
                  </div>
                  {/* Main stat row */}
                  <div className="grid grid-cols-[1fr_72px_72px_44px] gap-2 items-center">
                    <Select value={mainStatType} onValueChange={v => setMainStatType((v ?? StatType.ATTACK_PERCENT) as StatType)}>
                      <SelectTrigger className="h-8 text-xs border-steel-700 bg-steel-900/50 font-mono">
                        <span className="text-steel-500 mr-1">[主]</span>
                        <span>{StatTypeDisplay[mainStatType]}</span>
                      </SelectTrigger>
                      <SelectContent className="border-steel-700 bg-steel-900">
                        {STAT_TYPES.map(s => (
                          <SelectItem key={s} value={s}>{StatTypeDisplay[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="number" value={mainStatValue} onChange={e => setMainStatValue(e.target.value)}
                      className="h-8 text-xs border-steel-700 bg-steel-900/50 font-mono" />
                    <span />
                    <span />
                  </div>
                  <div className="h-px bg-steel-800/50" />
                  {substats.map((sub, i) => (
                    <div key={i} className="grid grid-cols-[1fr_72px_72px_44px] gap-2 items-center">
                      <Select value={sub.type as any} onValueChange={(v: any) => updateSubstat(i, 'type', v ?? '')}>
                        <SelectTrigger className="h-8 text-xs border-steel-700 bg-steel-900/50 font-mono">
                          <span>{sub.type ? StatTypeDisplay[sub.type as StatType] : '选择属性'}</span>
                        </SelectTrigger>
                        <SelectContent className="border-steel-700 bg-steel-900">
                          {STAT_TYPES.map(s => (
                            <SelectItem key={s} value={s}>{StatTypeDisplay[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input type="number" value={sub.value} onChange={e => updateSubstat(i, 'value', e.target.value)}
                        className="h-8 text-xs border-steel-700 bg-steel-900/50 font-mono" />
                      <Input type="number" value={sub.rolls} onChange={e => updateSubstat(i, 'rolls', e.target.value)} min={1} max={6}
                        className="h-8 text-xs border-steel-700 bg-steel-900/50 font-mono" />
                      <div className="flex justify-center items-center h-8">
                        <input
                          type="checkbox"
                          checked={!!sub.modified}
                          onChange={() => toggleModified(i)}
                          className="h-4 w-4 rounded border-steel-600 bg-steel-900 accent-gold-500 cursor-pointer"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={handleCalculate} disabled={rulesLoading}
                  className="w-full h-9 bg-gold-500/15 text-gold-400 border border-gold-500/25 hover:bg-gold-500/25 hover:border-gold-500/40 font-mono text-xs uppercase tracking-wider transition-all">
                  <Calculator className="h-3.5 w-3.5 mr-2" />
                  开始转换估算
                </Button>
              </div>
            </div>

            {/* Explanation */}
            <div className="border border-steel-800 rounded bg-card/30 overflow-hidden">
              <div className="px-4 py-2 border-b border-steel-800 bg-steel-950/30">
                <span className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">转换规则说明</span>
              </div>
              <div className="px-4 py-3 text-[11px] text-steel-500 space-y-1 font-mono">
                <p>· 只有强化次数 ≤ 3 的副属性可以转换</p>
                <p>· 88级装备转换上限与90级装备不同</p>
                <p>· 转换后的属性值受装备等级和强化次数限制</p>
                <p>· 每个副属性只能转换为该部位允许的属性类型</p>
                <p>· 转换后的属性不能与已有副属性或主属性重复</p>
              </div>
            </div>
          </div>

          {/* RIGHT: results */}
          <div className="space-y-3">
            {calculatedScore === 0 && !results && (
              <div className="border border-dashed border-steel-800 rounded flex items-center justify-center h-40">
                <span className="text-[11px] font-mono text-steel-600 uppercase tracking-wider">输入装备信息后点击开始估算</span>
              </div>
            )}

            {/* Score cards */}
            {calculatedScore > 0 && (
              <div className="border border-steel-800 rounded bg-card/30 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-steel-800 bg-steel-950/30">
                  <span className="text-[11px] font-mono text-gold-400 uppercase tracking-wider font-medium">装备评分</span>
                </div>
                <div className="p-4 grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded border border-steel-800 bg-steel-900/50">
                    <p className="text-2xl font-mono font-bold text-gold-400 data-text">{calculatedScore.toFixed(2)}</p>
                    <p className="text-[10px] font-mono text-steel-500 uppercase tracking-wider mt-1">装备分数</p>
                  </div>
                  <div className="text-center p-3 rounded border border-steel-800 bg-steel-900/50">
                    <p className="text-2xl font-mono font-bold text-steel-100 data-text">{ruleMatches.length > 0 ? ruleMatches[0].score.toFixed(2) : '—'}</p>
                    <p className="text-[10px] font-mono text-steel-500 uppercase tracking-wider mt-1">规则分</p>
                  </div>
                  <div className="text-center p-3 rounded border border-steel-800 bg-steel-900/50">
                    <p className="text-2xl font-mono font-bold text-accent-green-dim data-text">{potentialScore.toFixed(2)}</p>
                    <p className="text-[10px] font-mono text-steel-500 uppercase tracking-wider mt-1">潜能分</p>
                  </div>
                </div>
              </div>
            )}

            {/* Rule Matches */}
            {ruleMatches.length > 0 && (
              <div className="border border-steel-800 rounded bg-card/30 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-steel-800 bg-steel-950/30">
                  <span className="text-[11px] font-mono text-steel-300 uppercase tracking-wider font-medium">规则匹配结果</span>
                </div>
                <div className="p-3 grid grid-cols-2 gap-1.5">
                  {ruleMatches.filter(r => r.score > 0).map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded border border-steel-800/60 bg-steel-900/30 px-2.5 py-1.5 text-xs">
                      <span className="text-steel-300 truncate mr-2">{r.rule.checkItem}</span>
                      <span className="font-mono text-gold-400 data-text shrink-0">{r.score.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conversion Results */}
            {results && results.length > 0 && (
              <div className="border border-steel-800 rounded bg-card/30 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-steel-800 bg-steel-950/30">
                  <span className="text-[11px] font-mono text-accent-green uppercase tracking-wider font-medium">副属性转换分析</span>
                </div>
                <div className="p-3 grid grid-cols-2 gap-2">
                  {results.map(result => (
                    <div key={result.substatIndex} className="rounded border border-steel-800 bg-steel-900/30 p-3 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-steel-200">{StatTypeDisplay[result.originalType]} {result.originalValue}</span>
                        <span className="text-[10px] font-mono text-steel-600">#{result.substatIndex + 1}</span>
                      </div>
                      <div className="h-px bg-steel-800" />
                      {result.conversions.slice(0, 8).map((conv, ci) => (
                        <div key={ci} className="text-[11px]">
                          <div className="flex justify-between items-center">
                            <span className="text-steel-400">
                              → <span className="text-steel-200">{StatTypeDisplay[conv.targetType]}</span>{' '}
                              <span className="font-mono text-steel-300">{conv.targetValue}</span>
                            </span>
                            <span className="font-mono text-accent-green-dim">{conv.score.toFixed(2)}</span>
                          </div>
                          {conv.ruleResults.length > 0 && (
                            <div className="text-steel-600 font-mono text-[10px] mt-0.5">
                              {conv.ruleResults.map((rr, ri) => (
                                <span key={ri} className="mr-2">{rr.ruleName}: {rr.score.toFixed(2)}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
