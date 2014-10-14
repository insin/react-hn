/** @jsx React.DOM */

'use strict';

var React = require('react')
var ReactFireMixin = require('reactfire')
var Router = require('react-router')

var CommentThreadStore = require('./stores/CommentThreadStore')
var ItemStore =  require('./stores/ItemStore')
var Spinner = require('./Spinner')

var cx = require('./utils/buildClassName')
var pluralise = require('./utils/pluralise')
var renderItemTitle = require('./renderItemTitle')
var renderItemMeta = require('./renderItemMeta')

var Link = Router.Link

var ListItem = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {
      item: {}
    , lastVisit: null
    , commentCount: null
    , maxCommentId: null
    }
  },
  componentWillMount: function() {
    this.bindAsObject(ItemStore.itemRef(this.props.id), 'item')
    this.setState(CommentThreadStore.getCommentData(this.props.id))
  },
  render: function() {
    var state = this.state
    var item = state.item
    if (!item.id) { return <li className="ListItem ListItem--loading"><Spinner/></li> }
    if (item.deleted) { return null }
    var newThreads = (state.lastVisit === null ? 0 : item.kids.filter(function(itemId) {
                       return itemId > state.maxCommentId
                     }).length)
    var hasNewThreads = (newThreads > 0)
    return <li className={cx('ListItem', {'ListItem--dead': item.dead})}>
      {renderItemTitle(item)}
      {renderItemMeta(item, state, 'list', (state.lastVisit !== null && <span>{' '}
        ({state.lastVisit.fromNow()})
        {hasNewThreads && ' | '}
        {hasNewThreads && <Link to="item" params={{id: item.id}}>
          <em>{newThreads} new thread{pluralise(newThreads)}</em>
        </Link>}
      </span>))}
    </li>
  }
})

module.exports = ListItem