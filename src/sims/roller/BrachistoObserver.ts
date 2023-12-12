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

import { BrachistoSim } from './BrachistoSim.js';
import { DisplayList } from '../../lab/view/DisplayList.js';
import { DisplayPath } from '../../lab/view/DisplayPath.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplayText } from '../../lab/view/DisplayText.js';
import { DrawingStyle } from '../../lab/view/DrawingStyle.js';
import { NumericalPath } from '../../lab/model/NumericalPath.js';
import { GenericEvent, Observer, Subject, SubjectEvent } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { SimView } from '../../lab/view/SimView.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Observes the SimList of the BrachistoSim simulation, adding or removing
DisplayObjects to represent the simulation. BrachistoObserver also listens for the
PATH_CHOSEN event from BrachistoSim and modifies the DisplayText message accordingly, to
show the 'click a path' message or the 'you chose' message.

Note that this will add DisplayObject for every object currently on the simList.

*/
export class BrachistoObserver implements Observer {

  private sim_: BrachistoSim;
  private simView_: SimView;
  private displayList_: DisplayList;
  private statusView_: SimView;
  private displayPath_: DisplayPath;
  private simList_: SimList;
  private message_: DisplayText;

/**
@param sim
@param simList
@param simView
@param statusView
*/
constructor(sim: BrachistoSim, simList: SimList, simView: SimView, statusView: SimView) {
  this.sim_ = sim;
  this.simView_ = simView;
  this.displayList_ = simView.getDisplayList();
  this.statusView_ = statusView;
  this.displayPath_ = new DisplayPath();
  this.displayPath_.setScreenRect(simView.getScreenRect());
  this.displayPath_.setZIndex(-10);
  this.displayList_.add(this.displayPath_);
  this.simList_ = simList;
  // add display objects for all bodies currently in the simList
  this.addBodies(simList.toArray());
  this.message_ = new DisplayText(BrachistoObserver.i18n.QUESTION);
  this.message_.setFillStyle('gray');
  this.message_.setDragable(false);
  this.message_.setPosition(this.getTextPosition());
  this.statusView_.getDisplayList().add(this.message_);
  simView.addObserver(this);
  simList.addObserver(this);
  sim.addObserver(this);
};

/** @inheritDoc */
toString() {
  return 'BrachistoObserver{'
    +'sim_: '+this.sim_.toStringShort()
    +', simList_: '+this.simList_.toStringShort()
    +', simView_: '+this.simView_.toStringShort()
    +', displayList_: '+this.displayList_.toStringShort()
    +', statusView_: '+this.statusView_.toStringShort()
    +', displayPath_: '+this.displayPath_.toStringShort()
    +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'BrachistoObserver{}';
};

/** Creates DisplayObjects for the SimObjects, and add to SimView.
* @param bodies
*/
addBodies(bodies: SimObject[]): void {
  bodies.forEach(obj => this.addBody(obj));
};

/** Creates DisplayObject for the SimObject, and adds DisplayObject to SimView.
* @param obj
*/
addBody(obj: SimObject): void {
  const dobj = this.displayList_.find(obj);
  if (dobj) {
    // if we already have a DisplayObject for this, don't add a new one.
    return;
  }
  if (obj instanceof NumericalPath) {
    this.displayPath_.addPath(obj, DrawingStyle.lineStyle('gray', /*lineWidth=*/2));
  } else if (obj instanceof PointMass) {
    const pm = obj;
    const dp = new DisplayShape(pm);
    dp.setDragable(false);
    if (pm.getName().match(/BALL_SELECTED/)) {
      dp.setFillStyle('red');
      this.displayList_.add(dp);
    } else if (pm.getName().match(/BALL/)) {
      dp.setFillStyle('blue');
      this.displayList_.add(dp);
    } else if (pm.getName().match(/(START|END)/)) {
      dp.setFillStyle('');
      dp.setStrokeStyle('gray');
      dp.setThickness(1);
      dp.setZIndex(-1);
      this.displayList_.add(dp);
    }
  } else {
    throw 'BrachistoObserver unknown object '+obj;
  }
};

/** Calculate position to display the text message.
*/
private getTextPosition(): Vector {
  const sr = this.statusView_.getScreenRect();
  const r = this.statusView_.getCoordMap().screenToSimRect(sr);
  return new Vector(r.getLeft() + 0.15*r.getWidth(), r.getTop() - 0.1*r.getHeight());
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  //console.log('BrachistoObserver event='+event);
  if (event.getSubject() == this.sim_) {
    if (event.nameEquals(BrachistoSim.PATH_CHOSEN)) {
      // text object shows the question or the choice
      let msg;
      const choice = this.sim_.getPathChoice();
      if (choice >= 0) {
        msg = BrachistoObserver.i18n.YOU_PICKED;
        msg += ' ' + this.sim_.getPaths()[choice].getName();
        msg += ' ' + BrachistoObserver.i18n.PATH + '.';
      } else {
        msg = BrachistoObserver.i18n.QUESTION;
      }
      this.message_.setText(msg);
    }
  } else if (event.getSubject() == this.simView_) {
    /* adjust path display size when SimView size changes */
    if (event.nameEquals(SimView.SCREEN_RECT_CHANGED)) {
      this.displayPath_.setScreenRect(this.simView_.getScreenRect());
    }
  } else if (event.getSubject() == this.simList_) {
    const obj = event.getValue() as SimObject;
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      this.addBody(obj);
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      if (obj instanceof NumericalPath) {
        this.displayPath_.removePath(obj);
      } else if (obj instanceof PointMass) {
        const dispObj = this.displayList_.find(obj);
        if (dispObj) {
          this.displayList_.remove(dispObj);
        }
      }
    }
  }
};

static readonly en: i18n_strings = {
  PATH: 'path',
  QUESTION: 'Which path is fastest to slide down?  Click a path to begin.',
  YOU_PICKED: 'You picked the'
};

static readonly de_strings: i18n_strings = {
  PATH: 'Pfad gewählt',
  QUESTION: 'Welcher Pfad ist am schnellsten zum abrutschen?  Wählen Sie ein Pfad um zu beginnen.',
  YOU_PICKED: 'Sie haben den'
};

static readonly i18n = Util.LOCALE === 'de' ? BrachistoObserver.de_strings : BrachistoObserver.en;

} // end class

type i18n_strings = {
  PATH: string,
  QUESTION: string,
  YOU_PICKED: string
};

Util.defineGlobal('sims$roller$BrachistoObserver', BrachistoObserver);
