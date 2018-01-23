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

goog.provide('myphysicslab.sims.engine2D.DoublePendulum2App');

goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.engine2D.ContactSim');
goog.require('myphysicslab.lab.engine2D.JointUtil');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.engine2D.Scrim');
goog.require('myphysicslab.lab.engine2D.Shapes');
goog.require('myphysicslab.lab.engine2D.Walls');
goog.require('myphysicslab.lab.graph.AutoScale');
goog.require('myphysicslab.lab.graph.DisplayGraph');
goog.require('myphysicslab.lab.graph.GraphLine');
goog.require('myphysicslab.lab.model.CollisionAdvance');
goog.require('myphysicslab.lab.model.CoordType');
goog.require('myphysicslab.lab.model.DampingLaw');
goog.require('myphysicslab.lab.model.GravityLaw');
goog.require('myphysicslab.lab.util.AffineTransform');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.sims.common.CommonControls');
goog.require('myphysicslab.sims.common.TabLayout');
goog.require('myphysicslab.sims.engine2D.Engine2DApp');
goog.require('myphysicslab.sims.engine2D.SixThrusters');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

const AffineTransform = goog.module.get('myphysicslab.lab.util.AffineTransform');
const CheckBoxControl = goog.module.get('myphysicslab.lab.controls.CheckBoxControl');
const ChoiceControl = goog.module.get('myphysicslab.lab.controls.ChoiceControl');
const CollisionAdvance = goog.module.get('myphysicslab.lab.model.CollisionAdvance');
var CommonControls = sims.common.CommonControls;
const ContactSim = goog.module.get('myphysicslab.lab.engine2D.ContactSim');
const CoordType = goog.module.get('myphysicslab.lab.model.CoordType');
const DampingLaw = goog.module.get('myphysicslab.lab.model.DampingLaw');
const DisplayShape = goog.module.get('myphysicslab.lab.view.DisplayShape');
const DoubleRect = goog.module.get('myphysicslab.lab.util.DoubleRect');
var Engine2DApp = sims.engine2D.Engine2DApp;
const GravityLaw = goog.module.get('myphysicslab.lab.model.GravityLaw');
const JointUtil = goog.module.get('myphysicslab.lab.engine2D.JointUtil');
const NumericControl = goog.module.get('myphysicslab.lab.controls.NumericControl');
const ParameterNumber = goog.module.get('myphysicslab.lab.util.ParameterNumber');
const Polygon = goog.module.get('myphysicslab.lab.engine2D.Polygon');
const Scrim = goog.module.get('myphysicslab.lab.engine2D.Scrim');
const Shapes = goog.module.get('myphysicslab.lab.engine2D.Shapes');
var SixThrusters = sims.engine2D.SixThrusters;
var TabLayout = sims.common.TabLayout;
const ThrusterSet = goog.module.get('myphysicslab.lab.engine2D.ThrusterSet');
const Util = goog.module.get('myphysicslab.lab.util.Util');
const Vector = goog.module.get('myphysicslab.lab.util.Vector');
const Walls = goog.module.get('myphysicslab.lab.engine2D.Walls');

