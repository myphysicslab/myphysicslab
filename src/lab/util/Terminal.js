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

goog.provide('myphysicslab.lab.util.Terminal');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.KeyCodes');
goog.require('goog.events.KeyEvent');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Parser');
goog.require('myphysicslab.lab.util.GenericMemo'); // in case user wants to use it.

goog.scope(function() {

const Util = goog.module.get('myphysicslab.lab.util.Util');
var Parser = myphysicslab.lab.util.Parser;

/** Executes scripts and provides a command line user interface with separate text
fields for input and output. Executes EasyScript or JavaScript. The JavaScript is a
safe subset to prevent malicious scripts. Allows use of "short names" to replace full
namespace pathnames of classes.

After the script is executed the result is converted to text and displayed in the
output text field. The output is not displayed if the result is `undefined` or the
script ends with a semicolon.

See also [Customizing myPhysicsLab Software](Customizing.html).


Getting Help
------------
Type `help` in the Terminal input text area and press return to see the help message.
Several useful Terminal commands are shown. The help message also specifies whether the
code was *simple-compiled* or *advanced-compiled*.

Perhaps the most useful command is `vars` which shows the list of variables that are
available.


<a id="twotypesofscripts"></a>
Two Types of Scripts
--------------------

Terminal can execute two types of scripts:

1. JavaScript: a safe subset of JavaScript, where you can use short-names that are
    run thru {@link #expand}. JavaScript is only available when the application
    has been
     [simple-compiled](https://www.myphysicslab.com/develop/docs/Building.html#advancedvs.simplecompile)

2. EasyScript: a very simple scripting language for setting Parameter values.
    See {@link myphysicslab.lab.util.EasyScriptParser} for syntax details.
    Works with either simple or advanced-compile

These two types of script can be intermixed in a single script as long as they are
separated by a semicolon. For example, here are both types of scripts in
one script which could be entered in
[simple-compiled PendulumApp](https://www.myphysicslab.com/develop/build/sims/pendulum/PendulumApp-en.html?SHOW_TERMINAL=true).

    DAMPING=0.1; GRAVITY=9.8; ANGLE=2.5; bob.setFillStyle('red');

The first three commands are EasyScript commands that set Parameter values; the last is
a JavaScript command.

In most simple-compiled applications EasyScriptParser is available in the variable
`easyScript`, which you can use to execute EasyScript from within JavaScript. Here are
examples that can be entered in
[simple-compiled PendulumApp](https://www.myphysicslab.com/develop/build/sims/pendulum/PendulumApp-en.html?SHOW_TERMINAL=true).

    easyScript.parse('angle')

    easyScript.parse('angle='+Math.PI/2)

    easyScript.getParameter('gravity').getValue()

    easyScript.getParameter('gravity').setValue(2.5)


<a id="safesubsetofjavascript"></a>
Safe Subset of JavaScript
-------------------------

To prevent malicious scripts from being executed, only a safe subset of JavaScript is
allowed. See the book *JavaScript: The Definitive Guide* by Flanagan, section 11.1.2
'Subsets for Security'. JavaScript commands are executed via the JavaScript `eval`
function under
[strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode).

We prohibit access to:
+ most global variables including the `window` object which defines global variables.
+ certain methods and properties of Terminal.
+ properties and methods that access or change the structure of the HTML document.

We allow usage of the JavaScript `eval` function, but it is mapped to the Terminal
{@link #eval} which does the vetting of the script.

Property access with square brackets is prohibited, except for accessing array elements
with non-negative integers. This is to prevent accessing prohibited properties by
manipulating strings to fool the "safe subset" checking. For example the following is
not allowed:

    > terminal['white'+'List_']
    Error: prohibited usage of square brackets in script: terminal['white'+'List_']
    > var idx = 'whiteList_'
    whiteList_
    > terminal[idx]
    Error: prohibited usage of square brackets in script: terminal[idx]

Array access can be done only with a non-negative integer number:

    > var a = ["red", "green", "blue"]
    red,green,blue
    > a[2]
    blue

Array access cannot be done with a variable or expression, but you can use the built-in
functions {@link Util#get} and {@link Util#set}:

    > a[1+1]
    Error: prohibited usage of square brackets in script: a[1+1]
    > Util.get(a, 1+1)
    blue
    > Util.set(a, 1+1, "orange")
    orange
    > a
    red,green,orange


<a id="shortnames"></a>
Short Names
-----------
To allow for shorter scripts, we define a variety of regular expressions which
convert short names to their proper long expanded form.

Most class names will have their equivalent short-name defined. For example you can type

    > new DoubleRect(0,0,1,1)
    DoubleRect{left_: 0, bottom_: 0, right_: 1, top_: 1}

instead of

    > new myphysicslab.lab.util.DoubleRect(0,0,1,1)
    DoubleRect{left_: 0, bottom_: 0, right_: 1, top_: 1}

Applications will typically make their key objects available with short-names.
So instead of `app.sim` you can just type `sim`.
You can see this at work by using {@link #setVerbose}:

    > terminal.setVerbose(true)
    > new Vector(2,3)
    >> new myphysicslab.lab.util.Vector(2,3)
    Vector{x: 2, y: 3}

In verbose mode, the command is echoed a second time to show how it appears after
{@link #expand expansion}. The terminal prompt symbol is doubled to distinguish
the expanded version.

Short-names are implemented by defining a set of regular expression replacement rules
which are applied to the Terminal input string before it is executed.

Regular expression rules are registered with Terminal using {@link #addRegex}. Then
whenever a command is evaluated it is first expanded to the long form and vetted using
{@link #expand}.

{@link #stdRegex Terminal.stdRegex} defines a standard set of regular expressions for
expanding myPhysicsLab class names (like `DoubleRect`) and for expanding a few function
shortcuts like `methodsOf`, `propertiesOf` and `prettyPrint`. An application can add
more shortcuts via {@link #addRegex}.


The Result Variable
-------------------
The result of the last Terminal script is stored in a variable named `result`. Here is
an example Terminal session:

    > 2+2
    4
    > result*2
    8
    > result*2
    16

Note that {@link #eval} has an argument called `output` which if set to `false`
prevents `result` from being updated. When `output==false`, then `result` is is defined
for commands in the same string, but that version of `result` is temporary and
independent of the permanent `result` variable.


<a id="thezobject"></a>
The z Object
--------------
[Strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode)
prevents adding global variables when using the JavaScript `eval` command.
To allow making variables that persist between commands, Terminal provides an object
named `z` where properties can be added:

    > z.a = 1
    1
    > z.a
    1

This `z` object is a property of Terminal; `z` is initially an object with no
properties. We define a [short name](#shortnames) regular expression so that referring
to `z` is replaced by `terminal.z` when the command is executed.


Declaring a Variable
--------------------
To hide the usage of the `z` object, Terminal interprets the `var` keyword in a
special way.

When Terminal sees the `var` keyword at the start of a command, it changes the script
to use the `z` object and defines a short-name. For example the command

    > var foo = 3
    3

is translated to

    > z.foo = 3
    3

and thereafter every reference to `foo` will be changed to `z.foo` in later commands.
You can see this at work by using {@link #setVerbose}:

    > terminal.setVerbose(true)
    > foo
    >> app.terminal.z.foo
    3


The terminal Variable
---------------------
Some features require that the name `terminal` is defined and resolves to the Terminal
object. These features include the `z` variable, the `result` variable, and the usage
of the `var` keyword.

In most applications this is accomplished by using {@link #addRegex} something like
this:

    terminal.addRegex('terminal', 'app');

where `app` is the global variable containing the application. The purpose of the regex
is to replace the word `terminal` with `app.terminal` which is a valid JavaScript
reference.

(In unit tests of Terminal, we temporarily define a global variable named `terminal`.)


Cautions About Newline Character
-----------------------------------------
When you paste a script into the Terminal text input field, be aware that *newlines are
replaced by spaces*. For a multi-line script this can cause errors. To prevent problems:

+ Use explicit semicolons instead of relying on JavaScript's policy about optional
    semicolons.

+ Use slash-star style comments instead of double-slash style comments (which are
    terminated by a newline).

+ If for some reason you really need a newline in the script, use `\u000A` or `\x0A`.
    These are replaced with the newline character before the script is evaluated.

+ Put the multi-line script in a
    [start-up HTML page](Customizing.html#customizingthestart-uphtmlpage). You can
    then call `Terminal.eval()` directly on a string that you create, and that
    string can include newline characters.

The tab character also cannot be input directly to the Terminal input field, because
the browser interprets that to mean "move to the next field". You can use `\u0009` or
`\x09` which are replaced by a tab character before the script is evaluated.


<a id="urlqueryscript"></a>
URL Query Script
----------------

A Terminal script can be embedded into a URL
[query string](https://en.wikipedia.org/wiki/Query_string) which will be executed when
the page is loaded. This provides a convenient way to remember or share a customized
simulation with someone else.

The script follows a question mark in the URL, so it is called a 'query script'
or 'query URL'. Here is an
[example](<https://www.myphysicslab.com/pendulum/pendulum-en.html?DRIVE_AMPLITUDE=0;DAMPING=0.1;GRAVITY=9.8;ANGLE=2.5;ANGLE_VELOCITY=0;>):

    https://www.myphysicslab.com/pendulum/pendulum-en.html?DRIVE_AMPLITUDE=0;
    DAMPING=0.1;GRAVITY=9.8;ANGLE=2.5;ANGLE_VELOCITY=0;

The URL Query Script is executed at startup by calling {@link #parseURL} or
{@link #parseURLorRecall}.  Most myPhysicsLab applications do this.

Some websites will only accept user-supplied URLs that follow the strict guidelines of
[URL percent-encoding](https://en.wikipedia.org/wiki/Percent-encoding). Therefore
we must substitute in the URL:

  + `%20` for space
  + `%22` for `"`
  + `%3C` for `<`
  + `%3E` for `>`

See this
[character encoding chart](https://perishablepress.com/stop-using-unsafe-characters-in-urls/)
to learn which other characters must be percent-encoded. You can use
{@link Terminal.encodeURIComponent} which is a more stringent version of doing the character encoding; it percent-encodes other symbols such as:

  + `%27` for `'`
  + `%28` for `(`
  + `%29` for `)`
  + `%3B` for `;`

Here is an example of a URL query script using JavaScript in a simple-compiled
application:

    https://www.myphysicslab.com/develop/build/sims/pendulum/DoublePendulumApp-en.html?
    simRun.pause();simRun.reset();sim.setGravity(5.0);statusView.getDisplayList()
    .add(energyGraph);statusView.getDisplayList().add(displayClock);
    var%20va=sim.getVarsList();va.setValue(0,0.15545);va.setValue(1,-0.33548);
    va.setValue(2,-2.30681);va.setValue(3,2.68179);sim.saveInitialState();
    simRun.resume();layout.showTerminal(true);

[Try this link](<https://www.myphysicslab.com/develop/build/sims/pendulum/DoublePendulumApp-en.html?simRun.pause();simRun.reset();sim.setGravity(5.0);statusView.getDisplayList().add(energyGraph);statusView.getDisplayList().add(displayClock);var%20va=sim.getVarsList();va.setValue(0,0.15545);va.setValue(1,-0.33548);va.setValue(2,-2.30681);va.setValue(3,2.68179);sim.saveInitialState();simRun.resume();layout.showTerminal(true);>)
which contains the above code; you should also see the code in the Terminal output area.

Here is an interactive tool for trying out
[URL Encode/Decode](https://www.url-encode-decode.com).

<a id="sessionhistory"></a>
Session History
---------------
The session history feature recalls previous input lines; these are accessed using the
up/down arrow keys. Command-K clears the output area.

This feature is only for the convenience of the Terminal user, and has no relation to
the script storage feature.


<a id="scriptstorage"></a>
Script Storage
--------------

It is possible to store scripts in
[HTML5 Local Storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
by using the methods {@link #remember}, {@link #recall}, and {@link #forget}. These
will customize a simulation by remembering a specific script which is executed whenever
the page loads on that user's machine.

On startup most applications call {@link #parseURLorRecall} which calls {@link #recall}
unless there is a URL script which would take priority.

If no script is explicitly supplied to {@link #remember}, then the scripts in the
Terminal output window are saved, as returned by the method {@link #commands}. A user
can edit the contents of the Terminal output window to change what is remembered.
Commands are any line in the output text area that start with '> '.

The `remember()` method saves a script specific for the current page and browser.
If you load the page under a different browser, or for a different locale, there will
be a different stored script.
See [Internationalization](Building.html#internationalizationi18n).


<a id="advanced-compiledisablesjavascript"></a>
Advanced-compile disables JavaScript
------------------------------------

When using [advanced-compile](Building.html#advancedvs.simplecompile) only EasyScript
can be executed in Terminal, not JavaScript code.

Advanced compilation causes class and method names to be minified to one or two
characters, so scripts based on non-minified names will not work. Also, unused
code is eliminated, so desired features might be missing.

However, names that are *exported* can be used in HTML scripts under
advanced-compile. For example, we export the `eval` method in
{@link myphysicslab.sims.common.AbstractApp} so that EasyScript can be executed via
`app.eval()` even under advanced-compile.
See [Exporting Symbols](Building.html#exportingsymbols).

Security considerations are another reason to disable JavaScript code under
advanced-compile. The [safe subset](#safesubsetofjavascript) strategy used here depends
on detecting names in the script such as `window`, `eval`, `myEval`, `whiteList_`, etc.
Because advanced-compile renames many of these, we are no longer able to detect their
usage. For example, an attacker could figure out what the `Terminal.myEval` function
was renamed to, and enter a script that would call that function; this would not be
detected by the 'safe subset' checking which is looking for `myEval`, not for whatever
that method got renamed to.


* @param {?HTMLInputElement} term_input  A text input field where user can enter a
*    script to evaluate, or `null`.
* @param {?HTMLInputElement} term_output  A multi-line textarea where results are
*    shown, or `null`
* @constructor
* @final
* @struct
*/
myphysicslab.lab.util.Terminal = function(term_input, term_output) {
  /** terminal input, usually a text input field.
  * @type {?HTMLInputElement}
  * @private
  */
  this.term_input_ = term_input;
  if (term_input) {
    term_input.spellcheck = false;
  }
  /** terminal output, usually a textarea
  * @type {?HTMLInputElement}
  * @private
  */
  this.term_output_ = term_output;
  if (term_output) {
    term_output.spellcheck = false;
  }
  /** Function to execute after a script is executed.
  * @type {function()|undefined}
  * @private
  */
  this.afterEvalFn_;
  /** key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.keyDownKey_ = this.term_input_ ? goog.events.listen(this.term_input_,
        goog.events.EventType.KEYDOWN,
        /*callback=*/this.handleKey,  /*capture=*/false, this) : NaN;
  /** key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.changeKey_ = this.term_input_ ? goog.events.listen(this.term_input_,
      goog.events.EventType.CHANGE, /*callback=*/this.inputCallback,
      /*capture=*/true, this): NaN;
  /**  session history of scripts entered.
  * @type {!Array<string>}
  * @private
  */
  this.history_ = [];
  /**  index of item last recalled from session history array;  or -1 otherwise.
  * @type {number}
  * @private
  */
  this.histIndex_ = -1;
  /** Whether to print the expanded or unexpanded script.  Seeing the expanded
  * script is useful for debugging, or for understanding how Terminal works.
  * @type {boolean}
  * @private
  */
  this.verbose_ = false;
  /** Set of regular expressions to apply to each script to replace short names
  * with full expanded name. For example, `DoubleRect` is the short name that
  * expands to `myphysicslab.lab.util.DoubleRect`.
  * @type {!Array<!Terminal.regexPair>}
  * @private
  */
  this.regexs_ = [];
  /** While {@link #recall} is executing scripts, this flag is true.
  * @type {boolean}
  */
  this.recalling = false;
  /** Contains results of last script. Can be referred to in Terminal as `result`.
  * @type {*}
  * @private
  */
  this.result;
  /** Contains saved results when eval is being called recursively.
  * @type {!Array}
  * @private
  */
  this.resultStack_ = [];
  /** An object that scripts can store properties into.
  * See [The z Object](#thezobject).
  * @type {!Object}
  */
  this.z = { };
  /** white list of allowed expressions. Global names or window properties/functions
  * which are OK to use in a script.
  * 'find' is a non-standard function on Window, it returns a boolean.
  * https://developer.mozilla.org/en-US/docs/Web/API/Window/find
  * @type {!Array<string>}
  * @private
  */
  this.whiteList_ = [ 'myphysicslab', 'goog', 'length', 'name', 'terminal', 'find' ];
  /**
  * @type {?Parser}
  * @private
  */
  this.parser_ = null;
  /** The variables available to the user. Names separated by | symbol.
  * @type {string}
  * @private
  */
  this.vars_ = '';
  /** Number of simultaneous calls to eval() for detecting recursion
  * @type {number}
  * @private
  */
  this.evalCalls_ = 0;
  /** The prompt to show before each user-input command.
  * @type {string}
  * @private
  */
  this.prompt_ = '> ';
  // Allow scripts to call eval() but those calls are replaced by "terminal.eval"
  // so that they go thru Terminal.eval() and are properly vetted for script safety.
  this.addRegex('eval', 'terminal.', /*addToVars=*/false);
};
var Terminal = myphysicslab.lab.util.Terminal;

