/** @jsx React.DOM */

'use strict';

var React = require('react')
var moment = require('moment')
var Router = require('react-router')

var pluralise = require('./utils/pluralise')

var Link = Router.Link

/**
 * Reusable display logic for rendering an item's metadata bar.
 */
function renderItemMeta(item, state, context, extraContent) {
  var timeMoment = moment(item.time * 1000)
  var isNotJob = (item.type != 'job')
  var comments  = (item.kids && item.kids.length > 0 ? 'comments' : 'discuss')
  if (state.lastVisit !== null) {
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
}

module.exports = renderItemMeta