var React = require('react')
var ReactFireMixin = require('reactfire')
var TimeAgo = require('react-timeago').default

var HNService = require('./services/HNService')

var Spinner = require('./Spinner')

var setTitle = require('./utils/setTitle')

// TODO User submissions

// TODO User comments

var UserProfile = React.createClass({
  mixins: [ReactFireMixin],
  getInitialState() {
    return {user: {}}
  },

  componentWillMount() {
    this.bindAsObject(HNService.userRef(this.props.params.id), 'user')
  },

  componentWillUpdate(nextProps, nextState) {
    if (this.state.user.id !== nextState.user.id) {
      setTitle('Profile: ' + nextState.user.id)
    }
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.params.id !== nextProps.params.id) {
      this.unbind('user')
      this.bindAsObject(HNService.userRef(nextProps.params.id), 'user')
    }
  },

  render() {
    var user = this.state.user
    if (!user.id) {
      return <div className="UserProfile UserProfile--loading">
        <h4>{this.props.params.id}</h4>
        <Spinner size="20"/>
      </div>
    }
    var createdDate = new Date(user.created * 1000)
    return <div className="UserProfile">
      <h4>{user.id}</h4>
      <dl>
        <dt>Created</dt>
        <dd><TimeAgo date={createdDate}/> ({createdDate.toDateString()})</dd>
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

module.exports = UserProfile
