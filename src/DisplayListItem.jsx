/** @jsx React.DOM */

'use strict';

var React = require('react')

var CommentThreadStore = require('./stores/CommentThreadStore')

var ItemMixin = require('./mixins/ItemMixin')
var ListItemMixin = require('./mixins/ListItemMixin')

var DisplayListItem = React.createClass({
  mixins: [ItemMixin, ListItemMixin],

  propTypes: {
    item: React.PropTypes.object.isRequired
  },

  getInitialState: function() {
    return CommentThreadStore.loadState(this.props.item.id)
  },

  render: function() {
    var item = this.props.item
    if (item.deleted) { return null }
    return this.renderListItem(item)
  }
})

module.exports = DisplayListItem