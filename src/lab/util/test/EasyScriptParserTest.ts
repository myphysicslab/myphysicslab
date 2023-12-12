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

import { Util } from "../Util.js";
import { Terminal } from "../Terminal.js";

import { EasyScriptParser } from "../EasyScriptParser.js";
import { DoubleRect } from "../DoubleRect.js";
import { SimView } from "../../view/SimView.js"
import { ScreenRect } from "../../view/ScreenRect.js"
import { VarsList, ConcreteVariable } from "../../model/VarsList.js"

import { assertEquals, schedule, startTest, assertThrows,
    assertTrue, assertFalse, assertRoughlyEquals,
    assertUndefined, assertElementsEquals, assertNull, myPrintln }
    from "../../../test/TestRig.js";


export default function scheduleTests() {
  schedule(testEasyScript1);
  schedule(testEasyScript2);
};

const groupName = 'EasyScriptParserTest.';

function testEasyScript1() {
  startTest(groupName+'testEasyScript1');
  // Make several Subjects for EasyScriptParser to operate on:
  // a VarsList, and two SimViews.
  const var_names = [
    'position',
    'velocity',
    'work from damping',
    'time',
    'acceleration',
    'kinetic energy',
    'spring energy',
    'total energy'
  ];
  const i18n_names = [
    'Position',
    'Geschwindigkeit',
    'Arbeit von Dämpfung',
    'Zeit',
    'Beschleunigung',
    'kinetische Energie',
    'Federenergie',
    'gesamte Energie'
  ];
  const va = new VarsList(var_names, i18n_names);
  va.setComputed(2, 4, 5, 6, 7);
  va.setValues([1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8]);
  assertEquals('VARIABLES', va.getName());
  const screenRect = new ScreenRect(0, 0, 500, 300);
  const simRect1 = new DoubleRect(-5, -5, 5, 5);
  const simView1 = new SimView('view1', simRect1);
  simView1.setScreenRect(screenRect);
  assertEquals('VIEW1', simView1.getName());
  const simRect2 = new DoubleRect(0, 0, 1, 1);
  const simView2 = new SimView('view2', simRect2);
  simView2.setScreenRect(screenRect);
  assertEquals('VIEW2', simView2.getName());

  // set up the Terminal with our EasyScriptParser
  const output_elem: HTMLTextAreaElement = document.createElement('textarea');
  const input_elem: HTMLInputElement = document.createElement('input');
  input_elem.type = 'text';
  const t = new Terminal(input_elem, output_elem);
  //window.terminal = new Terminal(input_elem, output_elem);
  Util.defineGlobal('terminal', t, true);
  assertTrue(window.hasOwnProperty('terminal'));
  assertTrue(window['terminal' as keyof typeof window] === t);
  t.clear();
  Terminal.stdRegex(t);
  // EasyScriptParser operates on three Subjects, two are the same type with same
  // Parameter names.
  const easyScript = new EasyScriptParser([va, simView1, simView2]);
  easyScript.saveStart();
  t.setParser(easyScript);
  // Set up a "z variable" to be able to reference "easyScript" in Terminal.
  Object.defineProperty(t.z, 'easyScript', {
    value: easyScript,
    writable: true,
  });
  t.addRegex('easyScript', 'z.', false, true);

  assertEquals(1.1, t.eval('position'));
  assertEquals(1.1, t.eval('position;'));

  // direct calls to EasyScriptParser.parse()
  assertEquals(1.1, easyScript.parse('position'));
  assertEquals(2.2, easyScript.parse('variables.velocity;'));
  assertUndefined(easyScript.parse('foobar'));

  // direct calls to EasyScriptParser.getSubject()
  assertEquals(va , easyScript.getSubject('VARIABLES'));
  assertEquals(simView1 , easyScript.getSubject('view1'));
  assertEquals(simView2 , easyScript.getSubject('view2'));
  assertNull(easyScript.getSubject('foobar'));

  // direct calls to EasyScriptParser.getParameter()
  assertEquals(va.getParameter('position'), easyScript.getParameter('position'));
  assertEquals(va.getParameter('position'),
      easyScript.getParameter('variables.position'));
  assertNull(easyScript.getParameter('foobar'));
  // throw when only Parameter name is given, but multiple Subjects have that Parameter
  assertThrows(() => easyScript.getParameter('width'));
  assertEquals(simView1.getParameter('width'), easyScript.getParameter('view1.width'));
  assertEquals(simView2.getParameter('width'), easyScript.getParameter('view2.width'));

  // no changes, so script() should return empty string
  assertEquals('', easyScript.script());
  // script() ignores automatically computed variables
  assertEquals(42, t.eval('kinetic_energy=42'));
  assertEquals(42, t.eval('kinetic_energy'));
  assertEquals('', easyScript.script());

  // test various syntaxes for getting and setting parameters
  assertEquals(3.14, t.eval('POSITION=3.14'));
  assertEquals(3.14, t.eval('VARIABLES.POSITION'));
  assertEquals(3.14, t.eval('variables.position'));
  assertEquals('POSITION=3.14;', easyScript.script());
  assertEquals(-3.1456, t.eval('VARIABLES.POSITION=-3.1456'));
  assertEquals('POSITION=-3.1456;', easyScript.script());
  assertEquals(-3.1456, t.eval('position'));
  assertEquals(-3.1456, t.eval('time;position'));
  assertEquals(-3.1456, t.eval('time;position;'));
  assertEquals(4.4, t.eval('time;'));

  // script() ignores automatically computed variables
  assertEquals(99, easyScript.parse('total_energy=99'));
  assertEquals(99, t.eval('total_energy'));
  assertEquals('POSITION=-3.1456;', easyScript.script());

  // The two SimView subjects have Parameters with same name.
  // Non-unique parameter names must have the Subject specified.
  assertUndefined(t.eval('width', true, false));
  assertEquals('multiple Subjects have Parameter WIDTH', t.getError());
  assertUndefined(t.eval('height', true, false));
  assertEquals('multiple Subjects have Parameter HEIGHT', t.getError());
  assertUndefined(t.eval('SCALE_X_Y_TOGETHER', true, false));
  assertEquals('multiple Subjects have Parameter SCALE_X_Y_TOGETHER', t.getError());
  assertEquals(10, t.eval('view1.width'));
  assertEquals(10, t.eval('view1.width;'));
  assertEquals(10, t.eval('VIEW1.width'));
  assertEquals(1, t.eval('view2.width'));
  assertEquals(1, t.eval('VIEW2.WIDTH;'));
  assertEquals(10, t.eval('view1.height'));
  assertEquals(true, t.eval('view1.SCALE_X_Y_TOGETHER'));
  assertEquals(5, t.eval('view1.width=5'));
  assertEquals(5, t.eval('view1.height'));
  assertEquals('POSITION=-3.1456;VIEW1.WIDTH=5;VIEW1.HEIGHT=5;', easyScript.script());
  assertEquals(false, t.eval('view1.SCALE_X_Y_TOGETHER=false'));
  assertEquals(20, t.eval('view1.height=20;'));
  assertEquals(5, t.eval('view1.width'));
  assertEquals(false, t.eval('view1.SCALE_X_Y_TOGETHER'));
  assertEquals(true, t.eval('view2.SCALE_X_Y_TOGETHER'));
  assertEquals(2, t.eval('view2.width=2'));
  assertEquals(2, t.eval('view2.height'));
  assertEquals('POSITION=-3.1456;VIEW1.WIDTH=5;VIEW1.HEIGHT=20;'
      +'VIEW1.SCALE_X_Y_TOGETHER=false;VIEW2.WIDTH=2;VIEW2.HEIGHT=2;',
      easyScript.script());
  assertEquals(1, t.eval('position=1;'));

  // Test that semicolons inside brackets don't break up the command
  // This adds all the variables together.
  Object.defineProperty(t.z, 'va', {
    value: va,
    writable: true,
  });
  assertEquals(165.1, t.eval(
    'position=1; z.va.toArray().reduce((r,v)=>r+v.getValue(), 0)'));
  const names1 = 'VARIABLES.POSITION,VARIABLES.VELOCITY,VARIABLES.WORK_FROM_DAMPING,VARIABLES.TIME,VARIABLES.ACCELERATION,VARIABLES.KINETIC_ENERGY,VARIABLES.SPRING_ENERGY,VARIABLES.TOTAL_ENERGY,VIEW1.WIDTH,VIEW1.HEIGHT,VIEW1.CENTER_X,VIEW1.CENTER_Y,VIEW1.SCALE_X_Y_TOGETHER,VIEW1.VERTICAL_ALIGN,VIEW1.HORIZONTAL_ALIGN,VIEW1.ASPECT_RATIO,VIEW2.WIDTH,VIEW2.HEIGHT,VIEW2.CENTER_X,VIEW2.CENTER_Y,VIEW2.SCALE_X_Y_TOGETHER,VIEW2.VERTICAL_ALIGN,VIEW2.HORIZONTAL_ALIGN,VIEW2.ASPECT_RATIO'.split(',');
  assertElementsEquals(names1, easyScript.names());
  assertElementsEquals(names1, t.eval('var names_=easyScript.names()'));
  assertEquals(names1.length, t.eval('names_.length'));
  assertEquals('VARIABLES.POSITION',
      String(t.eval('names_.join(\' \').match(/VARIABLES\\.\\w+/)')));
  assertEquals(8, t.eval('names_.join(\' \').match(/VARIABLES\\.\\w+/g).length'));
  // Delete a variable, it should no longer appear in script() or names()
  va.deleteVariables(2, 1);
  easyScript.update();
  assertEquals('POSITION=1;VIEW1.WIDTH=5;VIEW1.HEIGHT=20;'
      +'VIEW1.SCALE_X_Y_TOGETHER=false;VIEW2.WIDTH=2;VIEW2.HEIGHT=2;',
      easyScript.script());
  assertElementsEquals('VARIABLES.POSITION,VARIABLES.VELOCITY,VARIABLES.TIME,VARIABLES.ACCELERATION,VARIABLES.KINETIC_ENERGY,VARIABLES.SPRING_ENERGY,VARIABLES.TOTAL_ENERGY,VIEW1.WIDTH,VIEW1.HEIGHT,VIEW1.CENTER_X,VIEW1.CENTER_Y,VIEW1.SCALE_X_Y_TOGETHER,VIEW1.VERTICAL_ALIGN,VIEW1.HORIZONTAL_ALIGN,VIEW1.ASPECT_RATIO,VIEW2.WIDTH,VIEW2.HEIGHT,VIEW2.CENTER_X,VIEW2.CENTER_Y,VIEW2.SCALE_X_Y_TOGETHER,VIEW2.VERTICAL_ALIGN,VIEW2.HORIZONTAL_ALIGN,VIEW2.ASPECT_RATIO'.split(','), easyScript.names());

  // Add variable, it should appear in script().
  const newVar = new ConcreteVariable(va, 'FOO_BAR', 'foo-bar');
  newVar.setValue(7);
  const newIdx = va.addVariable(newVar);
  easyScript.update();
  assertEquals('POSITION=1;FOO_BAR=7;VIEW1.WIDTH=5;VIEW1.HEIGHT=20;'
      +'VIEW1.SCALE_X_Y_TOGETHER=false;VIEW2.WIDTH=2;VIEW2.HEIGHT=2;',
      easyScript.script());

  // Test that semicolons inside strings don't break up the command
  assertTrue(t.eval('z.va.getVariable(0).getName()=="POSITION"'));
  assertFalse(t.eval('z.va.getVariable(0).getName()=="POSITION;"'));

  // Set a Parameter using quoted string
  assertEquals('FULL', t.eval('view1.vertical_align="FULL"'));
  assertEquals('MIDDLE', t.eval('view1.horizontal_align=\'MIDDLE\''));

  // Subjects with duplicate names should cause an exception.
  assertThrows(()=>  new EasyScriptParser([va, simView1, simView2, va]) );

  // Test the EasyScriptParser.addCommand() function
  easyScript.addCommand('how_are_you', () => 'OK', 'tells how you are');
  assertEquals('OK', easyScript.parse('how_are_you'));
  assertEquals('OK', easyScript.parse('HOW_ARE_YOU'));
  assertEquals('OK', t.eval('how_are_you'));
  assertEquals('OK', t.eval('HOW_ARE_YOU'));

  // replace STAR with * in following test
  assertUndefined(easyScript.parse('"foo\'bar".match(/.*\'.STAR/)'));
  //delete window.terminal;
};

