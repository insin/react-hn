var React = require('react')
var {Link} = require('react-router')

var Paginator = React.createClass({
  _onClick(e) {
    setTimeout(function() { window.scrollTo(0, 0) }, 0)
  },

  render() {
    if (this.props.page === 1 && !this.props.hasNext) { return null }
    return <div className="Paginator">
      {this.props.page > 1 && <span className="Paginator__prev">
        <Link to={`/${this.props.route}`} query={{page: this.props.page - 1}} onClick={this._onClick}>Prev</Link>
      </span>}
      {this.props.page > 1 && this.props.hasNext && ' | '}
      {this.props.hasNext && <span className="Paginator__next">
        <Link to={`/${this.props.route}`} query={{page: this.props.page + 1}} onClick={this._onClick}>More</Link>
      </span>}
    </div>
  }
})

module.exports = Paginator
