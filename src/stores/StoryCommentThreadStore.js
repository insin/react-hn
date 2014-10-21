'use strict';

var moment = require('moment')

var CommentThreadStore = require('./CommentThreadStore')

var debounce = require('../utils/cancellableDebounce')
var extend = require('../utils/extend')
var storage = require('../utils/storage')

var COMMENT_COUNT_KEY = ':cc'
var LAST_VISIT_KEY = ':lv'
var MAX_COMMENT_KEY = ':mc'

/**
 * Load persisted comment thread state.
 * @return .lastVisit {moment} null if the item hasn't been visited before.
 * @return .commentCount {Number} 0 if the item hasn't been visited before.
 * @return .maxCommentId {Number} 0 if the item hasn't been visited before.
 */
function loadState(itemId) {
  var lastVisitTime = storage.get(itemId + LAST_VISIT_KEY, null)
  return {
    lastVisit: (lastVisitTime !== null ? moment(Number(lastVisitTime)) : null)
  , commentCount: Number(storage.get(itemId + COMMENT_COUNT_KEY, '0'))
  , maxCommentId: Number(storage.get(itemId + MAX_COMMENT_KEY, '0'))
  }
}

function StoryCommentThreadStore(itemId, onCommentsChanged) {
  CommentThreadStore.call(this, itemId, onCommentsChanged)

  // We don't want the story id to be part of the comment hierarchy
  this.children = {}

  this.commentCount = 0
  this.newCommentCount = 0
  this.maxCommentId = 0
  this.initialState = loadState(itemId)
  this.prevMaxCommentId = this.initialState.maxCommentId
  this.isFirstVisit = (this.initialState.lastVisit === null)

  // Start the first load completion callback's debounce timer running
  if (this.isFirstVisit) {
    this.firstLoadComplete()
  }
}

StoryCommentThreadStore.loadState = loadState

StoryCommentThreadStore.prototype = extend(Object.create(CommentThreadStore.prototype), {
  constructor: StoryCommentThreadStore,

  /**
   * Callback to the item component with updated comment counts, debounced as
   * comments will be loading frequently on initial load.
   */
  numberOfCommentsChanged: debounce(function() {
    this.onCommentsChanged({
      type: 'number'
    , data: {
        commentCount: this.commentCount
      , newCommentCount: this.newCommentCount
      }
    })
  }, 100),

  /**
   * If we don't have a last visit time stored for an item, it must have been
   * visited for the first time. Allow some time for comments to load by only
   * starting to mark comments as new after a 5 second gap without any new
   * comments being added.
   */
  firstLoadComplete: debounce(function() {
    this.prevMaxCommentId = this.maxCommentId
    this.isFirstVisit = false
    this.onCommentsChanged({
      type: 'load_complete'
    , data: {
        lastVisit: moment(Date.now())
      , maxCommentId: this.prevMaxCommentId
      }
    })
  }, 5000),

  /**
   * Persist comment thread state.
   */
  _storeState: function() {
    storage.set(this.itemId + COMMENT_COUNT_KEY, this.commentCount)
    storage.set(this.itemId + LAST_VISIT_KEY, Date.now())
    storage.set(this.itemId + MAX_COMMENT_KEY, this.maxCommentId)
  },

  commentAdded: function(comment) {
    CommentThreadStore.prototype.commentAdded.call(this, comment)
    this.commentCount++
    // Register the comment as new if it's new
    if (this.prevMaxCommentId > 0 && comment.id > this.prevMaxCommentId) {
      this.newCommentCount++
      this.isNew[comment.id] = true
    }
    // Keep track of the biggest comment id seen
    if (comment.id > this.maxCommentId) {
      this.maxCommentId = comment.id
    }
    // Trigger debounced callbacks
    this.numberOfCommentsChanged()
    if (this.isFirstVisit) {
      this.firstLoadComplete()
    }
  },

  commentDeleted: function(comment) {
    CommentThreadStore.prototype.commentDeleted.call(this, comment)
    this.commentCount--
    if (this.isNew[comment.id]) {
      this.newCommentCount--;
      delete this.isNew[comment.id]
    }
    // Trigger debounced callbacks
    this.numberOfCommentsChanged()


  },

  /**
   * Merk the thread as read.
   * @return .lastVisit {moment}
   * @return .maxCommentId {Number}
   * @return .newCommentCount {Number}
   */
  markAsRead: function() {
    this.newCommentCount = 0
    this.prevMaxCommentId = this.maxCommentId
    this.isNew = {}
    this._storeState()
    return {
      lastVisit: moment(Date.now())
    , maxCommentId: this.maxCommentId
    , newCommentCount: this.newCommentCount
    }
  },

  /**
   * Persist comment thread state and perform any necessary internal cleanup.
   */
  dispose: function() {
    // Cancel debounced callbacks in case any are pending
    this.numberOfCommentsChanged.cancel()
    this.firstLoadComplete.cancel()
    this._storeState()
  }
})

module.exports = StoryCommentThreadStore