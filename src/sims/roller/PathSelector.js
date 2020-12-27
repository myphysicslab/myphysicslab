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

goog.module('myphysicslab.sims.roller.PathSelector');

goog.require('goog.array');

const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const HasPath = goog.require('myphysicslab.sims.roller.HasPath');
const NumericalPath = goog.require('myphysicslab.lab.model.NumericalPath');
const ParameterString = goog.require('myphysicslab.lab.util.ParameterString');
const ParametricPath = goog.require('myphysicslab.lab.model.ParametricPath');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Provides a {@link HasPath} (such as roller coaster simulation) with a choice of
several paths. Defines a ParameterString that has the set of available ParametricPaths
as choices.

{@link #getPathName} returns name of current path. {@link #setPathName} sets the current
path to be the path with the given name from among the set of paths that are specified
to the constructor.

### Parameters Created

+ ParameterString named `PATH`, see {@link #setPathName}.

*/
class PathSelector extends AbstractSubject {
/**
* @param {!HasPath} hasPath
* @param {!Array<!ParametricPath>} paths  the set of paths to offer
*/
constructor(hasPath, paths) {
  super('PATH_SELECTOR');
  /**
  * @type {!HasPath}
  * @private
  */
  this.hasPath_ = hasPath;
  /**
  * @type {!Array<!ParametricPath>}
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
  var names = paths.map(p => p.getName());
  var localNames = paths.map(p => p.getName(/*localized=*/true));
  var ps = new ParameterString(this, PathSelector.en.PATH, PathSelector.i18n.PATH,
      () => this.getPathName(), a => this.setPathName(a),
      localNames, names);
  // the input function allows passing in lowercase path names.
  //ps.setInputFunction(Util.toName);
  this.addParameter(ps);
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', pathName: '+this.pathName_
      +', paths: ['
      + this.paths_.map(p => p.getName())
      + ']' + super.toString();
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' :
      super.toStringShort().slice(0, -1)
      +', hasPath: '+this.hasPath_.toStringShort() +'}';
};

/** @override */
getClassName() {
  return 'PathSelector';
};

/** Returns name of current path.
* @return {string} name of current path.
*/
getPathName() {
  return this.pathName_;
};

/** Sets the current path.
* @param {string} value  name of desired path
*/
setPathName(value) {
  value = Util.toName(value);
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
    throw 'unknown path '+value;
  };
};

/** Recalculates the current path, in case the equation of the path
has changed, or the start and finish parameter values have changed.
* @return {undefined}
*/
update() {
  for (var i=0, len=this.paths_.length; i<len; i++) {
    var path = this.paths_[i];
    if (path.nameEquals(this.pathName_)) {
      this.hasPath_.setPath(new NumericalPath(path));
      this.broadcastParameter(PathSelector.en.PATH);
      return;
    }
  }
  throw 'unknown path '+this.pathName_;
};

} // end class

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

exports = PathSelector;
