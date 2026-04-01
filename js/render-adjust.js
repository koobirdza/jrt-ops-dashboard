
import { esc, fmtNum, fmtDateThai, normalizeText, itemLabel } from './utils.js';
import { rowCardLeft } from './render-core.js';

export function renderAdjustReasons(els, reasons = []) {
  const current = els.adjustReason.value;
  const currentFilter = els.adjustReasonFilter.value;
  els.adjustReason.innerHTML = reasons.map((reason) => `<option value="${esc(reason.code)}">${esc(reason.label)}</option>`).join('');
  els.adjustReasonFilter.innerHTML = `<option value="">ทุกเหตุผล</option>` + reasons.map((reason) => `<option value="${esc(reason.code)}">${esc(reason.label)}</option>`).join('');
  if (current && Array.from(els.adjustReason.options).some((opt) => opt.value === current)) els.adjustReason.value = current;
  if (currentFilter && Array.from(els.adjustReasonFilter.options).some((opt) => opt.value === currentFilter)) els.adjustReasonFilter.value = currentFilter;
}

export function findAdjustItem(state, itemKey) {
  return state.adjustCatalog.find((item) => item.itemKey === itemKey) || null;
}

export function renderAdjustModule(state, els, payload) {
  state.adjustCatalog = Array.isArray(payload.adjustCatalog) ? payload.adjustCatalog : [];
  state.recentAdjusts = Array.isArray(payload.recentAdjusts) ? payload.recentAdjusts : [];
  renderAdjustReasons(els, payload.adjustReasons || []);
  if (!state.selectedAdjustItemKey && state.adjustCatalog.length) state.selectedAdjustItemKey = state.adjustCatalog[0].itemKey;
  if (state.selectedAdjustItemKey && !findAdjustItem(state, state.selectedAdjustItemKey)) {
    state.selectedAdjustItemKey = state.adjustCatalog[0]?.itemKey || '';
  }
  els.adjustModeBadge.textContent = `admin write • ${fmtNum(state.recentAdjusts.length)} recent shown`;
  renderAdjustPicker(state, els);
  renderAdjustSelected(state, els);
}

export function renderAdjustPicker(state, els) {
  const term = normalizeText(state.adjustFilter);
  const filtered = state.adjustCatalog.filter((item) => {
    if (!term) return true;
    const hay = normalizeText([item.displayName, item.itemKey, item.brand, item.basisZone, item.countDepartment].join(' '));
    return hay.includes(term);
  }).slice(0, 40);

  els.adjustPicker.innerHTML = filtered.length ? filtered.map((item) => `
    <button class="picker-item ${item.itemKey === state.selectedAdjustItemKey ? 'active' : ''}" type="button" data-item-key="${esc(item.itemKey)}">
      <div class="picker-name">${esc(item.displayName || itemLabel(item))}</div>
      <div class="picker-meta">โซน ${esc(item.basisZone || '-')} • stock ${fmtNum(item.currentStock)} ${esc(item.unit || '')} • ${esc(item.status || '-')} • ${esc(item.countFrequency || '-')}</div>
    </button>
  `).join('') : `<div class="empty-state">ไม่พบรายการที่ตรงกับคำค้น</div>`;
}

export function bindAdjustPicker(state, els, onSelect) {
  Array.from(els.adjustPicker.querySelectorAll('[data-item-key]')).forEach((btn) => {
    btn.addEventListener('click', () => onSelect(btn.getAttribute('data-item-key')));
  });
}

