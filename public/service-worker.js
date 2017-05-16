importScripts('https://unpkg.com/workbox-sw@0.0.2');

const workboxSW = new WorkboxSW({clientsClaim: true});

// This array will be populated by workboxBuild.injectManifest() when the
// production service worker is generated.
workboxSW.precache([]);

workboxSW.router.setDefaultHandler({
  handler: workboxSW.strategies.staleWhileRevalidate()
});
