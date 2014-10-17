'use strict';

var constants = require('../utils/constants')
var pageCalc = require('../utils/pageCalc')

var ITEMS_PER_PAGE = constants.ITEMS_PER_PAGE
var TOP_STORIES = constants.TOP_STORIES

var topstories = null

var TopStore = {
  setItem: function(index, item) {
    topstories[index] = item
  },

  getPageCache: function(pageNum) {
    if (topstories === null) {
      var json = sessionStorage.topstories
      topstories = (json ? JSON.parse(json) : [])
    }
    var page = pageCalc(pageNum, ITEMS_PER_PAGE, TOP_STORIES)
    return topstories.slice(page.startIndex, page.endIndex)
  },

  saveSession: function() {
    sessionStorage.topstories = JSON.stringify(topstories)
  }
}

module.exports = TopStore