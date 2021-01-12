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

goog.module('myphysicslab.lab.util.EasyScriptParser');

const array = goog.require('goog.array');
const Parameter = goog.require('myphysicslab.lab.util.Parameter');
const Parser = goog.require('myphysicslab.lab.util.Parser');
const Subject = goog.require('myphysicslab.lab.util.Subject');
const SubjectEvent = goog.require('myphysicslab.lab.util.SubjectEvent');
const Terminal = goog.require('myphysicslab.lab.util.Terminal');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Executes EasyScript commands which get or set {@link Parameter} values
for a specified set of {@link Subject}s. Also executes some single word commands such
as `help`. Can generate a script to recreate the current state of an application/
simulation.

EasyScriptParser takes a “snapshot” of the starting parameters and variables. But there
are two snapshots: independent and dependent. The independent parameters have no effect
on each other. The dependent parameters and variables are usually determined by a
"configuration" parameter (for example, the number of pendulums in NewtonsCradle). The
dependent snapshot is retaken when the config parameter is altered. The dependent
snapshot should be the exact state that follows from setting that config parameter
(this implies no randomness when creating the simulation).

Note that the EasyScriptParser "snapshot" is different from the "save initial
conditions" feature in Simulation:

+ the EasyScriptParser "snapshot" is the "blank slate" starting conditions after
    the Simulation is created.

+ the "save initial conditions" is used when doing "reset" on the Simulation. These
    initial conditions can differ from the "blank slate" starting conditions.


Execute EasyScript Commands
---------------------------
EasyScriptParser (ESP) is given a list of Subjects in its constructor. ESP interrogates
all the Subjects and remembers their settable Parameters and initial values.

