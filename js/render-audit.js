
import { esc, fmtNum, fmtDateThai } from './utils.js';

export function renderAuditPanel(els, payload) {
  if (!payload || !payload.item) {
    els.auditSelected.innerHTML = `<div class="empty-state">เลือก item จาก Adjust / Recent Adjust / Count Compliance เพื่อดู audit trail</div>`;
    els.auditSummary.innerHTML = '';
    els.auditEvents.innerHTML = `<div class="empty-state">ยังไม่ได้เลือกสินค้า</div>`;
    return;
  }

  const item = payload.item;
  const summary = payload.summary || {};
  els.auditSelected.innerHTML = `
    <div class="selected-top">
      <div>
        <div class="selected-name">${esc(item.displayName || item.itemName || '-')}</div>
        <div class="selected-meta">item key: ${esc(item.itemKey || '-')} • โซน ${esc(item.basisZone || '-')} • status ${esc(item.status || '-')}</div>
      </div>
    </div>
    <div class="selected-pills">
      <span class="mini-pill">stock ${fmtNum(item.currentStock)} ${esc(item.unit || '')}</span>
      <span class="mini-pill">last count ${esc(fmtDateThai(summary.lastCountAt))}</span>
    </div>
  `;

  els.auditSummary.innerHTML = `
    <div class="audit-box"><div class="value">${fmtNum(summary.currentStockEffective)}</div><div class="label">Effective stock</div></div>
    <div class="audit-box"><div class="value">${fmtNum(summary.countEvents)}</div><div class="label">Count events</div></div>
    <div class="audit-box"><div class="value">${fmtNum(summary.issueEvents)}</div><div class="label">Issue events</div></div>
    <div class="audit-box"><div class="value">${fmtNum(summary.receiveEvents + summary.adjustEvents)}</div><div class="label">Receive + Adjust events</div></div>
  `;

  els.auditEvents.innerHTML = (payload.events || []).length ? payload.events.map((event) => `
    <div class="audit-event">
      <div class="audit-top">
        <div>
          <div class="audit-title">${esc(event.display || event.eventType)}</div>
          <div class="audit-meta">${esc(fmtDateThai(event.timestamp))} • โดย ${esc(event.actor || '-')} • โซน ${esc(event.zone || '-')}</div>
          ${event.note ? `<div class="audit-meta">note: ${esc(event.note)}</div>` : ''}
          ${event.reasonCode ? `<div class="audit-meta">reason: ${esc(event.reasonCode)}</div>` : ''}
          ${event.adjustMode ? `<div class="audit-meta">mode: ${esc(event.adjustMode)} • ${fmtNum(event.beforeStock)} → ${fmtNum(event.afterStock)}</div>` : ''}
        </div>
        <div class="audit-pill ${event.eventType.toLowerCase()}">${esc(event.eventType)} • ${event.eventType === 'ISSUE' ? '-' : event.signedQty > 0 ? '+' : ''}${fmtNum(event.signedQty)} ${esc(event.unit || '')}</div>
      </div>
    </div>
  `).join('') : `<div class="empty-state">ไม่พบ movement history สำหรับ item นี้</div>`;
}
