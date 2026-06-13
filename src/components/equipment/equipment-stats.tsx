'use client';

import { EquipmentType, EquipmentTypeDisplay } from '@/constants';
import { cn } from '@/lib/utils';
import { Swords, Shield, Shirt, Footprints, Gem, CircleDot } from 'lucide-react';

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  weapon: Swords,
  helm: Shield,
  armor: Shirt,
  boot: Footprints,
  neck: Gem,
  ring: CircleDot,
};

interface EquipmentStatsProps {
  stats: {
    total: number;
    byType: Record<string, number>;
    bySet: Record<string, number>;
    enhancementLevels: { min: number; max: number; average: number };
  };
}

export function EquipmentStats({ stats }: EquipmentStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {Object.entries(EquipmentTypeDisplay).map(([type, label]) => {
        const Icon = typeIcons[type] || Swords;
        const count = stats.byType[type] || 0;
        return (
          <div
            key={type}
            className={cn(
              "group relative border border-steel-800 rounded bg-card/50 p-3",
              "transition-all duration-300 hover:border-gold-500/30 hover:bg-card/80"
            )}
          >
            {/* HUD corners */}
            <div className="absolute -top-px -left-px w-1.5 h-1.5 border-t border-l border-gold-500/30 transition-colors group-hover:border-gold-500/60" />
            <div className="absolute -top-px -right-px w-1.5 h-1.5 border-t border-r border-gold-500/30 transition-colors group-hover:border-gold-500/60" />
            <div className="absolute -bottom-px -left-px w-1.5 h-1.5 border-b border-l border-gold-500/30 transition-colors group-hover:border-gold-500/60" />
            <div className="absolute -bottom-px -right-px w-1.5 h-1.5 border-b border-r border-gold-500/30 transition-colors group-hover:border-gold-500/60" />

            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded border border-steel-700 bg-steel-900/50 group-hover:border-gold-500/20 transition-colors">
                <Icon className="h-3.5 w-3.5 text-steel-400 group-hover:text-gold-400 transition-colors" />
              </div>
              <div>
                <p className="text-xl font-mono font-bold text-steel-100 data-text leading-none">
                  {count}
                </p>
                <p className="text-[10px] font-mono text-steel-500 uppercase tracking-wider mt-0.5">
                  {label}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
