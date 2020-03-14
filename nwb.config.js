module.exports = {
  type: 'react-app',
  webpack: {
    define: {
      __VERSION__: JSON.stringify(require('./package.json').version)
    },
    // Path-independent build which doesn't have to be served at /
    publicPath: ''
  }
}
