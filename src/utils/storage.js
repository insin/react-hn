'use strict';

module.exports = {
  get: function(key, defaultValue) {
    var value = localStorage[key]
    return (typeof value != 'undefined' ? value : defaultValue)
  },
  set: function(key, value) {
    localStorage[key] = value
  }
}
