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

goog.provide('myphysicslab.lab.util.test.Terminal_test');

goog.require('goog.array');
goog.require('myphysicslab.lab.util.UtilityCore');
goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.ScriptParser');
goog.require('goog.testing.jsunit');

var testTerminal1 = function() {
  var UtilityCore = myphysicslab.lab.util.UtilityCore;
  var Terminal = myphysicslab.lab.util.Terminal;
  if (UtilityCore.ADVANCED) {
    // Terminal doesn't work under advanced-compile.
    return;
  }
  var output_elem = /**@type {!HTMLInputElement}*/(document.createElement('textarea'));
  var input_elem = /**@type {!HTMLInputElement}*/(document.createElement('input'));
  input_elem.type = 'text';
  window.terminal = new Terminal(input_elem, output_elem);
  var t = window.terminal;
  Terminal.stdRegex(t);
  assertEquals(4, t.eval('2+2'));
  assertEquals('2+2\n// 4\n', output_elem.value);
  assertEquals('myphysicslab.lab.util.DoubleRect', t.expand('DoubleRect'));
  // test that expand() ignores quoted strings containing escaped quotes
  var txt = 'replace this DoubleRect "but not this DoubleRect " and  "also not this \\\"DoubleRect\\\""';
  var exp = 'replace this myphysicslab.lab.util.DoubleRect "but not this DoubleRect " and  "also not this \\\"DoubleRect\\\""';
  assertEquals(exp, t.expand(txt));
  txt = " this Vector is OK 'but not this Vector' and also 'don\\\'t process \"this Vector\"' and dont get confused by \"that 'Vector over there'\" or \"this 3\\\" Vector here\"";
  exp = " this myphysicslab.lab.util.Vector is OK 'but not this Vector' and also 'don\\\'t process \"this Vector\"' and dont get confused by \"that 'Vector over there'\" or \"this 3\\\" Vector here\"";
  assertEquals(exp, t.expand(txt));
  // test storing a variable in the Terminal's 'z' object
  t.eval('z.a = 1;');
  output_elem.value = '';
  t.eval('z.a');
  assertEquals('z.a\n// 1\n', output_elem.value);
  // Test that semi-colons inside strings or braces don't break up the command
  assertTrue(t.eval('UtilityCore.toName("foo;")=="FOO;"'));
  assertEquals(6, t.eval('{1;2;3+3}'));
  assertEquals(3, t.eval('{1;{2;3}}'));
  assertEquals('foo;bar', t.eval('"baz";"foo;"+"bar"'));
  // Test that escaped quotes in strings do not end the string.
  assertEquals('foo"bar', t.eval('"baz";"foo\\""+"bar"'));
  delete window.terminal;
};
goog.exportProperty(window, 'testTerminal1', testTerminal1);

