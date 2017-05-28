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

goog.provide('myphysicslab.lab.util.EasyScriptParser');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('myphysicslab.lab.util.Parameter');
goog.require('myphysicslab.lab.util.Parser');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.SubjectEvent');
goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var Parameter = myphysicslab.lab.util.Parameter;
var Subject = myphysicslab.lab.util.Subject;
var SubjectEvent = myphysicslab.lab.util.SubjectEvent;
var Terminal = myphysicslab.lab.util.Terminal;
var Util = myphysicslab.lab.util.Util;

/** Executes EasyScript commands which get or set {@link Parameter} values
for a specified set of {@link Subject}s. Also executes some single word commands such
as `help`. Can generate a script to recreate the current state of an application/
simulation.

Execute EasyScript Commands
---------------------------
EasyScriptParser (ESP) is given a list of Subjects in its constructor. ESP interrogates
all the Subjects and remembers their settable Parameters and initial values.

ESP is typically used with {@link Terminal}. ESP is installed via
{@link Terminal#setParser}. When a script is executed in Terminal, the script is first
offered to ESP by calling {@link #parse}.

+ If ESP recognizes the Subject and Parameter name in the script then ESP will get or
set the Parameter value.

+ If ESP doesn't recognize the Subject and Parameter name there is no error, instead
`parse()` returns `undefined` and Terminal will try to execute the script as JavaScript
instead.


EasyScript Syntax
-----------------
Here is an example EasyScript that can be used in [Newtons Cradle](https://www.myphysicslab.com/engine2D/newtons-cradle-en.html)

    DAMPING=0.1;GRAVITY=16;PENDULUMS=4;PENDULUM_LENGTH=4;

The "setter" syntax is

    [SubjectName.]ParameterName=value[;]

The "getter" syntax is

    [SubjectName.]ParameterName[;]

where square brackets indicate optional elements. Multiple scripts can be on one line
separated by a semicolon.

+ `SubjectName` is the language-independent name returned by {@link Subject#getName}.
It is optional when `ParameterName` is unique among all specified Subjects. It is
required when multiple Subjects have the same Parameter name.

+ `ParameterName` is the language-independent name returned by
{@link Parameter#getName}.

+ `value` is a string that is given as input to {@link Parameter#setFromString}. The
string can be optionally surrounded with quotes like a JavaScript string in which case
the quotes are removed and backslash escaped characters (quote, newline, tab, etc.) are
replaced. If not surrounded with quotes then the string ends at the semicolon or end of
line.

With both setter and getter syntax the value of the Parameter is available as the
result of the {@link #parse} method, or in the `result` variable of {@link Terminal},
or displayed in the Terminal output area.

The English language version of Parameter or Subject names can also be given, they are
converted to the language-independent form using {@link Util#toName}. Leading
and trailing spaces are trimmed from names and (unquoted) values.

Single Word Commands
--------------------
A small set of single word commands are recognized by EasyScriptParser.
Use {@link #addCommand} to add more single word commands. The built-in commands are:

+ `help` lists the available single word commands and other help information
+ `names` shows available parameter names
+ `script` prints a script to recreate current state of application/ simulation
+ `url` prints URL of current web page along with script to recreate current state
+ `values` shows available parameter names and their current values

Generate a script that recreates the simulation
-----------------------------------------------
{@link #script} makes a script to set all Parameters to the current simulation state.
To keep the generated script as small as possible, EasyScriptParser remembers the
initial value of all Parameters at startup. The `script` method only creates commands
to set Parameters whose value has changed.
{@link myphysicslab.lab.util.Parameter#isComputed Computed Parameters} are ignored
because setting them has no effect (their value is always computed from other values).

The {@link #script} method returns just the script without the URL of the current web
page (see section below [EasyScript Embedded in URL](#easyscriptembeddedinurl)). The script can be executed in the Terminal
command line interface. This can be useful when creating a script to paste directly
into Terminal, to put in a
[start-up HTML page](Customizing.html#customizingthestart-uphtmlpage),
or save with the {@link Terminal#remember} command,

Volatile Subjects
-----------------
A volatile Subject can at any time change its set of Parameters and/or their initial
values. For volatile Subjects, EasyScriptParser updates its remembered set of
Parameters and their initial values when {@link #update} is called.

While any Subject can be a volatile Subject, in practice the only volatile Subjects are
instances of {@link myphysicslab.lab.model.VarsList VarList} with its associated set of
{@link myphysicslab.lab.model.Variable Variables}.

Many applications have multiple "configurations" that the user can choose between. A
configuration specifies what objects are created and their initial positions. For
example, in
[Newtons Cradle](https://www.myphysicslab.com/engine2D/newtons-cradle-en.html)
you can choose the number of pendulums, which changes the set of variables and their
initial positions. The configuration is itself controlled by a Parameter, for example
{@link myphysicslab.sims.engine2D.NewtonsCradleApp NewtonsCradleApp.en.NUM_BODIES}
is the name of the Parameter controlling the number of pendulums.

Because the VarsList is specified as a volatile Subject we are able to generate a very
short script like `PENDULUMS=4;` that only shows the configuration Parameter changing
instead of showing every variable that changes.


Parameter Independence
----------------------
To work well with EasyScriptParser (ESP), an application or simulation should strive to
have all Parameters be independent of each other.

Otherwise, if Parameter A modifies the setting of Parameter B, then the result of
running the script generated by ESP will depend on the order of the statements: setting
Parameter B only has an effect if it is done after setting Parameter A.

(There is limited control over the order of statements generated by {@link #script}.
You can change the order of Subjects passed to ESP constructor. But within the Subject,
the Parameter order is that returned by {@link Subject#getParameters}).

Note that "configuration" Parameters violate this concept of Parameter Independence,
which is why we specify the affected Subjects to be "volatile".

<a name="easyscriptembeddedinurl"></a>
EasyScript Embedded in URL
--------------------------
To save a customized version of a simulation, or share it with someone else, use
{@link #scriptURL}. That method returns the URL of the current page along with a script
that sets Parameters to their current values.

The script follows a question mark in the URL, so it is called a 'query script' or
'query URL'. Here is an
[example](https://www.myphysicslab.com/pendulum/pendulum-en.html?DRIVE_AMPLITUDE=0;DAMPING=0.1;GRAVITY=9.8;ANGLE=2.5;ANGLE_VELOCITY=0;)

    https://www.myphysicslab.com/pendulum/pendulum-en.html?DRIVE_AMPLITUDE=0;
    DAMPING=0.1;GRAVITY=9.8;ANGLE=2.5;ANGLE_VELOCITY=0;

A user can save or share this custom URL. When the URL is pasted into a
browser, the scripts embedded in the URL will be executed.

For the application to execute the query URL requires that {@link Terminal#parseURL} is
called during application startup.

* @param {!Array<!Subject>} subjects list of Subject's to gather Parameters from;
    note that the order here is significant; the Parameters are processed according
    to the order of the Subjects in this list.
* @param {!Array<!Subject>=} volatile those Subject's whose initial conditions
*    change depending on another configuration parameter. Generally this is the
*    VarsList of a simulation. These must also be included in `subjects`.
* @constructor
* @final
* @struct
* @implements {myphysicslab.lab.util.Parser}
*/
myphysicslab.lab.util.EasyScriptParser = function(subjects, volatile) {
  EasyScriptParser.checkUniqueNames(subjects);
  /* The set of Parameters can change over time; this is especially true for
  * volatile Subjects. To cope with a changing set of Parameters, we store only
  * Parameter names, not references to Parameters objects. We store a parallel list
  * of Subjects, so we can get the Parameter object by asking the Subject for a
  * Parameter with that name. This allows for the Parameter to be a different
  * object, but as long as it has the same name and belongs to the same Subject we
  * can find the Parameter and set or get it's value.
  */
  /** The set of Subjects to examine.
  * @type {!Array<!Subject>}
  * @private
  */
  this.subjects_ = subjects;
  /** The set of volatile Subjects to examine (usually VarsList).
  * @type {!Array<!Subject>}
  * @private
  */
  this.volatile_ = goog.isArray(volatile) ? volatile : [];
  goog.array.forEach(this.volatile_, function(v) {
    if (!goog.array.contains(subjects, v)) {
      throw new Error('volatile Subject not included in list of Subjects '+v);
    }
  });
  /** Names and initial values of non-volatile Parameters. Used for making the script
  * shorter.
  * @type {!Array<string>}
  * @private
  */
  this.initialNonVolatile_ = [];
  /** Names and initial values of volatile Parameters. Used for making the script
  * shorter.
  * @type {!Array<string>}
  * @private
  */
  this.initialVolatile_ = [];
  /** The complete set of SubjectName.ParameterName strings.
  * One string for each Parameter.
  * @type {!Array<string>}
  * @private
  */
  this.allSubjParamNames_ = [];
  /** The complete set of ParameterName strings. Can contain duplicate Parameter names.
  * Same order as allSubjParamNames_, one string for each Parameter.
  * @type {!Array<string>}
  * @private
  */
  this.allParamNames_ = [];
  /** The set of all Subjects, corresponding to each Parameter in allSubjParamNames_.
  * Same order as allSubjParamNames_, one Subject for each Parameter.
  * @type {!Array<!Subject>}
  * @private
  */
  this.allSubjects_ = [];
  /** For each Parameter, whether it has a unique name among Parameter names
  * in allParamNames_.
  * Same order as allSubjParamNames_, one boolean for each Parameter.
  * @type {!Array<boolean>}
  * @private
  */
  this.unique_ = [];
  /**
  * @type {!Array<string>}
  * @private
  */
  this.commandNames_ = [];
  /**
  * @type {!Array<function():string>}
  * @private
  */
  this.commandFns_ = [];
  /**
  * @type {!Array<string>}
  * @private
  */
  this.commandHelp_ = [];
  this.addCommand('url', goog.bind(function() {
        return this.scriptURL();
      }, this), 'prints URL with script to recreate current state');
  this.addCommand('script', goog.bind(function() {
        return this.script();
      }, this), 'prints script to recreate current state');
  this.addCommand('values', goog.bind(function() {
        return Util.prettyPrint(this.values());
      }, this), 'shows available parameters and their current values');
  this.addCommand('names', goog.bind(function() {
        return Util.prettyPrint(this.names().join(';'));
      }, this), 'shows available parameter names');
  this.addCommand('help', goog.bind(function() {
        return this.help();
      }, this), 'prints this help text');
  this.update();
};
var EasyScriptParser = myphysicslab.lab.util.EasyScriptParser;

