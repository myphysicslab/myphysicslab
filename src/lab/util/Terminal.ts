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

import { Printable, Util } from "./Util.js";

// GenericMemo is required only in case user wants to use it in Terminal.
//import { GenericMemo } from "./Memo.js";

/**  A regular expression and the replacement string expression to be used in a
* `String.replace()` command.
*/
export type regexPair = {
  regex: RegExp;
  replace: string;
};

/** Executes a script. */
export interface Parser extends Printable {

  /** Adds a single-word command to this Parser. When the Parser sees this command
  during {@link Parser.parse} it will execute the given function.
  The function result is returned as the result of `parse`.

  The function must return a value other than `undefined`, otherwise a script syntax
  error will be indicated to the user.

  @param commandName name of command
  @param commandFnc function to execute
  @param helpText description of the command for help text
  */
  addCommand(commandName: string, commandFnc: ()=>any, helpText: string): void;

  /** Interprets and executes a script.
  * @param script the script to parse and execute
  * @return the value of the script, or `undefined` if the script did not fit
  *     the allowed syntax
  * @throws if executing the script causes an error
  */
  parse(script: string): any;

  /** Saves current application and simulation state to compare against when generating
  a script later on. This helps shorten the script by not including settings that are
  unchanged.
  */
  saveStart(): void;

}; // end Parser interface

// ************************* Terminal **************************

