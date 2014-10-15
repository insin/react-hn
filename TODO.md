## Client

Cache topstories pages in sessionStorage in beforeunload
* Only use cache if it's within a certain freshness threshold

Make CommentThreadStore a constructor
* Create a store instance for each item and pass it down as props
  * (Or use context? Seems like a decent use case for it)
* Add tests

Collapse threads without new comments
* Construct tree of ids in CommentThreadStore
* Use newCommentIds and tree to determine which should collapse
* Control collapsing from top-level via CommentThreadStore? Could ditch collapsed state

Extract UpdatesStore from ItemStore
* Still needs to be a singleton acting as only cache for live updates

User submissions (reuse Items?)
User comments (reuse Updates?)
* Items and Updates should be combined
  * Common: list of items, kids not displayed
  * Differences:
    * Items items manage their own loading, Updates uses ItemStore cache, passes data down
    * Items only handles Stories/Jobs/Polls, Updates also handles Comments
  * Combine into one component and use Route props to configure desired functionality

Add more categories based on updates (show / ask / jobs)

Settings
* username
* showdead
* themes (alt CSS, user CSS)
* max number of cached updates (stories / comments)
* always poll updates?

Use username to implement "threads" section
* Like Updates but not cached and include kids

## Future: Server - topstories use case as POC

Use Firebase client to listen to and cache topstories and their items

Pre-render top stories URLs and send current cache to client
* Client could then communicate with the server instead of Firebase for topstories