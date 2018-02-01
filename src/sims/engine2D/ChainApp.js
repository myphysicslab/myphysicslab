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

goog.module('myphysicslab.sims.engine2D.ChainApp');

const ChainConfig = goog.require('myphysicslab.sims.engine2D.ChainConfig');
const CheckBoxControl = goog.require('myphysicslab.lab.controls.CheckBoxControl');
const CollisionAdvance = goog.require('myphysicslab.lab.model.CollisionAdvance');
const CommonControls = goog.require('myphysicslab.sims.common.CommonControls');
const ContactSim = goog.require('myphysicslab.lab.engine2D.ContactSim');
const DampingLaw = goog.require('myphysicslab.lab.model.DampingLaw');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const Engine2DApp = goog.require('myphysicslab.sims.engine2D.Engine2DApp');
const ExtraAccel = goog.require('myphysicslab.lab.engine2D.ExtraAccel');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');
const GravityLaw = goog.require('myphysicslab.lab.model.GravityLaw');
const LabView = goog.require('myphysicslab.lab.view.LabView');
const NumericControl = goog.require('myphysicslab.lab.controls.NumericControl');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const ParameterNumber = goog.require('myphysicslab.lab.util.ParameterNumber');
const Shapes = goog.require('myphysicslab.lab.engine2D.Shapes');
const TabLayout = goog.require('myphysicslab.sims.common.TabLayout');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const Walls = goog.require('myphysicslab.lab.engine2D.Walls');

/** Simulation of a chain of rigid bodies.

This app has a {@link #config} method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

Parameters Created
------------------
+ ParameterNumber named `NUM_LINKS`, see {@link #setNumLinks}.

+ ParameterBoolean named `WALLS`, see {@link #setWalls}

+ ParameterBoolean named `EXTRA_BODY`, see {@link #setExtraBody}

+ ParameterBoolean named `FIXED_LEFT`, see {@link #setFixedLeft}

+ ParameterBoolean named `FIXED_RIGHT`, see {@link #setFixedRight}

+ ParameterNumber named `FIXED_LEFT_X`, see {@link #setFixedLeftX}.

+ ParameterNumber named `BLOCK_LENGTH`, see {@link #setBlockLength}.

+ ParameterNumber named `BLOCK_WIDTH`, see {@link #setBlockWidth}.

*/
class ChainApp extends Engine2DApp {
/**
* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids) {
  var simRect = new DoubleRect(-12, -12, 12, 12);
  var sim = new ContactSim();
  var advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  /** @type {!ContactSim} */
  this.mySim = sim;
  /** @type {boolean}
  * @private
  */
  this.debug_ = false;
  this.mySim.setShowForces(true);
  // Important to stop joints from drifting apart, otherwise energy is not stable.
  // alternative: could use CollisionAdvance.setJointSmallImpacts(true)
  this.mySim.setExtraAccel(ExtraAccel.VELOCITY_JOINTS);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  /** @type {!GravityLaw} */
  this.gravityLaw = new GravityLaw(4, this.simList);
  this.elasticity.setElasticity(0.8);
  /** @type {!ChainConfig.options} */
  this.options = {
      wallPivotX: -5,
      wallPivotY: 4,
      fixedLeft: true,
      fixedRight: true,
      blockWidth: 1.0,
      blockHeight: 3.0,
      numLinks: 7
    };
  /** @type {boolean} */
  this.extraBody = true;
  /** @type {boolean} */
  this.walls = true;
  /** @type {number} */
  this.wallWidth = this.simView.getSimRect().getWidth();

  this.addPlaybackControls();
  /** @type {!ParameterBoolean} */
  var pb;
  /** @type {!ParameterNumber} */
  var pn;
  this.addParameter(pn = new ParameterNumber(this, ChainConfig.en.NUM_LINKS,
      ChainConfig.i18n.NUM_LINKS,
      goog.bind(this.getNumLinks, this), goog.bind(this.setNumLinks, this))
      .setDecimalPlaces(0));
  this.addControl(new NumericControl(pn));

