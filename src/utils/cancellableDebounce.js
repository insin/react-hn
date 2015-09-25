/**
 * Based on the implementation of _.debounce() from Underscore.js 1.7.0
 * http://underscorejs.org
 * (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 * Distributed under the MIT license.
 *
 * Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 *
 * The returned function has a .cancel() function which can be used to prevent
 * the debounced functiom being called.
 */
function cancellableDebounce(func, wait, immediate) {
  var timeout, args, context, timestamp, result

  var later = function() {
    var last = Date.now() - timestamp
    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last)
    }
    else {
      timeout = null
      if (!immediate) {
        result = func.apply(context, args)
        if (!timeout) {
          context = args = null
        }
      }
    }
  }

  var debounced = function() {
    context = this
    args = arguments
    timestamp = Date.now()
    var callNow = immediate && !timeout
    if (!timeout) {
      timeout = setTimeout(later, wait)
    }
    if (callNow) {
      result = func.apply(context, args)
      context = args = null
    }
    return result
  }

  debounced.cancel = function() {
    if (timeout) {
      clearTimeout(timeout)
    }
  }

  return debounced
}

module.exports = cancellableDebounce
