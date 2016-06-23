require('isomorphic-fetch')

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
	return fetch('http://node-hnapi.herokuapp.com/news' + page).then(function(response) {
	  return response.json()
	}).then(function(json) {
	  var stories = '<ol class="Items__list" start="1">'
	  json.forEach(function(data, index) {
	      var story = '<li class="ListItem" style="margin-bottom: 16px;">' +
	          '<div class="Item__title" style="font-size: 18px;"><a href="' + data.url + '">' + data.title + '</a> ' +
	          '<span class="Item__host">(' + data.domain + ')</span></div>' +
	          '<div class="Item__meta"><span class="Item__score">' + data.points + ' points</span> ' +
	          '<span class="Item__by">by <a href="https://news.ycombinator.com/user?id=' + data.user + '">' + data.user + '</a></span> ' +
	          '<time class="Item__time">' + data.time_ago + ' </time> | ' +
	          '<a href="/news/story/' + data.id + '">' + data.comments_count + ' comments</a></div>'
	      '</li>'
	      stories += story
	  })
	  stories += '</ol>'
	  return stories
	})		
}

function renderNestedComment(data) {
	return '<div class="Comment__kids">' +
		        '<div class="Comment Comment--level1">' +
		            '<div class="Comment__content">' +
		                '<div class="Comment__meta"><span class="Comment__collapse" tabindex="0">[–]</span> ' +
		                    '<a class="Comment__user" href="#/user/' + data.user + '">' + data.user + '</a> ' +
		                    '<time>' + data.time_ago + '</time> ' +
		                    '<a href="#/comment/' + data.id + '">link</a></div> ' +
		                '<div class="Comment__text">' +
		                    '<div>' + data.content +'</div> ' +
		                    '<p><a href="https://news.ycombinator.com/reply?id=' + data.id + '">reply</a></p>' +
		                '</div>' +
		            '</div>' +
		        '</div>' +
		    '</div>'
}

function generateNestedCommentString(data) {
	var output = ''
	data.comments.forEach(function(comment) {
		output+= renderNestedComment(comment)
		if (comment.comments) {
			output+= generateNestedCommentString(comment)
		} 
	})
	return output
}

/**
 * Fetch details of the story/post/item with (nested) comments
 * TODO: Add article summary at top of nested comment thread
 */
exports.fetchItem = function(itemId) {
	return fetch('https://node-hnapi.herokuapp.com/item/' + itemId).then(function(response) {
		return response.json()
	}).then(function(json) {
		var comments = ''
		json.comments.forEach(function(data, index) {
			var comment = '<div class="Item__kids">' + 
			'<div class="Comment Comment--level0">' +
		    '<div class="Comment__content">' +
		        '<div class="Comment__meta"><span class="Comment__collapse" tabindex="0">[–]</span> ' +
		            '<a class="Comment__user" href="#/user/' + data.user + '">' + data.user + '</a> ' +
		            '<time>' + data.time_ago + '</time> ' +
		            '<a href="#/comment/' + data.id + '">link</a></div> ' +
		        '<div class="Comment__text">' +
		            '<div>' + data.content +'</div> ' + 
		            '<p><a href="https://news.ycombinator.com/reply?id=' + data.id + '">reply</a></p>' +
		        '</div>' +
		    '</div>' +
		   '</div>'
			comments += generateNestedCommentString(data) + '</div>' + comment
		})
		return comments
	})
}