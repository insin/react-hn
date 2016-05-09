var React = require('react')
var ReactFireMixin = require('reactfire')
var withRouter = require('react-router/lib/withRouter')

var CommentThreadStore = require('./stores/CommentThreadStore')
var HNService = require('./services/HNService')
var HNServiceRest = require('./services/HNServiceRest')
var SettingsStore = require('./stores/SettingsStore')
var UpdatesStore = require('./stores/UpdatesStore')

var Comment = require('./Comment')
var CommentMixin = require('./mixins/CommentMixin')

var cx = require('./utils/buildClassName')
var setTitle = require('./utils/setTitle')

var PermalinkedComment = React.createClass({
  mixins: [CommentMixin, ReactFireMixin],

  getDefaultProps() {
    return {
      level: 0,
      loadingSpinner: true
    }
  },

  getInitialState() {
    return {
      comment: UpdatesStore.getComment(this.props.params.id) || {},
      parent: {type: 'comment'},
      op: {}
    }
  },

  componentWillMount() {
    if (SettingsStore.offlineMode) {
      HNServiceRest.itemRef(this.props.params.id).then(function(res) {
        return res.json()
      }).then(function(snapshot) {
        this.replaceState({ comment: snapshot })
      }.bind(this))
    }
    else {
      this.bindAsObject(HNService.itemRef(this.props.params.id), 'comment')
    }
    if (this.state.comment.id) {
      this.commentLoaded(this.state.comment)
    }
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.params.id !== this.props.params.id) {
      var comment = UpdatesStore.getComment(nextProps.params.id)
      if (comment) {
        this.commentLoaded(comment)
        this.setState({comment: comment})
      }
      this.unbind('comment')
      this.bindAsObject(HNService.itemRef(nextProps.params.id), 'comment')
    }
  },

  componentWillUpdate(nextProps, nextState) {
    if (!nextState.comment) {
      return
    }

    if (this.state.comment.id !== nextState.comment.id) {
      if (!nextState.comment.deleted) {
        // Redirect to the appropriate route if a Comment "parent" link had a
        // non-comment item id.
        if (nextState.comment.type !== 'comment') {
          this.props.router.replace(`/${nextState.comment.type}/${nextState.comment.id}`)
          return
        }
      }
      if (!this.threadStore || this.threadStore.itemId !== nextState.comment.id) {
        this.commentLoaded(nextState.comment)
      }
    }
  },

  commentLoaded(comment) {
    this.setTitle(comment)
    if (!comment.deleted) {
      this.threadStore = new CommentThreadStore(comment, this.handleCommentsChanged)
      this.fetchAncestors(comment)
    }
  },

  setTitle(comment) {
    if (comment.deleted) {
      return setTitle('Deleted comment')
    }
    var title = 'Comment by ' + comment.by
    if (this.state.op.id) {
      title += ' | ' + this.state.op.title
    }
    setTitle(title)
  },

  handleCommentsChanged(payload) {
    // We're only interested in re-rendering to update collapsed display
    if (payload.type === 'collapse') {
      this.forceUpdate()
    }
  },

  render() {
    var comment = this.state.comment
    if (!comment) {
      return this.renderError(comment, {
        id: this.props.params.id,
        className: 'Comment Comment--level0 Comment--error'
      })
    }
    // Render a placeholder while we're waiting for the comment to load
    if (!comment.id) { return this.renderCommentLoading(comment) }
    // Render a link to HN for deleted comments
    if (comment.deleted) {
      return this.renderCommentDeleted(comment, {
        className: 'Comment Comment--level0 Comment--deleted'
      })
    }
    // XXX Don't render anything if we're replacing the route after loading a non-comment
    if (comment.type !== 'comment') { return null }

    var className = cx('PermalinkedComment Comment Comment--level0', {'Comment--dead': comment.dead})
    var threadStore = this.threadStore

    return <div className={className}>
      <div className="Comment__content">
        {this.renderCommentMeta(comment, {
          parent: !!this.state.parent.id && !!this.state.op.id && comment.parent !== this.state.op.id,
          op: !!this.state.op.id
        })}
        {(!comment.dead || SettingsStore.showDead) && this.renderCommentText(comment, {replyLink: true})}
      </div>
      {comment.kids && <div className="Comment__kids">
        {comment.kids.map(function(id, index) {
          return <Comment key={id} id={id}
            level={0}
            loadingSpinner={index === 0}
            threadStore={threadStore}
          />
        })}
      </div>}
    </div>
  }
})

module.exports = withRouter(PermalinkedComment)
