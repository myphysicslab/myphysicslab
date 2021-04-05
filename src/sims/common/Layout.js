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

goog.module('myphysicslab.sims.common.Layout');

const dom = goog.require('goog.dom');

const LabControl = goog.require('myphysicslab.lab.controls.LabControl');
const LabCanvas = goog.require('myphysicslab.lab.view.LabCanvas');
const SubjectList = goog.require('myphysicslab.lab.util.SubjectList');
const Terminal = goog.require('myphysicslab.lab.util.Terminal');

/**
* @interface
*/
class Layout extends SubjectList {

/** Add the control to the set of simulation controls.
* @param {!LabControl} control
* @param {boolean=} opt_add whether to also add to SimControls, default is true
* @return {!LabControl} the control that was passed in
*/
addControl(control, opt_add) {};

/** 
* @return {!LabCanvas}
*/
getGraphCanvas() {};

/** div for graph controls
* @return {!HTMLElement}
*/
getGraphControls() {};

/** 
* @return {!HTMLElement}
*/
getGraphDiv() {};

/** 
* @return {!LabCanvas}
*/
getSimCanvas() {};

/** div for graph controls
* @return {!HTMLElement}
*/
getSimControls() {};

/** 
* @return {!HTMLElement}
*/
getSimDiv() {};

/** 
* @return {!LabCanvas}
*/
getTimeGraphCanvas() {};

/** div for graph controls
* @return {!HTMLElement}
*/
getTimeGraphControls() {};

/** 
* @return {!HTMLElement}
*/
getTimeGraphDiv() {};

/**
* @return {!Terminal}
*/
getTerminal() {};

} // end class

exports = Layout;
