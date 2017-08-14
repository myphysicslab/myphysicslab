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

goog.provide('myphysicslab.lab.model.VarsList');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('myphysicslab.lab.model.ConcreteVariable');
goog.require('myphysicslab.lab.model.Variable');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.GenericEvent');
goog.require('myphysicslab.lab.util.Parameter');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.Util');

goog.scope(function() {

var AbstractSubject = myphysicslab.lab.util.AbstractSubject;
var ConcreteVariable = myphysicslab.lab.model.ConcreteVariable;
var GenericEvent = myphysicslab.lab.util.GenericEvent;
var NF = myphysicslab.lab.util.Util.NF;
var NF5 = myphysicslab.lab.util.Util.NF5;
var NF5E = myphysicslab.lab.util.Util.NF5E;
var Parameter = myphysicslab.lab.util.Parameter;
var SpecialVariable = myphysicslab.lab.model.SpecialVariable;
var Subject = myphysicslab.lab.util.Subject;
var Util = myphysicslab.lab.util.Util;
var Variable = myphysicslab.lab.model.Variable;

/** A set of {@link Variable}s which represent the current state of a simulation.
Variables are numbered from `0` to `n-1` where `n` is the number of Variables.

VarsList is a {@link Subject} and each Variable is a {@link Parameter} of the VarsList.
This makes the set of Variables available for scripting with
{@link myphysicslab.lab.util.EasyScriptParser}.

Unlike other Subject classes, VarsList does not broadcast each Variable whenever the
Variable changes. And VarsList prohibits adding general Parameters in its
{@link #addParameter} method, because it can only contain Variables.

As a Subject, the VarsList will broadcast the {@link #VARS_MODIFIED} event to its
Observers whenever Variables are added or removed.


### Continuous vs. Discontinuous Changes

A change to a Variable is either continuous or discontinuous. This affects how a line
graph of the Variable is drawn: {@link myphysicslab.lab.graph.DisplayGraph}
doesn't draw a line at a point of discontinuity. A discontinuity is
indicated by incrementing the {@link Variable#getSequence sequence number} of the Variable.

It is important to note that {@link #setValue} and {@link #setValues} have an optional
parameter `continuous` which determines whether the change of variable is continuous or
discontinuous.

Here are some guidelines about when a change in a variable should be marked as being
discontinuous by incrementing the sequence number:

1. When a change increments only a few variables, be sure to increment any variables
that are **dependent** on those variables. For example, if velocity of an object is
discontinuously changed, then the kinetic, potential and total energy should all be
marked as discontinuous.

2. When **dragging** an object, don't increment variables of other objects.

3. When some **parameter** such as gravity or mass changes, increment any derived
variables (like energy) that depend on that parameter.


## Deleted Variables

When a variable is no longer used it has the reserved name 'DELETED'. Any such variable
should be ignored.  This allows variables to be added or removed without affecting the
index of other existing variables.


### Events Broadcast

+ GenericEvent name {@link VarsList.VARS_MODIFIED}

* @param {!Array<string>} varNames  array of language-independent variable names;
     these will be underscorized so the English names can be passed in here.
     See {@link Util#toName}.
* @param {!Array<string>} localNames  array of localized variable names
* @param {string=} opt_name name of this VarsList
* @constructor
* @final
* @struct
* @extends {AbstractSubject}
* @throws {!Error} if varNames and localNames are different lengths, or contain
*     anything other than strings, or have duplicate values
*/
myphysicslab.lab.model.VarsList = function(varNames, localNames, opt_name) {
  var name = goog.isDef(opt_name) ? opt_name : 'VARIABLES';
  AbstractSubject.call(this, name);
  /**  Index of time variable, or -1 if there is no time variable.
  * @type {number}
  * @private
  */
  this.timeIdx_ = -1;
  if (varNames.length != localNames.length) {
    throw new Error('varNames and localNames are different lengths');
  }
  for (var i = 0, n=varNames.length; i<n; i++) {
    var s = varNames[i];
    if (!goog.isString(s)) {
      throw new Error('variable name '+s+' is not a string i='+i);
    }
    s = Util.validName(Util.toName(s));
    varNames[i] = s;
    // find index of the time variable.
    if (s == VarsList.TIME) {
      this.timeIdx_ = i;
    }
  }
  if (!Util.uniqueElements(varNames)) {
    throw new Error('duplicate variable names');
  }
  /**
  * @type {!Array<!Variable>}
  * @private
  */
  this.varList_ = [];
  for (i = 0, n=varNames.length; i<n; i++) {
    this.varList_.push(new ConcreteVariable(this, varNames[i], localNames[i]));
  }
  /** Whether to save simulation state history.
  * @type {boolean}
  * @private
  */
  this.history_ = Util.DEBUG;
  /** Recent history of the simulation state for debugging;  an array of copies
  * of the vars array.
  * @type {!Array<!Array<number>>}
  * @private
  */
  this.histArray_ = [];
};
var VarsList = myphysicslab.lab.model.VarsList;
goog.inherits(VarsList, AbstractSubject);

if (!Util.ADVANCED) {
  /** @inheritDoc */
  VarsList.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', timeIdx_: '+this.timeIdx_
        +', history_: '+this.history_
        + ', ' + goog.array.map(this.varList_, function(v, idx) {
            return '('+idx+') '+ v.getName()+': '+NF5E(v.getValue()); })
        + VarsList.superClass_.toString.call(this);
  };

  /** @inheritDoc */
  VarsList.prototype.toStringShort = function() {
    var s = VarsList.superClass_.toStringShort.call(this);
    return s.slice(0, -1) +', numVars: '+this.varList_.length+'}';
  };
};

/** @inheritDoc */
VarsList.prototype.getClassName = function() {
  return 'VarsList';
};

/** @inheritDoc */
VarsList.prototype.addParameter = function(parameter) {
  throw new Error('addParameter not allowed on VarsList');
};

/** Add a Variable to this VarsList.
@param {!Variable} variable the Variable to add
@return {number} the index number of the variable
@throws {!Error} if name if the Variable is 'DELETED'
*/
VarsList.prototype.addVariable = function(variable) {
  var name = variable.getName();
  if (name == VarsList.DELETED) {
    throw new Error('variable cannot be named "'+VarsList.DELETED+'"');
  }
  // add variable to first open slot
  var position = this.findOpenSlot_(1);
  this.varList_[position] = variable;
  if (name == VarsList.TIME) {
    // auto-detect time variable
    this.timeIdx_ = position;
  }
  this.broadcast(new GenericEvent(this, VarsList.VARS_MODIFIED));
  return position;
}

/** Add a continguous block of ConcreteVariables.
@param {!Array<string>} names language-independent names of variables; these will be
     underscorized so the English name can be passed in here.
     See {@link Util#toName}.
@param {!Array<string>} localNames localized names of variables
@return {number} index index of first Variable that was added
@throws {!Error} if any of the variable names is 'DELETED', or array of names is empty
*/
VarsList.prototype.addVariables = function(names, localNames) {
  var howMany = names.length;
  if (howMany == 0) {
    throw new Error();
  }
  if (names.length != localNames.length) {
    throw new Error('names and localNames are different lengths');
  }
  var position = this.findOpenSlot_(howMany);
  for (var i=0; i<howMany; i++) {
    var name = Util.validName(Util.toName(names[i]));
    if (name == VarsList.DELETED) {
      throw new Error("variable cannot be named ''+VarsList.DELETED+''");
    }
    var idx = position+i;
    this.varList_[idx] = new ConcreteVariable(this, name, localNames[i]);
    if (name == VarsList.TIME) {
      // auto-detect time variable
      this.timeIdx_ = idx;
    }
  }
  this.broadcast(new GenericEvent(this, VarsList.VARS_MODIFIED));
  return position;
};

/**
* @param {number} index
* @private
*/
VarsList.prototype.checkIndex_ = function(index) {
  if (index < 0 || index >= this.varList_.length) {
    throw new Error('bad variable index='+index+'; numVars='+this.varList_.length);
  }
};

/** Delete several variables, but leaves those places in the array as empty spots that
can be allocated in future with {@link #addVariables}. Until an empty spot is
reallocated, the name of the variable at that spot has the reserved name 'DELETED' and
should not be used.
@param {number} index index of first variable to delete
@param {number} howMany number of variables to delete
*/
VarsList.prototype.deleteVariables = function(index, howMany) {
  if (howMany == 0) {
    return;
  }
  if (howMany < 0 || index < 0 || index+howMany > this.varList_.length) {
    throw new Error('deleteVariables');
  }
  for (var i=index; i<index+howMany; i++) {
    this.varList_[i] = new ConcreteVariable(this, VarsList.DELETED,
        VarsList.DELETED);
  }
  this.broadcast(new GenericEvent(this, VarsList.VARS_MODIFIED));
};

/** Returns index to put a contiguous group of variables.  Expands the set of variables
if necessary.
@param {number} quantity number of contiguous variables to allocate
@return {number} index of first variable
@private
*/
VarsList.prototype.findOpenSlot_ = function(quantity) {
  if (quantity < 0) {
    throw new Error();
  }
  var found = 0;
  var startIdx = -1;
  for (var i=0, n=this.varList_.length; i<n; i++) {
    if (this.varList_[i].getName() == VarsList.DELETED) {
      if (startIdx == -1) {
        startIdx = i;
      }
      found++;
      if (found >= quantity) {
        return startIdx;
      }
    } else {
      startIdx = -1;
      found = 0;
    }
  }
  var expand;
  if (found > 0) {
    // Found a group of deleted variables at end of VarsList, but need more.
    // Expand to get full quantity.
    expand = quantity - found;
    goog.asserts.assert(startIdx >= 0);
    goog.asserts.assert(expand > 0);
  } else {
    // Did not find contiguous group of deleted variables of requested size.
    // Add space at end of current variables.
    startIdx = this.varList_.length;
    expand = quantity;
  }
  for (i=0; i<expand; i++) {
    this.varList_.push(new ConcreteVariable(this, VarsList.DELETED, VarsList.DELETED));
  }
  return startIdx;
};

/** Whether recent history is being stored, see {@link #saveHistory}.
@return {boolean} true if recent history is being stored
*/
VarsList.prototype.getHistory = function() {
  return this.history_;
};

/** @inheritDoc */
VarsList.prototype.getParameter = function(name) {
  name = Util.toName(name);
  var p = goog.array.find(this.varList_, function(p) {
    return p.getName() == name;
  });
  if (p != null) {
    return p;
  }
  throw new Error('Parameter not found '+name);
};

/** @inheritDoc */
VarsList.prototype.getParameters = function() {
  return goog.array.clone(this.varList_);
};

/** Returns the value of the time variable, or throws an exception if there is no time
variable.

There are no explicit units for the time, so you can regard a time unit as any length
of time, as long as it is consistent with other units.
See [About Units Of Measurement](Architecture.html#aboutunitsofmeasurement).
@return {number} the current simulation time
@throws {!Error} if there is no time variable
*/
VarsList.prototype.getTime = function() {
  if (this.timeIdx_ < 0) {
    throw new Error('no time variable');
  }
  return this.getValue(this.timeIdx_);
};

/** Returns the current value of the variable with the given index.
@param {number} index the index of the variable of interest
@return {number} the current value of the variable of interest
*/
VarsList.prototype.getValue = function(index) {
  this.checkIndex_(index);
  return this.varList_[index].getValue();
};

/** Returns an array with the current value of each variable.
@return {!Array<number>} an array with the current value of each variable
*/
VarsList.prototype.getValues = function() {
  return goog.array.map(this.varList_, function(v) { return v.getValue(); });
};

/** Returns the Variable object at the given index or with the given name
@param {number|string} id the index or name of the variable; the name can be the
    English or language independent version of the name
@return {!Variable} the Variable object at the given index or with the given name
*/
VarsList.prototype.getVariable = function(id) {
  var index;
  if (goog.isNumber(id)) {
    index = id;
  } else if (goog.isString(id)) {
    id = Util.toName(id);
    index = goog.array.findIndex(this.varList_,
        function(v) { return v.getName() == id; });
    if (index < 0) {
      throw new Error('unknown variable name '+id);
    }
  } else {
    throw new Error();
  }
  this.checkIndex_(index);
  return this.varList_[index];
};

/** Increments the sequence number for the specified variable(s), which indicates a
discontinuity has occurred in the value of this variable. This information is used in a
graph to prevent drawing a line between points that have a discontinuity. See
{@link Variable#getSequence}.
@param {...number} indexes  the indexes of the variables;
    if no index given then all variable's sequence numbers are incremented
*/
VarsList.prototype.incrSequence = function(indexes) {
  if (arguments.length == 0) {
    // increment sequence number on all variables
    for (var i=0, n=this.varList_.length; i<n; i++) {
      this.varList_[i].incrSequence();
    }
  } else {
    // increment sequence number only on specified variables
    for (i = 0, n=arguments.length; i < n; i++) {
      var idx = arguments[i];
      this.checkIndex_(idx);
      this.varList_[idx].incrSequence();
    }
  }
};

/** Returns the number of variables available. This includes any deleted
variables (which are not being used and should be ignored).
@return {number} the number of variables in this VarsList
*/
VarsList.prototype.numVariables = function() {
  return this.varList_.length;
};

/** Prints one set of history variables.
@param {number} idx the index of the snapshot to print, where 1 is most recent;
@return {string}
@private
*/
VarsList.prototype.printOneHistory = function (idx) {
  var r = '';
  if (this.history_ && idx <= this.histArray_.length) {
    var v = this.histArray_[this.histArray_.length - idx];
    r = '//time = '+NF5(v[v.length-1]);
    for (var i=0, len=v.length-1; i<len; i++) {
      r += '\nsim.getVarsList().setValue('+i+', '+v[i]+');';
    }
  }
  return r;
};

/** Prints recent 'history' set of variables to console for debugging.
Prints the `n`-th oldest snapshot, where `n=1` is the most recent snapshot, `n=2` is
the snapshot previous to the most recent, etc. See {@link #saveHistory}.
@param {number=} index the index of the snapshot to print, where 1 is most recent;
    if no index is specified, then prints a selected set of recent histories.
@return {string} the history variables formatted as code to recreate the situation
*/
VarsList.prototype.printHistory = function(index) {
  if (goog.isNumber(index)) {
    return this.printOneHistory(index);
  } else {
    var r = this.printOneHistory(10);
    r += '\n' + this.printOneHistory(3);
    r += '\n' + this.printOneHistory(2);
    r += '\n' + this.printOneHistory(1);
    return r;
  }
};

/** Saves the current variables in a 'history' set, for debugging, to be able to
reproduce an error condition. See {@link #printHistory}.
@return {undefined}
*/
VarsList.prototype.saveHistory = function() {
  if (this.history_) {
    var v = this.getValues();
    v.push(this.getTime());
    this.histArray_.push(v); // adds element to end of histArray_
    if (this.histArray_.length>20) {
      // to prevent filling memory, only keep recent history entries
      this.histArray_.shift(); // removes element at histArray_[0]
    }
  }
};

/** Indicates the specified Variables are being automatically computed.
See {@link Parameter#isComputed}.
@param {...number} indexes  the indexes of the variables
*/
VarsList.prototype.setComputed = function(indexes) {
  for (var i = 0, n=arguments.length; i < n; i++) {
    var idx = arguments[i];
    this.checkIndex_(idx);
    this.varList_[idx].setComputed(true);
  }
};

/** Sets whether to store recent history, see {@link #saveHistory}.
@param {boolean} value true means recent history should be stored
*/
VarsList.prototype.setHistory = function(value) {
  this.history_ = value;
};

/** Sets the current simulation time.  There are no explicit units for the time, so
you can regard a time unit as seconds or years as desired. See [About Units Of
Measurement](Architecture.html#aboutunitsofmeasurement).
@param {number} time the current simulation time.
@throws {!Error} if there is no time variable
*/
VarsList.prototype.setTime = function(time) {
  this.setValue(this.timeIdx_, time);
};

/** Sets the specified variable to the given value. Variables are numbered starting at
zero. Assumes this is a discontinous change, so the sequence number is incremented
unless you specify that this is a continuous change in the variable.
See {@link #incrSequence}.
@param {number} index  the index of the variable within the array of variables
@param {number} value  the value to set the variable to
@param {boolean=} continuous `true` means this new value is continuous with
    previous values; `false` (the default) means the new value is discontinuous with
    previous values, so the sequence number for the variable is incremented
@throws {!Error} if value is `NaN`
*/
VarsList.prototype.setValue = function(index, value, continuous) {
  this.checkIndex_(index);
  var variable = this.varList_[index];
  if (isNaN(value)) {
    throw new Error('cannot set variable '+variable.getName()+' to NaN');
  }
  if (continuous) {
    variable.setValueSmooth(value);
  } else {
    variable.setValue(value);
  }
};

/** Sets the value of each variable from the given list of values. When the length of
`vars` is less than length of VarsList then the remaining variables are not modified.
Assumes this is a discontinous change, so the sequence number is incremented
unless you specify that this is a continuous change in the variable.
See {@link #incrSequence}.
@param {!Array<number>} vars array of state variables
@param {boolean=} continuous `true` means this new value is continuous with
    previous values; `false` (the default) means the new value is discontinuous with
    previous values, so the sequence number for the variable is incremented
@throws {!Error} if length of `vars` exceeds length of VarsList
*/
VarsList.prototype.setValues = function(vars, continuous) {
  // NOTE: vars.length can be less than this.varList_.length
  var N = this.varList_.length;
  var n = vars.length;
  if (n > N) {
    throw new Error('setValues bad length n='+n+' > N='+N);
  }
  for (var i=0; i<N; i++) {
    if (i < n) {
      this.setValue(i, vars[i], continuous);
    }
  }
};

/** Returns the index of the time variable, or -1 if there is no time variable.
@return {number} the index of the time variable, or -1 if there is no time variable
*/
VarsList.prototype.timeIndex = function() {
  return this.timeIdx_;
};

/** Returns the set of Variable objects in this VarsList, in their correct
ordering.
@return {!Array<!Variable>} the set of Variable objects in this VarsList,
    in their correct ordering.
*/
VarsList.prototype.toArray = function() {
  return goog.array.clone(this.varList_);
};

/** Name of event signifying that the set of variables has been modified: variables may
have been added or removed, or the name of variables changed.
@type {string}
@const
*/
VarsList.VARS_MODIFIED = 'VARS_MODIFIED';

/** If a variable name is 'DELETED' then that variable is not in use and should be
ignored.
* @type {string}
* @const
*/
VarsList.DELETED = 'DELETED';

/** Language-independent name of time variable.
* @type {string}
* @const
*/
VarsList.TIME = 'TIME';


/** Set of internationalized strings.
@typedef {{
  TIME: string
  }}
*/
VarsList.i18n_strings;

/**
@type {VarsList.i18n_strings}
*/
VarsList.en = {
  TIME: 'time'
};

/**
@private
@type {VarsList.i18n_strings}
*/
VarsList.de_strings = {
  TIME: 'Zeit'
};

/** Set of internationalized strings.
@type {VarsList.i18n_strings}
*/
VarsList.i18n = goog.LOCALE === 'de' ? VarsList.de_strings :
    VarsList.en;

}); // goog.scope
