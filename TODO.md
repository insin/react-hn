## "1.0" (webapp versioning lol)

Update initial load detection to fire faster
* keep a tally of "expected" comments vs. loaded comments (add size of .kids
  from every loaded comment
* shorten the debounce delay, but keep it for wiggle room

Split caches into their own module so they can be used from anywhere without
causing circular imports

Always try a cache first when loading an item

Filter items by type/title/date etc. etc.

Saved stories

User submissions

User comments

Settings
* auto collapse threads without new comments
* showdead
* showdeleted
* max number of cached updates (stories / comments)
* always poll tostories/updates options?

## Post-"1.0"

Add more categories based on updates feed (show / ask / jobs) with their own
persistant caches.

Settings
* username
* themes (alt CSS, user CSS)

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