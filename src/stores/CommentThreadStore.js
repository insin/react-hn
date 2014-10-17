'use strict';

var moment = require('moment')

var debounce = require('../utils/cancellableDebounce')
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

function CommentThreadStore(itemId, onCommentsChanged) {
  // Always count from zero to catch any deletions since the last visit
  var commentCount = 0
  var newCommentCount = 0
  var newCommentIds = {}
  var maxCommentId = 0
  var initialState = loadState(itemId)
  var prevMaxCommentId = initialState.maxCommentId
  var isFirstVisit = (initialState.lastVisit === null)

  /**
   * Callback to the item component with updated thread state is debounced as
   * comments will be loading in bulk on initial mount of the item.
   */
  var _commentsChanged = debounce(function() {
    onCommentsChanged({
      commentCount: commentCount
    , newCommentCount: newCommentCount
    })
  }, 100)

  /**
   * If we don't have a max comment id stored for an item, it must have been
   * visited for the first time. Allow some time for comments to load by only
   * starting to mark comments as new after a 5 second gap without any new
   * comments bein added.
   */
  var _firstLoadComplete = null
  if (isFirstVisit) {
    _firstLoadComplete = debounce(function() {
      prevMaxCommentId = maxCommentId
      isFirstVisit = false
      onCommentsChanged({
        lastVisit: moment(Date.now())
      , maxCommentId: prevMaxCommentId
      })
      _firstLoadComplete = null
    }, 5000)
  }

  /**
   * Persist comment thread state.
   */
  function _storeState() {
    storage.set(itemId + COMMENT_COUNT_KEY, commentCount)
    storage.set(itemId + LAST_VISIT_KEY, Date.now())
    storage.set(itemId + MAX_COMMENT_KEY, maxCommentId)
  }

  /**
   * Retrieve the initial persisted state of the comment thread.
   * @return see CommentThread.loadState()
   */
  function getInitialState() {
    return initialState
  }

  /**
   * Register a comment's appearance in the thread.
   */
  function commentAdded(commentId) {
    commentCount++
    if (prevMaxCommentId > 0 && commentId > prevMaxCommentId) {
      newCommentCount++
      newCommentIds[commentId] = true
    }
    if (commentId > maxCommentId) {
      maxCommentId = commentId
    }

    _commentsChanged()
    if (isFirstVisit) {
      _firstLoadComplete()
    }
  }

  /**
   * Register a comment's deletion from the thread.
   */
  function commentDeleted(commentId) {
    commentCount--
    if (typeof newCommentIds[commentId] != 'undefined') {
      newCommentCount--;
      delete newCommentIds[commentId]
    }

    _commentsChanged()
  }

  /**
   * Merk the thread as read.
   * @return .lastVisit {moment}
   * @return .maxCommentId {Number}
   * @return .newCommentCount {Number}
   */
  function markAsRead() {
    newCommentCount = 0
    prevMaxCommentId = maxCommentId
    newCommentIds = {}
    _storeState()
    return {
      lastVisit: moment(Date.now())
    , maxCommentId: maxCommentId
    , newCommentCount: newCommentCount
    }
  }

  /**
   * Persist comment thread state and perform any necessary internal cleanup.
   */
  function dispose() {
    // Cancel debounced callbacks in case any are pending
    _commentsChanged.cancel()
    if (isFirstVisit) {
      _firstLoadComplete.cancel()
    }
    _storeState()
  }

  // Start the first load completion callback's debounce timer running
  if (isFirstVisit) {
    _firstLoadComplete()
  }

  return {
    getInitialState: getInitialState
  , markAsRead: markAsRead
  , commentAdded: commentAdded
  , commentDeleted: commentDeleted
  , dispose: dispose
  , _getVars: function() {
      return {
        commentCount: commentCount
      , newCommentCount: newCommentCount
      , newCommentIds: newCommentIds
      , maxCommentId: maxCommentId
      , prevMaxCommentId: prevMaxCommentId
      , isFirstVisit: isFirstVisit
      }
    }
  }
}

CommentThreadStore.loadState = loadState

module.exports = CommentThreadStore