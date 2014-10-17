/** @jsx React.DOM */

'use strict';

var React = require('react')
var ReactFireMixin = require('reactfire')

var HNService = require('./services/HNService')
var TopStore = require('./stores/TopStore')

var PageNumberMixin = require('./mixins/PageNumberMixin')
var Paginator = require('./Paginator')
var Spinner = require('./Spinner')
var TopStoryListItem = require('./TopStoryListItem')

var constants = require('./utils/constants')
var pageCalc = require('./utils/pageCalc')
var setTitle = require('./utils/setTitle')

var ITEMS_PER_PAGE = constants.ITEMS_PER_PAGE
var TOP_STORIES = constants.TOP_STORIES

var TopStories = React.createClass({
  mixins: [PageNumberMixin, ReactFireMixin],

  getInitialState: function() {
    return {
      items: TopStore.getPageCache(this.getPageNumber())
    , itemIds: []
    }
  },

  componentWillMount: function() {
    this.bindAsObject(HNService.topStoriesRef(), 'itemIds')
    setTitle()
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },

  componentWillUnmount: function() {
    TopStore.saveSession()
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  },

  handleBeforeUnload: function() {
    TopStore.saveSession()
  },

  render: function() {
    var page = pageCalc(this.getPageNumber(), ITEMS_PER_PAGE, TOP_STORIES)

    if (this.state.itemIds.length === 0 && this.state.items.length === 0) {
      var dummyItems = []
      for (var i = page.startIndex; i < page.endIndex; i++) {
        dummyItems.push(<li className="ListItem ListItem--loading"><Spinner/></li>)
      }
      return <div className="Items Items--loading">
        <ol className="Items__list" start={page.startIndex + 1}>{dummyItems}</ol>
        <Paginator route="news" page={page.pageNum} hasNext={page.hasNext}/>
      </div>
    }

    return <div className="Items">
      <ol className="Items__list" start={page.startIndex + 1}>
        {this.renderItems(page.startIndex, page.endIndex)}
      </ol>
      <Paginator route="news" page={page.pageNum} hasNext={page.hasNext}/>
    </div>
  },

  renderItems: function(startIndex, endIndex) {
    var rendered = []
    for (var idIndex = startIndex, itemIndex = 0;
         idIndex < endIndex;
         idIndex++, itemIndex++) {
      var item = this.state.items[itemIndex]
      var id = this.state.itemIds[idIndex]
      if (id) {
        rendered.push(<TopStoryListItem key={id} id={id} topIndex={idIndex} cachedItem={item}/>)
      }
      else {
        rendered.push(<TopStoryListItem cachedItem={item}/>)
      }
    }
    return rendered
  }
})

module.exports = TopStories