import {hashHistory} from 'react-router'

require('./style.css')

require('setimmediate')

var React = require('react')
var {render} = require('react-dom')
var Router = require('react-router/lib/Router')
var useScroll = require('react-router-scroll/lib/useScroll')
var applyRouterMiddleware = require('react-router/lib/applyRouterMiddleware')

var routes = require('./routes').default

render(
  <Router
    history={hashHistory}
    render={applyRouterMiddleware(useScroll())}
    routes={routes}
  />,
  document.getElementById('app')
)
