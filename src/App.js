var React = require('react')
var Link = require('react-router/lib/Link')

var Settings = require('./Settings')

var StoryStore = require('./stores/StoryStore')
var UpdatesStore = require('./stores/UpdatesStore')
var SettingsStore = require('./stores/SettingsStore')

var App = React.createClass({
  getInitialState() {
    return {
      showSettings: false,
      showChildren: false,
      prebootHTML: this.props.params.prebootHTML
    }
  },

  componentWillMount() {
    SettingsStore.load()
    StoryStore.loadSession()
    UpdatesStore.loadSession()
    if (typeof window === 'undefined') return
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },

  componentDidMount() {
    // Empty the prebooted HTML and hydrate using live results from Firebase
    this.setState({ prebootHTML: '', showChildren: true })
  },

  componentWillUnmount() {
    if (typeof window === 'undefined') return
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
          <Link to="/news" className="App__homelinkicon"><img src="img/logo.png" width="16" height="16" alt="" /></Link>{' '}
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
          <div dangerouslySetInnerHTML={{ __html: this.state.prebootHTML }}/>
          {this.state.showChildren ? this.props.children : ''}
        </div>
        <div className="App__footer">
          <a href="https://github.com/insin/react-hn">insin/react-hn</a>
        </div>
      </div>
    </div>
  }
})

module.exports = App
