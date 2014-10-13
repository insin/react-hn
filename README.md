# [react-hn](http://insin.github.io/react-hn)

A [React](http://facebook.github.io/react) &
[react-router](https://github.com/rackt/react-router)-powered implementation of
[Hacker News](https://news.ycombinator.com) using its
[Firebase API](https://github.com/HackerNews/API).

Live version: http://insin.github.io/react-hn

## Features

* Supports display of all item types:
  [stories](http://insin.github.io/react-hn/#/story/8863),
  [jobs](http://insin.github.io/react-hn/#/job/8426937),
  [polls](http://insin.github.io/react-hn/#/poll/126809) and
  [comments](http://insin.github.io/react-hn/#/comment/8054455)
* Basic [user profiles](http://insin.github.io/react-hn/#/user/patio11)
* Collapsible comments
* "Realtime" updates (free via Firebase!)
* Comment counts and last visit times for stories are cached in localStorage
* New comments are highlighted:
  * Comments since your last visit to an item
  * New comments which load while you're reading an item
* Stories with new threads (top-level replies) are marked on list pages
* Stories can be marked as read to remove highighting from new comments

[Feature requests are welcome!](https://github.com/insin/react-hn/issues/new)

## Building

Install [gulp](https://github.com/gulpjs/gulp/) (if you don't already have it)
and dependencies:

```
npm install -g gulp
npm install
```

### Gulp Tasks

* `gulp dist` - builds from scratch into the `/dist` directory.
* `gulp watch` - watches JavaScript in `/src`, linting, transpiling, browserifying
  and copying to `/dist` on every change.

Pass a `--production` flag to use minified JavaScript.

### Build Note

The version of [reactfire](https://github.com/firebase/reactfire) used in the
live build has been hand-tweaked to work around
[an issue when browerifying it](https://github.com/firebase/reactfire/pull/17).

## MIT Licensed