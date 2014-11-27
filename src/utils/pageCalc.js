'use strict';

function pageCalc(pageNum, pageSize, numItems) {
  var startIndex = (pageNum - 1) * pageSize
  var endIndex = Math.min(numItems, startIndex + pageSize)
  var hasNext = endIndex < numItems - 1
  return {pageNum, startIndex, endIndex, hasNext}
}

module.exports = pageCalc