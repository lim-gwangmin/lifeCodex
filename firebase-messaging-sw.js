importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js");

const firebaseConfig = {
   apiKey: process.env.FIREBASE_API_KEY,
   authDomain: process.env.FIREBASE_AUTH_DOMAIN,
   projectId: process.env.FIREBASE_PROJECT_ID,
   storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
   messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
   appId: process.env.FIREBASE_APP_ID,
   measurementId: process.env.FIREBASE_MEASUREMENT_ID
};
// const firebaseConfig = {
// apiKey: "AIzaSyBtvbqA28mbqZYZqINF6KUOhcrJfa3INUU",
//   authDomain: "codex-project-b4939.firebaseapp.com",
//   projectId: "codex-project-b4939",
//   storageBucket: "codex-project-b4939.appspot.com",
//   messagingSenderId: "558480223114",
//   appId: "1:558480223114:web:05d36364cbf0f8284c3673",
//   measurementId: "G-X1PJ1T37DE"
// };
const app = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onMessage((payload) => {
   console.log('Message received. ', payload);
});

messaging.onBackgroundMessage((payload) => {
   console.log('onBackgroundMessage received. ', payload);
});