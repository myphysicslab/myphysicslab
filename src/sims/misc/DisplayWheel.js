// Copyright 2020 Erik Neumann.  All Rights Reserved.
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

goog.module('myphysicslab.sims.misc.DisplayWheel');

goog.require('goog.asserts');

const AffineTransform = goog.require('myphysicslab.lab.util.AffineTransform');
const DisplayObject = goog.require('myphysicslab.lab.view.DisplayObject');
const MagnetWheel = goog.require('myphysicslab.sims.misc.MagnetWheel');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** 

* @implements {DisplayObject}
*/
class DisplayWheel {
/**
* @param {?MagnetWheel=} wheel the MagnetWheel to display
*/
constructor(wheel) {
  /**
  * @type {?MagnetWheel}
  * @private
  */
  this.wheel_ = goog.isDefAndNotNull(wheel) ? wheel : null;
  /**
  * @type {number|undefined}
  * @private
  */
  this.zIndex_;
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', zIndex: '+this.getZIndex()
      +'}';
};

/** @override */
toStringShort() {
  return Util.ADVANCED ? '' : 'DisplaySpring{wheel_: '+
      (this.wheel_ != null ? this.wheel_.toStringShort() : 'null')+'}';
};

/** @override */
contains(p_world) {
  return false;
};

/** @override */
draw(context, map) {
  if (this.wheel_ == null) {
    return;
  }
  context.save();
  /** @type {!AffineTransform} */
  var sim_to_screen = map.getAffineTransform(); // sim to screen transform
  // sim_to_screen_units = scaling factor to go from sim units to screen units (pixels)
  var sim_to_screen_units = 1/map.getScaleX();
  var body_to_screen =
      sim_to_screen.concatenate(this.wheel_.bodyToWorldTransform());
  body_to_screen.setTransform(context);
  this.wheel_.createCanvasPath(context);
  context.fillStyle = 'lightGray';
  context.fill();
  context.lineWidth = map.screenToSimScaleX(1);
  context.strokeStyle = 'red';
  context.stroke();
  // draw each magnet
  var r = this.wheel_.getRadius();
  var mr = 0.1*r;  // radius of the little magnet circle
  var magnets = this.wheel_.getMagnets();
  for (var i=0, n=magnets.length; i<n; i++) {
    var c = magnets[i]; // center of the magnet
    var x = c.getX();
    var y = c.getY();
    //console.log('magnet '+i+' '+c.toString());
    context.beginPath();
    if (goog.isFunction(context.ellipse)) {
      //context.moveTo(w, 0);
      // ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, anticlockwise);
      context.ellipse(x, y, mr, mr, 0, 0, 2*Math.PI, false);
    } else {
      // NOTE: until context.ellipse() is supported by browsers, we only
      // draw a circle here, the smallest that will fit.
      context.arc(x, y, mr, 0, 2*Math.PI, false);
      context.closePath();
    }
    context.fillStyle = 'darkGray';
    context.fill();
  }
  context.restore();
};

/** @override */
getMassObjects() {
  return this.wheel_ == null ? [ ] : [ this.wheel_ ];
};

/** @override */
getPosition() {
  // return midpoint of the line
  return this.wheel_ == null ? Vector.ORIGIN : this.wheel_.getPosition();
};

/** @override */
getSimObjects() {
  return this.wheel_ == null ? [ ] : [ this.wheel_ ];
};

/** @override */
getZIndex() {
  if (this.zIndex_ !== undefined) {
    return this.zIndex_;
  } else {
    return 0;
  }
};

/** @override */
isDragable() {
  return false;
};

/** @override */
setDragable(dragable) {
  // does nothing
};

/** @override */
setPosition(position) {
  //throw new Error('unsupported operation');
};

/** @override */
setZIndex(zIndex) {
  this.zIndex_ = zIndex;
};

} // end class

exports = DisplayWheel;
