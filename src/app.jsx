/** @jsx React.DOM */

'use strict';

var moment = require('moment')
var React = require('react/addons')
var ReactFireMixin = require('reactfire')
var Router = require('react-router')

var cx = require('./buildClassName')
var CommentThreadStore = require('./CommentThreadStore')
var ItemStore =  require('./ItemStore')

// Expose React globally for React Developer Tools
window.React = React

var DefaultRoute = Router.DefaultRoute
var Link = Router.Link
var Navigation = Router.Navigation
var NotFoundRoute = Router.NotFoundRoute
var Route = Router.Route
var Routes = Router.Routes

var ITEMS_PER_PAGE = 30
var SITE_TITLE = 'React Hacker News'

function max(array) {
  return Math.max.apply(Math, array)
}

/**
 * Describe the time from now until the given time in terms of units without any
 * "a" or "an" prefixes.
 */
function timeUnitsAgo(_moment) {
  return _moment.fromNow(true).replace(/^an? /, '')
}

function pluralise(n) {
  return (n == 1 ? '' : 's')
}

var parseHost = (function() {
  var a = document.createElement('a')
  return function(url) {
    a.href = url
    var parts = a.hostname.split('.').slice(-3)
    if (parts[0] === 'www') {
      parts.shift()
    }
    return parts.join('.')
  }
})()

function setTitle(title) {
  document.title = (title ? title + ' | ' + SITE_TITLE : SITE_TITLE)
}

// TODO Implement GIF-based fallback for IE9 and another non-animating browsers
//      See https://github.com/tobiasahlin/SpinKit for how-to
var Spinner = React.createClass({
  getDefaultProps: function() {
    return {size: 6, spacing: 2}
  },
  render: function() {
    var bounceSize = this.props.size + 'px'
    var bounceStyle = {height: bounceSize, width: bounceSize, marginRight: this.props.spacing + 'px'}
    return <div className="Spinner" style={{width: ((this.props.size + this.props.spacing) * 3) + 'px'}}>
      <div className="bounce1" style={bounceStyle}/>
      <div className="bounce2" style={bounceStyle}/>
      <div className="bounce3" style={bounceStyle}/>
    </div>
  }
})

var NotFound = React.createClass({
  render: function() {
    return <h2>Not found</h2>
  }
})

var UserProfile = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {user: {}}
  },
  componentWillMount: function() {
    this.bindAsObject(ItemStore.userRef(this.props.params.id), 'user')
  },
  componentWillUpdate: function(nextProps, nextState) {
    if (this.state.user.id != nextState.user.id) {
      setTitle('Profile: ' + nextState.user.id)
    }
  },
  componentWillReceiveProps: function(nextProps) {
    if (this.props.params.id != nextProps.params.id) {
      this.unbind('user')
      this.bindAsObject(ItemStore.userRef(nextProps.params.id), 'user')
    }
  },
  render: function() {
    var user = this.state.user
    if (!user.id) {
      return <div className="UserProfile UserProfile--loading">
        <h4>{this.props.params.id}</h4>
        <Spinner size="20"/>
      </div>
    }
    var createdMoment = moment(user.created * 1000)
    return <div className="UserProfile">
      <h4>{user.id}</h4>
      <dl>
        <dt>Created</dt>
        <dd>{createdMoment.fromNow()} ({createdMoment.format('LL')})</dd>
        <dt>Karma</dt>
        <dd>{user.karma}</dd>
        <dt>Delay</dt>
        <dd>{user.delay}</dd>
        {user.about && <dt>About</dt>}
        {user.about && <dd><div className="UserProfile__about" dangerouslySetInnerHTML={{__html: user.about}}/></dd>}
      </dl>
    </div>
  }
})

// TODO User submissions

// TODO User  comments

