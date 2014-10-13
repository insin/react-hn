/** @jsx React.DOM */

'use strict';

var moment = require('moment')
var React = require('react/addons')
var ReactFireMixin = require('reactfire')
var Router = require('react-router')

var CommentThreadStore = require('./stores/CommentThreadStore')
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
      showSpinner: false
    , permalink: false
    , permalinkThread: false
    , level: 0
    , maxCommentId: 0
    }
  },
  getInitialState: function() {
    return {
      comment: {}
    , parent: {type: 'comment'}
    , collapsed: false
    }
  },
  componentWillMount: function() {
    // TODO Look into manual Firebase binding as a solution for components which
    //      need to redirect after loading an object, without setting it on state.
    //      This currently causes checks to be required both componentWillUpdate()
    //      (to actually do the redirect) and render() (to avoid trying to render
    //      with an unexpected item type).
    this.bindAsObject(ItemStore.itemRef(this.props.id || this.props.params.id), 'comment')
    if (!this.isInPermalinkThread()) {
      CommentThreadStore.addComment(this.props.id)
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
    if (this.props.permalinked && this.state.comment.parent != prevState.comment.parent) {
      // Fetch the comment's parent so we can link to the appropriate route
      ItemStore.fetchItem(this.state.comment.parent, function(parent) {
        this.setState({parent: parent})
      }.bind(this))
    }
  },
  componentWillReceiveProps: function(nextProps) {
    if (this.props.permalinked && this.props.params.id != nextProps.params.id) {
      this.unbind('comment')
      this.bindAsObject(ItemStore.itemRef(nextProps.params.id), 'comment')
    }
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
  toggleCollapsed: function() {
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
          <span className="Comment__collapse" onClick={this.toggleCollapsed} onKeyPress={this.toggleCollapsed} tabIndex="0">
            [{this.state.collapsed ? '+' : '–'}]
          </span>{' '}
          <Link to="user" params={{id: comment.by}} className="Comment__user">{comment.by}</Link>{' '}
          {moment(comment.time * 1000).fromNow()}{' | '}
          {!props.permalinked && <Link to="comment" params={{id: comment.id}}>link</Link>}
          {props.permalinked && <Link to={this.state.parent.type} params={{id: comment.parent}}>parent</Link>}
          {comment.dead &&  ' | [dead]'}
        </div>}
        {!comment.deleted && <div className="Comment__text">
          <div dangerouslySetInnerHTML={{__html: comment.text}}/>
        </div>}
      </div>
      {comment.kids && <div className="Comment__kids">
        {comment.kids.map(function(id, index) {
          return <Comment key={id} id={id}
            level={props.level + 1}
            showSpinner={props.showSpinner || (props.permalinked && index === 0)}
            permalinkThread={props.permalinkThread || props.permalinked}
            maxCommentId={props.maxCommentId}
          />
        })}
      </div>}
    </div>
  }
})

module.exports = Comment