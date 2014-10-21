/** @jsx React.DOM */

'use strict';

var React = require('react')
var ReactFireMixin = require('reactfire')
var Router = require('react-router')

var CommentThreadStore = require('./stores/CommentThreadStore')
var HNService = require('./services/HNService')
var UpdatesStore = require('./stores/UpdatesStore')

var Comment = require('./Comment')
var CommentMixin = require('./mixins/CommentMixin')

var cx = require('./utils/buildClassName')
var setTitle = require('./utils/setTitle')

var Navigation = Router.Navigation

var PermalinkedComment = React.createClass({
  mixins: [CommentMixin, ReactFireMixin, Navigation],

  getDefaultProps: function() {
    return {
      level: 0
    }
  },

  getInitialState: function() {
    return {
      comment: UpdatesStore.getComment(this.props.params.id) || {}
    , parent: {type: 'comment'}
    , op: {}
    }
  },

  componentWillMount: function() {
    this.bindAsObject(HNService.itemRef(this.props.params.id), 'comment')
    this.threadStore = new CommentThreadStore(this.props.params.id, this.handleCommentsChanged)
    if (this.state.comment.id) {
      this.fetchAncestors(this.state.comment)
    }
  },

  componentWillUpdate: function(nextProps, nextState) {
    // Redirect to the appropriate route if a Comment "parent" link had a
    // non-comment item id.
    if (this.state.comment.id != nextState.comment.id && !nextState.comment.deleted) {
      if (nextState.comment.type != 'comment') {
        this.replaceWith(nextState.comment.type, {id: nextState.comment.id})
        return
      }
    }
  },

  componentDidUpdate: function(prevProps, prevState) {
    // Fetch ancestors once the comment loads
    if (this.state.comment.id != prevState.comment.id && !this.state.comment.deleted) {
      this.fetchAncestors(this.state.comment)
    }
    this.setTitle()
  },

  componentWillReceiveProps: function(nextProps) {
    // If the top-level comment id changes (i.e. a "parent" or "link" link is
    // used on a permalinked comment page, or the URL is edited), we need to
    // start listening for updates to the new item id.
    if (this.props.params.id != nextProps.params.id) {
      this.unbind('comment')
      this.bindAsObject(HNService.itemRef(nextProps.params.id), 'comment')
      this.threadStore = new CommentThreadStore(nextProps.params.id, this.handleCommentsChanged)
      var cachedComment = UpdatesStore.getComment(nextProps.params.id)
      if (cachedComment) {
        this.setState({comment: cachedComment})
      }
    }
  },

  setTitle: function() {
    if (this.state.comment.deleted) {
      return setTitle('Deleted comment')
    }
    var title = 'Comment by ' + this.state.comment.by
    if (this.state.op.id) {
      title += ' | ' + this.state.op.title
    }
    setTitle(title)
  },

  handleCommentsChanged: function(payload) {
    // We're only interested in re-rendering to update collapsed display
    if (payload.type == 'collapse') {
      this.forceUpdate()
    }
  },

  render: function() {
    var comment = this.state.comment
    // Render a placeholder while we're waiting for the comment to load
    if (!comment.id) { return this.renderCommentLoading(comment) }
    // Render a link to HN for deleted comments
    if (comment.deleted) {
      return this.renderCommentDeleted(comment, {
        className: 'Comment Comment--level0 Comment--deleted'
      })
    }
    // XXX Don't render anything if we're replacing the route after loading a non-comment
    if (comment.type != 'comment') { return null }

    var className = cx('Comment Comment--level0', {'Comment--dead': comment.dead})
    var threadStore = this.threadStore

    return <div className={className}>
      <div className="Comment__content">
        {this.renderCommentMeta(comment, {
          parent: !!this.state.parent.id && !!this.state.op.id && comment.parent != this.state.op.id
        , op: !!this.state.op.id
        })}
        {this.renderCommentText(comment)}
      </div>
      {comment.kids && <div className="Comment__kids">
        {comment.kids.map(function(id, index) {
          return <Comment key={id} id={id}
            level={1}
            loadingSpinner={index === 0}
            threadStore={threadStore}
          />
        })}
      </div>}
    </div>
  }
})

module.exports = PermalinkedComment