if (!Util.ADVANCED) {
  /** @inheritDoc */
  EasyScriptParser.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', subjects_: ['
        + goog.array.map(this.subjects_, function(s) { return s.toStringShort(); })
        +']}';
  };

  /** @inheritDoc */
  EasyScriptParser.prototype.toStringShort = function() {
    return 'EasyScriptParser{subjects_.length: '+this.subjects_.length+'}';
  };
};

/** @inheritDoc */
EasyScriptParser.prototype.addCommand = function(commandName, commandFnc, helpText) {
  this.commandNames_.push(commandName);
  this.commandFns_.push(commandFnc);
  this.commandHelp_.push(helpText);
};

/** Check that each Subject name is unique among this set of Subjects
* @param {!Array<!Subject>} subjects
* @private
*/
EasyScriptParser.checkUniqueNames = function(subjects) {
  /** @type !Array<string> */
  var names = [];
  goog.array.forEach(subjects, function(subj) {
      var nm = subj.getName();
      if (goog.array.contains(names, nm)) {
        throw new Error('duplicate Subject name: '+nm);
      };
      names.push(nm);
    });
};

/** Returns the Parameter corresponding to the given name, which can consist of either
just the name of a Parameter (if unique among all Subjects) or be both Subject name and
Parameter name separated by a dot.
* @param {string} fullName name of Parameter, optionally preceded by name of Subject
*    and a dot
* @return {?Parameter} the Parameter corresponding to the given name, or `null` if
*    no Parameter found
* @throws {Error} when only Parameter name is given, but multiple Subjects have that
*    Parameter.
* @private
*/
EasyScriptParser.prototype.getParameter = function(fullName) {
  var n = fullName.split('.');
  var subjectName, paramName;
  if (n.length == 1) {
    subjectName = '';
    paramName = n[0];
  } else if (n.length == 2) {
    subjectName = n[0];
    paramName = n[1];
  } else {
    return null;
  }
  var idx;
  if (subjectName == '') {
    var count = goog.array.count(this.allParamNames_,
        function(p) { return p == paramName; });
    if (count > 1) {
      throw new Error('multiple Subjects have Parameter '+paramName);
    }
    idx = goog.array.indexOf(this.allParamNames_, paramName);
  } else {
    idx = goog.array.indexOf(this.allSubjParamNames_, fullName);
  }
  return idx > -1 ? this.allSubjects_[idx].getParameter(paramName) : null;
};