function testEasyScript2() {
  startTest(groupName+'testEasyScript2');

  // Test the EasyScriptParser.unquote() function:
  assertEquals('', EasyScriptParser.unquote("''"));
  assertEquals('', EasyScriptParser.unquote('""'));
  assertEquals(' ', EasyScriptParser.unquote('" "'));
  assertEquals('foo', EasyScriptParser.unquote('foo'));
  assertEquals('foo', EasyScriptParser.unquote('"foo"'));
  assertEquals('foo', EasyScriptParser.unquote("'foo'"));
  assertEquals('foo"bar', EasyScriptParser.unquote('"foo\\"bar"'));
  assertEquals('foo\'bar', EasyScriptParser.unquote("'foo\\'bar'"));
  assertEquals('foo\\', EasyScriptParser.unquote('"foo\\"'));

  // Test some escaped characters
  assertEquals('foo\nbar', EasyScriptParser.unquote("'foo\\nbar'"));
  assertEquals('foo\tbar', EasyScriptParser.unquote("'foo\\tbar'"));
  assertEquals('foo\\nbar', EasyScriptParser.unquote("'foo\\\\nbar'"));
  assertEquals('foo\'bar', EasyScriptParser.unquote("'foo\\'bar'"));
  assertEquals('foo"bar', EasyScriptParser.unquote("'foo\\\"bar'"));
  assertEquals('"bar', EasyScriptParser.unquote("'\\\"bar'"));
  assertEquals('bar\'', EasyScriptParser.unquote("'bar\\\''"));
};
