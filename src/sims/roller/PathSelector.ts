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

import { AbstractSubject } from '../../lab/util/AbstractSubject.js';
import { NumericalPath, HasPath } from '../../lab/model/NumericalPath.js';
import { ParameterString, Subject } from '../../lab/util/Observe.js';
import { ParametricPath } from '../../lab/model/ParametricPath.js';
import { Util } from '../../lab/util/Util.js';

/** Provides a {@link HasPath} (such as roller coaster
simulation) with a choice of several paths. Defines a ParameterString that has the set
of available ParametricPaths as choices.

{@link PathSelector.getPathName} returns name of current path.
{@link PathSelector.setPathName} sets the current path to be the path with the given
name from among the set of paths that are specified to the constructor.

### Parameters Created

+ ParameterString named `PATH`, see {@link PathSelector.setPathName}.

*/
export class PathSelector extends AbstractSubject implements Subject {
  private hasPath_: HasPath;
  private paths_: ParametricPath[];
  private pathName_: string;

/**
* @param hasPath
* @param paths  the set of paths to offer
*/
constructor(hasPath: HasPath, paths: ParametricPath[]) {
  super('PATH_SELECTOR');
  this.hasPath_ = hasPath;
  this.paths_ = paths;
  const path = this.hasPath_.getPath();
  this.pathName_ = path != null ? path.getName() : '';
  // make array of path name strings for the PATH parameter
  const names = paths.map(p => p.getName());
  const localNames = paths.map(p => p.getName(/*localized=*/true));
  const ps = new ParameterString(this, PathSelector.en.PATH, PathSelector.i18n.PATH,
      () => this.getPathName(), a => this.setPathName(a),
      localNames, names);
  // the input function allows passing in lowercase path names.
  //ps.setInputFunction(Util.toName);
  this.addParameter(ps);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', pathName: '+this.pathName_
      +', paths: ['
      + this.paths_.map(p => p.getName())
      + ']' + super.toString();
};

/** @inheritDoc */
override toStringShort() {
  return super.toStringShort().slice(0, -1)
      +', hasPath: '+this.hasPath_.toStringShort() +'}';
};

/** @inheritDoc */
getClassName() {
  return 'PathSelector';
};

/** Returns name of current path.
* @return name of current path.
*/
getPathName(): string {
  return this.pathName_;
};

/** Sets the current path.
* @param value  name of desired path
*/
setPathName(value: string): void {
  value = Util.toName(value);
  if (value != this.pathName_) {
    for (let i=0, len=this.paths_.length; i<len; i++) {
      const path = this.paths_[i];
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
*/
update(): void {
  for (let i=0, len=this.paths_.length; i<len; i++) {
    const path = this.paths_[i];
    if (path.nameEquals(this.pathName_)) {
      this.hasPath_.setPath(new NumericalPath(path));
      this.broadcastParameter(PathSelector.en.PATH);
      return;
    }
  }
  throw 'unknown path '+this.pathName_;
};

static readonly en: i18n_strings = {
  PATH: 'path'
};

static readonly de_strings: i18n_strings = {
  PATH: 'Pfad'
};

static readonly i18n = Util.LOCALE === 'de' ? PathSelector.de_strings : PathSelector.en;

} // end class

type i18n_strings = {
  PATH: string
};

Util.defineGlobal('sims$roller$PathSelector', PathSelector);
