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

goog.module('myphysicslab.sims.common.CommonControls');

const AbstractSubject = goog.require('myphysicslab.lab.util.AbstractSubject');
const ButtonControl = goog.require('myphysicslab.lab.controls.ButtonControl');
const ChoiceControlBase = goog.require('myphysicslab.lab.controls.ChoiceControlBase');
const DisplayAxes = goog.require('myphysicslab.lab.graph.DisplayAxes');
const DisplayClock = goog.require('myphysicslab.lab.view.DisplayClock');
const EasyScriptParser = goog.require('myphysicslab.lab.util.EasyScriptParser');
const EnergyBarGraph = goog.require('myphysicslab.lab.graph.EnergyBarGraph');
const GenericObserver = goog.require('myphysicslab.lab.util.GenericObserver');
const GroupControl = goog.require('myphysicslab.lab.controls.GroupControl');
const HorizAlign = goog.require('myphysicslab.lab.view.HorizAlign');
const LabCanvas = goog.require('myphysicslab.lab.view.LabCanvas');
const LabView = goog.require('myphysicslab.lab.view.LabView');
const ParameterBoolean = goog.require('myphysicslab.lab.util.ParameterBoolean');
const SimRunner = goog.require('myphysicslab.lab.app.SimRunner');
const SimView = goog.require('myphysicslab.lab.view.SimView');
const Subject = goog.require('myphysicslab.lab.util.Subject');
const Terminal = goog.require('myphysicslab.lab.util.Terminal');
const ToggleControl = goog.require('myphysicslab.lab.controls.ToggleControl');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');
const VerticalAlign = goog.require('myphysicslab.lab.view.VerticalAlign');

