require('setimmediate')

var createHashHistory = require('history/lib/createHashHistory')
var React = require('react')
var {render} = require('react-dom')
var {Router, useRouterHistory} = require('react-router')
var useScroll = require('scroll-behavior/lib/useStandardScroll')

var routes = require('./routes')

var history = useRouterHistory(useScroll(createHashHistory))()

render(<Router history={history} routes={routes}/>, document.getElementById('app'))
