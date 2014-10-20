## Client

Marking as read based on time rather than comment id would allow it to be done
from list pages

Collapse threads without new comments
* Construct tree of ids in CommentThreadStore
* Use newCommentIds and tree to determine which should collapse
* Control collapsing from top-level via CommentThreadStore? Could ditch
  collapsed state

Child counts for collapsed threads
* New comment counts in collapsed threads

Always use the ItemStore when loading a story to pick up a cached version first
when available.

Filter items by type/title/date etc. etc.

Saved stories
User submissions (reuse Items?)
User comments (reuse Updates?)

Add more categories based on updates feed (show / ask / jobs) with their own
persistant caches.

Settings
* username
* showdead
* themes (alt CSS, user CSS)
* max number of cached updates (stories / comments)
* always poll updates?

Use username to implement "threads" section
* Like Updates but not cached and include kids

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