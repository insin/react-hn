var path = require('path')
var express = require('express')
var webpack = require('webpack')
var config = require('./webpack.development.config')

var app = express()
var compiler = webpack(config)

app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}))

app.use(require('webpack-hot-middleware')(compiler))

app.use(express.static(path.join(__dirname, 'public')))

app.listen(3000, 'localhost', function(err) {
  if (err) {
    console.error(err.stack)
    process.exit(1)
  }
  console.log('Listening at http://localhost:3000')
})
