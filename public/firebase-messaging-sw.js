// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
const firebaseConfig = {
  projectId: "garena-gears",
  appId: "1:93335858315:web:9ef6be42c3b81a236ab88e",
  storageBucket: "garena-gears.firebasestorage.app",
  apiKey: "AIzaSyAowX6z6IDuosoxlfclYkgof5HXC27UEmA",
  authDomain: "garena-gears.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "93335858315"
};


firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  // console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.data.title;
  const notificationOptions = {
    body: payload.data.body,
    icon: '/img/garena.png',
    image: payload.data.image,
    data: {
      link: payload.data.link
    }
  };

  const notificationPromise = self.registration.showNotification(notificationTitle, notificationOptions);
  self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    if (event.notification.data && event.notification.data.link) {
      clients.openWindow(event.notification.data.link);
    }
  });

  // Use event.waitUntil to keep the service worker alive
  // until the notification is displayed.
  self.waitUntil(notificationPromise);
});
