
import { esc, fmtNum, fmtPct, fmtDateThai, itemLabel } from './utils.js';
import { rowCardLeft } from './render-core.js';

function complianceRow(title, sub, pct, counted, expected, missing) {
  return `
    <div class="compliance-row">
      <div>
        <div class="compliance-title">${esc(title)}</div>
        <div class="compliance-sub">${sub}</div>
      </div>
      <div class="compliance-side">
        <span class="mini-pill">${fmtPct(pct)}</span>
        <span class="mini-pill">ครบ ${fmtNum(counted)} / ${fmtNum(expected)}</span>
        <span class="mini-pill">ค้าง ${fmtNum(missing)}</span>
      </div>
    </div>
  `;
}

export function renderCountCompliance(els, compliance = {}, onItemClick) {
  const daily = compliance.daily || { expected: 0, counted: 0, missing: 0, compliancePct: 0 };
  const weekly = compliance.weekly || { expected: 0, counted: 0, missing: 0, compliancePct: 0, weekStart: '', weekEnd: '' };

  const policyWeekday = esc(compliance.policyWeekday || '');
  const appliedText = compliance.policyApplied ? 'policy-driven' : 'fallback';

  els.dailySummaryTile.innerHTML = `
    <div class="label">Daily count by station</div>
    <div class="value">${fmtPct(daily.compliancePct)}</div>
    <div class="helper">ครบ ${fmtNum(daily.counted)} / ${fmtNum(daily.expected)} • ค้าง ${fmtNum(daily.missing)} • ${appliedText}</div>
  `;
  els.weeklySummaryTile.innerHTML = `
    <div class="label">Weekly count by stock room</div>
    <div class="value">${fmtPct(weekly.compliancePct)}</div>
    <div class="helper">ครบ ${fmtNum(weekly.counted)} / ${fmtNum(weekly.expected)} • ค้าง ${fmtNum(weekly.missing)} • ${esc(weekly.weekStart || '-')} ถึง ${esc(weekly.weekEnd || '-')} • due ${policyWeekday || '-'}</div>
  `;

  els.dailyDepartments.innerHTML = (compliance.dailyStations || []).map((row) => complianceRow(
    row.label || `${row.department} • ${row.zone}`,
    `daily station • owner ${esc(row.owner || '-')} • latest count ${esc(fmtDateThai(row.lastCountAt))}`,
    row.compliancePct, row.counted, row.expected, row.missing
  )).join('') || `<div class="empty-state">ยังไม่มี daily station policy</div>`;

  els.weeklyDepartments.innerHTML = (compliance.weeklyRooms || []).map((row) => complianceRow(
    row.label || `${row.department} • ${row.zone}`,
    `weekly stock room • owner ${esc(row.owner || '-')} • due ${esc(row.weekday || compliance.policyWeekday || '-')} • ${esc(row.weekStart || '-')} ถึง ${esc(row.weekEnd || '-')} • latest count ${esc(fmtDateThai(row.lastCountAt))}`,
    row.compliancePct, row.counted, row.expected, row.missing
  )).join('') || `<div class="empty-state">ยังไม่มี weekly stock room policy</div>`;

  els.missingDailyItems.innerHTML = (compliance.missingDailyItems || []).length ? (compliance.missingDailyItems || []).map((row) => rowCardLeft(
    esc(row.displayName || itemLabel(row)),
    `สเตชั่น: ${esc(row.zone || '-')}<br>แผนก: ${esc(row.department || '-')} • owner ${esc(row.owner || '-')}<br>latest count: ${esc(fmtDateThai(row.latestCountAt))}`,
    `<span class="metric-pill">daily</span>`,
    `<span class="flag no_count">MISSING</span>`,
    row.itemKey ? `data-item-key="${esc(row.itemKey)}"` : ''
  )).join('') : `<div class="empty-state">daily count เข้าครบตาม policy แล้ว</div>`;

  els.missingWeeklyItems.innerHTML = (compliance.missingWeeklyItems || []).length ? (compliance.missingWeeklyItems || []).map((row) => rowCardLeft(
    esc(row.displayName || itemLabel(row)),
    `ห้องสต๊อก: ${esc(row.zone || '-')}<br>แผนก: ${esc(row.department || '-')} • owner ${esc(row.owner || '-')}<br>latest count: ${esc(fmtDateThai(row.latestCountAt))} • due ${esc(row.weekday || compliance.policyWeekday || '-')} • week ${esc(row.weekStart || '-')} ถึง ${esc(row.weekEnd || '-')}`,
    `<span class="metric-pill">weekly</span>`,
    `<span class="flag no_count">MISSING</span>`,
    row.itemKey ? `data-item-key="${esc(row.itemKey)}"` : ''
  )).join('') : `<div class="empty-state">weekly count เข้าครบตาม policy แล้ว</div>`;

  [els.missingDailyItems, els.missingWeeklyItems].forEach((root) => {
    Array.from(root.querySelectorAll('[data-item-key]')).forEach((el) => {
      el.addEventListener('click', () => onItemClick?.(el.getAttribute('data-item-key')));
    });
  });
}
