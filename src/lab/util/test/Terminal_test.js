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
goog.require('myphysicslab.lab.util.Util');
goog.require('myphysicslab.lab.util.Terminal');
goog.require('myphysicslab.lab.util.EasyScriptParser');
goog.require('goog.testing.jsunit');

var testTerminal1 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Terminal = myphysicslab.lab.util.Terminal;
  if (Util.ADVANCED) {
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
  assertEquals('> 2+2\n4\n', output_elem.value);
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
  assertEquals('> z.a\n1\n', output_elem.value);
  // Test that semicolons inside strings or braces don't break up the command
  assertTrue(t.eval('Util.toName("foo;")=="FOO;"'));
  assertEquals(6, t.eval('{1;2;3+3}'));
  assertEquals(3, t.eval('{1;{2;3}}'));
  assertEquals('foo;bar', t.eval('"baz";"foo;"+"bar"'));
  // Test that escaped quotes in strings do not end the string.
  assertEquals('foo"bar', t.eval('"baz";"foo\\""+"bar"'));
  delete window.terminal;
};
goog.exportProperty(window, 'testTerminal1', testTerminal1);

var testTerminal2 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Terminal = myphysicslab.lab.util.Terminal;
  var EasyScriptParser = myphysicslab.lab.util.EasyScriptParser;
  if (Util.ADVANCED) {
    // Terminal doesn't work under advanced-compile.
    return;
  }
  var output_elem = /**@type {!HTMLInputElement}*/(document.createElement('textarea'));
  var input_elem = /**@type {!HTMLInputElement}*/(document.createElement('input'));
  input_elem.type = 'text';
  window.terminal = new Terminal(input_elem, output_elem);
  var t = window.terminal;
  Terminal.stdRegex(t);
  // having a EasyScriptParser changes how Terminal.eval() works.
  var easyScript = new EasyScriptParser([]);
  easyScript.saveStart();
  t.setParser(easyScript);

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
  assertThrows(function() { t.eval('window', /*output=*/false); });
  assertThrows(function() { t.eval('"eval"(foo(window))', /*output=*/false); });
  assertThrows(function() { t.eval('z.a=1; window', /*output=*/false); });
  assertThrows(function() { t.eval('this["white"+"List_"]', /*output=*/false); });
  assertThrows(function() { Terminal.vetBrackets('this["white"+"List_"]'); });
  assertThrows(function() { t.eval('this.myEval("foo")', /*output=*/false); });
  assertThrows(function() { t.eval('this.whiteList_.push("foo")', /*output=*/false); });
  // when words are in quotes they are OK
  assertEquals('window', t.eval('"window"', /*output=*/false));
  assertEquals('foowhiteList_', t.eval('"foo"+"whiteList_"', /*output=*/false));
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
  assertNotThrows(function() { Terminal.vetBrackets('[-2, 1.7]'); });
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
  // we allow using eval because it is replaced by terminal.eval
  assertEquals(4, t.eval('eval("2+2")', /*output=*/false));
  // but unsafe scripts are still rejected
  assertThrows(function() { t.eval('eval("window")', /*output=*/false); });
  assertThrows(function() { t.eval('eval("win"+"dow")', /*output=*/false); });
  assertThrows(function() { t.eval('eval("white"+"List_")', /*output=*/false); });
  delete window.terminal;
};
goog.exportProperty(window, 'testTerminal2', testTerminal2);

var testTerminal3 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Terminal = myphysicslab.lab.util.Terminal;
  if (Util.ADVANCED) {
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
  // test the Terminal.replaceVar() method.
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
  // declare a var a second time
  assertEquals(5, t.eval('var b=5'));
  assertEquals(30, t.eval('a*b'));

  t.setVerbose(true);
  output_elem.value = '';
  assertEquals(2, t.eval('1;2'));
  assertEquals('> 1;\n'+
      '>> 1;\n'+
      '> 2\n'+
      '>> 2\n'+
      '2\n', output_elem.value);
  // a comment ends at the newline, not at semicolon
  output_elem.value = '';
  assertEquals(2, t.eval('1//com;ment\n2'));
  assertEquals('> 1//com;ment\n'+
      '>> 1//com;ment\n'+
      '> 2\n'+
      '>> 2\n'+
      '2\n', output_elem.value);

  // regex rule expansion happens even inside of comments
  output_elem.value = '';
  assertEquals(5, t.eval('var b =/* new Vector */5'));
  assertEquals('> var b =/* new Vector */5\n'+
      '>> terminal.z.b =/* new myphysicslab.lab.util.Vector */5\n'+
      '5\n', output_elem.value);
  // semicolon does not end a // comment
  output_elem.value = '';
  assertEquals(3, t.eval('3//5; new Vector(1,1)'));
  assertEquals('> 3//5; new Vector(1,1)\n'+
      '>> 3//5; new myphysicslab.lab.util.Vector(1,1)\n'+
      '3\n', output_elem.value);
  // a comment ends at the newline, not at semicolon
  output_elem.value = '';
  assertEquals(5, t.eval('3 //foo; new Vector(1,1)\n5'));
  assertEquals('> 3 //foo; new Vector(1,1)\n'+
      '>> 3 //terminal.z.foo; new myphysicslab.lab.util.Vector(1,1)\n'+
      '> 5\n'+
      '>> 5\n'+
      '5\n', output_elem.value);

  // Should get "SyntaxError: Unexpected number '456'. Parse error."
  // But the error message could vary in different browsers.
  var err = String(assertThrows(function(){ t.eval('123/*foo*/456'); }));
  assertNotNull(err.match(/.*SyntaxError.*/i));
  t.setVerbose(false);

  // test of comments and newlines in script
  assertEquals(30, t.eval('5 * /* multi \n line comment*/ 6'));
  assertEquals(30, t.eval('5 * \n 6'));
  // Following is because of JavaScript's "optional semicolon" policy
  assertEquals(6, t.eval('5 \n 6'));
  delete window.terminal;
};
goog.exportProperty(window, 'testTerminal3', testTerminal3);

