'use strict';

var _store = {}

module.exports = {
  setStore: function(store) {
    _store = store
  },
  getStore: function() {
    return _store
  },
  get: function(key, defaultValue) {
    var value = _store[key]
    return (typeof value != 'undefined' ? value : defaultValue)
  },
  set: function(key, value) {
    _store[key] = String(value)
  }
}