var Comment = React.createClass({
  mixins: [ReactFireMixin, Navigation],
  getDefaultProps: function() {
    return {
      showSpinnerDeep: false
    , isPermalinkThread: false
    , level: 0
    }
  },
  getInitialState: function() {
    return {
      comment: {}
    , collapsed: false
    , isNew: false
    }
  },
  componentWillMount: function() {
    // TODO Look into manual Firebase binding as a solution for components which
    //      need to redirect after loading an object, without setting it on state.
    //      This currently causes checks to be required both componentWillUpdate()
    //      (to actually do the redirect) and render() (to avoid trying to render
    //      with an unexpected item type).
    this.bindAsObject(ItemStore.itemRef(this.props.id || this.props.params.id), 'comment')
    // Set our isNew state from the comment store
    if (!(this.props.isPermalinkThread || this.isTopLevel())) {
      this.setState(CommentThreadStore.addComment(this.props.id))
    }
  },
  componentWillUpdate: function(nextProps, nextState) {
    if (this.isTopLevel() && this.state.comment.id != nextState.comment.id) {
      // Comment parent links point to the comment route - we need to redirect
      // to the appropriate route if the parent link led to a non-comment item.
      if (nextState.comment.type != 'comment') {
        this.replaceWith(nextState.comment.type, {id: nextState.comment.id})
        return
      }
      setTitle('Comment by ' + nextState.comment.by)
    }
  },
  componentWillReceiveProps: function(nextProps) {
    if (this.isTopLevel() && this.props.params.id != nextProps.params.id) {
      this.unbind('comment')
      this.bindAsObject(ItemStore.itemRef(nextProps.params.id), 'comment')
    }
  },
  /**
   * Determine if this comment is being viewed via its permalink.
   */
  isTopLevel: function() {
    return !!this.props.params
  },
  toggleCollapsed: function() {
    this.setState({collapsed: !this.state.collapsed})
  },
  render: function() {
    var comment = this.state.comment
    var isTopLevel = this.isTopLevel()
    var showSpinnerDeep = this.props.showSpinnerDeep
    var isPermalinkThread = this.props.isPermalinkThread
    if (!comment.id) {
      var loadingClassName = cx(
        'Comment Comment--loading Comment--level' + this.props.level,
        {'Comment--new': this.state.isNew
      })
      return <div className={loadingClassName}>
        {(isTopLevel || showSpinnerDeep) && <Spinner size="20"/>}
        {comment.error && <p>Error loading comment - this may be because the author has configured a delay.</p>}
      </div>
    }
    // XXX Don't render anything if we're replacing the route after loading a non-comment
    if (comment.type != 'comment') { return null }
    // Don't render anything for deleted comments with no kids
    if (comment.deleted && !comment.kids) { return null }
    var className = cx('Comment Comment--level' + this.props.level, {
      'Comment--collapsed': this.state.collapsed
    , 'Comment--dead': comment.dead
    , 'Comment--deleted': comment.deleted
    , 'Comment--new': this.state.isNew
    })
    var timeMoment = moment(comment.time * 1000)

    return <div className={className}>
      <div className="Comment__content">
        {comment.deleted && <div className="Comment__meta">
          {this.renderCollapseControl()}{' '}
          [deleted]
        </div>}
        {!comment.deleted && <div className="Comment__meta">
          <span className="Comment__collapse" onClick={this.toggleCollapsed} onKeyPress={this.toggleCollapsed} tabIndex="0">
            [{this.state.collapsed ? '+' : '–'}]
          </span>{' '}
          <Link to="user" params={{id: comment.by}} className="Comment__user">{comment.by}</Link>{' '}
          {timeMoment.fromNow()}{' | '}
          {!isTopLevel && <Link to="comment" params={{id: comment.id}}>link</Link>}
          {isTopLevel && <Link to="comment" params={{id: comment.parent}}>parent</Link>}
          {comment.dead &&  ' | [dead]'}
        </div>}
        {!comment.deleted && <div className="Comment__text">
          <div dangerouslySetInnerHTML={{__html: comment.text}}/>
        </div>}
      </div>
      {comment.kids && <div className="Comment__kids">
        {comment.kids.map(function(id, index) {
          return <Comment key={id} id={id} level={this.props.level + 1}
                   showSpinnerDeep={showSpinnerDeep || (isTopLevel && index === 0)}
                   isPermalinkThread={isPermalinkThread  || isTopLevel}
                  />
        }.bind(this))}
      </div>}
    </div>
  }
})

