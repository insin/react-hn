var React = require('react')

var SettingsStore = require('./stores/SettingsStore')

var CommentMixin = require('./mixins/CommentMixin')

var cx = require('./utils/buildClassName')

/**
 * Displays a standalone comment passed as a prop.
 */
var DisplayComment = React.createClass({
  mixins: [CommentMixin],

  propTypes: {
    comment: React.PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      op: {}
    , parent: {type: 'comment'}
    }
  },

  componentWillMount() {
    this.fetchAncestors(this.props.comment)
  },

  render() {
    if (this.props.comment.deleted) { return null }
    if (this.props.comment.dead && !SettingsStore.showDead) { return null }

    var comment = this.props.comment
    var className = cx('Comment Comment--level0', {
      'Comment--dead': comment.dead
    })

    return <div className={className}>
      <div className="Comment__content">
        {this.renderCommentMeta(comment, {
          link: true
        , parent: !!this.state.parent.id && !!this.state.op.id && comment.parent != this.state.op.id
        , op: !!this.state.op.id
        })}
        {this.renderCommentText(comment, {replyLink: false})}
      </div>
    </div>
  }
})

module.exports = DisplayComment
