// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase Hosting
// If you do not serve/host your project using Firebase Hosting see https://firebase.google.com/docs/web/setup
/* 
importScripts('/__/firebase/4.10.1/firebase-app.js');
importScripts('/__/firebase/4.10.1/firebase-messaging.js');
importScripts('/__/firebase/init.js');
*/

//  var messaging = firebase.messaging();

/**
 * Here is is the code snippet to initialize Firebase Messaging in the Service
 * Worker when your app is not hosted on Firebase Hosting.

 // [START initialize_firebase_in_sw]
 // Give the service worker access to Firebase Messaging.
 // Note that you can only use Firebase Messaging here, other Firebase libraries
 // are not available in the service worker.
 */

 importScripts('https://www.gstatic.com/firebasejs/4.10.1/firebase-app.js');
 importScripts('https://www.gstatic.com/firebasejs/4.10.1/firebase-messaging.js');

/*
 // Initialize the Firebase app in the service worker by passing in the
 // messagingSenderId.
 */

 firebase.initializeApp({
   'messagingSenderId': '312890797074'
 });

 // Retrieve an instance of Firebase Messaging so that it can handle background
 // messages.
 const messaging = firebase.messaging();
 // [END initialize_firebase_in_sw]
 


// If you would like to customize notifications that are received in the
// background (Web app is closed or not in browser focus) then you should
// implement this optional method.
// [START background_handler]
messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  // Customize notification here
  var notificationTitle = 'มีข้อความแจ้งเตือนจาก ' + payload.data.sendername;
  var notificationOptions = {
		body: payload.notification.title,
		//icon: 'resources/imgs/hotelOS.jpg',
		icon: payload.notification.icon
		//click_action: click_action
	};
	var n = new Notification(notificationTitle, notificationOptions);
	n.onclick = function (event) {
		event.preventDefault(); 
		//window.open(click_action);
		window.open(payload.notification.click_action , '_blank');
	};
	return self.registration.showNotification(notificationTitle,  notificationOptions);
});
// [END background_handler]