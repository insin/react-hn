'use strict';

module.exports = {
  get(key, defaultValue) {
    var value = localStorage[key]
    return (typeof value != 'undefined' ? value : defaultValue)
  },
  set(key, value) {
    localStorage[key] = value
  }
}
