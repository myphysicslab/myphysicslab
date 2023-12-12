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

import { CardioidPath } from './CardioidPath.js';
import { ChoiceControl } from '../../lab/controls/ChoiceControl.js';
import { CirclePath } from './CirclePath.js';
import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { ContactSim } from '../../lab/engine2D/ContactSim.js';
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DisplayPath } from '../../lab/view/DisplayPath.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { DrawingStyle } from '../../lab/view/DrawingStyle.js';
import { ElementIDs } from '../common/Layout.js';
import { Engine2DApp } from '../engine2D/Engine2DApp.js';
import { ExtraAccel } from '../../lab/engine2D/ExtraAccel.js';
import { FlatPath } from './FlatPath.js';
import { FunctionVariable } from '../../lab/model/FunctionVariable.js';
import { GenericMemo } from '../../lab/util/Memo.js';
import { GenericObserver, SubjectList } from '../../lab/util/Observe.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { HumpPath } from './HumpPath.js';
import { LemniscatePath } from './LemniscatePath.js';
import { LoopTheLoopPath } from './LoopTheLoopPath.js';
import { Memorizable } from '../../lab/util/Memo.js';
import { NumericalPath, HasPath } from '../../lab/model/NumericalPath.js';
import { NumericControl } from '../../lab/controls/NumericControl.js';
import { OvalPath } from './OvalPath.js';
import { ParameterBoolean, ParameterNumber, ParameterString, Subject, SubjectEvent } from '../../lab/util/Observe.js';
import { RigidBody } from '../../lab/engine2D/RigidBody.js';
import { ParametricPath } from '../../lab/model/ParametricPath.js';
import { PathEndPoint } from '../../lab/engine2D/PathEndPoint.js';
import { PathJoint } from '../../lab/engine2D/PathJoint.js';
import { PathObserver } from './PathObserver.js';
import { PathSelector } from './PathSelector.js';
import { Polygon } from '../../lab/engine2D/Polygon.js';
import { Scrim } from '../../lab/engine2D/Scrim.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { Simulation } from '../../lab/model/Simulation.js';
import { SpiralPath } from './SpiralPath.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Demonstrates a RigidBody connected to various 'roller coaster' paths by a PathJoint.

+ Adds PathEndPoints to Circle and Hump paths, as a demonstation of PathEndPoint.

+ Demonstrates disconnecting the block from path when the block reaches a certain point
on the Hump path.

+ Adds variables for distance and velocity as measured along the path, these are called
'path position' and 'path velocity' in English.

*/
export class RigidBodyRollerApp extends Engine2DApp<ContactSim> implements HasPath, SubjectList {

  dampingLaw: DampingLaw;
  gravityLaw: GravityLaw;
  pathAction: null|Memorizable = null;
  path: NumericalPath;
  pathJoint: PathJoint;
  pathSelect: PathSelector;
  pathObserver: PathObserver;
  block: Polygon;
  paths: ParametricPath[];
  /** Because one of the scenarios removes the pathJoint, this Observer
  * will add back the PathJoint when a RESET event occurs.
  */
  resetObserver: null|GenericObserver = null;

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
  this.elasticity.setElasticity(0.8);
  this.sim.setShowForces(true);
  this.sim.setExtraAccel(ExtraAccel.VELOCITY_JOINTS);
  this.dampingLaw = new DampingLaw(/*damping=*/0, /*rotateRatio=*/0.15,
      this.simList);
  this.gravityLaw = new GravityLaw(3, this.simList);
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

  this.path = new NumericalPath(this.paths[2]);
  this.pathSelect = new PathSelector(this, this.paths);
  this.pathObserver = new PathObserver(this.simList, this.simView,
      a => this.setSimRect(a), /*expansionFactor=*/1.5);
  this.block = Shapes.makeBlock(1, 3, RigidBodyRollerApp.en.BLOCK,
      RigidBodyRollerApp.i18n.BLOCK);

  this.addPlaybackControls();
  let ps = this.pathSelect.getParameterString(PathSelector.en.PATH);
  this.addControl(new ChoiceControl(ps));

  let pn = this.gravityLaw.getParameterNumber(GravityLaw.en.GRAVITY);
  this.addControl(new NumericControl(pn));
  this.watchEnergyChange(pn);

  pn = this.dampingLaw.getParameterNumber(DampingLaw.en.DAMPING);
  this.addControl(new NumericControl(pn));

  this.addStandardControls();

  this.makeEasyScript([this.simView]);
  this.addURLScriptButton();
  this.setPath(this.path);
  this.graphSetup();
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      +', simList: '+this.simList.toStringShort()
      +', simView: '+this.simView.toStringShort()
      +', statusView: '+this.statusView.toStringShort()
      +', pathSelect: '+this.pathSelect
      +', pathObserver: '+this.pathObserver
      +', paths: [ '+this.paths+' ]'
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'RigidBodyRollerApp';
};

/** @inheritDoc */
override defineNames(myName: string): void {
  this.terminal.addRegex('block|paths|path|pathSelect|gravityLaw|dampingLaw',
       myName+'.');
  this.terminal.addRegex('CardioidPath|CirclePath'
       +'|FlatPath|HumpPath|LemniscatePath|LoopTheLoopPath|OvalPath'
       +'|PathObserver|PathSelector|SpiralPath',
       'sims$roller$', /*addToVars=*/false);
};

/** @inheritDoc */
override getSubjects(): Subject[] {
  return super.getSubjects().concat(this.pathSelect, this.gravityLaw, this.dampingLaw);
};

/** @inheritDoc */
override graphSetup(_body?: RigidBody): void {
  this.graph.line.setXVariable(10); // 10 = path distance
  this.graph.line.setYVariable(1); // 1 = kinetic energy
  this.timeGraph.line1.setYVariable(1);
  this.timeGraph.line2.setYVariable(2); // 2 = potential energy
};

