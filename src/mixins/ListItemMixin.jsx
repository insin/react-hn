var React = require('react')
var {Link} = require('react-router')

var SettingsStore = require('../stores/SettingsStore')
var cx = require('../utils/buildClassName')

/**
 * Reusable logic for displaying an item in a list.
 * Must be used in conjunction with ItemMixin for its rendering methods.
 */
var ListItemMixin = {
  getNewCommentCount(item, threadState) {
    if (threadState.lastVisit === null) {
      return 0
    }
    return item.descendants - threadState.commentCount
  },

  renderListItem(item, threadState) {
    if (item.deleted) { return null }
    var newCommentCount = this.getNewCommentCount(item, threadState)
    return <li className={cx('ListItem', {'ListItem--dead': item.dead})} style={{marginBottom: SettingsStore.listSpacing}}>
      {this.renderItemTitle(item)}
      {this.renderItemMeta(item, (newCommentCount > 0 && <span className="ListItem__newcomments">{' '}
        (<Link to={`/${item.type}/${item.id}`}>
          {newCommentCount} new
        </Link>)
      </span>))}
    </li>
  }
}

module.exports = ListItemMixin
