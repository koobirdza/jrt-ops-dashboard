import { APP_CONFIG, EMPTY_PAYLOAD } from './config.js';
import { state, saveCachedPayload, getCachedPayload } from './store.js';
import { byId, debounce } from './utils.js';
import {
  fetchDashboardSummary,
  fetchDashboardInventory,
  fetchDashboardActivity,
  fetchDashboardAdjustData,
  fetchDashboardCompliance,
  fetchHealth,
  adminRefreshDashboard,
  createAdjust,
  listRecentAdjusts,
  fetchItemAudit
} from './api.js';
import {
  setStatus,
  setSource,
  renderWarnings,
  renderActionBoard,
  renderKpis,
  buildSvgTrend,
  renderZones,
  renderWatchlist,
  renderTopOrder,
  renderActivity,
  renderDataQuality
} from './render-core.js';
import {
  renderAdjustModule,
  renderAdjustPicker,
  bindAdjustPicker,
  renderAdjustSelected,
  renderRecentAdjusts,
  findAdjustItem
} from './render-adjust.js';
import { renderCountCompliance } from './render-compliance.js';
import { renderAuditPanel } from './render-audit.js';

const els = {};
const ids = [
  'refreshBtn','reloadBtn','statusPill','sourcePill','snapshotPill','activityPill','warningBanner',
  'actionBoard','kpiGrid','trendChart','zoneSummary','watchlist','topOrder','topIssue','topReceive','dataQuality',
  'adjustModeBadge','adjustFilter','adjustPicker','adjustSelected','adjustEmployee','adjustMode','adjustQty','adjustReason','adjustNote','adjustPreview','adjustSubmitBtn','adjustInlineStatus','adjustQtyLabel',
  'adjustRangeFilter','adjustReasonFilter','adjustSearchFilter','adjustFilterBtn','recentAdjusts',
  'dailySummaryTile','weeklySummaryTile','dailyDepartments','weeklyDepartments','missingDailyItems','missingWeeklyItems',
  'auditSelected','auditSummary','auditEvents'
];

function initEls() {
  ids.forEach((id) => { els[id] = byId(id); });
}

function ensureBasePayload() {
  if (!state.payload) state.payload = JSON.parse(JSON.stringify(EMPTY_PAYLOAD));
  return state.payload;
}

function mergePayload(partial = {}) {
  const base = ensureBasePayload();
  state.payload = { ...base, ...partial, meta: { ...(base.meta || {}), ...(partial.meta || {}) } };
  return state.payload;
}

function renderAll(source = state.source || 'pending') {
  const payload = ensureBasePayload();
  state.source = source;
  setSource(els, source);
  renderWarnings(els, payload.meta?.warnings || []);
  els.snapshotPill.textContent = `snapshot: ${payload.meta?.latestSnapshotDate || '-'}`;
  els.activityPill.textContent = `activity: ${payload.meta?.latestActivityDate || '-'}`;
  renderActionBoard(els, payload.actionBoard || []);
  renderKpis(els, payload.kpis || []);
  els.trendChart.innerHTML = buildSvgTrend(payload.dailyTrends || []);
  renderZones(els, payload.zoneSummary || []);
  renderWatchlist(els, payload.watchlist || [], openAuditForItem);
  renderTopOrder(els, payload.topOrder || [], openAuditForItem);
  renderActivity(els.topIssue, payload.topIssue30d || [], openAuditForItem);
  renderActivity(els.topReceive, payload.topReceive30d || [], openAuditForItem);
  renderDataQuality(els, payload.dataQuality || []);
  renderAdjustModule(state, els, payload);
  bindAdjustPicker(state, els, selectAdjustItem);
  renderRecentAdjusts(els, state.recentAdjusts, handleAuditSelection);
  renderCountCompliance(els, payload.countCompliance || {}, handleAuditSelection);
  renderAuditPanel(els, state.auditPayload);

  if (!state.auditItemKey && state.selectedAdjustItemKey) {
    openAuditForItem(state.selectedAdjustItemKey, { silent: true });
  }
}

function saveSnapshot() {
  try { saveCachedPayload(state.payload); } catch (error) {}
}

function applySummaryPayload(payload) {
  mergePayload(payload);
  renderAll(state.source || 'live');
  saveSnapshot();
}

function applyInventoryPayload(payload) {
  mergePayload({
    zoneSummary: payload.zoneSummary || [],
    watchlist: payload.watchlist || [],
    topOrder: payload.topOrder || [],
    dataQuality: payload.dataQuality || []
  });
  renderAll(state.source || 'live');
  saveSnapshot();
}

function applyActivityPayload(payload) {
  mergePayload({
    dailyTrends: payload.dailyTrends || [],
    topIssue30d: payload.topIssue30d || [],
    topReceive30d: payload.topReceive30d || []
  });
  renderAll(state.source || 'live');
  saveSnapshot();
}

