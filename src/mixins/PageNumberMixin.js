'use strict';

var PageNumberMixin = {
  getPageNumber(page) {
    if (typeof page == 'undefined') {
      page = this.props.query.page
    }
    return (page && /^\d+$/.test(page) ? Math.max(1, Number(page)) : 1)
  }
}

module.exports = PageNumberMixin