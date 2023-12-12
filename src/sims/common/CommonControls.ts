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

import { AbstractSubject } from '../../lab/util/AbstractSubject.js';
import { ButtonControl } from '../../lab/controls/ButtonControl.js';
import { ChoiceControlBase } from '../../lab/controls/ChoiceControl.js';
import { DisplayAxes } from '../../lab/graph/DisplayAxes.js';
import { DisplayClock } from '../../lab/view/DisplayClock.js';
import { EasyScriptParser } from '../../lab/util/EasyScriptParser.js';
import { EnergyBarGraph } from '../../lab/graph/EnergyBarGraph.js';
import { GenericObserver, ParameterBoolean, Subject } from '../../lab/util/Observe.js';
import { GroupControl } from '../../lab/controls/GroupControl.js';
import { HorizAlign } from '../../lab/view/HorizAlign.js';
import { LabCanvas } from '../../lab/view/LabCanvas.js';
import { SimRunner } from '../../lab/app/SimRunner.js';
import { SimView } from '../../lab/view/SimView.js';
import { Terminal } from '../../lab/util/Terminal.js';
import { ToggleControl } from '../../lab/controls/ToggleControl.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { VerticalAlign } from '../../lab/view/VerticalAlign.js';

/** A collection of static functions for making controls, used in several applications.
CommonControls is a 'static' class, meaning it is not instantiated, instead it only a
convenient place to keep several common functions for constructing an application.
*/
export class CommonControls {
constructor() {
  throw '';
};

/** Makes a DisplayAxes which shows the simRect of a SimView, adding it to the SimView;
* and makes a GenericObserver which resizes the axes whenever the SimView's simRect
* changes (for example because of pan-zoom controls).
* @param simView the SimView to add axes to
* @param bottomLeft_opt true means to align axes at bottom left.
*        We usually want this for the simulation view.  For graphs we want the default
*        which puts the axes thru the origin whenever possible.
* @return the axes that were created
*/
static makeAxes(simView: SimView, bottomLeft_opt?: boolean): DisplayAxes {
  const axes = new DisplayAxes(simView.getSimRect());
  if (bottomLeft_opt) {
    axes.setXAxisAlignment(VerticalAlign.BOTTOM);
    axes.setYAxisAlignment(HorizAlign.LEFT);
  }
  new GenericObserver(simView, evt => {
      if (evt.nameEquals(SimView.COORD_MAP_CHANGED)) {
        const r = simView.getCoordMap().screenToSimRect(simView.getScreenRect());
        axes.setSimRect(r);
      }
    }, 'resize axes');
  simView.getDisplayList().add(axes);
  return axes;
};

/** Makes pop-up menu of choices for background color plus options for "trails" which
* turns on the global alpha transparency feature in LabCanvas. See
* {@link LabCanvas.setAlpha} and {@link LabCanvas.setBackground}.
* @param labCanvas the LabCanvas to provide choices for
*/
static makeBackgroundMenu(labCanvas: LabCanvas): ChoiceControlBase {
  const choices = [
      CommonControls.i18n.WHITE,
      CommonControls.i18n.BLACK,
      CommonControls.i18n.WHITE_WITH_TRAILS,
      CommonControls.i18n.BLACK_WITH_TRAILS,
      CommonControls.i18n.WHITE_WITH_LONG_TRAILS,
      CommonControls.i18n.BLACK_WITH_LONG_TRAILS
    ];
  let values = [
      CommonControls.en.WHITE,
      CommonControls.en.BLACK,
      CommonControls.en.WHITE_WITH_TRAILS,
      CommonControls.en.BLACK_WITH_TRAILS,
      CommonControls.en.WHITE_WITH_LONG_TRAILS,
      CommonControls.en.BLACK_WITH_LONG_TRAILS
    ];
  values = values.map(v => Util.toName(v));
  const longAlpha = CommonControls.LONG_TRAILS;
  const shortAlpha = CommonControls.SHORT_TRAILS;
  const getter = () => {
    const bg = labCanvas.getBackground();
    const alpha = labCanvas.getAlpha();
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
    return '';
  };
  const setter = (value: string) => {
    const idx = values.indexOf(value);
    switch (idx) {
      case 0: labCanvas.setBackground(''); labCanvas.setAlpha(1); break;
      case 1: labCanvas.setBackground('black'); labCanvas.setAlpha(1); break;
      case 2: labCanvas.setBackground('white'); labCanvas.setAlpha(shortAlpha); break;
      case 3: labCanvas.setBackground('black'); labCanvas.setAlpha(shortAlpha); break;
      case 4: labCanvas.setBackground('white'); labCanvas.setAlpha(longAlpha); break;
      case 5: labCanvas.setBackground('black'); labCanvas.setAlpha(longAlpha); break;
      default: throw '';
    }
  };
  const menu = new ChoiceControlBase(choices, values, getter, setter,
      CommonControls.i18n.BACKGROUND);
  labCanvas.addObserver(menu);
  return menu;
};

/** Makes controls for pan and zoom of a SimView. Use gray icons so that they are
* visible with black background or white background.
* @param simView the SimView under control
* @param overlay whether the controls should appear over the parent element,
*        default is `true`
* @param resetFunc optional function to execute when click on center button, it
*        should reset the SimView to the original default location and scale;
*        if undefined, then uses current SimView rectangle
* @return the div containing the pan-zoom controls.
*/
static makePanZoomControls(simView: SimView, overlay: boolean = true, resetFunc?: ()=>void):
    HTMLDivElement {
  const imagesPath = Util.IMAGES_DIR+'/';
  const resetRect = simView.getSimRect();
  if (resetFunc === undefined) {
    resetFunc = () => simView.setSimRect(resetRect);
  }
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
  const debug = false;
  const sz = 30;
  const up_div = document.createElement('div');
  if (debug) up_div.style.border = 'dashed red thin';
  up_div.style.width = (sz*3.2)+'px';
  let img = Util.createImage(imagesPath+'up_gray.png', sz);
  let bc = new ButtonControl('up', () => simView.panUp(), img);
  bc.repeatDelay = 100;
  up_div.appendChild(bc.getElement());

  const mid_div = document.createElement('div');
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

  const down_div = document.createElement('div');
  img = Util.createImage(imagesPath+'down_gray.png', sz);
  bc = new ButtonControl('down', () => simView.panDown(), img);
  bc.repeatDelay = 100;
  down_div.appendChild(bc.getElement());
  if (debug) down_div.style.border = 'dashed red thin';
  down_div.style.width = up_div.style.width;

  const pan_div = document.createElement('div');
  pan_div.appendChild(up_div);
  pan_div.appendChild(mid_div);
  pan_div.appendChild(down_div);
  if (debug) pan_div.style.border = 'dashed green thin';
  pan_div.style.textAlign = 'center';

  const zoom_div = document.createElement('div');
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
  // Note that the enclosing (parent) div needs style 'position: relative' in order to
  // use absolute positioning.
  const panzoom_div = document.createElement('div');
  if (overlay) {
    panzoom_div.style.position = 'absolute';
    panzoom_div.style.left = '5%';
    panzoom_div.style.top = '5%';
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
* `images` directory with names `rewind.png`, `forward.png`, `pause.png`, `next.png`.
* @param simrun the SimRunner to make controls for
* @param opt_overlay whether the controls should appear over the parent_div,
*       default is false.
* @return a GroupControl containing all the controls that were made
*/
static makePlaybackControls(simrun: SimRunner, opt_overlay?: boolean): GroupControl {
  const imagesPath = Util.IMAGES_DIR+'/';
  // To overlay the controls on top of canvas:  put the controls in a div;
  // use absolute positioning to place the div on top of canvas.
  const timer_div =  document.createElement('div');
  // for debugging: show border of timer_div
  //timer_div.style.border = 'dashed 1px blue';
  // use 'inline-block', so that the icons stay together horizontally.
  //timer_div.style.display = 'inline-block';
  // "width: max-content" ensures that the reported width is just what is needed
  // to hold the contents, and no more.
  timer_div.style.width = 'max-content';
  if (opt_overlay) {
    timer_div.style.position = 'absolute';
    timer_div.style.left = '0';
    timer_div.style.bottom = '0';
    timer_div.style.opacity = '0.5';
  }
  const sz = 30;
  let img = Util.createImage(imagesPath+'restart.png', sz);
  const bc1 = new ButtonControl(SimRunner.i18n.RESTART, () => simrun.reset(), img);
  timer_div.appendChild(bc1.getElement());
  img =  Util.createImage(imagesPath+'forward.png', sz);
  const img2 =  Util.createImage(imagesPath+'pause.png', sz);
  const tc = new ToggleControl(simrun.getParameterBoolean(SimRunner.en.RUNNING), img, img2);
  timer_div.appendChild(tc.getElement());
  img =  Util.createImage(imagesPath+'next.png', sz);
  const bc2 = new ButtonControl(SimRunner.i18n.STEP, () => simrun.step(), img);
  bc2.repeatDelay = 100;
  timer_div.appendChild(bc2.getElement());
  const gc = new GroupControl('playback', timer_div, [bc1, tc, bc2]);
  return gc;
};

/** Creates a EasyScriptParser with additional commands 'reset' and 'step' for
* controlling the SimRunner
* @param subjects list of Subject's to gather Parameters from;
*    note that the order here is significant; the Parameters are processed according
*    to the order of the Subjects in this list.
* @param dependent those Subject's whose initial conditions
*    change depending on another configuration parameter. Generally this is the
*    VarsList of a simulation. These must also be included in `subjects`.
* @param simRun the SimRunner to use for 'reset' and 'step' commands
* @param terminal the Terminal that executes scripts
* @return the EasyScriptParser for controlling the SimRunner
*/
static makeEasyScript(subjects: Subject[], dependent: Subject[], simRun: SimRunner,
    terminal: Terminal): EasyScriptParser {
  const easyScript = new EasyScriptParser(subjects, dependent);
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
* ParameterBoolean causes the DisplayClock to be added to the targetView.
*
* Makes a GenericObserver which observes the targetView and broadcasts
* the ParameterBoolean whenever the DisplayClock is added or removed from the
* targetView.
*
* @param displayClock
* @param targetView where to show the EnergyBarGraph
* @param subject where to add the ParameterBoolean
* @return the ParameterBoolean named `SHOW_CLOCK`
*/
static makeShowClockParam(displayClock: DisplayClock, targetView: SimView,
    subject: AbstractSubject): ParameterBoolean {
  const displayList = targetView.getDisplayList();
  const pb = new ParameterBoolean(subject, DisplayClock.en.SHOW_CLOCK,
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
* ParameterBoolean causes the EnergyBarGraph to be added to the targetView.
*
* Sets size of EnergyBarGraph based on the targetView size.
* 
* Makes a GenericObserver which observes the targetView and broadcasts the
* ParameterBoolean whenever the EnergyBarGraph is added or removed from the targetView.
*
* @param energyGraph
* @param targetView where to show the EnergyBarGraph
* @param subject where to add the ParameterBoolean
* @param opt_name name of parameter (optional)
* @param opt_i18n_name localized name of parameter (optional)
* @return the ParameterBoolean named `SHOW_ENERGY`
*/
static makeShowEnergyParam(energyGraph: EnergyBarGraph, targetView: SimView,
    subject: AbstractSubject, opt_name?: string, opt_i18n_name?: string):
    ParameterBoolean {
  const paramName = opt_name ?? EnergyBarGraph.en.SHOW_ENERGY;
  const i18nName = opt_i18n_name ?? EnergyBarGraph.i18n.SHOW_ENERGY;
  const r = targetView.getCoordMap().screenToSimRect(targetView.getScreenRect());
  energyGraph.setVisibleArea(r);
  const displayList = targetView.getDisplayList();
  const pb = new ParameterBoolean(subject, paramName, i18nName,
      /* getter=*/() => displayList.contains(energyGraph),
      /* setter=*/(value: boolean) => {
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
* controls.
* @param panZoomDiv the div containing the pan-zoom controls
* @param subject where to add the ParameterBoolean
* @return the ParmeterBoolean named `PAN_ZOOM`
*/
static makeShowPanZoomParam(panZoomDiv: HTMLDivElement, subject: AbstractSubject):
    ParameterBoolean {
  const pb = new ParameterBoolean(subject, CommonControls.en.PAN_ZOOM,
      CommonControls.i18n.PAN_ZOOM,
      /* getter=*/() => panZoomDiv.style.display != 'none',
      /* setter=*/(value: boolean) => {
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
* page including the script that will set all of the available Parameters.
* Presents the user with a prompt showing a text box with the URL + script.
* @param easyScript
* @param simRun
*/
static makeURLScriptButton(easyScript: EasyScriptParser, simRun: SimRunner):
    ButtonControl {
  const copyURL = () => {
      const u = easyScript.scriptURL();
      let p = EasyScriptParser.i18n.PROMPT_URL;
      if (u.length > 2048) {
        p = p + '  ' + EasyScriptParser.i18n.WARN_URL_2048;
      }
      // Pause the timer while the synchronous prompt is up;
      // otherwise the timer races ahead but nothing is happening on screen.
      const firing = simRun.getFiring();
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

/** Value of alpha for "short trails" effect. */
static readonly SHORT_TRAILS = 0.1;
/** Value of alpha for "long trails" effect. */
static readonly LONG_TRAILS = 0.05;

static readonly en: i18n_strings = {
  PAN_ZOOM: 'pan-zoom',
  BACKGROUND: 'background',
  WHITE: 'white',
  BLACK: 'black',
  WHITE_WITH_TRAILS: 'white with trails',
  BLACK_WITH_TRAILS: 'black with trails',
  WHITE_WITH_LONG_TRAILS: 'white with long trails',
  BLACK_WITH_LONG_TRAILS: 'black with long trails'
};

static readonly de_strings: i18n_strings = {
  PAN_ZOOM: 'pan-zoom',
  BACKGROUND: 'Hintergrund',
  WHITE: 'weiss',
  BLACK: 'schwarz',
  WHITE_WITH_TRAILS: 'weiss mit Pfade',
  BLACK_WITH_TRAILS: 'schwarz mit Pfade',
  WHITE_WITH_LONG_TRAILS: 'weiss mit lange Pfade',
  BLACK_WITH_LONG_TRAILS: 'schwarz mit lange Pfade'
};

static readonly i18n = Util.LOCALE === 'de' ? CommonControls.de_strings : CommonControls.en;

} // end CommonControls class

type i18n_strings = {
  PAN_ZOOM: string,
  BACKGROUND: string,
  WHITE: string,
  BLACK: string,
  WHITE_WITH_TRAILS: string,
  BLACK_WITH_TRAILS: string,
  WHITE_WITH_LONG_TRAILS: string,
  BLACK_WITH_LONG_TRAILS: string
};

Util.defineGlobal('sims$common$CommonControls', CommonControls);
