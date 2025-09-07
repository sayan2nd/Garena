// DO NOT EDIT
// This file is a copy of a file that is downloaded from the web.
// The original can be found at https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-sw.js

importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js'
);
importScripts(
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js'
);

const firebaseConfig = {
  apiKey: 'AIzaSyAowX6z6IDuosoxlfclYkgof5HXC27UEmA',
  authDomain: 'garena-gears.firebaseapp.com',
  projectId: 'garena-gears',
  storageBucket: 'garena-gears.firebasestorage.app',
  messagingSenderId: '93335858315',
  appId: '1:93335858315:web:9ef6be42c3b81a236ab88e',
  measurementId: 'G-MEASUREMENT_ID',
};

const app = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// This is the listener for background push notifications.
messaging.onBackgroundMessage(function (payload) {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );

  // Instead of a 'notification' payload, we now expect a 'data' payload.
  // This gives us full control over displaying the notification.
  const notificationData = payload.data;
  if (!notificationData) {
      console.error("No data payload received in background message.");
      return;
  }

  const notificationTitle = notificationData.title;
  const notificationOptions = {
    body: notificationData.body,
    icon: '/img/garena.png', // Default icon
    image: notificationData.image, // Optional image
    data: { // Add data to be retrieved when notification is clicked
        url: notificationData.link || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


// Handle notification click event
self.addEventListener('notificationclick', function(event) {
  event.notification.close(); // Close the notification

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(windowClients) {
      // Check if there is already a window/tab open with the target URL
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
