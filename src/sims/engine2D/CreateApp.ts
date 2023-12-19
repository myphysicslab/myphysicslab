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
import { Arc } from '../../lab/model/Arc.js';
import { AutoScale } from '../../lab/graph/AutoScale.js';
import { ButtonControl } from '../../lab/controls/ButtonControl.js';
import { CircularEdge } from '../../lab/engine2D/CircularEdge.js';
import { Clock, ClockTask } from '../../lab/util/Clock.js';
import { CollisionAdvance } from '../../lab/model/CollisionAdvance.js';
import { CommonControls } from '../common/CommonControls.js';
import { ConcreteVertex } from '../../lab/engine2D/ConcreteVertex.js';
import { ConstantForceLaw } from '../../lab/model/ConstantForceLaw.js';
import { ContactSim } from '../../lab/engine2D/ContactSim.js';
import { CoordType } from '../../lab/model/CoordType.js';
import { DampingLaw } from '../../lab/model/DampingLaw.js';
import { DisplayClock } from '../../lab/view/DisplayClock.js';
import { DisplayGraph } from '../../lab/graph/DisplayGraph.js';
import { DisplayLine } from '../../lab/view/DisplayLine.js';
import { DisplayShape } from '../../lab/view/DisplayShape.js';
import { DisplaySpring } from '../../lab/view/DisplaySpring.js';
import { DisplayText } from '../../lab/view/DisplayText.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { ElementIDs } from '../common/Layout.js';
import { EnergyBarGraph } from '../../lab/graph/EnergyBarGraph.js';
import { Engine2DApp } from './Engine2DApp.js';
import { FunctionVariable } from '../../lab/model/FunctionVariable.js';
import { ExtraAccel } from '../../lab/engine2D/ExtraAccel.js';
import { Force } from '../../lab/model/Force.js';
import { ForceLaw } from '../../lab/model/ForceLaw.js';
import { GraphLine } from '../../lab/graph/GraphLine.js';
import { Gravity2Law } from '../../lab/model/Gravity2Law.js';
import { GravityLaw } from '../../lab/model/GravityLaw.js';
import { HorizAlign } from '../../lab/view/HorizAlign.js';
import { Joint } from '../../lab/engine2D/Joint.js';
import { JointUtil } from '../../lab/engine2D/JointUtil.js';
import { LabCanvas } from '../../lab/view/LabCanvas.js';
import { Line } from '../../lab/model/Line.js';
import { ModifiedEuler } from '../../lab/model/ModifiedEuler.js';
import { ParameterBoolean, ParameterNumber, ParameterString, Subject, SubjectList } from '../../lab/util/Observe.js';
import { PointMass } from '../../lab/model/PointMass.js';
import { Polygon } from '../../lab/engine2D/Polygon.js';
import { RandomLCG } from '../../lab/util/Random.js';
import { RungeKutta } from '../../lab/model/RungeKutta.js';
import { ScreenRect } from '../../lab/view/ScreenRect.js';
import { Scrim } from '../../lab/engine2D/Scrim.js';
import { Shapes } from '../../lab/engine2D/Shapes.js';
import { SimList } from '../../lab/model/SimList.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { SimView } from '../../lab/view/SimView.js';
import { Spring } from '../../lab/model/Spring.js';
import { StraightEdge } from '../../lab/engine2D/StraightEdge.js';
import { Terminal } from '../../lab/util/Terminal.js';
import { ThrusterSet } from '../../lab/engine2D/ThrusterSet.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';
import { VerticalAlign } from '../../lab/view/VerticalAlign.js';
import { Walls } from '../../lab/engine2D/Walls.js';

import { CardioidPath } from '../roller/CardioidPath.js';
import { CirclePath } from '../roller/CirclePath.js';
import { DisplayPath } from '../../lab/view/DisplayPath.js';
import { FlatPath } from '../roller/FlatPath.js';
import { HumpPath } from '../roller/HumpPath.js';
import { LemniscatePath } from '../roller/LemniscatePath.js';
import { LoopTheLoopPath } from '../roller/LoopTheLoopPath.js';
import { NumericalPath } from '../../lab/model/NumericalPath.js';
import { OvalPath } from '../roller/OvalPath.js';
import { ParametricPath } from '../../lab/model/ParametricPath.js';
import { PathEndPoint } from '../../lab/engine2D/PathEndPoint.js';
import { PathJoint } from '../../lab/engine2D/PathJoint.js';
import { SpiralPath } from '../roller/SpiralPath.js';

