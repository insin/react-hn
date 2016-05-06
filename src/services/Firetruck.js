/*!
 *
 *  Copyright 2016 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */

/*global define, require, module*/
'use strict';

const Firebase = require('firebase/lib/firebase-web');
const localForage = require('localforage');

class Firetruck extends Firebase {

  constructor(url) {
    super(url);
    console.info('Firetruck initialized');

    /* Cache responses offline by default */
    this.cacheOffline = true;
    /* Namespace used when caching responses to localForage */
    this.namespace = 'Firetruck_';
    /* Enable debug information */
    this.debug = true;

    /* Timeout interval for Worker caching */
    this.timeout = 30000;

    this.overrideOn = Firebase.prototype.on;
    this.overrideOnce = Firebase.prototype.once;

    /* Queue for responses to be written to the cache */
    this.queue = [];

    this.handleOfflineEvents();

    // TODO: Switch to rAF
    setInterval(() => {
      this.replayQueue();
    }, this.timeout);
  }

  /**
  * on() is used to listen for data changes at a particular location. Responses from it
  * are cached by default. To switch this off, set cacheOffline to false.
  * @param  {String}   eventType      One of the following strings: "value", "child_added", "child_changed", "child_removed", or "child_moved."
  * @param  {Function} callback       A callback that fires when the specified event occurs. 
  * @param  {Function} cancelCallback An optional callback that will be notified if your event subscription is ever canceled
  * @param  {Object}   context        If provided, this object will be used as this when calling your callback
  */
  on(eventType, callback, cancelCallback, context) {
    let suppliedCallback = callback;

    if (this.cacheOffline || this.cacheOffline === undefined) {
      suppliedCallback = snapshot => {
        if (navigator.onLine) {
          callback(snapshot);
        }

        this.persist(snapshot, () => {
          if (navigator.onLine === false) {
            callback(snapshot); 
          }   
        });
      };
    }
    this.overrideOn.call(this, eventType, suppliedCallback, cancelCallback, context);
  }

  /**
  * Listens for exactly one event of the specified event type, and then stops listening. Responses
  * are cached by default.
  * @param  {String}   eventType       One of the following strings: "value", "child_added", "child_changed", "child_removed", or "child_moved."
  * @param  {Function} successCallback A callback that fires when the specified event occurs. The callback will be passed a DataSnapshot
  * @param  {Function} failureCallback An optional callback that will be notified if your client does not have permission to read this data
  * @param  {Object}   context         If provided, this object will be used as this when calling your callback.
  */
  once(eventType, successCallback, failureCallback, context) {
    let suppliedCallback = successCallback;

    if (this.cacheOffline || this.cacheOffline === undefined) {
      suppliedCallback = snapshot => {

        if (navigator.onLine) {
          successCallback(snapshot);
        }

        this.persist(snapshot, () => {
          if (navigator.onLine === false) {
            successCallback(snapshot); 
          }
        });
      };
    }
    this.overrideOnce.call(this, eventType, suppliedCallback, failureCallback, context);
  }

  /**
  * Gets a Firebase reference for the location at the specified relative path. Firetruck
  * overrides .child() returning a subclassed version.
  * @param  {String} childPath A relative path from this location to the desired child location.
  * @return {Object}           The Firebase reference for the specified child location.
  */
  child(childPath) {
    return new Firetruck(`${this.toString()}/${childPath}`);
  }  

  /**
  * Persist data from a Firebase Data Snapshot in localForage so that it can be
  * restored at a later point. This retrieves .exportVal() entries from the snapshot,
  * iterates over it and stores each leaf ('.value','.priority') into localForage.
  * @param  {Object}   snapshot Firebase Data Snapshot
  * @param  {Function} cb       A callback that fires when the specified event completes.
  */
  persist(snapshot, cb) {
    this.timeStart('persist');
    const initialPath = snapshot.ref().toString();
    const exportVal = snapshot.exportVal();
    /* Clear data already cached as a precaution in case it has been removed */
    this._clearPath(initialPath, err => {
      this._walk(initialPath, exportVal, (path, data) => {
        // localForage.setItem(`${this.namespace}partial_${path}`, JSON.stringify(data));
        this.queueSet(`${this.namespace}partial_${path}`, JSON.stringify(data))
      });
      /* If saving a/b and /a/c, fetching /a will not be cached. Firebase isn't aware that
      /a/b and /a/c comose the contents of /a */
      // localForage.setItem(`${this.namespace}full_${initialPath}`, 1);
      this.queueSet(`${this.namespace}full_${initialPath}`, 1)
      cb();
    });
    this.timeEnd('persist');
  }  

  /**
  * Clear data for a specified path and all children under it from localForage.
  * @param  {String}   path A path to be cleared
  * @param  {Function} cb   A callback that fires when the specified event completes.
  */
  _clearPath(path, cb) {
    this.timeStart('clearpath');
    localForage.iterate((value, key, iterationNumber) => {
      const indexOfPath = key.indexOf(`${this.namespace}partial_${path}`);
      if (indexOfPath === 0) {
        /* Component of the path that needs to be cleared */
        localForage.removeItem(key);
      }
    }, err => {
      cb(err);
    });
    this.timeEnd('clearpath');
  }

  _getChildPathValue(path, child) {
    return `${path}/${child}`;
  }

