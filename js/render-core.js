
import { esc, fmtNum, fmtDateThai, flagClass } from './utils.js';

export function setStatus(els, text, tone = 'info') {
  els.statusPill.textContent = text;
  els.statusPill.className = `pill ${tone}`;
}

export function setSource(els, source) {
  els.sourcePill.textContent = `source: ${source}`;
  els.sourcePill.className = `pill ${source === 'live' ? 'ok' : source === 'stale' ? 'warn' : 'info'}`;
}

export function renderWarnings(els, warnings = []) {
  if (!warnings.length) {
    els.warningBanner.classList.add('hide');
    els.warningBanner.textContent = '';
    return;
  }
  els.warningBanner.classList.remove('hide');
  els.warningBanner.textContent = warnings.join(' • ');
}

export function renderActionBoard(els, rows = []) {
  const toneClass = { order: 'order', issue: 'issue', warn: 'warn', receive: 'receive', count: 'count' };
  els.actionBoard.innerHTML = rows.map((row) => `
    <article class="action-card ${toneClass[row.tone] || ''}">
      <div class="value">${fmtNum(row.value)}</div>
      <div class="title">${esc(row.title)}</div>
      <div class="helper">${esc(row.helper || '')}</div>
    </article>
  `).join('');
}

export function renderKpis(els, rows = []) {
  els.kpiGrid.innerHTML = rows.map((row) => `
    <article class="kpi-card">
      <div class="kpi-value">${typeof row.unit === 'string' && row.unit === '%' ? fmtNum(row.value) + '%' : fmtNum(row.value)}</div>
      <div class="kpi-label">${esc(row.label)}</div>
      <div class="kpi-note">${esc(row.note || '')}</div>
    </article>
  `).join('');
}

