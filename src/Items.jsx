/** @jsx React.DOM */

'use strict';

var React = require('react')
var ReactFireMixin = require('reactfire')

var HNService = require('./services/HNService')
var ListItem = require('./ListItem')
var Paginator = require('./Paginator')
var Spinner = require('./Spinner')

var setTitle = require('./utils/setTitle')

var ITEMS_PER_PAGE = 30

var Items = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {items: []}
  },
  componentWillMount: function() {
    this.bindAsObject(HNService.topStoriesRef(), 'items')
    setTitle()
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
    var hasNext = endIndex < this.state.items.length - 1

    if (this.state.items.length === 0) {
      var dummyItems = []
      for (var i = 0; i < ITEMS_PER_PAGE; i++) {
        dummyItems.push(<li className="ListItem ListItem--loading"><Spinner/></li>)
      }
      return <div className="Items Items--loading">
        <ol className="Items__list" start={startIndex + 1}>{dummyItems}</ol>
        <Paginator route="news" page={page} hasNext={hasNext}/>
      </div>
    }

    var items = this.state.items.slice(startIndex, endIndex)

    return <div className="Items">
      <ol className="Items__list" start={startIndex + 1}>
        {items.map(function(id, index) {
          return <ListItem key={id} id={id}/>
        })}
      </ol>
      <Paginator route="news" page={page} hasNext={hasNext}/>
    </div>
  }
})

module.exports = Items