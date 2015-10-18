var path = require('path')

var webpack = require('webpack')

process.env.NODE_ENV = 'production'

function failBuildOnCompilationErrors() {
  this.plugin('done', function(stats) {
    if (stats.compilation.errors && stats.compilation.errors.length > 0) {
      console.error('webpack build failed:')
      stats.compilation.errors.forEach(function(error) {
        console.error(error.message)
      })
      process.exit(1)
    }
  })
}

module.exports = {
  devtool: 'source-map',
  entry: {
    app: './src/index.js',
    vendor: [
      'setimmediate',
      'events',
      'history',
      'react',
      'react-dom',
      'react-router',
      'react-timeago',
      'firebase',
      'reactfire'
    ]
  },
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'app.js',
    publicPath: '/'
  },
  plugins: [
    failBuildOnCompilationErrors,
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      '__VERSION__': JSON.stringify(require('./package.json').version)
    }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.CommonsChunkPlugin('vendor', 'vendor.js'),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        screw_ie8: true,
        warnings: false
      }
    })
  ],
  module: {
    loaders: [
      {test: /\.js$/, loader: 'babel', exclude: /node_modules/}
    ]
  }
}
