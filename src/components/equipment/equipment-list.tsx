'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Equipment, EquipmentType, SetType, StatType,
  EquipmentTypeDisplay, SetTypeDisplay, StatTypeDisplay,
  getRankChinese, SET_TYPES, EQUIPMENT_TYPES
} from '@/constants';
import { calculateEquipmentScore } from '@/lib/equipment-scoring';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  ArrowUpDown, ArrowUp, ArrowDown, Filter, Settings2, X, Trash2
} from 'lucide-react';

type SortField = string;

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
}

const COLUMN_KEY_TO_STAT: Record<string, StatType> = {
  attackPercent: StatType.ATTACK_PERCENT,
  attack: StatType.ATTACK,
  speed: StatType.SPEED,
  critRate: StatType.CRITICAL_HIT_CHANCE_PERCENT,
  critDamage: StatType.CRITICAL_HIT_DAMAGE_PERCENT,
  healthPercent: StatType.HEALTH_PERCENT,
  health: StatType.HEALTH,
  defensePercent: StatType.DEFENSE_PERCENT,
  defense: StatType.DEFENSE,
  effectiveness: StatType.EFFECTIVENESS_PERCENT,
  resistance: StatType.EFFECT_RESISTANCE_PERCENT,
};

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'set', label: '套装', visible: true },
  { key: 'type', label: '类型', visible: true },
  { key: 'rank', label: '品质', visible: true },
  { key: 'level', label: '等级', visible: true },
  { key: 'enhance', label: '强化', visible: true },
  { key: 'mainStat', label: '主属性', visible: true },
  { key: 'mainValue', label: '主属性值', visible: true },
  { key: 'attackPercent', label: '攻击%', visible: true },
  { key: 'attack', label: '攻击', visible: true },
  { key: 'speed', label: '速度', visible: true },
  { key: 'critRate', label: '暴击率', visible: true },
  { key: 'critDamage', label: '暴伤', visible: true },
  { key: 'healthPercent', label: '生命%', visible: true },
  { key: 'health', label: '生命', visible: true },
  { key: 'defensePercent', label: '防御%', visible: true },
  { key: 'defense', label: '防御', visible: true },
  { key: 'effectiveness', label: '命中', visible: true },
  { key: 'resistance', label: '抗性', visible: true },
  { key: 'score', label: '分数', visible: true },
  { key: 'bestRule', label: '最佳规则', visible: true },
  { key: 'bestScore', label: '规则分', visible: true },
  { key: 'potentialScore', label: '潜能分', visible: true },
  { key: 'ct', label: '获得时间', visible: true },
];

// 85级装备重铸后的主属性值
const mainStatValuesByStatType: Record<string, number> = {
  "Attack": 525,
  "Health": 2835,
  "Defense": 310,
  "CriticalHitDamagePercent": 70,
  "CriticalHitChancePercent": 60,
  "HealthPercent": 65,
  "DefensePercent": 65,
  "AttackPercent": 65,
  "EffectivenessPercent": 65,
  "EffectResistancePercent": 65,
  "Speed": 45,
};

function getSubstatValue(eq: Equipment, statType: StatType): number {
  return eq.substats?.find(s => s.type === statType)?.value ?? 0;
}

function getSubstatOriginalValue(eq: Equipment, statType: StatType): number | undefined {
  return eq.substats?.find(s => s.type === statType)?.originalValue;
}

function getSubstatModified(eq: Equipment, statType: StatType): boolean {
  return eq.substats?.find(s => s.type === statType)?.modified ?? false;
}

function MainStatDisplay({ equipment }: { equipment: Equipment }) {
  const value = Math.round(equipment.main.value);
  const reforgedValue = equipment.level === 85
    ? (mainStatValuesByStatType[equipment.main.type] ?? value)
    : undefined;
  return (
    <span className="font-mono text-xs">
      {StatTypeDisplay[equipment.main.type]} {value}
      {reforgedValue && reforgedValue !== value && (
        <span className="text-accent-blue ml-1">({reforgedValue})</span>
      )}
    </span>
  );
}

