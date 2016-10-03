module.exports = {
  type: 'react-app',
  babel: {
    loose: 'all',
    stage: false,
    presets: ['es2015', 'stage-0', 'react']
  },
  webpack: {
    loaders: {
      babel: {
        babelrc: true,
        cacheDirectory: true
      }
    },
    plugins: {
      define: {
        __VERSION__: JSON.stringify(require('./package.json').version)
      }
    }    
  }
}