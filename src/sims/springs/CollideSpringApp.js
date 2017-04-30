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

goog.provide('myphysicslab.sims.springs.CollideSpringApp');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.controls.SliderControl');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.SimObject');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.sims.common.AbstractApp');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.springs.CollideSpringSim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var AbstractApp = sims.common.AbstractApp;
var ChoiceControl = lab.controls.ChoiceControl;
var CollideSpringSim = sims.springs.CollideSpringSim;
var CommonControls = sims.common.CommonControls;
var DisplayShape = lab.view.DisplayShape;
var DisplaySpring = lab.view.DisplaySpring;
var DoubleRect = lab.util.DoubleRect;
var NF = lab.util.UtilityCore.NF;
var NumericControl = lab.controls.NumericControl;
var Observer = lab.util.Observer;
var ParameterBoolean = lab.util.ParameterBoolean;
var ParameterNumber = lab.util.ParameterNumber;
var PointMass = lab.model.PointMass;
var SimList = lab.model.SimList;
var SimObject = lab.model.SimObject;
var SimpleAdvance = lab.model.SimpleAdvance;
var SliderControl = lab.controls.SliderControl;
var Spring = lab.model.Spring;
var TabLayout = sims.common.TabLayout;
var UtilityCore = lab.util.UtilityCore;

/** Displays the simulation {@link CollideSpringSim}.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {AbstractApp}
* @implements {Observer}
* @export
*/
myphysicslab.sims.springs.CollideSpringApp = function(elem_ids) {
  UtilityCore.setErrorHandler();
  var simRect = new DoubleRect(-6.4, -2, 6.4, 2);
  var sim = new CollideSpringSim();
  /** @type {!CollideSpringSim} */
  this.mySim = sim;
  var advance = new SimpleAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);
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

  // The update() method will make DisplayObjects in response to seeing SimObjects
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
var CollideSpringApp = myphysicslab.sims.springs.CollideSpringApp;
goog.inherits(CollideSpringApp, AbstractApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  CollideSpringApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', startGap: '+NF(this.startGap)
        +', numBlocks: '+NF(this.numBlocks)
        +', startPosition: '+NF(this.startPosition)
        + CollideSpringApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
CollideSpringApp.prototype.getClassName = function() {
  return 'CollideSpringApp';
};

/** @inheritDoc */
CollideSpringApp.prototype.defineNames = function(myName) {
  CollideSpringApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('protoBlock|protoWall|protoSpring',
      myName);
};

/**
@param {!SimObject} obj
@private
*/
CollideSpringApp.prototype.addBody = function(obj) {
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

/** @inheritDoc */
CollideSpringApp.prototype.observe =  function(event) {
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
CollideSpringApp.prototype.getStartGap = function() {
  return this.startGap;
};

/** Set gap between objects in starting position
@param {number} value gap between objects in starting position
*/
CollideSpringApp.prototype.setStartGap = function(value) {
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
CollideSpringApp.prototype.getNumBlocks = function() {
  return this.numBlocks;
};

/**
* @param {number} value
*/
CollideSpringApp.prototype.setNumBlocks = function(value) {
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
CollideSpringApp.prototype.getStartPosition = function() {
  return this.startPosition;
};

/**
* @param {number} value
*/
CollideSpringApp.prototype.setStartPosition = function(value) {
  if (this.startPosition != value) {
    this.startPosition = value;
    this.mySim.config(this.numBlocks, this.startPosition, this.startGap);
    this.broadcastParameter(CollideSpringSim.en.START_POSITION);
    this.easyScript.update();
  }
};

}); // goog.scope
