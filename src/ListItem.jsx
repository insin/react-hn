/** @jsx React.DOM */

'use strict';

var React = require('react/addons')
var ReactFireMixin = require('reactfire')
var Router = require('react-router')

var CommentThreadStore = require('./stores/CommentThreadStore')
var ItemStore =  require('./stores/ItemStore')
var Spinner = require('./Spinner')

var cx = require('./utils/buildClassName')
var renderItemTitle = require('./renderItemTitle')
var renderItemMeta = require('./renderItemMeta')

var Link = Router.Link

function max(array) {
  return Math.max.apply(Math, array)
}

var ListItem = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {
      item: {}
    , lastVisit: null
    , commentCount: null
    , prevMaxCommentId: null
    }
  },
  componentWillMount: function() {
    this.bindAsObject(ItemStore.itemRef(this.props.id), 'item')
    this.setState(CommentThreadStore.getCommentStats(this.props.id))
  },
  render: function() {
    var item = this.state.item
    if (!item.id) { return <li className="ListItem ListItem--loading"><Spinner/></li> }
    if (item.deleted) { return null }
    var hasNewComments = (this.state.lastVisit !== null &&
                          max(item.kids) > this.state.prevMaxCommentId)
    return <li className={cx('ListItem', {'ListItem--dead': item.dead})}>
      {renderItemTitle(item)}
      {renderItemMeta(item, this.state, 'list', (this.state.lastVisit !== null && <span>{' '}
        ({this.state.lastVisit.fromNow()})
        {hasNewComments && ' | '}
        {hasNewComments && <Link to="item" params={{id: item.id}}><em>new threads</em></Link>}
      </span>))}
    </li>
  }
})

module.exports = ListItem