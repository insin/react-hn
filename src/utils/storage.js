module.exports = {
  get(key, defaultValue) {
    if (typeof window === 'undefined') {
      return defaultValue
    }
    else {
      var value = window.localStorage[key]
      return (typeof value != 'undefined' ? value : defaultValue)
    }
  },
  set(key, value) {
    if (typeof window !== 'undefined') {
      window.localStorage[key] = value
    }
  }
}

