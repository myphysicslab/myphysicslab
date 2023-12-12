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

import { CoordMap } from '../view/CoordMap.js'
import { DoubleRect } from '../util/DoubleRect.js'
import { SimView } from '../view/SimView.js'
import { Util } from '../util/Util.js'
import { Vector } from '../util/Vector.js'

/** Pans (scrolls) a SimView to follow mouse movements.
See [SimView Panning](./lab_app_SimController.SimController.html#md:simview-panning)
in {@link lab/app/SimController.SimController}.
*/
export class ViewPanner {
  /** the SimView being panned */
  private view_: SimView;
  /**  SimView's initial CoordMap at mouse down event, for SimView panning.
  * We keep the initial coordmap because later we will do SimView.setSimRect
  * which will change the SimView's coordmap.
  */
  private panMap_: CoordMap;
  /** center of simRect in panMap screen coords */
  private center_screen_: Vector;
  /** initial mouse down location in LabCanvas screen coords */
  private start_screen_: Vector;

/**
@param view the SimView to pan
@param start_screen initial mouse position in LabCanvas screen coordinates
*/
constructor(view: SimView, start_screen: Vector) {
  this.view_ = view;
  this.panMap_ = view.getCoordMap();
  const sr = view.getSimRect();
  this.center_screen_ = this.panMap_.simToScreen(sr.getCenter());
  this.start_screen_ = start_screen;
};

/** Modifies the SimView so it is translated by the distance and direction the mouse
has moved since the initial mouse down.
@param loc_screen current mouse position in screen coordinates
*/
mouseDrag(loc_screen: Vector): void {
  // Use panMap_ because it doesn't change as we move the SimView's simRect.
  // Move the center in opposite direction of the mouse, because
  // simRect is the 'window' we look thru to see the simulation.
  const offset = this.start_screen_.subtract(loc_screen);
  const center = this.panMap_.screenToSim(this.center_screen_.add(offset));
  const sr = this.view_.getSimRect();
  const dr = DoubleRect.makeCentered(center, sr.getWidth(), sr.getHeight());
  this.view_.setSimRect(dr);  // note: this changes the SimView's CoordMap.
};

/** Called when mouse drag operation is finished. */
finishDrag(): void {};

} // end class

Util.defineGlobal('lab$app$ViewPanner', ViewPanner);
