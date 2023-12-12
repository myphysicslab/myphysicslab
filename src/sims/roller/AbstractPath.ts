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

import { Util } from '../../lab/util/Util.js';
import { ParametricPath } from '../../lab/model/ParametricPath.js';

/** An abstract base class for a ParametricPath.

This was previously "package-private" to ensure that any changes to it are coordinated
with all its subclasses.
*/
export abstract class AbstractPath implements ParametricPath {
  private name_: string;
  private localName_: string;
  protected startTValue_: number;
  protected finishTValue_: number;
  protected closedLoop_: boolean;

/**
* @param name language independent name
* @param localName localized (internationalized) name
* @param startTValue starting `t` value for defining path
* @param finishTValue  ending `t` value for defining path
* @param closedLoop `true` means the path is a closed loop
*/
constructor(name: string, localName: string, startTValue: number, finishTValue: number,
    closedLoop: boolean) {
  this.name_ = Util.validName(Util.toName(name));
  this.localName_ = localName || name;
  this.startTValue_ = startTValue;
  this.finishTValue_ = finishTValue;
  this.closedLoop_ = closedLoop;
};

/** @inheritDoc */
toString() {
  return this.getClassName()+'{name_: "'+this.name_+'"'
    +', localName_: "'+this.localName_+'"'
    +', startTValue_: '+Util.NF(this.startTValue_)
    +', finishTValue_: '+Util.NF(this.finishTValue_)
    +', closedLoop_: '+this.closedLoop_
    +'}';
};

abstract x_func(t:number): number;
abstract y_func(t:number): number;

/** Returns name of class of this object.
* @return name of class of this object.
*/
abstract getClassName(): string;

/** @inheritDoc */
getName(opt_localized?: boolean): string {
  return opt_localized ? this.localName_ : this.name_;
};

/** @inheritDoc */
getFinishTValue(): number {
  return this.finishTValue_;
};

/** @inheritDoc */
getStartTValue(): number {
  return this.startTValue_;
};

/** @inheritDoc */
isClosedLoop(): boolean {
  return this.closedLoop_;
};

/** @inheritDoc */
nameEquals(name: string): boolean {
  return this.name_ == Util.toName(name);
};

/** Sets whether the path is a closed loop, ending at the same point it starts.
* @param value whether the path is a closed loop
*/
setClosedLoop(value: boolean): void {
  this.closedLoop_ = value;
};

/** Sets the ending value for `t` in the parameteric equation defining the path.
* @param value ending value for `t`
*/
setFinishTValue(value: number): void {
  this.finishTValue_ = value;
};

/** Sets the starting value for `t` in the parameteric equation defining the path.
* @param value starting value for `t`
*/
setStartTValue(value: number): void {
  this.startTValue_ = value;
};

} // end class

Util.defineGlobal('sims$roller$AbstractPath', AbstractPath);
