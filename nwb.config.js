module.exports = {
  type: 'react-app',
  babel: {
    loose: 'all'
  },
  webpack: {
    plugins: {
      define: {
        __VERSION__: JSON.stringify(require('./package.json').version)
      }
    }
  }
}
