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

goog.module('myphysicslab.sims.springs.CollideSpringApp');

goog.require('goog.array');
goog.require('goog.asserts');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const CollideSpringSim = goog.require('myphysicslab.sims.springs.CollideSpringSim');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const SimList = goog.require('myphysicslab.lab.model.SimList');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const SimpleAdvance = goog.require('myphysicslab.lab.model.SimpleAdvance');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Displays the simulation {@link CollideSpringSim}.

* @implements {Observer}
*/
class CollideSpringApp extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  Util.setErrorHandler();
  var simRect = new DoubleRect(-6.4, -2, 6.4, 2);
  var sim = new CollideSpringSim();
  var advance = new SimpleAdvance(sim);

  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim, /*energySystem=*/sim);

  /** @type {!CollideSpringSim} */
  this.mySim = sim;

  this.layout.simCanvas.setBackground('black');

  /**
  * @type {number}
  * @private
  */
  this.startPosition = CollideSpringSim.START_MIDDLE;
  /**
  * @type {number}
  * @private
  */
  this.numBlocks = 3;
  /** Gap between objects in starting position
  * @type {number}
  * @private
  */
  this.startGap = 0.1;

  /** @type {!DisplayShape} */
  this.protoBlock = new DisplayShape().setFillStyle('blue');
  /** @type {!DisplayShape} */
  this.protoWall = new DisplayShape().setFillStyle('lightGray');
  /** @type {!DisplaySpring} */
  this.protoSpring = new DisplaySpring().setWidth(0.3).setColorCompressed('#0c0')
      .setColorExpanded('#6f6');

  // The observe() method will make DisplayObjects in response to seeing SimObjects
  // being added to the SimList.  Important that no SimObjects were added prior.
  goog.asserts.assert(this.simList.length() == 0);
  this.simList.addObserver(this);
  sim.config(this.numBlocks, this.startPosition, this.startGap);

  // smaller time step results in nearly-stationary blocks
  this.simRun.setTimeStep(0.0025);

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;

  this.addParameter(pn = new ParameterNumber(this, CollideSpringSim.en.NUM_BLOCKS,
      CollideSpringSim.i18n.NUM_BLOCKS,
      goog.bind(this.getNumBlocks, this), goog.bind(this.setNumBlocks, this))
      .setDecimalPlaces(0).setLowerLimit(1).setUpperLimit(3));
  this.addControl(new SliderControl(pn, 1, 3, /*multiply=*/false));

  this.addParameter(pn = new ParameterNumber(this, CollideSpringSim.en.START_POSITION,
      CollideSpringSim.i18n.START_POSITION,
      goog.bind(this.getStartPosition, this), goog.bind(this.setStartPosition, this),
      /*choices=*/[CollideSpringSim.i18n.START_IN_MIDDLE,
      CollideSpringSim.i18n.START_ON_WALL],
      /*values=*/[CollideSpringSim.START_MIDDLE, CollideSpringSim.START_ON_WALL]));
  this.addControl(new ChoiceControl(pn));

  this.addParameter(pn = new ParameterNumber(this, CollideSpringSim.en.START_GAP,
      CollideSpringSim.i18n.START_GAP,
      goog.bind(this.getStartGap, this), goog.bind(this.setStartGap, this)));
  this.addControl(new NumericControl(pn));

  pn = sim.getParameterNumber(CollideSpringSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(CollideSpringSim.en.SPRING_DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(CollideSpringSim.en.MASS);
  this.addControl(new SliderControl(pn, 0.2, 50.2, /*multiply=*/true));

  pn = sim.getParameterNumber(CollideSpringSim.en.SPRING_LENGTH);
  this.addControl(new SliderControl(pn, 0, 1.5, /*multiply=*/false));

  pn = sim.getParameterNumber(CollideSpringSim.en.SPRING_STIFFNESS);
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', startGap: '+Util.NF(this.startGap)
      +', numBlocks: '+Util.NF(this.numBlocks)
      +', startPosition: '+Util.NF(this.startPosition)
      + super.toString();
};

/** @override */
getClassName() {
  return 'CollideSpringApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('protoBlock|protoWall|protoSpring',
      myName+'.');
};

/**
@param {!SimObject} obj
@private
*/
addBody(obj) {
  if (this.displayList.find(obj) != null) {
    // we already have a DisplayObject for this SimObject, don't add a new one.
    return;
  }
  if (obj instanceof PointMass) {
    var rm = /** @type {!PointMass} */(obj);
    var proto = rm.getName().match(/^WALL/) ? this.protoWall : this.protoBlock;
    this.displayList.add(new DisplayShape(rm, proto));
  } else if (obj instanceof Spring) {
    var s = /** @type {!Spring} */(obj);
    this.displayList.add(new DisplaySpring(s, this.protoSpring));
  }
};

/** @override */
observe(event) {
  if (event.getSubject() == this.simList) {
    var obj = /** @type {!SimObject} */ (event.getValue());
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      this.addBody(obj);
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      var d = this.displayList.find(obj);
      if (d != null) {
        this.displayList.remove(d);
      }
    }
  }
};

/** Return gap between objects in starting position
@return {number} gap between objects in starting position
*/
getStartGap() {
  return this.startGap;
};

/** Set gap between objects in starting position
@param {number} value gap between objects in starting position
*/
setStartGap(value) {
  if (value != this.startGap) {
    this.startGap = value;
    this.mySim.config(this.numBlocks, this.startPosition, this.startGap);
    this.broadcastParameter(CollideSpringSim.en.START_GAP);
    this.easyScript.update();
  }
};

/**
* @return {number}
*/
getNumBlocks() {
  return this.numBlocks;
};

/**
* @param {number} value
*/
setNumBlocks(value) {
  value = Math.floor(value+0.5);
  if (this.numBlocks != value) {
    this.numBlocks = value;
    this.mySim.config(this.numBlocks, this.startPosition, this.startGap);
    this.broadcastParameter(CollideSpringSim.en.NUM_BLOCKS);
    this.easyScript.update();
  }
};

/**
* @return {number}
*/
getStartPosition() {
  return this.startPosition;
};

/**
* @param {number} value
*/
setStartPosition(value) {
  if (this.startPosition != value) {
    this.startPosition = value;
    this.mySim.config(this.numBlocks, this.startPosition, this.startGap);
    this.broadcastParameter(CollideSpringSim.en.START_POSITION);
    this.easyScript.update();
  }
};

} //end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!CollideSpringApp}
*/
function makeCollideSpringApp(elem_ids) {
  return new CollideSpringApp(elem_ids);
};
goog.exportSymbol('makeCollideSpringApp', makeCollideSpringApp);

exports = CollideSpringApp;
