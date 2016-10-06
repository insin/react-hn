var HtmlWebpackPlugin = require('html-webpack-plugin')
// var ChunkManifestPlugin = require('chunk-manifest-webpack-plugin')

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
    },
    extra: {
      plugins: [
        new HtmlWebpackPlugin({
          filename: 'views/index.ejs',
          template: 'src/views/index.ejs',
          markup: '<%- markup %>'
        }),
        new HtmlWebpackPlugin({
          filename: 'index.html',
          template: 'public/index-static.html',
          markup: '<%- markup %>'
        })
      ]
    }    
  }
}