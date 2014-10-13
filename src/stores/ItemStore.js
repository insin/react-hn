'use strict';

var Firebase = require('firebase')

var api = new Firebase('https://hacker-news.firebaseio.com/v0')

module.exports = {
  topStoriesRef: function() {
    return api.child('topstories')
  },

  itemRef: function(id) {
    return api.child('item/' + id)
  },

  userRef: function(id) {
    return api.child('user/' + id)
  },

  fetchItem: function(id, cb) {
    this.itemRef(id).once('value', function(snapshot) {
      cb(snapshot.val())
    })
  }
}