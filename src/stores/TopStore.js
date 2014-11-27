'use strict';

var {EventEmitter} = require('events')

var HNService = require('../services/HNService')

var extend = require('../utils/extend')

/**
 * Firebase reference used to stream updates.
 */
var topStoriesRef = null

/**
 * Top story ids in rank order. Persisted to sessionStorage.
 */
var topStoryIds = null

/**
 * Item id -> item cache object. Persisted to sessionStorage.
 * @prop .comments {Object.<id,item>} comments cache.
 * @prop .stories {Object.<id,item>} story cache.
 */
var topStoriesCache = null

/**
 * Top story items in rank order for display.
 */
var topStories = []

function populateTopStories() {
  for (var i = 0, l = topStoryIds.length; i < l; i++) {
    topStories[i] = topStoriesCache[topStoryIds[i]] || null
  }
}

function handleUpdatedTopStories(snapshot) {
  topStoryIds = snapshot.val()
  populateTopStories()
  TopStore.emit('update', TopStore.getTopStories())
}

/**
 * Emit an item id event if a storage key corresponding to an item in the
 * cache has changed.
 */
function handleStorage(e) {
  if (topStoriesCache[e.key]) {
    TopStore.emit(e.key)
  }
}

var TopStore = extend(new EventEmitter(), {
  loadSession() {
    var json = sessionStorage.topStories
    topStoriesCache = (json ? JSON.parse(json) : {})
    json = sessionStorage.topStoryIds
    topStoryIds = (json ? JSON.parse(json) : [])
    populateTopStories()
  },

  saveSession() {
    sessionStorage.topStories = JSON.stringify(topStoriesCache)
    sessionStorage.topStoryIds = JSON.stringify(topStoryIds)
  },

  start() {
    if (topStoriesRef === null) {
      topStoriesRef = HNService.topStoriesRef()
      topStoriesRef.on('value', handleUpdatedTopStories)
    }
  },

  stop() {
    if (topStoriesRef !== null) {
      topStoriesRef.off()
      topStoriesRef = null
    }
  },

  getItem(id) {
    return topStoriesCache[id] || null
  },

  getTopStories() {
    return {topStories, topStoryIds}
  },

  setItem(index, item) {
    topStories[index] = item
    topStoriesCache[item.id] = item
  },

  listenToStorage() {
    window.addEventListener('storage', handleStorage)
  },

  stopListeningToStorage() {
    window.removeEventListener('storage', handleStorage)
  }
})
TopStore.off = TopStore.removeListener

module.exports = TopStore