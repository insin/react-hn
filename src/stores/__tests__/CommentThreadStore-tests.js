'use strict';

jest.dontMock('../CommentThreadStore')

describe('getCommentData()', function() {
  it('returns defaults given an unknown item id', function() {
    var CommentThreadStore = require('../CommentThreadStore')
    var commentStats = CommentThreadStore.getCommentData(123)
    expect(commentStats).toEqual({
      lastVisit: null
    , commentCount: 0
    , maxCommentId: 0
    })
  })
})
