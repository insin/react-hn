'use strict';

var moment = require('moment')

var CommentThreadStore = require('./CommentThreadStore')
var SettingsStore = require('./SettingsStore')

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

function StoryCommentThreadStore(item, onCommentsChanged, options) {
  CommentThreadStore.call(this, item, onCommentsChanged)
  this.startedLoading = Date.now()

  /** Lookup from a comment id to its parent comment id. */
  this.parents = {}
  /** The number of comments which have loaded. */
  this.commentCount = 0
  /** The number of new comments which have loaded. */
  this.newCommentCount = 0
  /** The max comment id seen by the store. */
  this.maxCommentId = 0
  /** Has the comment thread finished loading? */
  this.loading = true
  /** The number of comments we're expecting to load. */
  this.expectedComments = item.kids ? item.kids.length : 0

  var initialState = loadState(item.id)
  /** Time of last visit to the story. */
  this.lastVisit = initialState.lastVisit
  /** Max comment id on the last visit - determines which comments are new.  */
  this.prevMaxCommentId = initialState.maxCommentId
  /** Is this the user's first time viewing the story? */
  this.isFirstVisit = (initialState.lastVisit === null)

  // Trigger an immediate check for thread load completion if the item was not
  // retieved from the cache, so is the latest version. This completes page
  // loading immediately for items which have no comments yet.
  if (!options.cached) {
    this.checkLoadCompletion()
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
    this.onCommentsChanged({type: 'number'})
  }, 123),

  /**
   * If we don't have a last visit time stored for an item, it must have been
   * visited for the first time. Once it finishes loading, establish the last
   * visit time and max comment id which will be used to track and display new
   * comments.
   */
  firstLoadComplete: function() {
    this.lastVisit = moment(Date.now())
    this.prevMaxCommentId = this.maxCommentId
    this.isFirstVisit = false
    this.onCommentsChanged({type: 'first_load_complete'})
  },

  /**
   * Quick HACK for forcing completion of loading when there are delayed
   * comments present.
   */
  forceLoadCompletion: debounce(function() {
    if ("production" !== process.env.NODE_ENV) {
      if (!this.loading) {
        console.warn('Forcing loading completion ' +
          'after ' + ((Date.now() - this.startedLoading) / 1000).toFixed(1) + 's\n' +
           JSON.stringify(this)
        )
      }
    }
    this.loading = false
    if (this.isFirstVisit) {
      this.firstLoadComplete()
    }
    else if (SettingsStore.autoCollapse && this.newCommentCount > 0) {
      this.collapseThreadsWithoutNewComments()
    }
  }, 5000),

  /**
   * Check whether the number of comments has reached the expected number yet.
   */
  checkLoadCompletion: function() {
    if (this.loading && this.commentCount >= this.expectedComments) {
      this.forceLoadCompletion.cancel()
      if ("production" !== process.env.NODE_ENV) {
        console.info('Loading completed ' +
          'after ' + ((Date.now() - this.startedLoading) / 1000).toFixed(1) + 's ' +
          'with ' + this.commentCount + ' comments ' +
          'and ' + this.expectedComments + ' expected comments'
        )
      }
      this.loading = false
      if (this.isFirstVisit) {
        this.firstLoadComplete()
      }
      else if (SettingsStore.autoCollapse && this.newCommentCount > 0) {
        this.collapseThreadsWithoutNewComments()
      }
    }
    else {
      this.forceLoadCompletion()
    }
  },

  /**
   * Persist comment thread state.
   */
  _storeState: function() {
    storage.set(this.itemId + COMMENT_COUNT_KEY, this.commentCount)
    storage.set(this.itemId + LAST_VISIT_KEY, Date.now())
    storage.set(this.itemId + MAX_COMMENT_KEY, this.maxCommentId)
  },

  /**
   * A comment got loaded initially or added later.
   */
  commentAdded: function(comment) {
    // Deleted comments don't count towards the comment count
    if (comment.deleted) {
      // Adjust the number of comments expected during the initial page load.
      if (this.loading) {
        this.expectedComments--
        this.checkLoadCompletion()
      }
      return
    }

    CommentThreadStore.prototype.commentAdded.call(this, comment)
    this.commentCount++
    // Add the number of kids the comment has to the expected total for the
    // initial load.
    if (this.loading && comment.kids) {
      this.expectedComments += comment.kids.length
    }
    // Register the comment as new if it's new
    if (this.prevMaxCommentId > 0 && comment.id > this.prevMaxCommentId) {
      this.newCommentCount++
      this.isNew[comment.id] = true
    }
    // Keep track of the biggest comment id seen
    if (comment.id > this.maxCommentId) {
      this.maxCommentId = comment.id
    }
    // We don't want the story to be part of the comment parent hierarchy
    if (comment.parent != this.itemId) {
      this.parents[comment.id] = comment.parent
    }

    this.numberOfCommentsChanged()
    if (this.loading) {
      this.checkLoadCompletion()
    }
  },

  /**
   * Change the expected number of comments if an update was received during
   * initial loding and trigger a re-check of loading completion.
   */
  adjustExpectedComments: function(change) {
    this.expectedComments += change
    this.checkLoadCompletion()
  },

  /**
   * A comment which wasn't previously deleted became deleted.
   */
  commentDeleted: function(comment) {
    CommentThreadStore.prototype.commentDeleted.call(this, comment)
    this.commentCount--
    if (this.isNew[comment.id]) {
      this.newCommentCount--;
      delete this.isNew[comment.id]
    }
    delete this.parents[comment.id]
    // Trigger debounced callbacks
    this.numberOfCommentsChanged()
  },

  collapseThreadsWithoutNewComments: function() {
    // Create an id lookup for comments which have a new comment as one of their
    // descendants. New comments themselves are not added to the lookup.
    var newCommentIds = Object.keys(this.isNew)
    var hasNewComments = {}
    for (var i = 0, l = newCommentIds.length; i <l; i++) {
      var parent = this.parents[newCommentIds[i]]
      while (parent) {
        // Stop when we hit one we've seen before
        if (hasNewComments[parent]) {
          break
        }
        hasNewComments[parent] = true
        parent = this.parents[parent]
      }
    }

    // Walk the tree of comments one level at a time, only walking children to
    // comments we know have new comment descendants, to find subtrees which
    // don't have new comments.
    // Other comments are marked for collapsing unless they are themselves a
    // new comment (in which case all their replies must be new too).
    var shouldCollapse = {}
    var commentIds = this.children[this.itemId]
    while (commentIds.length) {
      var nextCommentIds = []
      for (i = 0, l = commentIds.length; i < l; i++) {
        var commentId = commentIds[i]
        if (!hasNewComments[commentId]) {
          if (!this.isNew[commentId]) {
            shouldCollapse[commentId] = true
          }
        }
        else {
          var childCommentIds = this.children[commentId]
          if (childCommentIds.length) {
            nextCommentIds.push.apply(nextCommentIds, childCommentIds)
          }
        }
      }
      commentIds = nextCommentIds
    }

    this.isCollapsed = shouldCollapse
    this.onCommentsChanged({type: 'collapse'})
  },

  /**
   * Merk the thread as read.
   */
  markAsRead: function() {
    this.lastVisit = moment(Date.now())
    this.newCommentCount = 0
    this.prevMaxCommentId = this.maxCommentId
    this.isNew = {}
    this._storeState()
  },

  /**
   * Persist comment thread state and perform any necessary internal cleanup.
   */
  dispose: function() {
    // Cancel debounced callbacks in case any are pending
    this.numberOfCommentsChanged.cancel()
    this._storeState()
  }
})

module.exports = StoryCommentThreadStore