if (!Util.ADVANCED) {
  /** @override */
  Terminal.prototype.toString = function() {
    return 'Terminal{history.length: '+this.history_.length
        +', regexs_.length: '+this.regexs_.length
        +', verbose_: '+this.verbose_
        +', parser_: '+(this.parser_ != null ? this.parser_.toStringShort() : 'null')
        +'}';
  };
};

/**  A regular expression and the replacement string expression to be used in a
* `String.replace()` command.
* @typedef {{regex: !RegExp, replace: string}}
* @private
*/
Terminal.regexPair;

/** Adds a regular expression rule for transforming scripts before they are executed.
*
* One usage is to prepend the namespace to fully qualify a [short name](#shortnames).
* For example, to transform `DoubleRect` into `myphysicslab.lab.util.DoubleRect`
*
*    terminal.addRegex('DoubleRect', `myphysicslab.lab.util.');
*
* Another usage is to make properties of an object available as a single short name.
* For example to transform `rod` or `bob` into `app.rod` or `app.bob`
*
*    terminal.addRegex('rod|bob', 'app.');
*
* The regular expression rule is added to the end of the list of regex's to execute,
* unless `opt_prepend` is `true`.
*
* @param {string} names set of names separated by `|` symbol
* @param {string} prefix the string to prepend to each occurence of the names
* @param {boolean=} opt_addToVars if `true`, then the set of names is added to the
*     set of defined names returned by {@link #vars}; default is `true`
* @param {boolean=} opt_prepend if `true`, then the regex rule is added to the front
*     of the list of regex's to execute; default is `false`
* @return {boolean} whether the regex rule was added (returns `false` if the regex rule
*     already exists)
*/
Terminal.prototype.addRegex = function(names, prefix, opt_addToVars, opt_prepend) {
  var addToVars = goog.isDef(opt_addToVars) ? opt_addToVars : true;
  if (!Util.ADVANCED) {
    if (names.length == 0) {
      throw new Error();
    }
    if (addToVars) {
      var nms = names.split('|');
      var vrs = this.vars_.split('|');
      goog.array.forEach(nms, function(nm) {
        if (!goog.array.contains(vrs, nm)) {
          this.vars_ += (this.vars_.length > 0 ? '|' : '') + nm;
        }
      }, this);
    }
    // This regexp look for words that are NOT preceded by a dot or dollar sign.
    // (^|[^\w.$]) means:  either start of line, or a not-word-or-dot-or-$ character.
    // Should NOT match within: new myphysicslab.lab.util.DoubleRect
    // SHOULD match within: new DoubleRect
    // Should NOT match within: module$exports$myphysicslab$lab$util$Util
    // SHOULD match within: Util.toName
    /** @type {!Terminal.regexPair} */
    var re = {
      regex: new RegExp('(^|[^\\w.$])('+names+')\\b', 'g'),
      replace: '$1'+prefix+'$2'
    };
    if (!this.hasRegex(re)) {
      if (opt_prepend) {
        this.regexs_.unshift(re);
      } else {
        this.regexs_.push(re);
      }
      return true;
    }
  }
  return false;
};