  this.addParameter(pb = new ParameterBoolean(this, ChainConfig.en.WALLS,
      ChainConfig.i18n.WALLS,
      goog.bind(this.getWalls, this), goog.bind(this.setWalls, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, ChainConfig.en.WALL_WIDTH,
      ChainConfig.i18n.WALL_WIDTH,
      goog.bind(this.getWallWidth, this), goog.bind(this.setWallWidth, this)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pb = new ParameterBoolean(this, ChainConfig.en.EXTRA_BODY,
      ChainConfig.i18n.EXTRA_BODY,
      goog.bind(this.getExtraBody, this), goog.bind(this.setExtraBody, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, ChainConfig.en.FIXED_LEFT,
      ChainConfig.i18n.FIXED_LEFT,
      goog.bind(this.getFixedLeft, this), goog.bind(this.setFixedLeft, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb = new ParameterBoolean(this, ChainConfig.en.FIXED_RIGHT,
      ChainConfig.i18n.FIXED_RIGHT,
      goog.bind(this.getFixedRight, this), goog.bind(this.setFixedRight, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn = new ParameterNumber(this, ChainConfig.en.FIXED_LEFT_X,
      ChainConfig.i18n.FIXED_LEFT_X,
      goog.bind(this.getFixedLeftX, this), goog.bind(this.setFixedLeftX, this))
      .setLowerLimit(Util.NEGATIVE_INFINITY));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, ChainConfig.en.BLOCK_LENGTH,
      ChainConfig.i18n.BLOCK_LENGTH,
      goog.bind(this.getBlockLength, this), goog.bind(this.setBlockLength, this)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn = new ParameterNumber(this, ChainConfig.en.BLOCK_WIDTH,
      ChainConfig.i18n.BLOCK_WIDTH,
      goog.bind(this.getBlockWidth, this), goog.bind(this.setBlockWidth, this)));
  this.addControl(new NumericControl(pn));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  if (0 == 1) {
    // Demonstration: Force the graph's simRect to match the simView.
    // Note: the screenRect is different between graphCanvas and simCanvas,
    // so they won't be identical.  To fix that you can do:
    this.layout.graphCanvas.setScreenRect(this.layout.simCanvas.getScreenRect());
    this.graph.displayGraph.setScreenRect(this.layout.simCanvas.getScreenRect());
    // this totally disables the AutoScale
    this.graph.autoScale.setEnabled(false);
    // Note that you can still use the pan-zoom controls on the graph, but
    // they are overridden whenever you pan-zoom the simView.
    var matcher = new GenericObserver(this.simView,
      goog.bind(function(evt) {
        if (evt.nameEquals(LabView.SIM_RECT_CHANGED)) {
          this.graph.view.setSimRect(this.simView.getSimRect());
        }
      }, this), 'ensure graph\'s simRect matches simView');
    this.graph.view.setSimRect(this.simView.getSimRect());
  }

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  this.graphSetup(this.mySim.getBody('chain-2'));
};

/** @override */
toString() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + super.toString();
};

/** @override */
getClassName() {
  return 'ChainApp';
};

/** @override */
defineNames(myName) {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('ChainConfig|ChainApp|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
getSubjects() {
  var subjects = super.getSubjects();
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/**
* @return {undefined}
*/
config() {
  if (this.debug_) {
    // show names of objects
    this.rbo.protoPolygon.setNameFont('10pt sans-serif');
  }
  this.rbo.protoPolygon.setFillStyle('rgba(255,255,255,0.5)');
  this.rbo.protoPolygon.setStrokeStyle('black');
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  this.advance.reset();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  var r = ChainConfig.makeChain(this.mySim, this.options);
  if (this.extraBody) {
    var block = Shapes.makeBlock(1, 3, ChainConfig.en.EXTRA_BODY,
        ChainConfig.i18n.EXTRA_BODY);
    block.setPosition(new Vector(-4,  -4));
    this.mySim.addBody(block);
    this.displayList.findShape(block).setFillStyle('blue');
    r = r.union(block.getBoundsWorld());
  }
  if (this.walls) {
    /* ensure walls are wide apart enough to contain chain and extra body */
    r = r.scale(1.1);
    var wr = DoubleRect.makeCentered(Vector.ORIGIN, this.wallWidth, this.wallWidth);
    var zel = Walls.make2(this.mySim, wr.union(r));
    this.gravityLaw.setZeroEnergyLevel(zel);
  }
  this.mySim.setElasticity(elasticity);
  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
};

/**
* @return {number}
*/
getNumLinks() {
  return this.options.numLinks;
};

/**
* @param {number} value
*/
setNumLinks(value) {
  this.options.numLinks = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.NUM_LINKS);
};

/**
* @return {boolean}
*/
getWalls() {
  return this.walls;
};

/**
* @param {boolean} value
*/
setWalls(value) {
  this.walls = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.WALLS);
};

/**
* @return {number}
*/
getWallWidth() {
  return this.wallWidth;
};

/**
* @param {number} value
*/
setWallWidth(value) {
  this.wallWidth = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.WALL_WIDTH);
};

/**
* @return {boolean}
*/
getExtraBody() {
  return this.extraBody;
};

/**
* @param {boolean} value
*/
setExtraBody(value) {
  this.extraBody = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.EXTRA_BODY);
};

/**
* @return {boolean}
*/
getFixedLeft() {
  return this.options.fixedLeft;
};

/**
* @param {boolean} value
*/
setFixedLeft(value) {
  this.options.fixedLeft = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.FIXED_LEFT);
};

/**
* @return {boolean}
*/
getFixedRight() {
  return this.options.fixedRight;
};

/**
* @param {boolean} value
*/
setFixedRight(value) {
  this.options.fixedRight = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.FIXED_RIGHT);
};

/**
* @return {number}
*/
getFixedLeftX() {
  return this.options.wallPivotX;
};

/**
* @param {number} value
*/
setFixedLeftX(value) {
  this.options.wallPivotX = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.FIXED_LEFT_X);
};

/**
* @return {number}
*/
getFixedLeftY() {
  return this.options.wallPivotY;
};

/**
* @param {number} value
*/
setFixedLeftY(value) {
  this.options.wallPivotY = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.FIXED_LEFT_Y);
};

/**
* @return {number}
*/
getBlockLength() {
  return this.options.blockHeight;
};

/**
* @param {number} value
*/
setBlockLength(value) {
  this.options.blockHeight = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.BLOCK_LENGTH);
};

/**
* @return {number}
*/
getBlockWidth() {
  return this.options.blockWidth;
};

/**
* @param {number} value
*/
setBlockWidth(value) {
  this.options.blockWidth = value;
  this.config();
  this.broadcastParameter(ChainConfig.en.BLOCK_WIDTH);
};

} // end class

/**
* @param {!TabLayout.elementIds} elem_ids
* @return {!ChainApp}
*/
function makeChainApp(elem_ids) {
  return new ChainApp(elem_ids);
};
goog.exportSymbol('makeChainApp', makeChainApp);

exports = ChainApp;
