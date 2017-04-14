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

goog.provide('myphysicslab.sims.roller.PathSelector');

goog.require('goog.array');
goog.require('myphysicslab.lab.model.NumericalPath');
goog.require('myphysicslab.lab.model.ParametricPath');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.sims.roller.HasPath');

goog.scope(function() {

var AbstractSubject = myphysicslab.lab.util.AbstractSubject;
var NF = myphysicslab.lab.util.UtilityCore.NF;
var NumericalPath = myphysicslab.lab.model.NumericalPath;
var ParameterString = myphysicslab.lab.util.ParameterString;
var ParametricPath = myphysicslab.lab.model.ParametricPath;
var HasPath = myphysicslab.sims.roller.HasPath;
var UtilityCore = myphysicslab.lab.util.UtilityCore;

/** Provides a HasPath (such as roller coaster simulation) with a choice of several
paths. Defines a ParameterString that has the set of available ParametricPaths as
choices.

{@link #getPathName} returns name of current path. {@link #setPathName} sets the current
path to be the path with the given name from among the set of paths that are specified
to the constructor.

### Parameters Created

+ ParameterString named `PATH`, see {@link #setPathName}.

* @param {!myphysicslab.sims.roller.HasPath} hasPath
* @param {!Array<!ParametricPath>} paths  the set of paths to offer
* @constructor
* @final
* @struct
* @extends {AbstractSubject}
*/
myphysicslab.sims.roller.PathSelector = function(hasPath, paths) {
  AbstractSubject.call(this, 'PATH_SELECTOR');
  /**
  * @type {!myphysicslab.sims.roller.HasPath}
  * @private
  */
  this.hasPath_ = hasPath;
  /**
  * @type {!Array<!myphysicslab.lab.model.ParametricPath>}
  * @private
  */
  this.paths_ = paths;
  var path = this.hasPath_.getPath();
  /**
  * @type {string}
  * @private
  */
  this.pathName_ = path != null ? path.getName() : '';
  // make array of path name strings for the PATH parameter
  var names = goog.array.map(paths, function(p) { return p.getName(); });
  var localNames = goog.array.map(paths, function(p) {
      return p.getName(/*localized=*/true);
  });
  var ps = new ParameterString(this, PathSelector.en.PATH, PathSelector.i18n.PATH,
      goog.bind(this.getPathName, this), goog.bind(this.setPathName, this), localNames, names);
  // the input function allows passing in lowercase path names.
  //ps.setInputFunction(UtilityCore.toName);
  this.addParameter(ps);
};
var PathSelector = myphysicslab.sims.roller.PathSelector;
goog.inherits(PathSelector, AbstractSubject);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  PathSelector.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', pathName: '+this.pathName_
        +', paths: ['
        + goog.array.map(this.paths_, function(p) {return p.getName();})
        + ']' + PathSelector.superClass_.toString.call(this);
  };

  /** @inheritDoc */
  PathSelector.prototype.toStringShort = function() {
    return PathSelector.superClass_.toStringShort.call(this).slice(0, -1)
        +', hasPath: '+this.hasPath_.toStringShort() +'}';
  };
};

/** @inheritDoc */
PathSelector.prototype.getClassName = function() {
  return 'PathSelector';
};

/** Returns name of current path.
* @return {string} name of current path.
*/
PathSelector.prototype.getPathName = function() {
  return this.pathName_;
};

/** Sets the current path.
* @param {string} value  name of desired path
*/
PathSelector.prototype.setPathName = function(value) {
  value = UtilityCore.toName(value);
  if (value != this.pathName_) {
    for (var i=0, len=this.paths_.length; i<len; i++) {
      var path = this.paths_[i];
      if (path.nameEquals(value)) {
        this.hasPath_.setPath(new NumericalPath(path));
        this.pathName_ = path.getName();
        this.broadcastParameter(PathSelector.en.PATH);
        return;
      }
    }
    throw new Error('unknown path '+value);
  };
};

/** Recalculates the current path, in case the equation of the path
has changed, or the start and finish parameter values have changed.
* @return {undefined}
*/
PathSelector.prototype.update = function() {
  for (var i=0, len=this.paths_.length; i<len; i++) {
    var path = this.paths_[i];
    if (path.nameEquals(this.pathName_)) {
      this.hasPath_.setPath(new NumericalPath(path));
      this.broadcastParameter(PathSelector.en.PATH);
      return;
    }
  }
  throw new Error('unknown path '+this.pathName_);
};

/** Set of internationalized strings.
@typedef {{
  PATH: string
  }}
*/
PathSelector.i18n_strings;

/**
@type {PathSelector.i18n_strings}
*/
PathSelector.en = {
  PATH: 'path'
};

/**
@private
@type {PathSelector.i18n_strings}
*/
PathSelector.de_strings = {
  PATH: 'Pfad'
};

/** Set of internationalized strings.
@type {PathSelector.i18n_strings}
*/
PathSelector.i18n = goog.LOCALE === 'de' ? PathSelector.de_strings :
    PathSelector.en;

}); // goog.scope
