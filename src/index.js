require('setimmediate')

var createHashHistory = require('history/lib/createHashHistory')
var React = require('react')
var Router = require('react-router/lib/Router')
var {render} = require('react-dom')

var routes = require('./routes')

// Opt out of persistent state query key for for hash history
// See https://github.com/rackt/history/blob/master/docs/HashHistoryCaveats.md
var history = createHashHistory({queryKey: false})

render(<Router history={history} routes={routes}/>, document.getElementById('app'))
