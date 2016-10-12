var express = require('express')
var React = require('react')
var renderToString = require('react-dom/server').renderToString
var ReactRouter = require('react-router')
var objectAssign = require('object-assign')
var HNServerFetch = require('./hn-server-fetch')

require('babel-register')
var routes = require('./src/routes')

var app = express()
app.set('view engine', 'ejs')
app.set('views', process.cwd() + '/dist/views')
app.set('port', (process.env.PORT || 5000))
app.use(express.static('dist'))


app.get(['/', '/news'], function(req, res) {
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
      HNServerFetch.fetchNews().then(function(stories) {
        objectAssign(props.params, { prebootHTML: stories })
        var markup = renderToString(React.createElement(ReactRouter.RouterContext, props, null))
        res.render('index', { markup: markup })
      })
    }
    else {
      res.sendStatus(404)
    }
  })
})

app.get('/news/story/:id', function (req, res, next) {
  var storyId = req.params.id
  ReactRouter.match({
    routes: routes,
    location: req.url
  }, function(err, redirectLocation, props) {
    if (storyId) {
      HNServerFetch.fetchItem(storyId).then(function(comments) {
          objectAssign(props.params, { prebootHTML: comments })
          var markup = renderToString(React.createElement(ReactRouter.RouterContext, props, null))
          res.render('index', { markup: markup })
      })
    }
  })  
});

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
      var markup = renderToString(React.createElement(ReactRouter.RouterContext, props, null))
      res.render('index', { markup: markup })        
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
