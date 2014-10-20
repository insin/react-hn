'use strict';

function pluralise(howMany, suffixes) {
  return (suffixes || ',s').split(',')[(howMany == 1 ? 0 : 1)]
}

module.exports = pluralise