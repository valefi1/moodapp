self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {
      title: 'MoodSync',
      body: event.data ? event.data.text() : 'Máš nové upozornění.',
      url: '/',
    };
  }

  const title = data.title || 'MoodSync';

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || 'Máš nové upozornění.',
      icon: data.icon || '/icon-192.png',
      badge: data.badge || '/icon-192.png',
      tag: data.tag || 'moodsync',
      renotify: true,
      data: {
        url: data.url || '/',
      },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

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
