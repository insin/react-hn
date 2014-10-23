/** @jsx React.DOM */

'use strict';

var React = require('react')

var SettingsStore = require('./stores/SettingsStore')

var Settings = React.createClass({
  componentDidMount: function() {
    this.refs.container.getDOMNode().focus()
  },

  onChange: function(e) {
    SettingsStore[e.target.name] = e.target.checked
    this.forceUpdate()
    SettingsStore.save()
  },

  render: function() {
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
          <p>
            Show comments flagged as deleted &ndash; these can sometimes have replies, which are not
            available via the Hacker News API. Deleted comments will provide a link to Hacker News,
            should you wish to check for replies.
          </p>
        </div>
      </form>
    </div>
  }
})

module.exports = Settings