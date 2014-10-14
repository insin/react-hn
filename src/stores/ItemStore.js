'use strict';

var EventEmitter = require('events').EventEmitter
var Firebase = require('firebase')

var api = new Firebase('https://hacker-news.firebaseio.com/v0')

var ItemStore = new EventEmitter()
ItemStore.off = ItemStore.removeListener

ItemStore.topStoriesRef = function() {
  return api.child('topstories')
}

ItemStore.itemRef = function(id) {
  return api.child('item/' + id)
}

ItemStore.userRef = function(id) {
    return api.child('user/' + id)
}

ItemStore.fetchItem = function(id, cb) {
  this.itemRef(id).once('value', function(snapshot) {
    cb(snapshot.val())
  })
}

ItemStore.fetchItems =function(ids, cb) {
  var items = []
  ids.forEach(function(id) {
    ItemStore.fetchItem(id, addItem)
  })
  function addItem(item) {
    items.push(item)
    if (items.length >= ids.length) {
      cb(items)
    }
  }
}

ItemStore.startUpdates = function() {
  if (updatesRef === null) {
    updatesRef = api.child('updates/items')
    updatesRef.on('value', function(snapshot) {
      ItemStore.fetchItems(snapshot.val(), handleUpdateItems)
    })
  }
}

ItemStore.getUpdates = function() {
  return {
    comments: sortedCommentUpdates
  , stories: sortedStoryUpdates
  }
}

ItemStore.emitUpdates = function() {
  this.emit('updates', this.getUpdates())
}

ItemStore.stopUpdates = function() {
  updatesRef.off()
  updatesRef = null
}

var UPDATE_CACHE_SIZE = 200

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

  ItemStore.emitUpdates()
}

module.exports = ItemStore