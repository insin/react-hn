'use strict';

function pluralise(howMany) {
  return (howMany == 1 ? '' : 's')
}

module.exports = pluralise