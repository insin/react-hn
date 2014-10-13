'use strict';

module.exports = {
  _storage: {},
  get: function(key, defaultValue) {
    var value = this._storage[key]
    return (typeof value != 'undefined' ? value : defaultValue)
  },
  set: function(key, value) {
    this._storage[key] = String(value)
  }
}
