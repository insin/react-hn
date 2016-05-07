var {SITE_TITLE} = require('./constants')

function setTitle(title) {
  if (typeof document === 'undefined') return
  document.title = (title ? title + ' | ' + SITE_TITLE : SITE_TITLE)
}

module.exports = setTitle
