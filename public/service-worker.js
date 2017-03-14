importScripts('sw-lib.v0.0.16.min.js');
importScripts('precache-manifest.js');

self.goog.swlib.cacheRevisionedAssets(self.__file_manifest);

// Runtime caching
self.goog.swlib.router.registerRoute(
  new RegExp('/(.*)'),
  self.goog.swlib.staleWhileRevalidate({
    cacheName: 'runtime-caching'
  })
);

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

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