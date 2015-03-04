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

  getInitialState() {
    return {
      item: ItemStore.getCachedStory(Number(this.props.params.id)) || {}
    }
  },

  componentWillMount() {
    this.bindAsObject(HNService.itemRef(this.props.params.id), 'item')
    if (this.state.item.id) {
      this.threadStore = new StoryCommentThreadStore(this.state.item, this.handleCommentsChanged, {cached: true})
      setTitle(this.state.item.title)
    }
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },

  componentWillUnmount() {
    if (this.threadStore) {
      this.threadStore.dispose()
    }
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.params.id != nextProps.params.id) {
      // Tear it down...
      this.threadStore.dispose()
      this.threadStore = null
      this.unbind('item')
      // ...and set it up again
      var item = ItemStore.getCachedStory(Number(nextProps.params.id))
      if (item) {
        this.threadStore = new StoryCommentThreadStore(item, this.handleCommentsChanged, {cached: true})
        setTitle(item.title)
      }
      this.bindAsObject(HNService.itemRef(nextProps.params.id), 'item')
      this.setState({item: item || {}})
    }
  },

  componentWillUpdate(nextProps, nextState) {
    // Update the title when the item has loaded.
    if (!this.state.item.id && nextState.item.id) {
      setTitle(nextState.item.title)
    }
  },

  componentDidUpdate(prevProps, prevState) {
    // If the state item id changed, an initial or new item must have loaded
    if (prevState.item.id != this.state.item.id) {
      if (!this.threadStore || this.threadStore.itemId != this.state.item.id) {
        this.threadStore = new StoryCommentThreadStore(this.state.item, this.handleCommentsChanged, {cached: false})
        setTitle(this.state.item.title)
        this.forceUpdate()
      }
    }
    // If the item has been updated from Firebase and the initial set
    // of comments is still loading, the number of expected comments might need
    // to be adjusted.
    // This triggers a check for thread load completion, completing it
    // immediately if a cached item had 0 kids and the latest version from
    // Firebase also has 0 kids.
    else if (prevState.item !== this.state.item && this.threadStore.loading) {
      var kids = (this.state.item.kids ? this.state.item.kids.length : 0)
      var prevKids = (prevState.item.kids ? prevState.item.kids.length : 0)
      this.threadStore.adjustExpectedComments(kids - prevKids)
    }
  },

  /**
   * Ensure the last visit time and comment details get stored for this item if
   * the user refreshes or otherwise navigates off the page.
   */
  handleBeforeUnload() {
    if (this.threadStore) {
      this.threadStore.dispose()
    }
  },

  handleCommentsChanged(payload) {
    this.forceUpdate()
  },

  autoCollapse(e) {
    e.preventDefault()
    this.threadStore.collapseThreadsWithoutNewComments()
  },

  markAsRead(e) {
    e.preventDefault()
    this.threadStore.markAsRead()
    this.forceUpdate()
  },

  render() {
    var state = this.state
    var item = state.item
    var threadStore = this.threadStore
    if (!item.id || !threadStore) { return <div className="Item Item--loading"><Spinner size="20"/></div> }
    var newCommentCount = item.descendants - threadStore.prevCommentCount
    return <div className={cx('Item', {'Item--dead': item.dead})}>
      <div className="Item__content">
        {this.renderItemTitle(item)}
        {this.renderItemMeta(item, (threadStore.lastVisit !== null && newCommentCount > 0 && <span>{' '}
          (<em>{newCommentCount} new</em> in the last {timeUnitsAgo(threadStore.lastVisit)}{') | '}
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