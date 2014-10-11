'use strict';

jest.dontMock('../CommentThreadStore')

describe('getCommentStats()', function() {
  it('returns defaults given an unknown item id', function() {
    var CommentThreadStore = require('../CommentThreadStore')
    var commentStats = CommentThreadStore.getCommentStats(123)
    expect(commentStats).toEqual({
      lastVisit: null
    , commentCount: -1
    , prevMaxCommentId: -1
    })
  })
})
