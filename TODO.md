## "1.0" (webapp versioning lol)

*Implementation improvements and HN-equivalent features enabled by the API*

Split caches into their own module so they can be used from anywhere without
causing circular imports

User submissions

User comments

Settings
* auto collapse
* showdead
* showdeleted
* max number of cached updates (stories / comments)
* always poll tostories/updates options?

Deal with delated comments - spinning forever and stopping new load completion
from working!
* Firebase has a callback for errors (it seems?)
* Reactfire doesn't have a way to indicate errors back to the component

Use context instead of manually passing threadStore props down comment trees?

## Post-"1.0"

*New features and shims for stuff not available via the API*

Filter items by type/title/date etc. etc.

(In lieu of API for saved stories) Manual saving of stories

(In lieu of API feeds for these) Add more categories based on updates feed (show
/ ask / jobs) with their own persistant caches.

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