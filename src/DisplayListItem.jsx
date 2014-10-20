/** @jsx React.DOM */

'use strict';

var React = require('react')

var StoryCommentThreadStore = require('./stores/StoryCommentThreadStore')

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
    return StoryCommentThreadStore.loadState(this.props.item.id)
  },

  render: function() {
    return this.renderListItem(this.props.item)
  }
})

module.exports = DisplayListItem