/** Executes scripts and provides a command line user interface with separate text
fields for input and output. Executes EasyScript or JavaScript. Allows use of "short
names" to replace full namespace pathnames of classes.

After the script is executed the result is converted to text and displayed in the
output text field. The output is not displayed if the result is `undefined` or the
script ends with a semicolon.

See also [Customizing myPhysicsLab Software](../Customizing.html).


Getting Help
------------
Type `help` in the Terminal input text area and press return to see the help message.
Several useful Terminal commands are shown.

Perhaps the most useful command is `vars` which shows the list of variables that are
available.


Summary: How Scripts Are Processed
----------------------------------
Scripts entered into Terminal are transformed in these ways:

+ Scripts are split at semi-colons into separate lines. Each line is executed
separately. (Semi-colons within braces are ignored).

+ EasyScript parser handles lines that it recognizes. 

+ `var` at start of a line becomes a `z` variable property. For example `var foo`
becomes `app.z.foo`.

+ Short-names are transformed to long-names. Example: `DoubleRect` becomes
`lab$util$DoubleRect`. Also existing variables are transformed, for example `foo` it
becomes `app.z.foo`.

+ Javascript's `eval` function executes the resulting line.

Turning on verbose mode with `terminal.setVerbose(true)` shows these transformations as
they happen.


<a id="twotypesofscripts"></a>
Two Types of Scripts
--------------------

Terminal can execute two types of scripts:

1. JavaScript. The code is transformed so that short-names can be used.

2. EasyScript: a very simple scripting language for setting Parameter values.
    See {@link lab/util/EasyScriptParser.EasyScriptParser} for syntax details.

These two types of script can be intermixed in a single script as long as they are
separated by a semicolon. For example, here are both types of scripts in
one script which could be entered in
[PendulumApp](https://www.myphysicslab.com/pendulum/pendulum-en.html?SHOW_TERMINAL=true).
```text
DAMPING=0.1; GRAVITY=9.8; ANGLE=2.5; bob.setFillStyle('red');
```

The first three commands are EasyScript commands that set Parameter values; the last is
a JavaScript command.

In most applications EasyScriptParser is available in the variable
`easyScript`, which you can use to execute EasyScript from within JavaScript. Here are
examples that can be entered (as individual lines) in
[PendulumApp](https://www.myphysicslab.com/pendulum/pendulum-en.html?SHOW_TERMINAL=true).
```js
easyScript.parse('angle')

easyScript.parse('angle='+Math.PI/2)

easyScript.getParameter('gravity').getValue()

easyScript.getParameter('gravity').setValue(2.5)
```


Long Names
----------
To make class names accessible for scripting in Terminal, we create a global variable
for each class. For example
```text
lab$util$DoubleRect
```
is the global variable for the {@link lab/util/DoubleRect.DoubleRect} class. This
naming scheme is used to avoid potential conflicts with other global variables.


<a id="shortnames"></a>
Short Names
-----------
To allow for shorter scripts, we define a variety of regular expressions in Terminal
which convert short names to their proper long expanded form. This allows typing for
example:
```text
new DoubleRect(0,0,1,1)
```
which is automatically converted to
```text
new lab$util$DoubleRect(0,0,1,1)
```

Applications will typically also make their key objects available with short-names.
So instead of `app.sim` you can just type `sim`.

You can see this short-name to long-name conversion by using
{@link Terminal.setVerbose}:
```text
> terminal.setVerbose(true)
> new Vector(2,3)
>> new lab$util$Vector(2,3)
Vector{x: 2, y: 3}
```

In verbose mode, the command is echoed a second time to show how it appears after
{@link Terminal#expand expansion}. The terminal prompt symbol `>>` is doubled to
distinguish the expanded version.

Short-names are implemented by defining a set of regular expression replacement rules
which are applied to the Terminal input string before it is executed.

Regular expression rules are registered with Terminal using {@link Terminal.addRegex}.
Then whenever a command is evaluated it is first expanded to the long form
using {@link Terminal.expand}.

{@link Terminal.stdRegex} defines a standard set of regular expressions for
expanding myPhysicsLab class names (like `DoubleRect`) and for expanding a few function
shortcuts like `methodsOf`, `propertiesOf` and `prettyPrint`. An application can add
more shortcuts via {@link Terminal.addRegex}.


<a id="thezobject"></a>
Variables and the z Object
----------------------------
Scripts are executed with
[indirect eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#direct_and_indirect_eval) under
[strict mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode).
Each script line is `eval`'d separately, and a new scope is created for each `eval()`.
Any variables created only exist during that `eval()`, then they disappear.

To allow making variables that persist between lines and commands, the app provides an
object named `z` where properties can be added. A script like `var a = 1; a` is
translated to define a property on the `z` object, instead of a new global variable.
It looks something like this:
```text
> z.a = 1
1
> z.a
1
```

This `z` object is itself a property of the application object usually called `app`;
`z` is initially an object with no properties. We define a [short name](#shortnames)
regular expression so that referring to `z` is replaced by `app.z` when a script line
is executed. Using {@link Terminal.setVerbose} you would see the following:
```text
> terminal.setVerbose(true)
> var a=1
>> app.z.a=1
1
> a
>> app.z.a
1
```


Declaring a Variable
--------------------
To hide the usage of the `z` object, Terminal interprets the `var`, `let` and `const`
keywords in a special way.

When Terminal sees the `var` or `let` keywords at the start of a command, it changes
the script to use the `z` object and defines a new short-name. For example the command
```text
> var foo = 3
3
```
is translated to
```text
> app.z.foo = 3
3
```
and thereafter every reference to `foo` will be changed to `app.z.foo` in later
commands. You can see this at work by using {@link Terminal.setVerbose}:
```text
> terminal.setVerbose(true)
> foo
>> app.z.foo
3
```


Line Splitting Affects How Scripts Are Processed
------------------------------------------------
A script is executed by splitting it up into lines of code that are separated by
semi-colons.

Each execution of a line (via indirect `eval`) has it's own temporary scope where any
created variables, functions, or classes go. That scope disappears as soon as the
execution finishes.

Only lines that are at the "top level" are split by semi-colons; any semi-colons
within braces or parenthesis (or inside of strings) are ignored. **Braces turn off line
splitting.**

For example: this script creates a class and does a test within braces, but the class
and variable disappear after execution. The value `7` is printed if you paste this
entire script into Terminal input, but `a` and `myClass` are no longer defined.

```js
{ class myClass {
    myField=7;
    constructor() {}
} 
var a = new myClass();
println(a.myField) }
```

To make things within braces persistent, assign them to something defined beforehand.

```js
var a;
{ class myClass {
    myField=7;
    constructor() {}
} 
a = new myClass(); };
a.myField
```

To make a class (or function) persistent, assign it to a variable.

```js
var myClass = class { myField=7; constructor() {} };
var a = new myClass();
a.myField
```


The Result Variable
-------------------
The result of the last Terminal script is stored in a variable named `result`. Here is
an example Terminal session:
```text
> 2+2
4
> result*2
8
> result*2
16
```

Note that {@link Terminal.eval} has an argument called `output` which if set to `false`
prevents `result` from being updated. When `output==false`, then `result` is is defined
for commands in the same string, but that version of `result` is temporary and
independent of the permanent `result` variable.


The terminal Variable
---------------------
Some features (such as the `result` variable) require that the name `terminal` is
defined and resolves to the Terminal object.

In most applications this is accomplished by using {@link Terminal.addRegex} something
like this:
```js
terminal.addRegex('terminal', 'app');
```
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
    [start-up HTML page](../Customizing.html#customizingthestart-uphtmlpage). You can
    then call `Terminal.eval()` directly on a string that you create, and that
    string can include newline characters.

The tab character also cannot be input directly to the Terminal input field, because
the browser interprets that to mean "move to the next field". You can use `\u0009` or
`\x09` which are replaced by a tab character before the script is evaluated.


URL Query Script
----------------

A Terminal script can be embedded into a URL
[query string](https://en.wikipedia.org/wiki/Query_string) which will be executed when
the page is loaded. This provides a convenient way to remember or share a customized
simulation with someone else.

The script follows a question mark in the URL, so it is called a 'query script'
or 'query URL'. Here is an
[example](<https://www.myphysicslab.com/pendulum/pendulum-en.html?DRIVE_AMPLITUDE=0;DAMPING=0.1;GRAVITY=9.8;ANGLE=2.5;ANGLE_VELOCITY=0;>):
```text
https://www.myphysicslab.com/pendulum/pendulum-en.html?DRIVE_AMPLITUDE=0;
DAMPING=0.1;GRAVITY=9.8;ANGLE=2.5;ANGLE_VELOCITY=0;
```

The URL Query Script is executed at startup by calling {@link Terminal.parseURL}.
Most myPhysicsLab applications do this.

Some websites will only accept user-supplied URLs that follow the strict guidelines of
[URL percent-encoding](https://en.wikipedia.org/wiki/Percent-encoding). Therefore
we must substitute in the URL:

+ `%20` for space
+ `%22` for `"`
+ `%3C` for `<`
+ `%3E` for `>`
+ `%5C` for `\`

See this
[character encoding chart](https://perishablepress.com/stop-using-unsafe-characters-in-urls/)
to learn which other characters must be percent-encoded. You can use
{@link Terminal.encodeURIComponent} which is a more stringent version
of doing the character encoding; it percent-encodes other symbols such as:

+ `%27` for `'`
+ `%28` for `(`
+ `%29` for `)`
+ `%3B` for `;`

Here is an example of a URL query script using JavaScript in an application:
```text
https://www.myphysicslab.com/pendulum/double-pendulum-en.html?
simRun.pause();simRun.reset();sim.setGravity(5.0);statusView.getDisplayList()
.add(energyGraph);statusView.getDisplayList().add(displayClock);
var%20va=sim.getVarsList();va.setValue(0,0.15545);va.setValue(1,-0.33548);
va.setValue(2,-2.30681);va.setValue(3,2.68179);sim.saveInitialState();
simRun.resume();layout.showTerminal(true);
```

[Try this link](<https://www.myphysicslab.com/pendulum/double-pendulum-en.html?simRun.pause%28%29%3BsimRun.reset%28%29%3Bsim.setGravity%285.0%29%3BstatusView.getDisplayList%28%29.add%28energyGraph%29%3BstatusView.getDisplayList%28%29.add%28displayClock%29%3Bvar%20va%3Dsim.getVarsList%28%29%3Bva.setValue%280%2C0.15545%29%3Bva.setValue%281%2C-0.33548%29%3Bva.setValue%282%2C-2.30681%29%3Bva.setValue%283%2C2.68179%29%3Bsim.saveInitialState%28%29%3BsimRun.resume%28%29%3Blayout.showTerminal%28true%29%3B>)
which contains the above code; you should also see the code in the Terminal output area.

Here is an interactive tool for trying out
[URL Encode/Decode](https://www.url-encode-decode.com). Note however that tool replaces
a space with a `+` which instead should be replaced by `%20`.

Many websites and programming tools require that the URL be fully encoded with the more
stringent version.


<a id="sessionhistory"></a>
Session History
---------------
The session history feature recalls previous input lines; these are accessed using the
up/down arrow keys. Command-K clears the output area.

*/
export class Terminal {
  /** terminal input, usually a text input field. */
  private term_input_: HTMLInputElement|null;
  /** terminal output, usually a textarea */
  private term_output_: HTMLTextAreaElement|null;
  /** Function to execute after a script is executed.*/
  private afterEvalFn_?: ()=>void = undefined;
  /** keydown event handler, saved for removing listener. */
  private keyDownFn_: (e:Event)=>void;
  /** change event handler, saved for removing listener. */
  private changeFn_?: (e:Event)=>void = undefined;
  /** Whether the {@link Terminal.alertOnce} function has happened. */
  private hasAlerted_: boolean = false;
  /**  session history of scripts entered. */
  private history_: string[] = [];
  /**  index of item last recalled from session history array;  or -1 otherwise. */
  private histIndex_: number = -1;
  /** Whether to print the expanded or unexpanded script.  Seeing the expanded
  * script is useful for debugging, or for understanding how Terminal works.
  */
  private verbose_: boolean = false;
  /** Set of regular expressions to apply to each script to replace short names
  * with full expanded name. For example, `DoubleRect` is the short name that
  * expands to `myphysicslab.lab.util.DoubleRect`.
  */
  private regexs_: regexPair[] = [];
  /** Contains results of last script. Can be referred to in Terminal as `result`. */
  private result: any = undefined;
  /** Holds the error message from last `eval()` */
  private error: string;
  /** Contains saved results when eval is being called recursively. */
  private resultStack_: any[] = [];
  /** An object that scripts can store properties into.
  * See [The z Object](#thezobject).
  * Note that an app might specify it's own z object, which would shorten the
  * long name to be `app.z.foo` instead of `app.terminal.z.foo`.
  */
  z: object = { };
  parser: Parser|null = null;
  /** The variables available to the user. Names separated by | symbol. */
  vars_: string = '';
  /** Number of simultaneous calls to eval() for detecting recursion */
  private evalCalls_: number = 0;
  /** The prompt to show before each user-input command. */
  private prompt_: string = '> ';
  /** Function to execute after an error in a script occurs, but only for
  * scripts that are not "user input". Typical use is to do "show terminal"
  * on the Layout, so the user can see the error there.
  */
  afterErrorFn: ()=>void;

/**
* @param term_input  A text input field where user can enter a
*    script to evaluate, or `null`.
* @param term_output  A multi-line textarea where results are shown, or `null`
*/
constructor(term_input: HTMLInputElement|null, term_output: HTMLTextAreaElement|null) {
  this.term_input_ = term_input;
  if (term_input) {
    term_input.spellcheck = false;
    this.keyDownFn_ = this.handleKey.bind(this);
    term_input.addEventListener('keydown', this.keyDownFn_, /*capture=*/false);
    //this.changeFn_ = this.inputCallback.bind(this);
    //term_input.addEventListener('change', this.changeFn_, /*capture=*/true);
  }
  this.term_output_ = term_output;
  if (term_output) {
    term_output.spellcheck = false;
  }
  // Allow scripts to call eval() but those calls are replaced by "terminal.eval"
  // so that they go thru Terminal.eval() and are properly expanded.
  this.addRegex('eval', 'terminal.', /*addToVars=*/false);
  this.println(Terminal.version());
};

/** @inheritDoc */
toString() {
  return 'Terminal{history.length: '+this.history_.length
      +', regexs_.length: '+this.regexs_.length
      +', verbose_: '+this.verbose_
      +', parser: '+(this.parser != null ? this.parser.toStringShort() : 'null')
      +'}';
};

/** Adds a regular expression rule for transforming scripts before they are executed.
*
* One usage is to prepend the namespace to fully qualify a [short name](#shortnames).
* For example, to transform `DoubleRect` into `myphysicslab.lab.util.DoubleRect`
*```
* terminal.addRegex('DoubleRect', `myphysicslab.lab.util.');
*```
*
* Another usage is to make properties of an object available as a single short name.
* For example to transform `rod` or `bob` into `app.rod` or `app.bob`
*```
* terminal.addRegex('rod|bob', 'app.');
*```
*
* The regular expression rule is added to the end of the list of regex's to execute,
* unless `opt_prepend` is `true`.
*
* @param names set of names separated by `|` symbol
* @param prefix the string to prepend to each occurence of the names
* @param opt_addToVars if `true`, then the set of names is added to the
*     set of defined names returned by {@link Terminal.vars}; default is `true`
* @param opt_prepend if `true`, then the regex rule is added to the front
*     of the list of regex's to execute; default is `false`
* @return whether the regex rule was added (returns `false` if the regex rule
*     already exists)
*/
addRegex(names: string, prefix: string, opt_addToVars?: boolean,
    opt_prepend?: boolean): boolean {
  const addToVars = opt_addToVars ?? true;
  if (names.length == 0) {
    throw '';
  }
  if (addToVars) {
    const nms = names.split('|');
    const vrs = this.vars_.split('|');
    nms.forEach(nm => {
      if (!vrs.includes(nm)) {
        this.vars_ += (this.vars_.length > 0 ? '|' : '') + nm;
      }
    });
  }
  // This regexp look for words that are NOT preceded by a dot or dollar sign.
  // (^|[^\w.$]) means:  either start of line, or a not-word-or-dot-or-$ character.
  // Should NOT match within: new myphysicslab.lab.util.DoubleRect
  // SHOULD match within: new DoubleRect
  // Should NOT match within: module$exports$myphysicslab$lab$util$Util
  // SHOULD match within: Util.toName
  const regex = new RegExp('(^|[^\\w.$])('+names+')\\b', 'g');
  const replace = '$1'+prefix+'$2'
  return this.addRegex2(regex, replace, opt_prepend);
};

/** Adds a regular expression rule for transforming scripts before they are executed.
*
* @param regex the RegExp to find
* @param replace the replacement expression
* @param opt_prepend if `true`, then the regex rule is added to the front
*     of the list of regex's to execute; default is `false`
* @return whether the regex rule was added (returns `false` if the regex rule
*     already exists)
*/
addRegex2(regex: RegExp, replace: string, opt_prepend?: boolean): boolean {
  const re: regexPair = {
    regex: regex,
    replace: replace
  };
  if (!this.hasRegex(re)) {
    if (opt_prepend) {
      this.regexs_.unshift(re);
    } else {
      this.regexs_.push(re);
    }
    return true;
  }
  return false;
};

/** Adds to the set of defined names returned by {@link Terminal.vars}
* @param name string to add to white list
*/
addToVars(name: string): void {
  this.vars_ += (this.vars_.length > 0 ? '|' : '') + name;
};

/** Shows an alert with the given message, but only the first time it is called.
This prevents infinite loop of alerts. An example where that can happen is if an
error occurs during a blur or focus event, which can then repeat after the user
dismisses the alert which causes further blur/focus events.
@param msg the message to show
*/
alertOnce(msg: string) {
  if (!this.hasAlerted_) {
    this.hasAlerted_ = true;
    alert(msg);
  } else {
    console.log(msg);
  }
};

/** Clear all terminal output. */
clear(): void {
  if (this.term_output_) {
    this.term_output_.value = '';
  }
};

/** Returns command scripts in current Terminal output text area, as array of strings.
* Commands are any line in the output text area that start with `> `.
* Each script is also trimmed of leading or trailing whitespace.
* @return  array of command strings in current Terminal output
*/
commands(): string[] {
  if (this.term_output_) {
    let t = this.term_output_.value.split('\n');
    // remove leading and trailing whitespace on each command
    t = t.map(e => e.trim());
    // filter out non-commands, and the 'terminal.remember()' command
    t = t.filter((e: string) => e.length>2 && e.substr(0,2)== '> '
          && !e.match(/^> (terminal|this).(remember|commands)\(\s*\);?$/)
      );
    t = t.map(e => e.substr(2));
    return t;
  } else {
    return [];
  }
};

/** Remove connections to other objects to facilitate garbage collection. */
destroy(): void {
  if (this.keyDownFn_ && this.term_input_) {
    this.term_input_.removeEventListener('keydown', this.keyDownFn_, false);
  }
  if (this.changeFn_ && this.term_input_) {
    this.term_input_.removeEventListener('change', this.changeFn_, true);
  }
};

/** This is a more stringent version of
[encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)
which adheres to [RFC 3986](https://tools.ietf.org/html/rfc3986) which reserves
characters `!'()*`. Some websites (such as reddit) will not accept a user supplied URL
that contains those characters.
@param str the string to encode
@return the encoded string
*/
static encodeURIComponent(str: string): string {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16));
}

