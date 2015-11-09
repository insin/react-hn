require('setimmediate')

var createHashHistory = require('history/lib/createHashHistory')
var React = require('react')
var Router = require('react-router/lib/Router')
var {render} = require('react-dom')
var useScroll = require('scroll-behavior/lib/useStandardScroll')

var routes = require('./routes')

var history = useScroll(createHashHistory)()

render(<Router history={history} routes={routes}/>, document.getElementById('app'))
