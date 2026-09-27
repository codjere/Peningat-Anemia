// public/sw.js
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Menangani pesan dari App.jsx untuk memunculkan notifikasi
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TRIGGER_NOTIFICATION') {
    const { title, body } = event.data;

    self.registration.showNotification(title || '🌸 Waktunya Minum TTD!', {
      body: body || 'Yuk jaga kadar hemoglobin dan cegah anemia hari ini!',
      icon: '/vite.svg',
      badge: '/vite.svg',
      vibrate: [200, 100, 200, 100, 300],
      tag: 'ttd-reminder',
      renotify: true,
      requireInteraction: true,
      actions: [
        { action: 'drink-action', title: '✅ Sudah Minum' },
        { action: 'snooze-action', title: '⏳ Tunda 10 Menit' }
      ]
    });
  }
});

// Menangani klik pada tombol aksi di notifikasi
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'drink-action') {
    // Kirim sinyal balik ke App.jsx untuk menambah angka konsistensi
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'CONFIRM_DRINK' });
      });
    });
  } else if (event.action === 'snooze-action') {
    // Tunda notifikasi 10 menit
    setTimeout(() => {
      self.registration.showNotification('⏰ Pengingat TTD (Tundaan)', {
        body: '10 menit sudah lewat, yuk sempatkan minum TTD sekarang!',
        icon: '/vite.svg'
      });
    }, 10 * 60 * 1000);
  } else {
    // Fokus kembali ke tab website jika kartu notifikasi diklik
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          if (client.url && 'focus' in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow('/');
      })
    );
  }
});

// Event push untuk persiapan backend Web Push (jika digunakan nanti)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: '🌸 Pengingat TTD', body: event.data.text() };
    }
  }
  self.registration.showNotification(data.title || '🌸 Pengingat TTD', {
    body: data.body || 'Waktunya minum Tablet Tambah Darah!',
    icon: '/vite.svg'
  });
});