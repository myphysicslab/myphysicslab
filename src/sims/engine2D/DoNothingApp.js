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

goog.provide('myphysicslab.sims.engine2D.DoNothingApp');

goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.engine2D.ExtraAccel');
goog.require('myphysicslab.lab.engine2D.JointUtil');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.ConstantForceLaw');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.Force');
goog.require('myphysicslab.lab.model.ForceLaw');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.engine2D.RigidBodyObserver');
goog.require('myphysicslab.sims.engine2D.RotatingTestForce');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var CheckBoxControl = lab.controls.CheckBoxControl;
var ChoiceControl = lab.controls.ChoiceControl;
var CollisionAdvance = lab.model.CollisionAdvance;
var CommonControls = sims.common.CommonControls;
var ContactSim = lab.engine2D.ContactSim;
var ConstantForceLaw = lab.model.ConstantForceLaw;
var CoordType = lab.model.CoordType;
var DampingLaw = lab.model.DampingLaw;
var DoubleRect = lab.util.DoubleRect;
var Engine2DApp = sims.engine2D.Engine2DApp;
var ExtraAccel = lab.engine2D.ExtraAccel;
var Force = lab.model.Force;
var ForceLaw = lab.model.ForceLaw;
var GenericObserver = lab.util.GenericObserver;
var JointUtil = lab.engine2D.JointUtil;
var NumericControl = lab.controls.NumericControl;
var ParameterBoolean = lab.util.ParameterBoolean;
var ParameterNumber = lab.util.ParameterNumber;
var RigidBodyObserver = sims.engine2D.RigidBodyObserver;
var RotatingTestForce = sims.engine2D.RotatingTestForce;
var Shapes = myphysicslab.lab.engine2D.Shapes;
var TabLayout = sims.common.TabLayout;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;

/** Simulation of the Do Nothing Grinder, which consists of two shuttle
blocks, each moving in its own groove, and a handle connects the shuttles. You can move
the shuttles by pulling on the handle.

This is a strong test of the physics engine in ComputeForces. The contacts are very
redundant, especially when a shuttle straddles the middle point.

This app has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

@todo  Make a control for magnitude of handle force.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
sims.engine2D.DoNothingApp = function(elem_ids) {
  var simRect = new DoubleRect(-6, -6, 6, 6);
  /** @type {!ContactSim} */
  this.mySim = new ContactSim();
  this.mySim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE);
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.rbo.protoFixedPolygon.setFillStyle('rgb(240,240,240)');
  this.mySim.setShowForces(false);
  this.elasticity.setElasticity(0.8);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(0.1, 0.15, this.simList);

  /**  Whether there is slack in the fit of shuttles in the grooves.
  * @type {boolean}
  */
  this.tightFit = true;
  /** @type {number} */
  this.handleForce = 0;
  /** @type {number} */
  this.rotateRate = 0.3;
  /** @type {boolean} */
  this.extraBlock = false;

  this.addPlaybackControls();
  /** @type {!ParameterBoolean} */
  var pb;
  /** @type {!ParameterNumber} */
  var pn;
  this.addParameter(pb = new ParameterBoolean(this, DoNothingApp.en.TIGHT_FIT,
      DoNothingApp.i18n.TIGHT_FIT,
      goog.bind(this.getTightFit, this), goog.bind(this.setTightFit, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb= new ParameterBoolean(this, DoNothingApp.en.EXTRA_BLOCK,
      DoNothingApp.i18n.EXTRA_BLOCK,
      goog.bind(this.getExtraBlock, this), goog.bind(this.setExtraBlock, this)));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn=new ParameterNumber(this, DoNothingApp.en.HANDLE_FORCE,
      DoNothingApp.i18n.HANDLE_FORCE,
      goog.bind(this.getHandleForce, this), goog.bind(this.setHandleForce, this)));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn= new ParameterNumber(this, DoNothingApp.en.ROTATE_RATE,
      DoNothingApp.i18n.ROTATE_RATE,
      goog.bind(this.getRotateRate, this), goog.bind(this.setRotateRate, this)));
  this.addControl(new NumericControl(pn));

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));
  this.addStandardControls();

  this.makeEasyScript();
  this.addURLScriptButton();
  this.config();
  // initial conditions with the mechanism moving at a medium velocity.
  this.terminal.eval('HANDLE_X_POSITION=1.9216618122934424;HANDLE_X_VELOCITY=6.979809406442353;HANDLE_Y_POSITION=0.2943297250353547;HANDLE_Y_VELOCITY=-0.9426842022640329;HANDLE_ANGLE=25.88819308072886;HANDLE_ANGULAR_VELOCITY=3.424130668635809;SHUTTLE1_X_POSITION=0.001990449861582921;SHUTTLE1_X_VELOCITY=0.0003366291043680146;SHUTTLE1_Y_POSITION=2.3326774474691243;SHUTTLE1_Y_VELOCITY=-7.5158036361020635;SHUTTLE1_ANGULAR_VELOCITY=2.0530580453163819e-16;SHUTTLE2_X_POSITION=2.196971562128215;SHUTTLE2_X_VELOCITY=7.9807707907250105;SHUTTLE2_Y_POSITION=0.0019999999991728978;SHUTTLE2_Y_VELOCITY=3.1722152763666444e-11;SHUTTLE2_ANGULAR_VELOCITY=2.2709675909489905e-15;');
  this.graphSetup();
};
var DoNothingApp = sims.engine2D.DoNothingApp;
goog.inherits(DoNothingApp, Engine2DApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DoNothingApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', dampingLaw: '+this.dampingLaw.toStringShort()
        + DoNothingApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
DoNothingApp.prototype.getClassName = function() {
  return 'DoNothingApp';
};

/** @inheritDoc */
DoNothingApp.prototype.defineNames = function(myName) {
  DoNothingApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('dampingLaw',
       myName);
  this.terminal.addRegex('DoNothingApp|Engine2DApp',
       'myphysicslab.sims.engine2D', /*addToVars=*/false);
};

/** @inheritDoc */
DoNothingApp.prototype.getSubjects = function() {
  var subjects = DoNothingApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, subjects);
};

