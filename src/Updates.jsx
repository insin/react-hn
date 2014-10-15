/** @jsx React.DOM */

'use strict';

var React = require('react')

var Comment = require('./Comment')
var ItemStore =  require('./stores/ItemStore')
var ListItem = require('./ListItem')
var Paginator = require('./Paginator')
var Spinner = require('./Spinner')

var setTitle = require('./utils/setTitle')

var ITEMS_PER_PAGE = 30

var Updates = React.createClass({
  getInitialState: function() {
    return ItemStore.getUpdates()
  },
  componentWillMount: function() {
    this.setTitle(this.props.type)
    ItemStore.startUpdates()
    ItemStore.on('updates', this.handleUpdates)
  },
  componentWillUnmount: function() {
    ItemStore.off('updates', this.handleUpdates)
    ItemStore.stopUpdates()
  },
  componentWillReceiveProps: function(nextProps) {
    if (this.props.type != nextProps.type) {
      this.setTitle(nextProps.type)
    }
  },
  setTitle: function(type) {
    setTitle('New ' + (type == 'comments' ? 'Comments' : 'Links'))
  },
  handleUpdates: function(updates) {
    if (!this.isMounted()) {
      return console.warn('Skipping update of ' + this.props.type + ' as the Updates component is not mounted')
    }
    this.setState(updates)
  },
  getPage: function() {
    return (this.props.query.page && /^\d+$/.test(this.props.query.page)
            ? Math.max(1, Number(this.props.query.page))
            : 1)
  },
  render: function() {
    var page = this.getPage()
    var startIndex = (page - 1) * ITEMS_PER_PAGE
    var endIndex = startIndex + ITEMS_PER_PAGE
    var hasNext = endIndex < this.state.comments.length - 1

    if (this.state.comments.length === 0) {
      return <div className="Updates Updates--loading"><Spinner size="20"/></div>
    }

    var notice = (page == 1 && <p className="Updates__notice">
      This view will currently only update while you have it open - this will be configurable sometime&hellip;
    </p>)

    if (this.props.type == 'comments') {
      var comments = this.state.comments.slice(startIndex, endIndex)
      return <div className="Updates Comments">
        {notice}
        {comments.map(function(comment) {
          return <Comment key={comment.id} id={comment.id} comment={comment}/>
        })}
        <Paginator route="newcomments" page={page} hasNext={hasNext}/>
      </div>
    }
    else {
      var stories = this.state.stories.slice(startIndex, endIndex)
      return <div className="Updates Items">
        {notice}
        <ol className="Items__list" start={startIndex + 1}>
          {stories.map(function(item) {
            return <ListItem key={item.id} id={item.id} item={item}/>
          })}
        </ol>
        <Paginator route="newest" page={page} hasNext={hasNext}/>
      </div>
    }
  }
})

module.exports = Updates