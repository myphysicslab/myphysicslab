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

goog.provide('myphysicslab.lab.util.test.ScriptParser_test');

goog.require('goog.array');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.ScriptParser');
goog.require('myphysicslab.lab.model.ConcreteVariable');
goog.require('myphysicslab.lab.model.VarsList');
goog.require('myphysicslab.lab.view.SimView');
goog.require('myphysicslab.lab.view.ScreenRect');
goog.require('myphysicslab.lab.util.DoubleRect');
goog.require('goog.testing.jsunit');

var testScriptParser1 = function() {
  var UtilityCore = myphysicslab.lab.util.UtilityCore;
  var ScriptParser = myphysicslab.lab.util.ScriptParser;
  var Terminal = myphysicslab.lab.util.Terminal;
  var ConcreteVariable = myphysicslab.lab.model.ConcreteVariable;
  var VarsList = myphysicslab.lab.model.VarsList;
  var SimView = myphysicslab.lab.view.SimView;
  var DoubleRect = myphysicslab.lab.util.DoubleRect;
  var ScreenRect = myphysicslab.lab.view.ScreenRect;
  // Make several Subjects for ScriptParser to operate on:
  // a VarsList, and two SimViews.
  var var_names = [
    'position',
    'velocity',
    'work from damping',
    'time',
    'acceleration',
    'kinetic energy',
    'spring energy',
    'total energy'
  ];
  var i18n_names = [
    'Position',
    'Geschwindigkeit',
    'Arbeit von D\u00e4mpfung',
    'Zeit',
    'Beschleunigung',
    'kinetische Energie',
    'Federenergie',
    'gesamte Energie'
  ];
  var va = new VarsList(var_names, i18n_names);
  va.setComputed(2, 4, 5, 6, 7);
  va.setValues([1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8]);
  assertEquals('VARIABLES', va.getName());
  var screenRect = new ScreenRect(/*top=*/0, /*left=*/0, /*width=*/500, /*height=*/300);
  var simRect1 = new DoubleRect(/*left=*/-5, /*bottom=*/-5, /*right=*/5, /*top=*/5);
  var simView1 = new SimView('view1', simRect1);
  simView1.setScreenRect(screenRect);
  assertEquals('VIEW1', simView1.getName());
  var simRect2 = new DoubleRect(/*left=*/0, /*bottom=*/0, /*right=*/1, /*top=*/1);
  var simView2 = new SimView('view2', simRect2);
  simView2.setScreenRect(screenRect);
  assertEquals('VIEW2', simView2.getName());

  // set up the Terminal with our ScriptParser
  var output_elem = /**@type {!HTMLInputElement}*/(document.createElement('textarea'));
  var input_elem = /**@type {!HTMLInputElement}*/(document.createElement('input'));
  input_elem.type = 'text';
  window.terminal = new Terminal(input_elem, output_elem);
  var t = window.terminal;
  Terminal.stdRegex(t);
  assertEquals(4, t.eval('2+2'));
  // ScriptParser operates on three Subjects, two are the same type with same
  // Parameter names.
  var scriptParser = new ScriptParser([va, simView1, simView2]);
  scriptParser.saveStart();
  t.setParser(scriptParser);

  assertEquals(1.1, t.eval('position'));
  assertEquals(1.1, t.eval('position;'));

  // direct calls to ScriptParser.parse()
  assertEquals(1.1, scriptParser.parse('position'));
  assertEquals(2.2, scriptParser.parse('variables.velocity;'));
  assertUndefined(scriptParser.parse('foobar'));
  
  // no changes, so script() should return empty string
  assertEquals('', scriptParser.script());
  // script() ignores automatically computed variables
  assertEquals(42, t.eval('kinetic_energy=42'));
  assertEquals(42, t.eval('kinetic_energy'));
  assertEquals('', scriptParser.script());

  // test various syntaxes for getting and setting parameters
  assertEquals(3.14, t.eval('POSITION=3.14'));
  assertEquals(3.14, t.eval('VARIABLES.POSITION'));
  assertEquals(3.14, t.eval('variables.position'));
  assertEquals('POSITION=3.14;', scriptParser.script());
  assertEquals(-3.1456, t.eval('VARIABLES.POSITION=-3.1456'));
  assertEquals('POSITION=-3.1456;', scriptParser.script());
  assertEquals(-3.1456, t.eval('position'));
  assertEquals(-3.1456, t.eval('time;position'));
  assertEquals(-3.1456, t.eval('time;position;'));
  assertEquals(4.4, t.eval('time;'));

  // script() ignores automatically computed variables
  assertEquals(99, scriptParser.parse('total_energy=99'));
  assertEquals(99, t.eval('total_energy'));
  assertEquals('POSITION=-3.1456;', scriptParser.script());
  
  // The two SimView subjects have Parameters with same name. SimView1 precedes
  // SimView2, so its Parameters are found when no Subject specified
  assertEquals(10, t.eval('width'));
  assertEquals(10, t.eval('view1.width'));
  assertEquals(10, t.eval('view1.width;'));
  assertEquals(10, t.eval('VIEW1.width'));
  assertEquals(1, t.eval('view2.width'));
  assertEquals(1, t.eval('VIEW2.WIDTH;'));
  assertEquals(10, t.eval('height'));
  assertEquals(true, t.eval('SCALE_X_Y_TOGETHER'));
  assertEquals(5, t.eval('width=5'));
  assertEquals(5, t.eval('height'));
  assertEquals('POSITION=-3.1456;VIEW1.WIDTH=5;VIEW1.HEIGHT=5;', scriptParser.script());
  assertEquals(false, t.eval('SCALE_X_Y_TOGETHER=false'));
  assertEquals(20, t.eval('view1.height=20;'));
  assertEquals(5, t.eval('width'));
  assertEquals(false, t.eval('SCALE_X_Y_TOGETHER'));
  assertEquals(true, t.eval('view2.SCALE_X_Y_TOGETHER'));
  assertEquals(2, t.eval('view2.width=2'));
  assertEquals(2, t.eval('view2.height'));
  assertEquals('POSITION=-3.1456;VIEW1.WIDTH=5;VIEW1.HEIGHT=20;'
      +'VIEW1.SCALE_X_Y_TOGETHER=false;VIEW2.WIDTH=2;VIEW2.HEIGHT=2;',
      scriptParser.script());

  // Test that semi-colons inside brackets don't break up the command
  // This adds all the variables together.
  t.z.va = va;
  assertEquals(165.1, t.eval(
      'position=1;goog.array.reduce(z.va.toArray(), '
      +'function(r, v) { return r+v.getValue(); }, 0)'));

  assertSameElements('VARIABLES.POSITION,VARIABLES.VELOCITY,VARIABLES.WORK_FROM_DAMPING,VARIABLES.TIME,VARIABLES.ACCELERATION,VARIABLES.KINETIC_ENERGY,VARIABLES.SPRING_ENERGY,VARIABLES.TOTAL_ENERGY,VIEW1.WIDTH,VIEW1.HEIGHT,VIEW1.CENTER_X,VIEW1.CENTER_Y,VIEW1.SCALE_X_Y_TOGETHER,VIEW1.VERTICAL_ALIGN,VIEW1.HORIZONTAL_ALIGN,VIEW1.ASPECT_RATIO,VIEW2.WIDTH,VIEW2.HEIGHT,VIEW2.CENTER_X,VIEW2.CENTER_Y,VIEW2.SCALE_X_Y_TOGETHER,VIEW2.VERTICAL_ALIGN,VIEW2.HORIZONTAL_ALIGN,VIEW2.ASPECT_RATIO'.split(','), scriptParser.names());

  // Delete a variable, it should no longer appear in script() or names()
  va.deleteVariables(2, 1);
  scriptParser.update();
  assertEquals('POSITION=1;VIEW1.WIDTH=5;VIEW1.HEIGHT=20;'
      +'VIEW1.SCALE_X_Y_TOGETHER=false;VIEW2.WIDTH=2;VIEW2.HEIGHT=2;',
      scriptParser.script());
  assertSameElements('VARIABLES.POSITION,VARIABLES.VELOCITY,VARIABLES.TIME,VARIABLES.ACCELERATION,VARIABLES.KINETIC_ENERGY,VARIABLES.SPRING_ENERGY,VARIABLES.TOTAL_ENERGY,VIEW1.WIDTH,VIEW1.HEIGHT,VIEW1.CENTER_X,VIEW1.CENTER_Y,VIEW1.SCALE_X_Y_TOGETHER,VIEW1.VERTICAL_ALIGN,VIEW1.HORIZONTAL_ALIGN,VIEW1.ASPECT_RATIO,VIEW2.WIDTH,VIEW2.HEIGHT,VIEW2.CENTER_X,VIEW2.CENTER_Y,VIEW2.SCALE_X_Y_TOGETHER,VIEW2.VERTICAL_ALIGN,VIEW2.HORIZONTAL_ALIGN,VIEW2.ASPECT_RATIO'.split(','), scriptParser.names());

  // Add variable, it should appear in script().
  var newVar = new ConcreteVariable(va, 'FOO_BAR', 'foo-bar');
  newVar.setValue(7);
  var newIdx = va.addVariable(newVar);
  scriptParser.update();
  assertEquals('POSITION=1;FOO_BAR=7;VIEW1.WIDTH=5;VIEW1.HEIGHT=20;'
      +'VIEW1.SCALE_X_Y_TOGETHER=false;VIEW2.WIDTH=2;VIEW2.HEIGHT=2;',
      scriptParser.script());

  // Test that semi-colons inside strings don't break up the command
  assertTrue(t.eval('z.va.getVariable(0).getName()=="POSITION"'));
  assertFalse(t.eval('z.va.getVariable(0).getName()=="POSITION;"'));

  // Set a Parameter using quoted string
  assertEquals('FULL', t.eval('vertical_align="FULL"'));
  assertEquals('MIDDLE', t.eval('horizontal_align=\'MIDDLE\''));

  // Subjects with duplicate names should cause an exception.
  assertThrows(function() { new ScriptParser([va, simView1, simView2, va]) });

  // volatile Subject not included in list of Subjects
  assertThrows(function() { new ScriptParser([va, simView1], [simView2]) });

  // Test the ScriptParser.addCommand() function
  scriptParser.addCommand('how_are_you', function() { return 'OK'; }, 'tells how you are');
  assertEquals('OK', scriptParser.parse('how_are_you'));
  assertEquals('OK', scriptParser.parse('HOW_ARE_YOU'));
  assertEquals('OK', t.eval('how_are_you'));
  assertEquals('OK', t.eval('HOW_ARE_YOU'));

  delete window.terminal;
};
goog.exportProperty(window, 'testScriptParser1', testScriptParser1);

