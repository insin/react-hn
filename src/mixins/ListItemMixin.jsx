'use strict';

var React = require('react')
var {Link} = require('react-router')

var cx = require('../utils/buildClassName')
var pluralise = require('../utils/pluralise')

function filter(arr, cb) {
  if (!arr) { return [] }
  return arr.filter(cb)
}

/**
 * Reusable logic for displaying an item in a list.
 * Must be used in conjunction with ItemMixin for its rendering methods.
 */
var ListItemMixin = {
  getNewThreadCount(item, threadState) {
    if (threadState.lastVisit === null) {
      return 0
    }
    return filter(item.kids, function(threadId) {
      return threadId > threadState.maxCommentId
    }).length
  },

  renderListItem(item, threadState) {
    if (item.deleted) { return null }
    var newThreads = this.getNewThreadCount(item, threadState)
    var hasNewThreads = (newThreads > 0)
    return <li className={cx('ListItem', {'ListItem--dead': item.dead})}>
      {this.renderItemTitle(item)}
      {this.renderItemMeta(item, threadState, (threadState.lastVisit !== null && <span>{' '}
        ({threadState.lastVisit.fromNow()})
        {hasNewThreads && ' | '}
        {hasNewThreads && <Link to={item.type} params={{id: item.id}}>
          {newThreads} new thread{pluralise(newThreads)}
        </Link>}
      </span>))}
    </li>
  }
}

module.exports = ListItemMixin