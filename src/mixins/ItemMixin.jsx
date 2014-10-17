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
   * Render an item's metadata bar.
   */
  renderItemMeta: function (item, extraContent) {
    var timeMoment = moment(item.time * 1000)
    var comments  = (item.kids && item.kids.length > 0 ? 'comments' : 'discuss')
    if (this.state.commentCount > 0) {
      comments = this.state.commentCount + ' comment' + pluralise(this.state.commentCount)
    }
    // Item comment/permalink should only be displayed when in a list
    if (this.constructor.displayName.indexOf('ListItem') != -1) {
      comments = <Link to={item.type} params={{id: item.id}}>{comments}</Link>
    }

    if (item.type == 'job') {
      return <div className="Item__meta">
        <span className="Item__time">{timeMoment.fromNow()}</span>
      </div>
    }
    return <div className="Item__meta">
      <span className="Item__score">
        {item.score} point{pluralise(item.score)}
      </span>{' '}
      <span className="Item__by">
        by <Link to="user" params={{id: item.by}}>{item.by}</Link>
      </span>{' '}
      <span className="Item__time">
        {timeMoment.fromNow()}
      </span>
      {' | '}
      {comments}
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