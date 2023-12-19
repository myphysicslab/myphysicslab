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

import { AffineTransform } from '../../lab/util/AffineTransform.js';
import { CheckBoxControl } from '../../lab/controls/CheckBoxControl.js';
import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { ContactSim } from '../../lab/engine2D/ContactSim.js';
import { CoordType } from '../../lab/model/CoordType.js';
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from './Engine2DApp.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { JointUtil } from '../../lab/engine2D/JointUtil.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { ParameterNumber, Subject, SubjectList } from '../../lab/util/Observe.js';
import { Polygon } from '../../lab/engine2D/Polygon.js';
import { Scrim } from '../../lab/engine2D/Scrim.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { SixThrusters } from './SixThrusters.js';
import { ThrusterSet } from '../../lab/engine2D/ThrusterSet.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { Walls } from '../../lab/engine2D/Walls.js';

/** A simple example app using ContactSim, this shows two blocks
connected like a double pendulum, and a third free moving block.

DoublePendulum2App also demonstrates having an image inside a DisplayShape. It uses an
AffineTransform to rotate, scale, and position the image within the DisplayShape.
*/
export class DoublePendulum2App extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  dampingLaw: DampingLaw;
  gravityLaw: GravityLaw;
  block1: Polygon;
  block2: Polygon;
  block3: Polygon;
  protoBlock: DisplayShape;
  thrustForce1: ThrusterSet;
  thrustForce2: ThrusterSet;

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  const simRect = new DoubleRect(-6, -6, 6, 6);
  const sim = new ContactSim();
  const advance = new CollisionAdvance(sim);
  super(elem_ids, simRect, sim, advance);
  this.layout.getSimCanvas().setBackground('black');
  this.layout.getSimCanvas().setAlpha(CommonControls.SHORT_TRAILS);
  this.sim.setShowForces(false);
  this.dampingLaw = new DampingLaw(0, 0.15, this.simList);
  this.sim.addForceLaw(this.dampingLaw);
  this.gravityLaw = new GravityLaw(8, this.simList);
  this.sim.addForceLaw(this.gravityLaw);

  this.block1 = Shapes.makeBlock(1, 3, DoublePendulum2App.en.BLOCK+1,
      DoublePendulum2App.i18n.BLOCK+1);
  this.block1.setPosition(new Vector(-1,  -1),  Math.PI/4);
  this.block2 = Shapes.makeBlock(1, 3, DoublePendulum2App.en.BLOCK+2,
      DoublePendulum2App.i18n.BLOCK+2);
  this.block2.setPosition(new Vector(0,  0),  0);
  this.block3 = Shapes.makeBlock(1, 3, DoublePendulum2App.en.BLOCK+3,
      DoublePendulum2App.i18n.BLOCK+3);
  this.block3.setPosition(new Vector(-4,  -4),  Math.PI/2);
  this.protoBlock = new DisplayShape();
  this.protoBlock.setStrokeStyle('lightGray');
  this.protoBlock.setFillStyle('');
  this.protoBlock.setThickness(3);
  const b1 = new DisplayShape(this.block1, this.protoBlock);
  this.displayList.add(b1);
  this.sim.addBody(this.block1);
  const b2 = new DisplayShape(this.block2, this.protoBlock);
  this.displayList.add(b2);
  this.sim.addBody(this.block2);
  const b3 = new DisplayShape(this.block3, this.protoBlock);
  b3.setStrokeStyle('orange');
  this.displayList.add(b3);
  this.sim.addBody(this.block3);

  // demonstrate using an image with DisplayShape.
  const img = document.getElementById('tipper') as HTMLImageElement;
  b3.setImage(img);
  let at = AffineTransform.IDENTITY;
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

  // draw a gradient for block2, and demo some fancy name options
  const cg = this.layout.getSimCanvas().getContext().createLinearGradient(-1, -1, 1, 1);
  cg.addColorStop(0, '#87CEFA'); // light blue
  cg.addColorStop(1, 'white');
  b2.setFillStyle(cg);
  b2.setNameColor('gray');
  b2.setNameFont('12pt sans-serif');
  b2.setNameRotate(Math.PI/2);

  // draw pattern of repeating trucks for block1
  b1.setImageDraw(function(/** !CanvasRenderingContext2D*/context) {
    const pat = context.createPattern(img, 'repeat');
    if (pat != null) {
      context.fillStyle = pat;
      context.fill();
    }
  });
  b1.setNameFont('');

  /* joints to attach upper block to a fixed point, and both blocks together */
  JointUtil.attachFixedPoint(this.sim,
      this.block2, /*attach_body*/new Vector(0, -1.0), CoordType.WORLD);
  JointUtil.attachRigidBody(this.sim,
      this.block2, /*attach_body=*/new Vector(0, 1.0),
      this.block1, /*attach_body=*/new Vector(0, 1.0),
      /*normalType=*/CoordType.BODY
    );
  /* move the bodies so their joints line up over each other. */
  this.sim.alignConnectors();

  const zel = Walls.make2(this.sim, this.simView.getSimRect());
  this.gravityLaw.setZeroEnergyLevel(zel);

  /* demonstrate using ChainConfig.makeChain
  const options = {
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
  ChainConfig.makeChain(this.sim, options);
  */

  this.sim.setElasticity(0.8);
  this.sim.saveInitialState();

  /* thrust forces are operated by pressing keys like up/down/left/right arrows */
  this.thrustForce1 = SixThrusters.make(1.0, this.block3);
  this.thrustForce2 = SixThrusters.make(1.0, this.block1);
  this.rbeh.setThrusters(this.thrustForce1, 'right');
  this.rbeh.setThrusters(this.thrustForce2, 'left');
  this.sim.addForceLaw(this.thrustForce1);
  this.sim.addForceLaw(this.thrustForce2);

  this.addPlaybackControls();
  let pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));
  this.addStandardControls();
  this.makeEasyScript();
  this.addURLScriptButton();
  this.graphSetup();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', dampingLaw: '+this.dampingLaw.toStringShort()
      +', gravityLaw: '+this.gravityLaw.toStringShort()
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'DoublePendulum2App';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  super.defineNames(myName);
  this.terminal.addRegex('gravityLaw|dampingLaw',
       myName+'.');
};

/** @inheritDoc */
override getSubjects(): Subject[] {
  return super.getSubjects().concat(this.dampingLaw, this.gravityLaw);
};

static readonly en: i18n_strings = {
  BLOCK: 'block'
};

static readonly de_strings: i18n_strings = {
  BLOCK: 'Block'
};

static readonly i18n = Util.LOCALE === 'de' ? DoublePendulum2App.de_strings : DoublePendulum2App.en;

} // end class

type i18n_strings = {
  BLOCK: string
};
Util.defineGlobal('sims$engine2D$DoublePendulum2App', DoublePendulum2App);
