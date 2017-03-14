const swBuild = require('sw-build');

swBuild.generateFileManifest({
  dest: './dist/precache-manifest.js',
  rootDirectory: './dist/',
  globPatterns: ['dist/**'],
  globIgnores: ['service-worker.js'],
})
.then(() => {
  console.log('File manifest has been created.');
});