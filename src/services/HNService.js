'use strict';

var Firebase = require('firebase')

var api = new Firebase('https://hacker-news.firebaseio.com/v0')

function fetchItem(id, cb) {
  itemRef(id).once('value', function(snapshot) {
    cb(snapshot.val())
  })
}

function fetchItems(ids, cb) {
  var items = []
  ids.forEach(function(id) {
    fetchItem(id, addItem)
  })
  function addItem(item) {
    items.push(item)
    if (items.length >= ids.length) {
      cb(items)
    }
  }
}

function topStoriesRef() {
  return api.child('topstories')
}

function itemRef(id) {
  return api.child('item/' + id)
}

function userRef(id) {
    return api.child('user/' + id)
}

function updatesRef() {
  return api.child('updates/items')
}

module.exports = {
  fetchItem: fetchItem
, fetchItems: fetchItems
, topStoriesRef: topStoriesRef
, itemRef: itemRef
, userRef: userRef
, updatesRef: updatesRef
}