/**
* @return {undefined}
*/
DoNothingApp.prototype.config = function() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  this.advance.reset();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  DoNothingApp.setup(this.mySim, this.tightFit);
  this.displayList.findShape(DoNothingApp.en.HANDLE)
      .setFillStyle('rgba(51,204,255,0.5)').setZIndex(2);
  this.displayList.findShape(DoNothingApp.en.SHUTTLE+1)
      .setFillStyle('rgb(200,200,200)');
  this.displayList.findShape(DoNothingApp.en.SHUTTLE+2)
      .setFillStyle('rgb(200,200,200)');
  if (this.extraBlock) {
    // add an optional extra free block
    var block = Shapes.makeBlock(1, 3, DoNothingApp.en.EXTRA_BLOCK,
        DoNothingApp.i18n.EXTRA_BLOCK);
    block.setPosition(new Vector(-5.5,  -4));
    this.mySim.addBody(block);
    this.displayList.findShape(block).setFillStyle('blue');
    // the free block does not collide with fixed blocks
    goog.array.forEach(this.mySim.getBodies(), function(bod, index, array) {
        if (bod.getName().match(/^FIXED.*/) != null) {
          bod.addNonCollide([block]);
          block.addNonCollide([bod]);
        }
      });
  }
  if (this.handleForce > 0) {
    // add a force to the handle
    var handle = this.mySim.getBody('handle');
    /** @type {!ForceLaw} */
    var f_law;
    if (this.rotateRate > 0) {
      // rotating handle force; good for long term test
      f_law = new RotatingTestForce(this.mySim, handle,
          /*location_body=*/new Vector(0, -3),
          /*magnitude=*/this.handleForce, /*rotation_rate=*/this.rotateRate);
    } else {
      // force is constant direction relative to handle; results in high speeds
      var f = new Force('turning', handle,
          /*location=*/new Vector(0, -3), CoordType.BODY,
          /*direction=*/new Vector(this.handleForce, 0), CoordType.BODY);
      f_law = new ConstantForceLaw(f);
    }
    this.mySim.addForceLaw(f_law);
  }
  this.mySim.setElasticity(elasticity);
  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.easyScript.update();
};

