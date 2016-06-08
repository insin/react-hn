module.exports = {
  type: 'react-app',
  babel: {
    loose: 'all'
  },
  webpack: {
    define: {
      __VERSION__: JSON.stringify(require('./package.json').version)
    },
    vendorBundle: false
  }
}