/** Executes the given script and returns the result.

When `output` is `true`: updates the `result` variable, prints the result in the
output text area, scrolls the output so the most recent text is visible, clears the
input text area, remembers the script in the [session history](#sessionhistory).

When `output` is `false`: the `result` variable is updated for
successive scripts (separated by a semicolon) in the same script line, but after the
script is finished executing the `result` variable is unchanged. The output text area
and session history array are unchanged.

The `output=false` option allows for evaluating scripts that
define a variable, for example in
{@link lab/model/FunctionVariable.FunctionVariable}.
The FunctionVariable script can be executed frequently without modifying the `result`
seen by the user in Terminal.

The script is split into pieces separated by top-level semicolons (top-level means they
are not enclosed by braces). Each fragment is first offered to the Parser installed
with {@link Terminal.setParser}. If the Parser does not recognize the fragment, then
the fragment is expanded {@link Terminal.expand} before being executed
using JavaScript `eval`.

Error handling: when `showAlert` is `false` we avoid throwing an error and only
print the error to the output text area where the user will presumably see it. When
`showAlert` is `true` we show an alert with the error message.

`eval()` never throws an error because the error message would be lost in that
process. Because of CORS policy (Cross-origin Resource Sharing) browsers only report
the message "Script error." Therefore we instead show an alert to the user here
with the error text. This can happen for example on start-up if a script in the
HTML file is being eval'd.

In unit tests, you can pass `showAlert = false` and examine the
resulting error with {@link Terminal.getError}.

@param script a fragment of JavaScript to be executed
@param output whether to print the result to the output text area and
   add the script to session history; default is `true`
@param showAlert whether to show an alert with error message when an error
   occurs in the script; default is `true`
@return the result of executing the script
*/
eval(script: string, output: boolean = true, showAlert: boolean = true): any {
  script = script.trim();
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
    Util.assert(this.evalCalls_ == 1);
    Util.assert(this.resultStack_.length == 0);
    // add script to session history
    this.history_.unshift(script);
    this.histIndex_ = -1;
  } else {
    // The afterEvalFn_ can call eval() when an FunctionVariable is evaluated during
    // modifyObjects.  This gives one level of recursion. Since output==false the
    // result is preserved.  Recursion can also happen by calling eval() in the script
    // being executed here (eval is mapped to call Terminal.eval not JavaScript eval).
    this.resultStack_.push(this.result);
    this.result = undefined;
  }
  const prompt = this.prompt_;
  try {
    // split the script into pieces at each semicolon, evaluate one piece at a time
    let cmds = ['', script];
    while (cmds = this.splitAtSemicolon(cmds[1]), cmds[0]) {
      const cmd = cmds[0].trim();
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
        // ignore comments starting with two slashes
        if (cmd.match(/^\s*\/\/.*/)) {
          continue;
        }
        if (this.parser != null) {
          // Let Parser evaluate the cmd before expanding with regex's.
          // For example: 'sim.gravity' is recognized by EasyScriptParser but
          // 'app.sim.gravity' is not.
          const parseResult = this.parser.parse(cmd);
          if (parseResult !== undefined) {
            // the parser was successful
            this.result = parseResult;
            break execute_cmd;
          }
        }
        const expScript = this.expand(cmd);
        if (output && this.verbose_) {
          this.println(prompt.trim() + prompt + expScript);
        }
        try {
          // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/
          // Global_Objects/eval#direct_and_indirect_eval
          // This does an indirect eval in strict mode.
          this.result = (0, eval)('"use strict";'+expScript);
        } catch (ex: unknown) {
          throw `${ex} in script "${expScript}"`;
        }
      }
    }
    // don't show results when cmd ends with semicolon, or undefined result
    if (output && this.result !== undefined && script.slice(-1) != ';') {
      this.println(String(this.result));
    }
    if (output && this.afterEvalFn_ !== undefined) {
      this.afterEvalFn_();
    }
    this.error = '';
  } catch (ex: unknown) {
    this.error = String(ex);
    if (output) {
      this.result = undefined;
      this.println(String(ex));
    } else {
      this.result = this.resultStack_.pop();
    }
    if (showAlert) {
      // show the error here instead of re-throwing because: due to CORS security
      // you only see "Script error." as the message if you throw again.
      // https://blog.sentry.io/2016/05/17/what-is-script-error/
      Util.showErrorAlert(String(ex));
      if (this.afterErrorFn !== undefined) {
        // in CreateApp, after an error in the script we want to do "show terminal"
        // so the user can understand whats going on.
        // Test by writing an error like "2+;" into Billiards2App.html's script.
        this.afterErrorFn();
      }
    }
  }
  this.evalCalls_--;
  if (output) {
    this.scrollDown();
    return this.result;
  } else {
    // restore this.result to previous value, but return result of this script
    const r = this.result;
    this.result = this.resultStack_.pop();
    return r;
  }
};

