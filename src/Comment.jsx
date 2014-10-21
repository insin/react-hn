/** @jsx React.DOM */

'use strict';

var React = require('react')
var ReactFireMixin = require('reactfire')

var CommentThreadStore = require('./stores/CommentThreadStore')
var HNService = require('./services/HNService')
var UpdatesStore = require('./stores/UpdatesStore')

var CommentMixin = require('./mixins/CommentMixin')

var cx = require('./utils/buildClassName')

/**
 * A comment in a thread.
 */
var Comment = React.createClass({
  mixins: [CommentMixin, ReactFireMixin],

  propTypes: {
    id: React.PropTypes.number.isRequired
  , level: React.PropTypes.number.isRequired
  , loadingSpinner: React.PropTypes.bool
  , threadStore: React.PropTypes.instanceOf(CommentThreadStore).isRequired
  },

  getDefaultProps: function() {
    return {
      loadingSpinner: false
    }
  },

  getInitialState: function() {
    return {
      comment: UpdatesStore.getComment(this.props.id) || {}
    }
  },

  componentWillMount: function() {
    this.bindAsObject(HNService.itemRef(this.props.id), 'comment')
    // Register a comment retrieved from the cache with the thread store
    if (this.state.comment.id) {
      this.props.threadStore.commentAdded(this.state.comment)
    }
  },

  componentDidUpdate: function(prevProps, prevState) {
    // Register a newly-loaded, non-deleted comment with the thread store
    if (!prevState.comment.id && this.state.comment.id && !this.state.comment.deleted) {
      this.props.threadStore.commentAdded(this.state.comment)
    }
    // Let the thread store know if the comment got deleted
    else if (prevState.comment.id && !prevState.comment.deleted && this.state.comment.deleted) {
      this.props.threadStore.commentDeleted(this.state.comment)
    }
  },

  toggleCollapse: function(e) {
    e.preventDefault()
    this.props.threadStore.toggleCollapse(this.state.comment.id)
  },

  render: function() {
    var comment = this.state.comment
    var props = this.props
    // Render a placeholder while we're waiting for the comment to load
    if (!comment.id) { return this.renderCommentLoading(comment) }
    // Render a link to HN for deleted comments
    if (comment.deleted) {
      return this.renderCommentDeleted(comment, {
        className: 'Comment Comment--deleted Comment--level' + props.level
      })
    }

    var isNew = props.threadStore.isNew[comment.id]
    var collapsed = !!props.threadStore.isCollapsed[comment.id]
    var childCounts = (collapsed && props.threadStore.getChildCounts(comment))
    if (collapsed && isNew) { childCounts.newComments = 0 }
    var className = cx('Comment Comment--level' + props.level, {
      'Comment--collapsed': collapsed
    , 'Comment--dead': comment.dead
    , 'Comment--new': isNew
    })

    return <div className={className}>
      <div className="Comment__content">
        {this.renderCommentMeta(comment, {
          collapsible: true
        , collapsed: collapsed
        , link: true
        , childCounts: childCounts
        })}
        {this.renderCommentText(comment)}
      </div>
      {comment.kids && <div className="Comment__kids">
        {comment.kids.map(function(id) {
          return <Comment key={id} id={id}
            level={props.level + 1}
            loadingSpinner={props.loadingSpinner}
            threadStore={props.threadStore}
          />
        })}
      </div>}
    </div>
  }
})

module.exports = Comment