export function buildSvgTrend(data = []) {
  if (!data.length) return '<div class="empty-state">ยังไม่มี trend data</div>';
  const w = 760, h = 250, padL = 34, padR = 14, padT = 12, padB = 28;
  const maxY = Math.max(1, ...data.flatMap((r) => [Number(r.countEvents || 0), Number(r.issueEvents || 0), Number(r.receiveEvents || 0)]));
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const x = (i) => padL + (data.length <= 1 ? innerW / 2 : innerW * (i / (data.length - 1)));
  const y = (v) => padT + innerH - (v / maxY) * innerH;
  const pathFor = (field) => data.map((r, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(Number(r[field] || 0)).toFixed(1)}`).join(' ');
  const grid = [0, .25, .5, .75, 1].map((p) => {
    const yy = padT + innerH - innerH * p;
    const value = Math.round(maxY * p);
    return `<g><line x1="${padL}" y1="${yy}" x2="${w - padR}" y2="${yy}" stroke="#e7eef6"/><text x="2" y="${yy + 4}" fill="#71839a" font-size="11">${value}</text></g>`;
  }).join('');
  const labels = data.map((r, i) => {
    if (i !== 0 && i !== data.length - 1 && i % 3 !== 0) return '';
    return `<text x="${x(i)}" y="${h - 8}" text-anchor="middle" fill="#71839a" font-size="10">${fmtDateThai(r.date)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="250" aria-label="trend chart">
    ${grid}
    <path d="${pathFor('countEvents')}" fill="none" stroke="var(--count)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${pathFor('issueEvents')}" fill="none" stroke="var(--issue)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${pathFor('receiveEvents')}" fill="none" stroke="var(--receive)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    ${labels}
  </svg>`;
}

export function rowCardLeft(title, sub, sidePills, flags, attrs = '') {
  return `
    <article class="row-card ${attrs ? 'click-row' : ''}" ${attrs}>
      <div class="row-top">
        <div>
          <div class="row-title">${title}</div>
          <div class="row-sub">${sub}</div>
          ${flags ? `<div class="flag-row">${flags}</div>` : ''}
        </div>
        <div class="row-side">${sidePills}</div>
      </div>
    </article>`;
}

export function renderZones(els, rows = []) {
  const max = Math.max(1, ...rows.map((r) => Number(r.lowItems || 0) + Number(r.noCountItems || 0) + Number(r.itemCount || 0) / 10));
  els.zoneSummary.innerHTML = rows.slice(0, 8).map((row) => {
    const score = Number(row.lowItems || 0) + Number(row.noCountItems || 0) + Number(row.itemCount || 0) / 10;
    const width = Math.max(10, Math.round((score / max) * 100));
    return `
      <article class="zone-card">
        <div class="zone-top">
          <div class="zone-name">${esc(row.zone)}</div>
          <div class="zone-meta">
            <span class="mini-pill">items ${fmtNum(row.itemCount)}</span>
            <span class="mini-pill">LOW ${fmtNum(row.lowItems)}</span>
            <span class="mini-pill">สั่ง ${fmtNum(row.suggestedOrderTotal)}</span>
          </div>
        </div>
        <div class="zone-track"><div class="zone-fill" style="width:${width}%"></div></div>
        <div class="section-note">no count ${fmtNum(row.noCountItems)} • adjusted ${fmtNum(row.adjustedItems || 0)} • stock รวม ${fmtNum(row.currentStockTotal)}</div>
      </article>`;
  }).join('');
}

export function renderWatchlist(els, rows = [], onItemClick) {
  els.watchlist.innerHTML = rows.slice(0, 10).map((row) => rowCardLeft(
    esc(row.itemName),
    `แบรนด์: ${esc(row.brand || '-')}<br>โซน: ${esc(row.basisZone || '-')} • stock: ${fmtNum(row.currentStock)} ${esc(row.unit || '')}`,
    `<span class="metric-pill">สั่ง ${fmtNum(row.suggestedOrderQty)}</span>`,
    (row.flags || []).map((flag) => `<span class="flag ${flagClass(flag)}">${esc(flag)}</span>`).join(''),
    row.itemKey ? `data-item-key="${esc(row.itemKey)}"` : ''
  )).join('');
  bindItemClicks(els.watchlist, onItemClick);
}

export function renderTopOrder(els, rows = [], onItemClick) {
  els.topOrder.innerHTML = rows.slice(0, 10).map((row) => rowCardLeft(
    esc(row.itemName),
    `แบรนด์: ${esc(row.brand || '-')}<br>basis: ${esc(row.basisZone || '-')} • stock ปัจจุบัน ${fmtNum(row.currentStock)} ${esc(row.unit || '')}`,
    `<span class="metric-pill">ควรสั่ง ${fmtNum(row.suggestedOrderQty)}</span><span class="metric-pill">par ${fmtNum(row.targetPar)}</span>`,
    '',
    row.itemKey ? `data-item-key="${esc(row.itemKey)}"` : ''
  )).join('');
  bindItemClicks(els.topOrder, onItemClick);
}

export function renderActivity(target, rows = [], onItemClick) {
  target.innerHTML = rows.slice(0, 10).map((row) => rowCardLeft(
    esc(row.itemName),
    `แบรนด์: ${esc(row.brand || '-')}<br>โซน: ${esc(row.zone || '-')} • events ${fmtNum(row.eventCount)}`,
    `<span class="metric-pill">รวม ${fmtNum(row.totalQty)} ${esc(row.unit || '')}</span>`,
    '',
    row.itemKey ? `data-item-key="${esc(row.itemKey)}"` : ''
  )).join('');
  bindItemClicks(target, onItemClick);
}

export function renderDataQuality(els, rows = []) {
  els.dataQuality.innerHTML = rows.map((row) => `
    <div class="health-row">
      <div>
        <div class="health-title">${esc(row.check)}</div>
        <div class="health-note">${esc(row.note || '')}</div>
      </div>
      <div class="pill ${row.status === 'ok' ? 'ok' : row.status === 'warn' ? 'warn' : 'info'}">${esc(row.status)} • ${fmtNum(row.value)}</div>
    </div>
  `).join('');
}

function bindItemClicks(root, onItemClick) {
  if (!onItemClick) return;
  Array.from(root.querySelectorAll('[data-item-key]')).forEach((el) => {
    el.addEventListener('click', () => onItemClick(el.getAttribute('data-item-key')));
  });
}
