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

var UPDATE_CACHE_SIZE = 200

var updatesRef = null
var commentUpdates = {}
var storyUpdates = {}

ItemStore.startUpdates = function() {
  if (updatesRef === null) {
    updatesRef = api.child('updates/items')
    updatesRef.on('value', function(snapshot) {
      ItemStore.fetchItems(snapshot.val(), handleUpdateItems)
    })
  }
}

ItemStore.stopUpdates = function() {
  updatesRef.off()
  updatesRef = null
}

function sortByTimeDesc(a, b) {
  return b.time - a.time
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

  var comments = Object.keys(commentUpdates).map(function(id) { return commentUpdates[id] })
  comments.sort(sortByTimeDesc)
  comments.splice(UPDATE_CACHE_SIZE, Math.max(0, comments.length - UPDATE_CACHE_SIZE))
          .forEach(function(item) {
             delete commentUpdates[item.id]
           })

  var stories = Object.keys(storyUpdates).map(function(id) { return storyUpdates[id] })
  stories.sort(sortByTimeDesc)
  stories.splice(UPDATE_CACHE_SIZE, Math.max(0, stories.length - UPDATE_CACHE_SIZE))
         .forEach(function(item) {
            delete storyUpdates[item.id]
          })

  ItemStore.emit('updates', {
    comments: comments
  , stories: stories
  })
}

module.exports = ItemStore