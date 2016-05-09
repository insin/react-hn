var extend = require('../utils/extend')
var storage = require('../utils/storage')

var STORAGE_KEY = 'settings'

var SettingsStore = {
  autoCollapse: true,
  replyLinks: true,
  showDead: false,
  showDeleted: false,
  titleFontSize: 18,
  listSpacing: 16,
  offlineMode: false,

  load() {
    var json = storage.get(STORAGE_KEY)
    if (json) {
      extend(this, JSON.parse(json))
    }
  },

  save() {
    storage.set(STORAGE_KEY, JSON.stringify({
      autoCollapse: this.autoCollapse,
      replyLinks: this.replyLinks,
      showDead: this.showDead,
      showDeleted: this.showDeleted,
      titleFontSize: this.titleFontSize,
      listSpacing: this.listSpacing,
      offlineMode: this.offlineMode
    }))
  }
}

module.exports = SettingsStore
