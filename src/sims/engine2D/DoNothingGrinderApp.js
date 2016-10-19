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

goog.provide('myphysicslab.sims.engine2D.DoNothingGrinderApp');

goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.engine2D.ExtraAccel');
goog.require('myphysicslab.lab.engine2D.Joint');
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
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.engine2D.RigidBodyObserver');
goog.require('myphysicslab.sims.engine2D.RotatingTestForce');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.TabLayout');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var CheckBoxControl = lab.controls.CheckBoxControl;
var ChoiceControl = lab.controls.ChoiceControl;
var CollisionAdvance = lab.model.CollisionAdvance;
var CommonControls = sims.layout.CommonControls;
var ContactSim = lab.engine2D.ContactSim;
var CoordType = lab.model.CoordType;
var DampingLaw = lab.model.DampingLaw;
var DisplayShape = lab.view.DisplayShape;
var DoubleRect = lab.util.DoubleRect;
var Engine2DApp = sims.engine2D.Engine2DApp;
var ExtraAccel = lab.engine2D.ExtraAccel;
var GenericObserver = lab.util.GenericObserver;
var Joint = myphysicslab.lab.engine2D.Joint;
var NumericControl = lab.controls.NumericControl;
var ParameterBoolean = lab.util.ParameterBoolean;
var ParameterNumber = lab.util.ParameterNumber;
var RigidBodyObserver = sims.engine2D.RigidBodyObserver;
var RotatingTestForce = sims.engine2D.RotatingTestForce;
var Shapes = myphysicslab.lab.engine2D.Shapes;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;

/** Simulation of the Do Nothing Grinder, which consists of two shuttle
blocks, each moving in its own groove, and a handle connects the shuttles. You can move
the shuttles by pulling on the handle.

This is a strong test of the physics engine in ComputeForces. The contacts are very
redundant, especially when a shuttle straddles the middle point.

This sim has a config() method which looks at a set of options
and rebuilds the simulation accordingly. UI controls are created to change the options.

@todo  Make a control for magnitude of handle force.

* @param {!sims.layout.TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
sims.engine2D.DoNothingGrinderApp = function(elem_ids) {
  var simRect = new DoubleRect(-6, -6, 6, 6);
  this.mySim = new ContactSim();
  this.mySim.setShowForces(true);
  this.mySim.setExtraAccel(ExtraAccel.VELOCITY_AND_DISTANCE);
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.elasticity.setElasticity(0.8);
  /** @type {!lab.model.DampingLaw} */
  this.dampingLaw = new DampingLaw(0.1, 0.15, this.simList);

  /**  Whether there is slack in the fit of shuttles in the grooves.
  * @type {boolean}
  */
  this.tightFit = true;
  /** @type {number} */
  this.handleForce = 2;
  /** @type {number} */
  this.rotateRate = 0.3;
  /** @type {boolean} */
  this.extraBlock = false;

  this.addPlaybackControls();
  /** @type {!lab.util.ParameterBoolean} */
  var pb;
  /** @type {!lab.util.ParameterNumber} */
  var pn;
  this.addParameter(pb = new ParameterBoolean(this, DoNothingGrinderApp.en.TIGHT_FIT,
      DoNothingGrinderApp.i18n.TIGHT_FIT,
      this.getTightFit, this.setTightFit));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pb= new ParameterBoolean(this, DoNothingGrinderApp.en.EXTRA_BLOCK,
      DoNothingGrinderApp.i18n.EXTRA_BLOCK,
      this.getExtraBlock, this.setExtraBlock));
  this.addControl(new CheckBoxControl(pb));

  this.addParameter(pn=new ParameterNumber(this, DoNothingGrinderApp.en.HANDLE_FORCE,
      DoNothingGrinderApp.i18n.HANDLE_FORCE,
      this.getHandleForce, this.setHandleForce));
  this.addControl(new NumericControl(pn));

  this.addParameter(pn= new ParameterNumber(this, DoNothingGrinderApp.en.ROTATE_RATE,
      DoNothingGrinderApp.i18n.ROTATE_RATE,
      this.getRotateRate, this.setRotateRate));
  this.addControl(new NumericControl(pn));

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));
  this.addStandardControls();

  this.makeScriptParser();
  this.addURLScriptButton();
  this.config();
  this.graphSetup();
};
var DoNothingGrinderApp = sims.engine2D.DoNothingGrinderApp;
goog.inherits(DoNothingGrinderApp, Engine2DApp);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  DoNothingGrinderApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', dampingLaw: '+this.dampingLaw.toStringShort()
        + DoNothingGrinderApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