/** Rebuilds the simulation based on current options selected. Starts with
* {@link ContactSim.cleanSlate} then recreates all the
* various RigidBody's and Force's etc.
*/
config(): void {
  Util.assert(this.path != null);
  if (this.resetObserver != null) {
    this.resetObserver.disconnect();
    this.resetObserver = null;
  }
  if (this.pathAction != null) {
    this.simRun.removeMemo(this.pathAction);
    this.pathAction = null;
  }
  const elasticity = this.elasticity.getElasticity();
  this.sim.cleanSlate();
  this.advance.reset();
  this.sim.addForceLaw(this.gravityLaw);
  this.gravityLaw.connect(this.sim.getSimList());
  this.sim.addForceLaw(this.dampingLaw);
  this.dampingLaw.connect(this.sim.getSimList());
  this.simList.add(this.path);
  this.block.setPosition(new Vector(-4, 4), Math.PI/4);
  this.block.setVelocity(new Vector(0, 0), 0);
  this.sim.addBody(this.block);
  let ds = this.displayList.findShape(this.block);
  ds.setFillStyle('rgba(51,204,255,0.5)');
  ds.setDrawCenterOfMass(true);
  ds.setDrawDragPoints(true);

  const attach = this.block.getDragPoints()[1];
  this.pathJoint = new PathJoint(this.path, this.block, attach);
  this.sim.addConnector(this.pathJoint);
  this.sim.alignConnectors();
  // add PathEndPoints to Circle and Hump paths, as demonstation of PathEndPoint.
  if (this.path.nameEquals(CirclePath.en.NAME)) {
    // @ts-ignore
    if (0 == 1) {
      // stop-point at 45 degrees southwest of center.
      const endPt = this.path.findNearestGlobal(new Vector(-2, -2));
      this.sim.addConnector(new PathEndPoint('stop point', this.path, this.block,
        attach, endPt.p, /*upperLimit=*/true));
    }
    this.sim.addConnector(new PathEndPoint('limit down', this.path, this.block,
      attach, this.path.getStartPValue(), /*upperLimit=*/false));
    this.sim.addConnector(new PathEndPoint('limit up', this.path, this.block,
      attach, this.path.getFinishPValue(), /*upperLimit=*/true));
  } else if (this.path.nameEquals(HumpPath.en.NAME)) {
    this.sim.addConnector(new PathEndPoint('limit down', this.path, this.block,
      attach, this.path.getStartPValue() + 0.1, /*upperLimit=*/false));
    this.sim.addConnector(new PathEndPoint('limit up', this.path, this.block,
      attach, this.path.getFinishPValue() - 0.1, /*upperLimit=*/true));
    // This demonstrates disconnecting the block from path when the block reaches
    // a certain point on the path.
    const disconnectPt = 3*this.path.getFinishPValue()/4;
    this.pathAction = new GenericMemo(() => {
      const ppt = this.pathJoint.getPathPoint();
      if (ppt.p > disconnectPt) {
        // disconnect the block from the path
        this.sim.removeConnector(this.pathJoint);
      }
    }, 'disconnect block from path');
    this.simRun.addMemo(this.pathAction);
    // add a dummy joint to show where the 'disconnect block' happens
    const dpt = this.path.map_p_to_vector(disconnectPt);
    const dj = new PathJoint(this.path, Scrim.getScrim(), dpt);
    this.sim.getSimList().add(dj);
    // Add back the PathJoint when a RESET event occurs.
    this.resetObserver = new GenericObserver(this.sim, (evt: SubjectEvent) => {
      if (evt.nameEquals('RESET')) {
        this.sim.addConnector(this.pathJoint);
        this.sim.alignConnectors();
      }
    }, 'Add back PathJoint on RESET event');
  }
  // add variables that tell path distance & velocity
  const va = this.sim.getVarsList();
  const varP = new FunctionVariable(va, RigidBodyRollerApp.en.PATH_POSITION,
      RigidBodyRollerApp.i18n.PATH_POSITION,
      () => this.pathJoint.getPathPoint().p);
  va.addVariable(varP);
  const varPV = new FunctionVariable(va, RigidBodyRollerApp.en.PATH_VELOCITY,
      RigidBodyRollerApp.i18n.PATH_VELOCITY,
      () => {
        const ppt = this.pathJoint.getPathPoint();
        const vel = this.block.getVelocity(this.pathJoint.getAttach1());
        return vel.dotProduct(new Vector(ppt.slopeX, ppt.slopeY));
      });
  va.addVariable(varPV);
  this.sim.setElasticity(elasticity);
  this.sim.saveInitialState();
  this.easyScript.update();
};

/** @inheritDoc */
getPath(): NumericalPath|null {
  return this.path;
};

/** @inheritDoc */
setPath(path: NumericalPath): void {
  this.path = path;
  this.config();
};

/**
@param simRect
*/
setSimRect(simRect: DoubleRect): void {
  this.simRect = simRect;
  this.simView.setSimRect(simRect);
};

static readonly en: i18n_strings = {
  BLOCK: 'block',
  PATH_POSITION: 'path position',
  PATH_VELOCITY: 'path velocity'
};

static readonly de_strings: i18n_strings = {
  BLOCK: 'Block',
  PATH_POSITION: 'Pfad Position',
  PATH_VELOCITY: 'Pfad Geschwindigkeit'
};

static readonly i18n = Util.LOCALE === 'de' ? RigidBodyRollerApp.de_strings : RigidBodyRollerApp.en;

} // end class

type i18n_strings = {
  BLOCK: string,
  PATH_POSITION: string,
  PATH_VELOCITY: string
};
