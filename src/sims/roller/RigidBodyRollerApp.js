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

goog.provide('myphysicslab.sims.roller.RigidBodyRollerApp');

goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.engine2D.ExtraAccel');
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.engine2D.PathEndPoint');
goog.require('myphysicslab.lab.engine2D.PathJoint');
goog.require('myphysicslab.lab.engine2D.RigidBody');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.Scrim');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.FunctionVariable');
goog.require('myphysicslab.lab.model.NumericalPath');
goog.require('myphysicslab.lab.model.ParametricPath');
goog.require('myphysicslab.lab.model.Simulation');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.Memorizable');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayPath');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DrawingStyle');
goog.require('myphysicslab.lab.util.GenericMemo');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.roller.CardioidPath');
goog.require('myphysicslab.sims.roller.CirclePath');
goog.require('myphysicslab.sims.roller.FlatPath');
goog.require('myphysicslab.sims.roller.HumpPath');
goog.require('myphysicslab.sims.roller.LemniscatePath');
goog.require('myphysicslab.sims.roller.LoopTheLoopPath');
goog.require('myphysicslab.sims.roller.OvalPath');
goog.require('myphysicslab.sims.roller.PathObserver');
goog.require('myphysicslab.sims.roller.PathSelector');
goog.require('myphysicslab.sims.roller.HasPath');
goog.require('myphysicslab.sims.roller.SpiralPath');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var CardioidPath = sims.roller.CardioidPath;
var ChoiceControl = lab.controls.ChoiceControl;
var CirclePath = sims.roller.CirclePath;
var CollisionAdvance = lab.model.CollisionAdvance;
var CommonControls = sims.common.CommonControls;
var ContactSim = lab.engine2D.ContactSim;
var DampingLaw = lab.model.DampingLaw;
var DisplayPath = lab.view.DisplayPath;
var DisplayShape = lab.view.DisplayShape;
var DoubleRect = lab.util.DoubleRect;
var DrawingStyle = lab.view.DrawingStyle;
var Engine2DApp = sims.engine2D.Engine2DApp;
var FlatPath = sims.roller.FlatPath;
var FunctionVariable = lab.model.FunctionVariable;
var GenericMemo = lab.util.GenericMemo;
var GenericObserver = lab.util.GenericObserver;
var GravityLaw = lab.model.GravityLaw;
var HasPath = sims.roller.HasPath;
var HumpPath = sims.roller.HumpPath;
var LemniscatePath = sims.roller.LemniscatePath;
var LoopTheLoopPath = sims.roller.LoopTheLoopPath;
var NumericalPath = lab.model.NumericalPath;
var NumericControl = lab.controls.NumericControl;
var OvalPath = sims.roller.OvalPath;
var ParameterBoolean = lab.util.ParameterBoolean;
var ParameterNumber = lab.util.ParameterNumber;
var ParameterString = lab.util.ParameterString;
var ParametricPath = lab.model.ParametricPath;
var PathEndPoint = lab.engine2D.PathEndPoint;
var PathJoint = lab.engine2D.PathJoint;
var PathObserver = sims.roller.PathObserver;
var PathSelector = sims.roller.PathSelector;
var Polygon = lab.engine2D.Polygon;
var Scrim = lab.engine2D.Scrim;
var Shapes = lab.engine2D.Shapes;
var Simulation = lab.model.Simulation;
var SpiralPath = sims.roller.SpiralPath;
var TabLayout = sims.common.TabLayout;
var Util = lab.util.Util;
var Vector = lab.util.Vector;

