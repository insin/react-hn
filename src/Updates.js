var React = require('react')

var SettingsStore = require('./stores/SettingsStore').default
var UpdatesStore = require('./stores/UpdatesStore').default

var DisplayListItem = require('./DisplayListItem').default
var DisplayComment = require('./DisplayComment').default
var Paginator = require('./Paginator').default
var Spinner = require('./Spinner').default

var PageNumberMixin = require('./mixins/PageNumberMixin').default

var {ITEMS_PER_PAGE} = require('./utils/constants').default
var pageCalc = require('./utils/pageCalc').default
var setTitle = require('./utils/setTitle').default

function filterDead(item) {
  return !item.dead
}

function filterUpdates(updates) {
  if (!SettingsStore.showDead) {
    return {
      comments: updates.comments.filter(filterDead),
      stories: updates.stories.filter(filterDead)
    }
  }
  return updates
}

var Updates = React.createClass({
  mixins: [PageNumberMixin],

  getInitialState() {
    return filterUpdates(UpdatesStore.getUpdates())
  },

  componentWillMount() {
    this.setTitle(this.props.type)
    UpdatesStore.start()
    UpdatesStore.on('updates', this.handleUpdates)
  },

  componentWillUnmount() {
    UpdatesStore.off('updates', this.handleUpdates)
    UpdatesStore.stop()
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.type !== nextProps.type) {
      this.setTitle(nextProps.type)
    }
  },

  setTitle(type) {
    setTitle('New ' + (type === 'comments' ? 'Comments' : 'Links'))
  },

  handleUpdates(updates) {
    if (!this.isMounted()) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Skipping update of ' + this.props.type + ' as the Updates component is not mounted')
      }
      return
    }
    this.setState(filterUpdates(updates))
  },

  render() {
    var items = (this.props.type === 'comments' ? this.state.comments : this.state.stories)
    if (items.length === 0) {
      return <div className="Updates Updates--loading"><Spinner size="20"/></div>
    }

    var page = pageCalc(this.getPageNumber(), ITEMS_PER_PAGE, items.length)

    if (this.props.type === 'comments') {
      return <div className="Updates Comments">
        {items.slice(page.startIndex, page.endIndex).map(function(comment) {
          return <DisplayComment key={comment.id} id={comment.id} comment={comment}/>
        })}
        <Paginator route="newcomments" page={page.pageNum} hasNext={page.hasNext}/>
      </div>
    }
    else {
      return <div className="Updates Items">
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

export default Updates
