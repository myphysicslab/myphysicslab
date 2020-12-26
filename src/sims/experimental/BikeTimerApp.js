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

goog.module('myphysicslab.sims.experimental.BikeTimerApp');

goog.require('goog.events');

const Clock = goog.require('myphysicslab.lab.util.Clock');
const DisplayText = goog.require('myphysicslab.lab.view.DisplayText');
const DoubleRect = goog.require('myphysicslab.lab.util.DoubleRect');
const LabCanvas = goog.require('myphysicslab.lab.view.LabCanvas');
const ScreenRect = goog.require('myphysicslab.lab.view.ScreenRect');
const SimObject = goog.require('myphysicslab.lab.model.SimObject');
const SimView = goog.require('myphysicslab.lab.view.SimView');
const Timer = goog.require('myphysicslab.lab.util.Timer');
const Util = goog.require('myphysicslab.lab.util.Util');
const Vector = goog.require('myphysicslab.lab.util.Vector');

/** Timer for Mark Neumann's bike ride record attempt.

### To Do: Update Audio Interface

The `Audio` object used here is deprecated.  Need to use newer HTML5 ways of playing
audio (but without showing any playback controls).
See <https://developer.mozilla.org/en/DOM/HTMLAudioElement>.

*/
class BikeTimerApp {
/**
* @private
*/
constructor() {
  throw '';
};

/**
* @param {string} sound_url the relative URL of sound to play
* @return {undefined}
* @export
*/
static makeBikeTimerApp(sound_url) {
  Util.setErrorHandler();
  var simDiv = window.document.getElementById('sim_applet');
  if (simDiv === null)
    throw 'cannot find sim_applet';
  //var body = window.document.getElementById('body');
  var canvas = /** @type {!HTMLCanvasElement} */(document.createElement('canvas'));
  var simCanvas = new LabCanvas(canvas, 'canvas1');
  simCanvas.setSize(800, 500);
  simDiv.appendChild(simCanvas.getCanvas());
  var simRect = new DoubleRect(/*left=*/-5, /*bottom=*/-5, /*right=*/5, /*top=*/5);
  var simView = new SimView('simView', simRect);
  var timer = new Timer();
  var clock = new Clock();

  var dtext1 = new DisplayText('0.0', new Vector(2, -1));
  dtext1.setFont('160pt sans-serif');
  dtext1.setTextAlign('center');
  dtext1.setTextBaseline('middle');
  simView.getDisplayList().add(dtext1);

  simCanvas.addView(simView);
  var beep2 = new Audio(sound_url);
  if (0 == 1) {
    beep2.play();  // pre-load the sound.
  }

  var period = 10.1;
  var startTime = 3.0;
  var shouldBeep = true;

  clock.setTime(-startTime);
  timer.setCallBack(() => {
    var now = clock.getTime();
    var t = period*Math.ceil(now/period) - now;
    dtext1.setText(t.toFixed(1));
    //console.log('t='+t+' t2='+t2+' lastBeepTime='+lastBeepTime+' period='+period);
    if (t > period - 2) {
      if (shouldBeep) {
        beep2.play();
        shouldBeep = false;
      }
    } else {
      shouldBeep = true;
    }
    simCanvas.paint();
  });

  var resetButton = document.getElementById('reset_button');
  if (resetButton != null) {
    resetButton.onclick = () => {
      clock.pause();
      clock.setTime(-startTime);
      shouldBeep = true;
    };
  };

  var stopButton = document.getElementById('stop_button');
  if (stopButton != null) {
    stopButton.onclick = () => clock.pause();
  };

  var startButton = document.getElementById('start_button');
  if (startButton != null) {
    startButton.onclick = () => clock.resume();
  };

  // Find the period field which is defined in HTML
  var field_period = /** @type {!HTMLInputElement} */
      (document.getElementById('period_field'));
  if (field_period != null) {
    field_period.textAlign = 'right'; // this is not working
    field_period.value = period.toFixed(1);
    goog.events.listen(field_period, goog.events.EventType.CHANGE,
      /*callback=*/event => {
        //console.log('period change '+field_period.value);
        var value = parseFloat(field_period.value);
        if (isNaN(value)) {
          field_period.value = period.toFixed(1);
        } else {
          period = value;
        }
    });
  };

  var field_start = /** @type {!HTMLInputElement} */
      (document.getElementById('start_field'));
  if (field_start != null) {
    field_start.textAlign = 'right'; // this is not working
    field_start.value = startTime.toFixed(1);
    goog.events.listen(field_start, goog.events.EventType.CHANGE,
      /*callback=*/event => {
        //console.log('startTime change '+field_start.value);
        var value = parseFloat(field_start.value);
        if (isNaN(value)) {
          field_start.value = startTime.toFixed(1);
        } else {
          startTime = value;
        }
    });
  };

  timer.startFiring();
  clock.pause();
};

} // end class

goog.exportSymbol('makeBikeTimerApp', BikeTimerApp.makeBikeTimerApp);

exports = BikeTimerApp;
