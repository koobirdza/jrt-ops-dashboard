export const APP_CONFIG = {
  api: {
    baseUrl: "https://script.google.com/macros/s/AKfycbzoRojPhxH5318Iz3Kch1xeRWZoQkI3vCf6F1NW3XjYgUSXnYwWUKfuaLI96GLsM2Hf/exec",
    timeoutMs: 12000
  },
  cacheKey: 'jrt_ops_dashboard_v452_cache',
  cacheAgeMs: 15 * 60 * 1000,
  auditLimit: 50
};

export const EMPTY_PAYLOAD = {
  ok: true,
  appVersion: '4.5.2-manual-incremental-rebuild',
  generatedAt: new Date().toISOString(),
  dataAsOf: '',
  meta: {
    latestSnapshotDate: '',
    latestActivityDate: '',
    warnings: ['ยังไม่มีข้อมูลจาก backend'],
    sourceWorkbook: ''
  },
  actionBoard: [],
  kpis: [],
  todayPolicy: { applied: false, weekday: '', ownerNames: [], stationsDue: 0, roomsDue: 0 },
  dailyTrends: [],
  zoneSummary: [],
  topOrder: [],
  watchlist: [],
  topIssue30d: [],
  topReceive30d: [],
  dataQuality: [],
  adjustCatalog: [],
  adjustReasons: [],
  recentAdjusts: [],
  countCompliance: {
    asOfDate: '',
    weekStart: '',
    weekEnd: '',
    daily: { expected: 0, counted: 0, missing: 0, compliancePct: 0 },
    weekly: { expected: 0, counted: 0, missing: 0, compliancePct: 0, weekStart: '', weekEnd: '' },
    departmentsDaily: [],
    departmentsWeekly: [],
    dailyStations: [],
    weeklyRooms: [],
    missingDailyItems: [],
    missingWeeklyItems: []
  }
};