function MainValueDisplay({ equipment }: { equipment: Equipment }) {
  const value = Math.round(equipment.main.value);
  const reforgedValue = equipment.level === 85
    ? (mainStatValuesByStatType[equipment.main.type] ?? value)
    : undefined;
  return (
    <span className="font-mono text-xs">
      {value}
      {reforgedValue && reforgedValue !== value && (
        <span className="text-accent-blue">({reforgedValue})</span>
      )}
    </span>
  );
}

function SubstatCell({ eq, statType }: { eq: Equipment; statType: StatType }) {
  const val = getSubstatValue(eq, statType);
  const orig = getSubstatOriginalValue(eq, statType);
  const modified = getSubstatModified(eq, statType);
  if (!val && !orig) return <span className="text-muted-foreground">—</span>;

  const displayValue = val;
  const showOriginal = eq.level === 85 && orig !== undefined && orig !== val;

  const content = (
    <span className="font-mono text-xs">
      {showOriginal ? orig : displayValue}
      {showOriginal && <span className="text-accent-blue">({displayValue})</span>}
    </span>
  );

  if (modified) {
    return <span className="bg-accent-green-bg rounded px-0.5">{content}</span>;
  }
  return content;
}

interface EquipmentListProps {
  equipment: Equipment[];
  onEquipmentSelect?: (equipment: Equipment) => void;
  onDelete?: (id: number) => void;
}