/** Adds the string to white list of allowed expressions.
* See [Safe Subset of JavaScript](#safesubsetofjavascript).
* @param {string} name string to add to white list
* @param {boolean=} opt_addToVars if `true`, then the name is added to the
*     set of defined names returned by {@link #vars}; default is `true`
*/
Terminal.prototype.addWhiteList = function(name, opt_addToVars) {
  var addToVars = goog.isDef(opt_addToVars) ? opt_addToVars : true;
  if (!goog.array.contains(this.whiteList_, name)) {
    this.whiteList_.push(name);
    if (addToVars) {
      this.vars_ += (this.vars_.length > 0 ? '|' : '') + name;
    }
  }
};

/** Returns true if command contains the specified name and the name is prohibited.
* @param {string} command the command to test
* @param {string} name a prohibited name (unless it is on the white list)
* @param {!Array<string>} whiteList list of allowed commands
* @return {boolean} true means found prohibited name in command, and name was not
*      on the white list
* @private
* @static
*/
Terminal.badCommand = function(command, name, whiteList) {
  for (var i=0, n=whiteList.length; i<n; i++) {
    if (name == whiteList[i]) {
      return false;
    }
  }
  var re = new RegExp('\\b'+name+'\\b', 'g');
  return re.test(command);
};

/** Returns command scripts in current Terminal output text area, as array of strings,
* for use with {@link #remember}. Commands are any line in the output text area that
* start with `> `. Each script is also trimmed of leading or trailing whitespace.
* @return {!Array<string>}  array of command strings in current Terminal output
*/
Terminal.prototype.commands = function() {
  if (this.term_output_) {
    var t = this.term_output_.value;
    t = t.split('\n');
    // remove leading and trailing whitespace on each command
    t = goog.array.map(t, function(e) { return e.trim(); });
    // filter out non-commands, and the 'terminal.remember()' command
    t = goog.array.filter(t, function(/** string */e) {
      return e.length>2 && e.substr(0,2)== '> '
          && !e.match(/^> (terminal|this).(remember|commands)\(\s*\);?$/);
      });
    t = goog.array.map(t, function(e) { return e.substr(2); });
    return t;
  } else {
    return [];
  }
};

