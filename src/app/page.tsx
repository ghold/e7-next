'use client';

import { Header } from '@/components/layout/header';
import { FileImport } from '@/components/equipment/file-import';
import { EquipmentStats } from '@/components/equipment/equipment-stats';
import { EquipmentList } from '@/components/equipment/equipment-list';
import { EquipmentDetail } from '@/components/equipment/equipment-detail';
import { useRules } from '@/hooks/use-rules';
import { useEquipment } from '@/hooks/use-equipment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, Trash2, Terminal } from 'lucide-react';

export default function HomePage() {
  const { rules, loading: rulesLoading } = useRules();
  const {
    equipment, selectedEquipment, setSelectedEquipment,
    isLoading, isLoadingFromCache, error, fileName, stats, cacheInfo,
    handleFileLoaded, handleEquipmentUpdate, handleDeleteEquipment, handleClearCache
  } = useEquipment(rules);

  if (isLoadingFromCache || rulesLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="relative">
              <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
              <div className="absolute inset-0 rounded-full bg-gold-500/10 blur-xl animate-glow-pulse" />
            </div>
            <span className="text-xs font-mono text-steel-500 uppercase tracking-wider">初始化系统...</span>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-5 space-y-5">
        {equipment.length === 0 ? (
          <div className="max-w-xl mx-auto mt-8">
            {/* Terminal-style import zone */}
            <div className="border border-steel-800 rounded bg-card/50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-steel-800 bg-steel-950/50">
                <Terminal className="h-3.5 w-3.5 text-gold-500" />
                <span className="text-[11px] font-mono text-gold-400 uppercase tracking-wider">数据导入终端</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-steel-600" />
                  <div className="w-1.5 h-1.5 rounded-full bg-steel-600" />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                </div>
              </div>
              <div className="p-5">
                <FileImport onFileLoaded={handleFileLoaded} />
                {error && (
                  <Alert variant="destructive" className="mt-3 border-destructive/30">
                    <AlertDescription className="font-mono text-xs">{error}</AlertDescription>
                  </Alert>
                )}
                {cacheInfo.hasCache && (
                  <div className="mt-3 flex items-center gap-2 text-[11px] font-mono text-steel-500">
                    <Database className="h-3 w-3" />
                    <span>缓存数据：{cacheInfo.fileName}（{cacheInfo.count} 件装备）</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h1 className="text-sm font-mono font-semibold text-steel-100 uppercase tracking-wider">装备分析</h1>
                <Badge variant="outline" className="border-steel-700 text-steel-400 font-mono text-[10px]">
                  {fileName}
                </Badge>
                <span className="text-[11px] font-mono text-steel-500">
                  <span className="text-gold-400">{equipment.length}</span> 件装备
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileImport onFileLoaded={handleFileLoaded} compact />
                <Button variant="outline" size="sm" onClick={handleClearCache}
                  className="h-7 text-xs border-steel-700 text-steel-400 hover:text-red-400 hover:border-red-500/30 font-mono">
                  <Trash2 className="h-3 w-3 mr-1" />清除数据
                </Button>
              </div>
            </div>

            {isLoading && (
              <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-3">
                <div className="relative">
                  <Loader2 className="h-6 w-6 animate-spin text-gold-500" />
                  <div className="absolute inset-0 rounded-full bg-gold-500/10 blur-xl animate-glow-pulse" />
                </div>
                <span className="text-xs font-mono text-steel-400 uppercase tracking-wider">正在解析装备数据...</span>
                {/* Scan line */}
                <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent animate-scan" />
              </div>
            )}

            {stats && <EquipmentStats stats={stats} />}

            <div className="border border-steel-800 rounded bg-card/30 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-steel-800 bg-steel-950/30">
                <div className="w-1 h-3 bg-gold-500 rounded-full" />
                <span className="text-[11px] font-mono text-gold-400 uppercase tracking-wider font-medium">装备列表</span>
              </div>
              <div className="p-4">
                <EquipmentList
                  equipment={equipment}
                  onEquipmentSelect={setSelectedEquipment}
                  onDelete={handleDeleteEquipment}
                />
              </div>
            </div>
          </>
        )}
      </main>

      {selectedEquipment && (
        <EquipmentDetail
          equipment={selectedEquipment}
          open={!!selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
          onEquipmentUpdate={handleEquipmentUpdate}
        />
      )}

      <footer className="border-t border-steel-800/60 py-3 text-center">
        <span className="text-[10px] font-mono text-steel-600 tracking-wider uppercase">
          E7 GEAR ANALYSIS SYSTEM © {new Date().getFullYear()}
        </span>
      </footer>
    </div>
  );
}