var testTerminal2 = function() {
  var UtilityCore = myphysicslab.lab.util.UtilityCore;
  var Terminal = myphysicslab.lab.util.Terminal;
  var ScriptParser = myphysicslab.lab.util.ScriptParser;
  if (UtilityCore.ADVANCED) {
    // Terminal doesn't work under advanced-compile.
    return;
  }
  var output_elem = /**@type {!HTMLInputElement}*/(document.createElement('textarea'));
  var input_elem = /**@type {!HTMLInputElement}*/(document.createElement('input'));
  input_elem.type = 'text';
  window.terminal = new Terminal(input_elem, output_elem);
  var t = window.terminal;
  Terminal.stdRegex(t);
  // having a ScriptParser changes how Terminal.eval() works.
  var scriptParser = new ScriptParser([]);
  scriptParser.saveStart();
  t.setParser(scriptParser);

  assertEquals(4, t.eval('2+2', /*output=*/true));
  assertEquals(4, t.eval('result', /*output=*/true));
  var out = output_elem.value;
  // when output==false, then `result` is only defined for commands in the same string
  assertUndefined(t.eval('result', /*output=*/false));
  assertEquals(6, t.eval('3+3;result', /*output=*/false));
  assertUndefined(t.eval('result', /*output=*/false));
  // output_elem should be unchanged
  assertEquals(out, output_elem.value);
  // result when output==true should be unchanged
  assertEquals(4, t.eval('result', /*output=*/true));
  out = output_elem.value;
  // test that whitespace evaluates to undefined
  assertUndefined(t.eval('  ', /*output=*/false));
  assertUndefined(t.eval(' \t ', /*output=*/false));
  assertUndefined(t.eval('\t', /*output=*/false));
  assertUndefined(t.eval('\n', /*output=*/false));
  assertUndefined(t.eval(' \n ', /*output=*/false));
  assertUndefined(t.eval(' \t \n ', /*output=*/false));
  // output_elem should be unchanged
  assertEquals(out, output_elem.value);
  // test that unsafe scripts are rejected
  assertThrows(function() { t.eval('eval("window")', /*output=*/false); });
  assertThrows(function() { t.eval('"eval"(foo(window))', /*output=*/false); });
  assertThrows(function() { t.eval('z.a=1; window', /*output=*/false); });
  assertThrows(function() { t.eval('this["white"+"List_"]', /*output=*/false); });
  assertThrows(function() { t.eval('this.myEval("foo")', /*output=*/false); });
  assertThrows(function() { t.eval('this.whiteList_.push("foo")', /*output=*/false); });
  // when words are in quotes they are OK
  assertEquals('window', t.eval('"window"', /*output=*/false));
  assertEquals('fooeval', t.eval('"foo"+"eval"', /*output=*/false));
  assertEquals('Eval', t.eval('"myEval".slice(2,6)', /*output=*/false));
  assertEquals('whiteList_', t.eval('"whiteList_"', /*output=*/false));
  // output_elem should be unchanged
  assertEquals(out, output_elem.value);
  // test addWhiteList() function
  assertThrows(function() { t.eval('self', /*output=*/false); });
  t.addWhiteList('self');
  assertEquals(window, t.eval('self', /*output=*/false));
  // square brackets with numbers are OK
  assertEquals(7, t.eval('goog.array.range(10)[7]', /*output=*/false));
  assertElementsEquals([2, 7],
      /**@type {Object}*/(t.eval('z.a=[2, 7]', /*output=*/false)));
  assertElementsEquals([-2, 1.7],
      /**@type {Object}*/(t.eval('[-2, 1.7]', /*output=*/false)));
  // test afterEval function; should only fire when output==true
  var r = 0;
  var afterFn = function() { r++; };
  t.setAfterEval(afterFn);
  assertEquals(5, t.eval('2+3', /*output=*/true));
  assertEquals(1, r);
  assertEquals(7, t.eval('4+3', /*output=*/false));
  assertEquals(1, r);
  assertEquals(21, t.eval('7*3', /*output=*/true));
  assertEquals(2, r);
  delete window.terminal;
};
goog.exportProperty(window, 'testTerminal2', testTerminal2);

var testTerminal3 = function() {
  var UtilityCore = myphysicslab.lab.util.UtilityCore;
  var Terminal = myphysicslab.lab.util.Terminal;
  if (UtilityCore.ADVANCED) {
    // Terminal doesn't work under advanced-compile.
    return;
  }
  var output_elem = /**@type {!HTMLInputElement}*/(document.createElement('textarea'));
  var input_elem = /**@type {!HTMLInputElement}*/(document.createElement('input'));
  input_elem.type = 'text';
  window.terminal = new Terminal(input_elem, output_elem);
  var t = window.terminal;
  Terminal.stdRegex(t);
  assertEquals(4, t.eval('2+2'));
  // test the Terminal.varReplace() method.
  assertEquals(3, t.eval('var foo=3'));
  assertEquals(3, t.eval('foo'));
  assertEquals(3, t.eval('z.foo'));
  assertEquals(7, t.eval('foo=7'));
  assertEquals(7, t.eval('foo'));
  assertEquals(7, t.eval('z.foo'));
  assertEquals(4, t.eval('var bar=4'));
  assertEquals(28, t.eval('foo*bar'));
  // multiple var statments in one command
  assertEquals(42, t.eval('var a=6; var b=7; a*b'));
  assertEquals(6, t.eval('a'));
  assertEquals(7, t.eval('b'));
  delete window.terminal;
};
goog.exportProperty(window, 'testTerminal3', testTerminal3);
