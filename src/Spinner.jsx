'use strict';

var React = require('react')

// TODO Implement GIF-based fallback for IE9 and another non-animating browsers
//      See https://github.com/tobiasahlin/SpinKit for how-to
var Spinner = React.createClass({
  getDefaultProps() {
    return {size: 6, spacing: 2}
  },

  render() {
    var bounceSize = this.props.size + 'px'
    var bounceStyle = {height: bounceSize, width: bounceSize, marginRight: this.props.spacing + 'px'}
    return <div className="Spinner" style={{width: ((Number(this.props.size) + Number(this.props.spacing)) * 3) + 'px'}}>
      <div className="bounce1" style={bounceStyle}/>
      <div className="bounce2" style={bounceStyle}/>
      <div className="bounce3" style={bounceStyle}/>
    </div>
  }
})

module.exports = Spinner