/** Returns the "help" string which gives information on available commands.
* @return {string} the "help" string which gives information on available commands.
*/
EasyScriptParser.prototype.help = function() {
  var s = 'myPhysicsLab version '+ Util.VERSION + ', '
  s += (Util.ADVANCED ? 'advanced' : 'simple') + '-compiled.\n';
  s += 'Use the "values" command to see what can be set and the syntax.\n\n';
  s += 'command-K            clear Terminal window\n'
  s += 'arrow up/down        retrieve previous or next command\n'
  if (!Util.ADVANCED) {
    s += 'propertiesOf(app)    shows properties of that object\n';
    s += 'methodsOf(app)       shows methods defined on that object\n';
    s += 'prettyPrint(app)     prints the object nicely\n';
    s += 'prettyPrint(app, 3)  prints the object even nicer\n';
    s += 'println(1+2)         prints to the Terminal window\n';
    s += 'result               the result of the previous command\n';
  }
  for (var i=0, len=this.commandNames_.length; i<len; i++) {
    var cn = this.commandNames_[i];
    while (cn.length < 20) {
      cn += ' ';
    }
    s += cn + ' ' + this.commandHelp_[i] + '\n';
  }
  return s;
};

/** Returns the list of Parameter names that can be modified by this EasyScriptParser.
* Each Parameter name is preceded by the name of its Subject and a dot.
* @return {!Array<string>} the set of Parameter names that can be
*    set by this EasyScriptParser
*/
EasyScriptParser.prototype.names = function() {
  return goog.array.clone(this.allSubjParamNames_);
};