var testTerminal4 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Terminal = myphysicslab.lab.util.Terminal;

  if (Util.ADVANCED) {
    // Terminal.eval doesn't work under advanced-compile.
    return;
  }
  window.terminal = new Terminal(null, null);
  var t = window.terminal;
  Terminal.stdRegex(t);
  assertEquals(4, t.eval('2+2'));
  // test blacklist. These are variant spellings of "window".
  assertThrows(function(){ t.eval('window'); });
  assertThrows(function(){ t.eval('win\u0064ow'); });
  assertThrows(function(){ t.eval('win\x64ow'); });
  assertThrows(function(){ t.eval('win\u0064\u006Fw'); });
  assertThrows(function(){ t.eval('win\u0064\u006fw'); });
  assertThrows(function(){ t.eval('win\u0064\x6Fw'); });
  assertThrows(function(){ t.eval('win\u0064\x6fw'); });
  assertThrows(function(){ t.eval('foo;top'); });
  assertThrows(function(){ t.eval('alert("foo")'); });
  assertThrows(function(){ t.eval('foo;document'); });
  assertThrows(function(){ t.eval('goog.globalEval("foo")'); });

  // these hacks were found by reddit
  // see https://www.reddit.com/r/AskNetsec/comments/64erdg/
  // is_my_javascript_physics_simulation_app_hackproof/
  assertThrows(function(){
      t.eval('goog.globalEval("\u0061\x6C\u0065\u0072\u0074(/iq8/)")'); });
  assertThrows(function(){
      t.eval('win\u0064ow.lo\u0063ation=\'https://www.reddit.com\''); });
  delete window.terminal;
};
goog.exportProperty(window, 'testTerminal4', testTerminal4);

var testTerminal5 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Terminal = myphysicslab.lab.util.Terminal;
  // static Terminal methods do work under advanced-compile
  // test blacklist. These are variant spellings of "window".
  // to do: Possible closure compiler issue: had to move these static tests to a
  //    separate test function to avoid compiler errors.
  assertThrows(function(){ Terminal.vetCommand('window', []); });
  assertEquals('window', Terminal.deUnicode('win\u0064ow'));
  assertEquals('window', Terminal.deUnicode('win\x64ow'));
  assertEquals('window', Terminal.deUnicode('win\u0064\u006Fw'));
  assertEquals('window', Terminal.deUnicode('win\u0064\u006fw'));
  assertEquals('window', Terminal.deUnicode('win\u0064\x6Fw'));
  assertEquals('window', Terminal.deUnicode('win\u0064\x6fw'));
  assertThrows(function(){ Terminal.vetCommand('foo;top', []); });
  assertThrows(function(){ Terminal.vetCommand('alert("foo")', []); });
  assertThrows(function(){ Terminal.vetCommand('foo;document', []); });
  assertThrows(function(){ Terminal.vetCommand('goog.globalEval("foo")', []); });
  assertThrows(function(){ Terminal.vetCommand('eval("1+2")', [], /\beval\b/g); });
  // test vetBrackets
  assertThrows(function(){ Terminal.vetBrackets("terminal['white'+'List_']"); });
  assertThrows(function(){ Terminal.vetBrackets("terminal[idx]"); });
  assertNotThrows(function() {
      Terminal.vetBrackets('var a = ["red", "green", "blue"]'); });
  assertNotThrows(function() { Terminal.vetBrackets('a[2]'); });
  assertThrows(function() { Terminal.vetBrackets('a[1+1]'); });
};
goog.exportProperty(window, 'testTerminal5', testTerminal5);