/**  Makes the Do Nothing Grinder and adds it to the given simulation.
There are four fixed 'groove' blocks which form the channels that the shuttles
move in.  There are two shuttles, one in the horizontal groove, one in the
vertical groove.  A handle connects between the two shuttles with joints.
The handle does not interact with the fixed groove blocks.
@param {!ContactSim} sim  the simulation to add to
@param {boolean} tightFit  true means that the fixed grooves are spaced so that the
  shuttles are in constant contact at all four corners;  false gives a little
  wiggle room for the shuttles.
*/
DoNothingApp.setup = function(sim, tightFit) {
  var handle = Shapes.makeBlock(0.8, 6.2, DoNothingApp.en.HANDLE,
      DoNothingApp.i18n.HANDLE);
  handle.setMass(0.5);
  handle.setDragPoints([new Vector(0, -2.8)]);
  sim.addBody(handle);
  // 2 shuttle pieces
  var shuttle_width = tightFit ? 1.0 : 0.98;
  var s1 = Shapes.makeBlock(shuttle_width, 2.5, DoNothingApp.en.SHUTTLE+1,
      DoNothingApp.i18n.SHUTTLE+1);
  s1.setPosition(new Vector(0,  2.0),  Math.PI);
  sim.addBody(s1);
  var s2 = Shapes.makeBlock(shuttle_width, 2.5, DoNothingApp.en.SHUTTLE+2,
      DoNothingApp.i18n.SHUTTLE+2);
  s2.setPosition(new Vector(-2.5,  0),  Math.PI/2);
  sim.addBody(s2);
  // create 4 fixed blocks that form the grooves which the shuttles move thru
  for (var i=0; i<2; i++) {
    for (var j=0; j<2; j++) {
      var size = 4;
      var id = j + 2*i;
      var p = Shapes.makeBlock(size, size, DoNothingApp.en.FIXED_BLOCK+id,
          DoNothingApp.i18n.FIXED_BLOCK+id);
      var d = 0.507 + size/2;
      p.setPosition(new Vector(d*(1 - 2*i), d*(1 - 2*j)), 0);
      p.setMass(UtilityCore.POSITIVE_INFINITY);
      sim.addBody(p);
      // the handle does not collide with fixed blocks
      handle.addNonCollide([p]);
      p.addNonCollide([handle]);
    }
  }
  // Position the handle to connect the 2 shuttle pieces.
  var p1 = s1.getPosition();
  var p2 = s2.getPosition();
  var handleLength = p1.distanceTo(p2);
  //console.log('p1 to p2 '+NF5(p1.distanceTo(p2)));
  var a = Math.atan(-p1.getY()/p2.getX());
  //console.log('a '+NF5(a));
  handle.setAngle(-Math.PI/2 + a);
  JointUtil.attachRigidBody(sim,
    s1,  /*attach point on s1, body coords=*/new Vector(0, 0),
    handle,  /*attach point on handle, body coords=*/new Vector(0, 2.8),
    /*normalType=*/CoordType.BODY
    );
  JointUtil.attachRigidBody(sim,
    s2, /*attach point on s2, body coords=*/new Vector(0, 0),
    handle, /*attach point on handle, body coords*/new Vector(0, 2.8 - handleLength),
    /*normalType=*/CoordType.BODY
    );
  sim.alignConnectors();
};

/** @return {number} */
DoNothingApp.prototype.getHandleForce = function() {
  return this.handleForce;
};

/** @param {number} value */
DoNothingApp.prototype.setHandleForce = function(value) {
  this.handleForce = value;
  this.config();
  this.broadcastParameter(DoNothingApp.en.HANDLE_FORCE);
};

/** @return {number} */
DoNothingApp.prototype.getRotateRate = function() {
  return this.rotateRate;
};

/** @param {number} value */
DoNothingApp.prototype.setRotateRate = function(value) {
  this.rotateRate = value;
  this.config();
  this.broadcastParameter(DoNothingApp.en.ROTATE_RATE);
};

/** @return {boolean} */
DoNothingApp.prototype.getTightFit = function() {
  return this.tightFit;
};

/** @param {boolean} value */
DoNothingApp.prototype.setTightFit = function(value) {
  this.tightFit = value;
  this.config();
  this.broadcastParameter(DoNothingApp.en.TIGHT_FIT);
};

/** @return {boolean} */
DoNothingApp.prototype.getExtraBlock = function() {
  return this.extraBlock;
};

/** @param {boolean} value */
DoNothingApp.prototype.setExtraBlock = function(value) {
  this.extraBlock = value;
  this.config();
  this.broadcastParameter(DoNothingApp.en.EXTRA_BLOCK);
};

/** Set of internationalized strings.
@typedef {{
  HANDLE_FORCE: string,
  ROTATE_RATE: string,
  TIGHT_FIT: string,
  EXTRA_BLOCK: string,
  HANDLE: string,
  SHUTTLE: string,
  FIXED_BLOCK: string
  }}
*/
DoNothingApp.i18n_strings;

/**
@type {DoNothingApp.i18n_strings}
*/
DoNothingApp.en = {
  HANDLE_FORCE: 'handle force',
  ROTATE_RATE: 'force rotation rate',
  TIGHT_FIT: 'tight fit',
  EXTRA_BLOCK: 'extra block',
  HANDLE: 'handle',
  SHUTTLE: 'shuttle',
  FIXED_BLOCK: 'fixed block'
};

/**
@private
@type {DoNothingApp.i18n_strings}
*/
DoNothingApp.de_strings = {
  HANDLE_FORCE: 'Griff Kraft',
  ROTATE_RATE: 'Kraft, Rotation Tempo',
  TIGHT_FIT: 'exakt passend',
  EXTRA_BLOCK: 'extra Block',
  HANDLE: 'Griff',
  SHUTTLE: 'Shuttle',
  FIXED_BLOCK: 'Festblock'
};

/** Set of internationalized strings.
@type {DoNothingApp.i18n_strings}
*/
DoNothingApp.i18n = goog.LOCALE === 'de' ? DoNothingApp.de_strings :
    DoNothingApp.en;

}); // goog.scope
