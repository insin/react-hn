require('isomorphic-fetch')
var ejs = require('ejs')
var path = require('path')
var fs = require('fs')

var viewsPath = path.join('src', 'views')

/*
The official Firebase API (https://github.com/HackerNews/API) requires multiple network
connections to be made in order to fetch the list of Top Stories (indices) and then the
summary content of these stories. Directly requesting these resources makes server-side
rendering cumbersome as it is slow and ultimately requires that you maintain your own
cache to ensure full server renders are efficient.

To work around this problem, we can use one of the unofficial Hacker News APIs, specifically
https://github.com/cheeaun/node-hnapi which directly returns the Top Stories and can cache
responses for 10 minutes. In ReactHN, we can use the unofficial API for a static server-side
render and then 'hydrate' this once our components have mounted to display the real-time
experience.

The benefit of this is clients loading up the app that are on flakey networks (or lie-fi)
can still get a fast render of content before the rest of our JavaScript bundle is loaded.
 */

/**
 * Fetch top stories
 */
exports.fetchNews = function(page) {
  page = page || ''
  return fetch('http://node-hnapi.herokuapp.com/news' + page)
    .then(function(response) {
      return response.json()
    })
    .then(function(stories) {
      const pathToFile = path.join(viewsPath, 'news.ejs')
      const templateStr = fs.readFileSync(pathToFile, 'utf8')
      return ejs.render(
        templateStr,
        { stories: stories },
        { filename: pathToFile }
      )
    })
}

/**
 * Fetch details of the story/post/item with (nested) comments
 * TODO: Add article summary at top of nested comment thread
 */
exports.fetchItem = function(itemId) {
  return fetch('https://node-hnapi.herokuapp.com/item/' + itemId)
    .then(function(response) {
      return response.json()
    })
    .then(function(json) {
      const pathToFile = path.join(viewsPath, 'comments.ejs')
      const templateStr = fs.readFileSync(pathToFile, 'utf8')
      return ejs.render(
        templateStr,
        { comments: json.comments, level: 0 },
        { filename: pathToFile }
      )
    })
}
