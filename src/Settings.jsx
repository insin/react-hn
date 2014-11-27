'use strict';

var React = require('react')

var SettingsStore = require('./stores/SettingsStore')

var Settings = React.createClass({
  componentDidMount() {
    this.refs.container.getDOMNode().focus()
  },

  onChange(e) {
    SettingsStore[e.target.name] = e.target.checked
    this.forceUpdate()
    SettingsStore.save()
  },

  render() {
    return <div ref="container" className="Settings" tabIndex="-1">
      <form onChange={this.onChange}>
        <div className="Settings__setting Settings__setting--checkbox">
          <label htmlFor="autoCollapse">
            <input type="checkbox" name="autoCollapse" id="autoCollapse" checked={SettingsStore.autoCollapse}/> auto collapse
          </label>
          <p>Automatically collapse comment threads without new comments on page load.</p>
        </div>
        <div className="Settings__setting Settings__setting--checkbox">
          <label htmlFor="showDead">
            <input type="checkbox" name="showDead" id="showDead" checked={SettingsStore.showDead}/> show dead
          </label>
          <p>Show items flagged as dead.</p>
        </div>
        <div className="Settings__setting Settings__setting--checkbox">
          <label htmlFor="showDeleted">
            <input type="checkbox" name="showDeleted" id="showDeleted" checked={SettingsStore.showDeleted}/> show deleted
          </label>
          <p>Show comments flagged as deleted in threads.</p>
        </div>
      </form>
    </div>
  }
})

module.exports = Settings