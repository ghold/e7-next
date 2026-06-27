'use client';

import { Header } from '@/components/layout/header';
import { RuleTable } from '@/components/rules/rule-table';
import { useRules } from '@/hooks/use-rules';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText } from 'lucide-react';

export default function RulesPage() {
  const { rules, loading, error } = useRules();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-5">
        <div className="border border-steel-800 rounded bg-card/30 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-steel-800 bg-steel-950/30">
            <div className="w-1 h-3 bg-gold-500 rounded-full" />
            <span className="text-[11px] font-mono text-gold-400 uppercase tracking-wider font-medium">规则引擎</span>
          </div>
          <div className="p-4">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full bg-steel-800/50" />
                ))}
              </div>
            ) : error ? (
              <Alert variant="destructive" className="border-destructive/30">
                <AlertDescription className="font-mono text-xs">{error}</AlertDescription>
              </Alert>
            ) : (
              <RuleTable rules={rules} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