DoNothingGrinderApp.prototype.getClassName = function() {
  return 'DoNothingGrinderApp';
};

/** @inheritDoc */
DoNothingGrinderApp.prototype.defineNames = function(myName) {
  DoNothingGrinderApp.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('dampingLaw',
       myName);
  this.terminal.addRegex('DoNothingGrinderApp|Engine2DApp',
       'myphysicslab.sims.engine2D', /*addToVars=*/false);
};

/** @inheritDoc */
DoNothingGrinderApp.prototype.getSubjects = function() {
  var subjects = DoNothingGrinderApp.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, subjects);
};

/**
* @return {undefined}
*/
DoNothingGrinderApp.prototype.config = function() {
  var elasticity = this.elasticity.getElasticity();
  this.mySim.cleanSlate();
  this.advance.reset();
  this.mySim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.mySim.getSimList());
  DoNothingGrinderApp.setup(this.mySim, this.tightFit);
  DisplayShape.nameColor = 'gray';
  DisplayShape.nameFont = '12pt sans-serif';
  DisplayShape.nameRotate = 0;
  if (this.extraBlock) {
    // add an optional extra free block
    var block = Shapes.makeBlock(1, 3, DoNothingGrinderApp.en.EXTRA_BLOCK,
        DoNothingGrinderApp.i18n.EXTRA_BLOCK);
    block.setPosition(new Vector(-5.5,  -4));
    DisplayShape.fillStyle = 'blue';
    this.mySim.addBody(block);
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
    /** @type {!lab.model.ForceLaw} */
    var f_law;
    if (this.rotateRate > 0) {
      // rotating handle force; good for long term test
      f_law = new RotatingTestForce(this.mySim, handle,
          /*location_body=*/new Vector(0, -3),
          /*magnitude=*/this.handleForce, /*rotation_rate=*/this.rotateRate);
    } else {
      // force is constant direction relative to handle; results in high speeds
      var f = new myphysicslab.lab.model.Force('turning', handle,
          /*location=*/new Vector(0, -3), CoordType.BODY,
          /*direction=*/new Vector(this.handleForce, 0), CoordType.BODY);
      f_law = new myphysicslab.lab.model.ConstantForceLaw(f);
    }
    this.mySim.addForceLaw(f_law);
  }
  this.mySim.setElasticity(elasticity);
  this.mySim.getVarsList().setTime(0);
  this.mySim.saveInitialState();
  this.clock.setTime(0);
  this.clock.setRealTime(0);
  this.scriptParser.update();
};

