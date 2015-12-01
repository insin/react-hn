module.exports = {
  type: 'react-app',
  babel: {
    loose: 'all'
  },
  define: {
    __VERSION__: JSON.stringify(require('./package.json').version)
  }
}
