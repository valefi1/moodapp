const CACHE_VERSION = 'moodsync-sw-v3';
const DEFAULT_URL = '/';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

function normalizePayload(event) {
  if (!event.data) {
    return { title: 'MoodSync', body: 'Máš nové upozornění.', url: DEFAULT_URL };
  }

  try {
    const parsed = event.data.json();
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {
      title: 'MoodSync',
      body: event.data.text() || 'Máš nové upozornění.',
      url: DEFAULT_URL,
    };
  }
}

self.addEventListener('push', (event) => {
  const data = normalizePayload(event);
  const title = data.title || 'MoodSync';
  const notificationUrl = data.url || DEFAULT_URL;

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || 'Máš nové upozornění.',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      tag: data.tag || `moodsync-${Date.now()}`,
      renotify: Boolean(data.tag),
      requireInteraction: false,
      timestamp: data.timestamp || Date.now(),
      data: {
        url: notificationUrl,
        cacheVersion: CACHE_VERSION,
      },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || DEFAULT_URL;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const normalizedUrl = new URL(url, self.location.origin).href;

      for (const client of clientsArr) {
        if (client.url === normalizedUrl && 'focus' in client) {
          return client.focus();
        }
      }

      return self.clients.openWindow(normalizedUrl);
    })
  );
});