/** Remove connections to other objects to facilitate garbage collection.
* @return {undefined}
*/
Terminal.prototype.destroy = function() {
  goog.events.unlistenByKey(this.keyDownKey_);
  goog.events.unlistenByKey(this.changeKey_);
};

/** Replace unicode characters with the regular text. Example: `\x64` and `\u0064` are
* replaced with `d`. This is so our blacklist checking can work (this defeats the hack
* of spelling "window" like "win\u0064ow").
* See [Safe Subset of JavaScript](#safesubsetofjavascript).
* @param {string} s the string to modify
* @return {string} the string with unicode characters replaced
* @static
*/
Terminal.deUnicode = function(s) {
  return s.replace(/\\(x|u00)([0-9a-fA-F]{2})/g, function(v1, v2, v3) {
        return String.fromCharCode(Number('0x'+v3));
      });
};

/** This is a more stringent version of
[encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)
which adheres to [RFC 3986](https://tools.ietf.org/html/rfc3986) which reserves
characters `!'()*`. Some websites (such as reddit) will not accept a user supplied URL
that contains those characters.
* @param {string} str the string to encode
* @return {string} the encoded string
* @static
*/
Terminal.encodeURIComponent = function(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}

/** Executes the given script and returns the result.

When `opt_output` is `true`: updates the `result` variable, prints the result in the
output text area, scrolls the output so the most recent text is visible, clears the
input text area, remembers the script in the [session history](#sessionhistory).

When `opt_output` is `false`: the `result` variable is updated for
successive scripts (separated by a semicolon) in the same script line, but after the
script is finished executing the `result` variable is unchanged. The output text area
and session history array are unchanged.

The `opt_output=false` option allows for evaluating scripts that
define a variable, for example in
{@link myphysicslab.lab.model.ExpressionVariable ExpressionVariable}.
The ExpressionVariable script can be executed frequently without modifying the `result`
seen by the user in Terminal.

The script is split into pieces separated by top-level semicolons (top-level means they
are not enclosed by braces). Each fragment is first offered to the Parser installed
with {@link #setParser}. If the Parser does not recognize the fragment, then the
fragment is expanded and vetted with {@link #expand} before being executed using
JavaScript `eval`. The vetting ensures that only a
[Safe Subset of JavaScript](#safesubsetofjavascript) is allowed to be executed.

Error handling: when `opt_userInput` is `true` we avoid throwing an error and only
print the error to the output text area where the user will presumably see it. When
`opt_userInput` is `false` we throw the error as usual (augmenting the message with the
script that caused the error).

* @param {string} script a fragment of JavaScript to be executed
* @param {boolean=} opt_output whether to print the result to the output text area and
*    add the script to session history; default is `true`
* @param {boolean=} opt_userInput whether the script was input by user in Terminal
*    command line interface; default is `false`
* @return {*} the result of executing the script
* @throws {!Error} if an error occurs while executing the script and `opt_userInput`
*    is false
*/
Terminal.prototype.eval = function(script, opt_output, opt_userInput) {
  var output = goog.isBoolean(opt_output) ? opt_output : true;
  var userInput = opt_userInput || false;
  if (userInput && !output) {
    throw new Error(); // if user input the script then must have output==true
  }
  script = Terminal.deUnicode(script).trim();
  if (script.match(/^\s*$/)) {
    // blank line: don't enter into history
    return undefined;
  }
  this.evalCalls_++; // number of simultaneous calls to eval() = depth of recursion
  if (this.evalCalls_ > 1) {
    // Recursive call to eval should never output text.
    // This happens when a script calls 'eval'.
    output = false;
  }
  if (output) {
    goog.asserts.assert(this.evalCalls_ == 1);
    goog.asserts.assert(this.resultStack_.length == 0);
    // add script to session history
    this.history_.unshift(script);
    this.histIndex_ = -1;
  } else {
    // The afterEvalFn_ can call eval() when an ExpressionVariable is evaluated during
    // modifyObjects.  This gives one level of recursion. Since output==false the
    // result is preserved.  Recursion can also happen by calling eval() in the script
    // being executed here (eval is mapped to call Terminal.eval not JavaScript eval).
    this.resultStack_.push(this.result);
    this.result = undefined;
  }
  var prompt = this.prompt_;
  try {
    Terminal.vetBrackets(script);
    // split the script into pieces at each semicolon, evaluate one piece at a time
    var cmds = ['', script];
    while (cmds = this.splitAtSemicolon(cmds[1]), cmds[0]) {
      var cmd = cmds[0].trim();
      if (cmd.length == 0) {
        // ignore blank lines
        continue;
      }
      execute_cmd:
      {
        // print before evaluating & expanding so that it is clear what caused an error
        if (output) {
          this.println(prompt + cmd);
        }
        if (this.parser_ != null) {
          // Let Parser evaluate the cmd before expanding with regex's.
          // For example: 'sim.gravity' is recognized by EasyScriptParser but
          // 'app.sim.gravity' is not.
          //
          // Script Safe Subset:
          // Note that unexpanded `cmd` has NOT gone thru vetCommand, but it is only
          // a string and should not be eval'd by the parser.
          var parseResult = this.parser_.parse(cmd);
          if (parseResult !== undefined) {
            // the parser was successful
            this.result = parseResult;
            break execute_cmd;
          }
        }
        var expScript = this.expand(cmd); // expanded and vetted cmd
        if (output && this.verbose_) {
          this.println(prompt.trim() + prompt + expScript);
        }
        this.result = this.myEval(expScript);
      }
    }
    // don't show results when cmd ends with semicolon, or undefined result
    if (output && goog.isDef(this.result) && script.slice(-1) != ';') {
      this.println(String(this.result));
    }
    if (output && goog.isDef(this.afterEvalFn_)) {
      this.afterEvalFn_();
    }
  } catch (ex) {
    if (output) {
      this.result = undefined;
      this.println(ex);
    } else {
      this.result = this.resultStack_.pop();
    }
    if (!userInput) {
      this.evalCalls_--;
      ex.message += '\nScript: '+script;
      throw ex;
    }
  }
  this.evalCalls_--;
  if (output) {
    this.scrollDown();
    return this.result;
  } else {
    // restore this.result to previous value, but return result of this script
    var r = this.result;
    this.result = this.resultStack_.pop();
    return r;
  }
};

