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

goog.provide('myphysicslab.lab.controls.GroupControl');

goog.require('goog.events');
goog.require('goog.events.Event');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.controls.LabControl');

goog.scope(function() {

var LabControl = myphysicslab.lab.controls.LabControl;
var UtilityCore = myphysicslab.lab.util.UtilityCore;

/** A group of LabControls which implements the LabControl interface. Typical usage is
for making the group of playback buttons for rewind, play/pause and step actions.
Another usage is to insert a `BR` element to break up long lines of controls into
logical groups. In the latter case {@link #getControls} returns an empty array,
but {@link #getElement} returns the `BR` element.

* @param {string} name  name of the group
* @param {!Element} topElement the div element that contains all the controls
* @param {!Array<!LabControl>} controls the set of controls contained in this
*     GroupControl
* @constructor
* @final
* @implements {LabControl}
* @struct
*/
myphysicslab.lab.controls.GroupControl = function(name, topElement, controls) {
  /** the name of the button
  * @type {string}
  * @private
  */
  this.name_ = name;
  /**
  * @type {!Element}
  * @private
  */
  this.topElement_ = topElement;
  /**
  * @type {!Array<!LabControl>}
  * @private
  */
  this.controls_ = controls;
};
var GroupControl = myphysicslab.lab.controls.GroupControl;

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  GroupControl.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', controls_: ['
        + goog.array.map(this.controls_, function(a) { return a.toStringShort(); })
        +']}';
  };

  /** @inheritDoc */
  GroupControl.prototype.toStringShort = function() {
    return 'GroupControl{name_: "'+this.name_+'"'
        +', controls_.length: '+this.controls_.length
        +'}';
  };
}

/** @inheritDoc */
GroupControl.prototype.disconnect = function() {
  goog.array.forEach(this.controls_, function(c) { c.disconnect(); });
};

/** Returns the set of controls in this GroupControl.
* @return {!Array<LabControl>} the set of controls in this GroupControl.
*/
GroupControl.prototype.getControls = function() {
  return goog.array.clone(this.controls_);
};

/** @inheritDoc */
GroupControl.prototype.getElement = function() {
  return this.topElement_;
};

/** @inheritDoc */
GroupControl.prototype.getParameter = function() {
  return null;
};

/** @inheritDoc */
GroupControl.prototype.setEnabled = function(enabled) {
  goog.array.forEach(this.controls_, function(c) { c.setEnabled(enabled); });
};

}); // goog.scope
