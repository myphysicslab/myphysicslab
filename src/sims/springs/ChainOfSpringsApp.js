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

goog.provide('myphysicslab.sims.springs.ChainOfSpringsApp');

goog.require('goog.asserts');
goog.require('myphysicslab.lab.controls.SliderControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.controls.ButtonControl');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.ShapeType');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.model.Spring');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DisplaySpring');
goog.require('myphysicslab.lab.view.DrawingMode');
goog.require('myphysicslab.sims.layout.AbstractApp');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.TabLayout');
goog.require('myphysicslab.sims.springs.ChainOfSpringsSim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var SliderControl = lab.controls.SliderControl;
var ChoiceControl = lab.controls.ChoiceControl;
var CheckBoxControl = lab.controls.CheckBoxControl;
var NumericControl = lab.controls.NumericControl;
var AbstractApp = sims.layout.AbstractApp;
var ButtonControl = lab.controls.ButtonControl;
var ChainOfSpringsSim = sims.springs.ChainOfSpringsSim;
var CommonControls = sims.layout.CommonControls;
var DisplayGraph = lab.graph.DisplayGraph;
var DisplayShape = lab.view.DisplayShape;
var DisplaySpring = lab.view.DisplaySpring;
var DoubleRect = lab.util.DoubleRect;
var DrawingMode = lab.view.DrawingMode;
var GenericObserver = lab.util.GenericObserver;
var GraphLine = lab.graph.GraphLine;
var Observer = lab.util.Observer;
var ParameterBoolean = lab.util.ParameterBoolean;
var ParameterNumber = lab.util.ParameterNumber;
var PointMass = lab.model.PointMass;
var ShapeType = lab.model.ShapeType;
var SimList = lab.model.SimList;
var SimpleAdvance = lab.model.SimpleAdvance;
var Spring = lab.model.Spring;
var TabLayout = sims.layout.TabLayout;
var UtilityCore = lab.util.UtilityCore;

/**  ChainOfSpringsApp displays the simulation
{@link myphysicslab.sims.springs.ChainOfSpringsSim ChainOfSpringsSim}.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @param {number=} numAtoms number of chain links to make
* @param {boolean=} attachRight whether to attach to fixed block on right
* @constructor
* @final
* @struct
* @extends {AbstractApp}
* @implements {Observer}
* @export
*/
myphysicslab.sims.springs.ChainOfSpringsApp = function(elem_ids, numAtoms, attachRight) {
  UtilityCore.setErrorHandler();
  /** @type {number} */
  this.numAtoms = goog.isNumber(numAtoms) ? numAtoms : 10;
  /** @type {boolean} */
  this.attachRight = goog.isDef(attachRight) ? attachRight : true;
  var simRect = new DoubleRect(-6.4, -6, 6.4, 6);
  var sim = new ChainOfSpringsSim();
  this.mySim = sim;
  sim.makeChain(this.numAtoms, this.attachRight);
  var advance = new SimpleAdvance(sim);
  AbstractApp.call(this, elem_ids, simRect, sim, advance, /*eventHandler=*/sim,
      /*energySystem=*/sim);

  // Make DisplayObjects for all SimObjects currently on the SimList.
  goog.array.forEach(this.simList.toArray(), function(obj) {
      this.addBody(obj);
    }, this);
  // In future, the update() method will make DisplayObjects in response to seeing
  // SimObjects being added to the SimList.
  this.simList.addObserver(this);

  this.addPlaybackControls();
  /** @type {!lab.util.ParameterBoolean} */
  var pb;
  /** @type {!lab.util.ParameterNumber} */
  var pn;

  this.addParameter(pn = new ParameterNumber(this, ChainOfSpringsSim.en.NUM_LINKS,
      ChainOfSpringsSim.i18n.NUM_LINKS,
      this.getNumLinks, this.setNumLinks).setDecimalPlaces(0));
  this.addControl(new SliderControl(pn, 0, 30, /*multiply=*/false));

  this.addParameter(pb = new ParameterBoolean(this, ChainOfSpringsSim.en.ATTACH_RIGHT,
      ChainOfSpringsSim.i18n.ATTACH_RIGHT,
      this.getAttachRight, this.setAttachRight));
  this.addControl(new CheckBoxControl(pb));

  pn = sim.getParameterNumber(ChainOfSpringsSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 40, /*multiply=*/false));

  pn = sim.getParameterNumber(ChainOfSpringsSim.en.DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(ChainOfSpringsSim.en.SPRING_DAMPING);
  this.addControl(new SliderControl(pn, 0, 1, /*multiply=*/false));

  pn = sim.getParameterNumber(ChainOfSpringsSim.en.MASS);
  this.addControl(new SliderControl(pn, 0.2, 50.2, /*multiply=*/true));

  pn = sim.getParameterNumber(ChainOfSpringsSim.en.LENGTH);
  this.addControl(new SliderControl(pn, 0, 10, /*multiply=*/false));

  pn = sim.getParameterNumber(ChainOfSpringsSim.en.STIFFNESS);
  this.addControl(new SliderControl(pn, 0, 100, /*multiply=*/false));

  this.addStandardControls();

  /** @type {!lab.controls.ButtonControl} */
  var bc = new ButtonControl(ChainOfSpringsSim.i18n.STRAIGHT_LINE,
      goog.bind(sim.straightLine, sim));
  this.addControl(bc);

  // 0    1  2  3    4     5     6    7     8   9  10  11  12  13  14  15  16 ...
  // time KE PE TE fix1x fix1y fix2x fix2y U0x U0y V0x V0y U1x U1y V1x V1y U2x ...
  this.graph.line.setXVariable(9);
  this.graph.line.setYVariable(11);
  this.graph.line.setDrawingMode(DrawingMode.LINES);
  this.timeGraph.line1.setYVariable(1);
  this.timeGraph.line2.setYVariable(2);

  this.makeScriptParser();
  this.addURLScriptButton();
};
var ChainOfSpringsApp = sims.springs.ChainOfSpringsApp;
goog.inherits(ChainOfSpringsApp, AbstractApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  ChainOfSpringsApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', numAtoms: '+this.numAtoms
        +', attachRight: '+this.attachRight
        + ChainOfSpringsApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
ChainOfSpringsApp.prototype.getClassName = function() {
  return 'ChainOfSpringsApp';
};

/**
@param {!myphysicslab.lab.model.SimObject} obj
@private
*/
ChainOfSpringsApp.prototype.addBody = function(obj) {
  if (this.displayList.findSimObject(obj) != null) {
    // we already have a DisplayObject for this SimObject, don't add a new one.
    return;
  }
  if (obj instanceof PointMass) {
    var pm = /** @type {!PointMass} */(obj);
    //DisplayShape.nameFont = '10pt sans-serif';
    DisplayShape.drawCenterOfMass = false;
    DisplayShape.drawDragPoints = false;
    if (pm.getShape() == ShapeType.OVAL) {
      DisplayShape.fillStyle = 'blue';
    } else {
      DisplayShape.fillStyle = 'gray';
    }
    DisplayShape.strokeStyle = '';
    this.displayList.add(new DisplayShape(pm));
  } else if (obj instanceof Spring) {
    var s = /** @type {!Spring} */(obj);
    DisplaySpring.width = 0.3;
    DisplaySpring.colorCompressed = '#0c0';  // darker green
    DisplaySpring.colorExpanded = '#6f6'; // brighter green
    this.displayList.add(new DisplaySpring(s));
  }
};

/** @inheritDoc */
ChainOfSpringsApp.prototype.observe =  function(event) {
  if (event.getSubject() == this.simList) {
    var obj = /** @type {!myphysicslab.lab.model.SimObject} */ (event.getValue());
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      this.addBody(obj);
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      var d = this.displayList.findSimObject(obj);
      if (d != null) {
        this.displayList.remove(d);
      }
    }
  }
};

/**
* @return {number}
*/
ChainOfSpringsApp.prototype.getNumLinks = function() {
  return this.numAtoms;
};

/**
* @param {number} value
*/
ChainOfSpringsApp.prototype.setNumLinks = function(value) {
  value = Math.floor(value+0.5);
  if (this.numAtoms != value) {
    this.numAtoms = value;
    this.mySim.makeChain(this.numAtoms, this.attachRight);
    this.broadcastParameter(ChainOfSpringsSim.en.NUM_LINKS);
    this.scriptParser.update();
  }
};

/**
* @return {boolean}
*/
ChainOfSpringsApp.prototype.getAttachRight = function() {
  return this.attachRight;
};

/**
* @param {boolean} value
*/
ChainOfSpringsApp.prototype.setAttachRight = function(value) {
  if (this.attachRight != value) {
    this.attachRight = value;
    this.mySim.makeChain(this.numAtoms, this.attachRight);
    this.broadcastParameter(ChainOfSpringsSim.en.ATTACH_RIGHT);
    this.scriptParser.update();
  }
};

}); // goog.scope
