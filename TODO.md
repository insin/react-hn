Split caches into their own module

Improve styling, offer HN-alike style as an option (see below)

Filter items by type/title/date etc. etc.

Filter stories you've read/aren't interested in

(In lieu of API for saved stories) Manual saving of stories

(In lieu of API feeds for these) Add more categories based on updates feed (show
/ ask / jobs) with their own persistant caches.

Settings
* username
* themes (alt CSS, user CSS)
* max number of cached updates (stories / comments)
* always poll tostories/updates options?

User submissions
* API: One big list of ids for stories, polls and comments

## Fancy or OTT

Animation when stories change position as updates are received

Highlighted minimap/scroll highlighter to show where new comments are

Tracking of discussions as they happen:
* Use shades of highlighting as the age of a new comment varies
* Option to preserve thread ordering while reading?

Nosiness setting:
* Give comments which are deleted while the thread is being viewed a different
  highlight to the rest (dimmed?)
* Give posts which are edited a different highlight to the rest and provide a
  means of viewing the diff

## Future: Server - topstories use case as POC

Use Firebase client to listen to and cache topstories and their items

Pre-render top stories URLs and send current cache to client
* Client could then communicate with the server instead of Firebase for topstories