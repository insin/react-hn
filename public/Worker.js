/* Import localForage */
importScripts('./localforage-static.js')
// const localCache = []

// setInterval(function() {
// 	this.writeToCache()
// }.bind(this), 10000)

onmessage = (e) => {
  console.log('Worker saving...')
  // localCache.push(e.data)  
  e.data.forEach((item) => {
    localforage.setItem(item[0], item[1])
  })
  postMessage('Worker caching lined up')
}

// writeToCache = (e) => {
// 	localCache.forEach((item) => {
// 		item.forEach((entry) => {
// 			localforage.setItem(entry[0], entry[1])
// 		})
// 	})
// }