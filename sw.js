self.addEventListener("install", function (e) {
   console.log("fcm sw install..");
   self.skipWaiting();
});

self.addEventListener("activate", function (e) {
   console.log("fcm sw activate..");
});


self.addEventListener("push", function (e) {

   console.log('push~!')

   if (!e.data.json()) return;

   const resultData = e.data.json().notification;
   const notificationTitle = resultData.title;
   const notificationOptions = {
      body: resultData.body,
      icon: resultData.image, // 웹 푸시 이미지는 icon
      tag: resultData.tag,
   };

   self.registration.showNotification(notificationTitle, notificationOptions);
});