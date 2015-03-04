'use strict';

require('setimmediate')

var React = require('react')
var Router = require('react-router')

var StoryStore = require('./stores/StoryStore')
var UpdatesStore = require('./stores/UpdatesStore')
var SettingsStore = require('./stores/SettingsStore')

var PermalinkedComment = require('./PermalinkedComment')
var Item = require('./Item')
var Settings = require('./Settings')
var Stories = require('./Stories')
var Updates = require('./Updates')
var UserProfile = require('./UserProfile')

var {DefaultRoute, Link, NotFoundRoute, Route, RouteHandler} = Router

var App = React.createClass({
  getInitialState() {
    return {
      showSettings: false
    }
  },

  componentWillMount() {
    SettingsStore.load()
    StoryStore.loadSession()
    UpdatesStore.loadSession()
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },

  componentWillUnmount() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  },

  /**
   * Give stores a chance to persist data to sessionStorage in case this is a
   * refresh or an external link in the same tab.
   */
  handleBeforeUnload() {
    StoryStore.saveSession()
    UpdatesStore.saveSession()
  },

  toggleSettings(e) {
    e.preventDefault()
    this.setState({showSettings: !this.state.showSettings})
  },

  render() {
    return <div className="App" onClick={this.state.showSettings && this.toggleSettings}>
      <div className="App__wrap">
      <div className="App__header">
        <img src="logo.png" width="16" height="16" alt="" />{' '}
        <Link to="news" className="App__homelink">React HN</Link>{' '}
        <Link to="newest">new</Link>{' | '}
        <Link to="newcomments">comments</Link> {' | '}
        <Link to="show">show</Link>{' | '}
        <Link to="ask">ask</Link>{' | '}
        <Link to="jobs">jobs</Link>
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
    </div>
  }
})

var NotFound = React.createClass({
  render() {
    return <h2>Not found</h2>
  }
})

function storiesHandler(route, type, limit, title) {
  return React.createClass({
    render() {
      return <Stories {...this.props} key={route} route={route} type={type} limit={limit} title={title}/>
    }
  })
}

function updatesHandler(type) {
  return React.createClass({
    render() {
      return <Updates {...this.props} key={type} type={type}/>
    }
  })
}

var Ask = storiesHandler('ask', 'askstories', 200, 'Ask')
var Comments = updatesHandler('comments')
var Jobs = storiesHandler('jobs', 'jobstories', 200, 'Jobs')
var New = storiesHandler('newest', 'newstories', 500, 'New Links')
var Show = storiesHandler('show', 'showstories', 200, 'Show')
var Top = storiesHandler('news', 'topstories', 500)

var routes = <Route name="app" path="/" handler={App}>
  <DefaultRoute handler={Top}/>
  <NotFoundRoute handler={NotFound}/>
  <Route name="news" path="news" handler={Top}/>
  <Route name="newest" path="newest" handler={New}/>
  <Route name="show" path="show" handler={Show}/>
  <Route name="ask" path="ask" handler={Ask}/>
  <Route name="jobs" path="jobs" handler={Jobs}/>
  <Route name="item" path="item/:id" handler={Item}/>
  <Route name="job" path="job/:id" handler={Item}/>
  <Route name="poll" path="poll/:id" handler={Item}/>
  <Route name="story" path="story/:id" handler={Item}/>
  <Route name="comment" path="comment/:id" handler={PermalinkedComment}/>
  <Route name="newcomments" path="newcomments" handler={Comments}/>
  <Route name="user" path="user/:id" handler={UserProfile}/>
</Route>

Router.run(routes, function(Handler, state) {
  React.render(<Handler params={state.params} query={state.query}/>, document.getElementById('app'))
})