'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Equipment, StatType, StatTypeDisplay, EquipmentTypeDisplay, SetTypeDisplay,
  getRankChinese, getAllowedSubstatsForEquipment, getModificationLimitsByLevel
} from '@/constants';
import { EquipmentRule, RuleMatchResult } from '@/types/rule-engine';
import { calculateEquipmentScore } from '@/lib/equipment-scoring';
import { parseCSVToRules, matchEquipmentWithRules } from '@/lib/rule-engine';
import { getConversionLimit, calculatePotentialScore } from '@/lib/conversion-utils';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConversionResult {
  results: Array<{
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
  }>;
  potentialScore: number;
}

interface EquipmentDetailProps {
  equipment: Equipment;
  onClose: () => void;
  onEquipmentUpdate?: (updatedEquipment: Equipment) => void;
  open: boolean;
}

export function EquipmentDetail({ equipment, onClose, onEquipmentUpdate, open }: EquipmentDetailProps) {
  const [rules, setRules] = useState<EquipmentRule[]>([]);
  const [conversionResults, setConversionResults] = useState<ConversionResult | null>(null);
  const lastProcessedId = useRef<string>('');

  // 只在首次打开时加载规则
  useEffect(() => {
    if (!open) {
      lastProcessedId.current = '';
      return;
    }
    if (rules.length > 0) return;
    fetch('/api/rules')
      .then(res => res.text())
      .then(csv => {
        const parsed = parseCSVToRules(csv);
        setRules(parsed);
      })
      .catch(console.error);
  }, [open, rules.length]);

  // equipment 或 rules 变化时重新计算转换
  useEffect(() => {
    if (!open || rules.length === 0) return;
    const eqId = `${equipment.id}_${equipment.level}_${equipment.substats?.map(s => `${s.type}:${s.value}`).join('|')}`;
    if (lastProcessedId.current === eqId) return;
    lastProcessedId.current = eqId;
    executeConversion(rules);
  }, [open, equipment, rules]);

  const executeConversion = (parsedRules: EquipmentRule[]) => {
    const results: ConversionResult['results'] = [];

    // 检查是否存在已转换的副属性
    const hasModifiedSubstats = equipment.substats?.some(substat => substat.modified);

    equipment.substats.forEach((substat, index) => {
      // 如果存在已转换的副属性，只处理已转换的副属性
      if (hasModifiedSubstats && !substat.modified) return;

      if (substat.rolls > 3) return;

      const allowedTypes = getAllowedSubstatsForEquipment(equipment.type);
      const existingTypes = equipment.substats.map(s => s.type);
      const mainStatType = equipment.main.type;

      const targetTypes = allowedTypes.filter(t => {
        if (t === mainStatType) return false;
        if (t === substat.type) return true;
        return !existingTypes.includes(t as StatType);
      });

      const conversions = targetTypes.map(targetType => {
        const conversionLimit = getConversionLimit(equipment.level, targetType, substat.rolls);
        if (!conversionLimit) return null;

        const cloned: Equipment = JSON.parse(JSON.stringify(equipment));
        cloned.substats[index] = {
          type: targetType as StatType,
          value: conversionLimit,
          rolls: substat.rolls
        };

        const score = calculateEquipmentScore(cloned);
        const ruleResults = matchEquipmentWithRules(cloned, parsedRules);
        const ruleMatches = ruleResults
          .filter(r => r.score > 0)
          .map(r => ({ ruleName: r.rule.checkItem, score: r.score }));

        const scoreDiff = score - calculateEquipmentScore(equipment);

        return {
          targetType: targetType as StatType,
          targetValue: conversionLimit,
          score,
          scoreDiff,
          ruleResults: ruleMatches
        };
      }).filter((c): c is NonNullable<typeof c> => c !== null);

      conversions.sort((a, b) => b.scoreDiff - a.scoreDiff);

      results.push({
        substatIndex: index,
        originalType: substat.type,
        originalValue: substat.value,
        conversions
      });
    });

    const potentialScore = calculatePotentialScore(equipment, parsedRules);

    setConversionResults({ results, potentialScore });

    if (potentialScore !== 0) {
      onEquipmentUpdate?.({ ...equipment, potentialScore });
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-3xl bg-steel-950 border-steel-800 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-steel-800">
          <SheetTitle className="text-base font-mono font-semibold text-steel-100 tracking-wide">
            {equipment.name || `装备 #${equipment.id}`}
          </SheetTitle>
          <SheetDescription className="text-[11px] font-mono text-steel-500 uppercase tracking-wider">
            装备详细信息与副属性转换分析
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="space-y-4 px-6 py-4">
            {/* Basic Info */}
            <div className="border border-steel-800 rounded bg-card/30">
              <div className="px-4 py-2.5 border-b border-steel-800 flex items-center gap-2">
                <div className="w-1 h-3 bg-gold-500 rounded-full" />
                <span className="text-[11px] font-mono text-gold-400 uppercase tracking-wider font-medium">基本信息</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
                  <div className="flex justify-between">
                    <span className="text-steel-500">类型</span>
                    <span className="text-steel-200 font-mono">{EquipmentTypeDisplay[equipment.type]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-500">套装</span>
                    <Badge variant="outline" className="border-gold-500/20 text-gold-400/80 bg-gold-500/5 text-[10px] font-mono h-5">
                      {SetTypeDisplay[equipment.set]}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-500">品质</span>
                    <span className="text-steel-200">{getRankChinese(equipment.rank)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-500">等级</span>
                    <span className="text-steel-200 font-mono">
                      {equipment.level === 85
                        ? <span>85<span className="text-[10px] text-accent-blue-dim">(90)</span></span>
                        : equipment.level}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-500">强化</span>
                    <span className="text-gold-300 font-mono">+{equipment.enhance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-500">主属性</span>
                    <span className="text-steel-200 font-mono text-[11px]">
                      {StatTypeDisplay[equipment.main.type]} {equipment.main.value}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Substats */}
            <div className="border border-steel-800 rounded bg-card/30">
              <div className="px-4 py-2.5 border-b border-steel-800 flex items-center gap-2">
                <div className="w-1 h-3 bg-accent-blue rounded-full" />
                <span className="text-[11px] font-mono text-accent-blue uppercase tracking-wider font-medium">副属性</span>
              </div>
              <div className="p-4 space-y-2">
                {equipment.substats.map((sub, i) => (
                  <div key={i} className="flex items-center justify-between text-xs group">
                    <span className="text-steel-200 font-mono">
                      {StatTypeDisplay[sub.type]} <span className="text-gold-300 font-semibold">{sub.value}</span>
                      {sub.originalValue && sub.originalValue !== sub.value && (
                        <span className="text-[10px] text-accent-blue-dim ml-1">({sub.originalValue})</span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-steel-500 bg-steel-800/50 px-1.5 py-0.5 rounded">
                        {sub.rolls}次
                      </span>
                      {sub.modified && (
                        <span className="text-[10px] font-mono text-accent-green bg-accent-green-bg px-1.5 py-0.5 rounded border border-accent-green-border">
                          已转换
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score */}
            <div className="border border-steel-800 rounded bg-card/30">
              <div className="px-4 py-2.5 border-b border-steel-800 flex items-center gap-2">
                <div className="w-1 h-3 bg-gold-500 rounded-full" />
                <span className="text-[11px] font-mono text-gold-400 uppercase tracking-wider font-medium">评分</span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded border border-steel-800 bg-steel-900/50">
                    <p className="text-2xl font-mono font-bold text-gold-400 data-text">{calculateEquipmentScore(equipment).toFixed(2)}</p>
                    <p className="text-[10px] font-mono text-steel-500 uppercase tracking-wider mt-1">装备分数</p>
                  </div>
                  <div className="text-center p-3 rounded border border-steel-800 bg-steel-900/50">
                    <p className="text-2xl font-mono font-bold text-steel-100 data-text">{equipment.bestScore?.toFixed(2) || '—'}</p>
                    <p className="text-[10px] font-mono text-steel-500 uppercase tracking-wider mt-1">规则分</p>
                  </div>
                  <div className="text-center p-3 rounded border border-steel-800 bg-steel-900/50">
                    <p className="text-2xl font-mono font-bold text-accent-green-dim data-text">{(conversionResults?.potentialScore ?? equipment.potentialScore)?.toFixed(2) || '—'}</p>
                    <p className="text-[10px] font-mono text-steel-500 uppercase tracking-wider mt-1">潜能分</p>
                  </div>
                </div>
                {equipment.bestRule && (
                  <div className="mt-3 text-center">
                    <Badge className="bg-gold-500/15 text-gold-400 border border-gold-500/20 font-mono text-xs">
                      {equipment.bestRule}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Rule Results */}
            {equipment.allRuleResults && equipment.allRuleResults.length > 0 && (
              <div className="border border-steel-800 rounded bg-card/30">
                <div className="px-4 py-2.5 border-b border-steel-800 flex items-center gap-2">
                  <div className="w-1 h-3 bg-steel-400 rounded-full" />
                  <span className="text-[11px] font-mono text-steel-300 uppercase tracking-wider font-medium">规则匹配结果</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-1.5">
                    {equipment.allRuleResults
                      .sort((a, b) => b.score - a.score)
                      .map((r, i) => (
                        <div key={i} className="flex items-center justify-between rounded border border-steel-800/60 bg-steel-900/30 px-2.5 py-1.5 text-xs">
                          <span className="text-steel-300 truncate mr-2">{r.ruleName}</span>
                          <span className="font-mono text-gold-400 data-text shrink-0">{r.score.toFixed(2)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Conversion Results */}
            {conversionResults && conversionResults.results.length > 0 && (
              <div className="border border-steel-800 rounded bg-card/30">
                <div className="px-4 py-2.5 border-b border-steel-800 flex items-center gap-2">
                  <div className="w-1 h-3 bg-accent-green rounded-full" />
                  <span className="text-[11px] font-mono text-accent-green uppercase tracking-wider font-medium">副属性转换分析</span>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {conversionResults.results.map((result) => (
                      <div key={result.substatIndex} className="rounded border border-steel-800 bg-steel-900/30 p-3 space-y-2">
                        <div className="text-xs font-medium text-steel-200 flex items-center justify-between">
                          <span className="font-mono">{StatTypeDisplay[result.originalType]} {result.originalValue}</span>
                          <span className="text-[10px] font-mono text-steel-500">#{result.substatIndex + 1}</span>
                        </div>
                        <div className="h-px bg-steel-800" />
                        {result.conversions.slice(0, 8).map((conv, ci) => (
                          <div key={ci} className="text-[11px] space-y-0.5">
                            <div className="flex justify-between items-center">
                              <span className="text-steel-400">
                                → <span className="text-steel-200">{StatTypeDisplay[conv.targetType]}</span> <span className="text-steel-300 font-mono">{conv.targetValue}</span>
                              </span>
                              <span className="font-mono data-text text-accent-green-dim">
                                {conv.score.toFixed(2)}
                              </span>
                            </div>
                            {conv.ruleResults.length > 0 && (
                              <div className="text-steel-500 font-mono text-[10px]">
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
                  <div className="mt-3 pt-3 border-t border-steel-800 flex items-center justify-center gap-3">
                    <span className="text-[11px] font-mono text-steel-500 uppercase tracking-wider">潜能分</span>
                    <span className="text-lg font-mono font-bold text-accent-green-dim data-text">
                      {conversionResults.potentialScore.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
