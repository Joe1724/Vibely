self.addEventListener('push', function(event) {
  const data = event.data.json();
  console.log('Push received:', data);

  const title = data.title || 'SocialApp Notification';
  const options = {
    body: data.body || 'You have a new notification.',
    icon: '/vite.svg', // Path to your app icon
    badge: '/vite.svg', // Path to your app badge icon
    data: {
      url: data.url || '/', // URL to open when notification is clicked
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});