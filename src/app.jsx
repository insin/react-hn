require('setimmediate')

var React = require('react')
var {IndexRoute, Link, Route, Router} = require('react-router')

var StoryStore = require('./stores/StoryStore')
var UpdatesStore = require('./stores/UpdatesStore')
var SettingsStore = require('./stores/SettingsStore')

var PermalinkedComment = require('./PermalinkedComment')
var Item = require('./Item')
var Settings = require('./Settings')
var Stories = require('./Stories')
var Updates = require('./Updates')
var UserProfile = require('./UserProfile')

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
        <Link to="/news" activeClassName="active" className="App__homelink">React HN</Link>{' '}
        <Link to="/newest" activeClassName="active">new</Link>{' | '}
        <Link to="/newcomments" activeClassName="active">comments</Link> {' | '}
        <Link to="/show" activeClassName="active">show</Link>{' | '}
        <Link to="/ask" activeClassName="active">ask</Link>{' | '}
        <Link to="/jobs" activeClassName="active">jobs</Link>
        <a className="App__settings" tabIndex="0" onClick={this.toggleSettings} onKeyPress={this.toggleSettings}>
          {this.state.showSettings ? 'hide settings' : 'settings'}
        </a>
        {this.state.showSettings && <Settings key="settings"/>}
      </div>
      <div className="App__content">
        {this.props.children}
      </div>
      <div className="App__footer">
        {`react-hn v${__VERSION__} | `}
        <a href="https://github.com/insin/react-hn">insin/react-hn</a>
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

var routes = <Route path="/" component={App}>
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
  <Route path="comment/:id" component={PermalinkedComment}/>
  <Route path="newcomments" component={Comments}/>
  <Route path="user/:id" component={UserProfile}/>
  <Route path="*" component={NotFound}/>
</Route>

React.render(<Router routes={routes}/>, document.getElementById('app'))
