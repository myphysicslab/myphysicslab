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
goog.module('myphysicslab.lab.app.ViewPanner');

const CoordMap = goog.require('myphysicslab.lab.view.CoordMap');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const LabView = goog.require('myphysicslab.lab.view.LabView');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Pans (scrolls) a LabView to follow mouse movements.
See [LabView Panning](myphysicslab.lab.app.SimController.html#labviewpanning)
in SimController documentation.
*/
class ViewPanner {
/**
@param {!LabView} view the LabView to pan
@param {!Vector} start_screen initial mouse position in LabCanvas screen coordinates
*/
constructor(view, start_screen) {
  /** the LabView being panned
  * @type {!LabView}
  * @private
  */
  this.view_ = view;
  /**  LabView's initial CoordMap at mouse down event, for LabView panning.
  * We keep the initial coordmap because later we will do LabView.setSimRect
  * which will change the LabView's coordmap.
  * @type {!CoordMap}
  * @private
  */
  this.panMap_ = view.getCoordMap();
  const sr = view.getSimRect();
  /** center of simRect in panMap screen coords
  * @type {!Vector}
  * @private
  */
  this.center_screen_ = this.panMap_.simToScreen(sr.getCenter());
  /** initial mouse down location in LabCanvas screen coords
  * @type {!Vector}
  * @private
  */
  this.start_screen_ = start_screen;
};

/** Modifies the LabView so it is translated by the distance and direction the mouse
has moved since the initial mouse down.
@param {!Vector} loc_screen current mouse position in screen coordinates
*/
mouseDrag(loc_screen) {
  // Use panMap_ because it doesn't change as we move the LabView's simRect.
  // Move the center in opposite direction of the mouse, because
  // simRect is the 'window' we look thru to see the simulation.
  const offset = this.start_screen_.subtract(loc_screen);
  const center = this.panMap_.screenToSim(this.center_screen_.add(offset));
  const sr = this.view_.getSimRect();
  const dr = DoubleRect.makeCentered(center, sr.getWidth(), sr.getHeight());
  this.view_.setSimRect(dr);  // note: this changes the LabView's CoordMap.
};

/** Called when mouse drag operation is finished.
@return {undefined}
*/
finishDrag() {};

} // end class
exports = ViewPanner;
