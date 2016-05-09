var HNService = require('../services/HNService')
var HNServiceRest = require('../services/HNServiceRest')

var StoryStore = require('./StoryStore')
var UpdatesStore = require('./UpdatesStore')
var SettingsStore = require('./SettingsStore')
var commentParentLookup = {}
var titleCache = {}

function fetchCommentParent(comment, cb, result) {
  var commentId = comment.id
  var parentId = comment.parent

  while (commentParentLookup[parentId] || titleCache[parentId]) {
    // We just saved ourselves an item fetch
    result.itemCount++
    result.cacheHits++

    // The parent is a known non-comment
    if (titleCache[parentId]) {
      if (result.itemCount === 1) { result.parent = titleCache[parentId] }
      result.op = titleCache[parentId]
      cb(result)
      return
    }

    // The parent is a known comment
    if (commentParentLookup[parentId]) {
      if (result.itemCount === 1) { result.parent = {id: parentId, type: 'comment'} }
      // Set the parent comment's ids up for the next iteration
      commentId = parentId
      parentId = commentParentLookup[parentId]
    }
  }

  // The parent of the current comment isn't known, so we'll have to fetch it
  ItemStore.getItem(parentId, function(parent) {
    result.itemCount++
    // Add the current comment's parent to the lookup for next time
    commentParentLookup[commentId] = parentId
    if (parent.type === 'comment') {
      commentParentLookup[parent.id] = parent.parent
    }
    processCommentParent(parent, cb, result)
  }, result)
}

function processCommentParent(item, cb, result) {
  if (result.itemCount === 1) {
    result.parent = item
  }
  if (item.type !== 'comment') {
    result.op = item
    titleCache[item.id] = {
      id: item.id,
      type: item.type,
      title: item.title
    }
    cb(result)
  }
  else {
    fetchCommentParent(item, cb, result)
  }
}

var ItemStore = {
  getItem(id, cb, result) {
    var cachedItem = this.getCachedItem(id)
    if (cachedItem) {
      if (result) {
        result.cacheHits++
      }
      setImmediate(cb, cachedItem)
    }
    else {
      if (SettingsStore.offlineMode) {
        HNServiceRest.fetchItem(id, cb)
      }
      else {
        HNService.fetchItem(id, cb)
      }
    }
  },

  getCachedItem(id) {
    return StoryStore.getItem(id) || UpdatesStore.getItem(id) || null
  },

  getCachedStory(id) {
    return StoryStore.getItem(id) || UpdatesStore.getStory(id) || null
  },

  fetchCommentAncestors(comment, cb) {
    var startTime = Date.now()
    var result = {itemCount: 0, cacheHits: 0}
    fetchCommentParent(comment, function() {
      result.timeTaken = Date.now() - startTime
      setImmediate(cb, result)
    }, result)
  }
}

module.exports = ItemStore
