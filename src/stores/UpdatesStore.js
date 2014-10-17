'use strict';

var EventEmitter = require('events').EventEmitter

var HNService = require('../services/HNService')

var constants = require('../utils/constants')
var extend = require('../utils/extend')

var UPDATE_CACHE_SIZE = constants.UPDATE_CACHE_SIZE

var updatesRef = null
var commentUpdates = {}
var storyUpdates = {}
var sortedCommentUpdates = []
var sortedStoryUpdates = []

function sortByTimeDesc(a, b) {
  return b.time - a.time
}

function objToSortedArray(obj, sortBy) {
  var arr = Object.keys(obj).map(function(id) { return obj[id] })
  arr.sort(sortBy)
  return arr
}

function updateCache(cacheObj) {
  var arr = objToSortedArray(cacheObj, sortByTimeDesc)
  arr.splice(UPDATE_CACHE_SIZE, Math.max(0, arr.length - UPDATE_CACHE_SIZE))
     .forEach(function(item) {
       delete cacheObj[item.id]
     })
  return arr
}

function handleUpdateItems(items) {
  items.forEach(function(item) {
    if (item.deleted || item.error) {
      return
    }
    if (item.type == 'comment') {
      commentUpdates[item.id] = item
    }
    else {
      storyUpdates[item.id] = item
    }
  })

  sortedCommentUpdates = updateCache(commentUpdates)
  sortedStoryUpdates = updateCache(storyUpdates)
  UpdatesStore.emit('updates', UpdatesStore.getCache())
}

var UpdatesStore = extend(new EventEmitter(), {
  start: function() {
    if (updatesRef === null) {
      updatesRef = HNService.updatesRef()
      updatesRef.on('value', function(snapshot) {
        HNService.fetchItems(snapshot.val(), handleUpdateItems)
      })
    }
  },
  getCache: function() {
    return {
      comments: sortedCommentUpdates
    , stories: sortedStoryUpdates
    }
  },
  stop: function() {
    updatesRef.off()
    updatesRef = null
  }
})
UpdatesStore.off = UpdatesStore.removeListener

module.exports = UpdatesStore