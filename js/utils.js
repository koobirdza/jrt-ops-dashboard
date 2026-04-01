
export const byId = (id) => document.getElementById(id);

export function esc(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function fmtNum(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return '-';
  if (Math.abs(num % 1) > 0.0001) return num.toLocaleString('th-TH', { maximumFractionDigits: 2 });
  return num.toLocaleString('th-TH');
}

export function fmtPct(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return '-';
  return `${num.toFixed(1)}%`;
}

export function fmtDateThai(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  const d = String(parsed.getDate()).padStart(2, '0');
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const y = String(parsed.getFullYear() + 543).slice(-2);
  const hh = String(parsed.getHours()).padStart(2, '0');
  const mm = String(parsed.getMinutes()).padStart(2, '0');
  if (hh === '00' && mm === '00') return `${d}/${m}/${y}`;
  return `${d}/${m}/${y} ${hh}:${mm}`;
}

export function normalizeText(value = '') {
  return String(value || '')
    .toLowerCase()
    .replace(/[•()\-_/]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function itemLabel(item = {}) {
  const parts = [];
  const name = String(item.itemName || item.item_name || '').trim();
  const brand = String(item.brand || '').trim();
  const unit = String(item.unit || '').trim();
  if (name) parts.push(name);
  if (brand && brand !== '-' && !normalizeText(name).includes(normalizeText(brand))) parts.push(brand);
  if (unit) parts.push(unit);
  return parts.join(' • ');
}

export function flagClass(value = '') {
  const key = String(value || '').toLowerCase();
  if (key.includes('low')) return 'low';
  if (key.includes('count')) return 'no_count';
  if (key.includes('order')) return 'order';
  if (key.includes('zero')) return 'zero';
  return 'adjusted';
}

export function debounce(fn, wait = 250) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
