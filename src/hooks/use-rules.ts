'use client';

import { useState, useEffect, useCallback } from 'react';
import { EquipmentRule } from '@/types/rule-engine';
import { parseCSVToRules } from '@/lib/rule-engine';

let cachedRules: EquipmentRule[] | null = null;
let fetchPromise: Promise<EquipmentRule[]> | null = null;

export function useRules() {
  const [rules, setRules] = useState<EquipmentRule[]>(cachedRules || []);
  const [loading, setLoading] = useState(!cachedRules);
  const [error, setError] = useState<string | null>(null);

  const loadRules = useCallback(async () => {
    if (cachedRules) {
      setRules(cachedRules);
      setLoading(false);
      return;
    }

    // Deduplicate concurrent fetches
    if (!fetchPromise) {
      fetchPromise = fetch('/api/rules')
        .then(res => {
          if (!res.ok) throw new Error('Failed to load rules');
          return res.text();
        })
        .then(csv => {
          const parsed = parseCSVToRules(csv);
          cachedRules = parsed;
          return parsed;
        })
        .catch(err => {
          fetchPromise = null;
          throw err;
        });
    }

    try {
      setLoading(true);
      const parsed = await fetchPromise;
      setRules(parsed);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  return { rules, loading, error, reload: loadRules };
}
