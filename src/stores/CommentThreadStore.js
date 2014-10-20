'use strict';

var extend = require('../utils/extend')

function CommentThreadStore(itemId, onCommentsChanged) {
  this.itemId = itemId
  this.onCommentsChanged = onCommentsChanged

  /** @type {Object.<id,Array.<Number>>} */
  this.commentChildren = {}
  this.commentChildren[itemId] = []

  /** @type {Object.<id,Boolean>} */
  this.newCommentIds = {}
}

extend(CommentThreadStore.prototype, {
  /**
   * Get counts of children and new comments under the given comment.
   * @return .children {Number}
   * @return .newComments {Number}
   */
  getChildCounts: function(comment) {
    var childCount = 0
    var newCommentCount = 0
    var nodes = [comment.id]

    while (nodes.length) {
      var nextNodes = []
      for (var i = 0, l = nodes.length; i < l; i++) {
        var nodeChildren = this.commentChildren[nodes[i]]
        if (nodeChildren.length) {
          nextNodes.push.apply(nextNodes, nodeChildren)
        }
      }
      for (i = 0, l = nextNodes.length; i < l; i++) {
        if (this.newCommentIds[nextNodes[i]]) {
          newCommentCount++
        }
      }
      childCount += nextNodes.length
      nodes = nextNodes
    }

    return {
      children: childCount
    , newComments: newCommentCount
    }
  },

  /**
   * Register a comment's appearance in the thread.
   */
  commentAdded: function(comment) {
    this.commentChildren[comment.id] = []
    this.commentChildren[comment.parent].push(comment.id)
  },

  /**
   * Register a comment's deletion from the thread.
   */
  commentDeleted: function(comment) {
    var siblings = this.commentChildren[comment.parent]
    siblings.splice(siblings.indexOf(comment.id), 1)
  }
})

module.exports = CommentThreadStore