'use strict';

var extend = require('../utils/extend')
var storage = require('../utils/storage')

var STORAGE_KEY = 'settings'

var SettingsStore = {
  autoCollapse: true,

  load: function() {
    var json = storage.get(STORAGE_KEY)
    if (json) {
      extend(this, JSON.parse(json))
    }
  },

  save: function() {
    storage.set(STORAGE_KEY, JSON.stringify({
      autoCollapse: this.autoCollapse
    }))
  }
}

module.exports = SettingsStore