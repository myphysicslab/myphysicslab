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

goog.provide('myphysicslab.sims.pendulum.ReactionPendulumApp');

goog.require('goog.array');
goog.require('myphysicslab.lab.app.EventHandler');
goog.require('myphysicslab.lab.app.SimController');
goog.require('myphysicslab.lab.app.SimRunner');
goog.require('myphysicslab.lab.controls.CheckBoxControl');
goog.require('myphysicslab.lab.controls.ChoiceControl');
goog.require('myphysicslab.lab.controls.LabControl');
goog.require('myphysicslab.lab.controls.NumericControl');
goog.require('myphysicslab.lab.controls.SliderControl');
goog.require('myphysicslab.lab.engine2D.Polygon');
goog.require('myphysicslab.lab.graph.AutoScale');
goog.require('myphysicslab.lab.graph.DisplayGraph');
goog.require('myphysicslab.lab.graph.EnergyBarGraph');
goog.require('myphysicslab.lab.graph.GraphLine');
goog.require('myphysicslab.lab.graph.DisplayAxes');
goog.require('myphysicslab.lab.model.Arc');
goog.require('myphysicslab.lab.model.ConcreteLine');
goog.require('myphysicslab.lab.model.PointMass');
goog.require('myphysicslab.lab.model.SimList');
goog.require('myphysicslab.lab.model.SimpleAdvance');
goog.require('myphysicslab.lab.model.Simulation');
goog.require('myphysicslab.lab.util.Clock');
goog.require('myphysicslab.lab.util.AbstractSubject');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('myphysicslab.lab.util.GenericObserver');
goog.require('myphysicslab.lab.util.Observer');
goog.require('myphysicslab.lab.util.Parameter');
goog.require('myphysicslab.lab.util.ParameterBoolean');
goog.require('myphysicslab.lab.util.ParameterNumber');
goog.require('myphysicslab.lab.util.ParameterString');
goog.require('myphysicslab.lab.util.ScriptParser');
goog.require('myphysicslab.lab.util.Subject');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Vector');
goog.require('myphysicslab.lab.view.DisplayArc');
goog.require('myphysicslab.lab.view.DisplayClock');
goog.require('myphysicslab.lab.view.DisplayLine');
goog.require('myphysicslab.lab.view.DisplayShape');
goog.require('myphysicslab.lab.view.DrawingMode');
goog.require('myphysicslab.lab.view.SimView');
goog.require('myphysicslab.sims.layout.CommonControls');
goog.require('myphysicslab.sims.layout.CompareGraph');
goog.require('myphysicslab.sims.layout.CompareTimeGraph');
goog.require('myphysicslab.sims.layout.TabLayout');
goog.require('myphysicslab.sims.pendulum.PendulumSim');
goog.require('myphysicslab.sims.pendulum.ReactionPendulumSim');

