/** @jsx React.DOM */

'use strict';

require('setimmediate')

var React = require('react')
var Router = require('react-router')

var TopStore = require('./stores/TopStore')
var UpdatesStore = require('./stores/UpdatesStore')

var Comment = require('./Comment')
var Item = require('./Item')
var TopStories = require('./TopStories')
var Updates = require('./Updates')
var UserProfile = require('./UserProfile')

var DefaultRoute = Router.DefaultRoute
var Link = Router.Link
var NotFoundRoute = Router.NotFoundRoute
var Route = Router.Route
var Routes = Router.Routes

var App = React.createClass({
  componentWillMount: function() {
    window.addEventListener('beforeunload', this.handleBeforeUnload)
    TopStore.loadSession()
    UpdatesStore.loadSession()
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

  render: function() {
    return <div className="App">
      <div className="App__header">
        <img src="logo.png" width="16" height="16" alt="" />{' '}
        <Link to="news" className="App__homelink">React Hacker News</Link>{' '}
        <Link to="newest">new</Link>{' | '}
        <Link to="newcomments">comments</Link>
      </div>
      <div className="App__content">
        <this.props.activeRouteHandler/>
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

var routes = <Routes location="hash">
  <Route name="app" path="/" handler={App}>
    <DefaultRoute handler={TopStories}/>
    <NotFoundRoute handler={NotFound}/>
    <Route name="news" path="news" handler={TopStories}/>
    <Route name="item" path="item/:id" handler={Item}/>
    <Route name="job" path="job/:id" handler={Item}/>
    <Route name="poll" path="poll/:id" handler={Item}/>
    <Route name="story" path="story/:id" handler={Item}/>
    <Route name="comment" path="comment/:id" handler={Comment} permalinked={true}/>
    <Route name="newest" path="newest" handler={Updates} type="links"/>
    <Route name="newcomments" path="newcomments" handler={Updates} type="comments"/>
    <Route name="user" path="user/:id" handler={UserProfile}/>
  </Route>
</Routes>

// Expose React globally for React Developer Tools
window.React = React

React.renderComponent(routes, document.getElementById('app'))