require('setimmediate')

var createHashHistory = require('history/lib/createHashHistory')
var React = require('react')
// var {render} = require('react-dom')
var Router = require('react-router/lib/Router')
var useRouterHistory = require('react-router/lib/useRouterHistory')
var withScroll = require('scroll-behavior/lib/withStandardScroll')

var routes = require('./routes')

var history = withScroll(useRouterHistory(createHashHistory)())

var Resolver = require('react-resolver').Resolver

Resolver.render(function() { return <Router history={history} routes={routes}/> }, document.getElementById('app'))

// Router.run(routes, Router.HistoryLocation, function(Handler) {
//   Resolver.render(function() { return <Router history={history} routes={routes}/> }, document.getElementById('app'))
// })
