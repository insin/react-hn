/** @jsx React.DOM */

'use strict';

var moment = require('moment')
var React = require('react')
var ReactFireMixin = require('reactfire')
var Router = require('react-router')

var ItemStore =  require('./stores/ItemStore')
var Spinner = require('./Spinner')

var cx = require('./utils/buildClassName')
var setTitle = require('./utils/setTitle')

var Link = Router.Link
var Navigation = Router.Navigation

var Comment = React.createClass({
  mixins: [ReactFireMixin, Navigation],
  getDefaultProps: function() {
    return {
      comment: null
    , level: 0
    , maxCommentId: 0
    , permalink: false
    , permalinkThread: false
    , showSpinner: false
    , threadStore: null
    }
  },
  getInitialState: function() {
    return {
      comment: this.props.comment || {}
    , parent: {type: 'comment'}
    , collapsed: false
    }
  },
  componentWillMount: function() {
    if (this.props.comment === null) {
      this.bindAsObject(ItemStore.itemRef(this.props.id || this.props.params.id), 'comment')
    }
    else {
      this.fetchParent()
    }
  },
  componentWillUpdate: function(nextProps, nextState) {
    if (this.props.permalinked && this.state.comment.id != nextState.comment.id) {
      // Redirect to the appropriate route if a Comment "parent" link had a
      // non-comment item id.
      if (nextState.comment.type != 'comment') {
        this.replaceWith(nextState.comment.type, {id: nextState.comment.id})
        return
      }
      // Set/update the title from comment content
      setTitle('Comment by ' + nextState.comment.by)
    }
  },
  componentDidUpdate: function(prevProps, prevState) {
    if (this.shouldUseCommentStore()) {
      // Register a newly-loaded, non-deleted comment with the thread store
      if (!prevState.comment.id && this.state.comment.id && !this.state.comment.deleted) {
        this.props.threadStore.commentAdded(this.props.id)
      }
      // Let the store know if the comment got deleted
      else if (prevState.comment.id && !prevState.comment.deleted && this.state.comment.deleted) {
        this.props.threadStore.commentDeleted(this.props.id)
      }
    }
    // If the top-level permalinked comment was initialised or changed, fetch
    // its parent to determine the appropriate route for the "parent" link.
    else if (this.props.permalinked && this.state.comment.parent != prevState.comment.parent) {
      // Fetch the comment's parent so we can link to the appropriate route
      this.fetchParent()
    }
  },
  componentWillReceiveProps: function(nextProps) {
    // If the top-level comment id changes (i.e. a "parent" or "link" link is
    // used on a permalinked comment page, or the URL is edited), we need to
    // start listening for updates to the new item id.
    if (this.props.permalinked && this.props.params.id != nextProps.params.id) {
      this.unbind('comment')
      this.bindAsObject(ItemStore.itemRef(nextProps.params.id), 'comment')
    }
  },
  shouldUseCommentStore: function() {
    return (!this.isInPermalinkThread() && this.props.comment === null)
  },
  shouldLinkToParent: function() {
    return (this.props.permalinked || this.props.comment !== null)
  },
  fetchParent: function() {
    ItemStore.fetchItem(this.state.comment.parent, function(parent) {
      this.setState({parent: parent})
    }.bind(this))
  },
  /**
   * Determine if this comment is permalinked or is being displayed under a
   * permalinked comment.
   */
  isInPermalinkThread: function() {
    return (this.props.permalinked || this.props.permalinkThread)
  },
  /**
   * Determine if this is a new comment.
   */
  isNew: function() {
    return (this.props.maxCommentId > 0 &&
            this.props.id > this.props.maxCommentId)
  },
  toggleCollapsed: function(e) {
    e.preventDefault()
    this.setState({collapsed: !this.state.collapsed})
  },
  render: function() {
    var props = this.props
    var comment = this.state.comment

    // Render a placeholder while we're waiting for the comment to load
    if (!comment.id) {
      return <div className={cx(
        'Comment Comment--loading Comment--level' + props.level,
        {'Comment--new': this.isNew()
      })}>
        {(props.permalinked || props.showSpinner ) && <Spinner size="20"/>}
        {comment.error && <p>Error loading comment - this may be because the author has configured a delay.</p>}
      </div>
    }

    // XXX Don't render anything if we're replacing the route after loading a non-comment
    if (comment.type != 'comment') { return null }

    // Don't render anything for deleted comments with no kids
    if (comment.deleted && !comment.kids) { return null }

    var showParentLink = this.shouldLinkToParent()
    // TODO Fetch the anccestor item so we can always show the title on the live
    //      update screens.
    var showParentTitle = (this.props.comment !== null && this.state.parent.type != 'comment')

    return <div className={cx('Comment Comment--level' + props.level, {
      'Comment--collapsed': this.state.collapsed
    , 'Comment--dead': comment.dead
    , 'Comment--deleted': comment.deleted
    , 'Comment--new': this.isNew()
    })}>
      <div className="Comment__content">
        {comment.deleted && <div className="Comment__meta">
          {this.renderCollapseControl()}{' '}
          [deleted]
        </div>}
        {!comment.deleted && <div className="Comment__meta">
          {this.renderCollapseControl()}{' '}
          <Link to="user" params={{id: comment.by}} className="Comment__user">{comment.by}</Link>{' '}
          {moment(comment.time * 1000).fromNow()}
          {!props.permalinked && ' | '}
          {!props.permalinked && <Link to="comment" params={{id: comment.id}}>link</Link>}
          {showParentLink && ' | '}
          {showParentLink && <Link to={this.state.parent.type} params={{id: comment.parent}}>parent</Link>}
          {showParentTitle && ' | on: '}
          {showParentTitle && <Link to={this.state.parent.type} params={{id: comment.parent}}>
            {this.state.parent.title}
          </Link>}
          {comment.dead &&  ' | [dead]'}
        </div>}
        {!comment.deleted && <div className="Comment__text">
          <div dangerouslySetInnerHTML={{__html: comment.text}}/>
        </div>}
      </div>
      {this.props.comment === null && comment.kids && <div className="Comment__kids">
        {comment.kids.map(function(id, index) {
          return <Comment key={id} id={id}
            level={props.level + 1}
            showSpinner={props.showSpinner || (props.permalinked && index === 0)}
            permalinkThread={props.permalinkThread || props.permalinked}
            maxCommentId={props.maxCommentId}
            threadStore={props.threadStore}
          />
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

module.exports = Comment