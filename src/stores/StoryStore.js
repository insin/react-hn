var {EventEmitter} = require('events')

var HNService = require('../services/HNService')

var extend = require('../utils/extend')

/**
 * Firebase reference used to stream updates - only one StoryStore instance can
 * be active at a time.
 */
var firebaseRef = null

// Cache objects shared among StoryStore instances, also accessible via static
// functions on the StoryStore constructor.

/**
 * Story ids by type, in rank order. Persisted to sessionStorage.
 * @type Object.<type, Array.<id>>
 */
var idCache = {}

/**
 * Item cache. Persisted to sessionStorage.
 * @type Object.<id, item>
 */
var itemCache = {}

/**
 * Story items in rank order for display, by type.
 * @type Object.<type, Array.<item>>
 */
var storyLists = {}

/**
 * Populate the story list for the given story type from the cache.
 */
function populateStoryList(type) {
  var ids = idCache[type]
  var storyList = storyLists[type]
  for (var i = 0, l = ids.length; i < l; i++) {
    storyList[i] = itemCache[ids[i]] || null
  }
}

function parseJSON(json, defaultValue) {
  return (json ? JSON.parse(json) : defaultValue)
}

class StoryStore extends EventEmitter {
  constructor(type) {
    super()
    this.type = type

    // Ensure cache objects for this type are initialised
    if (!(type in idCache)) {
      idCache[type] = []
    }
    if (!(type in storyLists)) {
      storyLists[type] = []
      populateStoryList(type)
    }

    // Pre-bind event handlers per instance
    this.onStorage = this.onStorage.bind(this)
    this.onStoriesUpdated = this.onStoriesUpdated.bind(this)
  }

  getState() {
    return {
      ids: idCache[this.type],
      stories: storyLists[this.type]
    }
  }

  itemUpdated(item, index) {
    storyLists[this.type][index] = item
    itemCache[item.id] = item
  }

  /**
   * Emit an item id event if a storage key corresponding to an item in the
   * cache has changed.
   */
  onStorage(e) {
    if (itemCache[e.key]) {
      this.emit(e.key)
    }
  }

  /**
   * Handle story id snapshots from Firebase.
   */
  onStoriesUpdated(snapshot) {
    idCache[this.type] = snapshot.val()
    populateStoryList(this.type)
    this.emit('update', this.getState())
  }

  start() {
    firebaseRef = HNService.storiesRef(this.type)
    firebaseRef.on('value', this.onStoriesUpdated)
    if (typeof window === 'undefined') return
    window.addEventListener('storage', this.onStorage)
  }

  stop() {
    if (firebaseRef !== null) {
      firebaseRef.off()
      firebaseRef = null
    }
    if (typeof window === 'undefined') return
    window.removeEventListener('storage', this.onStorage)
  }
}

// Static, cache-related functions
extend(StoryStore, {
  /**
   * Get an item from the cache.
   */
  getItem(id) {
    return itemCache[id] || null
  },

  /**
   * Deserialise caches from sessionStorage.
   */
  loadSession() {
    if (typeof window === 'undefined') return
    idCache = parseJSON(window.sessionStorage.idCache, {})
    itemCache = parseJSON(window.sessionStorage.itemCache, {})
  },

  /**
   * Serialise caches to sessionStorage as JSON.
   */
  saveSession() {
    if (typeof window === 'undefined') return
    window.sessionStorage.idCache = JSON.stringify(idCache)
    window.sessionStorage.itemCache = JSON.stringify(itemCache)
  }
})

module.exports = StoryStore
