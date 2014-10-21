/** @jsx React.DOM */

'use strict';

var React = require('react')
var ReactFireMixin = require('reactfire')

var HNService = require('./services/HNService')
var StoryCommentThreadStore = require('./stores/StoryCommentThreadStore')
var ItemStore = require('./stores/ItemStore')

var Comment = require('./Comment')
var PollOption = require('./PollOption')
var Spinner = require('./Spinner')
var ItemMixin = require('./mixins/ItemMixin')

var cx = require('./utils/buildClassName')
var setTitle = require('./utils/setTitle')

/**
 * Describe the time from now until the given time in terms of units without any
 * "a" or "an" prefixes.
 */
function timeUnitsAgo(_moment) {
  return _moment.fromNow(true).replace(/^an? /, '')
}

var Item = React.createClass({
  mixins: [ItemMixin, ReactFireMixin],

  getInitialState: function() {
    return {
      item: ItemStore.getCachedStory(Number(this.props.params.id)) || {}
    , lastVisit: null
    , commentCount: 0
    , maxCommentId: 0
    , newCommentCount: 0
    }
  },

  componentWillMount: function() {
    this.bindAsObject(HNService.itemRef(this.props.params.id), 'item')
    this.initThreadStore()
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },

  componentWillUnmount: function() {
    this.threadStore.dispose()
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  },

  /**
   * Update the title whenever an item has loaded.
   */
  componentWillUpdate: function(nextProps, nextState) {
    if (this.state.item.id != nextState.item.id) {
      setTitle(nextState.item.title)
    }
  },

  /**
   * Handle changing the displayed item without unmounting the component, e.g.
   * when a link to another item is posted, or the user edits the URL.
   */
  componentWillReceiveProps: function(nextProps) {
    if (this.props.params.id != nextProps.params.id) {
      this.unbind('item')
      this.bindAsObject(HNService.itemRef(nextProps.params.id), 'item')
      this.initThreadStore()
    }
  },

  /**
   * Creates a new thread store and set its initial state. If there's already
   * an existing thread store, dispose of it first.
   */
  initThreadStore: function() {
    if (this.threadStore) {
      this.threadStore.dispose()
    }
    this.threadStore = new StoryCommentThreadStore(this.props.params.id, this.handleCommentsChanged)
    this.setState(this.threadStore.initialState)
  },

  /**
   * Ensure the last visit time and comment details get stored for this item if
   * the user refreshes or otherwise navigates off the page.
   */
  handleBeforeUnload: function() {
    this.threadStore.dispose()
  },

  handleCommentsChanged: function(payload) {
    if (payload.type != 'collapse') {
      this.setState(payload.data)
    }
    else {
      this.forceUpdate()
    }
  },

  autoCollapse: function(e) {
    e.preventDefault()
    this.threadStore.collapseThreadsWithoutNewComments()
  },

  markAsRead: function(e) {
    e.preventDefault()
    this.setState(this.threadStore.markAsRead())
  },

  render: function() {
    var state = this.state
    var item = state.item
    var threadStore = this.threadStore
    if (!item.id) { return <div className="Item Item--loading"><Spinner size="20"/></div> }
    return <div className={cx('Item', {'Item--dead': item.dead})}>
      <div className="Item__content">
        {this.renderItemTitle(item)}
        {this.renderItemMeta(item, (state.lastVisit !== null && state.newCommentCount > 0 && <span>{' '}
          (<em>{state.newCommentCount} new</em> in the last {timeUnitsAgo(state.lastVisit)}{') | '}
          <span className="control" tabIndex="0" onClick={this.autoCollapse} onKeyPress={this.autoCollapse} title="Collapse threads without new comments">
            auto collapse
          </span>{' | '}
          <span className="control" tabIndex="0" onClick={this.markAsRead} onKeyPress={this.markAsRead}>
            mark as read
          </span>
        </span>))}
        {item.text && <div className="Item__text">
          <div dangerouslySetInnerHTML={{__html: item.text}}/>
        </div>}
        {item.type == 'poll' && <div className="Item__poll">
          {item.parts.map(function(id) {
            return <PollOption key={id} id={id}/>
          })}
        </div>}
      </div>
      {item.kids && <div className="Item__kids">
        {item.kids.map(function(id, index) {
          return <Comment key={id} id={id} level={0}
            loadingSpinner={index === 0}
            threadStore={threadStore}
          />
        })}
      </div>}
    </div>
  }
})

module.exports = Item