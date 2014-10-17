/** @jsx React.DOM */

'use strict';

var React = require('react')
var moment = require('moment')
var Router = require('react-router')

var pluralise = require('../utils/pluralise')

var Link = Router.Link

var parseHost = (function() {
  var a = document.createElement('a')
  return function(url) {
    a.href = url
    var parts = a.hostname.split('.').slice(-3)
    if (parts[0] === 'www') {
      parts.shift()
    }
    return parts.join('.')
  }
})()

/**
 * Reusable logic for displaying an item.
 */
var ItemMixin = {
  /**
   * Rendering an item's metadata bar.
   */
  renderItemMeta: function (item, state, context, extraContent) {
    var timeMoment = moment(item.time * 1000)
    var isNotJob = (item.type != 'job')
    var comments  = (item.kids && item.kids.length > 0 ? 'comments' : 'discuss')
    if (state.commentCount > 0) {
      comments = state.commentCount + ' comment' + pluralise(state.commentCount)
    }
    if (context == 'list') {
      comments = <Link to={item.type} params={{id: item.id}}>{comments}</Link>
    }

    return <div className="Item__meta">
      {isNotJob && <span className="Item__score">
        {item.score} point{pluralise(item.score)}
      </span>}{' '}
      {isNotJob && <span className="Item__by">
        by <Link to="user" params={{id: item.by}}>{item.by}</Link>
      </span>}{' '}
      <span className="Item__time">{timeMoment.fromNow()}</span>
      {isNotJob && ' | '}
      {isNotJob && comments}
      {extraContent}
    </div>
  },

  /**
   * Render an item's title bar.
   */
  renderItemTitle: function(item) {
    var hasURL = !!item.url
    var title
    if (item.dead) {
      title = '[dead] ' + item.title
    }
    else {
      title = (hasURL ? <a href={item.url}>{item.title}</a>
                      : <Link to={item.type} params={{id: item.id}}>{item.title}</Link>)
    }
    return <div className="Item__title">
      {title}
      {hasURL && ' '}
      {hasURL && <span className="Item__host">({parseHost(item.url)})</span>}
    </div>
  }
}

module.exports = ItemMixin