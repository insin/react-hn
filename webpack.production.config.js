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
    app: path.resolve(__dirname, 'src', 'app.jsx'),
    vendor: [
      'setimmediate',
      'events',
      'react',
      'react-router',
      'react-timeago',
      'firebase',
      'reactfire'
    ]
  },
  resolve: {
    extensions: ['', '.jsx', '.js']
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
      {test: /\.jsx?$/, loader: 'babel', exclude: /node_modules/}
    ]
  }
}
