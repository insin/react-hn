'use strict';

var {SITE_TITLE} = require('./constants')

function setTitle(title) {
  document.title = (title ? title + ' | ' + SITE_TITLE : SITE_TITLE)
}

module.exports = setTitle