/** Returns a script which sets Parameters to their current values.
See {@link EasyScriptParser} for the syntax of the script.

Uses {@link Parameter#isComputed} to exclude Parameters
that are being automatically computed, unless `includeComputed` is `true`.

* @param {boolean} volatile `true` means return only Parameters belonging to the
*    set of volatile Subjects; `false` means return only non-volatile Parameters.
* @param {boolean=} includeComputed `true` means include Parameters that are
*    automatically computed; default is `false` which means filter out Parameters
*    that are automatically computed.
* @param {boolean=} fullName `true` means always return Subject and Parameter name;
*    default is `false` which means don't include Subject name when
*    Parameter name is unique.
* @return {string} a script which sets Parameters to their current values
* @private
*/
EasyScriptParser.prototype.namesAndValues = function(volatile, includeComputed, fullName) {
  volatile = volatile == true;
  var allParams = goog.array.map(this.allSubjects_,
      function(s, idx) { return s.getParameter(this.allParamNames_[idx]); }, this);
  var params = allParams;
  if (!includeComputed) {
    // filter out Parameters that are automatically computed
    params = goog.array.filter(params, function(p) { return !p.isComputed(); });
  }
  // Keep only Parameters of volatile or non-volatile Subjects as requested.
  params = goog.array.filter(params,
      function(p) {
        return goog.array.contains(this.volatile_, p.getSubject()) == volatile;
      }, this);
  var re = /^[a-zA-Z0-9_]+$/;
  var s = goog.array.map(params,
      function(p) {
        var paramName = Util.toName(p.getName());
        var idx = goog.array.indexOf(allParams, p);
        var v = p.getValue();
        if (goog.isString(v) && !re.test(v)) {
          // add quotes when string has non-alphanumeric characters
          v = '"' + v + '"';
        }
        // don't include Subject name when Parameter name is unique
        if (!fullName && this.unique_[idx]) {
          return paramName + '=' + v;
        } else {
          var subjName = Util.toName(p.getSubject().getName());
          return subjName + '.' + paramName + '=' + v;
        }
      }, this);
  return s.length > 0 ? s.join(';') + ';' : '';
};

