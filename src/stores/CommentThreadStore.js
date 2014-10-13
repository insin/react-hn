'use strict';

var moment = require('moment')

var debounce = require('../utils/cancellableDebounce')
var storage = require('../utils/storage')

var COMMENT_COUNT_KEY = ':cc'
var LAST_VISIT_KEY = ':lv'
var MAX_COMMENT_KEY = ':mc'

var itemId = null
var handleCommentsAdded = null

var commentCount = null
var newCommentCount = null
var maxCommentId = null
var prevMaxCommentId = null
var isFirstVisit = null

/**
 * Callbacks to the item component with comment stats are debounced as comments
 * will be loading in bulk on initial mount of the item.
 */
var onCommentsAdded = debounce(function() {
  handleCommentsAdded({
    commentCount: commentCount
  , newCommentCount: newCommentCount
  })
}, 100)

/**
 * If we don't have a max comment id stored for an item, it must have been
 * visited for the first time. Allow some time for comments to load by only
 * starting to mark comments as new after a 5 second gap without any new
 * comments popping in.
 */
var onFirstLoadComplete = debounce(function() {
  prevMaxCommentId = maxCommentId
  isFirstVisit = false
}, 5000)

function storeCurrentState() {
  storage.set(itemId + COMMENT_COUNT_KEY, commentCount)
  storage.set(itemId + LAST_VISIT_KEY, Date.now())
  storage.set(itemId + MAX_COMMENT_KEY, maxCommentId)
}

module.exports = {
  /**
   * Initialise the store for a new item which has comments. The given callback
   * will be invoked with comment count details when new comments are registered
   * with the store.
   * @return .lastVisit {moment} the last time the user visited this item's
   *   comment thread. Will be the current time if this is their first visit.
   */
  init: function(_itemId, _handleCommentsAdded) {
    itemId = _itemId
    handleCommentsAdded = _handleCommentsAdded
    commentCount = 0
    newCommentCount = 0
    maxCommentId = 0
    prevMaxCommentId = storage.get(itemId + MAX_COMMENT_KEY, null)
    isFirstVisit = (prevMaxCommentId === null)
    if (prevMaxCommentId !== null) {
      prevMaxCommentId = Number(prevMaxCommentId)
    }
    var lastVisitTime = storage.get(itemId + LAST_VISIT_KEY, null)
    return {
      lastVisit: (lastVisitTime !== null ? moment(Number(lastVisitTime)) : moment())
    }
  },

  /**
   * Store relevant state in localStorage for later use and release any
   * references held.
   */
  dispose: function() {
    if (itemId !== null) {
      // Cancel the item component callback in case there's one pending
      onCommentsAdded.cancel()
      storeCurrentState()
      itemId = null
      handleCommentsAdded = null
    }
  },

  /**
   * Use the current max comment id as the id to compare new comments with and
   * reset the new comment count to zero.
   * @return .lastVisit {moment}
   * @return .prevMaxCommentId {number}
   * @return .newCommentCount {number}
   */
  markAsRead: function() {
    newCommentCount = 0
    prevMaxCommentId = maxCommentId
    storeCurrentState()
    return {
      lastVisit: moment()
    , prevMaxCommentId: prevMaxCommentId
    , newCommentCount: newCommentCount
    }
  },

  /**
   * Register a comment with the store as it pops into the page.
   */
  addComment: function(commentId) {
    commentCount++
    var isNew = (prevMaxCommentId !== null &&  commentId > prevMaxCommentId)
    if (isNew) {
      newCommentCount++
    }
    if (commentId > maxCommentId) {
      maxCommentId = commentId
    }
    onCommentsAdded()
    if (isFirstVisit) {
      onFirstLoadComplete()
    }
  },

  /**
   * Retrieve last visit and last comment count for an item by id.
   * @return .lastVisit {moment} null if the item hasn't been visited before.
   * @return .commentCount {Number} -1 if the item hasn't been visited before.
   */
  getCommentStats: function(_itemId) {
    var lastVisitTime = storage.get(_itemId + LAST_VISIT_KEY, null)
    return {
      lastVisit: (lastVisitTime !== null ? moment(Number(lastVisitTime)) : null)
    , commentCount: Number(storage.get(_itemId + COMMENT_COUNT_KEY, '0'))
    , prevMaxCommentId: Number(storage.get(_itemId + MAX_COMMENT_KEY, '0'))
    }
  }
}