## Client

Cache topstories pages in sessionStorage in beforeunload
* Only use cache if it's within a certain freshness threshold

Collapse threads without new comments
* Construct tree of ids in CommentThreadStore
* Use newCommentIds and tree to determine which should collapse
* Control collapsing from top-level via CommentThreadStore? Could ditch collapsed state

Child counts for collapsed threads
* New comment counts in collapsed threads

User submissions (reuse Items?)
User comments (reuse Updates?)
* Items and Updates should be combined
  * Common: list of items, kids not displayed
  * Differences:
    * Items items manage their own loading, Updates uses ItemStore cache, passes data down
    * Items only handles Stories/Jobs/Polls, Updates also handles Comments
  * Combine into one component and use Route props to configure desired functionality

Add more categories based on updates feed (show / ask / jobs)

Settings
* username
* showdead
* themes (alt CSS, user CSS)
* max number of cached updates (stories / comments)
* always poll updates?

Use username to implement "threads" section
* Like Updates but not cached and include kids

[newcomments] Fetch link titles for comments which aren't top-level

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