/** A simple example app using ContactSim, this shows two blocks
connected like a double pendulum, and a third free moving block.

DoublePendulum2App also demonstrates having an image inside a DisplayShape. It uses an
AffineTransform to rotate, scale, and position the image within the DisplayShape.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {Engine2DApp}
* @export
*/
sims.engine2D.DoublePendulum2App = function(elem_ids) {
  var simRect = new DoubleRect(-6, -6, 6, 6);
  /** @type {!ContactSim} */
  this.mySim = new ContactSim();
  var advance = new CollisionAdvance(this.mySim);
  Engine2DApp.call(this, elem_ids, simRect, this.mySim, advance);
  this.layout.simCanvas.setBackground('black');
  this.layout.simCanvas.setAlpha(CommonControls.SHORT_TRAILS);
  this.mySim.setShowForces(false);
  /** @type {!DampingLaw} */
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  this.mySim.addForceLaw(this.dampingLaw);
  /** @type {!GravityLaw} */
  this.gravityLaw = new GravityLaw(8, this.simList);
  this.mySim.addForceLaw(this.gravityLaw);

  /** @type {!Polygon} */
  this.block1 = Shapes.makeBlock(1, 3, DoublePendulum2App.en.BLOCK+1,
      DoublePendulum2App.i18n.BLOCK+1);
  this.block1.setPosition(new Vector(-1,  -1),  Math.PI/4);
  /** @type {!Polygon} */
  this.block2 = Shapes.makeBlock(1, 3, DoublePendulum2App.en.BLOCK+2,
      DoublePendulum2App.i18n.BLOCK+2);
  this.block2.setPosition(new Vector(0,  0),  0);
  /** @type {!Polygon} */
  this.block3 = Shapes.makeBlock(1, 3, DoublePendulum2App.en.BLOCK+3,
      DoublePendulum2App.i18n.BLOCK+3);
  this.block3.setPosition(new Vector(-4,  -4),  Math.PI/2);
  /** @type {!DisplayShape} */
  this.protoBlock = new DisplayShape().setStrokeStyle('lightGray')
      .setFillStyle('').setThickness(3);
  var b1 = new DisplayShape(this.block1, this.protoBlock);
  this.displayList.add(b1);
  this.mySim.addBody(this.block1);
  var b2 = new DisplayShape(this.block2, this.protoBlock);
  this.displayList.add(b2);
  this.mySim.addBody(this.block2);
  var b3 = new DisplayShape(this.block3, this.protoBlock).setStrokeStyle('orange');
  this.displayList.add(b3);
  this.mySim.addBody(this.block3);

  // demonstrate using an image with DisplayShape.
  var img = /** @type {!HTMLImageElement} */(document.getElementById('tipper'));
  if (goog.isObject(img)) {
    b3.setImage(img);
    var at = AffineTransform.IDENTITY;
    // See notes in DisplayShape:  the origin here is at top left corner
    // of bounding rectangle, and we are in semi-screen coords, except rotated
    // along with the body.  Kind of 'body-screen' coords.
    // Also, think of these happening in reverse order.
    at = at.scale(2.8, 2.8);
    at = at.translate(27, 20);
    at = at.rotate(Math.PI/2);
    b3.setImageAT(at);
    b3.setImageClip(false);
    b3.setNameFont('');
  }

  // draw a gradient for block2, and demo some fancy name options
  var cg = this.layout.simCanvas.getContext().createLinearGradient(-1, -1, 1, 1);
  if (cg) {
    cg.addColorStop(0, '#87CEFA'); // light blue
    cg.addColorStop(1, 'white');
    b2.setFillStyle(cg);
  }
  b2.setNameColor('gray');
  b2.setNameFont('12pt sans-serif');
  b2.setNameRotate(Math.PI/2);

  // draw pattern of repeating trucks for block1
  if (goog.isObject(img)) {
    b1.setImageDraw(function(/** !CanvasRenderingContext2D*/context) {
      var pat = context.createPattern(img, 'repeat');
      if (pat != null) {
        context.fillStyle = pat;
        context.fill();
      }
    });
    b1.setNameFont('');
  }

  /* joints to attach upper block to a fixed point, and both blocks together */
  JointUtil.attachFixedPoint(this.mySim,
      this.block2, /*attach_body*/new Vector(0, -1.0), CoordType.WORLD);
  JointUtil.attachRigidBody(this.mySim,
      this.block2, /*attach_body=*/new Vector(0, 1.0),
      this.block1, /*attach_body=*/new Vector(0, 1.0),
      /*normalType=*/CoordType.BODY
    );
  /* move the bodies so their joints line up over each other. */
  this.mySim.alignConnectors();

  var zel = Walls.make2(this.mySim, this.simView.getSimRect());
  this.gravityLaw.setZeroEnergyLevel(zel);

  /* demonstrate using ChainConfig.makeChain
  var options = {
    wallPivotX: -7,
    wallPivotY: 10,
    fixedLeft: true,
    fixedRight: true,
    blockWidth: 1.0,
    blockHeight: 3.0,
    numLinks: 7,
    extraBody: false,
    walls: false
  };
  this.rbo.protoPolygon = new DisplayShape().setStrokeStyle('black');
  ChainConfig.makeChain(this.mySim, options);
  */

  this.mySim.setElasticity(0.8);
  this.mySim.saveInitialState();

  /* thrust forces are operated by pressing keys like up/down/left/right arrows */
  /** @type {!ThrusterSet} */
  this.thrustForce1 = SixThrusters.make(1.0, this.block3);
  /** @type {!ThrusterSet} */
  this.thrustForce2 = SixThrusters.make(1.0, this.block1);
  this.rbeh.setThrusters(this.thrustForce1, 'right');
  this.rbeh.setThrusters(this.thrustForce2, 'left');
  this.mySim.addForceLaw(this.thrustForce1);
  this.mySim.addForceLaw(this.thrustForce2);

  this.addPlaybackControls();
  var pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));
  this.addStandardControls();
  this.makeEasyScript();
  this.addURLScriptButton();
  this.graphSetup();
};
var DoublePendulum2App = sims.engine2D.DoublePendulum2App;
goog.inherits(DoublePendulum2App, Engine2DApp);

/** @override */
DoublePendulum2App.prototype.toString = function() {
  return Util.ADVANCED ? '' : this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + DoublePendulum2App.superClass_.toString.call(this);
};

/** @override */
DoublePendulum2App.prototype.getClassName = function() {
  return 'DoublePendulum2App';
};

/** @override */
DoublePendulum2App.prototype.defineNames = function(myName) {
  DoublePendulum2App.superClass_.defineNames.call(this, myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('DoublePendulum2App|Engine2DApp',
       'myphysicslab.sims.engine2D.', /*addToVars=*/false);
};

/** @override */
DoublePendulum2App.prototype.getSubjects = function() {
  var subjects = DoublePendulum2App.superClass_.getSubjects.call(this);
  return goog.array.concat(this.dampingLaw, this.gravityLaw, subjects);
};

/** Set of internationalized strings.
@typedef {{
  BLOCK: string
  }}
*/
DoublePendulum2App.i18n_strings;

/**
@type {DoublePendulum2App.i18n_strings}
*/
DoublePendulum2App.en = {
  BLOCK: 'block'
};

/**
@private
@type {DoublePendulum2App.i18n_strings}
*/
DoublePendulum2App.de_strings = {
  BLOCK: 'Block'
};

/** Set of internationalized strings.
@type {DoublePendulum2App.i18n_strings}
*/
DoublePendulum2App.i18n = goog.LOCALE === 'de' ? DoublePendulum2App.de_strings :
    DoublePendulum2App.en;

}); // goog.scope