/** CreateApp makes it easier for users to create their own simulation via scripting.
CreateApp provides an editor text field for the script that is being run, and an
execute button to re-run the script.

Intended for scripting, this provides a ContactSim but no RigidBody objects or
ForceLaws. The RigidBody objects and ForceLaws should be created via scripting such as
a [URL Query Script](./lab_util_Terminal.Terminal.html#md:url-query-script).
*/
export class CreateApp extends Engine2DApp<ContactSim> implements Subject, SubjectList {
  editor_: HTMLTextAreaElement;

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
  //this.addPlaybackControls();
  //this.addStandardControls();
  this.makeEasyScript();
  this.graphSetup();
  // After an error in the script we want to do "show terminal"
  // so the user can understand whats going on.
  // Test by writing an error like "2+;" into Billiards2App.html's script.
  this.terminal.afterErrorFn = ()=>this.layout.showTerminal(true);
  this.terminal.addRegex('CardioidPath|CirclePath|DisplayPath|FlatPath|HumpPath'+
      '|LemniscatePath|LoopTheLoopPath|OvalPath|SpiralPath',
      'sims$$roller$$', /*addToVars=*/false);
  this.editor_ = document.getElementById('editor') as HTMLTextAreaElement;
  const b = document.getElementById('execute_button') as HTMLButtonElement;
  const bc = new ButtonControl('execute', ()=>this.terminal.eval(this.editor_.value), undefined, b);
};

/** @inheritDoc */
override toString() {
  return this.toStringShort().slice(0, -1)
      + super.toString();
};

/** @inheritDoc */
getClassName() {
  return 'CreateApp';
};

/** Start the application running.
*/
override setup(): void {
  this.clock.resume();
  this.parseURL();
};

/** @inheritDoc */
override start() {
  this.simRun.pause();
  this.simRun.startFiring();
};

/** Display the URL of the GitHub Gist on the web page.
There should be an `<a>` tag with the id `gist_link` on the page.
@param url
*/
setGistLink(url: null|string) {
  if (url) {
    const e = document.getElementById('gist_link');
    if (e) {
      const a = e as HTMLAnchorElement;
      a.href = url;
      // '_blank' means "open the GitHub Gist in a new tab"
      a.target = '_blank';
      //a.text = url;
    }
  }
};

/** Display the description of the GitHub Gist on the web page.
There should be a `<span>` tag with the id `gist_desc` on the page.
@param desc
*/
setDescription(desc: null|string) {
  if (desc) {
    const e = document.getElementById('gist_desc');
    if (e) {
      const p = e as HTMLSpanElement;
      // remove the URL from description.  Example URL:
      // https://www.myphysicslab.com/gist1-en.html?gist=f2da00fdb3715f059884bb11f5b
      const d = desc.replace(/https:\/\/www\.myphysicslab\.com\/gist\S+/, '');
      p.textContent = d;
    }
  }
};

/** Display the author of the GitHub Gist on the web page.
There should be an `<a>` tag with the id `gist_author` on the page.
@param login
@param html_url
*/
setAuthor(login: null|string, html_url: null|string) {
  if (login) {
    const e = document.getElementById('gist_author');
    if (e) {
      const a = e as HTMLAnchorElement;
      if (html_url) {
        a.href = html_url;
      }
      a.text = login;
    }
  }
};

