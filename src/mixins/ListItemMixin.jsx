/** @jsx React.DOM */

'use strict';

var React = require('react')
var Router = require('react-router')

var cx = require('../utils/buildClassName')
var pluralise = require('../utils/pluralise')

var Link = Router.Link

function filter(arr, cb) {
  if (!arr) { return [] }
  return arr.filter(cb)
}

/**
 * Reusable logic for displaying an item in a list.
 * Must be used in conjunction with ItemMixin for its rendering methods.
 */
var ListItemMixin = {
  getNewThreadCount: function(item) {
    if (this.state.lastVisit === null) {
      return 0
    }
    return filter(item.kids, function(threadId) {
      return threadId > this.state.maxCommentId
    }.bind(this)).length
  },

  renderListItem: function(item) {
    if (item.deleted) { return null }
    var state = this.state
    var newThreads = this.getNewThreadCount(item)
    var hasNewThreads = (newThreads > 0)
    return <li className={cx('ListItem', {'ListItem--dead': item.dead})}>
      {this.renderItemTitle(item)}
      {this.renderItemMeta(item, state, 'list', (state.lastVisit !== null && <span>{' '}
        ({state.lastVisit.fromNow()})
        {hasNewThreads && ' | '}
        {hasNewThreads && <Link to="item" params={{id: item.id}}>
          <em>{newThreads} new thread{pluralise(newThreads)}</em>
        </Link>}
      </span>))}
    </li>
  }
}

module.exports = ListItemMixin