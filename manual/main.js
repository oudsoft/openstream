//main.js
  //https://pusher.com/tutorials/push-notifications-node-service-workers
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const publicVapidKey = 'BLR1KlwGuN0G6p9dGk7dAXXQyntqZzZO0LKcPsh2MNsd79DBcOAR4EDHuJdXHUC1rHhfSRtLXAIXO7N0OioNUjg';

  const triggerPush = document.querySelector('.trigger-push');

let rootname = window.location.pathname.split('/')[1];
  
  /*
	async function triggerPushNotification() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').then( async reg => {
			 console.log(`Registration:`, reg);
			 const subscription = await reg.pushManager.subscribe({
			  userVisibleOnly: true,
			  applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
			 });

			 await fetch('/basic/subscribe', {
			  method: 'POST',
			  body: JSON.stringify(subscription),
			  headers: {
				  'Content-Type': 'application/json',
			  },
			 });
		  }).catch(err => {
			 console.warn(`Registration:`, err);
		  });

    } else {
        console.error('Service workers are not supported in this browser');
    }
  }

DOMException: Failed to register a ServiceWorker for scope An SSL certificate error occurred when fetching the script.
https://deanhume.com/testing-service-workers-locally-with-self-signed-certificates/
  */
	
  triggerPush.addEventListener('click', () => {
    triggerPushNotification().catch(error => console.error(error));
  });

  var swreg = null;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('sw.js').then( async reg => {
        swreg = reg;
        console.log(`Registration:`, reg);
      });
    });
  } else {
    console.error('Service workers are not supported in this browser');
  }
    
  async function triggerPushNotification() {
    const subscription = await swreg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });
	let url = '/subscribe';
    await fetch(url, {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
