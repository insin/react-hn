'use strict';

var CommentThreadStore = require('./CommentThreadStore')
var SettingsStore = require('./SettingsStore')

var debounce = require('../utils/cancellableDebounce')
var extend = require('../utils/extend')
var pluralise = require('../utils/pluralise')
var storage = require('../utils/storage')

/**
 * Load persisted comment thread state.
 * @return .lastVisit {Date} null if the item hasn't been visited before.
 * @return .commentCount {Number} 0 if the item hasn't been visited before.
 * @return .maxCommentId {Number} 0 if the item hasn't been visited before.
 */
function loadState(itemId) {
  var json = storage.get(itemId)
  if (json) {
    return JSON.parse(json)
  }
  return {
    lastVisit: null
  , commentCount: 0
  , maxCommentId: 0
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
  /**
   * The number of descendants the story has according to the API.
   * This count includes deleted comments, which aren't accessible via the API,
   * so a thread with deleted comments (example story id: 9273709) will never
   * load this number of comments
   * However, we still need to persist the last known descendant count in order
   * to determine how many new comments there are when displaying the story on a
   * list page.
   */
  this.itemDescendantCount = item.descendants

  var initialState = loadState(item.id)
  /** Time of last visit to the story. */
  this.lastVisit = initialState.lastVisit
  /** Max comment id on the last visit - determines which comments are new. */
  this.prevMaxCommentId = initialState.maxCommentId
  /** Is this the user's first time viewing the story? */
  this.isFirstVisit = (initialState.lastVisit === null)

  // Trigger an immediate check for thread load completion if the item was not
  // retrieved from the cache, so is the latest version. This completes page
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
  firstLoadComplete() {
    this.lastVisit = Date.now()
    this.prevMaxCommentId = this.maxCommentId
    this.isFirstVisit = false
    this.onCommentsChanged({type: 'first_load_complete'})
  },

  /**
   * Check whether the number of comments has reached the expected number yet.
   */
  checkLoadCompletion() {
    if (this.loading && this.commentCount >= this.expectedComments) {
      if ("production" !== process.env.NODE_ENV) {
        console.info(
          'Initial load of ' +
           this.commentCount + ' comment' + pluralise(this.commentCount) +
          ' for ' + this.itemId + ' took ' +
          ((Date.now() - this.startedLoading) / 1000).toFixed(2) + 's'
        )
      }
      this.loading = false
      if (this.isFirstVisit) {
        this.firstLoadComplete()
      }
      else if (SettingsStore.autoCollapse && this.newCommentCount > 0) {
        this.collapseThreadsWithoutNewComments()
      }
      this._storeState()
    }
  },

  /**
   * Persist comment thread state.
   */
  _storeState() {
    storage.set(this.itemId, JSON.stringify({
      lastVisit: Date.now()
    , commentCount: this.itemDescendantCount
    , maxCommentId: this.maxCommentId
    }))
  },

  /**
   * The item this comment thread belongs to got updated.
   */
  itemUpdated(item) {
    this.itemDescendantCount = item.descendants
  },

  /**
   * A comment got loaded initially or added later.
   */
  commentAdded(comment) {
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

    // Dead comments don't contribute to the comment count if showDead is off
    if (comment.dead && !SettingsStore.showDead) {
      this.expectedComments--
    }
    else {
      this.commentCount++
    }
    // Add the number of kids the comment has to the expected total for the
    // initial load.
    if (this.loading && comment.kids) {
      this.expectedComments += comment.kids.length
    }
    // Register the comment as new if it's new, unless it's dead and showDead is off
    if (this.prevMaxCommentId > 0 &&
        comment.id > this.prevMaxCommentId &&
        (!comment.dead || SettingsStore.showDead)) {
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
   * A comment which hasn't loaded yet is being delayed.
   */
  commentDelayed(commentId) {
    // Don't wait for delayed comments
    this.expectedComments--
  },

  /**
   * A comment which wasn't previously deleted became deleted.
   */
  commentDeleted(comment) {
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

  /**
   * A comment which wasn't previously dead became dead.
   */
  commentDied(comment) {
    if (!SettingsStore.showDead) {
      this.commentCount--
      if (this.isNew[comment.id]) {
        this.newCommentCount--;
        delete this.isNew[comment.id]
      }
    }
  },

  /**
   * Change the expected number of comments if an update was received during
   * initial loding and trigger a re-check of loading completion.
   */
  adjustExpectedComments(change) {
    this.expectedComments += change
    this.checkLoadCompletion()
  },

  collapseThreadsWithoutNewComments() {
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
  markAsRead() {
    this.lastVisit = Date.now()
    this.newCommentCount = 0
    this.prevMaxCommentId = this.maxCommentId
    this.isNew = {}
    this._storeState()
  },

  /**
   * Persist comment thread state and perform any necessary internal cleanup.
   */
  dispose() {
    // Cancel debounced callbacks in case any are pending
    this.numberOfCommentsChanged.cancel()
    this._storeState()
  }
})

module.exports = StoryCommentThreadStore