/** A collection of static functions for making controls, used in several applications.
CommonControls is a 'static' class, meaning it is not instantiated, instead it only a
convenient place to keep several common functions for constructing an application.
*/
class CommonControls {
/**
* @private
*/
constructor() {
  throw '';
};

/** Makes a DisplayAxes which shows the simRect of a SimView, adding it to the SimView;
and makes a GenericObserver which resizes the axes whenever the SimView's simRect
changes (for example because of pan-zoom controls).
* @param {!SimView} simView the SimView to add axes to
* @param {boolean=} bottomLeft_opt true means to align axes at bottom left.
*        We usually want this for the simulation view.  For graphs we want the default
*        which puts the axes thru the origin whenever possible.
* @return {!DisplayAxes} the axes that were created
*/
static makeAxes(simView, bottomLeft_opt) {
  /** @type {!DisplayAxes} */
  var axes = new DisplayAxes(simView.getSimRect());
  if (bottomLeft_opt) {
    axes.setXAxisAlignment(VerticalAlign.BOTTOM);
    axes.setYAxisAlignment(HorizAlign.LEFT);
  }
  new GenericObserver(simView, evt => {
      if (evt.nameEquals(LabView.COORD_MAP_CHANGED)) {
        var r = simView.getCoordMap().screenToSimRect(simView.getScreenRect());
        axes.setSimRect(r);
      }
    }, 'resize axes');
  simView.getDisplayList().add(axes);
  return axes;
};

/** Makes pop-up menu of choices for background color plus options for "trails" which
turns on the global alpha transparency feature in LabCanvas. See
{@link LabCanvas#setAlpha} and
{@link LabCanvas#setBackground}.
* @param {!LabCanvas} labCanvas
* @return {!ChoiceControlBase}
*/
static makeBackgroundMenu(labCanvas) {
  var choices = [
      CommonControls.i18n.WHITE,
      CommonControls.i18n.BLACK,
      CommonControls.i18n.WHITE_WITH_TRAILS,
      CommonControls.i18n.BLACK_WITH_TRAILS,
      CommonControls.i18n.WHITE_WITH_LONG_TRAILS,
      CommonControls.i18n.BLACK_WITH_LONG_TRAILS
    ];
  var values = [
      CommonControls.en.WHITE,
      CommonControls.en.BLACK,
      CommonControls.en.WHITE_WITH_TRAILS,
      CommonControls.en.BLACK_WITH_TRAILS,
      CommonControls.en.WHITE_WITH_LONG_TRAILS,
      CommonControls.en.BLACK_WITH_LONG_TRAILS
    ];
  values = values.map(v => Util.toName(v));
  var longAlpha = CommonControls.LONG_TRAILS;
  var shortAlpha = CommonControls.SHORT_TRAILS;
  var getter = () => {
    var bg = labCanvas.getBackground();
    var alpha = labCanvas.getAlpha();
    if (bg == '') {
      return values[0];
    } else if (bg == 'black') {
      if (!Util.veryDifferent(alpha, 1)) {
        return values[1];
      } else if (!Util.veryDifferent(alpha, shortAlpha)) {
        return values[3];
      } else if (!Util.veryDifferent(alpha, longAlpha)) {
        return values[5];
      }
    } else if (bg == 'white') {
      if (!Util.veryDifferent(alpha, 1)) {
        return values[0];
      } else if (!Util.veryDifferent(alpha, shortAlpha)) {
        return values[2];
      } else if (!Util.veryDifferent(alpha, longAlpha)) {
        return values[4];
      }
    }
    return -1;
  };
  /** @type function(string) */
  var setter = value => {
    var idx = goog.array.indexOf(values, value);
    switch (idx) {
      case 0: labCanvas.setBackground(''); labCanvas.setAlpha(1); break;
      case 1: labCanvas.setBackground('black'); labCanvas.setAlpha(1); break;
      case 2: labCanvas.setBackground('white'); labCanvas.setAlpha(shortAlpha); break;
      case 3: labCanvas.setBackground('black'); labCanvas.setAlpha(shortAlpha); break;
      case 4: labCanvas.setBackground('white'); labCanvas.setAlpha(longAlpha); break;
      case 5: labCanvas.setBackground('black'); labCanvas.setAlpha(longAlpha); break;
      default:
    }
  };
  var menu = new ChoiceControlBase(choices, values, getter, setter,
      CommonControls.i18n.BACKGROUND);
  labCanvas.addObserver(menu);
  return menu;
};

/** Makes controls for pan and zoom of a SimView. Use gray icons so that they are
* visible with black background or white background.
* @param {!SimView} simView the SimView under control
* @param {boolean} overlay whether the controls should appear over the parent element
* @param {function()} resetFunc function to execute when click on center button, it
*        should reset the SimView to the original default location and scale
* @return {!Element} the div containing the pan-zoom controls.
*/
static makePanZoomControls(simView, overlay, resetFunc) {
  var imagesPath = Util.IMAGES_DIR+'/';
  // There are several nested div's used to achieve the layout.
  // <div>
  //   <div style=float: right;>
  //     <button>plus-icon</button>
  //     <button>minus-icon</button>
  //   </div>
  //   <div>
  //     <div>
  //       <button>up</button>
  //     </div>
  //     <div>
  //       <button>left</button>
  //       <button>reset</button>
  //       <button>right</button>
  //     </div>
  //     <div>
  //       <button>down</button>
  //     </div>
  //   </div>
  // </div>
  // Set debug = true to see the div's.
  var debug = false;
  var sz = 30;
  var up_div = /** @type {!Element}*/(document.createElement('div'));
  if (debug) up_div.style.border = 'dashed red thin';
  up_div.style.width = (sz*3.2)+'px';
  var img = Util.createImage(imagesPath+'up_gray.png', sz);
  /** @type {!ButtonControl} */
  var bc = new ButtonControl('up', () => simView.panUp(), img);
  bc.repeatDelay = 100;
  up_div.appendChild(bc.getElement());

  var mid_div = /** @type {!Element}*/(document.createElement('div'));
  if (debug) mid_div.style.border = 'dashed red thin';
  mid_div.style.width = up_div.style.width;
  img = Util.createImage(imagesPath+'backward_gray.png', sz);
  bc = new ButtonControl('left', () => simView.panLeft(), img);
  bc.repeatDelay = 100;
  mid_div.appendChild(bc.getElement());
  img = Util.createImage(imagesPath+'target_gray.png', sz);
  bc = new ButtonControl('reset', resetFunc, img);
  mid_div.appendChild(bc.getElement());
  img = Util.createImage(imagesPath+'forward_gray.png', sz);
  bc = new ButtonControl('right', () => simView.panRight(), img);
  bc.repeatDelay = 100;
  mid_div.appendChild(bc.getElement());

  var down_div = /** @type {!Element}*/(document.createElement('div'));
  img = Util.createImage(imagesPath+'down_gray.png', sz);
  bc = new ButtonControl('down', () => simView.panDown(), img);
  bc.repeatDelay = 100;
  down_div.appendChild(bc.getElement());
  if (debug) down_div.style.border = 'dashed red thin';
  down_div.style.width = up_div.style.width;

  var pan_div = /** @type {!Element}*/(document.createElement('div'));
  pan_div.appendChild(up_div);
  pan_div.appendChild(mid_div);
  pan_div.appendChild(down_div);
  if (debug) pan_div.style.border = 'dashed green thin';
  pan_div.style.textAlign = 'center';

  var zoom_div = /** @type {!Element}*/(document.createElement('div'));
  img = Util.createImage(imagesPath+'plus_gray.png', sz);
  bc = new ButtonControl('zoomIn', () => simView.zoomIn(), img);
  bc.repeatDelay = 100;
  zoom_div.appendChild(bc.getElement());
  zoom_div.appendChild(document.createElement('BR'));
  img = Util.createImage(imagesPath+'minus_gray.png', sz);
  bc = new ButtonControl('zoomOut', () => simView.zoomOut(), img);
  bc.repeatDelay = 100;
  zoom_div.appendChild(bc.getElement());
  // When a CSS property, such as the float property, has a name that is a reserved
  // word in JavaScript, that name is prefixed with 'css' to create a legal
  // CSSStyleDeclaration name. Thus, to set or query the value of the CSS float property
  // of an element, use the cssFloat property of the CSSStyleDeclaration object.
  zoom_div.style.cssFloat = 'right';
  zoom_div.style.marginTop = (sz*0.6)+'px';
  if (debug) zoom_div.style.border = 'dashed blue thin';

  // To overlay the controls on top of canvas:  put the controls in a div;
  // use absolute positioning to place the div on top of canvas.
  var panzoom_div = /** @type {!Element}*/(document.createElement('div'));
  if (overlay) {
    panzoom_div.style.position = 'absolute';
    panzoom_div.style.right = '10%';
    panzoom_div.style.bottom = '12%';
    //panzoom_div.style.opacity=0.13;
    panzoom_div.style.width = (sz*4.2)+'px';
  }
  panzoom_div.appendChild(zoom_div);
  panzoom_div.appendChild(pan_div);
  if (debug) panzoom_div.style.border = 'solid gray thin';
  // Default is not visible.
  panzoom_div.style.display = 'none';
  return panzoom_div;
};

/** Make rewind, pause/play, and step controls for SimRunner. Uses icons from the
`images` directory with names `rewind.png`, `forward.png`, `pause.png`, `next.png`.
* @param {!SimRunner} simrun
* @param {boolean=} opt_overlay whether the controls should appear over the parent_div,
*       default is false.
* @return {!GroupControl}
*/
static makePlaybackControls(simrun, opt_overlay) {
  var imagesPath = Util.IMAGES_DIR+'/';
  // To overlay the controls on top of canvas:  put the controls in a div;
  // use absolute positioning to place the div on top of canvas.
  var timer_div =  /** @type {!Element}*/(document.createElement('div'));
  // for debugging: show border of timer_div
  //timer_div.style.border = 'dashed 1px blue';
  // use 'inline-block', so that the icons stay together horizontally.
  //timer_div.style.display = 'inline-block';
  timer_div.style.display = 'block';
  if (opt_overlay) {
    timer_div.style.position = 'absolute';
    timer_div.style.left = '0';
    timer_div.style.bottom = '0';
    timer_div.style.opacity=0.5;
  }
  var sz = 30;
  var img = Util.createImage(imagesPath+'rewind.png', sz);
  /** @type {!ButtonControl} */
  var bc1 = new ButtonControl(SimRunner.i18n.RESTART, () => simrun.reset(), img);
  timer_div.appendChild(bc1.getElement());
  img =  Util.createImage(imagesPath+'forward.png', sz);
  var img2 =  Util.createImage(imagesPath+'pause.png', sz);
  var tc = new ToggleControl(simrun.getParameterBoolean(SimRunner.en.RUNNING), img, img2);
  timer_div.appendChild(tc.getElement());
  img =  Util.createImage(imagesPath+'next.png', sz);
  var bc2 = new ButtonControl(SimRunner.i18n.STEP, () => simrun.step(), img);
  bc2.repeatDelay = 100;
  timer_div.appendChild(bc2.getElement());
  var gc = new GroupControl('playback', timer_div, [bc1, tc, bc2]);
  return gc;
};

/** Creates a EasyScriptParser with additional commands 'reset' and 'step' for
controlling the SimRunner
* @param {!Array<!Subject>} subjects list of Subject's to gather Parameters from;
*    note that the order here is significant; the Parameters are processed according
*    to the order of the Subjects in this list.
* @param {!Array<!Subject>} dependent those Subject's whose initial conditions
*    change depending on another configuration parameter. Generally this is the
*    VarsList of a simulation. These must also be included in `subjects`.
* @param {!SimRunner} simRun the SimRunner to use for 'reset' and 'step' commands
* @param {!Terminal} terminal the Terminal that executes scripts
* @return {!EasyScriptParser}
*/
static makeEasyScript(subjects, dependent, simRun, terminal) {
  var easyScript = new EasyScriptParser(subjects, dependent);
  easyScript.addCommand('reset', () => simRun.reset(),
    'sets simulation to initial conditions');
  easyScript.addCommand('save', () => simRun.save(),
    'saves simulation initial conditions');
  easyScript.addCommand('step', () => simRun.step(),
    'advance simulation by a small time increment');
  easyScript.addCommand('pause', () => simRun.pause(),
    'pause simulation');
  easyScript.addCommand('resume', () => simRun.resume(),
    'resume simulation');
  terminal.setParser(easyScript);
  return easyScript;
};

/** Makes a ParameterBoolean named `SHOW_CLOCK` for a DisplayClock. The
ParameterBoolean causes the DisplayClock to be added to the targetView.

Makes a GenericObserver which observes the targetView and broadcasts
the ParameterBoolean whenever the DisplayClock is added or removed from the
targetView.

* @param {!DisplayClock} displayClock
* @param {!SimView} targetView where to show the EnergyBarGraph
* @param {!AbstractSubject} subject where to add the ParameterBoolean
* @return {!ParameterBoolean}
*/
static makeShowClockParam(displayClock, targetView, subject) {
  var displayList = targetView.getDisplayList();
  var pb = new ParameterBoolean(subject, DisplayClock.en.SHOW_CLOCK,
      DisplayClock.i18n.SHOW_CLOCK,
      () => displayList.contains(displayClock),
      (value) => {
        if (value) {
          displayList.add(displayClock);
        } else {
          displayList.remove(displayClock);
        }
        subject.broadcastParameter(DisplayClock.en.SHOW_CLOCK);
      });
  subject.addParameter(pb);
  new GenericObserver(displayList, event => {
      if (event.getValue() == displayClock) {
        subject.broadcastParameter(DisplayClock.en.SHOW_CLOCK);
      }
    }, 'broadcast show clock parameter');
  return pb;
};

/** Makes a ParameterBoolean named `SHOW_ENERGY` for an EnergyBarGraph. The
ParameterBoolean causes the EnergyBarGraph to be added to the targetView.

Sets size of EnergyBarGraph based on the targetView size.

Makes a GenericObserver which observes the targetView and broadcasts the
ParameterBoolean whenever the EnergyBarGraph is added or removed from the targetView.

* @param {!EnergyBarGraph} energyGraph
* @param {!SimView} targetView where to show the EnergyBarGraph
* @param {!AbstractSubject} subject where to add the ParameterBoolean
* @param {string=} opt_name name of parameter (optional)
* @param {string=} opt_i18n_name localized name of parameter (optional)
* @return {!ParameterBoolean}
*/
static makeShowEnergyParam(energyGraph, targetView, subject, opt_name, opt_i18n_name) {
  var paramName = typeof opt_name === 'string' ? opt_name : EnergyBarGraph.en.SHOW_ENERGY;
  var i18nName = typeof opt_i18n_name === 'string' ? opt_i18n_name :
      EnergyBarGraph.i18n.SHOW_ENERGY;
  var r = targetView.getCoordMap().screenToSimRect(targetView.getScreenRect());
  energyGraph.setVisibleArea(r);
  var displayList = targetView.getDisplayList();
  var pb = new ParameterBoolean(subject, paramName,
      i18nName,
      () => displayList.contains(energyGraph),
      (value) => {
        if (value) {
          displayList.add(energyGraph);
        } else {
          displayList.remove(energyGraph);
        }
        subject.broadcastParameter(paramName);
      });
  subject.addParameter(pb);
  new GenericObserver(displayList, event => {
      if (event.getValue() == energyGraph) {
        subject.broadcastParameter(paramName);
      }
    }, 'broadcast show energy parameter');
  return pb;
};

/** Makes a ParameterBoolean named `PAN_ZOOM` which shows or hides the pan-zoom
controls.
* @param {!Element} panZoomDiv the div containing the pan-zoom controls
* @param {!AbstractSubject} subject where to add the ParameterBoolean
* @return {!ParameterBoolean} the PAN_ZOOM ParmeterBoolean that is created
*/
static makeShowPanZoomParam(panZoomDiv, subject) {
  var pb = new ParameterBoolean(subject, CommonControls.en.PAN_ZOOM,
      CommonControls.i18n.PAN_ZOOM,
      /* getter=*/() => panZoomDiv.style.display != 'none',
      /* setter=*/value => {
        if (value) {
          panZoomDiv.style.display = 'block';
        } else {
          panZoomDiv.style.display = 'none';
        }
        subject.broadcastParameter(CommonControls.en.PAN_ZOOM);
      });
  subject.addParameter(pb);
  return pb;
};

/** Creates a 'share' button that allows the user to copy the URL for the current
page including the script that will set all of the available Parameters.
Presents the user with a prompt showing a text box with the URL + script.
* @param {!EasyScriptParser} easyScript
* @param {!SimRunner} simRun
* @return {!ButtonControl}
*/
static makeURLScriptButton(easyScript, simRun) {
  if (easyScript === undefined) {
    throw '';
  }
  var copyURL = () => {
      var u = easyScript.scriptURL();
      var p = EasyScriptParser.i18n.PROMPT_URL;
      if (u.length > 2048) {
        p = p + '  ' + EasyScriptParser.i18n.WARN_URL_2048;
      }
      // Pause the timer while the synchronous prompt is up;
      // otherwise the timer races ahead but nothing is happening on screen.
      var firing = simRun.getFiring();
      if (firing) {
        simRun.stopFiring();
      }
      window.prompt(p, u);
      if (firing) {
        simRun.startFiring();
      }
    };
  return new ButtonControl(EasyScriptParser.i18n.URL_SCRIPT, copyURL);
};

} // end class

