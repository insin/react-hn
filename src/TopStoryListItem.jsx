/** @jsx React.DOM */

'use strict';

var React = require('react')
var ReactFireMixin = require('reactfire')

var StoryCommentThreadStore = require('./stores/StoryCommentThreadStore')
var HNService = require('./services/HNService')
var TopStore = require('./stores/TopStore')

var ItemMixin = require('./mixins/ItemMixin')
var ListItemMixin = require('./mixins/ListItemMixin')
var Spinner = require('./Spinner')

/**
 * Display story title and metadataas as a list item.
 * Cached story data may be given as a prop, but this component is also
 * responsible for listening to updates to the story and caching the latest
 * version in TopStore.
 */
var TopStoryListItem = React.createClass({
  mixins: [ItemMixin, ListItemMixin, ReactFireMixin],

  propTypes: {
    id: React.PropTypes.number
  , cachedItem: React.PropTypes.object
  , topIndex: React.PropTypes.number
  },

  getDefaultProps: function() {
    return {
      id: null
    , cachedItem: null
    , topIndex: null
    }
  },

  getInitialState: function() {
    return {
      item: this.props.cachedItem || {}
    }
  },

  componentWillMount: function() {
    TopStore.on(this.props.id, this.updateThreadState)
    if (this.props.id != null) {
      this.initLiveItem()
    }
    else if (this.props.cachedItem != null) {
      // Display the comment state of the cached item we were given while we're
      // waiting for the live item to load.
      this.threadState = StoryCommentThreadStore.loadState(this.state.item.id)
    }
  },

  componentWillUnmount: function() {
    TopStore.off(this.props.id, this.updateThreadState)
  },

  /**
   * Catch the transition from not having an id prop to having one.
   * Scenario: we were waiting for the initial topstories ids to load.
   */
  componentWillReceiveProps: function(nextProps) {
    if (this.props.id == null && nextProps.id != null) {
      this.initLiveItem()
    }
  },

  /**
   * If the live item has been loaded or updated, update the TopStore cache
   * with its current index and latest data.
   */
  componentWillUpdate: function(nextProps, nextState) {
    if (this.state.item !== nextState.item) {
      TopStore.setItem(this.props.topIndex, nextState.item)
    }
  },

  /**
   * Initialise listening to updates for the item with the given id and
   * initialise its comment thread state.
   */
  initLiveItem: function() {
    // If we were given a cached item to display initially, it will be replaced
    this.bindAsObject(HNService.itemRef(this.props.id), 'item')
    this.threadState = StoryCommentThreadStore.loadState(this.props.id)
  },

  /**
   * Update thread state in response to a storage event indicating it has been
   * modified.
   */
  updateThreadState: function() {
    this.threadState = StoryCommentThreadStore.loadState(this.props.id)
    this.forceUpdate()
  },

  render: function() {
    // Display the loading spinner if we have nothing to show initially
    if (!this.state.item.id) { return <li className="ListItem ListItem--loading"><Spinner/></li> }
    return this.renderListItem(this.state.item, this.threadState)
  }
})

module.exports = TopStoryListItem