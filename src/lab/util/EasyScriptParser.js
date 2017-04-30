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
goog.require('myphysicslab.lab.util.UtilityCore');

goog.scope(function() {

var Parameter = myphysicslab.lab.util.Parameter;
var Subject = myphysicslab.lab.util.Subject;
var SubjectEvent = myphysicslab.lab.util.SubjectEvent;
var Terminal = myphysicslab.lab.util.Terminal;
var UtilityCore = myphysicslab.lab.util.UtilityCore;

/** Parses simple "EasyScript" scripts which get or set values of {@link Parameter}s
for a specified set of {@link Subject}s. Also executes some single word commands such
as `help`.

The {@link #script} method creates a script which replicates all the current Parameter
settings of all the specified Subjects.

The scripts can be executed by entering them in the {@link Terminal} command line
interface, which passes them to EasyScriptParser. They can also be executed with
Terminal functions such as `eval` and `parseURL`.

An application will set up EasyScriptParser to know about its dozen or so important
Subjects. EasyScriptParser interrogates all the Subjects to find what settable
Parameters they contain and their current values.

See [Subject-Observer Pesign Pattern](Architecture.html#subjectobserverparameter) for
background information about Parameters and Subjects.


EasyScript Syntax
-------------------

The 'getter' syntax is

    [SubjectName.]ParameterName[;]

The 'setter' syntax is

    [SubjectName.]ParameterName=value[;]

where square brackets indicate optional elements. Multiple scripts can be on one line
separated by a semicolon.

With both setter and getter syntax the value of the Parameter is available via
{@link #getResult} after the script is parsed or in the `result` variable of
{@link Terminal}.

+ `SubjectName` is the language-independent name returned by
{@link Subject#getName}. It is optional when `ParameterName` is unique among all
Subjects. It is required when multiple Subjects have the same Parameter name.

+ `ParameterName` is the language-independent name returned by
{@link SubjectEvent#getName}. (Note that Parameter extends SubjectEvent).

+ `value` is a string that is given as input to {@link Parameter#setFromString}. The
string can be optionally surrounded with quotes like a JavaScript string in which case
the quotes are removed and backslash escaped characters (quote, newline, tab, etc.) are
replaced. If not surrounded with quotes then the string ends at the semicolon or end of
line.

The English language version of Parameter or Subject names can also be given, they are
converted to the language-independent form using {@link UtilityCore#toName}. Leading
and trailing spaces are trimmed from names and (unquoted) values.


EasyScript Embedded in URL
--------------------------

To share a customized simulation with someone else, the {@link #scriptURL} method gives
the URL of the current page along with a script that sets Parameters to their current
values. The script follows a question mark in the URL, so it is called a 'query script'
or 'query URL'. Here is an example:

    http://www.myphysicslab.com/PendulumApp_en.html?DRIVE_AMPLITUDE=0;
    DAMPING=0.1;GRAVITY=9.8;ANGLE=2.5;ANGLE_VELOCITY=0;

A user can then send this custom URL to someone else, and when that other user enters
the URL into a browser, the scripts embedded in the URL will be executed if
{@link Terminal#parseURL} is called at startup that app, assuming that EasyScriptParser
has been installed via {@link Terminal#setParser}.

The method {@link #script} returns just the script without the URL. This can be useful
when creating a script to save with the {@link Terminal#remember} command, or to put in
an HTML file, or paste into Terminal


Volatile Subjects
-----------------

Summary: The *initial settings* for Parameters of *volatile Subjects* are recalculated
whenever {@link #update} is called (which indicates that the configuration has
changed). This results in a shorter script when specifying a different configuration at
time zero.

Many applications have multiple configurations that the user can choose between. For
example, in the {@link myphysicslab.sim.engine2D.NewtonsCradle Newtons Cradle}
simulation you can choose the number of pendulums. Each configuration has an associated
set of initial conditions stored in the variables that define the state of the
simulation.

To make the URL script as short as possible, we recalculate the set of initial
conditions after selecting a new configuration. The configuration should itself be
controlled by a Parameter, for example `NewtonsCradleApp.en.NUM_BODIES`. If the
URL script specifies the configuration Parameter then we can assume the initial
conditions for that configuration are in place.

This is accomplished by specifying a set of 'volatile' Subjects as an argument to the
constructor. The {@link myphysicslab.lab.model.VarsList} is the most common volatile
Subject, but there can be others as well. These are treated differently in that
we recalculate the initial settings for Parameters of volatile Subjects during the
{@link #update} method, which should be called whenever the configuration changes.
(Note that Variables are also Parameters).

Other than recalculating the initial settings more frequently, the volatile Subjects
are treated the same as other Subjects.


Technical Notes
---------------
The set of Parameters can change over time; this is especially true for Variables which
are a type of Parameter. It is common for the `engine2D` physics engine apps (which use
{@link myphysicslab.lab.engine2D.ContactSim}) to have a `config()` method which changes
the set of rigid bodies and therefore the set of Variables.

To cope with a changing set of Parameters, we store only Parameter names, not
references to actual Parameters. We store a parallel list of Subjects, so we can get
the actual Parameter by asking the Subject for a Parameter with that name. This allows
for the Parameter to be a different object, but as long as it has the same name and
belongs to the same Subject we can find the Parameter and set or get it's value.


Single Word Commands
--------------------

A small set of single word commands are recognized by EasyScriptParser, for example
`help`.  The `help` command lists the available single word commands.
Use {@link #addCommand} to add a single word command.



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
  /** Initial names and values of non-volatile Parameters. Used for making the script
  * shorter.
  * @type {!Array<string>}
  * @private
  */
  this.initialNonVolatile_ = [];
  /** Initial names and values of volatile Parameters. Used for making the script
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
        return UtilityCore.prettyPrint(this.values());
      }, this), 'shows available parameters and their current values');
  this.addCommand('names', goog.bind(function() {
        return UtilityCore.prettyPrint(this.names().join(';'));
      }, this), 'shows available parameter names');
  this.addCommand('help', goog.bind(function() {
        return this.help();
      }, this), 'prints this help text');
  this.update();
};
var EasyScriptParser = myphysicslab.lab.util.EasyScriptParser;

if (!UtilityCore.ADVANCED) {
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

/**
* @return {string}
*/
EasyScriptParser.prototype.help = function() {
  var s = 'myPhysicsLab version '+ UtilityCore.VERSION + ', '
  s += (UtilityCore.ADVANCED ? 'advanced' : 'simple') + '-compiled.\n';
  s += 'Use the "values" command to see what can be set and the syntax.\n\n';
  s += 'command-K            clear Terminal window\n'
  s += 'arrow up/down        retrieve previous or next command\n'
  if (!UtilityCore.ADVANCED) {
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

/** Returns the set of Parameter names that can be set by this EasyScriptParser; each
Parameter name is preceded by the name of its Subject and a dot.
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
        var paramName = UtilityCore.toName(p.getName());
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
          var subjName = UtilityCore.toName(p.getSubject().getName());
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
  for (var i=0, len=this.commandNames_.length; i<len; i++) {
    if (script.toLowerCase() == this.commandNames_[i]) {
      return this.commandFns_[i]();
    }
  }
  var a = script.split('=');
  // fullName can be 'SUBJECT_NAME.PARAM_NAME' or just 'PARAM_NAME'
  var fullName = UtilityCore.toName(a[0].trim());
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

/** Returns a script to set Parameters to the current value. The script
* can be executed via {@link Terminal#eval}.
*
* To keep the length of the script as short as possible (and not set irrelevant
* Parameters):
*
* 1. This ignores Parameters that are automatically computed, see
*    {@link Parameter#isComputed}.
*
* 2. This ignores Parameters whose value is unchanged since {@link #saveStart}
*    was called.
*
* 3. When a Parameter name is unique, we don't include the Subject name.
*
* This avoids, for example, setting the Parameters for the size of a graph's SimView
* when the SimView is under control of an AutoScale. This is important because
* setting any of those Parameters will turn off the AutoScale.
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

/** Removes quotes from start and end of a string.
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
            case '0': r += '\0'; break;
            case 'b': r += '\b'; break;
            case 't': r += '\t'; break;
            case 'n': r += '\n'; break;
            case 'v': r += '\v'; break;
            case 'f': r += '\f'; break;
            case 'r': r += '\r'; break;
            case '"': r += '"'; break;
            case '\'': r += '\''; break;
            case '\\': r += '\\'; break;
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
* initial settings of any 'volatile' Subject's Parameters. Call this when the
* set of Parameters has changed.
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
      function(p) { return UtilityCore.toName(p.getName()); });

  this.allSubjParamNames_ = goog.array.map(params,
      function(p) {
        return UtilityCore.toName(p.getSubject().getName()+'.'+p.getName());
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
