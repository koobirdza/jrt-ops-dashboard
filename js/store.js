
import { APP_CONFIG } from './config.js';

export const state = {
  payload: null,
  source: 'pending',
  adjustCatalog: [],
  selectedAdjustItemKey: '',
  adjustFilter: '',
  recentAdjusts: [],
  recentAdjustFilters: { range: '30d', reasonCode: '', search: '' },
  auditItemKey: '',
  auditPayload: null
};

export function saveCachedPayload(payload) {
  try {
    localStorage.setItem(APP_CONFIG.cacheKey, JSON.stringify({ savedAt: Date.now(), payload }));
  } catch (error) {}
}

export function getCachedPayload() {
  try {
    const raw = localStorage.getItem(APP_CONFIG.cacheKey);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}
