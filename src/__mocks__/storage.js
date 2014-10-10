'use strict';

module.exports = {
  _store: {},
  get: function(key, defaultValue) {
    var value = this._store[key]
    return (typeof value != 'undefined' ? value : defaultValue)
  },
  set: function(key, value) {
    this._store[key] = String(value)
  }
}
