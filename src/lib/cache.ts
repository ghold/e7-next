import { Equipment } from '@/constants';

const CACHE_KEY = 'e7_equipment_data';
const CACHE_VERSION_KEY = 'e7_equipment_cache_version';
const CURRENT_VERSION = '1.0';

export interface CachedEquipmentData {
  equipment: Equipment[];
  fileName: string;
  timestamp: number;
  version: string;
}

export function saveEquipmentToCache(equipment: Equipment[], fileName: string): void {
  try {
    const cacheData: CachedEquipmentData = {
      equipment, fileName, timestamp: Date.now(), version: CURRENT_VERSION
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
  } catch (error) {
    console.error('保存装备数据到缓存失败:', error);
  }
}

export function loadEquipmentFromCache(): CachedEquipmentData | null {
  try {
    const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    const cachedData = localStorage.getItem(CACHE_KEY);

    if (!cachedData || !cachedVersion) return null;

    if (cachedVersion !== CURRENT_VERSION) {
      clearEquipmentCache();
      return null;
    }

    const parsedData: CachedEquipmentData = JSON.parse(cachedData);

    if (!parsedData.equipment || !Array.isArray(parsedData.equipment)) {
      clearEquipmentCache();
      return null;
    }

    return parsedData;
  } catch (error) {
    clearEquipmentCache();
    return null;
  }
}

export function clearEquipmentCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_VERSION_KEY);
  } catch (error) {
    console.error('清除装备数据缓存失败:', error);
  }
}

export function hasCachedEquipment(): boolean {
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedVersion = localStorage.getItem(CACHE_VERSION_KEY);
    return !!(cachedData && cachedVersion === CURRENT_VERSION);
  } catch {
    return false;
  }
}

export function getCacheInfo(): { hasCache: boolean; fileName?: string; timestamp?: number; count?: number } {
  try {
    const cachedData = loadEquipmentFromCache();
    if (cachedData) {
      return {
        hasCache: true,
        fileName: cachedData.fileName,
        timestamp: cachedData.timestamp,
        count: cachedData.equipment.length
      };
    }
    return { hasCache: false };
  } catch {
    return { hasCache: false };
  }
}
