/** @jsx React.DOM */

'use strict';

var React = require('react')

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
  mixins: [PageNumberMixin],

  getInitialState: function() {
    return TopStore.getTopStories()
  },

  componentWillMount: function() {
    TopStore.on('update', this.handleUpdate)
    TopStore.start()
    TopStore.listenToStorage()
    setTitle()
  },

  componentWillUnmount: function() {
    TopStore.off('update', this.handleUpdate)
    TopStore.stopListeningToStorage()
  },

  handleUpdate: function(topStories) {
    if (!this.isMounted()) {
      if ("production" !== process.env.NODE_ENV) {
        console.warn('Skipping update of top stories as the TopStories component is not mounted')
      }
      return
    }
    this.setState(topStories)
  },

  render: function() {
    var page = pageCalc(this.getPageNumber(), ITEMS_PER_PAGE, TOP_STORIES)

    if (this.state.topStories.length === 0 && this.state.topStoryIds.length === 0) {
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
    for (var i = startIndex; i < endIndex; i++) {
      var item = this.state.topStories[i]
      var id = this.state.topStoryIds[i]
      if (id) {
        rendered.push(<TopStoryListItem key={id} id={id} topIndex={i} cachedItem={item}/>)
      }
      else {
        rendered.push(<TopStoryListItem cachedItem={item}/>)
      }
    }
    return rendered
  }
})

module.exports = TopStories