'use client';

import { Fragment, useState, useMemo } from 'react';
import { EquipmentRule } from '@/types/rule-engine';
import { SetTypeDisplay, EquipmentTypeDisplay, StatTypeDisplay } from '@/constants';
import { positionDisplay } from '@/constants/rule-engine';
import { SubStatFilter, SpecialCheckType } from '@/types/rule-engine';

function formatValidStats(filter: SubStatFilter): string {
  if (filter.type === 'all') return '全部';

  const translateStat = (stat: string) => {
    const entry = Object.entries(StatTypeDisplay).find(([key]) => key === stat);
    return entry ? entry[1] : stat;
  };

  if (filter.type === 'have') {
    return `have ${filter.values?.map(translateStat).join('，') || ''}`;
  }

  if (filter.type === 'act_on') {
    return `act on [${filter.values?.map(translateStat).join('，') || ''}]`;
  }

  if (filter.type === 'act_on_special') {
    const statsStr = filter.values?.map(translateStat).join('，') || '';
    const checks = filter.specialCheckTypes || [];
    const checkDescs: string[] = [];
    if (checks.includes(SpecialCheckType.SPECIAL_CHECK_ONE)) {
      checkDescs.push('需要包含至少一条命中或抵抗');
    }
    if (checks.includes(SpecialCheckType.SPECIAL_CHECK_THREE)) {
      checkDescs.push('攻击%不可与命中抵抗同时存在');
    }
    const suffix = checkDescs.length > 0 ? `；${checkDescs.join('，')}` : '';
    return `act on [${statsStr}]${suffix}`;
  }

  return filter.values?.join(', ') || '—';
}
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';

interface RuleTableProps {
  rules: EquipmentRule[];
}

