'use strict';

var constants = require('../utils/constants')
var pageCalc = require('../utils/pageCalc')

var ITEMS_PER_PAGE = constants.ITEMS_PER_PAGE
var TOP_STORIES = constants.TOP_STORIES

var topstories = null

function loadSession() {
  var json = sessionStorage.topstories
  topstories = (json ? JSON.parse(json) : [])
}

var TopStore = {
  setItem: function(index, item) {
    if (topstories === null) {
      loadSession()
    }
    topstories[index] = item
  },

  getPageCache: function(pageNum) {
    if (topstories === null) {
      loadSession()
    }
    var page = pageCalc(pageNum, ITEMS_PER_PAGE, TOP_STORIES)
    return topstories.slice(page.startIndex, page.endIndex)
  },

  saveSession: function() {
    if (topstories !== null) {
      sessionStorage.topstories = JSON.stringify(topstories)
    }
  }
}

module.exports = TopStore