/** Demonstrates a RigidBody connected to various 'roller coaster' paths by a PathJoint.

+ Adds PathEndPoints to Circle and Hump paths, as a demonstation of PathEndPoint.

+ Demonstrates disconnecting the block from path when the block reaches a certain point
on the Hump path.

+ Adds variables for distance and velocity as measured along the path, these are called
'path position' and 'path velocity' in English.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @implements {HasPath}
* @export
*/
myphysicslab.sims.roller.RigidBodyRollerApp = function(elem_ids) {
  var simRect = new DoubleRect(-6, -6, 6, 6);
  /** @type {!ContactSim} */
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.layout.simCanvas.setBackground('black');
  this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);
  this.elasticity.setElasticity(0.8);
  this.mySim.setShowForces(true);
  this.mySim.setExtraAccel(lab.engine2D.ExtraAccel.VELOCITY_JOINTS);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(/*damping=*/0, /*rotateRatio=*/0.15,
      this.simList);
  /** @type {!GravityLaw} */
  this.gravityLaw = new GravityLaw(3, this.simList);
  /** @type {?lab.util.Memorizable} */
  this.pathAction = null;
  /** @type {!Array<!ParametricPath>} **/
  this.paths = [
      new HumpPath(),
      new LoopTheLoopPath(),
      new CirclePath(3.0),
      new OvalPath(),
      new LemniscatePath(2.0),
      new CardioidPath(3.0),
      new SpiralPath(),
      new FlatPath()
  ];
  /** @type {!NumericalPath} */
  this.path = new NumericalPath(this.paths[2]);
  /** @type {!PathJoint} */
  this.pathJoint;
  /** @type {!PathSelector} */
  this.pathSelect = new PathSelector(this, this.paths);
  /** @type {!PathObserver} */
  this.pathObserver = new PathObserver(this.simList, this.simView,
      goog.bind(this.setSimRect, this), /*expansionFactor=*/1.5);
  /** @type {!Polygon} */
  this.block = Shapes.makeBlock(1, 3, RigidBodyRollerApp.en.BLOCK,
      RigidBodyRollerApp.i18n.BLOCK);

  /** Because one of the scenarios removes the pathJoint, this Observer
  * will add back the PathJoint when a RESET event occurs.
  * @type {?GenericObserver}
  */
  this.resetObserver = null;

  this.addPlaybackControls();
  /** @type {!ParameterNumber} */
  var pn;
  /** @type {!ParameterString} */
  var ps;
  ps = this.pathSelect.getParameterString(PathSelector.en.PATH);
  this.addControl(new ChoiceControl(ps));

  pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
  this.setPath(this.path);
  this.graphSetup();
};
var RigidBodyRollerApp = myphysicslab.sims.roller.RigidBodyRollerApp;
goog.inherits(RigidBodyRollerApp, Engine2DApp);

if (!Util.ADVANCED) {
  /** @inheritDoc */
  RigidBodyRollerApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', simList: '+this.simList.toStringShort()
        +', simView: '+this.simView.toStringShort()
        +', statusView: '+this.statusView.toStringShort()
        +', pathSelect: '+this.pathSelect
        +', pathObserver: '+this.pathObserver
        +', paths: [ '+this.paths+' ]'
        + RigidBodyRollerApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
RigidBodyRollerApp.prototype.getClassName = function() {
  return 'RigidBodyRollerApp';
};

/** @inheritDoc */
RigidBodyRollerApp.prototype.defineNames = function(myName) {
  RigidBodyRollerApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('block|paths|path|pathSelect|gravityLaw|dampingLaw',
       myName);
  this.terminal.addRegex('Engine2DApp',
       'myphysicslab.sims.engine2D', /*addToVars=*/false);
  this.terminal.addRegex('RigidBodyRollerApp|CardioidPath|CirclePath'
       +'|FlatPath|HumpPath|LemniscatePath|LoopTheLoopPath|OvalPath'
       +'|PathObserver|PathSelector|HasPath|SpiralPath',
       'myphysicslab.sims.engine2D', /*addToVars=*/false);
};

/** @inheritDoc */
RigidBodyRollerApp.prototype.getSubjects = function() {
  var subjects = RigidBodyRollerApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.pathSelect, this.gravityLaw, this.dampingLaw, subjects);
};

/** @inheritDoc */
RigidBodyRollerApp.prototype.graphSetup = function(body) {
  this.graph.line.setXVariable(10); // 10 = path distance
  this.graph.line.setYVariable(1); // 1 = kinetic energy
  this.timeGraph.line1.setYVariable(1);
  this.timeGraph.line2.setYVariable(2); // 2 = potential energy
};

