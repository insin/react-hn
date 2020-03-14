var {SITE_TITLE} = require('./constants').default

function setTitle(title) {
  if (typeof document === 'undefined') return
  document.title = (title ? title + ' | ' + SITE_TITLE : SITE_TITLE)
}

export default setTitle