var PollOption = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {pollopt: {}}
  },
  componentWillMount: function() {
    this.bindAsObject(ItemStore.itemRef(this.props.id), 'pollopt')
  },
  render: function() {
    var pollopt = this.state.pollopt
    if (!pollopt.id) { return <div className="PollOption PollOption--loading"></div> }
    return <div className="PollOption">
      <div className="PollOption__text">
        {pollopt.text}
      </div>
      <div className="PollOption__score">
        {pollopt.score} point{pluralise(pollopt.score)}
      </div>
    </div>
  }
})

/**
 * Reusable display logic for rendering an item's title bar.
 */
function renderItemTitle(item) {
  var hasURL = !!item.url
  var title
  if (item.dead) {
    title = '[dead] ' + item.title
  }
  else {
    title = (hasURL ? <a href={item.url}>{item.title}</a>
                    : <Link to={item.type} params={{id: item.id}}>{item.title}</Link>)
  }
  return <div className="Item__title">
    {title}
    {hasURL && ' '}
    {hasURL && <span className="Item__host">({parseHost(item.url)})</span>}
  </div>
}

/**
 * Reusable display logic for rendering an item's metadata bar.
 */
function renderItemMeta(item, state, linkToComments /* Pardon my boolean trap */) {
  var timeMoment = moment(item.time * 1000)
  var isNotJob = (item.type != 'job')
  var comments  = (item.kids && item.kids.length > 0 ? 'comments' : 'discuss')
  if (state.lastVisit !== null) {
    comments = state.commentCount + ' comment' + pluralise(state.commentCount)
  }
  if (linkToComments) {
    comments = <Link to={item.type} params={{id: item.id}}>{comments}</Link>
  }
  // We can determine if a list item has new comments if there are new immediate
  // child comments.
  var hasNewComments = (linkToComments &&
                        state.lastVisit !== null &&
                        max(item.kids) > state.prevMaxCommentId)

  return <div className="Item__meta">
    {isNotJob && <span className="Item__score">
      {item.score} point{pluralise(item.score)}
    </span>}{' '}
    {isNotJob && <span className="Item__by">
      by <Link to="user" params={{id: item.by}}>{item.by}</Link>
    </span>}{' '}
    <span className="Item__time">{timeMoment.fromNow()}</span>
    {isNotJob && ' | '}
    {isNotJob && comments}
    {linkToComments && state.lastVisit !== null && (
      ' (' + state.lastVisit.fromNow() + ')'
    )}
    {hasNewComments && ' | '}
    {hasNewComments && <Link className="Item__newcomments" to="item" params={{id: item.id}} query={{showNew: true}}>
      new comments
    </Link>}
  </div>
}

