var React = require('react')
var Link = require('react-router/lib/Link')
var TimeAgo = require('react-timeago').default

var SettingsStore = require('../stores/SettingsStore')
var pluralise = require('../utils/pluralise')
var urlParse = require('url-parse')

var parseHost = function(url) {
  var hostname = (urlParse(url, true)).hostname
  var parts = hostname.split('.').slice(-3)
  if (parts[0] === 'www') {
    parts.shift()
  }
  return parts.join('.')
}

/**
 * Reusable logic for displaying an item.
 */
var ItemMixin = {
  /**
   * Render an item's metadata bar.
   */
  renderItemMeta(item, extraContent) {
    var itemDate = new Date(item.time * 1000)

    if (item.type === 'job') {
      return <div className="Item__meta">
        <TimeAgo date={itemDate} className="Item__time"/>
      </div>
    }

    return <div className="Item__meta">
      <span className="Item__score">
        {item.score} point{pluralise(item.score)}
      </span>{' '}
      <span className="Item__by">
        by <Link to={`/user/${item.by}`}>{item.by}</Link>
      </span>{' '}
      <TimeAgo date={itemDate} className="Item__time"/>
      {' | '}
      <Link to={`/${item.type}/${item.id}`}>
        {item.descendants > 0 ? item.descendants + ' comment' + pluralise(item.descendants) : 'discuss'}
      </Link>
      {extraContent}
    </div>
  },

  /**
   * Render an item's title bar.
   */
  renderItemTitle(item) {
    var hasURL = !!item.url
    var title
    if (item.dead) {
      title = '[dead] ' + item.title
    }
    else {
      title = (hasURL ? <a href={item.url}>{item.title}</a>
                      : <Link to={`/${item.type}/${item.id}`}>{item.title}</Link>)
    }
    return <div className="Item__title" style={{fontSize: SettingsStore.titleFontSize}}>
      {title}
      {hasURL && ' '}
      {hasURL && <span className="Item__host">({parseHost(item.url)})</span>}
    </div>
  }
}

module.exports = ItemMixin
