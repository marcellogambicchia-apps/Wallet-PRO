
window.OneSignalDeferred = window.OneSignalDeferred || [];
window.walletProOneSignalReady = new Promise(function(resolve, reject) {
  window.OneSignalDeferred.push(async function(OneSignal) {
    try {
      await OneSignal.init({
        appId: "c3c2efd9-1d3c-4806-aacc-8486e777c0c7",
        serviceWorkerPath: new URL("OneSignalSDKWorker.js", location.href).pathname,
        serviceWorkerParam: {scope: new URL("onesignal/", location.href).pathname},
        notifyButton: {enable: false},
        allowLocalhostAsSecureOrigin: false
      });
      resolve(OneSignal);
    } catch(err) { reject(err); }
  });
});
