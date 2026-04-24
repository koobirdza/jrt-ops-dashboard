import { APP_CONFIG } from './config.js';

export function buildUrl(action, params = {}) {
  const url = new URL(APP_CONFIG.api.baseUrl);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  });
  return url.toString();
}

export function jsonp(action, params = {}, timeoutMs = APP_CONFIG.api.timeoutMs) {
  return new Promise((resolve, reject) => {
    const callbackName = '__jrt_jsonp_' + Math.random().toString(36).slice(2);
    const script = document.createElement('script');
    const timer = setTimeout(() => cleanup(new Error('JSONP timeout')), timeoutMs);

    function cleanup(error, value) {
      clearTimeout(timer);
      script.remove();
      try { delete window[callbackName]; } catch (err) { window[callbackName] = undefined; }
      if (error) reject(error); else resolve(value);
    }

    window[callbackName] = (data) => cleanup(null, data);
    script.onerror = () => cleanup(new Error('JSONP request failed'));
    script.src = buildUrl(action, { ...params, callback: callbackName });
    document.body.appendChild(script);
  });
}

export const fetchDashboardSummary = () => jsonp('dashboardSummary');
export const fetchDashboardInventory = () => jsonp('dashboardInventory');
export const fetchDashboardActivity = () => jsonp('dashboardActivity');
export const fetchDashboardAdjustData = () => jsonp('dashboardAdjustData');
export const fetchDashboardCompliance = () => jsonp('dashboardCompliance');
export const fetchHealth = () => jsonp('health');

export const adminRefreshDashboard = (token) => jsonp('adminRefreshDashboard', { token }, 25000);
export const adminManualRebuild = (token, forceFull = '') => jsonp('adminManualRebuild', { token, forceFull }, 45000);
export const createAdjust = (params) => jsonp('createAdjust', params, 25000);
export const listRecentAdjusts = (params) => jsonp('listRecentAdjusts', params, 25000);
export const fetchItemAudit = (params) => jsonp('itemAuditTrail', params, 25000);
