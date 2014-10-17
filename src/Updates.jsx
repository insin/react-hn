/** @jsx React.DOM */

'use strict';

var React = require('react')

var UpdatesStore =  require('./stores/UpdatesStore')

var DisplayListItem = require('./DisplayListItem')
var Comment = require('./Comment')
var Paginator = require('./Paginator')
var Spinner = require('./Spinner')

var PageNumberMixin = require('./mixins/PageNumberMixin')

var pageCalc = require('./utils/pageCalc')
var setTitle = require('./utils/setTitle')

var ITEMS_PER_PAGE = 30

var Updates = React.createClass({
  mixins: [PageNumberMixin],

  getInitialState: function() {
    return UpdatesStore.getUpdates()
  },

  componentWillMount: function() {
    this.setTitle(this.props.type)
    UpdatesStore.start()
    UpdatesStore.on('updates', this.handleUpdates)
  },

  componentWillUnmount: function() {
    UpdatesStore.off('updates', this.handleUpdates)
    UpdatesStore.stop()
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

  render: function() {
    var items= (this.props.type == 'comments' ? this.state.comments: this.state.stories)
    if (items.length === 0) {
      return <div className="Updates Updates--loading"><Spinner size="20"/></div>
    }

    var page = pageCalc(this.getPageNumber(), ITEMS_PER_PAGE, items.length)
    var notice = (page.pageNum == 1 && <p className="Updates__notice">
      This view will currently only update while you have it open - this will be configurable sometime&hellip;
    </p>)

    if (this.props.type == 'comments') {
      return <div className="Updates Comments">
        {notice}
        {items.slice(page.startIndex, page.endIndex).map(function(comment) {
          return <Comment key={comment.id} id={comment.id} comment={comment}/>
        })}
        <Paginator route="newcomments" page={page.pageNum} hasNext={page.hasNext}/>
      </div>
    }
    else {
      return <div className="Updates Items">
        {notice}
        <ol className="Items__list" start={page.startIndex + 1}>
          {items.slice(page.startIndex, page.endIndex).map(function(item) {
            return <DisplayListItem key={item.id} item={item}/>
          })}
        </ol>
        <Paginator route="newest" page={page.pageNum} hasNext={page.hasNext}/>
      </div>
    }
  }
})

module.exports = Updates