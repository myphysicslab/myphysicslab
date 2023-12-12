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

import { DisplayList } from '../../lab/view/DisplayList.js';
import { DisplayPath } from '../../lab/view/DisplayPath.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { GenericObserver, Observer, Subject, SubjectEvent }
    from '../../lab/util/Observe.js';
import { NumericalPath } from '../../lab/model/NumericalPath.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { SimView } from '../../lab/view/SimView.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** An object to remember the DisplayPaths and GenericObservers we made. When
* DisplayPath is removed from SimView we disconnect things, which helps garbage
* collection.
*/
type memObjects = {
  simObj: NumericalPath,
  obs: GenericObserver,
  dispPath: DisplayPath,
};

/** Automatically creates a DisplayPath when a NumericalPath is added to a SimList.
Observes the SimList of a Simulation, adding or removing DisplayPath to represent the
NumericalPath in SimView with a `zIndex` of -10 so that it appears underneath other
objects.

Note that the DisplayPath shows only a single NumericalPath, and is destroyed when that
NumericalPath is removed from the SimList.

### Setting Style of DisplayPath

To control the style (color, line thickness, etc) used for a particular DisplayPath
there are two approaches:

#### 1. Modify the DisplayPath style directly

Modify the DisplayPath's style directly, for example:
```js
const dispPath1 = simView.getDisplayList().find(path1);
dispPath1.setStyle(0, DrawingStyle.lineStyle('red', 2));
```

#### 2. Modify the prototype

PathObserver has a **prototype** DisplayPath. When a display property of a DisplayPath
is `undefined`, then the property is fetched from the prototype DisplayPath. If it is
also `undefined` on the prototype then a default value is used.

Keep in mind that **all** objects with a given prototype will be affected by any
changes made to the prototype.

Here is an example where we set the prototype to have a thin blue line.
```js
const pathObs = new PathObserver(simList, simView, null);
pathObs.protoDisplayPath.setStyle(0, DrawingStyle.lineStyle('blue', 1));
```

### Resize the SimView to match NumericalPath

Often we want the SimView's dimensions to match that of the NumericalPath. To have the
PathObserver change the bounding rectangle of the SimView to match that of the
NumericalPath, specify the `simRectSetter` argument in the constructor. This will
occur whenever the NumericalPath changes.

*/
export class PathObserver implements Observer {
  private simView_: SimView;
  private displayList_: DisplayList;
  private simList_: SimList;
  private simRectSetter_: null|((a:DoubleRect) =>void);
  private expansionFactor_: number;
  /* List of DisplayPaths and GenericObservers we made. When DisplayPath is removed
  * from SimView we disconnect things, which helps garbage collection.
  */
  private memObjs_: memObjects[];
  /* The prototype DisplayPath. */
  protoDisplayPath: DisplayPath|undefined;

/**
@param simList SimList to observe
@param simView the SimView to add DisplayObjects to
@param simRectSetter function to use for resizing the
    simulation rectangle of the SimView; if `null` then resizing is not done
@param opt_expand  factor to multiply the width and height by
     to expand the path bounds, which yields the rectangle used for resizing the
     SimView.  For example, 1.1 will make the bounds 10% larger.
*/
constructor(simList: SimList, simView: SimView,
    simRectSetter: null|((a:DoubleRect) =>void), opt_expand?: number) {
  this.simView_ = simView;
  this.displayList_ = simView.getDisplayList();
  this.simList_ = simList;
  this.simRectSetter_ = simRectSetter;
  this.expansionFactor_ = opt_expand || 1.1;
  this.simList_.addObserver(this);
  this.memObjs_ = [];
  this.protoDisplayPath = new DisplayPath();
  this.protoDisplayPath.setZIndex(-10);
};

/** @inheritDoc */
toString() {
  return 'PathObserver{'
    +'simList_: '+this.simList_.toStringShort()
    +', simView_: '+this.simView_.toStringShort()
    +', expansionFactor: '+Util.NF(this.expansionFactor_)
    +', displayList_: '+this.displayList_.toStringShort()
    +', protoDisplayPath: '+(this.protoDisplayPath ?
         this.protoDisplayPath.toStringShort() : 'undefined')
    +'}';
};

/** @inheritDoc */
toStringShort() {
  return 'PathObserver{}';
};

/** Creates DisplayPath for the NumericalPath, and adds DisplayPath to SimView.
* @param np
*/
private addPath(np: NumericalPath): void {
  if (this.displayList_.find(np) != null) {
    // we already have a DisplayPath for this NumericalPath, don't add a new one.
    return;
  }
  const displayPath = new DisplayPath(this.protoDisplayPath);
  displayPath.setScreenRect(this.simView_.getScreenRect());
  displayPath.addPath(np);
  this.displayList_.add(displayPath);
  if (this.simRectSetter_ != null) {
    // modify size of display to fit this path
    let r = np.getBoundsWorld().scale(this.expansionFactor_);
    if (r.isEmpty()) {
      // for empty rectangle: expand bounds to be at least a unit square
      const unitRect = DoubleRect.makeCentered(r.getCenter(), 1, 1);
      r = r.union(unitRect);
    }
    this.simRectSetter_(r);
  }
  const obs = new GenericObserver(this.simView_, event => {
    if (event.getSubject() == this.simView_) {
      if (event.nameEquals(SimView.SCREEN_RECT_CHANGED)) {
        displayPath.setScreenRect(this.simView_.getScreenRect());
      }
    }
  }, 'resize displayPath when screenRect changes');
  // Remember the combo of NumericalPath, GenericObserver and DisplayPath.
  this.memObjs_.push({simObj: np, obs: obs, dispPath: displayPath});
};

/** Removes DisplayPath for the given NumericalPath from SimView.
* @param np
*/
private removePath(np: NumericalPath): void {
  const memObj = this.memObjs_.find(element => element.simObj == np);
  if (memObj !== undefined) {
    // Disconnect things to help with garbage collection.
    this.displayList_.remove(memObj.dispPath);
    memObj.obs.disconnect();
    memObj.dispPath.removePath(np);
    Util.remove(this.memObjs_, memObj);
  }
};

/** @inheritDoc */
observe(event: SubjectEvent): void {
  if (event.getSubject() == this.simList_) {
    const obj = event.getValue() as SimObject;
    if (obj instanceof NumericalPath) {
      if (event.nameEquals(SimList.OBJECT_ADDED)) {
        this.addPath(obj);
      } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
        this.removePath(obj);
      }
    }
  }
};

} // end class

Util.defineGlobal('sims$roller$PathObserver', PathObserver);