var testTerminal6 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Terminal = myphysicslab.lab.util.Terminal;
  if (Util.ADVANCED) {
    // Terminal doesn't work under advanced-compile.
    return;
  }
  window.terminal = new Terminal(null, null);
  var t = window.terminal;
  Terminal.stdRegex(t);
  // test recursion of Terminal.eval. The `result` variable should be preserved.
  assertEquals(4, t.eval('2+2'));
  assertEquals(4, t.eval('result'));
  t.eval('var a');
  assertEquals(3, t.eval('eval("1+1;a=result")+1'));
  assertEquals(3, t.eval('result'));
  assertEquals(2, t.eval('a'));
  delete window.terminal;
};
goog.exportProperty(window, 'testTerminal6', testTerminal6);

// test of vetBrackets: when square brackets are allowed or prohibited.
var testTerminal7 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Terminal = myphysicslab.lab.util.Terminal;
  if (Util.ADVANCED) {
    // Terminal doesn't work under advanced-compile.
    return;
  }
  window.terminal = new Terminal(null, null);
  var t = window.terminal;
  Terminal.stdRegex(t);
  // Property access with square brackets is prohibited,
  // except for accessing array elements with explicit numbers.
  assertThrows(function(){ t.eval("terminal['white'+'List_']"); });
  assertEquals('whiteList_', t.eval("var idx = 'whiteList_'"));
  assertThrows(function(){ t.eval("terminal[idx]"); });
  //Array access can be done with non-negative integer numbers
  assertElementsEquals(['red', 'green', 'blue'],
      /**@type {Object}*/(t.eval('var a = ["red", "green", "blue"]')));
  assertEquals('blue', t.eval('a[2]'));
  assertEquals('blue', t.eval('a[ 2]'));
  assertEquals('blue', t.eval('a[2 ]'));
  assertEquals('blue', t.eval('a[ 2 ]'));
  assertEquals('blue', t.eval('a [ 2 ]'));
  assertThrows(function(){ t.eval('a[2.1]'); });
  assertThrows(function(){ t.eval('a[-1]'); });
  assertThrows(function(){ t.eval('a[1,2]'); });
  // Array access cannot be done with a variable or expression, but you can use the
  // built-in functions Util.get and Util.set
  assertThrows(function(){ t.eval('a[1+1]'); });
  assertEquals('blue', t.eval('Util.get(a, 1+1)'));
  assertEquals('orange', t.eval('Util.set(a, 1+1, "orange")'));
  assertElementsEquals(['red', 'green', 'orange'],
      /**@type {Object}*/(t.eval('a')));
  delete window.terminal;
};
goog.exportProperty(window, 'testTerminal7', testTerminal7);

// tests handling of regex and strings by Terminal.expand()
// and Terminal.splitAtSemicolon().
var testTerminal8 = function() {
  var Util = myphysicslab.lab.util.Util;
  var Terminal = myphysicslab.lab.util.Terminal;
  if (Util.ADVANCED) {
    // Terminal doesn't work under advanced-compile.
    return;
  }
  window.terminal = new Terminal(null, null);
  var t = window.terminal;
  Terminal.stdRegex(t);
  assertEquals(4, t.eval('2+2'));
  assertEquals('myphysicslab.lab.util.DoubleRect', t.expand('DoubleRect'));
  // regex containing a semicolon.
  var txt = 'SIM_VARS.foo=1.00;';
  var r = /** @type {!Array}*/(t.eval('"'+txt+'".match(/SIM_VARS.*;/)'));
  assertEquals(txt, r[0]);
  // regex containing a quote
  txt = 'foo\'bar';
  r = /** @type {!Array}*/(t.eval('"'+txt+'".match(/.*\'.*/)'));
  assertEquals(txt, r[0]);
  // expression looks like a regex with two slashes, but isn't a regex
  assertRoughlyEquals(0.5, t.eval('(1/8) + (3/8)'), 1E-10);
  assertRoughlyEquals(0.5, t.eval('(1\t/8)+ (3 /8)'), 1E-10);
  assertRoughlyEquals(3/8, t.eval('(1/8);(3/8)'), 1E-10);
  assertRoughlyEquals(3/8, t.eval('(1\t/8);(3 /8)'), 1E-10);
  // incomplete string gives "SyntaxError: Unexpected EOF" but the error message
  // could vary in different browsers.
  var err = String(assertThrows(function(){ t.eval('foo"bar'); }));
  assertNotNull(err.match(/.*EOF.*/i));
  err = String(assertThrows(function(){ t.eval('\'incomplete string'); }));
  assertNotNull(err.match(/.*EOF.*/i));
  // regex containing a slash
  txt = 'foo/bar';
  r = /** @type {!Array}*/(t.eval('"'+txt+'".match(/.*\\/.*/)'));
  assertEquals(txt, r[0]);
  r = /** @type {!Array}*/(t.eval('"'+txt+'".match(/.*[/].*/)'));
  assertEquals(txt, r[0]);
  delete window.terminal;
};
goog.exportProperty(window, 'testTerminal8', testTerminal8);
