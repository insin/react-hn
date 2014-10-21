'use strict';

jest.dontMock('moment')
jest.dontMock('../CommentThreadStore')
jest.dontMock('../StoryCommentThreadStore')
jest.dontMock('../../utils/extend')

function getThreadStoreProps(threadStore) {
  return {
    commentCount: threadStore.commentCount
  , newCommentCount: threadStore.newCommentCount
  , isNew: threadStore.isNew
  , maxCommentId: threadStore.maxCommentId
  , prevMaxCommentId: threadStore.prevMaxCommentId
  , isFirstVisit: threadStore.isFirstVisit
  }
}

describe('StoryCommentThreadStore.loadState()', function() {
  it('returns defaults given an unknown item id', function() {
    var StoryCommentThreadStore = require('../StoryCommentThreadStore')
    expect(StoryCommentThreadStore.loadState(123)).toEqual({
      lastVisit: null
    , commentCount: 0
    , maxCommentId: 0
    })
  })

  it('converts to appropriate types for a known id', function() {
    var storage = require('../../utils/storage')
    var StoryCommentThreadStore = require('../StoryCommentThreadStore')
    storage.setStore({
      '456:cc': '42'
    , '456:lv': '1413424287926'
    , '456:mc': '123456'
    })
    var state = StoryCommentThreadStore.loadState(456)
    expect(state.lastVisit.valueOf()).toEqual(1413424287926)
    expect(state.commentCount).toEqual(42)
    expect(state.maxCommentId).toEqual(123456)
  })
})

describe('StoryCommentThreadStore', function() {
  describe('on first visit to a thread', function() {
    it('calls a debounced function to signal the end of loading after 5 seconds', function() {
      jest.mock('../../utils/cancellableDebounce.js')
      var debounce = require('../../utils/cancellableDebounce.js')
      var debouncedFunc = jest.genMockFunction()
      debounce.mockReturnValue(debouncedFunc)

      var StoryCommentThreadStore = require('../StoryCommentThreadStore')
      var callback = jest.genMockFunction()
      // We're only testing a side-effect of the constructor logic
      new StoryCommentThreadStore(123, callback)

      // A call to create the debounced function
      expect(debounce).toBeCalled()
      expect(debounce.mock.calls[debounce.mock.calls.length - 1][1]).toEqual(5000)
      // An initial call to the debounced function
      expect(debouncedFunc).toBeCalled()
    })
  })

  describe('on first visit to a thread', function() {
    var StoryCommentThreadStore, storage
    var threadStore, callback

    beforeEach(function() {
      jest.dontMock('../../utils/cancellableDebounce.js')
      StoryCommentThreadStore = require('../StoryCommentThreadStore')
      storage = require('../../utils/storage')
      callback = jest.genMockFunction()
      threadStore = new StoryCommentThreadStore(123, callback)
    })

    // A debounced function call is made on the first visit to a thread and when
    // comments are added or deleted.
    afterEach(function() {
      jest.clearAllTimers()
    })

    it('initialises state appropriately', function() {
      expect(getThreadStoreProps(threadStore)).toEqual({
        commentCount: 0
      , newCommentCount: 0
      , isNew: {}
      , maxCommentId: 0
      , prevMaxCommentId: 0
      , isFirstVisit: true
      })
    })

    it('makes initial loaded state available', function() {
      expect(threadStore.initialState).toEqual({
        lastVisit: null
      , commentCount: 0
      , maxCommentId: 0
      })
    })

    it('marks loading as complete if no comments are received for 5 seconds', function() {
      expect(callback).not.toBeCalled()
      expect(getThreadStoreProps(threadStore).isFirstVisit).toBe(true)
      var then = Date.now() + 5000
      spyOn(Date, 'now').andReturn(then)
      jest.runOnlyPendingTimers()
      expect(callback).toBeCalled()
      var callbackArg = callback.mock.calls[callback.mock.calls.length - 1][0]
      expect(callbackArg.type).toEqual('load_complete')
      expect(callbackArg.data.lastVisit.valueOf()).toEqual(then)
      expect(callbackArg.data.maxCommentId).toEqual(0)
      expect(getThreadStoreProps(threadStore).isFirstVisit).toBe(false)
    })

    describe('before loading is considered complete', function() {
      it('tracks details of incoming comments', function() {
        threadStore.commentAdded({id: 123456, parent: 123})
        expect(getThreadStoreProps(threadStore)).toEqual({
          commentCount: 1
        , newCommentCount: 0
        , isNew: {}
        , maxCommentId: 123456
        , prevMaxCommentId: 0
        , isFirstVisit: true
        })

        threadStore.commentDeleted({id: 123456, parent: 123})
        expect(getThreadStoreProps(threadStore)).toEqual({
          commentCount: 0
        , newCommentCount: 0
        , isNew: {}
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
    var StoryCommentThreadStore, storage
    var threadStore, callback

    beforeEach(function() {
      StoryCommentThreadStore = require('../StoryCommentThreadStore')
      storage = require('../../utils/storage')
      storage.setStore({
        '456:cc': '42'
      , '456:lv': '1413424287926'
      , '456:mc': '123456'
      })
      callback = jest.genMockFunction()
      threadStore = new StoryCommentThreadStore(456, callback)
    })

    // A debounced function call is made when comments are added or deleted
    afterEach(function() {
      jest.clearAllTimers()
    })

    it('initialises state appropriately', function() {
      expect(getThreadStoreProps(threadStore)).toEqual({
        commentCount: 0
      , newCommentCount: 0
      , isNew: {}
      , maxCommentId: 0
      , prevMaxCommentId: 123456
      , isFirstVisit: false
      })
    })

    it('makes initial loaded state available', function() {
      var state = threadStore.initialState
      expect(state.lastVisit.valueOf()).toEqual(1413424287926)
      expect(state.commentCount).toEqual(42)
      expect(state.maxCommentId).toEqual(123456)
    })

    it('tracks details of old comments', function() {
      threadStore.commentAdded({id: 123456, parent: 456})
      expect(getThreadStoreProps(threadStore)).toEqual({
        commentCount: 1
      , newCommentCount: 0
      , isNew: {}
      , maxCommentId: 123456
      , prevMaxCommentId: 123456
      , isFirstVisit: false
      })

      threadStore.commentDeleted({id: 123456, parent: 456})
      expect(getThreadStoreProps(threadStore)).toEqual({
        commentCount: 0
      , newCommentCount: 0
      , isNew: {}
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
      threadStore.commentAdded({id: 123457, parent: 456})
      expect(getThreadStoreProps(threadStore)).toEqual({
        commentCount: 1
      , newCommentCount: 1
      , isNew: {123457: true}
      , maxCommentId: 123457
      , prevMaxCommentId: 123456
      , isFirstVisit: false
      })

      threadStore.commentDeleted({id: 123457, parent: 456})
      expect(getThreadStoreProps(threadStore)).toEqual({
        commentCount: 0
      , newCommentCount: 0
      , isNew: {}
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

      threadStore.commentAdded({id: 123457, parent: 456})
      var newState = threadStore.markAsRead()
      expect(getThreadStoreProps(threadStore)).toEqual({
        commentCount: 1
      , newCommentCount: 0
      , isNew: {}
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