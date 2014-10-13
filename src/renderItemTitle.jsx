/** @jsx React.DOM */

'use strict';

var React = require('react')
var Router = require('react-router')

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
 * Reusable display logic for rendering an item's title bar.
 */
function renderItemTitle(item) {
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

module.exports = renderItemTitle