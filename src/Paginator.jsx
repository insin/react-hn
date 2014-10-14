/** @jsx React.DOM */

'use strict';

var React = require('react')
var Router = require('react-router')

var Link = Router.Link

var Paginator = React.createClass({
  render: function() {
    if (this.props.page == 1 && !this.props.hasNext) { return null }
    return <div className="Paginator">
      {this.props.page > 1 && <span className="Paginator__prev">
        <Link to={this.props.route} query={{page: this.props.page - 1}}>Prev</Link>
      </span>}
      {this.props.page > 1 && this.props.hasNext && ' | '}
      {this.props.hasNext && <span className="Paginator__next">
        <Link to={this.props.route} query={{page: this.props.page + 1}}>More</Link>
      </span>}
    </div>
  }
})

module.exports = Paginator