/** Returns the given Javascript script expanded by the various regular expression
* rules which were registered with {@link #addRegex} and vetted to not contain
* any [unsafe JavaScript commands](#safesubsetofjavascript). The expanded script has
* [short names](#shortnames) like `DoubleRect` expanded to have full path name like
* `myphysicslab.lab.util.DoubleRect`. Doesn't expand words inside of quoted strings
* or regular expressions.
* @param {string} script a Javascript script to be executed
* @return {string} the script expanded by registered regular expressions
*/
Terminal.prototype.expand = function(script) {
  var c = this.replaceVar(script);
  var exp = ''; //result
  var count = 0;
  while (c) {
    if (++count > 10000) {
      // prevent infinite loop
      throw new Error('Terminal.expand');
    }
    // process non-quoted string at start of c
    var a = c.match(/^[^'"/]+/);
    if (a !== null) {
      var e = a[0]; // the non-quoted string at start of c
      c = c.slice(e.length); // remove the non-quoted string from start of c
      // process the non-quoted string with desired regexs
      e = goog.array.reduce(this.regexs_,
        function(cmd, rp) {
          return cmd.replace(rp.regex, rp.replace);
        }, e);
      // add to result
      Terminal.vetCommand(e, this.whiteList_);
      exp += e;
      if (c.length == 0) {
        break;
      }
    }
    // A regular expression must be preceded by = or (
    // If exp ends with = or (, then check for possible regexp.
    if (exp.match(/.*[=(][ ]*$/)) {
      // regexp for Matching Delimited Text. See comments below.
      // Note that we exclude matching on /* or //
      a = c.match(/^\/[^*/](\\\/|[^\\/])*\//);
      if (a !== null) {
        e = a[0]; // the regexp at start of c
        c = c.slice(e.length); // remove the regexp from start of c
        // add to result
        exp += e;
        continue;
      }
    }
    // if first char is /, then failed to find a regexp, eat the / and continue
    if (c.length > 0 && c[0] == '/') {
      exp += '/';
      c = c.slice(1);
      continue;
    }
    // process double-quotes string at start of c
    // See p. 198 of Friedl, Mastering Regular Expressions, 2nd edition
    // the section called Matching Delimited Text.
    // The regexp allows escaped quotes in the string.
    //   "   (      \\.          |        [^\\"]           )*    "
    // quote ( any-escaped-char  |  not-backslash-or-quote )*  quote
    a = c.match(/^"(\\.|[^\\"])*"/);
    if (a !== null) {
      e = a[0]; // the quoted string at start of c
      c = c.slice(e.length); // remove the quoted string from start of c
      // add to result
      exp += e;
      continue;
    }
    // if first char is ", then failed to find a quoted string, eat the " and continue
    if (c.length > 0 && c[0] == '"') {
      exp += '"';
      c = c.slice(1);
      continue;
    }
    // process single-quotes string at start of c
    a = c.match(/^'(\\.|[^\\'])*'/);
    if (a !== null) {
      e = a[0]; // the quoted string at start of c
      c = c.slice(e.length); // remove the quoted string from start of c
      // add to result
      exp += e;
      continue;
    }
    // if first char is ', then failed to find a quoted string, eat the ' and continue
    if (c.length > 0 && c[0] == '\'') {
      exp += '\'';
      c = c.slice(1);
      continue;
    }
  }
  return exp;
};

/** Sets user keyboard focus to input text area.
* @return {undefined}
*/
Terminal.prototype.focus = function() {
  if (this.term_input_) {
    this.term_input_.focus();
  }
};

/** Removes any locally stored script for the current page and browser.
See [Script Storage](#scriptstorage).
* @return {undefined}
*/
Terminal.prototype.forget = function() {
  var localStore = window.localStorage;
  if (goog.isDefAndNotNull(localStore)) {
    localStore.removeItem(this.pageKey());
  }
};

/** Called when a key has been pressed.  Implements the `meta-K` command to clear
* the output area, and the up/down arrow keys to scroll through
* [session history](#sessionhistory).
* @param {!goog.events.KeyEvent} evt the event that caused this callback to fire
*/
Terminal.prototype.handleKey = function(evt) {
  if (this.term_input_ && this.term_output_) {
    if (evt.metaKey && evt.keyCode==goog.events.KeyCodes.K) {
      // cmd-K = clear all terminal output
      this.term_output_.value = '';
      evt.preventDefault();
    } else if (evt.keyCode==goog.events.KeyCodes.UP ||
          evt.keyCode==goog.events.KeyCodes.DOWN) {
      // arrow up/down keys = get terminal session history
      // save current contents of input to history if it is non-empty and was user-input
      if (this.histIndex_ == -1 && this.term_input_.value != '') {
        // add the current text to session history
        this.history_.unshift(this.term_input_.value);
        // pretend we were just displaying the first history item
        this.histIndex_ = 0;
      }
      if (evt.keyCode==goog.events.KeyCodes.UP) {
        if (this.histIndex_ < this.history_.length-1) {
          // there is more session history available
          this.histIndex_++;
          this.term_input_.value = this.history_[this.histIndex_];
        }
      } else if (evt.keyCode==goog.events.KeyCodes.DOWN) {
        if (this.histIndex_ > 0) {
          // there is more session history available
          this.histIndex_--;
          this.term_input_.value = this.history_[this.histIndex_];
        } else {
          // last keydown should give empty text field
          this.histIndex_ = -1;
          this.term_input_.value = '';
        }
      }
      evt.preventDefault();
    } else if (evt.keyCode==goog.events.KeyCodes.ENTER) {
      // This fixes a problem:
      // When we change term_input to show a history text (with arrow keys), but then
      // typing return key has no effect unless and until some character is typed
      // that changes the text field (e.g. a space).
      this.eval(this.term_input_.value, /*output=*/true, /*userInput=*/true);
    }
  }
};

/** Returns true if the given regexPair is already on the list of regex's to execute.
* @param {!Terminal.regexPair} q the regexPair of interest
* @return {boolean} true if q is already on the list of regex's to execute.
* @private
*/
Terminal.prototype.hasRegex = function(q) {
  var regex = q.regex.toString();
  var replace = q.replace;
  return goog.array.some(this.regexs_,
    function(r) {
    return r.replace == replace && r.regex.toString() == regex;
  });
};

/** This callback fires when the textbox 'changes' (usually from focus lost).
* @param {!goog.events.Event} evt the event that caused this callback to fire
* @private
*/
Terminal.prototype.inputCallback = function(evt) {
  if (this.term_input_) {
    this.eval(this.term_input_.value, /*output=*/true, /*userInput=*/true);
  }
};

/** Private version of eval, with no local variables that might confuse the script.
* @param {string} script
* @return {*}
* @private
*/
Terminal.prototype.myEval = function(script) {
  'use strict';
  if (!Util.ADVANCED) {
    return eval(script);
  } else {
    var msg = 'JavaScript is disabled due to advanced compilation; try a simple-compiled version';
    // Output to console.log helps when debugging UnitTest problems.
    console.log(msg+': '+script);
    this.println(msg);
    return undefined;
  }
};

/** Returns the identifying key to use for storing scripts for current web page in HTML5
local storage. See [Script Storage](#scriptstorage).
@return {string} the identifying key to use for storing scripts for current web page in
  HTML5 local storage.
*/
Terminal.prototype.pageKey = function() {
  // This is the name of the html file, and therefore includes a locale suffix,
  // so that each language has a separate script stored.
  // For example:
  // https://www.myphysicslab.com/pendulum/pendulum-en.html is the English version
  // https://www.myphysicslab.com/pendulum/pendulum-de.html is the German version.
  // (We could erase the locale from the key if desired).
  var loc = window.location.href;
  var query = loc.indexOf('?');
  // if this page loaded with a query in the URL, erase the query
  if (query > -1) {
    loc = loc.slice(0, query);
  }
  return loc;
};

/** Parses and executes the query portion of the current URL (the portion of the URL
after a question mark) as a script. See [URL Query Script](#urlqueryscript).

Before executing the query script, this calls {@link Parser#saveStart} to save the
current settings.
* @return {boolean} returns true if there was a URL query script
*/
Terminal.prototype.parseURL = function() {
  if (this.parser_ != null) {
    this.parser_.saveStart();
  }
  var loc = window.location.href;
  var queryIdx = loc.indexOf('?');
  if (queryIdx > -1) {
    var cmd = loc.slice(queryIdx+1);
    // decode the percent-encoded URL
    // See https://en.wikipedia.org/wiki/Percent-encoding
    // encodeURIComponent('hello +(2+3*4)!/=?[];{}.<>:|^$_-~`@#')
    // "hello%20%2B(2%2B3*4)!%2F%3D%3F%5B%5D%3B%7B%7D.%3C%3E%3A%7C%5E%24_-~%60%40%23"
    // Note that parens and ! are also reserved characters, so encode them as well:
    // "hello%20%2B%282%2B3*4%29%21%2F%3D%3F%5B%5D%3B%7B%7D.%3C%3E%3A%7C%5E%24_-~%60%40%23"
    // To test: paste the following link into a browser address field:
    // (edit the address for your environment):
    // file:///Users/erikn/Documents/Programming/myphysicslab/debug/sims/experimental/BlankSlateApp-en.html?println('hello%20%2B%282%2B3*4%29%21%2F%3D%3F%5B%5D%3B%7B%7D.%3C%3E%3A%7C%5E%24_-~%60%40%23')
    // You should see in Terminal the string without percent encoding.
    cmd = decodeURIComponent(cmd);
    this.eval(cmd);
    return true;
  }
  return false;
};

/** Parses and executes the query portion of the current URL via {@link #parseURL};
or if there is no URL query then use {@link #recall} to load the stored script, if any.
See [Script Storage](#scriptstorage).
* @return {undefined}
*/
Terminal.prototype.parseURLorRecall = function() {
  if (!this.parseURL()) {
    this.recall();
  }
};

/** Print the given text to the Terminal output text area, followed by a newline.
* @param {string} text the text to print to the Terminal output text area
*/
Terminal.prototype.println = function(text) {
  if (this.term_output_) {
    this.term_output_.value += text+'\n';
    this.scrollDown();
  }
};

/** Retrieve the stored script for the current page from HTML5 local storage. Executes
the script if `opt_execute` is `true`. See [Script Storage](#scriptstorage).
* @param {boolean=} opt_execute `true` (default) means execute the script;
*    `false` means don't execute the script, only print it in text output area
* @return {undefined}
*/
Terminal.prototype.recall = function(opt_execute) {
  var execute = goog.isBoolean(opt_execute) ? opt_execute : true;
  this.recalling = true;
  var localStore = window.localStorage;
  if (goog.isDefAndNotNull(localStore)) {
    var s = /** @type {string} */(localStore.getItem(this.pageKey()));
    if (s) {
      this.println('//start of stored scripts');
      if (execute) {
        goog.array.forEach(s.split('\n'), function(t) { this.eval(t); },this);
      } else {
        goog.array.forEach(s.split('\n'), function(t) { this.println(t); },this);
      }
      this.println('//end of stored scripts');
    }
  }
  this.recalling = false;
};

/** Stores the given script in local storage to execute when this page is loaded in
future. Each browser and page has a separate local storage. See [Script
Storage](#scriptstorage).

If no script is provided then the set of Terminal scripts in the output text area are
stored, as returned by {@link #commands}.
* @param {string|!Array<string>|undefined} opt_script the scripts to remember; or if
*    `undefined`, then stores scripts returned by {@link #commands}
* @return {undefined}
*/
Terminal.prototype.remember = function(opt_script) {
  var script = goog.isDef(opt_script) ? opt_script : this.commands();
  if (goog.isArray(script)) {
    script = script.join('\n');
  }
  var k = this.pageKey();
  // store the script under the current file name
  var localStore = window.localStorage;
  if (goog.isDefAndNotNull(localStore)) {
    localStore.setItem(this.pageKey(), script);
  }
};


/** Removes the 'var' at front of a script (if any) and adds regexp which mimics that
JavaScript `var` statement. This helps make Terminal scripts more JavaScript-like, by
hiding usage of the `z` object. For example, if the script is

    var foo = 3;

this will return just `foo = 3;` and add a regexp that replaces `foo` by `z.foo`.
* @param {string} script a Javascript script to be executed
* @return {string} the script with the `var` removed
* @private
*/
Terminal.prototype.replaceVar = function(script) {
  var m = script.match(/^\s*var\s+(\w[\w_\d]*)(.*)/);
  if (m) {
    // suppose the script was 'var foo = 3;'
    // Add a regexp that replaces 'foo' with 'z.foo', and remove 'var' from script
    goog.asserts.assert(m.length >= 3);
    var varName = m[1];
    // important to prepend because the regexp's are executed in order
    this.addRegex(varName, 'z.', /*addToVars=*/true, /*prepend=*/true);
    return m[1] + m[2];
  }
  return script;
};

/** Scroll the Terminal output text area to show last line.
* @return {undefined}
*/
Terminal.prototype.scrollDown = function() {
  if (this.term_input_ && this.term_output_) {
    // scroll down to show the last line
    // scrollTop = number pixels that have scrolled off top edge of element
    // offsetHeight = size of visible portion of element
    // scrollHeight = overall height of element, in pixels
    this.term_output_.scrollTop = this.term_output_.scrollHeight
        - this.term_output_.offsetHeight;
    this.term_input_.value = '';
  }
};

/** Sets the function to execute after evaluating the user input. Typically used to
update a display such as a {@link myphysicslab.lab.view.SimView SimView} or
{@link myphysicslab.lab.graph.Graph Graph}.
* @param {function()=} afterEvalFn  function to execute after evaluating
*     the user input; can be `undefined` to turn off this feature
*/
Terminal.prototype.setAfterEval = function(afterEvalFn) {
  this.afterEvalFn_ = afterEvalFn;
};

/** Installs the Parser used to parse scripts during {@link #eval}.
* @param {!Parser} parser the Parser to install.
*/
Terminal.prototype.setParser = function(parser) {
  this.parser_ = parser;
  if (!Util.ADVANCED) {
    parser.addCommand('vars', goog.bind(function() {return String(this.vars());}, this),
        'lists available variables');
  }
};

/** Sets the prompt symbol shown before each command.
* @param {string} prompt the prompt symbol to show before each command
*/
Terminal.prototype.setPrompt = function(prompt) {
  this.prompt_ = String(prompt);
};

/** Specifies whether to show the expanded command in the Terminal output text area.
In verbose mode, the command is echoed a second time to show how it appears after
{@link #expand expansion}. The terminal prompt symbol is doubled to distinguish the
expanded version.
* @param {boolean} expand `true` means show expanded names in the Terminal output
*/
Terminal.prototype.setVerbose = function(expand) {
  this. verbose_ = expand;
};

/** Finds the section of text up to first top-level semicolon (top-level means not
enclosed in curly braces). Ignores semicolons in quotes or regular expression.
Note however that top-level double-slash comments end at a new-line not semicolon.
* @param {string} text The text to be split up.
* @return {!Array<string>} array with two elements: array[0] = the section up to and
*    including the first top-level semicolon; array[1] = the remaining text.
* @private
*/
Terminal.prototype.splitAtSemicolon = function(text) {
  var level = 0;
  var lastNonSpace = '';
  var lastChar = '';
  var nextChar = ''
  var c = '';
  var commentMode = false; // double-slash comments only
  var regexMode = false;
  var quoteMode = false;
  var quoteChar = '';
  var i, n;
  for (i=0, n=text.length; i<n; i++) {
    lastChar = c;
    if (c != ' ' && c != '\t' && c != '\n') {
      lastNonSpace = c;
    }
    c = text[i];
    nextChar = i+1 < n ? text[i+1] : '\0';
    if (commentMode) {
      if (c == '\n') {
        commentMode = false;
        if (level == 0) {
          // we found a complete top-level JavaScript statement
          break;
        }
      }
    } else if (regexMode) {
      // check for escaped slash inside a regex
      if (c == '/' && lastChar != '\\') {
        regexMode = false;
      }
    } else if (quoteMode) {
      // check for escaped quotes inside a string
      if (c == quoteChar && lastChar != '\\') {
        quoteMode = false;
        quoteChar = '';
      }
    } else {
      if (c == '/') {
        if (nextChar == '/') {
          commentMode = true;
        } else if (nextChar != '*' &&
            lastNonSpace && (lastNonSpace == '=' || lastNonSpace == '(')) {
          // regexp: slash must be preceded by = or (, and not followed by *
          regexMode = true;
        }
      } else if (c == '"' || c == '\'') {
        quoteMode = true;
        quoteChar = c;
      } else if (c == ';' && level == 0) {
        // we found a complete top-level JavaScript statement
        break;
      } else if (c == '{') {
        level++;
      } else if (c == '}') {
        level--;
      }
    }
  }
  return [text.slice(0, i+1), text.slice(i+1)];
};

/** Adds the standard set of regular expression rules to the given Terminal instance.
These regular expression rules replace [short names](#shortnames) with the full
expression that is valid JavaScript for referring to the object. This defines short
names for many classes and also utility functions like `prettyPrint`, `methodsOf`,
`println` and `propertiesOf`.
* @param {!Terminal} terminal the Terminal instance to which the regexp's will be added
* @static
*/
Terminal.stdRegex = function(terminal) {
  // These regexp's look for words that are NOT preceded by a dot.
  // Should NOT match within: new myphysicslab.lab.util.DoubleRect
  // SHOULD match within: new DoubleRect
  // (^|[^\w.]) means:  either start of line, or a not-word-or-dot character.

  terminal.addRegex('methodsOf|propertiesOf|prettyPrint',
       'Util.', /*addToVars=*/false);
  // replace 'println' with 'terminal.println'
  terminal.addRegex('println|z',
       'terminal.', /*addToVars=*/false);
  terminal.addRegex('result',
       'terminal.', /*addToVars=*/true);
  // ** DO NOT WRAP OR BREAK THESE LONG LINES **
  // See http://stackoverflow.com/questions/12317049/
  // how-to-split-a-long-regular-expression-into-multiple-lines-in-javascript
  // (The alternative is create a new RegExp from a set of concatenated strings).
  terminal.addRegex('AffineTransform|CircularList|Clock|ClockTask|DoubleRect'
      +'|GenericEvent|GenericObserver|GenericMemo|ParameterBoolean|ParameterNumber'
      +'|ParameterString|RandomLCG|EasyScriptParser|Terminal|Timer',
      'myphysicslab.lab.util.', /*addToVars=*/false);

  // note: $$ represent $ in regexp replace string.
  terminal.addRegex('MutableVector|Util|Vector',
      'module$$exports$$myphysicslab$$lab$$util$$', /*addToVars=*/false);

  terminal.addRegex('NF0|NF2|NF1S|NF3|NF5|NF5E|nf5|nf7|NF7|NF7E|NF9|NFE|NFSCI',
      'Util.', /*addToVars=*/false);

  terminal.addRegex('CollisionAdvance|CoordType|EulersMethod|ExpressionVariable'
      +'|FunctionVariable|MassObject|ModifiedEuler|ConcreteLine|NumericalPath'
      +'|PointMass|RungeKutta|ShapeType|SimList|SimpleAdvance|Spring|VarsList',
      'myphysicslab.lab.model.', /*addToVars=*/false);

  terminal.addRegex('CoordMap|DisplayClock|DisplayConnector|DisplayLine|DisplayList'
      +'|DisplayPath|DisplayShape|DisplayRope|DisplaySpring|DisplayText'
      +'|DrawingMode|DrawingStyle|EnergyBarGraph|HorizAlign|LabCanvas|LabView'
      +'|ScreenRect|SimView|VerticalAlign',
       'myphysicslab.lab.view.', /*addToVars=*/false);

  terminal.addRegex('CircularEdge|CollisionHandling|ContactSim|DampingLaw'
       +'|EdgeRange|ExtraAccel|GravityLaw|Gravity2Law|ImpulseSim|Joint'
       +'|Polygon|RigidBodyCollision|RigidBodySim|Rope|Scrim|Shapes|StraightEdge'
       +'|ThrusterSet|Vertex|Walls',
       'myphysicslab.lab.engine2D.', /*addToVars=*/false);

  terminal.addRegex('AutoScale|DisplayGraph|GraphColor|GraphLine'
       +'|GraphStyle|DisplayAxes|VarsHistory',
       'myphysicslab.lab.graph.', /*addToVars=*/false);

  terminal.addRegex('EventHandler|MouseTracker|RigidBodyEventHandler'
       +'|SimController|SimRunner|ViewPanner',
       'myphysicslab.lab.app.', /*addToVars=*/false);

  terminal.addRegex('ButtonControl|CheckBoxControl|ChoiceControl'
       +'|NumericControl|SliderControl|ToggleControl',
       'myphysicslab.lab.controls.', /*addToVars=*/false);

};

/** Returns names of the variables that have been defined using {@link #addRegex}.
* This is used as a "help" command for the user to know what variables are available.
* @return {!Array<string>} names of defined variables, in alphabetic order
*/
Terminal.prototype.vars = function() {
  var v = this.vars_.split('|');
  goog.array.sort(v);
  return v;
};

/** Throws an error if the script contains prohibited usage of square brackets.
See [Safe Subset of JavaScript](#safesubsetofjavascript).

This allows using square brackets to create an array containing anything (for example
an array of strings), but prohibits expressions that look like a property access with
square brackets -- except for the case of a non-negative integer inside the brackets
which is an access of a numbered array property.

* @param {string} script
* @throws {!Error} if the script contains prohibited code.
* @static
*/
Terminal.vetBrackets = function(script) {
  // Allow only non-negative integer inside square brackets (indicates array access).
  var goodRegexp = /^\w\s*\[\s*\d*\s*\]$/;
  // Only check when bracket is preceded by an identifier, which is a property access.
  // This allows making an array with square brackets, or passing an array to a
  // function, etc.
  var broadRegexp = /\w\s*\[[^\]]*?\]/g;
  var r = script.match(broadRegexp);
  if (r != null) {
    for (var i=0, n=r.length; i<n; i++) {
      if (!goodRegexp.test(r[i])) {
        throw new Error('prohibited usage of square brackets in script: '+script);
      }
    }
  }
};

/** Throws an error if the script contains prohibited code.
See [Safe Subset of JavaScript](#safesubsetofjavascript). Note that `eval` is not
prohibited by default, but you can add a blackList regexp for it.
* @param {string} script
* @param {!Array<string>} whiteList list of allowed commands
* @param {!RegExp=} opt_blackList additional prohibited commands
* @throws {!Error} if the script contains prohibited code.
* @static
*/
Terminal.vetCommand = function(script, whiteList, opt_blackList) {
  // prohibit all window properties (which are globally accessible names),
  // except for those on whiteList_.
  for (var p in window) {
    if (Terminal.badCommand(script, p, whiteList)) {
      throw new Error('prohibited name: "' + p + '" found in script: ' + script);
    }
  }
  // Prohibit JavaScript features that allow executing code and access to most
  // properties of Terminal.
  // Prohibit HTML Element and Node properties and methods that access parent or change
  // structure of the Document.
  var blackList = /\b(myEval|Function|with|__proto__|call|apply|caller|callee|arguments|addWhiteList|vetCommand|badCommand|whiteList_|addRegex|regexs_|afterEvalFn_|setAfterEval|parentNode|parentElement|innerHTML|outerHTML|offsetParent|insertAdjacentHTML|appendChild|insertBefore|replaceChild|removeChild|ownerDocument|insertBefore|setParser|parser_|defineNames|globalEval|window|defineProperty|defineProperties|__defineGetter__|__defineSetter__)\b/g;
  if (blackList.test(script) || (opt_blackList && opt_blackList.test(script))) {
    throw new Error('prohibited name in script: '+script);
  }
};

/** Set of internationalized strings.
@typedef {{
  REMEMBER: string,
  FORGET: string
  }}
*/
Terminal.i18n_strings;

/**
@type {Terminal.i18n_strings}
*/
Terminal.en = {
  REMEMBER: 'remember',
  FORGET: 'forget'
};

/**
@private
@type {Terminal.i18n_strings}
*/
Terminal.de_strings = {
  REMEMBER: 'erinnern',
  FORGET: 'vergessen'
};

/** Set of internationalized strings.
@type {Terminal.i18n_strings}
*/
Terminal.i18n = goog.LOCALE === 'de' ?
    Terminal.de_strings :
    Terminal.en;

});  // goog.scope
