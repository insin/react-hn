var IndexRoute = require('react-router/lib/IndexRoute')
var React = require('react')
var Route = require('react-router/lib/Route')
var Item = require('./Item')
// Polyfill require.ensure
if (typeof require.ensure !== 'function') require.ensure = function(d, c) { c(require) }

var App = require('./App')
var Stories = require('./Stories')
var Updates = require('./Updates')

function stories(route, type, limit, title) {
  return React.createClass({
    render() {
      return <Stories {...this.props} key={route} route={route} type={type} limit={limit} title={title}/>
    }
  })
}

function updates(type) {
  return React.createClass({
    render() {
      return <Updates {...this.props} key={type} type={type}/>
    }
  })
}

var Ask = stories('ask', 'askstories', 200, 'Ask')
var Comments = updates('comments')
var Jobs = stories('jobs', 'jobstories', 200, 'Jobs')
var New = stories('newest', 'newstories', 500, 'New Links')
var Show = stories('show', 'showstories', 200, 'Show')
var Top = stories('news', 'topstories', 500)

module.exports = <Route path="/" component={App}>
  <IndexRoute component={Top}/>
  <Route path="news" component={Top}/>
  <Route path="newest" component={New}/>
  <Route path="show" component={Show}/>
  <Route path="ask" component={Ask}/>
  <Route path="jobs" component={Jobs}/>
  <Route path="item/:id" component={Item}/>
  <Route path="job/:id" component={Item}/>
  <Route path="poll/:id" component={Item}/>
  <Route path="story/:id" component={Item}/>
  <Route
    path="comment/:id"
    getComponent={(location, callback) => {
      require.ensure([], require => {
        callback(null, require('./PermalinkedComment'))
      }, 'PermalinkedComment')
    }}
  />
  <Route path="newcomments" component={Comments}/>
  <Route
    path="user/:id"
    getComponent={(location, callback) => {
      require.ensure([], require => {
        callback(null, require('./UserProfile'))
      }, 'UserProfile')
    }}
  />
  <Route
    path="*"
    getComponent={(location, callback) => {
      require.ensure([], require => {
        callback(null, require('./NotFound'))
      }, 'NotFound')
    }}
  />
</Route>
