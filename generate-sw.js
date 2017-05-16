const workboxBuild = require('workbox-build');

workboxBuild.injectManifest({
  swSrc: 'public/service-worker.js',
  swDest: 'dist/service-worker.js',
  globDirectory: 'dist',
  staticFileGlobs: ['**/!(*map*)'],
  globIgnores: ['**/service-worker.js'],
}).then(() => {
  console.log('The production service worker has been generated.');
});
