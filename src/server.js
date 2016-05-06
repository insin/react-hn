var express = require('express')
var React = require('react')
var renderToString = require('react-dom/server').renderToString
var ReactRouter = require('react-router')

require('babel/register')
var routes = require('./routes')

var app = express()
app.set('view engine', 'ejs')
app.set('views', process.cwd() + '/src/views')

app.use(express.static('public'))

app.get('*', function(req, res) {
  ReactRouter.match({
    routes: routes,
    location: req.url
  }, function(err, redirectLocation, props) {
    if (err) {
      res.status(500).send(err.message)
    }
    else if (redirectLocation) {
      res.redirect(302, redirectLocation.pathname + redirectLocation.search)
    }
    else if (props) {
      var markup = renderToString(
        React.createElement(ReactRouter.RouterContext, props, null)
      )
      res.render('index', { markup: markup })
    }
    else {
      res.sendStatus(404)
    }
  })
})

var port = process.env.PORT || 3003
app.listen(port, function(err) {
  if (err) {
    console.log(err)
    return
  }
  console.log('Listening on port ' + port)
})
