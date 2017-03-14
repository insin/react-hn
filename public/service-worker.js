importScripts('sw-lib.v0.0.16.min.js');

/**
 * DO NOT EDIT THE FILE MANIFEST ENTRY
 *
 * The method cacheRevisionedAssets() does the following:
 * 1. Cache URLs in the manifest to a local cache.
 * 2. When a network request is made for any of these URLs the response
 *    will ALWAYS comes from the cache, NEVER the network.
 * 3. When the service worker changes ONLY assets with a revision change are
 *    updated, old cache entries are left as is.
 *
 * By changing the file manifest manually, your users may end up not receiving
 * new versions of files because the revision hasn't changed.
 *
 * Please use sw-build or some other tool / approach to generate the file
 * manifest which accounts for changes to local files and update the revision
 * accordingly.
 */
const fileManifest = [
  {
    "url": "/css/style.css",
    "revision": "e74e55d84f51b1d0e36bf1a4dec21772"
  },
  {
    "url": "/img/android-chrome-144x144.png",
    "revision": "31f44c8f8845e41196b389f2fdae392d"
  },
  {
    "url": "/img/android-chrome-192x192.png",
    "revision": "7c3470aa18f85e4454a35ef3ff8b8f6e"
  },
  {
    "url": "/img/android-chrome-36x36.png",
    "revision": "fc5a14316848badbd501e198f8607088"
  },
  {
    "url": "/img/android-chrome-48x48.png",
    "revision": "f8576bca4be18a4367e4847a09fc6945"
  },
  {
    "url": "/img/android-chrome-72x72.png",
    "revision": "6b26a8a135b07174d298489cc010083a"
  },
  {
    "url": "/img/android-chrome-96x96.png",
    "revision": "04cda150a70eb58221af3fdd4f7d4a6f"
  },
  {
    "url": "/img/apple-touch-icon-114x114.png",
    "revision": "e18affb685f0457672283a88c04084c9"
  },
  {
    "url": "/img/apple-touch-icon-120x120.png",
    "revision": "cd14469c7457cfc6d3aaf15d34faeddf"
  },
  {
    "url": "/img/apple-touch-icon-144x144.png",
    "revision": "95a8cb7d006c59252dd68ba73d31632a"
  },
  {
    "url": "/img/apple-touch-icon-152x152.png",
    "revision": "15dd03590ff7289c09cf10027597e699"
  },
  {
    "url": "/img/apple-touch-icon-180x180.png",
    "revision": "0b101591e8e263c6bff9133c7772194a"
  },
  {
    "url": "/img/apple-touch-icon-57x57.png",
    "revision": "628a477075d84a8d0996392aa6dec37c"
  },
  {
    "url": "/img/apple-touch-icon-60x60.png",
    "revision": "6b9fe001bc9e35320f9bb4eb28b1e6f1"
  },
  {
    "url": "/img/apple-touch-icon-72x72.png",
    "revision": "5830f2a4f9249b3bc3998481cc00825d"
  },
  {
    "url": "/img/apple-touch-icon-76x76.png",
    "revision": "812e9eb119b6bdd8f465a2d1118465b9"
  },
  {
    "url": "/img/apple-touch-icon-precomposed.png",
    "revision": "e45a9a06a4a9b850e3089c4e6e3ebc8d"
  },
  {
    "url": "/img/apple-touch-icon.png",
    "revision": "0b101591e8e263c6bff9133c7772194a"
  },
  {
    "url": "/img/browserconfig.xml",
    "revision": "f337354b6f80663075e7b32058c65149"
  },
  {
    "url": "/img/favicon-16x16.png",
    "revision": "9d784dc3f4da5477156423f5f106c1c6"
  },
  {
    "url": "/img/favicon-32x32.png",
    "revision": "21ea2cf9cd43cdc1f808cca76a1f6fa4"
  },
  {
    "url": "/img/favicon-96x96.png",
    "revision": "11e36fff4c95b572ffaeef9a848da568"
  },
  {
    "url": "/img/favicon.ico",
    "revision": "eaa33e22fc5dab05262d316b59160a45"
  },
  {
    "url": "/img/logo.png",
    "revision": "930a492dadf1ccb881bd91d424c8bf9e"
  },
  {
    "url": "/img/mstile-144x144.png",
    "revision": "3e9a3c273f9ac3b7a158132445534860"
  },
  {
    "url": "/img/mstile-150x150.png",
    "revision": "b0af3ec429e6828dc0606d8bb8e1421f"
  },
  {
    "url": "/img/mstile-310x150.png",
    "revision": "499b08d0d170e6ed89491d7e9691a8e8"
  },
  {
    "url": "/img/mstile-310x310.png",
    "revision": "625111493ee72a39db1420c9c235dfb3"
  },
  {
    "url": "/img/mstile-70x70.png",
    "revision": "4cdf64d2b55d8116c4ce8dd361a95772"
  },
  {
    "url": "/img/safari-pinned-tab.svg",
    "revision": "9bfe87bb482c5d6facab0d0084ce1e80"
  },
  {
    "url": "/img/splashscreen-icon-384x384.png",
    "revision": "e3080842f30a9137e1464f01ffb97e71"
  },
  {
    "url": "/index-static.html",
    "revision": "894331a8b8a9845d2cce2fac1d265466"
  },
  {
    "url": "/manifest.json",
    "revision": "88a82e030fa45aee1ea68a4f0a3811bb"
  },
  {
    "url": "/runtime-caching.js",
    "revision": "87003e567d298b1b58cf2f57b4fb0ee2"
  }
];

self.goog.swlib.cacheRevisionedAssets(fileManifest);

// Runtime caching
self.goog.swlib.router.registerRoute(
  new RegExp('/(.*)'),
  self.goog.swlib.staleWhileRevalidate({
    cacheName: 'runtime-caching'
  })
);

// Servers with Google resources needed
// self.goog.swlib.router.registerRoute(
//   new RegExp('^https://googleapis.com'),
//   self.goog.swlib.staleWhileRevalidate({
//     cacheName: 'google-apis'
//   })
// );

// self.goog.swlib.router.registerRoute(
//   new RegExp('^https://gstatic.com'),
//   self.goog.swlib.staleWhileRevalidate({
//     cacheName: 'g-static'
//   })
// );

// self.goog.swlib.router.registerRoute(
//   new RegExp('^https://firebaseio.com'),
//   self.goog.swlib.staleWhileRevalidate({
//     cacheName: 'firebase-io'
//   })
// );

// self.goog.swlib.router.registerRoute(
//   new RegExp('^https://appspot.com'),
//   self.goog.swlib.staleWhileRevalidate({
//     cacheName: 'app-spot'
//   })
// );

// Hacker News data sources
// Including fallbacks (third-party mirrors)

// self.goog.swlib.router.registerRoute(
//   new RegExp('^https://hacker-news.firebaseio.com'),
//   self.goog.swlib.staleWhileRevalidate({
//     cacheName: 'hacker-news'
//   })
// );

// self.goog.swlib.router.registerRoute(
//   new RegExp('^https://s-usc1c-nss-136.firebaseio.com'),
//   self.goog.swlib.staleWhileRevalidate({
//     cacheName: 'hacker-news'
//   })
// );

// self.goog.swlib.router.registerRoute(
//   new RegExp('^https://node-hnapi.herokuapp.com'),
//   self.goog.swlib.staleWhileRevalidate({
//     cacheName: 'node-hnapi'
//   })
// );

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
