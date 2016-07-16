var React = require('react')

var StoryStore = require('./stores/StoryStore')

var PageNumberMixin = require('./mixins/PageNumberMixin')
var Paginator = require('./Paginator')
var Spinner = require('./Spinner')
var StoryListItem = require('./StoryListItem')
var SettingsStore = require('./stores/SettingsStore')

var {ITEMS_PER_PAGE} = require('./utils/constants')
var pageCalc = require('./utils/pageCalc')
var setTitle = require('./utils/setTitle')

var Stories = React.createClass({
  mixins: [PageNumberMixin],

  propTypes: {
    // The number of stories which may be paginated through
    limit: React.PropTypes.number.isRequired,
    // The route name being used
    route: React.PropTypes.string.isRequired,
    // The type of stories to be displayed
    type: React.PropTypes.string.isRequired,

    // Page title associated with the stories being displayed
    title: React.PropTypes.string
  },

  getInitialState() {
    return {
      ids: [],
      limit: this.props.limit,
      stories: []
    }
  },

  componentDidMount() {
    setTitle(this.props.title)
    this.store = new StoryStore(this.props.type)
    this.store.addListener('update', this.handleUpdate)
    this.store.start()
    this.setState(this.store.getState())
  },

  componentWillUnmount() {
    this.store.removeListener('update', this.handleUpdate)
    this.store.stop()
    this.store = null
  },

  handleUpdate(update) {
    if (!this.isMounted()) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          `Skipping update as the ${this.props.type} Stories component is no longer mounted.`
        )
      }
      return
    }
    update.limit = update.ids.length
    this.setState(update)
  },

  render() {
    var page = pageCalc(this.getPageNumber(), ITEMS_PER_PAGE, this.state.limit)

    // Display a list of placeholder items while we're waiting for the initial
    // list of story ids to load from Firebase.
    if (this.state.stories.length === 0 && this.state.ids.length === 0 && this.getPageNumber() > 0) {
      var dummyItems = []
      for (var i = page.startIndex; i < page.endIndex; i++) {
        dummyItems.push(
          <li key={i} className="ListItem ListItem--loading" style={{marginBottom: SettingsStore.listSpacing}}>
            <Spinner/>
          </li>
        )
      }
      return <div className="Items Items--loading">
        <ol className="Items__list" start={page.startIndex + 1}>{dummyItems}</ol>
        <Paginator route={this.props.route} page={page.pageNum} hasNext={page.hasNext}/>
      </div>
    }

    return <div className="Items">
      <ol className="Items__list" start={page.startIndex + 1}>
        {this.renderItems(page.startIndex, page.endIndex)}
      </ol>
      <Paginator route={this.props.route} page={page.pageNum} hasNext={page.hasNext}/>
    </div>
  },

  renderItems(startIndex, endIndex) {
    var rendered = []
    for (var i = startIndex; i < endIndex; i++) {
      var item = this.state.stories[i]
      var id = this.state.ids[i]
      if (id) {
        rendered.push(<StoryListItem key={id} id={id} index={i} cachedItem={item} store={this.store}/>)
      }
      else {
        rendered.push(<StoryListItem cachedItem={item} store={this.store}/>)
      }
    }
    return rendered
  }
})

module.exports = Stories
