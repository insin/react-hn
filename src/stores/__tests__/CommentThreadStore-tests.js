'use strict';

jest.dontMock('moment')
jest.dontMock('../CommentThreadStore')

describe('CommentThreadStore.loadState()', function() {
  it('returns defaults given an unknown item id', function() {
    var CommentThreadStore = require('../CommentThreadStore')
    expect(CommentThreadStore.loadState(123)).toEqual({
      lastVisit: null
    , commentCount: 0
    , maxCommentId: 0
    })
  })

  it('converts to appropriate types for a known id', function() {
    var storage = require('../../utils/storage')
    var CommentThreadStore = require('../CommentThreadStore')
    storage.setStore({
      '456:cc': '42'
    , '456:lv': '1413424287926'
    , '456:mc': '123456'
    })
    var state = CommentThreadStore.loadState(456)
    expect(state.lastVisit.valueOf()).toEqual(1413424287926)
    expect(state.commentCount).toEqual(42)
    expect(state.maxCommentId).toEqual(123456)
  })
})

describe('CommentThreadStore', function() {
  describe('on first visit to a thread', function() {
    it('calls a debounced function to signal the end of loading after 5 seconds', function() {
      jest.mock('../../utils/cancellableDebounce.js')
      var debounce = require('../../utils/cancellableDebounce.js')
      var debouncedFunc = jest.genMockFunction()
      debounce.mockReturnValue(debouncedFunc)

      var CommentThreadStore = require('../CommentThreadStore')
      var callback = jest.genMockFunction()
      // We're only testing a side-effect of the constructor logic
      new CommentThreadStore(123, callback)

      // A call to create the debounced function
      expect(debounce).toBeCalled()
      expect(debounce.mock.calls[debounce.mock.calls.length - 1][1]).toEqual(5000)
      // An initial call to the debounced function
      expect(debouncedFunc).toBeCalled()
    })
  })

  describe('on first visit to a thread', function() {
    var CommentThreadStore, storage
    var threadStore, callback

    beforeEach(function() {
      jest.dontMock('../../utils/cancellableDebounce.js')
      CommentThreadStore = require('../CommentThreadStore')
      storage = require('../../utils/storage')
      callback = jest.genMockFunction()
      threadStore = new CommentThreadStore(123, callback)
    })

    // A debounced function call is made on the first visit to a thread and when
    // comments are added or deleted.
    afterEach(function() {
      jest.clearAllTimers()
    })

    it('initialises state appropriately', function() {
      expect(threadStore._getVars()).toEqual({
        commentCount: 0
      , newCommentCount: 0
      , newCommentIds: {}
      , maxCommentId: 0
      , prevMaxCommentId: 0
      , isFirstVisit: true
      })
    })

    it('makes initial loaded state available', function() {
      expect(threadStore.getInitialState()).toEqual({
        lastVisit: null
      , commentCount: 0
      , maxCommentId: 0
      })
    })

    it('marks loading as complete if no comments are received for 5 seconds', function() {
      expect(callback).not.toBeCalled()
      expect(threadStore._getVars().isFirstVisit).toBe(true)
      var then = Date.now() + 5000
      spyOn(Date, 'now').andReturn(then)
      jest.runOnlyPendingTimers()
      expect(callback).toBeCalled()
      var callbackArg = callback.mock.calls[callback.mock.calls.length - 1][0]
      expect(callbackArg.lastVisit.valueOf()).toEqual(then)
      expect(callbackArg.maxCommentId).toEqual(0)
      expect(threadStore._getVars().isFirstVisit).toBe(false)
    })

    describe('before loading is considered complete', function() {
      it('tracks details of incoming comments', function() {
        threadStore.commentAdded(123456)
        expect(threadStore._getVars()).toEqual({
          commentCount: 1
        , newCommentCount: 0
        , newCommentIds: {}
        , maxCommentId: 123456
        , prevMaxCommentId: 0
        , isFirstVisit: true
        })

        threadStore.commentDeleted(123456)
        expect(threadStore._getVars()).toEqual({
          commentCount: 0
        , newCommentCount: 0
        , newCommentIds: {}
        , maxCommentId: 123456
        , prevMaxCommentId: 0
        , isFirstVisit: true
        })

        var now = Date.now()
        spyOn(Date, 'now').andReturn(now)
        threadStore.dispose()
        expect(storage.getStore()).toEqual({
          '123:cc': '0'
        , '123:lv': String(now)
        , '123:mc': '123456'
        })
        // TODO Verify that loading callback is cancelled
        // TODO Verify that comment change callback is cancelled
      })
    })
  })

  describe('on a return visit to a thread', function() {
    var CommentThreadStore, storage
    var threadStore, callback

    beforeEach(function() {
      CommentThreadStore = require('../CommentThreadStore')
      storage = require('../../utils/storage')
      storage.setStore({
        '456:cc': '42'
      , '456:lv': '1413424287926'
      , '456:mc': '123456'
      })
      callback = jest.genMockFunction()
      threadStore = new CommentThreadStore(456, callback)
    })

    // A debounced function call is made when comments are added or deleted
    afterEach(function() {
      jest.clearAllTimers()
    })

    it('initialises state appropriately', function() {
      expect(threadStore._getVars()).toEqual({
        commentCount: 0
      , newCommentCount: 0
      , newCommentIds: {}
      , maxCommentId: 0
      , prevMaxCommentId: 123456
      , isFirstVisit: false
      })
    })

    it('makes initial loaded state available', function() {
      var state = threadStore.getInitialState()
      expect(state.lastVisit.valueOf()).toEqual(1413424287926)
      expect(state.commentCount).toEqual(42)
      expect(state.maxCommentId).toEqual(123456)
    })

    it('tracks details of old comments', function() {
      threadStore.commentAdded(123456)
      expect(threadStore._getVars()).toEqual({
        commentCount: 1
      , newCommentCount: 0
      , newCommentIds: {}
      , maxCommentId: 123456
      , prevMaxCommentId: 123456
      , isFirstVisit: false
      })

      threadStore.commentDeleted(123456)
      expect(threadStore._getVars()).toEqual({
        commentCount: 0
      , newCommentCount: 0
      , newCommentIds: {}
      , maxCommentId: 123456
      , prevMaxCommentId: 123456
      , isFirstVisit: false
      })

      var now = Date.now()
      spyOn(Date, 'now').andReturn(now)
      threadStore.dispose()
      expect(storage.getStore()).toEqual({
        '456:cc': '0'
      , '456:lv': String(now)
      , '456:mc': '123456'
      })
      // TODO Verify that comment change callback is cancelled
    })

    it('tracks details of new comments', function() {
      threadStore.commentAdded(123457)
      expect(threadStore._getVars()).toEqual({
        commentCount: 1
      , newCommentCount: 1
      , newCommentIds: {123457: true}
      , maxCommentId: 123457
      , prevMaxCommentId: 123456
      , isFirstVisit: false
      })

      threadStore.commentDeleted(123457)
      expect(threadStore._getVars()).toEqual({
        commentCount: 0
      , newCommentCount: 0
      , newCommentIds: {}
      , maxCommentId: 123457
      , prevMaxCommentId: 123456
      , isFirstVisit: false
      })

      var now = Date.now()
      spyOn(Date, 'now').andReturn(now)
      threadStore.dispose()
      expect(storage.getStore()).toEqual({
        '456:cc': '0'
      , '456:lv': String(now)
      , '456:mc': '123457'
      })
    })

    it('can mark new comments as read', function() {
      var now = Date.now()
      spyOn(Date, 'now').andReturn(now)

      threadStore.commentAdded(123457)
      var newState = threadStore.markAsRead()
      expect(threadStore._getVars()).toEqual({
        commentCount: 1
      , newCommentCount: 0
      , newCommentIds: {}
      , maxCommentId: 123457
      , prevMaxCommentId: 123457
      , isFirstVisit: false
      })
      expect(newState.lastVisit.valueOf()).toEqual(now)
      expect(newState.maxCommentId).toEqual(123457)
      expect(newState.newCommentCount).toEqual(0)
      expect(storage.getStore()).toEqual({
        '456:cc': '1'
      , '456:lv': String(now)
      , '456:mc': '123457'
      })
    })
  })
})