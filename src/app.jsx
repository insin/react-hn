/** @jsx React.DOM */

'use strict';

var Firebase = require('firebase')
var moment = require('moment')
var React = require('react/addons')
var ReactFireMixin = require('reactfire')
var Router = require('react-router')

// Expose React globally for React Developer Tools
window.React = React

var cx = React.addons.classSet
var DefaultRoute = Router.DefaultRoute
var Link = Router.Link
var Navigation = Router.Navigation
var NotFoundRoute = Router.NotFoundRoute
var Route = Router.Route
var Routes = Router.Routes

var ITEM_URL = 'https://hacker-news.firebaseio.com/v0/item/'
var ITEMS_PER_PAGE = 30
var SITE_TITLE = 'React Hacker News'
var TOP_ITEMS_URL = 'https://hacker-news.firebaseio.com/v0/topstories'
var USER_URL = 'https://hacker-news.firebaseio.com/v0/user/'

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

// TODO Implement gif-based fallback for IE9 and another non-animating browsers
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

var User = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {user: {}}
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase(USER_URL + this.props.params.id), 'user')
  },
  componentWillUpdate: function(nextProps, nextState) {
    if (this.state.user.id != nextState.user.id) {
      setTitle('Profile: ' + nextState.user.id)
    }
  },
  componentWillReceiveProps: function(nextProps) {
    if (this.props.params.id != nextProps.params.id) {
      this.unbind('user')
      this.bindAsObject(new Firebase(USER_URL + nextProps.params.id), 'user')
    }
  },
  render: function() {
    var user = this.state.user
    if (!user.id) {
      return <div className="User User--loading">
        <h4>{this.props.params.id}</h4>
        <Spinner size="20"/>
      </div>
    }
    var createdMoment = moment(user.created * 1000)
    return <div className="User">
      <h4>{user.id}</h4>
      <dl>
        <dt>Created</dt>
        <dd>{createdMoment.fromNow()} ({createdMoment.format('LL')})</dd>
        <dt>Karma</dt>
        <dd>{user.karma}</dd>
        <dt>Delay</dt>
        <dd>{user.delay}</dd>
        {user.about && <dt>About</dt>}
        {user.about && <dd><div className="User__about" dangerouslySetInnerHTML={{__html: user.about}}/></dd>}
      </dl>
    </div>
  }
})

var Comment = React.createClass({
  mixins: [ReactFireMixin, Navigation],
  getDefaultProps: function() {
    return {
      showSpinnerDeep: false
    }
  },
  getInitialState: function() {
    return {
      comment: {}
    , collapsed: false
    }
  },
  componentWillMount: function() {
    // TODO Look into manual binding as a solution for components which need to
    //      redirect after loading an object, without setting it on state. This
    //      requires checks in both componentWillUpdate() and render().
    this.bindAsObject(new Firebase(ITEM_URL + (this.props.id || this.props.params.id)), 'comment')
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
      this.bindAsObject(new Firebase(ITEM_URL + nextProps.params.id), 'comment')
    }
  },
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
    if (!comment.id) {
      return <div className="Comment Comment--loading">
        {(isTopLevel || showSpinnerDeep) && <Spinner size="20"/>}
      </div>
    }
    // Don't render anything if we're replacing the route after loading a non-comment
    if (comment.type != 'comment') { return null }
    // Don't render anything for deleted comments with no kids
    if (comment.deleted && !comment.kids) { return null }
    var className = cx({
      'Comment': true
    , 'Comment--deleted': comment.deleted
    , 'Comment--dead': comment.dead
    , 'Comment--collapsed': this.state.collapsed
    })
    var timeMoment = moment(comment.time * 1000)
    return <div className={className}>
      {comment.deleted && <div className="Comment__meta">
        {this.renderCollapseControl()}{' '}
        [deleted]
      </div>}
      {!comment.deleted && <div className="Comment__meta">
        {this.renderCollapseControl()}{' '}
        <Link to="user" params={{id: comment.by}} className="Comment__meta__user">{comment.by}</Link>{' '}
        {timeMoment.fromNow()}
        {!isTopLevel && ' | '}
        {!isTopLevel && <Link to="comment" params={{id: comment.id}}>link</Link>}
        {isTopLevel && ' | '}
        {isTopLevel && <Link to="comment" params={{id: comment.parent}}>parent</Link>}
        {comment.dead && <span> | [dead]</span>}
      </div>}
      {!comment.deleted && <div className="Comment__text">
        <div dangerouslySetInnerHTML={{__html: comment.text}}/>
      </div>}
      {comment.kids && <div className="Comment__kids">
        {comment.kids.map(function(id, index) {
          return <Comment key={id} id={id} showSpinnerDeep={showSpinnerDeep || (isTopLevel && index === 0)}/>
        })}
      </div>}
    </div>
  },
  renderCollapseControl: function() {
    return <span className="Comment__collapse" onClick={this.toggleCollapsed} onKeyPress={this.toggleCollapsed} tabIndex="0">
      [{this.state.collapsed ? '+' : '–'}]
    </span>
  }
})