var Item = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {
      item: {}
    , lastVisit: null
    , comentCount: null
    , newCommentCount: null
    }
  },
  componentWillMount: function() {
    this.bindAsObject(ItemStore.itemRef(this.props.params.id), 'item')
    this.setState(CommentThreadStore.init(this.props.params.id, this.handleCommentsAdded))
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  },
  componentWillUnmount: function() {
    CommentThreadStore.dispose()
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  },
  /**
   * Update the title whenever an item has loaded.
   */
  componentWillUpdate: function(nextProps, nextState) {
    if (this.state.item.id != nextState.item.id) {
      setTitle(nextState.item.title)
    }
  },
  /**
   * Handle changing the displayed item without unmounting the component, e.g.
   * when a link to another item is posted, or the user edits the URL.
   */
  componentWillReceiveProps: function(nextProps) {
    if (this.props.params.id != nextProps.params.id) {
      this.unbind('item')
      this.bindAsObject(ItemStore.itemRef(nextProps.params.id), 'item')
      CommentThreadStore.dispose()
      this.setState(CommentThreadStore.init(nextProps.params.id, this.handleCommentsAdded))
    }
  },
  /**
   * Ensure the last visit time and comment details get stored for this item if
   * the user refreshes or otherwise navigates off the page.
   */
  handleBeforeUnload: function() {
    CommentThreadStore.dispose()
  },
  handleCommentsAdded: function(commentData) {
    this.setState(commentData)
  },
  render: function() {
    var item = this.state.item
    var newComments = this.state.newCommentCount
    if (!item.id) { return <div className="Item Item--loading"><Spinner size="20"/></div> }
    return <div className={cx('Item', {'Item--dead': item.dead})}>
      <div className="Item__content">
        {renderItemTitle(item)}
        {renderItemMeta(item, this.state)}
        {newComments > 0 && <div className="Item__newcomments">
          {newComments} new comment{pluralise(newComments)} in the last {timeUnitsAgo(this.state.lastVisit)}
        </div>}
        {item.text && <div className="Item__text">
          <div dangerouslySetInnerHTML={{__html: item.text}}/>
        </div>}
        {item.type == 'poll' && <div className="Item__poll">
          {item.parts.map(function(id) {
            return <PollOption key={id} id={id}/>
          })}
        </div>}
      </div>
      {item.kids && <div className="Item__kids">
        {item.kids.map(function(id, index) {
          return <Comment key={id} id={id} showSpinnerDeep={index === 0} level={0}/>
        })}
      </div>}
    </div>
  }
})

var ListItem = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {
      item: {}
    , lastVisit: null
    , commentCount: null
    , prevMaxCommentId: null
    }
  },
  componentWillMount: function() {
    this.bindAsObject(ItemStore.itemRef(this.props.id), 'item')
    this.setState(CommentThreadStore.getCommentStats(this.props.id))
  },
  render: function() {
    var item = this.state.item
    if (!item.id) { return <li className="ListItem ListItem--loading"><Spinner/></li> }
    if (item.deleted) { return null }
    return <li className={cx('ListItem', {'ListItem--dead': item.dead})}>
      {renderItemTitle(item)}
      {renderItemMeta(item, this.state, true)}
    </li>
  }
})

var Items = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {items: []}
  },
  componentWillMount: function() {
    this.bindAsObject(ItemStore.topStoriesRef(), 'items')
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

var Paginator = React.createClass({
  render: function() {
    return <div className="Paginator">
      {this.props.page > 1 && <span className="Paginator__prev">
        <Link to={this.props.route} query={{page: this.props.page - 1}}>Prev</Link>
      </span>}
      {this.props.page > 1 && this.props.hasNext && ' | '}
      {this.props.hasNext && <span className="Paginator__next">
        <Link to={this.props.route} query={{page: this.props.page + 1}}>More</Link>
      </span>}
    </div>
  }
})

var App = React.createClass({
  render: function() {
    return <div className="App">
      <div className="App__header">
        <img src="logo.png" width="16" height="16" alt="" />{' '}
        <Link to="news" className="App__homelink">React Hacker News</Link>
      </div>
      <div className="App__content">
        <this.props.activeRouteHandler/>
      </div>
      <div className="App__footer">
        <a href="https://github.com/insin/react-hn">Fork me on GitHub</a>
      </div>
    </div>
  }
})

var routes = <Routes location="hash">
  <Route name="app" path="/" handler={App}>
    <DefaultRoute handler={Items}/>
    <NotFoundRoute handler={NotFound}/>
    <Route name="news" path="news" handler={Items}/>
    <Route name="item" path="item/:id" handler={Item}/>
    <Route name="job" path="job/:id" handler={Item}/>
    <Route name="poll" path="poll/:id" handler={Item}/>
    <Route name="story" path="story/:id" handler={Item}/>
    <Route name="comment" path="comment/:id" handler={Comment}/>
    <Route name="user" path="user/:id" handler={UserProfile}/>
  </Route>
</Routes>

React.renderComponent(routes, document.getElementById('app'))
