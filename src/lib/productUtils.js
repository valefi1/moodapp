export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getRecentDateKeys(days = 7, now = new Date()) {
  const safeDays = Math.max(0, Math.floor(Number(days) || 0));
  return new Set(Array.from({ length: safeDays }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - index);
    return getLocalDateKey(date);
  }));
}

export function normalizeSearchText(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function formatCurrency(value, currency = 'CZK', locale = 'cs-CZ') {
  const amount = Number(value);
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(Number.isFinite(amount) ? amount : 0);
}

export function getSafeErrorMessage(error, fallback = 'Akce se nepodařila. Zkus to prosím znovu.') {
  const message = typeof error?.message === 'string' ? error.message.trim() : '';
  if (!message || message.length > 240) return fallback;
  return message;
}

export function shouldRotatePushSubscription(storedVapidKey, currentVapidKey) {
  return Boolean(currentVapidKey) && storedVapidKey !== currentVapidKey;
}