function applyAdjustPayload(payload) {
  mergePayload({
    adjustCatalog: payload.adjustCatalog || [],
    adjustReasons: payload.adjustReasons || [],
    recentAdjusts: payload.recentAdjusts || []
  });
  state.recentAdjusts = Array.isArray(payload.recentAdjusts) ? payload.recentAdjusts : [];
  renderAll(state.source || 'live');
  saveSnapshot();
}

function applyCompliancePayload(payload) {
  mergePayload({ countCompliance: payload.countCompliance || EMPTY_PAYLOAD.countCompliance });
  renderAll(state.source || 'live');
  saveSnapshot();
}

function getAdminTokenForWrite() {
  const existing = sessionStorage.getItem('JRT_OPS_ADMIN_TOKEN');
  if (existing) return existing;
  const prompted = window.prompt('กรอก JRT OPS ADMIN TOKEN');
  if (!prompted) return '';
  sessionStorage.setItem('JRT_OPS_ADMIN_TOKEN', prompted);
  return prompted;
}

async function loadModule(label, fetcher, applier, options = {}) {
  try {
    const payload = await fetcher();
    if (!payload || payload.ok === false) throw new Error(payload?.error || `${label} failed`);
    applier(payload);
    return { ok: true, cached: payload.cached === true };
  } catch (error) {
    if (!options.silent) setStatus(els, `โหลด ${label} ไม่สำเร็จ: ${error.message}`, 'warn');
    return { ok: false, error };
  }
}

async function loadDashboard(options = {}) {
  const cached = getCachedPayload();
  if (cached?.payload && !options.forceLive) {
    state.payload = cached.payload;
    state.source = (Date.now() - cached.savedAt) <= APP_CONFIG.cacheAgeMs ? 'stale' : 'fallback';
    renderAll(state.source);
    setStatus(els, 'แสดง cache ระหว่างโหลด live...', 'warn');
  } else {
    state.payload = JSON.parse(JSON.stringify(EMPTY_PAYLOAD));
    state.source = 'pending';
    renderAll('pending');
    setStatus(els, 'กำลังโหลด live data...', 'info');
  }

  await loadModule('health', fetchHealth, () => {}, { silent: true });
  const summary = await loadModule('summary', fetchDashboardSummary, (payload) => {
    state.source = 'live';
    applySummaryPayload(payload);
  }, { silent: true });

  if (!summary.ok) {
    if (cached?.payload) {
      state.source = 'stale';
      renderAll('stale');
      setStatus(els, 'โหลด summary ไม่สำเร็จ • ใช้ cache ล่าสุดแทน', 'warn');
      return;
    }
    state.payload = JSON.parse(JSON.stringify(EMPTY_PAYLOAD));
    renderAll('fallback');
    setStatus(els, `โหลด backend ไม่สำเร็จ • ${summary.error.message}`, 'warn');
    return;
  }

  const results = await Promise.all([
    loadModule('inventory', fetchDashboardInventory, applyInventoryPayload, { silent: true }),
    loadModule('activity', fetchDashboardActivity, applyActivityPayload, { silent: true }),
    loadModule('adjust', fetchDashboardAdjustData, applyAdjustPayload, { silent: true }),
    loadModule('compliance', fetchDashboardCompliance, applyCompliancePayload, { silent: true })
  ]);

  const failed = results.filter((row) => !row.ok).length;
  if (failed) {
    setStatus(els, `โหลด live สำเร็จบางส่วน • module fail ${failed} จุด`, 'warn');
  } else {
    setStatus(els, `live พร้อมใช้ • อัปเดต ${state.payload.generatedAt || state.payload.meta?.latestSnapshotDate || '-'}`, 'ok');
  }

  if (state.recentAdjustFilters.range) loadRecentAdjusts().catch(() => {});
}

async function adminRefresh() {
  const token = getAdminTokenForWrite();
  if (!token) return;
  setStatus(els, 'กำลัง rebuild module caches...', 'info');
  els.refreshBtn.disabled = true;
  try {
    const result = await adminRefreshDashboard(token);
    if (!result || result.ok === false) throw new Error(result?.error || 'refresh failed');
    await loadDashboard({ forceLive: true });
    setStatus(els, 'refresh สำเร็จ • module caches ถูก rebuild แล้ว', 'ok');
  } catch (error) {
    setStatus(els, `refresh ไม่สำเร็จ: ${error.message}`, 'danger');
  } finally {
    els.refreshBtn.disabled = false;
  }
}

function selectAdjustItem(itemKey) {
  state.selectedAdjustItemKey = itemKey;
  renderAdjustPicker(state, els);
  bindAdjustPicker(state, els, selectAdjustItem);
  renderAdjustSelected(state, els);
  openAuditForItem(itemKey, { silent: true });
}