/** @inheritDoc */
EasyScriptParser.prototype.parse = function(script) {
  // remove trailing semicolon
  if (script.slice(-1) == ';') {
    script = script.slice(0, script.length-1);
  }
  // if script is single-word command names, then execute that command function
  for (var i=0, len=this.commandNames_.length; i<len; i++) {
    if (script.toLowerCase() == this.commandNames_[i]) {
      return this.commandFns_[i]();
    }
  }
  var a = script.split('=');
  // fullName can be 'SUBJECT_NAME.PARAM_NAME' or just 'PARAM_NAME'
  var fullName = Util.toName(a[0].trim());
  var param = this.getParameter(fullName);
  if (param == null || a.length > 2) {
    return undefined;
  }
  if (a.length == 2) {
    try {
      var value = EasyScriptParser.unquote(a[1].trim());
      param.setFromString(value);
    } catch(ex) {
      ex.message += '\nwhile setting value "'+value+'" on parameter '+fullName;
      throw ex;
    }
  }
  return param.getValue();
};

/** @inheritDoc */
EasyScriptParser.prototype.saveStart = function() {
  this.initialNonVolatile_ = this.namesAndValues(false).split(';');
  this.initialVolatile_ = this.namesAndValues(true).split(';');
};

/** Returns a script which sets Parameters to their current values.
*
* To keep the length of the script as short as possible
*
* + this ignores Parameters that are automatically computed, see
*    {@link Parameter#isComputed}.
*
* + this ignores Parameters whose value is unchanged since {@link #saveStart}
*    was called (or for a volatile Subject, since {@link #update} was called.
*
* + when a Parameter name is unique, we don't include the Subject name.
*
* @return {string}
*/
EasyScriptParser.prototype.script = function() {
  var ar = this.namesAndValues(false).split(';');
  ar = goog.array.concat(ar, this.namesAndValues(true).split(';'));
  var initSettings = goog.array.concat(this.initialNonVolatile_, this.initialVolatile_);
  // strip out any settings that are identical to initial settings
  goog.array.removeAllIf(ar, function(s) {
      return goog.array.contains(initSettings, s);
    });
  return ar.join(';')+(ar.length > 0 ? ';' : '');
};

/** Returns a URL for the current page along with query script to set Parameters to
* their current values. The *query* part of the URL is the part following the
* question mark. When pasted into a browser, the {@link Terminal#parseURL}
* method can be used to extract the script from the URL query and execute it.
*
* See {@link #script} for details about how the script is created.
* @return {string}
*/
EasyScriptParser.prototype.scriptURL = function() {
  // get the current URL, but remove any URL query (= text after the '?' in URL)
  var u = window.location.href.replace(/\.html\?.*$/, '.html');
  // Add commands as a URL query, after '?'.
  return u + '?' + this.script();
};