var testScriptParser2 = function() {
  var UtilityCore = myphysicslab.lab.util.UtilityCore;
  var ScriptParser = myphysicslab.lab.util.ScriptParser;

  // Test the ScriptParser.unquote() function:
  assertEquals('', ScriptParser.unquote("''"));
  assertEquals('', ScriptParser.unquote('""'));
  assertEquals(' ', ScriptParser.unquote('" "'));
  assertEquals('foo', ScriptParser.unquote('foo'));
  assertEquals('foo', ScriptParser.unquote('"foo"'));
  assertEquals('foo', ScriptParser.unquote("'foo'"));
  assertEquals('foo"bar', ScriptParser.unquote('"foo\\"bar"'));
  assertEquals('foo\'bar', ScriptParser.unquote("'foo\\'bar'"));
  assertEquals('foo\\', ScriptParser.unquote('"foo\\"'));

  // Test some escaped characters
  assertEquals('foo\nbar', ScriptParser.unquote("'foo\\nbar'"));
  assertEquals('foo\tbar', ScriptParser.unquote("'foo\\tbar'"));
  assertEquals('foo\\nbar', ScriptParser.unquote("'foo\\\\nbar'"));
  assertEquals('foo\'bar', ScriptParser.unquote("'foo\\'bar'"));
  assertEquals('foo"bar', ScriptParser.unquote("'foo\\\"bar'"));
  assertEquals('"bar', ScriptParser.unquote("'\\\"bar'"));
  assertEquals('bar\'', ScriptParser.unquote("'bar\\\''"));
};
goog.exportProperty(window, 'testScriptParser2', testScriptParser2);

