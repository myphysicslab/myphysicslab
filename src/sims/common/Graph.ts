// Copyright 2021 Erik Neumann.  All Rights Reserved.
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

import { LabControl } from '../../lab/controls/LabControl.js';
import { SubjectList } from '../../lab/util/Observe.js';

/** A graph that shows simulation variables.
*/
export interface Graph extends SubjectList {
  /** Add the control to the set of simulation controls.
  * @param control
  * @return the control that was passed in
  */
  addControl(control: LabControl): LabControl;
};
