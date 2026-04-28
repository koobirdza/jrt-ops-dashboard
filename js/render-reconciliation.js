import { esc, fmtNum, fmtDateThai } from './utils.js';

function statusClass(status) {
  const s = String(status || 'OK').toLowerCase();
  if (s === 'critical') return 'danger';
  if (s === 'flag') return 'warn';
  return 'ok';
}

export function renderReconciliation(els, reconciliation = {}) {
  const summary = reconciliation.summary || { total: 0, ok: 0, flag: 0, critical: 0, pending: 0 };
  const rows = reconciliation.rows || [];

  if (els.reconciliationSummary) {
    els.reconciliationSummary.innerHTML = `
      <div class="summary-tile mini"><div class="summary-value">${fmtNum(summary.total)}</div><div class="summary-label">Checked</div></div>
      <div class="summary-tile mini"><div class="summary-value">${fmtNum(summary.ok)}</div><div class="summary-label">OK</div></div>
      <div class="summary-tile mini warn"><div class="summary-value">${fmtNum(summary.flag)}</div><div class="summary-label">FLAG</div></div>
      <div class="summary-tile mini danger"><div class="summary-value">${fmtNum(summary.critical)}</div><div class="summary-label">CRITICAL</div></div>
      <div class="summary-tile mini"><div class="summary-value">${fmtNum(summary.pending)}</div><div class="summary-label">Pending</div></div>
    `;
  }

  if (!els.reconciliationList) return;
  if (!rows.length) {
    els.reconciliationList.innerHTML = '<div class="empty-state">ยังไม่มี reconciliation log — จะเริ่มมีข้อมูลหลังจาก submit count รอบถัดไป</div>';
    return;
  }

  els.reconciliationList.innerHTML = rows.map((row) => `
    <div class="row-card reconciliation-row ${statusClass(row.status)}">
      <div class="row-main">
        <div class="row-title">${esc(row.itemName || row.itemKey)}</div>
        <div class="row-sub">
          ${esc(fmtDateThai(row.timestamp || row.businessDate))} • โซน ${esc(row.stockZone || '-')} • นับโดย ${esc(row.countedBy || '-')}
        </div>
        <div class="row-sub">
          system ${fmtNum(row.systemStock)} → count ${fmtNum(row.countStock)} ${esc(row.unit || '')}
          • threshold ${fmtNum(row.thresholdQty)}
          ${row.diffPercent !== '' ? `• diff ${fmtNum(row.diffPercent)}%` : ''}
        </div>
      </div>
      <div class="row-side">
        <div class="audit-pill ${String(row.status || '').toLowerCase()}">${esc(row.status || 'OK')}</div>
        <div class="row-number ${Number(row.diffQty || 0) < 0 ? 'neg' : 'pos'}">${Number(row.diffQty || 0) > 0 ? '+' : ''}${fmtNum(row.diffQty)}</div>
        <div class="row-sub">${esc(row.reviewStatus || '-')}</div>
      </div>
    </div>
  `).join('');
}
