// Copyright 2016 Erik Neumann.  All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

goog.provide('myphysicslab.lab.util.Util');

goog.require('goog.array');
goog.require('goog.asserts');

goog.scope(function() {

/** Provides static utility functions.

@todo Some functions are not being used or not used much and could be eliminated.
@todo Too many number formatting functions, get rid of some?
@constructor
@final
@struct
@private
*/
myphysicslab.lab.util.Util = function() {
  throw new Error();
};

var Util = myphysicslab.lab.util.Util;

/** Flag indicates when advanced-compile option is being used during compilation
* by Closure Compiler.
* See [Advanced vs. Simple Compile](Building.html#advancedvs.simplecompile).
* See the shell script `compile_js.sh` which sets this flag at compile time.
* @define {boolean}
*/
Util.ADVANCED = false;

/** Date and time when the code was compiled.
* @define {string}
*/
Util.COMPILE_TIME = '00/00/00';

/** Flag indicates whether to include debug code, must be true for assertions
* to work. Can be set as a compiler option, see the shell script `compile_js.sh`.
* See [Customizing The Build Process](Building.html#customizingthebuildprocess).
* @define {boolean}
*/
Util.DEBUG = false;

/** A string listing the the hexadecimal digits '0123456789abcdef'
* @type {string}
* @const
*/
Util.HEX_DIGITS = '0123456789abcdef';

/** Specifies the relative URL of the directory containing images related to the user
* interface.
* @type {string}
*/
Util.IMAGES_DIR = '.';

/** Maximum number of errors to report by {@link #setErrorHandler}.
* @type {number}
* @const
*/
Util.maxErrors = 3;

/** Maximum representable integer.  Need to avoid having an index ever
* reach this value because we can then no longer increment by 1.
* That is:  2^53 + 1 == 2^53 because of how floating point works.
* @type {number}
* @const
*/
Util.MAX_INTEGER = Math.pow(2, 53);

/** Minimum representable integer.
* @type {number}
* @const
*/
Util.MIN_INTEGER = -Math.pow(2, 53);

/** Whether testing with mock clock.
* @type {boolean}
*/
Util.MOCK_CLOCK = false;

/** Whether running under a modern browser that supports `performance.now()`;
* @type {boolean}
* @const
*/
Util.MODERN_CLOCK = goog.isObject(performance) && goog.isFunction(performance.now);

/** Using this constant allows the compiler to rename and minify.
* @type {number}
* @const
*/
Util.NaN = Number.NaN;

/** Using this constant allows the compiler to rename and minify.
* @type {number}
* @const
*/
Util.NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;

/** Number of errors reported by {@link #setErrorHandler}.
* @type {number}
*/
Util.numErrors = 0;

/** Using this constant allows the compiler to rename and minify.
* @type {number}
* @const
*/
Util.POSITIVE_INFINITY = Number.POSITIVE_INFINITY;

/** Returns the current version number for the myphysiclab library, using
* [Semantic Versioning](http://semver.org).
*
* Given a version number MAJOR.MINOR.PATCH, increment the:
* + MAJOR version when you make incompatible API changes,
* + MINOR version when you add functionality in a backwards-compatible manner, and
* + PATCH version when you make backwards-compatible bug fixes.
*
* Additional labels for pre-release and build metadata are available as extensions to
* the MAJOR.MINOR.PATCH format.
*
* @type {string}
* @const
*/
Util.VERSION = '2.0.0';

/** Converts an array of numbers to string, with commas between each number.
* @param {!(Array<number>|Float64Array)} r  the array to print
* @param {function(number) : string=} nf  number format function to use
* @param {string=} separator the text to insert between each value; default is
    a comma and space `, `
* @return {string} the array of numbers converted to a string
*/
Util.array2string = function(r, nf, separator) {
  nf = nf || Util.NF7E;
  if (!goog.isDef(separator)) {
    separator = ', ';
  }
  var n = r.length;
  var s = '';
  for (var i=0; i<n; i++) {
    s += (i > 0 ? separator : '') + nf(r[i]);
  }
  return s;
};

/** Converts an array of booleans to string, with commas between each boolean.
* @param {!(Array<boolean>|Float64Array)} r  the array to print
* @param {string=} trueString the string that indicates a true value; default `true`
* @param {string=} falseString the string that indicates a false value; default `false`
* @return {string} the array of booleans converted to a string
*/
Util.arrayBool2string = function(r, trueString, falseString) {
  trueString = trueString || 'true';
  falseString = falseString || 'false';
  var n = r.length;
  var s = '';
  for (var i=0; i<n; i++) {
    s += r[i] ? trueString : falseString;
    if (i<n-1) {
      s += ', ';
    }
  }
  return s;
};

/** Returns a [CSS3 color string](https://www.w3.org/TR/css3-color/#rgb-color)
composed of a `#` followed by 3 hex digits corresponding to given red, green, blue
proportions.
@param {number} red proportion of red from 0.0 to 1.0
@param {number} green proportion of green from 0.0 to 1.0
@param {number} blue proportion of blue from 0.0 to 1.0
@return {string} the corresponding CSS3 color string with 3 hex digits
*/
Util.colorString3 = function(red, green, blue) {
  var s = '#';
  var colors = [red, green, blue];
  for (var i=0; i<3; i++) {
    s += Util.numToHexChar1(colors[i]);
  }
  goog.asserts.assert( s.length == 4 );
  return s;
};

/** Returns a [CSS3 color string](https://www.w3.org/TR/css3-color/#rgb-color)
composed of a `#` followed by 6 hex digits corresponding to given red, green, blue
proportions.
@param {number} red proportion of red from 0.0 to 1.0
@param {number} green proportion of green from 0.0 to 1.0
@param {number} blue proportion of blue from 0.0 to 1.0
@return {string} the corresponding CSS3 color string with 6 hex digits
*/
Util.colorString6 = function(red, green, blue) {
  var s = '#';
  var colors = [red, green, blue];
  for (var i=0; i<3; i++) {
    s += Util.numToHexChar2(colors[i]);
  }
  goog.asserts.assert( s.length == 7 );
  return s;
};

/** Creates an `HTMLImageElement` from the given URL.
* @param {string} url location of the image as a URL
* @param {number} width width of the image in pixels
* @param {number=} opt_height  optional height of image in pixels
* @return {!HTMLImageElement}  an HTMLImageElement
*/
Util.createImage = function(url, width, opt_height) {
  var img =  /** @type {!HTMLImageElement} */(document.createElement('img'));
  img.src = url;
  img.width = width;
  img.height = goog.isDef(opt_height) ? opt_height : width;
  return img;
};

/** Returns text with specified number of characters removed from start or end of
* string.
* @param {string} text
* @param {number} n  number of characters to drop; if positive the characters are
*     removed from front of string; if negative then from end of string
* @return {string}
*/
Util.drop = function(text, n) {
  if (n >= 0) {
    return text.slice(n);
  } else {
    return text.slice(0, text.length+n);
  }
};

/** Returns the specified element of an array. Useful in
{@link myphysicslab.lab.util.Terminal} scripts where we prohibit square brackets
that contain anything other than numbers. See {@link #set}.
* @param {!Array} array the array to access
* @param {number} index index of element
* @return {*} the specified element of the array
* @throws {!Error} if index is not a non-negative integer
*/
Util.get = function(array, index) {
  if (!goog.isNumber(index) || index < 0 || index != Math.floor(index)) {
    throw new Error('index is not a non-negative integer: '+index);
  }
  return array[index];
};

/** Returns the length of hypotenuse of right triangle.
* @param {number} a length of a side of the right triangle
* @param {number} b length of other side of the right triangle
* @return {number} length of hypotenuse = sqrt(a^2 + b^2)
*/
Util.hypot = function(a, b) {
  return Math.sqrt(a*a + b*b);
};

/**  Returns `true` if running under Chrome browser.
* @return {boolean} `true` if running under Chrome browser
*/
Util.isChrome = function() {
  var nav = navigator;
  if (nav != null) {
    return nav.userAgent.match(/.*Chrome.*/) != null;
  } else {
    return false;
  }
};

/**  Returns `true` if running on iPhone.
* @return {boolean} `true` if running on iPhone
*/
Util.isIPhone = function() {
  var nav = navigator;
  if (nav != null) {
    return nav.platform == 'iPhone';
  } else {
    return false;
  }
};

/** Returns the given angle limited to the range -pi to +pi.
@param {number} angle  the angle in radians
@return {number} the equivalent angle in the range -pi to +pi
*/
Util.limitAngle = function(angle) {
  var n;
  if (angle > Math.PI) {
    n = Math.floor((angle - -Math.PI)/(2*Math.PI));
    return angle - 2*Math.PI*n;
  } else if (angle < -Math.PI) {
    n = Math.floor(-(angle - Math.PI)/(2*Math.PI));
    return angle + 2*Math.PI*n;
  } else {
    return angle;
  }
};

/** Returns list of names of methods (functions) defined on the given object.
* @param {!Object} obj object to examine
* @return {!Array<string>} list of names of functions defined on the given object
*/
Util.methodsOf = function(obj) {
  var s = [];
  for (var p in obj) {
    if (goog.isFunction(obj[p])) {
      s.push(p);
    }
  }
  goog.array.sort(s);
  return s;
};

/** Returns the name of the property with the given value, within the given object.
* @param {!Object} obj  the object whose values are examined
* @param {!Object} value the value of interest
* @return {string} the name of the property with the given value, within the object;
*   or the empty string if value not found.
*/
Util.nameOf = function(obj, value) {
  for (var p in obj) {
    if (obj[p] === value) {
      return p;
    }
  }
  return '';
};

/** Returns a boolean array with all entries initialized to `false`.
* @param {number} n length of array
* @return {!Array<boolean>} array of booleans with all entries initialized to `false`.
*/
Util.newBooleanArray = function(n) {
  var a = new Array(n);
  for (var i=0; i<n; i++) {
    a[i] = false;
  }
  return a;
};

/** Returns an array of numbers with all entries initialized to zero.
* @param {number} n length of array
* @return {!Array<number>} an array of numbers with all entries initialized to zero.
*/
Util.newNumberArray = function(n) {
  var a = new Array(n);
  for (var i=0; i<n; i++) {
    a[i] = 0;
  }
  return a;
};

/** Formats a number with 0 decimal places.
* @param {?number=} num the number to format
* @return {string} the number with 0 decimal places; or `null` or `undefined`
*/
Util.NF0 = function(num) {
  if (goog.isDefAndNotNull(num))
    return num.toFixed(0);
  else
    return num === null ? 'null' : 'undefined';
};

/** Formats a number with 18 decimal places.
* @param {?number=} num the number to format
* @return {string} the number with 18 decimal places; or `null` or `undefined`
*/
Util.NF18 = function(num) {
  if (goog.isDefAndNotNull(num))
    return num.toFixed(18);
  else
    return num === null ? 'null' : 'undefined';
};

/** Formats a number with 1 decimal place and a plus sign if positive.
* @param {?number=} num the number to format
* @return {string} the number with 1 decimal place and a plus sign if positive;
*    or `null` or `undefined`
*/
Util.NF1S = function(num) {
  if (goog.isDefAndNotNull(num))
    return (num > 0 ? '+' : '') + num.toFixed(1);
  else
    return num === null ? 'null' : 'undefined';
};

/** Formats a number with 2 decimal places.
* @param {?number=} num the number to format
* @return {string} the number with 2 decimal places; or `null` or `undefined`
*/
Util.NF2 = function(num) {
  if (goog.isDefAndNotNull(num))
    return num.toFixed(2);
  else
    return num === null ? 'null' : 'undefined';
};

/** Formats a number with 3 decimal places.
* @param {?number=} num the number to format
* @return {string} the number with 3 decimal places; or `null` or `undefined`
*/
Util.NF3 = function(num) {
  if (goog.isDefAndNotNull(num))
    return num.toFixed(3);
  else
    return num === null ? 'null' : 'undefined';
};

/** Formats a number with 5 decimal places.
* @param {?number=} num the number to format
* @return {string} the number with 5 decimal places; or `null` or `undefined`
*/
Util.NF5 = function(num) {
  if (goog.isDefAndNotNull(num))
    return num.toFixed(5);
  else
    return num === null ? 'null' : 'undefined';
};

/** Formats a number with 5 decimal places, but if too small then switch
* to exponential.
* @param {?number=} num the number to format
* @return {string} the number with 5 decimal places; or `null` or `undefined`
*/
Util.NF5E = function(num) {
  if (goog.isDefAndNotNull(num)) {
    if (Math.abs(num) > 2E-4 || num == 0) {
      return num.toFixed(5);
    } else {
      return num.toExponential(5);
    }
  } else {
    return num === null ? 'null' : 'undefined';
  }
};

/** Formats a number with from zero to 5 decimal places.
* @param {?number=} num the number to format
* @return {string} the number with zero to 5 decimal places; or `null` or `undefined`
*/
Util.nf5 = function(num) {
  if (goog.isDefAndNotNull(num)) {
    var s = num.toFixed(5);
    // remove trailing zeros, and possibly decimal point
    return s.replace(/\.?0+$/, '');
  } else {
    return num === null ? 'null' : 'undefined';
  }
};

/** Formats a number with 7 decimal places.
* @param {?number=} num the number to format
* @return {string} the number with 7 decimal places; or `null` or `undefined`
*/
Util.NF7 = function(num) {
  if (goog.isDefAndNotNull(num))
    return num.toFixed(7);
  else
    return num === null ? 'null' : 'undefined';
};

/** Formats a number with 7 decimal places, but if too small then switch
* to exponential.
* @param {?number=} num the number to format
* @return {string} the number with 7 decimal places; or `null` or `undefined`
*/
Util.NF7E = function(num) {
  if (goog.isDefAndNotNull(num)) {
    if (Math.abs(num) > 2E-6) {
      return num.toFixed(7);
    } else {
      return num.toExponential(7);
    }
  } else {
    return num === null ? 'null' : 'undefined';
  }
};

/** Formats a number with from zero to 7 decimal places.
* @param {?number=} num the number to format
* @return {string} the number with zero to 7 decimal places; or `null` or `undefined`
*/
Util.nf7 = function(num) {
  if (goog.isDefAndNotNull(num)) {
    var s = num.toFixed(7);
    // remove trailing zeros, and possibly decimal point
    return s.replace(/\.?0+$/, '');
  } else {
    return num === null ? 'null' : 'undefined';
  }
};

/** Formats a number with 9 decimal places.
* @param {?number=} num the number to format
* @return {string} the number with 9 decimal places; or `null` or `undefined`
*/
Util.NF9 = function(num) {
  if (goog.isDefAndNotNull(num))
    return num.toFixed(9);
  else
    return num === null ? 'null' : 'undefined';
};

/** Formats a number with 7 digit exponential notation.
* @param {?number=} num the number to format
* @return {string} the number in 7 digit exponential notation; or `null` or `undefined`
*/
Util.NFE = function(num) {
  if (goog.isDefAndNotNull(num))
    return num.toExponential(7);
  else
    return num === null ? 'null' : 'undefined';
};

/** Formats a number with 17 digit exponential notation.
* @param {?number=} num the number to format
* @return {string} the number in 17 digit exponential notation; or `null` or `undefined`
*/
Util.NFSCI = function(num) {
  if (goog.isDefAndNotNull(num))
    return num.toExponential(17);
  else
    return num === null ? 'null' : 'undefined';
};

/**  Maps a number in range 0 to 1 to a single hexadecimal character from 0 to f.
* @param {number} n  number between 0 and 1
* @return {string}  the number converted to a single hexadecimal character
*/
Util.numToHexChar1 = function(n) {
  n = Math.floor(0.5 + 16*n);
  if (n >= 15)
    return 'f';
  else if (n <= 0)
    return '0';
  else {
    return Util.HEX_DIGITS.charAt(n);
  }
};

/**  Maps a number in range 0 to 1 to a two-digit hexadecimal number.
* @param {number} n  number between 0 and 1
* @return {string}  the number converted to a two-digit hexadecimal number
*/
Util.numToHexChar2 = function(n) {
  n = Math.floor(0.5 + 256*n);
  if (n >= 255)
    return 'ff';
  else if (n <= 0)
    return '00';
  else {
    var i = Math.floor(n/16);
    var j = n % 16;
    return Util.HEX_DIGITS.charAt(i) + Util.HEX_DIGITS.charAt(j);
  }
};

/** Formats the `toString` represention of an object to be more readable. Adds
newlines and spaces so that each property of an object appears on a separate line, and
is indented according to the "level depth" of objects being formatted.

Assumes that the object's `toString` is formatted according to Javascript conventions
like this:

    ClassName{property1: value1, property2: value2}

Semi-colons or commas are equivalent for separating properties. Assumes that arrays
are formatted like standard JavaScript as `[object1, object2, object3]`.

The `level` depth works as follows: Level 1 means that the each property of the
object appears on a separate line preceded a single indent string. For example:

    ClassName{
      property1: value1,
      property2: value2,
    }

Level 2 is like level 1, but additionally any object that appears as the value of a
level 1 property is also expanded:

    ClassName{
      property1: ClassName2{
        property3: value3,
        property4: value4
      },
      property2: value2,
    }

Level 3 adds another level of expansion for objects found at Level 2. And so on for
higher levels.

    ClassName{
      property1: ClassName2{
        property3: value3,
        property4: ClassName3{
          property5: value5,
          property6: value6
        }
      },
      property2: value2,
    }

The "property detection" is done by looking for commas or semicolons.
A new level is begun whenever an opening brace `{` or square bracket `[` is seen.
Anything in quotes is ignored.  Works for arrays also.

@todo  escaped quotes in strings should be ignored.

* @param {string|!Object} input the string to reformat. Typically this is the
*     `toString` representation of an object.
* @param {number=} level how much nesting of the object to pay attention to. Nesting
*     occurs whenever opening braces `{` or brackets `[` are seen in the input string.
*     Default is 2.
* @param {string=} indent String to use for indenting each new level. Default is two
*     spaces.
* @return {string} the input string formatted to be more readable
*/
Util.prettyPrint = function(input, level, indent) {
  if (!goog.isNumber(level)) {
    level = 2;
  }
  if (!goog.isString(indent)) {
    indent = '  ';
  }
  var inp = String(input);
  var out = '';
  var lvl = 0;  // number of unbalanced braces seen
  var n = inp.length;
  var ignoreSpace = false;
  /** @type {!Array<string>} */
  var closeList = [];
  /** @type {string} */
  var closeSymbol = '';
  next_char: for (var i = 0; i<n; i++) {
    var c = inp.charAt(i);
    // we ignore spaces until we find a non-space
    if (ignoreSpace) {
      if (c == ' ') {
        continue;
      } else {
        ignoreSpace = false;
      }
    }
    if (c == '{' || c == '[') {
      lvl++;
      if (lvl <= level) {
        // after every open brace, insert a new line and some spaces
        out += c+'\n';
        // indent according to level
        for (var l=0; l<lvl; l++) {
          out += indent;
        }
        ignoreSpace = true;
      } else {
        // beyond desired level, so just write the open brace
        out += c;
      }
      closeList.push(closeSymbol);
      closeSymbol = (c == '{') ? '}' : ']';
    } else if (c == closeSymbol) {
      if (lvl <= level) {
        lvl--;
        out += '\n';
        // indent according to level
        for (var l=0; l<lvl; l++) {
          out += indent;
        }
        out += c;
      } else {
        // beyond desired level, so just write the close brace
        lvl--;
        out += c;
      }
      closeSymbol = closeList.pop();
      if (lvl < 0)
        throw new Error('unbalanced '+closeSymbol+' at '+i+' in '+input);
    } else if (c == '"' || c == '\'') {
      var q = c;
      var k = i;  // index of starting quote
      out += c;
      // read entire quoted string
      while (++i<n) {
        c = inp.charAt(i);
        out += c;
        if (c == q) {
          // found balancing quote
          continue next_char;
        }
      }
      throw new Error('unbalanced quote at '+k+' in '+input);
    } else if ((c == ',' || c == ';') && lvl <= level) {
      // after every comma, insert a new line and some spaces
      out += c+'\n';
      // indent according to level
      for (var l=0; l<lvl; l++) {
        out += indent;
      }
      ignoreSpace = true;
    } else {
      out += c;
    }
  }
  // cludge:  eliminate blank lines (happens with empty arrays).
  out = out.replace(/^\s+\n/gm, '');
  return out;
};

/** Prints array of numbers to `console.log` on multiple lines so that each line
* is no longer than `lineLength`.
* @param {!Array<number>} array the array to print
* @param {number=} lineLength  maximum length of a line, default 80
* @param {function(number) : string=} format  formatting function, default is NF5E
*/
Util.printArray = function(array, lineLength, format) {
  if (Util.DEBUG) {
    lineLength = lineLength || 80;
    format = format || Util.NF5E;
    var s = '';
    for (var i=0, len=array.length; i<len; i++) {
      var r = format(array[i]);
      if (s.length + r.length > lineLength) {
        console.log(s);
        s = '  ' + r;  // indent lines after first
      } else {
        s += ' '+ r;
      }
    }
    if (s.length > 0) {
      console.log(s);
    }
  }
};

/** Print the string to debug console. The advantage of using this is that
`Util.println` can be minified by the compiler, whereas `console.log`
cannot be. A disadvantage is that in console, you always see this file and line number
as the location of each println message, instead of where the message is actually from
(the caller).
* @param {string} s the string to print
*/
Util.println = function(s) {
  console.log(s);
};

/** Prints to `console.log` a variable set of numbers using `NF5` format.
@param {string} s prefix to print
@param {...number} nums numbers to print, variable number of arguments
*/
Util.printNums5 = function(s, nums) {
  for (var i=1; i<arguments.length; i++) {
    s += ' '+Util.NF5(arguments[i]);
  }
  console.log(s);
};

/** Returns list of names of (non-function) properties defined on the given object, and
optionally also shows the values of the properties.
* @param {?Object} obj the object to examine, or null
* @param {boolean=} showValues whether to show values of the properties (default is
*    `false`)
* @return {!Array<string>} array of names of properties of the object (and possibly
*    their values)
*/
Util.propertiesOf = function(obj, showValues) {
  if (obj === null) {
    return ['null'];
  }
  showValues = showValues || false;
  var s = [];
  /** @type {string} */
  var p;
  for (p in obj) {
    if (goog.isFunction(obj[p])) {
      continue;
    }
    if (showValues) {
      s.push(p+': '+obj[p]);
    } else {
      s.push(p);
    }
  }
  goog.array.sort(s);
  return s;
};

/** Sets the specified element of an array. Useful in
{@link myphysicslab.lab.util.Terminal} scripts where we prohibit square brackets
that contain anything other than numbers. See {@link #get}.
* @param {!Array} array the array to access
* @param {number} index index of element
* @param {*} value the value to set the element to
* @return {*} the value that was set
* @throws {!Error} if index is not a non-negative integer
*/
Util.set = function(array, index, value) {
  if (!goog.isNumber(index) || index < 0 || index != Math.floor(index)) {
    throw new Error('index is not a non-negative integer: '+index);
  }
  return array[index] = value;
};

/** Sets a global error handler function in `window.onerror` to alert user.
* @return {undefined}
*/
Util.setErrorHandler = function() {
  window.onerror = function(msg, url, line) {
    var s = msg + '\n' + url + ':' + line;
    if (Util.DEBUG) {
      console.log(s);
    }
    if (Util.numErrors++ < Util.maxErrors) {
      alert(s);
      //return true;  this causes compile error under NTI
    }
  }
  // Check that assertions are working.
  // Note that assertions are always removed under advanced compile.
  if (goog.DEBUG && !Util.ADVANCED) {
    try {
      var a = 1;
      goog.asserts.assert(1 == 0);
      a = 2;
    } catch(e) {
      console.log('asserts are working');
    }
    if (a == 2) {
      throw new Error('asserts are not working');
    }
  } else if (Util.DEBUG) {
    console.log('WARNING: asserts are NOT enabled!');
  }
};

/** Specifies the relative URL of the directory containing images related to the user
* interface.  The value is accessible via {@link #IMAGES_DIR}.
* @param {string=} images_dir the relative URL of the images directory;
*     if undefined `IMAGES_DIR` is not changed.
*/
Util.setImagesDir = function(images_dir) {
  if (images_dir !== undefined) {
    Util.IMAGES_DIR = images_dir;
  }
};

/** Returns the current time as given by the system clock, in seconds.
* @return {number} the current time as given by the system clock, in seconds
*/
Util.systemTime = function() {
  if (Util.MODERN_CLOCK && !Util.MOCK_CLOCK) {
    // use high resolution time if available and not running tests with mock clock
    return performance.now()*1E-3;
  } else {
    return goog.now()*1E-3;
  }
};

/** Returns specified number of characters from start or end of string.
* @param {string} text
* @param {number} n  number of characters to take; if positive the characters are
*     taken from front of string; if negative then from end of string
* @return {string}
*/
Util.take = function(text, n) {
  if (n == 0) {
    return '';
  } else if (n > 0) {
    return text.slice(0,n);
  } else {
    return text.slice(text.length+n, text.length);
  }
};

/** Throws an error if the argument is not a finite number.
* @param {number} value the number to test
* @return {number} the value that passed the test
* @throws {!Error} if the argument is not a finite number
*/
Util.testFinite = function(value) {
  if (!isFinite(value)) {
    throw new Error('not a finite number '+value);
  }
  return value;
};

/** Throws an error if the argument is not a number.
* @param {number} value the number to test
* @return {number} the value that passed the test
* @throws {!Error} if the argument is not a number
*/
Util.testNumber = function(value) {
  if (isNaN(value)) {
    throw new Error('not a number '+value);
  }
  return value;
};

/** Returns the
* [language independent form](Building.html#languageindependentnames) of the given
* string by changing to uppercase and replacing spaces and dashes with underscores.
* @param {string} text
* @return {string} the text upper-cased and with spaces and dashes replaced by
*   underscores
*/
Util.toName = function(text) {
  return text.toUpperCase().replace(/[ -]/g, '_');
};

/** Whether all elements of the array are unique with no duplicates.
* @param {!Array<string>} arr the array to examine
* @return {boolean} Whether all elements of the array are unique with no duplicates.
*/
Util.uniqueElements = function(arr) {
  var len = arr.length;
  if (len > 1) {
    // make a copy so that we don't modify the passed-in array
    /** @type {!Array<string>} */
    var a = new Array(len);
    for (var i=0; i<len; i++) {
      a[i] = arr[i];
    }
    goog.array.sort(a);
    var last = /** @type {string} */(a[0]);
    for (i=1; i<len; i++) {
      if (last == a[i]) {
        return false;
      }
      last = a[i];
    }
  }
  return true;
};

/** Ensures the given text consists of only uppercase letters, numbers and underscore
* and first character is a letter or underscore. This is required for
* [language independent names](Building.html#languageindependentnames).
* @param {string} text
* @return {string} the validated text
* @throws {!Error} if text does not qualify as a name
*/
Util.validName = function(text) {
  if (!text.match(/^[A-Z_][A-Z_0-9]*$/)) {
    throw new Error('not a valid name: '+text);
  }
  return text;
};

/** Returns `true` if the numbers are significantly different to a certain tolerance
level, adjusting the tolerance for larger numbers.

For numbers with absolute value smaller than `magnitude` the numbers are compared using
a fixed tolerance of `magnitude*epsilon`.

For numbers with absolute value larger than `magnitude`, the tolerance is
`epsilon` times the larger of the absolute values of the numbers being compared.

Unless specified, the default for `magnitude` is 1.0 and `epsilon` is 1E-14. These
settings return `true` if the numbers are significantly different to approximately 14
decimal digits when their magnitude is near 1.0.

The goal is to have a test that is immune to the inaccuracy of double arithmetic.
Doubles have 15 to 17 significant decimal digits of accuracy, so comparing 14
significant digits should be fairly safe from the inaccuracy in double arithmetic.

This method takes into account the size of the numbers being compared, so it is
safer than code such as

    if (Math.abs(a - b) > 1E-16)  // do something

Doubles have 15 to 17 significant decimal digits of accuracy. When the numbers being
compared are much bigger in magnitude than 1.0, then this test is too strict -- it
effectively is comparing to zero, meaning exact equality.

See [Comparing Floating Point Numbers, 2012
Edition](https://randomascii.wordpress.com/2012/02/25/comparing-floating-point-numbers-2012-edition/) by Bruce Dawson.

See [StackOverflow: How dangerous is it to compare floating point values?](http://stackoverflow.com/questions/10334688/how-dangerous-is-it-to-compare-floating-point-values)


@param {number} arg1  the first number to compare
@param {number} arg2  the second number to compare
@param {number=} epsilon the small value used with `magnitude` to calculate
    the tolerance for deciding when the numbers are different, default is 1E-14.
@param {number=} magnitude the approximate magnitude of the numbers being compared,
    default is 1.0.
@return {boolean} true if the doubles are different to 14 significant decimal digits
@throws {!Error} if `magnitude` or `epsilon` is negative or zero
*/
Util.veryDifferent = function(arg1, arg2, epsilon, magnitude) {
  epsilon = epsilon || 1E-14;
  if (epsilon <= 0) {
    throw new Error('epsilon must be positive '+epsilon);
  }
  magnitude = magnitude || 1.0;
  if (magnitude <= 0) {
    throw new Error('magnitude must be positive '+magnitude);
  }
  var maxArg = Math.max(Math.abs(arg1), Math.abs(arg2));
  var max = maxArg > magnitude ? maxArg : magnitude;
  return Math.abs(arg1 - arg2) > max * epsilon;
};

/** Sets all values of array to zero
* @param {!Array<number>} array the array to modify
*/
Util.zeroArray = function(array) {
  var n = array.length;
  for (var i=0; i<n; i++) {
    array[i] = 0;
  }
};

/**  The default number format to use in `toString` methods.
* @type {function(?number=): string}
* @const
*/
Util.NF = Util.nf5; // THIS MUST BE AT END OF FILE OTHERWISE THIS IS UNDEFINED

}); // goog.scope
