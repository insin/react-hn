var express = require('express')
var React = require('react')
var renderToString = require('react-dom/server').renderToString
var ReactRouter = require('react-router')
var Resolver = require('react-resolver').Resolver
var RouterContext = React.createFactory(ReactRouter.RouterContext)

require('babel/register')
var routes = require('./src/routes')

var app = express()
app.set('view engine', 'ejs')
app.set('views', process.cwd() + '/src/views')
app.set('port', (process.env.PORT || 5000))
app.use(express.static('public'))

app.get('*', function(req, res) {
  ReactRouter.match({
    routes: routes,
    location: req.url
  }, function(err, redirectLocation, renderProps) {
    if (err) {
      res.status(500).send(err.message)
    }
    else if (redirectLocation) {
      res.redirect(302, redirectLocation.pathname + redirectLocation.search)
    }
    else if (renderProps) {
      // https://github.com/allenkim67/isomorphic-demo/blob/2be59306196e84f66041dc7a03bbd0c805d371aa/server.js
      Resolver
        .resolve(function() {return RouterContext(renderProps)})
        .then(function(resolverRes) {
          console.log(resolverRes.data)
          var markup = renderToString(
            React.createElement(resolverRes.Resolved, renderProps, null)
          )
          res.render('index', { 
            markup: markup,
            scriptTag: '<script>window.__REACT_RESOLVER_PAYLOAD__ = ' + JSON.stringify(resolverRes.data) + '</script>'
          })
      })
    }
    else {
      res.sendStatus(404)
    }
  })
})

app.listen(app.get('port'), function(err) {
  if (err) {
    console.log(err)
    return
  }
  console.log('Running app at localhost:' + app.get('port'))
})
