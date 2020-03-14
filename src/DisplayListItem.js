var React = require('react')

var StoryCommentThreadStore = require('./stores/StoryCommentThreadStore').default

var ItemMixin = require('./mixins/ItemMixin').default
var ListItemMixin = require('./mixins/ListItemMixin').default

/**
 * Display story title and metadata as a list item.
 * The story to display will be passed as a prop.
 */
var DisplayListItem = React.createClass({
  mixins: [ItemMixin, ListItemMixin],

  propTypes: {
    item: React.PropTypes.object.isRequired
  },

  componentWillMount() {
    this.threadState = StoryCommentThreadStore.loadState(this.props.item.id)
  },

  render() {
    return this.renderListItem(this.props.item, this.threadState)
  }
})

export default DisplayListItem
