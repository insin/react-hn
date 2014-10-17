'use strict';

var PageNumberMixin = {
  getPageNumber: function() {
    return (this.props.query.page && /^\d+$/.test(this.props.query.page)
            ? Math.max(1, Number(this.props.query.page))
            : 1)
  }
}

module.exports = PageNumberMixin