export function renderAdjustSelected(state, els) {
  const item = findAdjustItem(state, state.selectedAdjustItemKey);
  const mode = els.adjustMode.value || 'delta';
  const qty = Number(els.adjustQty.value || 0);
  const qtyValid = els.adjustQty.value !== '' && Number.isFinite(qty);
  const currentStock = Number(item?.currentStock || 0);
  const projected = mode === 'absolute' ? qty : currentStock + qty;
  const invalidProjected = qtyValid && projected < 0;
  const needsCountText = item?.needsCountReview ? 'ยังไม่เคยนับ' : 'มี count แล้ว';
  const reasonCode = els.adjustReason.value;
  const note = els.adjustNote.value.trim();
  const noteRequired = ['DAMAGE_WASTE', 'MISSING_SHRINKAGE', 'ADMIN_RECONCILE', 'OTHER'].includes(reasonCode);

  els.adjustQtyLabel.textContent = mode === 'absolute' ? 'ตั้งยอดใหม่' : 'จำนวนปรับ (+/-)';

  if (!item) {
    els.adjustSelected.innerHTML = `<div class="empty-state">เลือกสินค้าจากรายการด้านบนก่อน</div>`;
    els.adjustPreview.innerHTML = `<div class="preview-label">Preview</div><div class="preview-value">-</div><div class="preview-sub">ยังไม่ได้เลือกสินค้า</div>`;
    els.adjustInlineStatus.textContent = 'ยังไม่ได้เลือกสินค้า';
    els.adjustSubmitBtn.disabled = true;
    return;
  }

  els.adjustSelected.innerHTML = `
    <div class="selected-top">
      <div>
        <div class="selected-name">${esc(item.displayName || itemLabel(item))}</div>
        <div class="selected-meta">item key: ${esc(item.itemKey)} • โซน ${esc(item.basisZone || '-')} • ${esc(item.countDepartment || '-')} / ${esc(item.countFrequency || '-')}</div>
      </div>
    </div>
    <div class="selected-pills">
      <span class="mini-pill">stock ${fmtNum(currentStock)} ${esc(item.unit || '')}</span>
      <span class="mini-pill">${esc(item.status || '-')}</span>
      <span class="mini-pill">${esc(needsCountText)}</span>
      ${item.adjusted ? `<span class="mini-pill">adjust ล่าสุด ${esc(fmtDateThai(item.lastAdjustAt))}</span>` : ''}
    </div>
  `;

  let previewTitle = mode === 'absolute' ? 'หลังตั้งยอดใหม่' : 'หลัง apply delta';
  let previewValue = qtyValid ? fmtNum(projected) : '-';
  let previewSub = mode === 'absolute'
    ? `current ${fmtNum(currentStock)} → target ${qtyValid ? fmtNum(qty) : '-'}`
    : `current ${fmtNum(currentStock)}${qtyValid ? ` + delta ${fmtNum(qty)}` : ' + delta -'}`;

  if (invalidProjected) {
    previewTitle = 'ไม่สามารถบันทึก';
    previewValue = fmtNum(projected);
    previewSub = 'stock หลังปรับจะติดลบ ซึ่งระบบไม่อนุญาต';
  }

  if (noteRequired && note.length < 5) {
    previewSub += ' • reason นี้ต้องมี note อย่างน้อย 5 ตัวอักษร';
  }

  els.adjustPreview.innerHTML = `
    <div class="preview-label">${esc(previewTitle)}</div>
    <div class="preview-value">${previewValue}</div>
    <div class="preview-sub">${esc(previewSub)}</div>
  `;

  const actorReady = !!els.adjustEmployee.value.trim();
  const reasonReady = !!reasonCode;
  const noteReady = !noteRequired || note.length >= 5;
  const canSubmit = !!item && qtyValid && actorReady && reasonReady && noteReady && !invalidProjected && (mode === 'absolute' ? qty >= 0 : qty !== 0);
  els.adjustSubmitBtn.disabled = !canSubmit;
  els.adjustInlineStatus.textContent = canSubmit
    ? `พร้อมบันทึก • ${mode === 'absolute' ? 'set' : 'delta'}`
    : noteRequired && note.length < 5
      ? 'เหตุผลนี้ต้องใส่ note อย่างน้อย 5 ตัวอักษร'
      : 'กรอกผู้ทำรายการ / จำนวน / เหตุผล ให้ครบ';
}

export function renderRecentAdjusts(els, rows = [], onItemClick) {
  els.recentAdjusts.innerHTML = rows.length ? rows.map((row) => rowCardLeft(
    esc(itemLabel(row)),
    `เหตุผล: ${esc(row.reasonCode || '-')}<br>โซน: ${esc(row.basisZone || '-')} • โดย ${esc(row.actor || '-')} • ${esc(fmtDateThai(row.timestamp))}` + (row.note ? `<div class="recent-adjust-note">${esc(row.note)}</div>` : ''),
    `<span class="metric-pill">${esc(row.adjustMode === 'absolute' ? 'set' : 'delta')} ${fmtNum(row.qty)}</span><span class="metric-pill">${fmtNum(row.beforeStock)} → ${fmtNum(row.afterStock)}</span>`,
    `<span class="flag adjusted">ADJUSTED</span>`,
    row.itemKey ? `data-item-key="${esc(row.itemKey)}"` : ''
  )).join('') : `<div class="empty-state">ยังไม่มี adjust log ตาม filter นี้</div>`;

  Array.from(els.recentAdjusts.querySelectorAll('[data-item-key]')).forEach((el) => {
    el.addEventListener('click', () => onItemClick?.(el.getAttribute('data-item-key')));
  });
}
