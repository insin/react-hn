var extend = require('../utils/extend').default

function CommentThreadStore(item, onCommentsChanged) {
  this.itemId = item.id
  this.onCommentsChanged = onCommentsChanged

  /**
   * Lookup from a comment id to the comment.
   * @type {Object.<id,Comment>}
   */
  this.comments = {}

  /**
   * Lookup from a comment id to its child comment ids.
   * @type {Object.<id,Array.<Number>>}
   */
  this.children = {}
  this.children[item.id] = []

  /**
   * Lookup for new comment ids. Will only contain true.
   * @type {Object.<id,Boolean>}
   */
  this.isNew = {}

  /**
   * Lookup for collapsed state of comment ids. May contain true or false.
   * @type {Object.<id,Boolean>}
   */
  this.isCollapsed = {}

  /**
   * Lookup for dead comment ids
   * @type {Object.<id,Boolean>}
   */
  this.deadComments = {}
}

extend(CommentThreadStore.prototype, {
  /**
   * Get counts of children and new comments under the given comment.
   * @return .children {Number}
   * @return .newComments {Number}
   */
  getChildCounts(comment) {
    var childCount = 0
    var newCommentCount = 0
    var nodes = [comment.id]

    while (nodes.length) {
      var nextNodes = []
      for (var i = 0, l = nodes.length; i < l; i++) {
        var nodeChildren = this.children[nodes[i]]
        if (nodeChildren.length) {
          nextNodes.push.apply(nextNodes, nodeChildren)
        }
      }
      for (i = 0, l = nextNodes.length; i < l; i++) {
        if (this.isNew[nextNodes[i]]) {
          newCommentCount++
        }
      }
      childCount += nextNodes.length
      nodes = nextNodes
    }

    return {
      children: childCount,
      newComments: newCommentCount
    }
  },

  /**
   * Register a comment's appearance in the thread.
   */
  commentAdded(comment) {
    if (comment.deleted) { return }

    this.comments[comment.id] = comment
    this.children[comment.id] = []
    this.children[comment.parent].push(comment.id)
    if (comment.dead) {
      this.deadComments[comment.id] = true
    }
  },

  /**
   * Register a comment's deletion from the thread.
   */
  commentDeleted(comment) {
    // Comments which initially failed to load (null from Firebase API) can be
    // deleted by the time the API catches up.
    if (!comment) { return }

    delete this.comments[comment.id]
    var siblings = this.children[comment.parent]
    siblings.splice(siblings.indexOf(comment.id), 1)
    if (comment.dead) {
      delete this.deadComments[comment.id]
    }
  },

  toggleCollapse(commentId) {
    this.isCollapsed[commentId] = !this.isCollapsed[commentId]
    this.onCommentsChanged({type: 'collapse'})
  }
})

export default CommentThreadStore