/** Returns the given Javascript script expanded by the various regular expression
* rules which were registered with {@link Terminal.addRegex}. The expanded script has
* [short names](#shortnames) like `DoubleRect` expanded to have full path name like
* `lab$util$DoubleRect`. Doesn't expand words inside of quoted strings
* or regular expressions.
* @param script a Javascript script to be executed
* @return the script expanded by registered regular expressions
*/
expand(script: string): string {
  let c = this.replaceVar(script);
  let exp = ''; //result
  let count = 0;
  while (c) {
    if (++count > 10000) {
      // prevent infinite loop
      throw 'Terminal.expand';
    }
    // process non-quoted string at start of c
    let a = c.match(/^[^'"/]+/);
    if (a !== null) {
      let e = a[0]; // the non-quoted string at start of c
      c = c.slice(e.length); // remove the non-quoted string from start of c
      // process the non-quoted string with desired regexs
      e = this.regexs_.reduce( (cmd: string, rp: regexPair) =>
          cmd.replace(rp.regex, rp.replace), e);
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
        const e = a[0]; // the regexp at start of c
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
      const e = a[0]; // the quoted string at start of c
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
      const e = a[0]; // the quoted string at start of c
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

/** Sets user keyboard focus to input text area. */
focus(): void {
  if (this.term_input_) {
    this.term_input_.focus();
  }
};

/** Returns the error message from the last {@link Terminal.eval} call, or empty
* string if no error occurred.
*/
getError(): string {
  return this.error;
};

/** Called when a key has been pressed.  Implements the `meta-K` command to clear
* the output area, and the up/down arrow keys to scroll through
* [session history](#sessionhistory).
* @param e the event that caused this callback to fire
*/
handleKey(e: Event): void {
  if (e.type !== 'keydown') {
    return;
  }
  const evt = e as KeyboardEvent;
  if (this.term_input_ && this.term_output_) {
    if (evt.metaKey && evt.key==="k") {
      // cmd-K = clear all terminal output
      this.term_output_.value = '';
      evt.preventDefault();
    } else if (evt.key==="ArrowUp" || evt.key==="ArrowDown") {
      // arrow up/down keys = get terminal session history
      // save current contents of input to history if it is non-empty and was user-input
      if (this.histIndex_ == -1 && this.term_input_.value != '') {
        // add the current text to session history
        this.history_.unshift(this.term_input_.value);
        // pretend we were just displaying the first history item
        this.histIndex_ = 0;
      }
      if (evt.key==="ArrowUp") {
        if (this.histIndex_ < this.history_.length-1) {
          // there is more session history available
          this.histIndex_++;
          this.term_input_.value = this.history_[this.histIndex_];
        }
      } else if (evt.key==="ArrowDown") {
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
    } else if (evt.key==="Enter") {
      // This fixes a problem:
      // When we change term_input to show a history text (with arrow keys), but then
      // typing return key has no effect unless and until some character is typed
      // that changes the text field (e.g. a space).
      this.eval(this.term_input_.value, /*output=*/true, /*showAlert=*/false);
    }
  }
};

/** Returns true if the given regexPair is already on the list of regex's to execute.
* @param q the regexPair of interest
* @return true if q is already on the list of regex's to execute.
*/
private hasRegex(q: regexPair): boolean {
  const regex = q.regex.toString();
  const replace = q.replace;
  return this.regexs_.some((r: regexPair)=> r.replace==replace &&
      r.regex.toString()==regex);
};

/** This callback fires when the textbox 'changes' (usually from focus lost).
* @param evt the event that caused this callback to fire
*/
private inputCallback(_evt: Event): void {
  if (this.term_input_) {
    this.eval(this.term_input_.value, /*output=*/true, /*showAlert=*/false);
  }
};

/** Parses and executes the query portion of the current URL (the portion of the URL
after a question mark) as a script. See [URL Query Script](#md:url-query-script).

Before executing the query script, this calls {@link Parser.saveStart} to save the
current settings.
@return returns true if there was a URL query script
*/
parseURL(): boolean {
  if (this.parser != null) {
    this.parser.saveStart();
  }
  const loc = window.location.href;
  const queryIdx = loc.indexOf('?');
  if (queryIdx > -1) {
    let cmd = loc.slice(queryIdx+1);
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
    this.eval(cmd, /*output=*/true, /*showAlert=*/true);
    return true;
  }
  return false;
};

/** Print the given text to the Terminal output text area, followed by a newline.
* @param text the text to print to the Terminal output text area
*/
println(text: string): void {
  if (this.term_output_) {
    this.term_output_.value += text+'\n';
    this.scrollDown();
  }
};

/** Removes the `var` or `let` at front of a script (if any) and adds regexp which
mimics that JavaScript `var` statement. This helps make Terminal scripts more
JavaScript-like, by hiding usage of the `z` object. For example, if the script is
```
var foo = 3;
```
this will return just `foo = 3;` and add a regexp that replaces `foo` by `z.foo`.
@param script a Javascript script to be executed
@return the script with the `var` removed
*/
private replaceVar(script: string): string {
  const m = script.match(/^\s*(var|let|const)\s+(\w[\w_\d]*)(.*)/);
  if (m) {
    // suppose the script was 'var foo = 3;'
    // Add a regexp that replaces 'foo' with 'z.foo', and remove 'var' from script
    Util.assert(m.length >= 4);
    const varName = m[2];
    // important to prepend because the regexp's are executed in order
    this.addRegex(varName, 'z.', /*addToVars=*/true, /*prepend=*/true);
    return m[2] + m[3];
  }
  return script;
};

/** Scroll the Terminal output text area to show last line. */
scrollDown(): void {
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
* update a display such as a {@link lab/view/SimView.SimView} or
* {@link lab/graph/DisplayGraph.DisplayGraph}.
* @param afterEvalFn  function to execute after evaluating
*     the user input; can be `undefined` to turn off this feature
*/
setAfterEval(afterEvalFn?: ()=>void): void {
  this.afterEvalFn_ = afterEvalFn;
};

/** Installs the Parser used to parse scripts during {@link Terminal.eval}.
* @param parser the Parser to install.
*/
setParser(parser: Parser): void {
  this.parser = parser;
  parser.addCommand('vars', () => String(this.vars()),
      'lists available variables');
};

/** Sets the prompt symbol shown before each command.
* @param prompt the prompt symbol to show before each command
*/
setPrompt(prompt: string): void {
  this.prompt_ = String(prompt);
};

/** Specifies whether to show the expanded command in the Terminal output text area.
* In verbose mode, the command is echoed a second time to show how it appears after
* {@link Terminal#expand expansion}. The terminal prompt symbol is doubled to
* distinguish the expanded version.
* @param expand `true` means show expanded names in the Terminal output
*/
setVerbose(expand: boolean): void {
  this. verbose_ = expand;
};

/** Finds the section of text up to first top-level semicolon (top-level means not
* enclosed in curly braces). Ignores semicolons in quotes or regular expression.
* Note however that top-level double-slash comments end at a new-line not semicolon.
* @param text The text to be split up.
* @return array with two elements: array[0] = the section up to and
*    including the first top-level semicolon; array[1] = the remaining text.
*/
private splitAtSemicolon(text: string): string[] {
  let level = 0;
  let lastNonSpace = '';
  let lastChar = '';
  let nextChar = ''
  let c = '';
  let commentMode = false; // double-slash comments only
  let regexMode = false;
  let quoteMode = false;
  let quoteChar = '';
  let i, n;
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
* These regular expression rules replace [short names](#shortnames) with the full
* expression that is valid JavaScript for referring to the object. This defines short
* names for many classes and also utility functions like `prettyPrint`, `methodsOf`,
* `println` and `propertiesOf`.
* @param terminal the Terminal instance to which the regexp's will be added
*/
static stdRegex(terminal: Terminal): void {
  // These regexp's look for words that are NOT preceded by a dot.
  // Should NOT match within: new myphysicslab.lab.util.DoubleRect
  // SHOULD match within: new DoubleRect
  // (^|[^\w.]) means:  either start of line, or a not-word-or-dot character.

  terminal.addRegex('methodsOf|propertiesOf|prettyPrint',
       'Util.', /*addToVars=*/false);
  // replace 'println' with 'terminal.println'
  terminal.addRegex('println',
       'terminal.', /*addToVars=*/false);
  terminal.addRegex('getParameter|getSubject',
       'terminal.parser.', /*addToVars=*/false);
  terminal.addRegex('result|z|parser',
       'terminal.', /*addToVars=*/true);

  // note: $$ represents $ in regexp-replace string.
  terminal.addRegex('AffineTransform|CircularList|Clock|ClockTask'
      +'|DoubleRect|EasyScriptParser|GenericEvent|GenericMemo|GenericObserver'
      +'|MutableVector|ParameterBoolean|ParameterNumber|ParameterString'
      +'|RandomLCG|Terminal|Timer|Util|Vector',
      'lab$$util$$', /*addToVars=*/false);

  terminal.addRegex('NF0|NF2|NF1S|NF3|NF5|NF5E|nf5|nf7|NF7|NF7E|NF9|NFE|NFSCI',
      'Util.', /*addToVars=*/false);

  terminal.addRegex('CollisionAdvance|ConcreteVariable|ConcreteLine|ConstantForceLaw'
      +'|CoordType|DampingLaw|EulersMethod|Force|FunctionVariable'
      +'|GravityLaw|Gravity2Law|MassObject|ModifiedEuler'
      +'|NumericalPath|ParametricPath|OvalPath|PointMass'
      +'|RungeKutta|ShapeType|SimList|SimpleAdvance|Spring|VarsList',
      'lab$$model$$', /*addToVars=*/false);

  terminal.addRegex('CoordMap|DisplayClock|DisplayConnector|DisplayLine|DisplayList'
      +'|DisplayPath|DisplayShape|DisplayRope|DisplaySpring|DisplayText'
      +'|DrawingMode|DrawingStyle|HorizAlign|LabCanvas|SimView|DisplayArc'
      +'|ScreenRect|SimView|VerticalAlign',
       'lab$$view$$', /*addToVars=*/false);

  terminal.addRegex('CircularEdge|CollisionHandling|ConcreteVertex|ContactSim'
       +'|EdgeRange|ExtraAccel|ImpulseSim|Joint|JointUtil|PathJoint|Polygon'
       +'|RigidBodyCollision|RigidBodySim|Rope|Scrim|Shapes|StraightEdge'
       +'|ThrusterSet|Vertex|Walls',
       'lab$$engine2D$$', /*addToVars=*/false);

  terminal.addRegex('AutoScale|DisplayGraph|GraphColor|GraphLine|EnergyBarGraph'
       +'|GraphStyle|DisplayAxes|VarsHistory',
       'lab$$graph$$', /*addToVars=*/false);

  terminal.addRegex('EventHandler|MouseTracker|RigidBodyEventHandler'
       +'|SimController|SimRunner|ViewPanner',
       'lab$$app$$', /*addToVars=*/false);

  terminal.addRegex('ButtonControl|CheckBoxControl|CheckBoxControlBase|ChoiceControl'
       +'|ChoiceControlBase|LabelControl|NumericControl|NumericControlBase'
       +'|SliderControl|TextControl|TextControlBase|ToggleControl',
       'lab$$controls$$', /*addToVars=*/false);
};

/** Returns names of the variables that have been defined using
* {@link Terminal.addRegex}.
* This is used as a "help" command for the user to know what variables are available.
* @return names of defined variables, in alphabetic order
*/
vars(): string[] {
  const v = this.vars_.split('|');
  v.sort();
  return v;
};

/** Returns string identifying current version of myPhysicsLab software.
* @return version information
*/
static version(): string {
  return 'myPhysicsLab version '+ Util.VERSION + ', '
      + 'compiled on '+ Util.COMPILE_TIME+'.'
}

} // end Terminal class

Util.defineGlobal('lab$util$Terminal', Terminal);
