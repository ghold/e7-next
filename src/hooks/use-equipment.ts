'use client';

import { useState, useEffect, useCallback } from 'react';
import { Equipment } from '@/constants';
import { parseEquipmentData, validateEquipmentData, getEquipmentStats } from '@/lib/equipment-parser';
import { EquipmentRule } from '@/types/rule-engine';
import {
  saveEquipmentToCache, loadEquipmentFromCache, clearEquipmentCache, getCacheInfo
} from '@/lib/cache';

export interface EquipmentStats {
  total: number;
  byType: Record<string, number>;
  bySet: Record<string, number>;
  byRank: Record<string, number>;
  enhancementLevels: { min: number; max: number; average: number };
}

export interface CacheInfo {
  hasCache: boolean;
  fileName?: string;
  timestamp?: number;
  count?: number;
}

export function useEquipment(rules: EquipmentRule[]) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [stats, setStats] = useState<EquipmentStats | null>(null);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({ hasCache: false });

  // Load from cache on mount
  useEffect(() => {
    const cached = loadEquipmentFromCache();
    if (cached) {
      setEquipment(cached.equipment);
      setFileName(cached.fileName);
      setStats(getEquipmentStats(cached.equipment) as EquipmentStats);
    }
    setCacheInfo(getCacheInfo());
    setIsLoadingFromCache(false);
  }, []);

  const handleFileLoaded = useCallback((content: string, name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const parsed = parseEquipmentData(content, rules);
      const validation = validateEquipmentData(parsed);

      if (!validation.isValid) {
        setError(validation.errors.join('\n'));
        setIsLoading(false);
        return;
      }

      setEquipment(parsed);
      setFileName(name);
      setStats(getEquipmentStats(parsed) as EquipmentStats);
      saveEquipmentToCache(parsed, name);
      setCacheInfo(getCacheInfo());
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析装备数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [rules]);

  const handleEquipmentUpdate = useCallback((updated: Equipment) => {
    setEquipment(prev => {
      const next = prev.map(eq => eq.id === updated.id ? updated : eq);
      saveEquipmentToCache(next, fileName);
      return next;
    });
    setSelectedEquipment(prev => prev?.id === updated.id ? updated : prev);
  }, [fileName]);

  const handleDeleteEquipment = useCallback((id: number) => {
    setEquipment(prev => {
      const next = prev.filter(eq => eq.id !== id);
      saveEquipmentToCache(next, fileName);
      return next;
    });
    setSelectedEquipment(prev => prev?.id === id ? null : prev);
  }, [fileName]);

  const handleClearCache = useCallback(() => {
    clearEquipmentCache();
    setEquipment([]);
    setFileName('');
    setStats(null);
    setCacheInfo({ hasCache: false });
    setSelectedEquipment(null);
  }, []);

  return {
    equipment,
    selectedEquipment,
    setSelectedEquipment,
    isLoading,
    isLoadingFromCache,
    error,
    fileName,
    stats,
    cacheInfo,
    handleFileLoaded,
    handleEquipmentUpdate,
    handleDeleteEquipment,
    handleClearCache
  };
}