goog.scope(function() {

var lab = myphysicslab.lab;
var sims = myphysicslab.sims;

var CheckBoxControl = lab.controls.CheckBoxControl;
var ChoiceControl = lab.controls.ChoiceControl;
var NumericControl = lab.controls.NumericControl;
var SliderControl = lab.controls.SliderControl;
var Arc = myphysicslab.lab.model.Arc;
var AutoScale = lab.graph.AutoScale;
var Clock = lab.util.Clock;
var CommonControls = sims.layout.CommonControls;
var CompareGraph = sims.layout.CompareGraph;
var CompareTimeGraph = sims.layout.CompareTimeGraph;
var DisplayArc = myphysicslab.lab.view.DisplayArc;
var DisplayClock = lab.view.DisplayClock;
var DisplayGraph = lab.graph.DisplayGraph;
var DisplayLine = lab.view.DisplayLine;
var DisplayShape = lab.view.DisplayShape;
var DoubleRect = lab.util.DoubleRect;
var DrawingMode = lab.view.DrawingMode;
var EnergyBarGraph = lab.graph.EnergyBarGraph;
var EventHandler = lab.app.EventHandler;
var GenericObserver = lab.util.GenericObserver;
var GraphLine = lab.graph.GraphLine;
var ConcreteLine = lab.model.ConcreteLine;
var LabControl = lab.controls.LabControl;
var Parameter = lab.util.Parameter;
var ParameterBoolean = lab.util.ParameterBoolean;
var ParameterNumber = lab.util.ParameterNumber;
var ParameterString = lab.util.ParameterString;
var PendulumSim = sims.pendulum.PendulumSim;
var PointMass = lab.model.PointMass;
var Polygon = lab.engine2D.Polygon;
var ReactionPendulumSim = sims.pendulum.ReactionPendulumSim;
var ScriptParser = lab.util.ScriptParser;
var SimController = lab.app.SimController;
var SimList = lab.model.SimList;
var SimpleAdvance = lab.model.SimpleAdvance;
var SimRunner = lab.app.SimRunner;
var Simulation = lab.model.Simulation;
var SimView = lab.view.SimView;
var DisplayAxes = lab.graph.DisplayAxes;
var TabLayout = sims.layout.TabLayout;
var UtilityCore = lab.util.UtilityCore;
var Vector = lab.util.Vector;

/** ReactionPendulumApp displays the reaction forces pendulum simulation
{@link myphysicslab.sims.pendulum.ReactionPendulumSim ReactionPendulumSim} and compares it to
the classic pendulum simulation
{@link myphysicslab.sims.pendulum.PendulumSim PendulumSim} which is shown alongside.
The simultaneous simulations show that the two pendulums are equivalent in their motion.
This also confirms that the calculation for equivalent arm length (see below) is
correct.

Something to notice is that the reaction force diverges more from the stick vector as
the size of disk increases. This is because a smaller disk is closer to the ideal of a
point mass in the classic pendulum simulation.

Keep Parameters Synchronized
------------------------------

We keep the parameters for gravity, mass and length of pendulum synchronized between the
two simulations (though length is slightly different, see below).

The damping model is different for the two simulations so we don't try to synchronize
the damping; we just leave both simulations with zero damping.

Length of Equivalent Classic Pendulum
------------------------------------------

To match motion of the two simulations, the lengths are slightly different. The
ReactionPendulumSim simulation models the pendulum as a rigid disc with mass distributed
evenly. The classic ideal PendulumSim models the pendulum a point mass at end of
massless stick.

We want to find the length of the simple ideal pendulum that is equivalent to the rigid
body disk pendulum.

Rotation of a solid cylinder of radius `r` about its cylinder axis has rotational
inertia

    I = m r^2 / 2

Use parallel axis theorem, where the CM (center of mass) is at distance `h` from the
pivot point, to get rotational inertia of:

    I = m r^2 / 2 + m h^2

Use rotational analog of Newton's second law of motion about a fixed axis which is

    I \theta'' = sum of torques

Here the only torque is from gravity at the CM:

    I \theta'' = -h m g sin(\theta)

expand this using the value for I found above

    \theta'' =  -h m g sin(\theta) / (m r^2 / 2 + m h^2)
    = -h g sin(\theta) / (r^2/2 + h^2)

what would be the equivalent length of a simple point mass pendulum? Let

    R = the length of that equivalent simple pendulum
    I = m R^2

then we have

    I \theta'' = - m g R sin (\theta)
    \theta'' = - g sin (\theta) / R

equating the two we get

    h / (r^2/2 + h^2) = 1 / R
    R = (r^2/2 + h^2) / h
    = h + r^2 / (2 h)

So the equivalent ideal pendulum is longer:  `R > h`


Another Way to Calculate Equivalent Length
-------------------------------------------

Here's another way to calculate equivalent classic ideal pendulum length. Suppose we
have rotational inertia about the pivot point (not about the CM) is `I`, and length to
the CM is `h`.

    I \theta'' = -h m g sin(\theta)
    \theta'' = -h m g sin(\theta) / I

What would be the equivalent length `R` of an ideal (point mass) pendulum?
For ideal pendulum, as above:

    \theta'' = - g sin (\theta) / R

Equating these gives:

    1 / R = h m / I
    R = I / (m h)

If we put in the value for `I` above:

    R = (m r^2 / 2 + m h^2) / (m h)
    = h + r^2 / (2 h)

which is the same as the previous answer.


App Setup
---------------------------

Creates instance objects such as the simulation and display objects;
defines regular expressions for easy Terminal scripting of these objects using short
names instead of fully qualified property names.

The constructor takes an argument that specifies the names of the HTML elementId's to
look for in the HTML document; these elements are where the user interface of the
simulation is created. This allows for having two separate simulation apps running
concurrently on a single page.

No global variables are created other than two root global variables: the
`myphysicslab` global holds all of the myPhysicsLab classes; and a global variable is
created for this application instance. This application global is created outside of
this file in the HTML where the constructor is called. The name of that global variable
holding the application is passed to defineNames() method so that short-names in scripts
can be properly expanded.

* @param {!TabLayout.elementIds} elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
* @constructor
* @final
* @struct
* @extends {myphysicslab.lab.util.AbstractSubject}
* @implements {myphysicslab.lab.util.Observer}
* @export
*/
myphysicslab.sims.pendulum.ReactionPendulumApp = function(elem_ids) {
  UtilityCore.setErrorHandler();
  myphysicslab.lab.util.AbstractSubject.call(this, 'APP');
  /** distance between the pendulum anchor points
  * @type {number}
  */
  this.separation = 0.5;
  /** 
  * @type {number}
  */
  this.startAngle = 5*Math.PI/7;
  /** length of ReactionPendulumSim
  * @type {number}
  */
  this.pendulumLength = 1.5;
  /** radius of rigid body pendulum disk
  * @type {number}
  * @private
  */
  this.radius = 0.4;
  /** @type {!TabLayout} */
  this.layout = new TabLayout(elem_ids);
  this.terminal = this.layout.terminal;
  var simCanvas = this.layout.simCanvas;
  /** @type {!lab.util.DoubleRect} */
  this.simRect = new DoubleRect(-2, -2, 2, 2.7);
  /** @type {!lab.view.SimView} */
  this.simView = new SimView('simView', this.simRect);
  this.displayList = this.simView.getDisplayList();
  simCanvas.addView(this.simView);
  /** @type {!lab.view.SimView} */
  this.statusView = new SimView('status', new DoubleRect(-10, -10, 10, 10));
  simCanvas.addView(this.statusView);

  /** @type {!PendulumSim} */
  this.sim1 = new PendulumSim('SIM_1');
  var va1 = this.sim1.getVarsList();
  this.sim1.setLength(this.classicLength());
  this.sim1.setDriveAmplitude(0);
  this.sim1.setPivot(new Vector(this.separation, 0));
  this.sim1.setDamping(0);
  this.sim1.setGravity(3);
  this.sim1.setMass(0.1);
  va1.setValue(0, 0);
  va1.setValue(1, 0);
  this.sim1.setPotentialEnergy(0);
  va1.setValue(0, this.startAngle);
  this.sim1.saveInitialState();
  /** @type {!lab.model.SimList} */
  this.simList1 = this.sim1.getSimList();
  // Ensure that changes to parameters or variables cause display to update
  new GenericObserver(this.sim1, goog.bind(function(evt) {
    this.sim1.modifyObjects();
  }, this), 'modifyObjects after parameter or variable change');

  var displayBob1 = new DisplayShape(this.simList1.getPointMass('bob'));
  displayBob1.drawCenterOfMass = false;
  displayBob1.drawDragPoints = false;
  displayBob1.fillStyle = '';
  displayBob1.strokeStyle = 'blue';
  this.displayList.add(displayBob1);
  displayBob1.setDragable(false);
  var displayRod1 = new DisplayLine(this.simList1.getConcreteLine('rod'));
  displayRod1.color = 'blue';
  this.displayList.add(displayRod1);

  /** @type {!lab.model.SimList} */
  this.simList2 = new SimList();
  this.simList2.addObserver(this);
  /** @type {!ReactionPendulumSim} */
  this.sim2 = new ReactionPendulumSim(this.pendulumLength, this.radius, this.startAngle,
      'SIM_2', this.simList2);
  this.sim2.setMass(this.sim1.getMass());
  this.sim2.setGravity(this.sim1.getGravity());
  this.sim2.setDamping(0);
  this.terminal.setAfterEval(goog.bind(function() {
      this.sim1.modifyObjects();
      this.sim2.modifyObjects();
    }, this));
  // Ensure that changes to parameters or variables cause display to update
  new GenericObserver(this.sim2, goog.bind(function(evt) {
    this.sim2.modifyObjects();
  }, this), 'modifyObjects after parameter or variable change');

  /** @type {!lab.app.SimController} */
  this.simCtrl = new SimController(simCanvas, /*eventHandler=*/null);
  /** @type {!lab.graph.DisplayAxes} */
  this.axes = CommonControls.makeAxes(this.simView);
  this.advance1 = new SimpleAdvance(this.sim1);
  this.advance2  = new SimpleAdvance(this.sim2);
  /** @type {!lab.app.SimRunner} */
  this.simRun = new SimRunner(this.advance1);
  this.simRun.addStrategy(this.advance2);
  this.simRun.addCanvas(simCanvas);
  /** @type {!lab.util.Clock} */
  this.clock = this.simRun.getClock();

  /** @type {!ParameterBoolean} */
  var pb;
  /** @type {!ParameterNumber} */
  var pn;
  /** @type {!ParameterString} */
  var ps;

  // ********* simulation controls  *************
  this.addControl(CommonControls.makePlaybackControls(this.simRun));

  this.addParameter(pn = new ParameterNumber(this, ReactionPendulumSim.en.START_ANGLE,
      ReactionPendulumSim.i18n.START_ANGLE,
      this.getStartAngle, this.setStartAngle));
  this.addControl(new NumericControl(pn));
  this.addParameter(pn = new ParameterNumber(this, ReactionPendulumSim.en.LENGTH,
      ReactionPendulumSim.i18n.LENGTH,
      this.getLength, this.setLength));
  this.addControl(new NumericControl(pn));
  this.addParameter(pn = new ParameterNumber(this, ReactionPendulumSim.en.RADIUS,
      ReactionPendulumSim.i18n.RADIUS,
      this.getRadius, this.setRadius));
  this.addControl(new NumericControl(pn));
  this.addParameter(pn = new ParameterNumber(this, ReactionPendulumApp.en.SEPARATION,
      ReactionPendulumApp.i18n.SEPARATION,
      this.getSeparation, this.setSeparation));
  this.addControl(new SliderControl(pn, 0, 2, /*multiply=*/false));
  pn = this.sim1.getParameterNumber(PendulumSim.en.MASS);
  this.addControl(new SliderControl(pn, 0.001, 10, /*multiply=*/true));
  pn = this.sim1.getParameterNumber(PendulumSim.en.GRAVITY);
  this.addControl(new SliderControl(pn, 0, 20, /*multiply=*/false));

  /** @type {!EnergyBarGraph} */
  this.energyGraph1 = new EnergyBarGraph(this.sim1);
  this.energyGraph1.potentialColor = '#039';
  this.energyGraph1.translationColor = '#06c';
  this.energyGraph1.rotationColor = '#6cf';
  /** @type {!ParameterBoolean} */
  this.showEnergyParam1 = CommonControls.makeShowEnergyParam(this.energyGraph1,
      this.statusView, this);
  this.addControl(new CheckBoxControl(this.showEnergyParam1));

  /** @type {!lab.graph.EnergyBarGraph} */
  this.energyGraph2 = new EnergyBarGraph(this.sim2);
  this.energyGraph2.potentialColor = '#903';
  this.energyGraph2.translationColor = '#f33';
  this.energyGraph2.rotationColor = '#f99';
  this.energyGraph2.setPosition(new Vector(0, 6));
  /** @type {!ParameterBoolean} */
  this.showEnergyParam2 = CommonControls.makeShowEnergyParam(this.energyGraph2,
      this.statusView, this, ReactionPendulumApp.en.SHOW_ENERGY_2,
      ReactionPendulumApp.i18n.SHOW_ENERGY_2);
  this.addControl(new CheckBoxControl(this.showEnergyParam2));

  /** @type {!lab.view.DisplayClock} */
  this.displayClock = new DisplayClock(goog.bind(this.sim1.getTime, this.sim1),
      goog.bind(this.clock.getRealTime, this.clock), /*period=*/2, /*radius=*/2);
  this.displayClock.setPosition(new Vector(8, 4));
  pb = CommonControls.makeShowClockParam(this.displayClock, this.statusView, this);
  this.addControl(new CheckBoxControl(pb));

  var panzoom_simview = CommonControls.makePanZoomControls(this.simView,
      /*overlay=*/true,
      goog.bind(function () { this.simView.setSimRect(this.simRect); }, this));
  this.layout.div_sim.appendChild(panzoom_simview);
  pb = CommonControls.makeShowPanZoomParam(panzoom_simview, this);
  this.addControl(new CheckBoxControl(pb));

  pn = this.simRun.getParameterNumber(SimRunner.en.TIME_STEP);
  this.addControl(new NumericControl(pn));
  pn = this.simRun.getClock().getParameterNumber(Clock.en.TIME_RATE);
  this.addControl(new NumericControl(pn));

  /** translate variable index of sim1 to equivalent variable of sim2
  * @type {function(number): number}
  */
  var translate = function(v1) {
    // sim1: PendulumSim
    //  0       1       2    3        4   5   6
    // angle, angle', time, angle'', ke, pe, te
    //
    // sim2: ReactionPendulumSim
    // 0  1   2  3     4      5       6    7   8   9
    // x, x', y, y', angle, angle', time, ke, pe, te
    switch (v1) {
      case 0: return 4; // angle
      case 1: return 5; // angle velocity
      case 2: return 6; // time
      case 3: return -1; // angle accel
      case 4: return 7; // kinetic energy
      case 5: return 8; // potential energy
      case 6: return 9; // total energy
      default: throw new Error();
    }
  };

  /** @type {!lab.graph.GraphLine} */
  var line1 = new GraphLine('GRAPH_LINE_1', va1);
  line1.setXVariable(0);
  line1.setYVariable(1);
  line1.setColor('blue');
  line1.setDrawingMode(DrawingMode.LINES);

  var va2 = this.sim2.getVarsList();
  /** @type {!lab.graph.GraphLine} */
  var line2 = new GraphLine('GRAPH_LINE_2', va2);
  line2.setXVariable(translate(0));
  line2.setYVariable(translate(1));
  line2.setColor('red');
  line2.setDrawingMode(DrawingMode.LINES);

  // keep line1's X and Y variable in sync with line2
  var paramY1 = line1.getParameterNumber(GraphLine.en.Y_VARIABLE);
  var paramX1 = line1.getParameterNumber(GraphLine.en.X_VARIABLE);
  new GenericObserver(line1, function(evt) {
    if (evt == paramY1) {
      line2.setYVariable(translate(paramY1.getValue()));
    } else if (evt == paramX1) {
      line2.setXVariable(translate(paramX1.getValue()));
    }
  }, 'keep line1\'s X and Y variable in sync with line2');

  /** @type {!sims.layout.CompareGraph} */
  this.graph = new CompareGraph(line1, line2,
      this.layout.graphCanvas,
      this.layout.graph_controls, this.layout.div_graph, this.simRun);

  var timeLine1 = new GraphLine('TIME_LINE_1', va1);
  timeLine1.setYVariable(0);
  timeLine1.setColor('blue');
  timeLine1.setDrawingMode(DrawingMode.LINES);
  var timeLine2 = new GraphLine('TIME_LINE_2', va2);
  timeLine2.setYVariable(translate(0));
  timeLine2.setColor('red');
  timeLine2.setDrawingMode(DrawingMode.LINES);
  // keep timeLine2's Y variable in sync with timeLine1
  var timeParamY1 = timeLine1.getParameterNumber(GraphLine.en.Y_VARIABLE);
  new GenericObserver(timeLine1, function(evt) {
    if (evt == timeParamY1) {
      timeLine2.setYVariable(translate(timeParamY1.getValue()));
    }
  }, 'keep timeLine2\'s Y variable in sync with timeLine1');
  /** @type {!sims.layout.CompareTimeGraph} */
  this.timeGraph = new CompareTimeGraph(timeLine1, timeLine2,
      this.layout.timeGraphCanvas,
      this.layout.time_graph_controls, this.layout.div_time_graph, this.simRun);

  // synchronize sim2 parameters to match parameters of sim1
  new GenericObserver(this.sim1, goog.bind(function(evt) {
    if (evt instanceof ParameterNumber) {
      if (evt.nameEquals(PendulumSim.en.GRAVITY)) {
        this.sim2.setGravity(evt.getValue());
      } else if (evt.nameEquals(PendulumSim.en.MASS)) {
        this.sim2.setMass(evt.getValue());
      }
    } else if (evt.nameEquals(Simulation.RESET)) {
      this.sim2.reset();
    }
  }, this), 'synchronize sim2 parameters to match parameters of sim1');

  var subjects = [
    this,
    this.sim1,
    this.sim2,
    this.simRun,
    this.clock,
    this.simView,
    this.statusView,
    this.sim1.getVarsList(),
    this.sim2.getVarsList()
  ];
  subjects = goog.array.concat(subjects, this.layout.getSubjects(),
      this.graph.getSubjects(), this.timeGraph.getSubjects());
  this.scriptParser = CommonControls.makeScriptParser(subjects, [], this.simRun);
  this.terminal.setParser(this.scriptParser);
  this.addControl(CommonControls.makeURLScriptButton(this.scriptParser, this.simRun));
};
var ReactionPendulumApp = myphysicslab.sims.pendulum.ReactionPendulumApp;
goog.inherits(ReactionPendulumApp, myphysicslab.lab.util.AbstractSubject);

if (!UtilityCore.ADVANCED) {
  /** @inheritDoc */
  ReactionPendulumApp.prototype.toString = function() {
    return this.toStringShort().slice(0, -1)
        +', sim1: '+this.sim1.toStringShort()
        +', sim2: '+this.sim2.toStringShort()
        +', terminal: '+this.terminal
        +', graph: '+this.graph
        +', timeGraph: '+this.timeGraph
        + ReactionPendulumApp.superClass_.toString.call(this);
  };
};

/** @inheritDoc */
ReactionPendulumApp.prototype.getClassName = function() {
  return 'ReactionPendulumApp';
};

/** Add the control to the set of simulation controls.
* @param {!LabControl} control
* @return {!LabControl} the control that was passed in
*/
ReactionPendulumApp.prototype.addControl = function(control) {
  return this.layout.addControl(control);
};

/** @inheritDoc */
ReactionPendulumApp.prototype.observe =  function(event) {
  if (event.getSubject() == this.simList2) {
    var obj = /** @type {!myphysicslab.lab.model.SimObject} */ (event.getValue());
    if (event.nameEquals(SimList.OBJECT_ADDED)) {
      if (this.displayList.findSimObject(obj) != null) {
        // we already have a DisplayObject for this SimObject, don't add a new one.
        return;
      }
      if (obj instanceof Polygon) {
        var p = /** @type {!myphysicslab.lab.engine2D.Polygon} */(obj);
        var d = new DisplayShape(p);
        d.drawCenterOfMass = true;
        d.drawDragPoints = false;
        d.fillStyle = '';
        d.strokeStyle = 'red';
        this.displayList.add(d);
      } else if (obj instanceof ConcreteLine) {
        var line = /** @type {!ConcreteLine} */(obj);
        var dl = new DisplayLine(line);
        if (obj.getName() == 'rod') {
          dl.color = 'red';
        } else {
          dl.color = 'orange';
        }
        this.displayList.add(dl);
      }
    } else if (event.nameEquals(SimList.OBJECT_REMOVED)) {
      var d = this.displayList.findSimObject(obj);
      if (d != null) {
        this.displayList.remove(d);
      }
    }
  }
};

/**
* @return {undefined}
*/
ReactionPendulumApp.prototype.reset = function() {
  this.sim2.config(this.pendulumLength, this.radius, this.startAngle);
  this.sim1.setLength(this.classicLength());
  this.sim1.getVarsList().setValue(0, this.startAngle);
  this.sim1.getVarsList().setValue(1, 0); // velocity
  this.sim1.getVarsList().setValue(2, 0); // time
  this.sim1.saveInitialState();
  this.simRun.reset();
};

/**
* @return {number}
*/
ReactionPendulumApp.prototype.getStartAngle = function() {
  return this.startAngle;
};

/**
* @param {number} value
*/
ReactionPendulumApp.prototype.setStartAngle = function(value) {
  if (this.startAngle != value) {
    this.startAngle = value;
    this.reset();
    this.broadcastParameter(ReactionPendulumSim.en.START_ANGLE);
  }
};

/** Returns equivalent length for classic pendulum when ReactionPendulumSim
* has given length, depends on the length and radius of ReactionPendulumSim.
* @return {number} equivalent length for classic pendulum
*/
ReactionPendulumApp.prototype.classicLength = function() {
  // reaction pendulum with radius r, length h is equivalent to
  // classic pendulum with length = h + r^2 / (2 h)
  return this.pendulumLength + this.radius*this.radius / (2 * this.pendulumLength);
};

/** Return length of ReactionPendulumSim rod
@return {number} length of ReactionPendulumSim rod
*/
ReactionPendulumApp.prototype.getLength = function() {
  return this.pendulumLength;
};

/** Set length of ReactionPendulumSim rod, and set length of classic pendulum
to equivalent length.  See {@link #classicLength}.
@param {number} value length of ReactionPendulumSim rod
*/
ReactionPendulumApp.prototype.setLength = function(value) {
  if (this.pendulumLength != value) {
    this.pendulumLength = value;
    this.reset();
    this.broadcastParameter(ReactionPendulumSim.en.LENGTH);
  }
};

/** Return radius of ReactionPendulumSim bob
@return {number} radius of ReactionPendulumSim bob
*/
ReactionPendulumApp.prototype.getRadius = function() {
  return this.radius;
};

/** Set radius of ReactionPendulumSim bob, and set length of classic pendulum
to according equivalent length.  See {@link #classicLength}.
@param {number} value radius of ReactionPendulumSim bob
*/
ReactionPendulumApp.prototype.setRadius = function(value) {
  if (this.radius != value) {
    this.radius = value;
    this.reset();
    this.broadcastParameter(ReactionPendulumSim.en.RADIUS);
  }
};

/** Returns the distance between the fixed pivot points of the two pendulums.
* @return {number} distance between the fixed pivot points
*/
ReactionPendulumApp.prototype.getSeparation = function() {
  return this.separation;
};

/** Sets the distance between the fixed pivot points of the two pendulums.
* @param {number} value distance between the fixed pivot points
*/
ReactionPendulumApp.prototype.setSeparation = function(value) {
  if (this.separation != value) {
    this.separation = value;
    this.sim1.setPivot(new Vector(value, 0));
    this.broadcastParameter(ReactionPendulumApp.en.SEPARATION);
  }
};

/** Define short-cut name replacement rules.  For example 'sim2' is replaced
* by 'app.sim2' when `myName` is 'app'.
* @param {string} myName  the name of this object, valid in global Javascript context.
* @export
*/
ReactionPendulumApp.prototype.defineNames = function(myName) {
  if (UtilityCore.ADVANCED)
    return;
  this.terminal.addWhiteList(myName);
  this.terminal.addRegex('advance2|advance1|axes|clock'
      +'|displayClock|energyGraph|graph|layout|scriptParser|sim2|sim1'
      +'|simCtrl|simList2|simList1|simRun|simView|statusView|terminal|timeGraph',
      myName);
  this.terminal.addRegex('simCanvas',
      myName+'.layout');
};

/**
* @return {undefined}
* @export
*/
ReactionPendulumApp.prototype.setup = function() {
  this.clock.resume();
  this.terminal.parseURLorRecall();
  this.sim1.saveInitialState();
  this.sim1.modifyObjects();
};

/** Start the application running.
* @return {undefined}
* @export
*/
ReactionPendulumApp.prototype.start = function() {
  this.simRun.startFiring();
  //console.log(UtilityCore.prettyPrint(this.toString()));
};

/**
* @param {string} script
* @return {*}
* @export
*/
ReactionPendulumApp.prototype.eval = function(script) {
  try {
    return this.terminal.eval(script);
  } catch(ex) {
    alert(ex);
  }
};

/** Set of internationalized strings.
@typedef {{
  SEPARATION: string,
  SHOW_ENERGY_2: string
  }}
*/
ReactionPendulumApp.i18n_strings;

/**
@type {ReactionPendulumApp.i18n_strings}
*/
ReactionPendulumApp.en = {
  SEPARATION: 'separation',
  SHOW_ENERGY_2: 'show energy 2'
};

/**
@private
@type {ReactionPendulumApp.i18n_strings}
*/
ReactionPendulumApp.de_strings = {
  SEPARATION: 'Abstand',
  SHOW_ENERGY_2: 'Energieanzeige 2'
};

/** Set of internationalized strings.
@type {ReactionPendulumApp.i18n_strings}
*/
ReactionPendulumApp.i18n = goog.LOCALE === 'de' ? ReactionPendulumApp.de_strings :
    ReactionPendulumApp.en;

}); // goog.scope
