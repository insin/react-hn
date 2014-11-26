'use strict';

var React = require('react')
var ReactFireMixin = require('reactfire')

var CommentThreadStore = require('./stores/CommentThreadStore')
var HNService = require('./services/HNService')
var SettingsStore = require('./stores/SettingsStore')

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
      comment: {}
    }
  },

  componentWillMount: function() {
    this.bindFirebaseRef()
  },

  componentWillUnmount: function() {
    this.clearDelayTimeout()
  },

  componentDidUpdate: function(prevProps, prevState) {
    if (!prevState.comment.id) {
      // Register a newly-loaded comment with the thread store
      if (this.state.comment.id) {
        // If the commant was delayed, cancel any pending timeout
        if (prevState.comment.delayed) {
          this.clearDelayTimeout()
        }
        this.props.threadStore.commentAdded(this.state.comment)
      }
      if (!prevState.comment.delayed && this.state.comment.delayed) {
        this.props.threadStore.commentDelayed(this.props.id)
      }
    }
    // The comment was already loaded, look for changes to it
    else {
      if (!prevState.comment.deleted && this.state.comment.deleted) {
        this.props.threadStore.commentDeleted(this.state.comment)
      }
      if (!prevState.comment.dead && this.state.comment.dead) {
        this.props.threadStore.commentDied(this.state.comment)
      }
      // If the comment has been updated and the initial set of comments is
      // still loading, the number of expected comments might need to be
      // adjusted.
      else if (prevState.comment !== this.state.comment &&
               this.props.threadStore.loading) {
        var kids = (this.state.comment.kids ? this.state.comment.kids.length : 0)
        var prevKids = (prevState.comment.kids ? prevState.comment.kids.length : 0)
        this.props.threadStore.adjustExpectedComments(kids - prevKids)
      }
    }
  },

  bindFirebaseRef: function() {
    this.bindAsObject(HNService.itemRef(this.props.id), 'comment', this.handleFirebaseRefCancelled)
    if (this.timeout) {
      this.timeout = null
    }
  },

  /**
   * This is usually caused by a permissions error loading the comment due to
   * its author using the delay setting, which is measured in minutes - try
   * again in 30 seconds.
   */
  handleFirebaseRefCancelled: function(e) {
    if ("production" !== process.env.NODE_ENV) {
      console.error('Firebase ref for comment ' + this.props.id + ' was cancelled: ' + e.message)
    }
    this.unbind('comment')
    this.timeout = setTimeout(this.bindFirebaseRef, 30000)
    if (!this.state.comment.delayed) {
      this.state.comment.delayed = true
      this.forceUpdate()
    }
  },

  clearDelayTimeout: function() {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
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
    // Render a link to HN for deleted comments if they're being displayed
    if (comment.deleted) {
      if (!SettingsStore.showDeleted) { return null }
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
        {(!comment.dead || SettingsStore.showDead) && this.renderCommentText(comment)}
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