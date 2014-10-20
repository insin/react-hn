/** @jsx React.DOM */

'use strict';

var React = require('react')

var CommentThreadStore = require('./stores/CommentThreadStore')

var ItemMixin = require('./mixins/ItemMixin')
var ListItemMixin = require('./mixins/ListItemMixin')

/**
 * Display story title and metadata as a list item.
 * The story to display will be passed as a prop.
 */
var DisplayListItem = React.createClass({
  mixins: [ItemMixin, ListItemMixin],

  propTypes: {
    item: React.PropTypes.object.isRequired
  },

  getInitialState: function() {
    return CommentThreadStore.loadState(this.props.item.id)
  },

  render: function() {
    return this.renderListItem(this.props.item)
  }
})

module.exports = DisplayListItem