export function RuleTable({ rules }: RuleTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  const filteredRules = useMemo(() => {
    if (!searchTerm) return rules;
    const lower = searchTerm.toLowerCase();
    return rules.filter(r => r.checkItem.toLowerCase().includes(lower));
  }, [rules, searchTerm]);

  const toggleExpand = (id: string) => {
    setExpandedRules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-steel-500" />
        <Input
          placeholder="搜索检测项..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pl-9 h-8 text-xs border-steel-700 bg-steel-900/50 placeholder:text-steel-600 focus-visible:ring-gold-500/30"
        />
      </div>

      <div className="rounded border border-steel-800 overflow-auto max-h-[calc(100vh-12rem)]">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="border-steel-800 hover:bg-transparent">
              <TableHead className="w-8 bg-steel-950/80 border-steel-800 h-8" />
              <TableHead className="text-[10px] font-mono uppercase tracking-wider text-steel-400 bg-steel-950/80 border-steel-800 h-8">检测项</TableHead>
              <TableHead className="text-[10px] font-mono uppercase tracking-wider text-steel-400 bg-steel-950/80 border-steel-800 h-8">套装</TableHead>
              <TableHead className="text-[10px] font-mono uppercase tracking-wider text-steel-400 bg-steel-950/80 border-steel-800 h-8">部位</TableHead>
              <TableHead className="text-[10px] font-mono uppercase tracking-wider text-steel-400 bg-steel-950/80 border-steel-800 h-8">主属性</TableHead>
              <TableHead className="text-[10px] font-mono uppercase tracking-wider text-steel-400 bg-steel-950/80 border-steel-800 h-8">有效属性</TableHead>
              <TableHead className="text-[10px] font-mono uppercase tracking-wider text-steel-400 bg-steel-950/80 border-steel-800 h-8 text-right">条件数</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRules.length === 0 ? (
              <TableRow className="border-steel-800">
                <TableCell colSpan={7} className="h-24 text-center text-steel-500 font-mono text-xs">
                  {searchTerm ? '无匹配规则' : '暂无规则数据'}
                </TableCell>
              </TableRow>
            ) : (
              filteredRules.map(rule => (
                <Fragment key={rule.id}>
                  <TableRow
                    className="cursor-pointer border-steel-800/60 hover:bg-gold-500/[0.02] transition-colors"
                    onClick={() => toggleExpand(rule.id)}
                  >
                    <TableCell className="p-2 border-steel-800/60">
                      {expandedRules.has(rule.id)
                        ? <ChevronDown className="h-3.5 w-3.5 text-gold-400" />
                        : <ChevronRight className="h-3.5 w-3.5 text-steel-500" />}
                    </TableCell>
                    <TableCell className="font-medium text-xs text-steel-200 border-steel-800/60">{rule.checkItem}</TableCell>
                    <TableCell className="text-xs text-steel-300 border-steel-800/60">
                      {rule.sets.type === 'all'
                        ? <span className="text-steel-500">全部</span>
                        : rule.sets.values?.map(v => SetTypeDisplay[v as keyof typeof SetTypeDisplay] || v).join(', ')}
                    </TableCell>
                    <TableCell className="text-xs text-steel-300 border-steel-800/60">
                      {rule.positions.type === 'all'
                        ? <span className="text-steel-500">全部</span>
                        : rule.positions.type === 'not_boot'
                          ? '非鞋子'
                          : rule.positions.values?.map(v => positionDisplay[v] || v).join('，')}
                    </TableCell>
                    <TableCell className="text-xs text-steel-300 border-steel-800/60">
                      {rule.mainStats.type === 'all'
                        ? <span className="text-steel-500">全部</span>
                        : rule.mainStats.values?.map(v => {
                            const statKey = Object.entries(StatTypeDisplay).find(([key]) => key === v);
                            return statKey ? statKey[1] : v;
                          }).join('，')}
                    </TableCell>
                    <TableCell className="text-xs text-steel-300 border-steel-800/60">
                      {formatValidStats(rule.validStats)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-gold-400 border-steel-800/60">{rule.conditionSets.length}</TableCell>
                  </TableRow>

                  {expandedRules.has(rule.id) && rule.conditionSets.length > 0 && (
                    <TableRow key={`${rule.id}-detail`} className="border-steel-800/60">
                      <TableCell colSpan={7} className="bg-steel-950/40 p-4 border-steel-800/60">
                        <div className="space-y-1.5">
                          {rule.conditionSets.map((cs, i) => (
                            <div key={cs.id} className="flex items-center gap-2 text-xs">
                              <span className="shrink-0 text-[10px] font-mono text-steel-500 bg-steel-800/50 px-1.5 py-0.5 rounded border border-steel-700/50">
                                条件 {i + 1}
                              </span>
                              <span className="text-steel-400 font-mono">
                                {(() => {
                                  const label = cs.condition.useEffectiveScore ? '有效分数' : '分数';
                                  if (cs.condition.type === 'range') return `${label}[${cs.condition.min}-${cs.condition.max}]`;
                                  if (cs.condition.type === 'comparison') return `${label}${cs.condition.operator}${cs.condition.value}`;
                                  // speed_range: may have embedded score condition
                                  const speedPart = `速度${cs.condition.speedMin}-${cs.condition.speedMax}`;
                                  if (cs.condition.scoreMin !== undefined || cs.condition.scoreMax !== undefined) {
                                    return `${speedPart} ${label}[${cs.condition.scoreMin ?? 0}-${cs.condition.scoreMax ?? '∞'}]`;
                                  }
                                  return speedPart;
                                })()}
                              </span>
                              <span className="text-steel-600">→</span>
                              <span className="font-mono text-gold-400 bg-gold-500/10 px-1.5 py-0.5 rounded border border-gold-500/15">
                                {cs.condition.useEffectiveScore
                                  ? cs.multiplier.expression.replace(/(?<!有效)分数/g, '有效分数')
                                  : cs.multiplier.expression}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-[11px] font-mono text-steel-500 tracking-wider">
        共 <span className="text-steel-400">{rules.length}</span> 条规则
        {searchTerm && <span>，显示 <span className="text-gold-400">{filteredRules.length}</span> 条匹配</span>}
      </p>
    </div>
  );
}