ESP is typically used with {@link Terminal}. ESP is installed via
{@link Terminal#setParser}. Note that {@link #saveStart} must be called before
using ESP; in Terminal this is done as part of {@link #parseURL}.

When a script is executed in Terminal, the script is first
offered to ESP by calling {@link #parse}.

+ If ESP recognizes the Subject and Parameter name in the script then `parse`
    will get or set the Parameter value and return the value.

+ If ESP doesn't recognize the Subject and Parameter name there is no error,
    instead `parse` returns `undefined` and Terminal will try to execute
    the script as JavaScript instead.


EasyScript Syntax
-----------------
Here is an example EasyScript that can be entered in the Terminal interface of
[Newtons Cradle](https://www.myphysicslab.com/engine2D/newtons-cradle-en.html)

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
+ `names` shows available Parameter names
+ `script` prints a script to recreate current state of application/ simulation
+ `url` prints URL of current web page along with script to recreate current state
+ `values` shows available Parameter names and their current values


Generate a Script that Recreates the Simulation
-----------------------------------------------
The {@link #script} method makes a script that sets all Parameters to match the current
simulation state.

To keep the generated script as small as possible, EasyScriptParser remembers the
initial value of all Parameters at startup (the {@link #saveStart} method can be used
to update the initial values after startup). The `script` method only creates commands
to set Parameters whose value has changed.
{@link myphysicslab.lab.util.Parameter#isComputed Computed Parameters} are ignored
because setting them has no effect (their value is always computed from other values).

The `script` method returns just the script without the URL of the current web page
(see [EasyScript Embedded in URL](#easyscriptembeddedinurl) if you want the URL as
well). The script can be pasted into the
[Terminal command line interface](Customizing.html#terminalforscriptexecution),
or put in a
[start-up HTML page](Customizing.html#customizingthestart-uphtmlpage),
or saved with the {@link Terminal#remember} command.

See [Customizing myPhysicsLab Simulations](Customizing.html) for more about how to use
scripts in myPhysicsLab.


Parameter Independence
----------------------
To work well with EasyScriptParser, an application or simulation should strive to
have all Parameters be independent of each other.

Suppose Parameter A modifies the value of Parameter B. Then the result of
running the script generated by EasyScriptParser will depend on the order of the
statements: setting Parameter B only has an effect if it is done *after* setting
Parameter A.

Note that "configuration" Parameters violate this concept of Parameter Independence,
which is why we specify the affected Subjects to be "dependent".


<a id="dependentsubjects"></a>
Dependent Subjects
-----------------
A dependent Subject can be changed by a controlling "configuration" Parameter. The
configuration Parameter determines the size, shape, initial positions and number of
objects in the simulation. In essence, the configuration Parameter implies a new set of
initial values for the dependent Subjects.

Many applications have multiple "configurations" that the user can choose between. For
example, in
[Newtons Cradle](https://www.myphysicslab.com/engine2D/newtons-cradle-en.html)
the number of pendulums is controlled by a Parameter called `PENDULUMS` which is
connected to the
{@link myphysicslab.sims.engine2D.NewtonsCradleApp#setNumBodies
NewtonsCradleApp.setNumBodies} method.

The dependent Subject is typically the
{@link myphysicslab.lab.model.VarsList VarsList} that holds
the Variables corresponding to the positions of the objects. If the configuration
Parameter also sets the viewing rectangle, then the
{@link myphysicslab.lab.view.SimView SimView} might also a dependent Subject (an
example is {@link myphysicslab.sims.roller.RollerSingleApp RollerSingleApp} where
selecting a path changes the viewing rectangle).

When the configuration changes, the application must call {@link #update} to update
the remembered initial values of the dependent Subjects. Having this new set of initial
values makes it possible for the {@link #script} method to generate a
very short script like `PENDULUMS=4;` instead of setting all the Variables.

The {@link #script} method ensures that dependent Subjects are modified at the end of
the script, so that those changes are not overridden by a configuration Parameter.


<a id="easyscriptembeddedinurl"></a>
EasyScript Embedded in URL
--------------------------
To save a customized version of a simulation, or share it with someone else, use
{@link #scriptURL}. That method returns the URL of the current page along with a script
that sets Parameters to their current values.

The script follows a question mark in the URL, so it is called a 'query script' or
'query URL'. Here is an
[example](https://www.myphysicslab.com/engine2D/newtons-cradle-en.html?DAMPING=0.1;GRAVITY=16;PENDULUMS=4;PENDULUM_LENGTH=4;)

    https://www.myphysicslab.com/engine2D/newtons-cradle-en.html?DAMPING=0.1;
    GRAVITY=16;PENDULUMS=4;PENDULUM_LENGTH=4;

A user can save or share this custom URL. When the URL is pasted into a
browser, the scripts embedded in the URL will be executed.

While the above URL will work, some websites will not accept it as a valid
user-supplied URL. Therefore `scriptURL()`
[percent-encodes](https://en.wikipedia.org/wiki/Percent-encoding) many symbols to
ensure the URL is valid, see
[Terminal URL Query Script](myphysicslab.lab.util.Terminal.html#urlqueryscript).
Here is the
[fully encoded version of the above URL](https://www.myphysicslab.com/engine2D/newtons-cradle-en.html?DAMPING%3D0.1%3BGRAVITY%3D16%3BPENDULUMS%3D4%3BPENDULUM_LENGTH%3D4%3B),
where the symbols `=` and `;` are encoded with `%3D` and `%3B` respectively:

    https://www.myphysicslab.com/engine2D/newtons-cradle-en.html?DAMPING%3D0.1%3B
    GRAVITY%3D16%3BPENDULUMS%3D4%3BPENDULUM_LENGTH%3D4%3B

The application should call {@link Terminal#parseURL} in order to execute the query URL
during application startup.

* @implements {Parser}
*/
class EasyScriptParser {
/**
* @param {!Array<!Subject>} subjects list of Subject's to gather Parameters from.
* @param {!Array<!Subject>=} dependent those Subject's whose set of Parameters and
*    initial values can change depending on a "configuration" Parameter. Typically
*    this is the VarsList of a simulation.
*/
constructor(subjects, dependent) {
  EasyScriptParser.checkUniqueNames(subjects);
  /* The order of subjects can be significant when generating a script
  * because the Parameters are processed in the order of the Subjects in this list.
  * But if Parameters are independent then order should not matter.
  *
  * The set of Parameters can change over time; this is especially true for
  * dependent Subjects. To cope with a changing set of Parameters, we store only
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
  /** The set of dependent Subjects to examine (usually a VarsList).
  * @type {!Array<!Subject>}
  * @private
  */
  this.dependent_ = Array.isArray(dependent) ? dependent : [];
  /* Ensure that dependent Subjects are at the end of the list of Subjects.
  * Because when generating a script, we add commands in order of Subjects list
  * and "configuration Parameters" can change the dependent Subjects.
  */
  array.removeAllIf(this.subjects_, s => this.dependent_.includes(s), this);
  this.subjects_ = this.subjects_.concat(this.dependent_);
  /** Names and initial values of non-dependent Parameters. Used for making the script
  * shorter.
  * @type {!Array<string>}
  * @private
  */
  this.initialNonDependent_ = [];
  /** Names and initial values of dependent Parameters. Used for making the script
  * shorter.
  * @type {!Array<string>}
  * @private
  */
  this.initialDependent_ = [];
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
  * @type {!Array<function()>}
  * @private
  */
  this.commandFns_ = [];
  /**
  * @type {!Array<string>}
  * @private
  */
  this.commandHelp_ = [];
  this.addCommand('url', () => this.scriptURL(),
      'prints URL with script to recreate current state');
  this.addCommand('script', () => this.script(),
      'prints script to recreate current state');
  this.addCommand('values', () => Util.prettyPrint(this.values()),
      'shows available parameters and their current values');
  this.addCommand('names', () => Util.prettyPrint(this.names().join(';')),
      'shows available parameter names (format is SUBJECT.PARAMETER)');
  this.addCommand('help', () => this.help(),
      'prints this help text');
  this.update();
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', subjects_: ['
      + this.subjects_.map(s => s.toStringShort())
      +']}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' :
      'EasyScriptParser{subjects_.length: '+this.subjects_.length+'}';
};

/** @override */
addCommand(commandName, commandFnc, helpText) {
  this.commandNames_.push(commandName);
  this.commandFns_.push(commandFnc);
  this.commandHelp_.push(helpText);
};

/** Check that each Subject name is unique among this set of Subjects
* @param {!Array<!Subject>} subjects
* @private
*/
static checkUniqueNames(subjects) {
  /** @type !Array<string> */
  var names = [];
  subjects.forEach(subj => {
    var nm = subj.getName();
    if (names.includes(nm)) {
      throw 'duplicate Subject name: '+nm;
    };
    names.push(nm);
  });
};

/** Returns the Parameter corresponding to the given EasyScriptParser name such as
`X_Y_GRAPH_LINE.GRAPH_COLOR`. The name can consist of either just the name of a
Parameter (if unique among all Subjects) or be both Subject name and Parameter name
separated by a dot. This is used in Terminal scripts to find the Parameter, so that we
can call methods like `getValue()` or `setValue()` on the Parameter.
* @param {string} fullName name of Parameter, optionally preceded by name of Subject
*    and a dot
* @return {?Parameter} the Parameter corresponding to the given name, or `null` if
*    no Parameter found
* @throws {!Error} when only Parameter name is given, but multiple Subjects have that
*    Parameter.
*/
getParameter(fullName) {
  fullName = Util.toName(fullName);
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
    var count = array.count(this.allParamNames_,
        p => p == paramName);
    if (count > 1) {
      throw 'multiple Subjects have Parameter '+paramName;
    }
    idx = this.allParamNames_.indexOf(paramName);
  } else {
    idx = this.allSubjParamNames_.indexOf(fullName);
  }
  return idx > -1 ? this.allSubjects_[idx].getParameter(paramName) : null;
};

/** Returns the Subject with the given EasyScriptParser name.
* @param {string} name name of Subject
* @return {?Subject} the Subject corresponding to the given name, or `null` if
*    no Subject found
*/
getSubject(name) {
  var subjectName = Util.toName(name);
  return array.find(this.subjects_, s => s.getName() == subjectName);
};

/** Returns list of Subjects being parsed.
* @return {!Array<!Subject>} the list of Subjects being parsed
*/
getSubjects() {
  return Array.from(this.subjects_);
};

/** Returns the "help" string which gives information on available commands.
* @return {string} the "help" string which gives information on available commands.
*/
help() {
  var s = 'myPhysicsLab version '+ Util.VERSION + ', '
  s += (Util.ADVANCED ? 'advanced' : 'simple') + '-compiled on '
  s += Util.COMPILE_TIME+'.\n';
  s += 'Use the "values" command to see what can be set and the syntax.\n\n';
  s += 'command-K            clear Terminal window\n'
  s += 'arrow up/down        retrieve previous or next command\n'
  if (!Util.ADVANCED) {
    s += 'getParameter(name)   see "names" command, returns the named Parameter\n';
    s += 'getSubject(name)     see "names" command, returns the named Subject\n';
    s += 'propertiesOf(app)    shows properties of that object\n';
    s += 'methodsOf(app)       shows methods defined on that object\n';
    s += 'prettyPrint(app)     prints the object nicely\n';
    s += 'prettyPrint(app, 3)  prints the object, expanding 3 levels of sub-objects\n';
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
names() {
  return Array.from(this.allSubjParamNames_);
};

/** Returns a script which sets Parameters to their current values.
See {@link EasyScriptParser} for the syntax of the script.

Uses {@link Parameter#isComputed} to exclude Parameters
that are being automatically computed, unless `includeComputed` is `true`.

* @param {boolean} dependent `true` means return only Parameters belonging to the
*    set of dependent Subjects; `false` means return only non-dependent Parameters.
* @param {boolean=} includeComputed `true` means include Parameters that are
*    automatically computed; default is `false` which means filter out Parameters
*    that are automatically computed.
* @param {boolean=} fullName `true` means always return Subject and Parameter name;
*    default is `false` which means don't include Subject name when
*    Parameter name is unique.
* @return {string} a script which sets Parameters to their current values
* @private
*/
namesAndValues(dependent, includeComputed, fullName) {
  dependent = dependent == true;
  var allParams = this.allSubjects_.map((s, idx) =>
      s.getParameter(this.allParamNames_[idx]));
  var params = allParams;
  if (!includeComputed) {
    // filter out Parameters that are automatically computed
    params = array.filter(params, p => !p.isComputed());
  }
  // Keep only Parameters of dependent or non-dependent Subjects as requested.
  params = array.filter(params,
      p => this.dependent_.includes(p.getSubject()) == dependent, this);
  var re = /^[a-zA-Z0-9_]+$/;
  var s = params.map(p => {
      var paramName = Util.toName(p.getName());
      var idx = allParams.indexOf(p);
      var v = p.getValue();
      if (typeof v === 'string' && !re.test(v)) {
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
    });
  return s.length > 0 ? s.join(';') + ';' : '';
};

/** @override */
parse(script) {
  // remove trailing semicolon
  if (script.slice(-1) == ';') {
    script = script.slice(0, script.length-1);
  }
  // if script is single-word command names, then execute that command function
  for (var i=0, len=this.commandNames_.length; i<len; i++) {
    if (script.toLowerCase() == this.commandNames_[i]) {
      // Returning 'undefined' means 'did not recognize', therefore we must return
      // a value other than 'undefined' here.
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

/** @override */
saveStart() {
  this.initialNonDependent_ = this.namesAndValues(false).split(';');
  this.initialDependent_ = this.namesAndValues(true).split(';');
};

/** Returns a script which sets Parameters to their current values.
*
* To keep the length of the script as short as possible
*
* + this ignores Parameters that are automatically computed, see
*    {@link Parameter#isComputed}.
*
* + this ignores Parameters whose value is unchanged since {@link #saveStart}
*    was called (or for a dependent Subject, since {@link #update} was called).
*
* + when a Parameter name is unique, we don't include the Subject name.
*
* @return {string} script that sets Parameters to current values
*/
script() {
  var ar = this.namesAndValues(false).split(';');
  ar = ar.concat(this.namesAndValues(true).split(';'));
  var initSettings = array.concat(this.initialNonDependent_,
      this.initialDependent_);
  // strip out any settings that are identical to initial settings
  array.removeAllIf(ar, s => initSettings.includes(s));
  return ar.join(';')+(ar.length > 0 ? ';' : '');
};

/** Returns a URL for the current page along with query script to set Parameters to
* their current values. The *query* part of the URL is the part following the
* question mark. When pasted into a browser, the {@link Terminal#parseURL}
* method can be used to extract the script from the URL query and execute it.
* The script is [percent-encoded](https://en.wikipedia.org/wiki/Percent-encoding)
* to ensure it forms a valid URL.
*
* See {@link #script} for details about how the script is created.
* @return {string} percent-encoded URL query script that sets Parameters to current
*    values
*/
scriptURL() {
  // get the current URL, but remove any URL query (= text after the '?' in URL)
  var u = window.location.href.replace(/\.html\?.*$/, '.html');
  // Add commands as a URL query, after '?'.
  return u + '?' + Terminal.encodeURIComponent(this.script());
};

/** Removes quotes from start and end of a string, and replaces
[single character escape sequences](https://mathiasbynens.be/notes/javascript-escapes)
with the corresponding character.
* @param {string} text
* @return {string}
*/
static unquote(text) {
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
* initial settings of any ["dependent" Subject's](#dependentsubjects) Parameters.
*
* This is different from {@link #saveStart} in two ways:
* 1. this updates initial values only for dependent Subjects.
* 2. this updates the remembered list of available Parameter names.
*
* @return {undefined}
*/
update() {
  var params = array.reduce(this.subjects_,
      function(/** !Array<!Parameter>*/result, subj) {
        // filter out params with name 'DELETED'
        var s_params = array.filter(subj.getParameters(),
            p => p.getName() != 'DELETED');
        return result.concat(s_params);
      }, []);

  this.allSubjects_ = params.map(p => p.getSubject());

  this.allParamNames_ = params.map(p => Util.toName(p.getName()));

  this.allSubjParamNames_ = params.map(
      p => Util.toName(p.getSubject().getName()+'.'+p.getName()));

  this.unique_ = this.allParamNames_.map(
      p => 1 == array.count(this.allParamNames_, q => q == p) );

  this.initialDependent_ = this.namesAndValues(true).split(';');
};

/** Returns the set of Parameter names that can be set by this EasyScriptParser, and
* their current values. Each Parameter name is preceded by the name of its Subject and
* a dot.
* @return {string} the set of Parameter names that can be
*    set by this EasyScriptParser and their current values
*/
values() {
  return this.namesAndValues(false, true, true) + this.namesAndValues(true, true, true);
};
} // end class

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
  PROMPT_URL: 'Drücken Sie command-C um diesen URL in die Zwischenablage zu kopieren, dies beinhaltet die eingegebenen Parameter.',
  WARN_URL_2048: 'Achtung: URL is länger als 2048 Zeichen.'
};

/** Set of internationalized strings.
@type {EasyScriptParser.i18n_strings}
*/
EasyScriptParser.i18n = goog.LOCALE === 'de' ?
    EasyScriptParser.de_strings :
    EasyScriptParser.en;

exports = EasyScriptParser;
