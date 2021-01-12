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

goog.module('myphysicslab.sims.springs.ChainOfSpringsApp');

const AbstractApp = goog.require('myphysicslab.sims.common.AbstractApp');
const ButtonControl = goog.require('myphysicslab.lab.controls.ButtonControl');
const ChainOfSpringsSim = goog.require('myphysicslab.sims.springs.ChainOfSpringsSim');
const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.require('myphysicslab.lab.controls.ChoiceControl');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const DisplayGraph = goog.require('myphysicslab.lab.graph.DisplayGraph');
const DisplayShape = goog.require('myphysicslab.lab.view.DisplayShape');
const DisplaySpring = goog.require('myphysicslab.lab.view.DisplaySpring');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const DrawingMode = goog.require('myphysicslab.lab.view.DrawingMode');
const EnergySystem = goog.require('myphysicslab.lab.model.EnergySystem');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');
const GraphLine = goog.require('myphysicslab.lab.graph.GraphLine');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const Observer = goog.require('myphysicslab.lab.util.Observer');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const PointMass = goog.require('myphysicslab.lab.model.PointMass');
const ShapeType = goog.require('myphysicslab.lab.model.ShapeType');
const SimList = goog.require('myphysicslab.lab.model.SimList');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const SimpleAdvance = goog.require('myphysicslab.lab.model.SimpleAdvance');
const SliderControl = goog.require('myphysicslab.lab.controls.SliderControl');
const Spring = goog.require('myphysicslab.lab.model.Spring');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');

/** Displays the simulation {@link ChainOfSpringsSim}.

* @implements {Observer}
*/
class ChainOfSpringsApp extends AbstractApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {number=} numAtoms number of chain links to make
* @param {boolean=} attachRight whether to attach to fixed block on right
*/
constructor(elem_ids, numAtoms, attachRight) {
  Util.setErrorHandler();
  numAtoms = typeof numAtoms === 'number' ? numAtoms : 10;
  attachRight = attachRight !== undefined ? attachRight : true;
  var simRect = new DoubleRect(-6.4, -6, 6.4, 6);
  var sim = new ChainOfSpringsSim();
  sim.makeChain(numAtoms, attachRight);
  var advance = new SimpleAdvance(sim);

  super(elem_ids, simRect, sim, advance, /*eventHandler=*/sim, /*energySystem=*/sim);

  /** @type {number} */
  this.numAtoms = numAtoms;
  /** @type {boolean} */
  this.attachRight = attachRight;
  /** @type {!ChainOfSpringsSim} */
  this.mySim = sim;

  /** @type {!DisplayShape} */
  this.protoMass = new DisplayShape().setFillStyle('blue');
  /** @type {!DisplayShape} */
  this.protoAnchor = new DisplayShape().setFillStyle('gray');
  /** @type {!DisplaySpring} */
  this.protoSpring = new DisplaySpring().setWidth(0.3).setColorCompressed('#0c0')
      .setColorExpanded('#6f6');
  this.protoSpring.setZIndex(-1);

  // Make DisplayObjects for all SimObjects currently on the SimList.
  this.simList.toArray().forEach(obj => this.addBody(obj));
  // The observe() method will make DisplayObjects in response to seeing
  // SimObjects being added to the SimList.
  this.simList.addObserver(this);

  this.addPlaybackControls();
  /** @type {!ParameterBoolean} */
  var pb;
  /** @type {!ParameterNumber} */
  var pn;

  this.addParameter(pn = new ParameterNumber(this, ChainOfSpringsSim.en.NUM_LINKS,
      ChainOfSpringsSim.i18n.NUM_LINKS,
      () => this.getNumLinks(), a => this.setNumLinks(a))
      .setDecimalPlaces(0));
  this.addControl(new SliderControl(pn, 0, 30, /*multiply=*/false));

  this.addParameter(pb = new ParameterBoolean(this, ChainOfSpringsSim.en.ATTACH_RIGHT,
      ChainOfSpringsSim.i18n.ATTACH_RIGHT,
      () => this.getAttachRight(), a => this.setAttachRight(a)));
  this.addControl(new CheckBoxControl(pb));

  pn = this.mySim.getParameterNumber(ChainOfSpringsSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 40, /*multiply=*/false));

  pn = this.mySim.getParameterNumber(ChainOfSpringsSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = this.mySim.getParameterNumber(ChainOfSpringsSim.en.SPRING_DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = this.mySim.getParameterNumber(ChainOfSpringsSim.en.MASS);
  this.addControl(new SliderControl(pn, 0.2, 50.2, /*multiply=*/true));

  pn = this.mySim.getParameterNumber(ChainOfSpringsSim.en.LENGTH);
  this.addControl(new SliderControl(pn, 0, 10, /*multiply=*/false));

  pn = this.mySim.getParameterNumber(ChainOfSpringsSim.en.STIFFNESS);
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));

  pn = sim.getParameterNumber(EnergySystem.en.PE_OFFSET);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  /** @type {!ButtonControl} */
  var bc = new ButtonControl(ChainOfSpringsSim.i18n.STRAIGHT_LINE,
      () => this.mySim.straightLine());
  this.addControl(bc);

  // 0    1  2  3    4     5     6    7     8   9  10  11  12  13  14  15  16 ...
  // time KE PE TE fix1x fix1y fix2x fix2y U0x U0y V0x V0y U1x U1y V1x V1y U2x ...
  this.graph.line.setXVariable(9);
  this.graph.line.setYVariable(11);
  this.graph.line.setDrawingMode(DrawingMode.LINES);
  this.timeGraph.line1.setYVariable(1);
  this.timeGraph.line2.setYVariable(2);

  this.makeEasyScript();
  this.addURLScriptButton();
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', numAtoms: '+this.numAtoms
      +', attachRight: '+this.attachRight
      + super.toString();
};

/** @override */
getClassName() {
  return 'ChainOfSpringsApp';
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
    var pm = /** @type {!PointMass} */(obj);
    var proto = pm.getShape() == ShapeType.OVAL ? this.protoMass : this.protoAnchor;
    this.displayList.add(new DisplayShape(pm, proto));
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

/**
* @return {number}
*/
getNumLinks() {
  return this.numAtoms;
};

/**
* @param {number} value
*/
setNumLinks(value) {
  value = Math.floor(value+0.5);
  if (this.numAtoms != value) {
    this.numAtoms = value;
    this.mySim.makeChain(this.numAtoms, this.attachRight);
    this.broadcastParameter(ChainOfSpringsSim.en.NUM_LINKS);
    this.easyScript.update();
  }
};

/**
* @return {boolean}
*/
getAttachRight() {
  return this.attachRight;
};

/**
* @param {boolean} value
*/
setAttachRight(value) {
  if (this.attachRight != value) {
    this.attachRight = value;
    this.mySim.makeChain(this.numAtoms, this.attachRight);
    this.broadcastParameter(ChainOfSpringsSim.en.ATTACH_RIGHT);
    this.easyScript.update();
  }
};

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @param {number=} numAtoms number of chain links to make
* @param {boolean=} attachRight whether to attach to fixed block on right
* @return {!ChainOfSpringsApp}
*/
function makeChainOfSpringsApp(elem_ids, numAtoms, attachRight) {
  return new ChainOfSpringsApp(elem_ids, numAtoms, attachRight);
};
goog.exportSymbol('makeChainOfSpringsApp', makeChainOfSpringsApp);

exports = ChainOfSpringsApp;
