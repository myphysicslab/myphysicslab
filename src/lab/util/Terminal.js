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
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Parser');
goog.require('myphysicslab.lab.util.GenericMemo'); // in case user wants to use it.

goog.scope(function() {

var UtilityCore = myphysicslab.lab.util.UtilityCore;
var Parser = myphysicslab.lab.util.Parser;

/** Executes scripts and provides a command line user interface with separate text
fields for input and output. Executes EasyScript or JavaScript. The JavaScript is a
safe subset to prevent malicious scripts and work in strict mode. Allows use of "short
names" to replace full name space pathnames of classes.

After the command is executed the result is converted to text and displayed in the
output text field. The output is not displayed if the result is `undefined` or the
command ends with a semi-colon.

See also [Customizing myPhysicsLab Software](Customizing.html).


Getting Help
------------
Type `help` in the Terminal input text area and press return to see the help message.
Several useful Terminal commands are shown. The help message also specifies whether the
code was *simple-compiled* or *advance-compiled*.

Perhaps the most useful command is `vars` which shows the list of variables that are
available.


Two Types of Scripts
--------------------
<a name="twotypesofscripts"></a>

Terminal can execute two types of scripts:

1. JavaScript: a safe subset of JavaScript, where you can use short-names that are
    run thru {@link #expand}.

2. EasyScript: a very simple scripting language for setting Parameter values.
    See {@link myphysicslab.lab.util.EasyScriptParser} for syntax details.

These two types of script can be intermixed in a single command as long as they are
separated with a semicolon. For example, here are both types of scripts in
one command:

    DAMPING=0.1;GRAVITY=9.8;ANGLE=2.5;bob.fillStyle='red'

The first three commands are EasyScript commands that set Parameter values; the last is
a JavaScript command.

In most applications the EasyScriptParser is available in the variable `easyScript` and
you can use it to execute EasyScript within JavaScript. Examples:

    easyScript.parse('angle')+0.1

    easyScript.parse('angle='+Math.PI/2);



Safe Subset of JavaScript
-------------------------
<a name="safesubsetofjavascript"></a>

To prevent malicious scripts from being executed, only a safe subset of JavaScript is
allowed. See the book *JavaScript: The Definitive Guide* by Flanagan, section 11.1.2
'Subsets for Security'. JavaScript commands are executed via the JavaScript `eval`
function under
[strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode).

We prohibit access to most global variables including the `window` object which defines
global variables. We prohibit usage of the JavaScript `eval` function and access to
certain methods and properties of Terminal.

Square-brackets are only allowed when they contain a list of numbers. This is to
prevent accessing prohibited properties by manipulating strings, for example the
following is not allowed:

    terminal['white'+'List_']

Arrays of objects other than numbers can be made using `new Array()`.
Array access can be done using the built-in functions
{@link myphysicslab.lab.util.UtilityCore#get UtilityCore.get} and
{@link myphysicslab.lab.util.UtilityCore#set UtilityCore.set}.


<a name="shortnames"></a>
Short Names
-----------
To allow for shorter scripts, we define a variety of regular expressions which
convert short names to their proper long expanded form.

Most class names will have their equivalent short-name defined. For example you can type

    new DoubleRect(0,0,1,1)

instead of

    new myphysicslab.lab.util.DoubleRect(0,0,1,1)

Applications will typically make their key objects available as short-names. So instead
of `app.sim` you can just type `sim`.

These short-names are implemented by defining a set of regular expression replacements
which are applied to the Terminal input string before it is executed.

The methods {@link #addRegex} and {@link #expand} are how short-names are defined and
used. Regular expressions are registered with Terminal using `addRegex`. Then whenever
a command is evaluated it is first expanded to the long form using `expand`.

{@link #stdRegex Terminal.stdRegex} defines a standard set of regular expressions for
expanding myPhysicsLab class names (like `DoubleRect`) and for expanding a few function
shortcuts like `methodsOf`, `propertiesOf` and `prettyPrint`. An application can add
more shortcuts via {@link #addRegex}.

To see the post-expansion names in the Terminal output, use {@link #setVerbose}.


The Result Variable
-------------------
The result of the last Terminal command is stored in a variable named `result`. Here is
an example Terminal session:

    > 2+2
    4
    > result*2
    8
    > result*2
    16

Note that {@link #eval} has an argument called `output` which if set to `false`
prevents `result` from being updated.


Semi-colons End A Comment
-------------------------
Scripts are processed by splitting them into smaller scripts delimited by a semi-colon.
Only semi-colons at the 'top level' of the script have this effect. Semi-colons within
brackets or inside of a quoted string are ignored for command splitting.

An unusual result of this policy is that **a semi-colon will end a comment**. Here we
enter `// this is a comment; 2+2` which looks like a single comment, but it is
interpreted as two separate scripts.

    > // this is a comment;
    > 2+2
    4



URL Query Script
----------------
<a name="urlqueryscript"></a>

A Terminal script can be embedded into a URL
[query string](https://en.wikipedia.org/wiki/Query_string) which will be
executed when the page is loaded. This provides a convenient way to share a
customized simulation with someone else.

The script follows a question mark in the URL, so it is called a 'query script'
or 'query URL'. Here is an example:

    http://www.myphysicslab.com/PendulumApp_en.html?DRIVE_AMPLITUDE=0;
    DAMPING=0.1;GRAVITY=9.8;ANGLE=2.5;ANGLE_VELOCITY=0;

The URL Query Script is executed at startup by calling {@link #parseURL} or
{@link #parseURLorRecall}.  Most myPhysicsLab applications do this.

Because of [percent-encoding](https://en.wikipedia.org/wiki/Percent-encoding)
we must substitute in the URL:

  + `%20` for space
  + `%22` for double-quote

See this
[character encoding chart](https://perishablepress.com/stop-using-unsafe-characters-in-urls/)
to learn which other characters must be percent-encoded.



Session History
---------------
A session history feature recalls previous input lines; these are accessed using the
up/down arrow keys. Command-K clears the output area.

This feature is only for the convenience of the Terminal user, and has no relation to
the command storage feature.


Script Storage
--------------
<a name="scriptstorage"></a>

To allow storage in **HTML5 Local Storage** of commands and later re-use, there are
methods {@link #remember}, {@link #recall}, and {@link #forget}. This allows users to
customize a simulation by remembering a specific script.

Most applications call {@parseURLorRecall} when starting, therefore whenever the page
loads, the remembered script will be executed (unless there is a URL script which would
take priority).

If no script is explicitly supplied to `remember()`, then the commands in the Terminal
output window are saved, as returned by the method {@link #commands}. A user can edit
the contents of the Terminal output window to change what is remembered. Commands are
any line in the output text area that start with '> '.

The {@link #remember} command saves a script specific for the current page and browser.
If you load the page under a different browser, or for a different locale (which is a
different page), there will be a different stored script.


The z Object
--------------
Strict mode prevents adding global variables when using the JavaScript `eval` command.
To allow making variables that persist between commands, Terminal provides an object
named `z` where properties can be added:

    > z.a = 1
    1
    > z.a
    1

This `z` object is a property of Terminal; `z` is initially an object with no
properties. We define a 'short name' regular expression so that referring to `z` is
replaced by `terminal.z` when the command is executed.


Declaring a Variable
--------------------
To hide the usage of the `z` object, Terminal interprets the `var` keyword in a
special way.

When Terminal sees the `var` keyword at the start of a command, it changes the script
to use the `z` object and defines a short-name. For example the command

    var foo = 3;

will become

    z.foo = 3;

and thereafter every reference to `foo` will be changed to `z.foo` in later commands.


The terminal Variable
---------------------
Some features require that the name `terminal` is defined and resolves to the
Terminal object. These features include the `z` variable, the `result` variable,
and the usage of the `var` keyword.

In most apps this is accomplished by using {@link #addRegex} like this:

    terminal.addRegex('terminal', myName);

where `myName` is the global name of the app, which is usually just 'app'. The purpose
of the regex is to replace the word `terminal` with `app.terminal` which
is a valid JavaScript reference.

(In unit tests of Terminal, we temporarily define a global variable named `terminal`.)


Advanced-compile is the Enemy of JavaScript
-------------------------------------------
<a name="advanced-compileistheenemyofjavascript"></a>

When using [Advanced Compile](Building.html#advancedvs.simplecompile) only EasyScript
can be executed in Terminal, not JavaScript code.

Advanced compilation causes all class and method names to be minified to one or two
character names, so scripts based on non-minified names will not work. Also, unused
code is eliminated, so desired features might be missing.

However, names that are **exported** can be used in HTML scripts under
advanced-compile. For example, we export the `eval` method in
{@link myphysicslab.sims.common.AbstractApp} so that EasyScript can be executed via
`app.eval()` even under advanced-compile.
See [Exporting Symbols](Building.html#exportingsymbols).

JavaScript code is disabled under advanced-compile due to security considerations.
The 'safe subset' strategy used here depends on detecting names in the script such as
`window`, `eval`, `myEval`, `whiteList_`, etc. Because advanced-compile renames many of
these, we are no longer able to detect their usage. For example, an attacker could
figure out what the `myEval` function was renamed to, and enter a script that would
call that function; this would not be detected by the 'safe subset' checking which is
looking for `myEval`, not for whatever that method got renamed to.


* @param {!HTMLInputElement} term_input  A textarea where user types input to evaluate
* @param {!HTMLInputElement} term_output  A textarea where results are shown
* @constructor
* @final
* @struct
*/
myphysicslab.lab.util.Terminal = function(term_input, term_output) {
  /** terminal input, usually a text input field.
  * @type {!HTMLInputElement}
  * @private
  */
  this.term_input_ = term_input;
  term_input.spellcheck = false;
  /** terminal output, usually a textarea
  * @type {!HTMLInputElement}
  * @private
  */
  this.term_output_ = term_output;
  term_output.spellcheck = false;
  /** Function to execute after a script is executed.
  * @type {function()|undefined}
  * @private
  */
  this.afterEvalFn_;
  /** key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.keyDownKey_ = goog.events.listen(this.term_input_,
        goog.events.EventType.KEYDOWN,
        /*callback=*/goog.bind(this.handleKey, this),  /*capture=*/false);
  /** key used for removing the listener
  * @type {goog.events.Key}
  * @private
  */
  this.changeKey_ = goog.events.listen(this.term_input_,
      goog.events.EventType.CHANGE, /*callback=*/goog.bind(this.inputCallback, this),
      /*capture=*/true);
  /**  session history of commands entered.
  * @type {!Array<string>}
  * @private
  */
  this.history_ = [];
  /**  index of item last recalled from session history array;  or -1 otherwise.
  * @type {number}
  * @private
  */
  this.histIndex_ = -1;
  /** Whether to print the expanded or unexpanded command.  Seeing the expanded
  * command is useful for debugging, or for understanding how Terminal works.
  * @type {boolean}
  * @private
  */
  this.verbose_ = false;
  /** Set of regular expressions to apply to each command to replace short names
  * with full expanded name. For example, `DoubleRect` is the short name that
  * expands to `myphysicslab.lab.util.DoubleRect`.
  * @type {!Array<!myphysicslab.lab.util.Terminal.regexPair>}
  * @private
  */
  this.regexs_ = [];
  /** When recall() is executing commands, this flag is true.
  * @type {boolean}
  */
  this.recalling = false;
  /** Contains results of last command. Can be referred to in Terminal as `result`.
  * @type {*}
  * @private
  */
  this.result;
  /** An object that command scripts can store properties into.
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
  this.whiteList_ = [ 'myphysicslab', 'goog', 'length', 'top', 'name', 'terminal',
      'find' ];
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
};
var Terminal = myphysicslab.lab.util.Terminal;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
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

/** Add regular expression for transforming script commands before they are executed.
* A typical usage is to make properties of an object available as a single
* short name. For example to transform `rod` or `bob` into `app.rod` or `app.bob`
*
*    terminal.addRegex('rod|bob', 'app');
*
* Another typical usage is to add namespace names to fully qualify a short name. For
* example to transform `DoubleRect` into `myphysicslab.lab.util.DoubleRect`
*
*    terminal.addRegex('DoubleRect', `myphysicslab.lab.util');
*
* This adds the regex to the end of the list of regex's to execute, unless `opt_prepend`
* is `true`. Will not add if the regex is already on the list.
* @param {string} names set of names separated by | symbol
* @param {string} prefix the string to prepend to each occurence of the names
* @param {boolean=} opt_addToVars if `true`, then the set of names is added to the
*     set of defined names returned by {@link #vars}; default is true
* @param {boolean=} opt_prepend if `true`, then the regex is added to the front
*     of the list of regex's to execute; default is false
*/
Terminal.prototype.addRegex = function(names, prefix, opt_addToVars, opt_prepend) {
  var addToVars = goog.isDef(opt_addToVars) ? opt_addToVars : true;
  if (!UtilityCore.ADVANCED) {
    if (names.length == 0) {
      throw new Error();
    }
    if (addToVars) {
      this.checkVars(names);
      if (this.vars_.length > 0 && this.vars_[this.vars_.length-1] != '|') {
        this.vars_ += '|';
      }
      this.vars_ += names;
    }
    // This regexp look for words that are NOT preceded by a dot.
    // Should NOT match within: new myphysicslab.lab.util.DoubleRect
    // SHOULD match within: new DoubleRect
    // (^|[^\w.]) means:  either start of line, or a not-word-or-dot character.
    var re = {
      regex: new RegExp('(^|[^\\w.])('+names+')\\b', 'g'),
      replace: '$1'+prefix+'.$2'
    };
    if (!this.hasRegex(re)) {
      if (opt_prepend) {
        this.regexs_.unshift(re);
      } else {
        this.regexs_.push(re);
      }
    } else {
      throw new Error('variable already exists "'+names+'"');
    }
  }
};

/** Adds the string to white list of allowed expressions.
* @param {string} name string to add to white list
*/
Terminal.prototype.addWhiteList = function(name) {
  if (!goog.array.contains(this.whiteList_, name)) {
    this.whiteList_.push(name);
    if (this.vars_.length == 0) {
      this.vars_ = name;
    } else {
      this.vars_ += '|' + name;
    }
  }
};

/** Returns true if command contains the specified name and the name is prohibited.
* @param {string} command the command to test
* @param {string} name a prohibited name (unless it is on the white list)
* @return {boolean} true means found prohibited name in command, and name was not
*      on the white list
* @private
*/
Terminal.prototype.badCommand = function(command, name) {
  for (var i=0, n=this.whiteList_.length; i<n; i++) {
    if (name == this.whiteList_[i]) {
      return false;
    }
  }
  var re = new RegExp('\\b'+name+'\\b', 'g');
  return re.test(command);
};

/** Check whether the named variables already exist.
* @param {string} names  list of variable names separated by '|'
* @private
*/
Terminal.prototype.checkVars = function(names) {
  var na = names.split('|');
  var nb = this.vars_.split('|');
  goog.array.forEach(na, function(nm) {
    if (goog.array.contains(nb, nm)) {
      throw new Error('variable already exists "'+nm+'"');
    }
  });
};

/** Returns commands in current Terminal output text area, as array of strings,
* for use with {@link #remember}. Commands are any line in the output text area that
* start with '> '. Each command is also trimmed of leading or trailing whitespace.
* @return {!Array<string>}  array of command strings in current Terminal output
*/
Terminal.prototype.commands = function() {
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
};

/** Remove connections to other objects to facilitate garbage collection.
* @return {undefined}
*/
Terminal.prototype.destroy = function() {
  goog.events.unlistenByKey(this.keyDownKey_);
  goog.events.unlistenByKey(this.changeKey_);
};

/** Executes the given command script and returns the result. If `output` is true, then
saves the result, prints the result in the output area, scrolls the output so the most
recent text is visible, clears the input area, remembers the command in the session
history array.

The command is expanded before execution with {@link #expand}. The command is split
into pieces separated by top-level semicolons (top-level means they are not enclosed by
braces). Each fragment is first offered to the Parser installed with
{@link #setParser}. If the Parser does not recognize the fragment, then the fragment is
executed using JavaScript `eval`.

Only a safe subset of JavaScript is allowed to be executed.
See JavaScript: The Definitive Guide by Flanagan, section 11.1.2 'Subsets for Security'.

When `opt_output` is false the `result` variable is updated for successive scripts
(separated by a semicolon) in the same command line, but after the command is finished
executing the `result` variable is unchanged.

Error handling: when `opt_userInput` is true we avoid throwing an error and only print
the error to the terminal where the user will presumably see it. When `opt_userInput` is
false we throw the error message (augmenting the message with the command that caused
the error).

* @param {string} command a fragment of JavaScript to be executed
* @param {boolean=} opt_output whether to output the result to the history window and
*    add the command to history array; default is `true`
* @param {boolean=} opt_userInput whether the script was input by user in Terminal
*    command line interface; default is `false`
* @return {*} the result of executing the command script
* @throws {Error} if an error occurs while executing the script and opt_userInput
*    is false
*/
Terminal.prototype.eval = function(command, opt_output, opt_userInput) {
  var output = goog.isBoolean(opt_output) ? opt_output : true;
  var userInput = opt_userInput || false;
  if (userInput && !output) {
    throw new Error(); // if user input the command then must have output==true
  }
  command = command.trim();
  if (command.match(/^\s*$/)) {
    // blank line: don't enter into history
    return undefined;
  }
  this.evalCalls_++; // number of simultaneous calls to eval() = depth of recursion
  if (output) {
    goog.asserts.assert(this.evalCalls_ <= 1);
    // add command to session history
    this.history_.unshift(command);
    this.histIndex_ = -1;
  } else {
    // The afterEvalFn_ can call eval() when an ExpressionVariable is evaluated during
    // modifyObjects.  This gives one level of recursion. Since output==false the result
    // is preserved.  Further recursion is not possible because you can't call eval()
    // from a Terminal script.
    goog.asserts.assert(this.evalCalls_ <= 2);
    var saveResult = this.result;
    this.result = undefined;
  }
  var prefix = '> ';
  try {
    this.vetBrackets(command);
    // split the command into pieces at each semi-colon, evaluate one piece at a time
    var cmds = ['', command];
    while (cmds = this.splitAtSemicolon(cmds[1]), cmds[0]) {
      var script = cmds[0].trim();
      if (script.length == 0) {
        // ignore blank lines
        continue;
      }
      execute_script:
      {
        // print before evaluating & expanding so that it is clear what caused an error
        if (output) {
          this.println(prefix + script);
        }
        if (this.parser_ != null) {
          // Let Parser evaluate the script before expanding with regex's.
          // For example: 'sim.gravity' is recognized by EasyScriptParser but
          // 'app.sim.gravity' is not.
          //
          // Script Safe Subset:
          // Note that unexpanded `script` has NOT gone thru vetCommand, but it is only
          // a string and cannot be eval'd by the parser. Even if parser is created via
          // script it cannot contain any way to eval a string, because the script was
          // vetted.
          var parseResult = this.parser_.parse(script);
          if (parseResult !== undefined) {
            // the parser was successful
            this.result = parseResult;
            break execute_script;
          }
        }
        var expScript = this.expand(script); // expanded script
        if (output && this.verbose_) {
          this.println(prefix + prefix + expScript);
        }
        this.result = this.myEval(expScript);
      }
    }
    // don't show results when command ends with semi-colon, or undefined result
    if (output && goog.isDef(this.result) && command.slice(-1) != ';') {
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
      this.result = saveResult;
    }
    if (!userInput) {
      this.evalCalls_--;
      ex.message += '\nScript: '+command;
      throw ex;
    }
  }
  this.evalCalls_--;
  if (output) {
    this.scrollDown();
    return this.result;
  } else {
    // restore this.result to previous value, but return result of this command
    var r = this.result;
    this.result = saveResult;
    return r;
  }
};

/** Returns the given Javascript command script expanded by the various regexps
* (which were registered with {@link #addRegex}).
* The expanded command has short-names like `DoubleRect` expanded to full path name
* like `myphysicslab.lab.util.DoubleRect`. Doesn't expand words inside of quoted
* strings.
* @param {string} command a Javascript script to be executed
* @return {string} the command expanded by registered regular expressions
*/
Terminal.prototype.expand = function(command) {
  var c = this.replaceVar(command);
  var exp = ''; //result
  while (c) {
    // process non-quoted string at start of c
    var a = c.match(/^[^'"]*/);
    if (a !== null) {
      var e = a[0]; // the non-quoted string at start of c
      c = c.slice(e.length); // remove the non-quoted string from start of c
      // process the non-quoted string with desired regexs
      e = goog.array.reduce(this.regexs_,
        function(/** string */cmd, /**Terminal.regexPair*/rp) {
          return cmd.replace(rp.regex, rp.replace);
        }, e);
      // add to result
      this.vetCommand(e);
      exp += e;
    }
    // process quoted string at start of c
    // See p. 198 of Friedl, Mastering Regular Expressions, 2nd edition
    // the section called Matching Delimited Text.
    // The regexp has two variants: single or double quotes; it allows escaped quotes
    // in the string.
    //   "   (      \\.      |        [^\\"]           ) *    "
    // quote ( escaped-char  |  not-backslash-or-quote ) *  quote
    a = c.match(/^("(\\.|[^\\"])*")|('(\\.|[^\\'])*')/);
    if (a !== null) {
      e = a[0]; // the quoted string at start of c
      c = c.slice(e.length); // remove the quoted string from start of c
      // add to result
      exp += e;
    }
  }
  return exp;
};

/** Sets user keyboard focus to input text area.
* @return {undefined}
*/
Terminal.prototype.focus = function() {
  this.term_input_.focus();
};

/** Forgets the stored script for the current page and browser.
* @return {undefined}
*/
Terminal.prototype.forget = function() {
  var localStore = window.localStorage;
  if (goog.isDefAndNotNull(localStore)) {
    localStore.removeItem(this.pageKey());
  }
};

/** Called when a key has been pressed.  Implements the `meta-K` command to clear
* the output area, and the up/down arrow keys to scroll thru session command history.
* @param {!goog.events.KeyEvent} evt the event that caused this callback to fire
*/
Terminal.prototype.handleKey = function(evt) {
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
};

/** Returns true if the given regexPair is already on the list of regex's to execute.
* @param {!myphysicslab.lab.util.Terminal.regexPair} q the regexPair of interest
* @return {boolean} true if q is already on the list of regex's to execute.
* @private
*/
Terminal.prototype.hasRegex = function(q) {
  var regex = q.regex.toString();
  var replace = q.replace;
  return goog.array.some(this.regexs_,
    function(/** @type !Terminal.regexPair*/r) {
    return r.replace == replace && r.regex.toString() == regex;
  });
};

/** This callback fires when the textbox 'changes' (usually from focus lost).
* @param {!goog.events.Event} evt the event that caused this callback to fire
* @private
*/
Terminal.prototype.inputCallback = function(evt) {
  this.eval(this.term_input_.value, /*output=*/true, /*userInput=*/true);
};

/** Private version of eval, with no local variables that might confuse the script.
* @param {string} script
* @return {*}
* @private
*/
Terminal.prototype.myEval = function(script) {
  if (!UtilityCore.ADVANCED) {
    return eval('"use strict"; '+script);
  } else {
    this.println('JavaScript is disabled due to advanced compilation; try a simple-compiled version');
    return undefined;
  }
};

/** Returns the identifying key to use for storing script for current web page in HTML5
local storage.
@return {string} the identifying key to use for storing script for current web page in
  HTML5 local storage.
*/
Terminal.prototype.pageKey = function() {
  // This is the name of the html file, and therefore includes a locale suffix,
  // so that each language has a separate script stored.
  // For example: http://www.myphysicslab.com/pendulum_en.html is the English version
  // and http://www.myphysicslab.com/pendulum_de.html is the German version.
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
after a question mark) as a script. Here is an example of a
URL with a query script:

    http://www.myphysicslab.com/pendulum/PendulumApp_de.html?LENGTH=2;GRAVITY=3.2;
    ANGLE=1.8;DRIVE_AMPLITUDE=0

See {@link myphysicslab.lab.util.EasyScriptParser} for details about the syntax used
in the script.

Before executing the query script, this causes the Parser (if installed) to save the
current settings via {@link myphysicslab.lab.util.Parser#saveStart}.
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
    // To test: paste the following link into a browser address field:
    // (edit the address for your environment):
    // file:///Users/erikn/Documents/Programming/jssimlab/build/sims/experimental/BlankSlateApp_en.html?println('hello +(2+3*4)!/=?[];{}.<>:|^$"_-~`@#')
    // You should see in Terminal the string without percent encoding.
    cmd = decodeURIComponent(cmd);
    this.eval(cmd);
    return true;
  }
  return false;
};

/** Parses and executes the query portion of the current URL via {@link #parseURL};
or if there is no URL query then use {@link #recall} to load the stored script, if any.
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
  this.term_output_.value += text+'\n';
  this.scrollDown();
};

/** Retrieve the stored script for the current page from HTML5 local storage. Executes
the script unless requested to not execute.
* @param {boolean=} opt_execute `true` (default) means execute the script; `false` means
*    don't execute the script, only print it
* @return {undefined}
*/
Terminal.prototype.recall = function(opt_execute) {
  var execute = goog.isBoolean(opt_execute) ? opt_execute : true;
  this.recalling = true;
  var localStore = window.localStorage;
  if (goog.isDefAndNotNull(localStore)) {
    var s = /** @type {string} */(localStore.getItem(this.pageKey()));
    if (s) {
      this.println('//start of stored commands');
      if (execute) {
        goog.array.forEach(s.split('\n'), function(t) { this.eval(t); },this);
      } else {
        goog.array.forEach(s.split('\n'), function(t) { this.println(t); },this);
      }
      this.println('//end of stored commands');
    }
  }
  this.recalling = false;
};

/** Remember the given script to execute when this page is loaded in future. Note that
each browser has a separate local storage, so this will only be remembered for the
current browser and page.

If no script is provided then the set of Terminal commands in the output text area are
stored, as returned by {@link #commands}.
* @param {string|!Array<string>|undefined} opt_command the script(s) to remember
* @return {undefined}
*/
Terminal.prototype.remember = function(opt_command) {
  var command = goog.isDef(opt_command) ? opt_command : this.commands();
  if (goog.isArray(command)) {
    command = command.join('\n');
  }
  var k = this.pageKey();
  // store the script under the current file name
  var localStore = window.localStorage;
  if (goog.isDefAndNotNull(localStore)) {
    localStore.setItem(this.pageKey(), command);
  }
};

/** Removes the 'var' at front of a command (if any) and adds regexp which mimics that
JavaScript `var` statement. This helps make Terminal scripts more JavaScript-like, by
hiding usage of the `z` object. For example, if the command is

    var foo = 3;

this will return just `foo = 3;` and add a regexp that replaces `foo` by `z.foo`.
* @param {string} command a Javascript script to be executed
* @return {string} the command with the `var` removed
* @private
*/
Terminal.prototype.replaceVar = function(command) {
  var m = command.match(/^\s*var\s+(\w[\w_\d]*)(.*)/);
  if (m) {
    // suppose the command was 'var foo = 3;'
    // Add a regexp that replaces 'foo' with 'z.foo', and remove 'var' from command
    goog.asserts.assert(m.length >= 3);
    var varName = m[1];
    // important to prepend because the regexp's are executed in order
    this.addRegex(varName, 'z', /*addToVars=*/true, /*prepend=*/true);
    return m[1] + m[2];
  }
  return command;
};

/** Scroll the Terminal output text area to show last line.
* @return {undefined}
*/
Terminal.prototype.scrollDown = function() {
  // scroll down to show the last line
  // scrollTop = number pixels that have scrolled off top edge of element
  // offsetHeight = size of visible portion of element
  // scrollHeight = overall height of element, in pixels
  this.term_output_.scrollTop = this.term_output_.scrollHeight
      - this.term_output_.offsetHeight;
  this.term_input_.value = '';
};

/** Sets the function to execute after evaluating the user input, typically used to
update a display such as a SimView or Graph.
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
  if (!UtilityCore.ADVANCED) {
    parser.addCommand('vars', goog.bind(this.vars, this),
        'lists available variables');
  }
};

/** Specifies whether to show the expanded or short names in the Terminal output text
area. For example, `DoubleRect` is the short name that expands to
`myphysicslab.lab.util.DoubleRect`.
* @param {boolean} expand `true` means show the expanded names in the Terminal output
*/
Terminal.prototype.setVerbose = function(expand) {
  this. verbose_ = expand;
};

/** Finds the section of text up to first top-level semi-colon (top-level means not
enclosed in curly braces). Ignores anything in quotes.
* @param {string} text The text to be split up.
* @return {!Array<string>} array with two elements: array[0] = the section up to and
*    including the first top-level semi-colon; array[1] = the remaining text.
* @private
*/
Terminal.prototype.splitAtSemicolon = function(text) {
  var level = 0;
  var lastChar = '';
  var c = '';
  var quoteMode = false;
  var quoteChar = '';
  var i, n;
  for (i=0, n=text.length; i<n; i++) {
    lastChar = c;
    c = text[i];
    if (quoteMode) {
      // check for escaped quotes inside a string
      if (c == quoteChar && lastChar != '\\') {
        quoteMode = false;
        quoteChar = '';
      }
      continue;
    } else {
      if (c == '"' || c == '\'') {
        quoteMode = true;
        quoteChar = c;
        continue;
      }
      if (level == 0 && c == ';') {
        break;
      }
      if (c == '{') {
        level++;
        continue;
      }
      if (c == '}') {
        level--;
        continue;
      }
    }
  }
  return [text.slice(0, i+1), text.slice(i+1)];
};

/** Adds the standard set of regular expressions to the given Terminal instance. These
regular expressions replace "short names" with the full expression that is valid
JavaScript for referring to the object. This defines short names for many classes and
also utility functions like `prettyPrint`, `methodsOf`, `println` and `propertiesOf`.
* @param {!myphysicslab.lab.util.Terminal} terminal the Terminal instance to which
*      the regexp's will be added
*/
Terminal.stdRegex = function(terminal) {
  // These regexp's look for words that are NOT preceded by a dot.
  // Should NOT match within: new myphysicslab.lab.util.DoubleRect
  // SHOULD match within: new DoubleRect
  // (^|[^\w.]) means:  either start of line, or a not-word-or-dot character.

  terminal.addRegex('methodsOf|propertiesOf|prettyPrint',
       'UtilityCore', /*addToVars=*/false);
  // replace 'println' with 'terminal.println'
  terminal.addRegex('println|z',
       'terminal', /*addToVars=*/false);
  terminal.addRegex('result',
       'terminal', /*addToVars=*/true);
  // ** DO NOT WRAP OR BREAK THESE LONG LINES **
  // See http://stackoverflow.com/questions/12317049/
  // how-to-split-a-long-regular-expression-into-multiple-lines-in-javascript
  // (The alternative is create a new RegExp from a set of concatenated strings).
  terminal.addRegex('AffineTransform|CircularList|Clock|ClockTask|DoubleRect'
      +'|GenericEvent|GenericObserver|GenericMemo|ParameterBoolean|ParameterNumber'
      +'|ParameterString|RandomLCG|EasyScriptParser|Terminal|Timer|UtilityCore|Vector',
      'myphysicslab.lab.util', /*addToVars=*/false);

  terminal.addRegex('NF0|NF2|NF1S|NF3|NF5|NF5E|nf5|nf7|NF7|NF7E|NF9|NFE|NFSCI',
      'myphysicslab.lab.util.UtilityCore', /*addToVars=*/false);

  terminal.addRegex('CollisionAdvance|CoordType|EulersMethod|ExpressionVariable'
      +'|FunctionVariable|MassObject|ModifiedEuler|ConcreteLine|NumericalPath'
      +'|PointMass|RungeKutta|ShapeType|SimList|SimpleAdvance|Spring|VarsList',
      'myphysicslab.lab.model', /*addToVars=*/false);

  terminal.addRegex('CoordMap|DisplayClock|DisplayConnector|DisplayLine|DisplayList'
      +'|DisplayPath|DisplayShape|DisplayRope|DisplaySpring|DisplayText'
      +'|DrawingMode|DrawingStyle|EnergyBarGraph|HorizAlign|LabCanvas|LabView'
      +'|ScreenRect|SimView|VerticalAlign',
       'myphysicslab.lab.view', /*addToVars=*/false);

  terminal.addRegex('CircularEdge|CollisionHandling|ContactSim|DampingLaw'
       +'|EdgeRange|ExtraAccel|GravityLaw|Gravity2Law|ImpulseSim|Joint'
       +'|Polygon|RigidBodyCollision|RigidBodySim|Rope|Scrim|Shapes|StraightEdge'
       +'|ThrusterSet|Vertex|Walls',
       'myphysicslab.lab.engine2D', /*addToVars=*/false);

  terminal.addRegex('AutoScale|DisplayGraph|GraphColor|GraphLine'
       +'|GraphStyle|DisplayAxes|VarsHistory',
       'myphysicslab.lab.graph', /*addToVars=*/false);

  terminal.addRegex('EventHandler|MouseTracker|RigidBodyEventHandler'
       +'|SimController|SimRunner|ViewPanner',
       'myphysicslab.lab.app', /*addToVars=*/false);

  terminal.addRegex('ButtonControl|CheckBoxControl|ChoiceControl'
       +'|NumericControl|SliderControl|ToggleControl',
       'myphysicslab.lab.controls', /*addToVars=*/false);

};

/** Returns names of the variables that have been defined using {@link #addRegex}.
* @return {string}
*/
Terminal.prototype.vars = function() {
  var v = this.vars_.split('|');
  goog.array.sort(v);
  return v.join(', ');
};

/** Throws an error if the command contains prohibited usage of square brackets.
Square brackets can be used to access properties by name, which is dangerous.
For example: `this['white'+'List_']` would not be detected.
Prohibit square brackets, except allow square brackets with numbers inside
so that simple array indexing is allowed, and creating arrays of numbers is allowed.
Note: a script can use UtilityCore.get() or set() for more complex expressions.
* @param {string} command
*/
Terminal.prototype.vetBrackets = function(command) {
  //Allow numbers, spaces, and commas inside square brackets to make arrays of numbers.
  var goodRegexp = /^\[\s*[\d,\s.-]*\s*\]$/;
  var broadRegexp = /\[[^\]]*?\]/g;
  var r = command.match(broadRegexp);
  if (r != null) {
    for (var i=0, n=r.length; i<n; i++) {
      if (!goodRegexp.test(r[i])) {
        throw new Error('prohibited usage of square brackets in command: '+command);
      }
    }
  }
};

/** Throws an error if the command contains prohibited code.
The goal is to allow the command to be executed if it contains a 'safe subset'
of JavaScript. See JavaScript: The Definitive Guide by Flanagan, section 11.1.2
'Subsets for Security'.
* @param {string} command
*/
Terminal.prototype.vetCommand = function(command) {
  // prohibit all window properties (which are globally accessible names),
  // except for those on whiteList_.
  for (var p in window) {
    if (this.badCommand(command, p)) {
      throw new Error('prohibited name: "' + p + '" found in command: ' + command);
    }
  }
  // Prohibit JavaScript features that allow executing code and access to most
  // properties of Terminal.
  // Prohibit HTML Element and Node properties and methods that access parent or change
  // structure of the Document.
  // We allow `setParser` because any Parser that is defined via script will have
  // been vetted.
  var blackList = /\b(myEval|eval|Function|with|__proto__|call|apply|caller|callee|arguments|addWhiteList|vetCommand|badCommand|whiteList_|addRegex|regexs_|afterEvalFn_|setAfterEval|parentNode|parentElement|innerHTML|outerHTML|offsetParent|insertAdjacentHTML|appendChild|insertBefore|replaceChild|removeChild|ownerDocument|insertBefore|parser_|defineNames)\b/g;
  if (blackList.test(command)) {
    throw new Error('prohibited name in command: '+command);
  }
  // 'top' is a global that refers to the containing window (or the window itself).
  // Prohibit any usage of 'top' but allow '.top'.
  // (^|[^\w.]) means:  either start of line, or a not-word-or-dot character.
  var topRegexp = /(^|[^\w.])top\b/g;
  if (topRegexp.test(command)) {
    throw new Error('prohibited usage of "top" in command: ' + command);
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