/**
* @return {undefined}
*/
RigidBodyRollerApp.prototype.config = function() {
  goog.asserts.assert(goog.isDefAndNotNull(this.path));
  if (this.resetObserver != null) {
    this.resetObserver.disconnect();
    this.resetObserver = null;
  }
  if (this.pathAction != null) {
    this.simRun.removeMemo(this.pathAction);
    this.pathAction = null;
  }
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  this.advance.reset();
  this.mySim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.mySim.getSimList());
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  this.simList.add(this.path);
  this.block.setPosition(new Vector(-4,  4),  Math.PI/4);
  this.block.setVelocity(new Vector(0,  0),  0);
  this.mySim.addBody(this.block);
  this.displayList.findShape(this.block).setFillStyle('rgba(51,204,255,0.5)')
      .setDrawCenterOfMass(true).setDrawDragPoints(true);

  var attach = this.block.getDragPoints()[1];
  this.pathJoint = new PathJoint(this.path, this.block, attach);
  this.mySim.addConnector(this.pathJoint);
  this.mySim.alignConnectors();
  // add PathEndPoints to Circle and Hump paths, as demonstation of PathEndPoint.
  if (this.path.nameEquals(CirclePath.en.NAME)) {
    if (0 == 1) {
      // stop-point at 45 degrees southwest of center.
      var endPt = this.path.findNearestGlobal(new Vector(-2, -2));
      this.mySim.addConnector(new PathEndPoint('stop point', this.path, this.block,
        attach, endPt.p, /*upperLimit=*/true));
    }
    this.mySim.addConnector(new PathEndPoint('limit down', this.path, this.block,
      attach, this.path.getStartPValue(), /*upperLimit=*/false));
    this.mySim.addConnector(new PathEndPoint('limit up', this.path, this.block,
      attach, this.path.getFinishPValue(), /*upperLimit=*/true));
  } else if (this.path.nameEquals(HumpPath.en.NAME)) {
    this.mySim.addConnector(new PathEndPoint('limit down', this.path, this.block,
      attach, this.path.getStartPValue() + 0.1, /*upperLimit=*/false));
    this.mySim.addConnector(new PathEndPoint('limit up', this.path, this.block,
      attach, this.path.getFinishPValue() - 0.1, /*upperLimit=*/true));
    // This demonstrates disconnecting the block from path when the block reaches
    // a certain point on the path.
    var disconnectPt = 3*this.path.getFinishPValue()/4;
    this.pathAction = new GenericMemo(goog.bind(function() {
      var ppt = this.pathJoint.getPathPoint();
      if (ppt.p > disconnectPt) {
        // disconnect the block from the path
        this.mySim.removeConnector(this.pathJoint);
      }
    },this), 'disconnect block from path');
    this.simRun.addMemo(this.pathAction);
    // add a dummy joint to show where the 'disconnect block' happens
    var dpt = this.path.map_p_to_vector(disconnectPt);
    var dj = new PathJoint(this.path, Scrim.getScrim(), dpt);
    this.mySim.getSimList().add(dj);
    // Add back the PathJoint when a RESET event occurs.
    this.resetObserver = new GenericObserver(this.mySim, goog.bind(function(evt) {
      if (evt.nameEquals(Simulation.RESET)) {
        this.mySim.addConnector(this.pathJoint);
        this.mySim.alignConnectors();
      }
    },this), 'Add back PathJoint on RESET event');
  }
  // add variables that tell path distance & velocity
  var va = this.mySim.getVarsList();
  var varP = new FunctionVariable(va, RigidBodyRollerApp.en.PATH_POSITION,
      RigidBodyRollerApp.i18n.PATH_POSITION,
      goog.bind(function() {
        return this.pathJoint.getPathPoint().p;
      },this));
  va.addVariable(varP);
  var varPV = new FunctionVariable(va, RigidBodyRollerApp.en.PATH_VELOCITY,
      RigidBodyRollerApp.i18n.PATH_VELOCITY,
      goog.bind(function() {
        var ppt = this.pathJoint.getPathPoint();
        var vel = this.block.getVelocity(this.pathJoint.getAttach1());
        return vel.dotProduct(new Vector(ppt.slopeX, ppt.slopeY));
      },this));
  va.addVariable(varPV);
  this.mySim.setElasticity(elasticity);
  this.mySim.saveInitialState();
  this.easyScript.update();
};

/** @inheritDoc */
RigidBodyRollerApp.prototype.getPath = function() {
  return this.path;
};

/** @inheritDoc */
RigidBodyRollerApp.prototype.setPath = function(path) {
  this.path = path;
  this.config();
};

/**
@param {!DoubleRect} simRect
*/
RigidBodyRollerApp.prototype.setSimRect = function(simRect) {
  this.simRect = simRect;
  this.simView.setSimRect(simRect);
};

/** Set of internationalized strings.
@typedef {{
  BLOCK: string,
  PATH_POSITION: string,
  PATH_VELOCITY: string
  }}
*/
RigidBodyRollerApp.i18n_strings;

/**
@type {RigidBodyRollerApp.i18n_strings}
*/
RigidBodyRollerApp.en = {
  BLOCK: 'block',
  PATH_POSITION: 'path position',
  PATH_VELOCITY: 'path velocity'
};

/**
@private
@type {RigidBodyRollerApp.i18n_strings}
*/
RigidBodyRollerApp.de_strings = {
  BLOCK: 'Block',
  PATH_POSITION: 'Pfad Position',
  PATH_VELOCITY: 'Pfad Geschwindigkeit'
};

/** Set of internationalized strings.
@type {RigidBodyRollerApp.i18n_strings}
*/
RigidBodyRollerApp.i18n = goog.LOCALE === 'de' ? RigidBodyRollerApp.de_strings :
    RigidBodyRollerApp.en;

}); // goog.scope
