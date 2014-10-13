'use strict';

/**
 * Creates a className string including some class names conditionally.
 * @param {string=} staticClassName class name(s) which should always be
 *   included.
 * @param {Object.<string, *>} conditionalClassNames an object mapping class
 *   names to a value which indicates if the class name should be included -
 *   class names will be included if their corresponding value is truthy.
 * @return {string}
 */
function buildClassName(staticClassName, conditionalClassNames) {
  var classNames = []
  if (typeof conditionalClassNames == 'undefined') {
    conditionalClassNames = staticClassName
  }
  else {
    classNames.push(staticClassName)
  }
  var classNameKeys = Object.keys(conditionalClassNames)
  for (var i = 0, l = classNameKeys.length; i < l; i++) {
    if (!!conditionalClassNames[classNameKeys[i]]) {
      classNames.push(classNameKeys[i])
    }
  }
  return classNames.join(' ')
}

module.exports = buildClassName