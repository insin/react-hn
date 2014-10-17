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

/**
 * Lookup to filter out any items which appear in the updates feed which can't
 * be displayed by the Updates component.
 */
var updateItemTypes = {
  comment: true
, job: true
, poll: true
, story: true
}

function handleUpdateItems(items) {
  for (var i = 0, l = items.length; i < l; i++) {
    var item = items[i]
    // Silently ignore deleted items (because irony)
    if (item.deleted) { continue }

    if (typeof item.error != 'undefined') {
      if ("production" !== process.env.NODE_ENV) {
        console.warn(
          "An item with an 'error' property was received in the updates " +
          'stream: ' + JSON.stringify(item)
        )
      }
      continue
    }

    if (typeof updateItemTypes[item.type] == 'undefined') {
      if ("production" !== process.env.NODE_ENV) {
        console.warn(
          "An item which can't be displayed by the Updates component was " +
          'received in the updates stream: ' + JSON.stringify(item)
        )
      }
      continue
    }

    if (item.type == 'comment') {
      commentUpdates[item.id] = item
    }
    else {
      storyUpdates[item.id] = item
    }
  }

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