/** Removes quotes from start and end of a string, and replaces
[single character escape sequences](https://mathiasbynens.be/notes/javascript-escapes)
with the corresponding character.
* @param {string} text
* @return {string}
*/
EasyScriptParser.unquote = function(text) {
  if (text.length < 2) {
    return text;
  }
  var firstChar = text.charAt(0);
  var lastChar = text.charAt(text.length-1);
  if (firstChar == lastChar && (firstChar == '"' || firstChar == '\'')) {
    // search for escaped quotes
    var r = '';
    for (var i=1, n=text.length-1; i<n; i++) {
      var c = text[i];
      if (c == '\\') {
        // when we see a backslash, look ahead at next char
        i++;
        if (i < n) {
          c = text[i];
          // escaped characters (doesn't include \x or \u escapes)
          switch (c) {
            case '0': r += '\0'; break; //null
            case 'b': r += '\b'; break; //backspace
            case 't': r += '\t'; break; //tab
            case 'n': r += '\n'; break; //new line
            case 'v': r += '\v'; break; //vertical tab
            case 'f': r += '\f'; break; //form feed
            case 'r': r += '\r'; break; //carriage return
            case '"': r += '"'; break;  //double quote
            case '\'': r += '\''; break;//single quote
            case '\\': r += '\\'; break;//backslash
            default: r += '\\'+c;
          }
        } else {
          // this case is a back-slash at end of the string
          r += c;
        }
      } else {
        // normal text: not a backslash
        r += c;
      }
    }
    return r;
  }
  // this case is non-quoted string
  return text;
};

/** Updates the set of Parameters associated with the Subjects, and remembers the
* initial settings of any 'volatile' Subject's Parameters.
*
* This is different from {@link #saveStart} in two ways:
* 1. this updates initial values only for volatile Subjects.
* 2. this updates the remembered list of available Parameter names.
*
* @return {undefined}
*/
EasyScriptParser.prototype.update =  function() {
  var params = goog.array.reduce(this.subjects_,
      function(/** !Array<!Parameter>*/result, subj) {
        // filter out params with name 'DELETED'
        var s_params = goog.array.filter(subj.getParameters(),
            function(p) { return p.getName() != 'DELETED'; });
        return result.concat(s_params);
      }, []);

  this.allSubjects_ = goog.array.map(params,
      function(p) { return p.getSubject(); });

  this.allParamNames_ = goog.array.map(params,
      function(p) { return Util.toName(p.getName()); });

  this.allSubjParamNames_ = goog.array.map(params,
      function(p) {
        return Util.toName(p.getSubject().getName()+'.'+p.getName());
      });

  this.unique_ = goog.array.map(this.allParamNames_,
      function(p) { return 1 == goog.array.count(this.allParamNames_,
          function(q) { return q == p; });
      }, this);

  this.initialVolatile_ = this.namesAndValues(true).split(';');
};

/** Returns the set of Parameter names that can be set by this EasyScriptParser, and
* their current values. Each Parameter name is preceded by the name of its Subject and
* a dot.
* @return {string} the set of Parameter names that can be
*    set by this EasyScriptParser and their current values
*/
EasyScriptParser.prototype.values = function() {
  return this.namesAndValues(false, true, true) + this.namesAndValues(true, true, true);
};

/** Set of internationalized strings.
@typedef {{
  URL_SCRIPT: string,
  PROMPT_URL: string,
  WARN_URL_2048: string
  }}
*/
EasyScriptParser.i18n_strings;

/**
@type {EasyScriptParser.i18n_strings}
*/
EasyScriptParser.en = {
  URL_SCRIPT: 'share',
  PROMPT_URL: 'Press command-C to copy this URL to the clipboard, it will replicate this simulation with current parameters.',
  WARN_URL_2048: 'WARNING: URL is longer than 2048 characters.'
};

/**
@private
@type {EasyScriptParser.i18n_strings}
*/
EasyScriptParser.de_strings = {
  URL_SCRIPT: 'mitteilen',
  PROMPT_URL: 'Dr\u00fccken Sie command-C um diesen URL in die Zwischenablage zu kopieren, dies beinhaltet die eingegebenen Parameter.',
  WARN_URL_2048: 'Achtung: URL is l\u00e4nger als 2048 Zeichen.'
};

/** Set of internationalized strings.
@type {EasyScriptParser.i18n_strings}
*/
EasyScriptParser.i18n = goog.LOCALE === 'de' ?
    EasyScriptParser.de_strings :
    EasyScriptParser.en;

});  // goog.scope