async function submitAdjust() {
  const item = findAdjustItem(state, state.selectedAdjustItemKey);
  if (!item) return;
  const actor = els.adjustEmployee.value.trim();
  const adjustMode = els.adjustMode.value || 'delta';
  const qty = Number(els.adjustQty.value || 0);
  const reasonCode = els.adjustReason.value;
  const note = els.adjustNote.value.trim();
  if (!actor || !reasonCode || !Number.isFinite(qty) || (adjustMode === 'delta' && qty === 0) || (adjustMode === 'absolute' && qty < 0)) {
    renderAdjustSelected(state, els);
    return;
  }
  const token = getAdminTokenForWrite();
  if (!token) return;
  els.adjustSubmitBtn.disabled = true;
  setStatus(els, 'กำลังบันทึก adjust...', 'info');
  try {
    const result = await createAdjust({
      token,
      itemKey: item.itemKey,
      adjustMode,
      qty: String(qty),
      reasonCode,
      note,
      actor
    });
    if (!result || result.ok === false) throw new Error(result?.error || 'createAdjust failed');
    els.adjustQty.value = '';
    els.adjustNote.value = '';
    await loadDashboard({ forceLive: true });
    await loadRecentAdjusts();
    await openAuditForItem(item.itemKey, { silent: true });
    setStatus(els, `adjust สำเร็จ • ${item.displayName || item.itemName}`, 'ok');
  } catch (error) {
    setStatus(els, `adjust ไม่สำเร็จ: ${error.message}`, 'danger');
  } finally {
    renderAdjustSelected(state, els);
  }
}

async function loadRecentAdjusts() {
  const filters = {
    range: els.adjustRangeFilter.value || state.recentAdjustFilters.range || '30d',
    reasonCode: els.adjustReasonFilter.value || '',
    search: els.adjustSearchFilter.value.trim() || '',
    limit: 80
  };
  state.recentAdjustFilters = filters;
  try {
    const result = await listRecentAdjusts(filters);
    if (!result || result.ok === false) throw new Error(result?.error || 'listRecentAdjusts failed');
    state.recentAdjusts = Array.isArray(result.items) ? result.items : [];
    renderRecentAdjusts(els, state.recentAdjusts, handleAuditSelection);
  } catch (error) {
    setStatus(els, `โหลด recent adjust ไม่สำเร็จ: ${error.message}`, 'warn');
  }
}

async function openAuditForItem(itemKey, options = {}) {
  if (!itemKey) return;
  state.auditItemKey = itemKey;
  if (!options.silent) setStatus(els, 'กำลังโหลด item audit trail...', 'info');
  try {
    const payload = await fetchItemAudit({ itemKey, limit: APP_CONFIG.auditLimit });
    if (!payload || payload.ok === false) throw new Error(payload?.error || 'itemAuditTrail failed');
    state.auditPayload = payload;
    renderAuditPanel(els, payload);
    if (!options.silent) setStatus(els, `พร้อมดู audit trail • ${payload.item?.displayName || payload.item?.itemName || itemKey}`, 'ok');
  } catch (error) {
    if (!options.silent) setStatus(els, `โหลด audit ไม่สำเร็จ: ${error.message}`, 'warn');
  }
}

function handleAuditSelection(itemKey) {
  if (!itemKey) return;
  if (state.adjustCatalog.some((row) => row.itemKey === itemKey)) {
    state.selectedAdjustItemKey = itemKey;
    renderAdjustPicker(state, els);
    bindAdjustPicker(state, els, selectAdjustItem);
    renderAdjustSelected(state, els);
  }
  openAuditForItem(itemKey);
}

function bindEvents() {
  els.reloadBtn.addEventListener('click', () => loadDashboard({ forceLive: true }));
  els.refreshBtn.addEventListener('click', adminRefresh);
  els.adjustSubmitBtn.addEventListener('click', submitAdjust);

  els.adjustFilter.addEventListener('input', debounce((event) => {
    state.adjustFilter = event.target.value || '';
    renderAdjustPicker(state, els);
    bindAdjustPicker(state, els, selectAdjustItem);
  }, 120));

  ['adjustMode', 'adjustQty', 'adjustReason', 'adjustNote', 'adjustEmployee'].forEach((id) => {
    els[id].addEventListener('input', () => renderAdjustSelected(state, els));
    els[id].addEventListener('change', () => renderAdjustSelected(state, els));
  });

  els.adjustFilterBtn.addEventListener('click', loadRecentAdjusts);
  els.adjustRangeFilter.addEventListener('change', loadRecentAdjusts);
  els.adjustReasonFilter.addEventListener('change', loadRecentAdjusts);
  els.adjustSearchFilter.addEventListener('input', debounce(loadRecentAdjusts, 250));
}

function boot() {
  initEls();
  bindEvents();
  renderAll('pending');
  loadDashboard();
}

window.addEventListener('DOMContentLoaded', boot);
