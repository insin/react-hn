export default {
  get(key, defaultValue) {
    var value = window.localStorage[key]
    return (typeof value != 'undefined' ? value : defaultValue)
  },
  set(key, value) {
    window.localStorage[key] = value
  }
}
