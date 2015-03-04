'use strict';

var React = require('react')
var ReactFireMixin = require('reactfire')

var HNService = require('./services/HNService')

var Spinner = require('./Spinner')

var pluralise = require('./utils/pluralise')

var PollOption = React.createClass({
  mixins: [ReactFireMixin],

  getInitialState() {
    return {pollopt: {}}
  },

  componentWillMount() {
    this.bindAsObject(HNService.itemRef(this.props.id), 'pollopt')
  },

  render() {
    var pollopt = this.state.pollopt
    if (!pollopt.id) { return <div className="PollOption PollOption--loading"><Spinner size="20"/></div> }
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

module.exports = PollOption