/**  Makes the Do Nothing Grinder and adds it to the given simulation.
There are four fixed 'groove' blocks which form the channels that the shuttles
move in.  There are two shuttles, one in the horizontal groove, one in the
vertical groove.  A handle connects between the two shuttles with joints.
The handle does not interact with the fixed groove blocks.
@param {!myphysicslab.lab.engine2D.ContactSim} sim  the simulation to add to
@param {boolean} tightFit  true means that the fixed grooves are spaced so that the
  shuttles are in constant contact at all four corners;  false gives a little
  wiggle room for the shuttles.
*/
DoNothingGrinderApp.setup = function(sim, tightFit) {
  var handle = Shapes.makeBlock(0.8, 6.2, DoNothingGrinderApp.en.HANDLE,
      DoNothingGrinderApp.i18n.HANDLE);
  handle.setMass(0.5);
  handle.setDragPoints([new Vector(0, -2.8)]);
  DisplayShape.fillStyle = 'rgba(255,255,255,0.333)';
  DisplayShape.strokeStyle = 'gray';
  var saveZIndex = RigidBodyObserver.zIndex;
  RigidBodyObserver.zIndex = 2;
  sim.addBody(handle);
  // 2 shuttle pieces
  var shuttle_width = tightFit ? 1.0 : 0.98;
  var s1 = Shapes.makeBlock(shuttle_width, 2.5, DoNothingGrinderApp.en.SHUTTLE+1,
      DoNothingGrinderApp.i18n.SHUTTLE+1);
  s1.setPosition(new Vector(0,  2.0),  Math.PI);
  DisplayShape.fillStyle = 'lightGray';
  DisplayShape.strokeStyle = '';
  RigidBodyObserver.zIndex = 1;
  sim.addBody(s1);
  var s2 = Shapes.makeBlock(shuttle_width, 2.5, DoNothingGrinderApp.en.SHUTTLE+2,
      DoNothingGrinderApp.i18n.SHUTTLE+2);
  s2.setPosition(new Vector(-2.5,  0),  Math.PI/2);
  sim.addBody(s2);
  // create 4 fixed blocks that form the grooves which the shuttles move thru
  RigidBodyObserver.zIndex = 0;
  for (var i=0; i<2; i++) {
    for (var j=0; j<2; j++) {
      var size = 4;
      var id = j + 2*i;
      var p = Shapes.makeBlock(size, size, DoNothingGrinderApp.en.FIXED_BLOCK+id,
          DoNothingGrinderApp.i18n.FIXED_BLOCK+id);
      var d = 0.507 + size/2;
      p.setPosition(new Vector(d*(1 - 2*i), d*(1 - 2*j)), 0);
      p.setMass(UtilityCore.POSITIVE_INFINITY);
      DisplayShape.strokeStyle = '';
      DisplayShape.fillStyle = 'rgb(240,240,240)';
      DisplayShape.strokeStyle = '';
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
  Joint.attachRigidBody(sim,
    s1,  /*attach point on s1, body coords=*/new Vector(0, 0),
    handle,  /*attach point on handle, body coords=*/new Vector(0, 2.8),
    /*normalType=*/CoordType.BODY
    );
  Joint.attachRigidBody(sim,
    s2, /*attach point on s2, body coords=*/new Vector(0, 0),
    handle, /*attach point on handle, body coords*/new Vector(0, 2.8 - handleLength),
    /*normalType=*/CoordType.BODY
    );
  sim.alignConnectors();
  RigidBodyObserver.zIndex = saveZIndex;
};

/** @return {number} */
DoNothingGrinderApp.prototype.getHandleForce = function() {
  return this.handleForce;
};

/** @param {number} value */
DoNothingGrinderApp.prototype.setHandleForce = function(value) {
  this.handleForce = value;
  this.config();
  this.broadcastParameter(DoNothingGrinderApp.en.HANDLE_FORCE);
};

/** @return {number} */
DoNothingGrinderApp.prototype.getRotateRate = function() {
  return this.rotateRate;
};

/** @param {number} value */
DoNothingGrinderApp.prototype.setRotateRate = function(value) {
  this.rotateRate = value;
  this.config();
  this.broadcastParameter(DoNothingGrinderApp.en.ROTATE_RATE);
};

/** @return {boolean} */
DoNothingGrinderApp.prototype.getTightFit = function() {
  return this.tightFit;
};

/** @param {boolean} value */
DoNothingGrinderApp.prototype.setTightFit = function(value) {
  this.tightFit = value;
  this.config();
  this.broadcastParameter(DoNothingGrinderApp.en.TIGHT_FIT);
};

/** @return {boolean} */
DoNothingGrinderApp.prototype.getExtraBlock = function() {
  return this.extraBlock;
};

/** @param {boolean} value */
DoNothingGrinderApp.prototype.setExtraBlock = function(value) {
  this.extraBlock = value;
  this.config();
  this.broadcastParameter(DoNothingGrinderApp.en.EXTRA_BLOCK);
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
DoNothingGrinderApp.i18n_strings;

/**
@type {DoNothingGrinderApp.i18n_strings}
*/
DoNothingGrinderApp.en = {
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
@type {DoNothingGrinderApp.i18n_strings}
*/
DoNothingGrinderApp.de_strings = {
  HANDLE_FORCE: 'Griff Kraft',
  ROTATE_RATE: 'Kraft, Rotation Tempo',
  TIGHT_FIT: 'exakt passend',
  EXTRA_BLOCK: 'extra Block',
  HANDLE: 'Griff',
  SHUTTLE: 'Shuttle',
  FIXED_BLOCK: 'Festblock'
};

/** Set of internationalized strings.
@type {DoNothingGrinderApp.i18n_strings}
*/
DoNothingGrinderApp.i18n = goog.LOCALE === 'de' ? DoNothingGrinderApp.de_strings :
    DoNothingGrinderApp.en;

}); // goog.scope