/** Parse the query portion of the URL and load the specified GitHub Gist, the script
found there is then run to create the simulation.
For example the URL might be
<https://www.myphysicslab.com/develop/build/sims/engine2D/CreateApp-en.html?gist=1b1b5b5399174048bc172451f3d7d997;file=CircleTrack.js>
We extract the gist, and optionally the file name.  If the file name is not specified,
then we fetch the first file found in the gist.
*/
parseURL(): void {
  const loc = window.location.href;
  const queryIdx = loc.indexOf('?');
  if (queryIdx > -1) {
    let cmd = loc.slice(queryIdx); // leave the ? at start of query
    // decode the percent-encoded URL
    // See https://en.wikipedia.org/wiki/Percent-encoding
    cmd = decodeURIComponent(cmd);
    let result = cmd.match(/(\?|;)gist=([\w]+);?/);
    if (result) {
      const gist = result[2];
      if (!gist.length) {
        throw `gist not specified: ${cmd}`;
      }
      // optional: can specify the name of the gist file
      let file = '';
      result = cmd.match(/(\?|;)file=([\w.]+);?/);
      if (result != null) {
        file = result[2];
      }
      fetch('https://api.github.com/gists/'+gist)
      .then(response => {
          if (!response.ok) {
            throw `gist ${gist} not found; HTTP status = ${response.status}`;
          }
          return response.json();
      })
      .then(data => {
        const owner = data['owner'];
        if (owner) {
          this.setAuthor(owner['login'], owner['html_url']);
        }
        this.setGistLink(data['html_url']);
        this.setDescription(data.description);
        if (!file) {
          // find the first file defined in gist
          const nms = Util.propertiesOf(data.files);
          if (!nms.length) {
            throw `gist ${gist} has no file`;
          }
          file = nms[0];
        }
        if (!data.files[file]) {
          throw `file ${file} not found in gist ${gist}`;
        }
        this.editor_.value = data.files[file].content;
        this.terminal.eval(this.editor_.value);
        return;
      })
      .catch(err => { console.log(err); alert(err) });
    } else {
      // query but no gist, run default script
      this.terminal.eval(this.editor_.value);
    }
  } else {
    // no query; run default script
    this.terminal.eval(this.editor_.value);
  }
};

/** Force classes to be bundled (by esbuild), so they can be used in Terminal
* scripts.
*/
static override loadClass(): void {
  super.loadClass();
  var s;
  s = VerticalAlign.TOP;
  s = HorizAlign.LEFT;
  s = ExtraAccel.VELOCITY;
  s = CoordType.BODY;
  var f = AffineTransform.toString;
  f = Arc.toString;
  f = AutoScale.toString;
  f = ButtonControl.toString;
  f = CardioidPath.toString;
  f = CirclePath.toString;
  f = CircularEdge.toString;
  f = Clock.toString;
  f = ClockTask.toString;
  f = CollisionAdvance.toString;
  f = CommonControls.toString;
  f = ConcreteVertex.toString;
  f = ConstantForceLaw.toString;
  f = ContactSim.toString;
  f = DampingLaw.toString;
  f = DisplayClock.toString;
  f = DisplayGraph.toString;
  f = DisplayLine.toString;
  f = DisplayPath.toString;
  f = DisplayShape.toString;
  f = DisplaySpring.toString;
  f = DisplayText.toString;
  f = DoubleRect.toString;
  f = EnergyBarGraph.toString;
  f = Engine2DApp.toString;
  f = FunctionVariable.toString;
  f = FlatPath.toString;
  f = Force.toString;
  f = GraphLine.toString;
  f = Gravity2Law.toString;
  f = GravityLaw.toString;
  f = HumpPath.toString;
  f = Joint.toString;
  f = JointUtil.toString;
  f = LabCanvas.toString;
  f = LemniscatePath.toString;
  f = LoopTheLoopPath.toString;
  f = ModifiedEuler.toString;
  f = NumericalPath.toString;
  f = OvalPath.toString;
  f = ParameterBoolean.toString;
  f = ParameterNumber.toString;
  f = ParameterString.toString;
  f = PathEndPoint.toString;
  f = PathJoint.toString;
  f = PointMass.toString;
  f = Polygon.toString;
  f = RandomLCG.toString;
  f = RungeKutta.toString;
  f = ScreenRect.toString;
  f = Scrim.toString;
  f = Shapes.toString;
  f = SimList.toString;
  f = SimView.toString;
  f = SpiralPath.toString;
  f = Spring.toString;
  f = StraightEdge.toString;
  f = Terminal.toString;
  f = ThrusterSet.toString;
  f = Util.toString;
  f = Vector.toString;
  f = Walls.toString;
};

} // end class
Util.defineGlobal('sims$engine2D$CreateApp', CreateApp);
