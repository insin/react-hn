var React = require('react')
var SettingsStore = require('./stores/SettingsStore')

var CurrentColor = React.createClass({
  propTypes: {
    darkMode: React.PropTypes.bool
  },
  getDefaultProps() {
    return {
      darkMode: SettingsStore.darkMode
    }
  },
  componentDidMount() {
    document.documentElement.classList.toggle('App--dark', this.props.darkMode)
  },
  componentWillReceiveProps(nextProps) {
    document.documentElement.classList.toggle('App--dark', nextProps.darkMode)
  },
  componentWillUnmount() {
    document.documentElement.classList.remove('App--dark')
  },
  render() {
    return <div></div>
  }
})

module.exports = CurrentColor
