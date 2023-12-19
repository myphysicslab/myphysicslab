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

import { Clock } from '../../lab/util/Clock.js';
import { DisplayText } from '../../lab/view/DisplayText.js';
import { DoubleRect } from '../../lab/util/DoubleRect.js';
import { LabCanvas } from '../../lab/view/LabCanvas.js';
import { ScreenRect } from '../../lab/view/ScreenRect.js';
import { SimObject } from '../../lab/model/SimObject.js';
import { SimView } from '../../lab/view/SimView.js';
import { Timer } from '../../lab/util/Timer.js';
import { Util } from '../../lab/util/Util.js';
import { Vector } from '../../lab/util/Vector.js';

/** Timer for Mark Neumann's bike ride record attempt.

**TO DO** Update Audio Interface

The `Audio` object used here is deprecated.  Need to use newer HTML5 ways of playing
audio (but without showing any playback controls).
See <https://developer.mozilla.org/en/DOM/HTMLAudioElement>.

@param sound_url the relative URL of sound to play
*/
export function makeBikeTimerApp(sound_url: string): void {
  Util.setErrorHandler();
  const simDiv = Util.getElementById('sim_applet') as HTMLDivElement;
  const canvas = document.createElement('canvas');
  const simCanvas = new LabCanvas(canvas, 'canvas1');
  simCanvas.setSize(800, 500);
  simDiv.appendChild(canvas);
  const simRect = new DoubleRect(/*left=*/-5, /*bottom=*/-5, /*right=*/5, /*top=*/5);
  const simView = new SimView('simView', simRect);
  const timer = new Timer();
  const clock = new Clock();

  const dtext1 = new DisplayText('0.0', new Vector(2, -1));
  dtext1.setFont('160pt sans-serif');
  dtext1.setTextAlign('center');
  dtext1.setTextBaseline('middle');
  simView.getDisplayList().add(dtext1);

  simCanvas.addView(simView);
  const beep2 = new Audio(sound_url);
  // @ts-ignore
  if (0 == 1) {
    beep2.play();  // pre-load the sound.
  }

  let period = 10.1;
  let startTime = 3.0;
  let shouldBeep = true;

  clock.setTime(-startTime);
  timer.setCallBack(() => {
    const now = clock.getTime();
    const t = period*Math.ceil(now/period) - now;
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

  const resetButton = Util.getElementById('reset_button') as HTMLInputElement;
  resetButton.onclick = () => {
    clock.pause();
    clock.setTime(-startTime);
    shouldBeep = true;
  };

  const stopButton = Util.getElementById('stop_button') as HTMLInputElement;
  stopButton.onclick = () => clock.pause();

  const startButton = Util.getElementById('start_button') as HTMLInputElement;
  startButton.onclick = () => clock.resume();

  // Find the period field which is defined in HTML
  const field_period = Util.getElementById('period_field') as HTMLInputElement;
  field_period.style.textAlign = 'right';
  field_period.value = period.toFixed(1);
  field_period.addEventListener('change', _event => {
      //console.log('period change '+field_period.value);
      const value = parseFloat(field_period.value);
      if (isNaN(value)) {
        field_period.value = period.toFixed(1);
      } else {
        period = value;
      }
  });

  const field_start = Util.getElementById('start_field') as HTMLInputElement;
  field_start.style.textAlign = 'right';
  field_start.value = startTime.toFixed(1);
  field_start.addEventListener('change', _event => {
      //console.log('startTime change '+field_start.value);
      const value = parseFloat(field_start.value);
      if (isNaN(value)) {
        field_start.value = startTime.toFixed(1);
      } else {
        startTime = value;
      }
  });

  timer.startFiring();
  clock.pause();
};
Util.defineGlobal('sims$experimental$makeBikeTimerApp', makeBikeTimerApp);
