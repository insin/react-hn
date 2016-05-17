var React = require('react')
var ReactFireMixin = require('reactfire')

var StoryCommentThreadStore = require('./stores/StoryCommentThreadStore')
var HNService = require('./services/HNService')
var HNServiceRest = require('./services/HNServiceRest')
var SettingsStore = require('./stores/SettingsStore')
var StoryStore = require('./stores/StoryStore')

var ItemMixin = require('./mixins/ItemMixin')
var ListItemMixin = require('./mixins/ListItemMixin')
var Spinner = require('./Spinner')

/**
 * Display story title and metadata as as a list item.
 * Cached story data may be given as a prop, but this component is also
 * responsible for listening to updates to the story and providing the latest
 * version for StoryStore's cache.
 */
var StoryListItem = React.createClass({
  mixins: [ItemMixin, ListItemMixin, ReactFireMixin],

  propTypes: {
    // The StoryStore handling caching and updates to the stories being displayed
    store: React.PropTypes.instanceOf(StoryStore).isRequired,

    // The story's id in Hacker News
    id: React.PropTypes.number,
    // A version of the story from the cache, for initial display
    cachedItem: React.PropTypes.object,
    // The current index of the story in the list being displayed
    index: React.PropTypes.number
  },

  getDefaultProps() {
    return {
      id: null,
      cachedItem: null,
      index: null
    }
  },

  getInitialState() {
    return {
      item: this.props.cachedItem || {}
    }
  },

  componentWillMount() {
    if (this.props.id != null) {
      this.initLiveItem(this.props)
    }
    else if (this.props.cachedItem != null) {
      // Display the comment state of the cached item we were given while we're
      // waiting for the live item to load.
      this.threadState = StoryCommentThreadStore.loadState(this.state.item.id)
    }
  },

  componentWillUnmount() {
    if (this.props.id != null) {
      this.props.store.removeListener(this.props.id, this.updateThreadState)
    }
  },

  /**
   * Catch the transition from not having an id prop to having one.
   * Scenario: we were waiting for the initial list of story ids to load.
   */
  componentWillReceiveProps(nextProps) {
    if (this.props.id == null && nextProps.id != null) {
      this.initLiveItem(nextProps)
    }
  },

  /**
   * If the live item has been loaded or updated, update the StoryStore cache
   * with its current index and latest data.
   */
  componentWillUpdate(nextProps, nextState) {
    if (this.state.item !== nextState.item) {
      if (nextState.item != null) {
        this.props.store.itemUpdated(nextState.item, this.props.index)
      }
      else {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`Item ${this.props.id} went from ${JSON.stringify(this.state.item)} to ${nextProps.item}`)
        }
      }
    }
  },

  /**
   * Initialise listening to updates for the item with the given id and
   * initialise its comment thread state.
   */
  initLiveItem(props) {
    if (SettingsStore.offlineMode) {
      HNServiceRest.itemRef(props.id).then(function(res) {
        return res.json()
      }).then(function(snapshot) {
        this.replaceState({ item: snapshot })
      }.bind(this))
    }
    else {
      // If we were given a cached item to display initially, it will be replaced
      this.bindAsObject(HNService.itemRef(props.id), 'item')
    }

    this.threadState = StoryCommentThreadStore.loadState(props.id)
    this.props.store.addListener(props.id, this.updateThreadState)
  },

  /**
   * Update thread state in response to a storage event indicating it has been
   * modified.
   */
  updateThreadState() {
    this.threadState = StoryCommentThreadStore.loadState(this.props.id)
    this.forceUpdate()
  },

  render() {
    // Display the loading spinner if we have nothing to show initially
    if (!this.state.item || !this.state.item.id) {
      return <li className="ListItem ListItem--loading" style={{marginBottom: SettingsStore.listSpacing}}>
        <Spinner/>
      </li>
    }

    return this.renderListItem(this.state.item, this.threadState)
  }
})

module.exports = StoryListItem
