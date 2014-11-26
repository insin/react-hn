'use strict';

require('setimmediate')

var React = require('react')
var Router = require('react-router')

var TopStore = require('./stores/TopStore')
var UpdatesStore = require('./stores/UpdatesStore')
var SettingsStore = require('./stores/SettingsStore')

var PermalinkedComment = require('./PermalinkedComment')
var Item = require('./Item')
var Settings = require('./Settings')
var TopStories = require('./TopStories')
var Updates = require('./Updates')
var UserProfile = require('./UserProfile')

var DefaultRoute = Router.DefaultRoute
var Link = Router.Link
var NotFoundRoute = Router.NotFoundRoute
var Route = Router.Route
var RouteHandler = Router.RouteHandler

var App = React.createClass({
  getInitialState: function() {
    return {
      showSettings: false
    }
  },

  componentWillMount: function() {
    SettingsStore.load()
    TopStore.loadSession()
    UpdatesStore.loadSession()
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },

  componentWillUnmount: function() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  },

  /**
   * Give stores a chance to persist data to sessionStorage in case this is a
   * refresh or an external link in the same tab.
   */
  handleBeforeUnload: function() {
    TopStore.stop()
    TopStore.saveSession()
    UpdatesStore.saveSession()
  },

  toggleSettings: function(e) {
    e.preventDefault()
    this.setState({showSettings: !this.state.showSettings})
  },

  render: function() {    return <div className="App">
      <div className="App__header">
        <img src="logo.png" width="16" height="16" alt="" />{' '}
        <Link to="news" className="App__homelink">React HN</Link>{' '}
        <Link to="newest">new</Link>{' | '}
        <Link to="newcomments">comments</Link>
        <a className="App__settings" tabIndex="0" onClick={this.toggleSettings} onKeyPress={this.toggleSettings}>
          {this.state.showSettings ? 'hide settings' : 'settings'}
        </a>
        {this.state.showSettings && <Settings key="settings"/>}
      </div>
      <div className="App__content">
        <RouteHandler {...this.props}/>
      </div>
      <div className="App__footer">
        react-hn v{process.env.VERSION} | <a href="https://github.com/insin/react-hn">insin/react-hn</a>
      </div>
    </div>
  }
})

var NotFound = React.createClass({
  render: function() {
    return <h2>Not found</h2>
  }
})

function updatesHandler(type) {
  return React.createClass({
    render: function() {
      return <Updates {...this.props} type={type}/>
    }
  })
}

var routes = <Route name="app" path="/" handler={App}>
  <DefaultRoute handler={TopStories}/>
  <NotFoundRoute handler={NotFound}/>
  <Route name="news" path="news" handler={TopStories}/>
  <Route name="item" path="item/:id" handler={Item}/>
  <Route name="job" path="job/:id" handler={Item}/>
  <Route name="poll" path="poll/:id" handler={Item}/>
  <Route name="story" path="story/:id" handler={Item}/>
  <Route name="comment" path="comment/:id" handler={PermalinkedComment}/>
  <Route name="newest" path="newest" handler={updatesHandler('links')}/>
  <Route name="newcomments" path="newcomments" handler={updatesHandler('comments')}/>
  <Route name="user" path="user/:id" handler={UserProfile}/>
</Route>

Router.run(routes, function (Handler, state) {
  React.render(<Handler params={state.params} query={state.query}/>, document.getElementById('app'))
})