  /**
  * Traverse an object representing the .exportVal() of a Firebase Data Snapshot
  * recursively, running a callback for each leaf node.
  * @param  {String}   path
  * @param  {Object}   exportVal
  * @param  {Function} callback
  */
  _walk(path, exportVal, callback) {
    this.timeStart('walk');
    if (!exportVal) {
      return;
    }

    if (typeof exportVal == 'number' || typeof exportVal === 'string') {
      /* Leaf: a simple type with priority null */
      callback(path, exportVal);
    } else if (exportVal['.value'] && exportVal['.priority']) {
      /* Leaf: a simple type with priority defined*/
      callback(path, {
        '.priority': exportVal['.priority'],
        '.value': exportVal['.value']
      });
    } else {
      if (exportVal['.priority']) {
        /* Leaf: a complex type with priority defined */
        /* This is considered a leaf as it requires a node in localForage to 
        store priority. It also has children that need to be iterated over. */
        callback(path, {
          '.priority': exportVal['.priority']
        });
      }
      /* Recurse over node children */
      for (let child in exportVal) {
        if (child === '.priority' || child === '.value') {
          continue;
        }
        const childPath = this._getChildPathValue(path, child);
        this._walk(childPath, exportVal[child], callback);
      }
    }
    this.timeEnd('walk');
  }

  /**
  * Reconstruct a value from the sum of its parts in localForage
  * @param  {String}   path
  * @param  {Function} cb
  */
  _reconstitute(path, cb) {
    this.timeStart('reconstitute');
    const ret = {};
    localForage.iterate((value, key, iterationNumber) => {
      let indexOfPath = key.indexOf(this.namespace + 'partial_' + path);
      if (indexOfPath !== 0) {
        return undefined;
      }
      if (indexOfPath === 0) {
        const keyItem = localForage.getItem(key, (err, value) => {
          let val = JSON.parse(value);
          const subKey = key.substring((this.namespace + 'partial_' + path).length);
          let currentTarget = ret;

          if (subKey) {
            const parts = subKey.split('/');
            for (let i = 0; i < parts.length; i++) {
              if (!parts[i]) {
                continue;
              }
              if (typeof currentTarget[parts[i]] == 'undefined') {
                currentTarget[parts[i]] = {};
              }
              currentTarget = currentTarget[parts[i]];
            }
          }
          /* Set priority and value of our nested objects */
          if (typeof val === 'object') {
            if (val['.priority']) {
              currentTarget['.priority'] = val['.priority'];
            } else {
              currentTarget['.priority'] = null;
            }

            if (val['.value']) {
              /* Contains a value primitive. Escalate */
              val = val['.value'];
            }
          }

          currentTarget['.value'] = val;
        });
      }
    }, (err, result) => {
      cb(ret);
    });
    this.timeEnd('reconstitute');
  }

  /**
  * Perform a Firebase .set() on all objects locally stored to initialize the
  * Firebase cache on a cold bootup. This overwrites server values. It is 
  * recommended to use .validate() rules to make sure correct data is used in the
  * event of merge conflicts.
  */
  restore() {
    this.timeStart('restore');
    if (navigator.onLine === false) {
      return localForage.iterate((value, key, iterationNumber) => {
        if (key && key.indexOf(this.namespace + 'full_') === 0) {
          let url = key.substring((this.namespace + 'full_').length);
          this._reconstitute(url, val => {
            const ref = new Firetruck(url);
            /* Register callback so Firebase caches this location */
            ref.on('value', () => {});
            /* Populate with a value */
            if (navigator.onLine === true) {
              ref.set(val);  
            }
          });
        }
      });      
    }
    this.timeEnd('restore');
  }

  queueSet(path, data) {
    if (navigator.onLine === true) {
      this.queue.push([path, data])
      // this.queue[path] = ([path, data]);
    }
  }

  replayQueue() {
    if (navigator.onLine === true) {
      console.log('About to replay queue and send to worker');
      this.sendToWorker(this.queue);      
    } else {
      console.log('Skipping Worker caching...')
    }   
  }

  clearQueue() {
    this.queue = []
  }

  /**
  * Clear out localForage of any Firetruck-persisted items
  * Firebase's internal cache may continue storing these items if they have been
  * requested on page-load.
  */
  clear() {
    return localForage.iterate((value, key, iterationNumber) => {
      if (key && key.indexOf(this.namespace) === 0) {
        localForage.removeItem(key);
      }
    });
  }

  sendToWorker(values) {
    if (navigator.onLine) {
      console.log('Sending data to be cached by Worker')
      window.HNWorker.postMessage(values);
      this.clearQueue();      
    }
  }

  handleOfflineEvents() {
    window.addEventListener('offline', function() {
      Firebase.goOffline();
      console.info('Firetruck is offline');
    });

    window.addEventListener('online', function() {
      Firebase.goOnline();
      console.info('Firetruck is back online');
    });
  }

  /**
  * Turn offline caching on.
  */
  switchOffCaching() {
    this.cacheOffline = false;
  }
  
  /**
  * Turn offline caching off. This should behave the same as a normal
  * Firebase instance.
  */
  switchOnCaching() {
    this.cacheOffline = true;
  }

  timeStart(label) {
    if (this.debug) {
      console.time(label); 
    }
  }

  timeEnd(label) {
    if (this.debug) {
      console.timeEnd(label);
    }
  }
}

module.exports = Firetruck;