/** Value of alpha for "short trails" effect.
* @type {number}
* @const
*/
CommonControls.SHORT_TRAILS = 0.1;

/** Value of alpha for "long trails" effect.
* @type {number}
* @const
*/
CommonControls.LONG_TRAILS = 0.05;

/** Set of internationalized strings.
@typedef {{
  PAN_ZOOM: string,
  BACKGROUND: string,
  WHITE: string,
  BLACK: string,
  WHITE_WITH_TRAILS: string,
  BLACK_WITH_TRAILS: string,
  WHITE_WITH_LONG_TRAILS: string,
  BLACK_WITH_LONG_TRAILS: string
  }}
*/
CommonControls.i18n_strings;

/**
@type {CommonControls.i18n_strings}
*/
CommonControls.en = {
  PAN_ZOOM: 'pan-zoom',
  BACKGROUND: 'background',
  WHITE: 'white',
  BLACK: 'black',
  WHITE_WITH_TRAILS: 'white with trails',
  BLACK_WITH_TRAILS: 'black with trails',
  WHITE_WITH_LONG_TRAILS: 'white with long trails',
  BLACK_WITH_LONG_TRAILS: 'black with long trails'
};

/**
@private
@type {CommonControls.i18n_strings}
*/
CommonControls.de_strings = {
  PAN_ZOOM: 'pan-zoom',
  BACKGROUND: 'Hintergrund',
  WHITE: 'weiss',
  BLACK: 'schwarz',
  WHITE_WITH_TRAILS: 'weiss mit Pfade',
  BLACK_WITH_TRAILS: 'schwarz mit Pfade',
  WHITE_WITH_LONG_TRAILS: 'weiss mit lange Pfade',
  BLACK_WITH_LONG_TRAILS: 'schwarz mit lange Pfade'
};

/** Set of internationalized strings.
@type {CommonControls.i18n_strings}
*/
CommonControls.i18n = goog.LOCALE === 'de' ? CommonControls.de_strings :
    CommonControls.en;

exports = CommonControls;