var PollOption = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {pollopt: {}}
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase(ITEM_URL + this.props.id), 'pollopt')
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

function renderItemMeta(item, commentsLink) {
  var timeMoment = moment(item.time * 1000)
  var isNotJob = (item.type != 'job')
  return <div className="Item__meta">
    {isNotJob && <span className="Item__score">
      {item.score} point{pluralise(item.score)}
    </span>}{' '}
    {isNotJob && <span className="Item__by">
      by <Link to="user" params={{id: item.by}}>{item.by}</Link>
    </span>}{' '}
    <span className="Item__time">{timeMoment.fromNow()}</span>
    {isNotJob && commentsLink && ' | '}
    {isNotJob && commentsLink && <Link to={item.type} params={{id: item.id}}>comments</Link>}
  </div>
}

var Item = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {item: {}}
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase(ITEM_URL + (this.props.id || this.props.params.id)), 'item')
  },
  componentWillUpdate: function(nextProps, nextState) {
    if (this.state.item.id != nextState.item.id) {
      setTitle(nextState.item.title)
    }
  },
  componentWillReceiveProps: function(nextProps) {
    if (this.props.params.id != nextProps.params.id) {
      this.unbind('item')
      this.bindAsObject(new Firebase(ITEM_URL + nextProps.params.id), 'item')
    }
  },
  render: function() {
    var item = this.state.item
    if (!item.id) { return <div className="Item Item--loading"><Spinner size="20"/></div> }
    return <div className={cx({'Item': true, 'Item--dead': item.dead})}>
      {renderItemTitle(item)}
      {renderItemMeta(item)}
      {item.text && <div className="Item__text">
        <div dangerouslySetInnerHTML={{__html: item.text}}/>
      </div>}
      {item.type == 'poll' && <div className="Item__poll">
        {item.parts.map(function(id) {
          return <PollOption key={id} id={id}/>
        })}
      </div>}
      {item.kids && <div className="Item__kids">
        {item.kids.map(function(id, index) {
          return <Comment key={id} id={id} showSpinnerDeep={index === 0}/>
        })}
      </div>}
    </div>
  }
})

var ListItem = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {item: {}}
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase(ITEM_URL + this.props.id || this.props.params.id), 'item')
  },
  render: function() {
    var item = this.state.item
    if (!item.id) { return <li className="ListItem ListItem--loading"><Spinner/></li> }
    if (item.deleted) { return null }
    return <li className={cx({'ListItem': true, 'ListItem--dead': item.dead})}>
      {renderItemTitle(item)}
      {renderItemMeta(item, true)}
    </li>
  }
})

var Items = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState: function() {
    return {items: []}
  },
  componentWillMount: function() {
    this.bindAsObject(new Firebase(TOP_ITEMS_URL), 'items')
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
    if (this.state.items.length === 0) {
      var dummyItems = []
      for (var i = 0; i < ITEMS_PER_PAGE; i++) {
        dummyItems.push(<li className="ListItem ListItem--loading"><Spinner/></li>)
      }
      return <div className="Items Items--loading">
        <ol className="Items__list" start={startIndex + 1}>{dummyItems}</ol>
      </div>
    }

    var endIndex = startIndex + ITEMS_PER_PAGE
    var items = this.state.items.slice(startIndex, endIndex)
    var hasNext = endIndex < this.state.items.length - 1
    return <div className="Items">
      {page > 1 && <Paginator route="news" page={page} hasNext={hasNext}/>}
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
    <Route name="user" path="user/:id" handler={User}/>
  </Route>
</Routes>

React.renderComponent(routes, document.getElementById('app'))
