/** @jsx React.DOM */

'use strict';

var React = require('react/addons')
var ReactFireMixin = require('reactfire')

var Comment = require('./Comment')
var CommentThreadStore = require('./stores/CommentThreadStore')
var ItemStore =  require('./stores/ItemStore')
var PollOption = require('./PollOption')
var Spinner = require('./Spinner')

var cx = require('./utils/buildClassName')
var renderItemTitle = require('./renderItemTitle')
var renderItemMeta = require('./renderItemMeta')
var setTitle = require('./utils/setTitle')

/**
 * Describe the time from now until the given time in terms of units without any
 * "a" or "an" prefixes.
 */
function timeUnitsAgo(_moment) {
  return _moment.fromNow(true).replace(/^an? /, '')
}

var Item = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    var commentStats = CommentThreadStore.getCommentStats(this.props.params.id)
    return {
      item: {}
    , lastVisit: commentStats.lastVisit
    , commentCount: commentStats.commentCount
    , prevMaxCommentId: commentStats.prevMaxCommentId
    , newCommentCount: 0
    }
  },
  componentWillMount: function() {
    this.bindAsObject(ItemStore.itemRef(this.props.params.id), 'item')
    this.setState(CommentThreadStore.init(this.props.params.id, this.handleCommentsAdded))
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },
  componentWillUnmount: function() {
    CommentThreadStore.dispose()
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
      this.bindAsObject(ItemStore.itemRef(nextProps.params.id), 'item')
      CommentThreadStore.dispose()
      this.setState(CommentThreadStore.init(nextProps.params.id, this.handleCommentsAdded))
    }
  },
  /**
   * Ensure the last visit time and comment details get stored for this item if
   * the user refreshes or otherwise navigates off the page.
   */
  handleBeforeUnload: function() {
    CommentThreadStore.dispose()
  },
  isInitialLoad: function() {
    return this.state.lastVisit === null
  },
  handleCommentsAdded: function(commentData) {
    var stateChange = {newCommentCount: commentData.newCommentCount}
    // Only update the actual comment count once it exceeds what we already had
    if (commentData.commentCount > this.state.commentCount) {
      stateChange.commentCount = commentData.commentCount
    }
    this.setState(stateChange)
  },
  markAsRead: function() {
    this.setState(CommentThreadStore.markAsRead())
  },
  render: function() {
    var state = this.state
    var item = state.item
    var newComments = state.newCommentCount
    if (!item.id) { return <div className="Item Item--loading"><Spinner size="20"/></div> }
    return <div className={cx('Item', {'Item--dead': item.dead})}>
      <div className="Item__content">
        {renderItemTitle(item)}
        {renderItemMeta(item, state, 'detail', (newComments > 0 && <span>{' '}
          (<em>{newComments} new</em> in the last {timeUnitsAgo(state.lastVisit)}{') | '}
          <span className="control" tabIndex="0" onClick={this.markAsRead} onKeyPress={this.markAsRead}>mark as read</span>
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
            showSpinner={index === 0}
            maxCommentId={state.prevMaxCommentId}
          />
        })}
      </div>}
    </div>
  }
})

module.exports = Item