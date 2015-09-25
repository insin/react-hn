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

function storiesRef(path) {
  return api.child(path)
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
  fetchItem,
  fetchItems,
  storiesRef,
  itemRef,
  userRef,
  updatesRef
}