export function EquipmentList({ equipment, onEquipmentSelect, onDelete }: EquipmentListProps) {
  const [sortField, setSortField] = useState<SortField>('level');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedSet, setSelectedSet] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedPotential, setSelectedPotential] = useState('all');
  const [selectedSubstat, setSelectedSubstat] = useState('all');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('equipmentList_columns');
      if (saved) setColumns(JSON.parse(saved));
      const sf = localStorage.getItem('equipmentList_sortField');
      if (sf) setSortField(sf);
      const sd = localStorage.getItem('equipmentList_sortDirection');
      if (sd) setSortDirection(sd as 'asc' | 'desc');
      const st = localStorage.getItem('equipmentList_selectedType');
      if (st) setSelectedType(st);
      const ss = localStorage.getItem('equipmentList_selectedSet');
      if (ss) setSelectedSet(ss);
      const sl = localStorage.getItem('equipmentList_selectedLevel');
      if (sl) setSelectedLevel(sl);
      const sp = localStorage.getItem('equipmentList_selectedPotential');
      if (sp) setSelectedPotential(sp);
    } catch {}
  }, []);

  useEffect(() => { localStorage.setItem('equipmentList_columns', JSON.stringify(columns)); }, [columns]);
  useEffect(() => { localStorage.setItem('equipmentList_sortField', sortField); }, [sortField]);
  useEffect(() => { localStorage.setItem('equipmentList_sortDirection', sortDirection); }, [sortDirection]);
  useEffect(() => { localStorage.setItem('equipmentList_selectedType', selectedType); }, [selectedType]);
  useEffect(() => { localStorage.setItem('equipmentList_selectedSet', selectedSet); }, [selectedSet]);
  useEffect(() => { localStorage.setItem('equipmentList_selectedLevel', selectedLevel); }, [selectedLevel]);
  useEffect(() => { localStorage.setItem('equipmentList_selectedPotential', selectedPotential); }, [selectedPotential]);

  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);

  const filteredEquipment = useMemo(() => {
    let result = equipment;
    if (selectedType !== 'all') result = result.filter(eq => eq.type === selectedType);
    if (selectedSet !== 'all') result = result.filter(eq => eq.set === selectedSet);
    if (selectedLevel !== 'all') {
      result = result.filter(eq => {
        if (selectedLevel === '90') return eq.level === 90 || eq.level === 85;
        if (selectedLevel === '88') return eq.level === 88;
        if (selectedLevel === 'below80') return eq.level < 80;
        return true;
      });
    }
    if (selectedPotential === 'potential_gt_rule') {
      result = result.filter(eq => (eq.potentialScore || 0) > (eq.bestScore || 0));
    }
    if (selectedSubstat !== 'all' && (minValue || maxValue)) {
      result = result.filter(eq => {
        const val = getSubstatValue(eq, selectedSubstat as StatType);
        if (minValue && val < parseFloat(minValue)) return false;
        if (maxValue && val > parseFloat(maxValue)) return false;
        return true;
      });
    }
    return result;
  }, [equipment, selectedType, selectedSet, selectedLevel, selectedPotential, selectedSubstat, minValue, maxValue]);

  const sortedEquipment = useMemo(() => {
    return [...filteredEquipment].sort((a, b) => {
      let aVal: any, bVal: any;
      switch (sortField) {
        case 'score': aVal = calculateEquipmentScore(a); bVal = calculateEquipmentScore(b); break;
        case 'bestScore': aVal = a.bestScore || 0; bVal = b.bestScore || 0; break;
        case 'potentialScore': aVal = a.potentialScore || 0; bVal = b.potentialScore || 0; break;
        case 'ct': aVal = a.ct || 0; bVal = b.ct || 0; break;
        case 'bestRule': aVal = a.bestRule || ''; bVal = b.bestRule || ''; return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'set': aVal = SetTypeDisplay[a.set] || a.set; bVal = SetTypeDisplay[b.set] || b.set; return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        case 'type': aVal = EquipmentTypeDisplay[a.type] || a.type; bVal = EquipmentTypeDisplay[b.type] || b.type; return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        default: {
          const stat = COLUMN_KEY_TO_STAT[sortField];
          if (stat) { aVal = getSubstatValue(a, stat); bVal = getSubstatValue(b, stat); }
          else { aVal = 0; bVal = 0; }
          break;
        }
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [filteredEquipment, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('desc'); }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-steel-600" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 text-gold-400" />
      : <ArrowDown className="h-3 w-3 text-gold-400" />;
  };

  const toggleColumn = (key: string) => {
    setColumns(prev => prev.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
  };

  const hasActiveFilters = selectedType !== 'all' || selectedSet !== 'all' || selectedLevel !== 'all' || selectedPotential !== 'all' || selectedSubstat !== 'all';
  const clearFilters = () => {
    setSelectedType('all');
    setSelectedSet('all');
    setSelectedLevel('all');
    setSelectedPotential('all');
    setSelectedSubstat('all');
    setMinValue('');
    setMaxValue('');
  };

  const renderCellValue = (eq: Equipment, key: string) => {
    switch (key) {
      case 'name': return <span className="text-steel-200">{eq.name || `装备 #${eq.id}`}</span>;
      case 'type': return <span className="text-steel-300 text-xs">{EquipmentTypeDisplay[eq.type] || eq.type}</span>;
      case 'set': return (
        <Badge variant="outline" className="border-gold-500/20 text-gold-400/80 bg-gold-500/5 text-[10px] font-mono">
          {(SetTypeDisplay[eq.set] || eq.set).replace('套装', '')}
        </Badge>
      );
      case 'rank': return <span className="text-xs text-steel-300">{getRankChinese(eq.rank)}</span>;
      case 'level': return (
        <span className="font-mono text-xs">
          {eq.level === 85 ? <span>85<span className="text-accent-blue">(90)</span></span> : eq.level}
        </span>
      );
      case 'enhance': return <span className="font-mono text-xs text-gold-300">+{eq.enhance}</span>;
      case 'mainStat': return <MainStatDisplay equipment={eq} />;
      case 'mainValue': return <MainValueDisplay equipment={eq} />;
      case 'score': return <span className="font-medium text-accent-blue">{calculateEquipmentScore(eq).toFixed(2)}</span>;
      case 'bestRule': return <span className="text-xs text-steel-300">{eq.bestRule || '—'}</span>;
      case 'bestScore': return <span className="font-mono text-xs data-text">{eq.bestScore?.toFixed(2) || '—'}</span>;
      case 'potentialScore': return <span className="font-mono text-xs text-accent-green-dim data-text">{(eq.potentialScore || 0).toFixed(2)}</span>;
      case 'ct': return <span className="font-mono text-xs text-steel-400">{eq.ct ? new Date(eq.ct * 1000).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</span>;
      case 'speed': return <SubstatCell eq={eq} statType={StatType.SPEED} />;
      case 'attackPercent': return <SubstatCell eq={eq} statType={StatType.ATTACK_PERCENT} />;
      case 'defensePercent': return <SubstatCell eq={eq} statType={StatType.DEFENSE_PERCENT} />;
      case 'healthPercent': return <SubstatCell eq={eq} statType={StatType.HEALTH_PERCENT} />;
      case 'critRate': return <SubstatCell eq={eq} statType={StatType.CRITICAL_HIT_CHANCE_PERCENT} />;
      case 'critDamage': return <SubstatCell eq={eq} statType={StatType.CRITICAL_HIT_DAMAGE_PERCENT} />;
      case 'effectiveness': return <SubstatCell eq={eq} statType={StatType.EFFECTIVENESS_PERCENT} />;
      case 'resistance': return <SubstatCell eq={eq} statType={StatType.EFFECT_RESISTANCE_PERCENT} />;
      case 'attack': return <SubstatCell eq={eq} statType={StatType.ATTACK} />;
      case 'defense': return <SubstatCell eq={eq} statType={StatType.DEFENSE} />;
      case 'health': return <SubstatCell eq={eq} statType={StatType.HEALTH} />;
      default: return '—';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
            showFilters
              ? 'border-gold-500/40 bg-gold-500/10 text-gold-400'
              : 'border-steel-700 text-steel-300 hover:border-gold-500/30 hover:text-gold-400'
          }`}
        >
          <Filter className="h-3 w-3" />
          筛选
          {hasActiveFilters && (
            <span className="ml-0.5 h-3.5 px-1 rounded bg-gold-500/20 text-gold-400 text-[10px] font-mono leading-[14px]">ON</span>
          )}
        </button>

        <button
          onClick={() => setShowColumnSettings(!showColumnSettings)}
          className={`inline-flex items-center gap-1.5 rounded border px-2.5 py-1 text-xs font-medium transition-colors ${
            showColumnSettings
              ? 'border-gold-500/40 bg-gold-500/10 text-gold-400'
              : 'border-steel-700 text-steel-300 hover:border-gold-500/30 hover:text-gold-400'
          }`}
        >
          <Settings2 className="h-3 w-3" />列设置
        </button>

        <span className="text-[11px] font-mono text-steel-500 ml-auto tracking-wider">
          {sortedEquipment.length}<span className="text-steel-600">/</span>{equipment.length} ITEMS
        </span>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-end gap-3 p-3 rounded border border-steel-800 bg-steel-950/50">
          <div className="space-y-1">
            <Label className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">装备类型</Label>
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v ?? 'all')}>
              <SelectTrigger className="w-28 h-7 text-xs border-steel-700 bg-steel-900/70"><SelectValue /></SelectTrigger>
              <SelectContent className="border-steel-700 bg-steel-900">
                <SelectItem value="all">全部</SelectItem>
                {EQUIPMENT_TYPES.map(t => (
                  <SelectItem key={t} value={t}>{EquipmentTypeDisplay[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">套装</Label>
            <Select value={selectedSet} onValueChange={(v) => setSelectedSet(v ?? 'all')}>
              <SelectTrigger className="w-28 h-7 text-xs border-steel-700 bg-steel-900/70"><SelectValue /></SelectTrigger>
              <SelectContent className="border-steel-700 bg-steel-900">
                <SelectItem value="all">全部</SelectItem>
                {SET_TYPES.map(s => (
                  <SelectItem key={s} value={s}>{SetTypeDisplay[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">等级</Label>
            <Select value={selectedLevel} onValueChange={(v) => setSelectedLevel(v ?? 'all')}>
              <SelectTrigger className="w-28 h-7 text-xs border-steel-700 bg-steel-900/70"><SelectValue /></SelectTrigger>
              <SelectContent className="border-steel-700 bg-steel-900">
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="90">90</SelectItem>
                <SelectItem value="88">88</SelectItem>
                <SelectItem value="below80">80以下</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">潜能</Label>
            <Select value={selectedPotential} onValueChange={(v) => setSelectedPotential(v ?? 'all')}>
              <SelectTrigger className="w-36 h-7 text-xs border-steel-700 bg-steel-900/70"><SelectValue /></SelectTrigger>
              <SelectContent className="border-steel-700 bg-steel-900">
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="potential_gt_rule">潜能分 &gt; 规则分</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">副属性</Label>
            <Select value={selectedSubstat} onValueChange={(v) => setSelectedSubstat(v ?? 'all')}>
              <SelectTrigger className="w-28 h-7 text-xs border-steel-700 bg-steel-900/70"><SelectValue /></SelectTrigger>
              <SelectContent className="border-steel-700 bg-steel-900">
                <SelectItem value="all">全部</SelectItem>
                {Object.entries(StatTypeDisplay).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">最小值</Label>
            <Input type="number" value={minValue} onChange={e => setMinValue(e.target.value)} className="w-20 h-7 text-xs border-steel-700 bg-steel-900/70" placeholder="Min" />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-mono text-steel-500 uppercase tracking-wider">最大值</Label>
            <Input type="number" value={maxValue} onChange={e => setMaxValue(e.target.value)} className="w-20 h-7 text-xs border-steel-700 bg-steel-900/70" placeholder="Max" />
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-steel-400 hover:text-gold-400">
              <X className="h-3 w-3 mr-1" />清除
            </Button>
          )}
        </div>
      )}

      {showColumnSettings && (
        <div className="p-3 rounded border border-steel-800 bg-steel-950/50">
          <div className="flex gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => setColumns(prev => prev.map(c => ({ ...c, visible: true })))} className="h-6 text-[10px] font-mono text-steel-400 hover:text-gold-400">全选</Button>
            <Button variant="ghost" size="sm" onClick={() => setColumns(prev => prev.map(c => ({ ...c, visible: false })))} className="h-6 text-[10px] font-mono text-steel-400 hover:text-gold-400">全不选</Button>
          </div>
          <div className="grid grid-cols-4 gap-x-4 gap-y-1.5 sm:grid-cols-6 md:grid-cols-8">
            {columns.map(col => (
              <label key={col.key} className="flex items-center gap-1.5 text-[11px] text-steel-300 cursor-pointer hover:text-steel-100 transition-colors whitespace-nowrap">
                <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.key)} className="rounded border-steel-600 bg-steel-900 accent-gold-500" />
                {col.label}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="rounded border border-steel-800 overflow-auto max-h-[600px]">
        <Table>
          <TableHeader className="sticky top-0 z-10">
            <TableRow className="border-steel-800 hover:bg-transparent">
              {visibleColumns.map(col => (
                <TableHead
                  key={col.key}
                  className="cursor-pointer select-none whitespace-nowrap text-[10px] font-mono uppercase tracking-wider text-steel-400 bg-steel-950/80 hover:text-gold-400 transition-colors border-steel-800 h-8"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">{col.label}{renderSortIcon(col.key)}</div>
                </TableHead>
              ))}
              {onDelete && (
                <TableHead className="whitespace-nowrap text-[10px] font-mono uppercase tracking-wider text-steel-400 bg-steel-950/80 border-steel-800 h-8 w-8" />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEquipment.length === 0 ? (
              <TableRow className="border-steel-800">
                <TableCell colSpan={visibleColumns.length + (onDelete ? 1 : 0)} className="h-24 text-center text-steel-500 font-mono text-xs">
                  NO EQUIPMENT DATA
                </TableCell>
              </TableRow>
            ) : (
              sortedEquipment.map((eq, idx) => (
                <TableRow
                  key={eq.id || idx}
                  className={cn(
                    "border-steel-800/60 transition-colors",
                    onEquipmentSelect && "cursor-pointer hover:bg-gold-500/[0.03]",
                    idx % 2 === 0 ? "bg-transparent" : "bg-steel-950/20"
                  )}
                  onClick={() => onEquipmentSelect?.(eq)}
                >
                  {visibleColumns.map(col => (
                    <TableCell key={col.key} className="whitespace-nowrap py-1.5 text-steel-300 border-steel-800/60">
                      {renderCellValue(eq, col.key)}
                    </TableCell>
                  ))}
                  {onDelete && (
                    <TableCell className="whitespace-nowrap py-1.5 border-steel-800/60">
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(eq.id); }}
                        className="p-1 rounded text-steel-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="删除装备"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
