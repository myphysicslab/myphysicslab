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

goog.module('myphysicslab.lab.util.Parser');

const Printable = goog.require('myphysicslab.lab.util.Printable');

/** Executes a script.
* @interface
*/
class Parser extends Printable {

/** Adds a single-word command to this Parser. When the Parser sees this command during
{@link #parse} it will execute the given function. The function result is returned as
the result of `parse`.

The function must return a value other than `undefined`, otherwise a script syntax
error will be indicated to the user.

* @param {string} commandName name of command
* @param {function()} commandFnc function to execute
* @param {string} helpText description of the command for help text
*/
addCommand(commandName, commandFnc, helpText) {}

/** Interprets and executes a script.
* @param {string} script the script to parse and execute
* @return {*} the value of the script, or `undefined` if the script did not fit
*     the allowed syntax
* @throws {!Error} if executing the script causes an error
*/
parse(script) {}

/** Saves current application and simulation state to compare against when generating a
script later on. This helps shorten the script by not including settings that are
unchanged.
* @return {undefined}
*/
saveStart() {}

} // end class
exports = Parser;
