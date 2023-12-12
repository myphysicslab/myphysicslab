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

import { CreateApp } from './CreateApp.js';
import { Layout, ElementIDs } from '../common/Layout.js';
import { TabLayout3 } from '../common/TabLayout3.js';

/** CreateApp2 makes it easier for users to create their own simulation via scripting.
CreateApp2 provides an editor text field for the script that is being run, and an
execute button to re-run the script.

Intended for scripting, this provides a ContactSim but no RigidBody objects or
ForceLaws. The RigidBody objects and ForceLaws should be created via scripting such as
a [URL Query Script](./lab_util_Terminal.Terminal.html#md:url-query-script).

CreateApp2 extends {@link CreateApp} by using a different layout {@link TabLayout3}.
*/
export class CreateApp2 extends CreateApp {

/**
* @param elem_ids specifies the names of the HTML
*    elementId's to look for in the HTML document; these elements are where the user
*    interface of the simulation is created.
*/
constructor(elem_ids: ElementIDs) {
  super(elem_ids);
};

/** @inheritDoc */
override getClassName() {
  return 'CreateApp2';
};

/** @inheritDoc */
override makeLayout(elem_ids: ElementIDs): Layout {
  // set canvasWidth to 800, and canvasHeight proportional as in simRect.
  const canvasWidth = 800;
  const canvasHeight = Math.round(canvasWidth * this.simRect.getHeight() /
      this.simRect.getWidth());
  return new TabLayout3(elem_ids, canvasWidth, canvasHeight);
};

} // end class
