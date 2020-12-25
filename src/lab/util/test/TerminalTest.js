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

goog.module('myphysicslab.lab.util.test.TerminalTest');

goog.require('goog.array');
const Util = goog.require('myphysicslab.lab.util.Util');
const Terminal = goog.require('myphysicslab.lab.util.Terminal');
const EasyScriptParser = goog.require('myphysicslab.lab.util.EasyScriptParser');
const TestRig = goog.require('myphysicslab.test.TestRig');

const assertEquals = (e, v) => TestRig.assertEquals(e, v);
const assertRoughlyEquals = (e, v, t) => TestRig.assertRoughlyEquals(e, v, t);
const assertTrue = v => TestRig.assertTrue(v);
const assertFalse = v => TestRig.assertFalse(v);
const assertThrows = f => TestRig.assertThrows(f);
const schedule = testFunc => TestRig.schedule(testFunc);
const startTest = n => TestRig.startTest(n);
const assertNotThrows = f => TestRig.assertNotThrows(f);
const assertNotNull = v => TestRig.assertNotNull(v);
const assertUndefined = v => TestRig.assertUndefined(v);
const assertElementsEquals = (e, v) => TestRig.assertElementsEquals(e, v);

class TerminalTest {

static test() {
  schedule(TerminalTest.testTerminal1);
  schedule(TerminalTest.testTerminal2);
  schedule(TerminalTest.testTerminal3);
  schedule(TerminalTest.testTerminal4);
  schedule(TerminalTest.testTerminal5);
  schedule(TerminalTest.testTerminal6);
  schedule(TerminalTest.testTerminal7);
  schedule(TerminalTest.testTerminal8);
};

static testTerminal1() {
  startTest(TerminalTest.groupName+'testTerminal1');
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
  assertEquals('mpl$lab$util$DoubleRect',
      t.expand('DoubleRect'));
  // test that expand() ignores quoted strings containing escaped quotes
  var txt = 'replace this DoubleRect "but not this DoubleRect " and  "also not this \\\"DoubleRect\\\""';
  var exp = 'replace this mpl$lab$util$DoubleRect "but not this DoubleRect " and  "also not this \\\"DoubleRect\\\""';
  assertEquals(exp, t.expand(txt));
  txt = " this Vector is OK 'but not this Vector' and also 'don\\\'t process \"this Vector\"' and dont get confused by \"that 'Vector over there'\" or \"this 3\\\" Vector here\"";
  exp = " this mpl$lab$util$Vector is OK 'but not this Vector' and also 'don\\\'t process \"this Vector\"' and dont get confused by \"that 'Vector over there'\" or \"this 3\\\" Vector here\"";
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

  assertEquals(3, t.vars().length);
  assertEquals('parser', t.vars()[0]);
  window.foobar = '_FOOBAR_';
  window.baz = '_BAZ_';
  t.addWhiteList('foobar');
  t.addWhiteList('baz');
  assertEquals(5, t.vars().length);
  assertElementsEquals(['baz', 'foobar', 'parser', 'result', 'z'], t.vars());
  assertEquals('_FOOBAR_', t.eval('foobar'));
  assertEquals('_FOOBAR_', window.foobar);
  assertEquals('_BAZ_', t.eval('baz'));
  assertEquals('_BAZ_', window.baz);
  assertEquals('_BAZ__FOOBAR_', t.eval('baz += foobar'));
  assertEquals('_BAZ__FOOBAR_', t.eval('baz'));
  assertEquals('_BAZ__FOOBAR_', window.baz);
  window.foobar = 'barfoo';
  assertEquals('barfoo', t.eval('foobar'));
  delete window.foobar;
  delete window.baz;
  delete window.terminal;
};

static testTerminal2() {
  startTest(TerminalTest.groupName+'testTerminal2');
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

static testTerminal3() {
  startTest(TerminalTest.groupName+'testTerminal3');
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
  assertEquals(4, t.vars().length);
  assertElementsEquals(['foo', 'parser', 'result', 'z'], t.vars());
  assertEquals(7, t.eval('foo=7'));
  assertEquals(7, t.eval('foo'));
  assertEquals(7, t.eval('z.foo'));
  assertEquals(4, t.eval('var bar=4'));
  assertEquals(5, t.vars().length);
  assertElementsEquals(['bar', 'foo', 'parser', 'result', 'z'], t.vars());
  assertEquals(28, t.eval('foo*bar'));
  // multiple var statments in one command
  assertEquals(42, t.eval('var a=6; var b=7; a*b'));
  assertElementsEquals(['a', 'b', 'bar', 'foo', 'parser', 'result', 'z'], t.vars());
  assertEquals(7, t.vars().length);
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
      '>> terminal.z.b =/* new mpl$lab$util$Vector */5\n'+
      '5\n', output_elem.value);
  // semicolon does not end a // comment
  output_elem.value = '';
  assertEquals(3, t.eval('3//5; new Vector(1,1)'));
  assertEquals('> 3//5; new Vector(1,1)\n'+
      '>> 3//5; new mpl$lab$util$Vector(1,1)\n'+
      '3\n', output_elem.value);
  // a comment ends at the newline, not at semicolon
  output_elem.value = '';
  assertEquals(5, t.eval('3 //foo; new Vector(1,1)\n5'));
  assertEquals('> 3 //foo; new Vector(1,1)\n'+
      '>> 3 //terminal.z.foo; new mpl$lab$util$Vector(1,1)\n'+
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

static testTerminal4() {
  startTest(TerminalTest.groupName+'testTerminal4');

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

static testTerminal5() {
  startTest(TerminalTest.groupName+'testTerminal5');
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

static testTerminal6() {
  startTest(TerminalTest.groupName+'testTerminal6');
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

// test of vetBrackets: when square brackets are allowed or prohibited.
static testTerminal7() {
  startTest(TerminalTest.groupName+'testTerminal7');
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

// tests handling of regex and strings by Terminal.expand()
// and Terminal.splitAtSemicolon().
static testTerminal8() {
  startTest(TerminalTest.groupName+'testTerminal8');
  if (Util.ADVANCED) {
    // Terminal doesn't work under advanced-compile.
    return;
  }
  window.terminal = new Terminal(null, null);
  var t = window.terminal;
  Terminal.stdRegex(t);
  assertEquals(4, t.eval('2+2'));
  assertEquals('mpl$lab$util$DoubleRect',
      t.expand('DoubleRect'));
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
  // incomplete string gives "SyntaxError: Unexpected EOF" in Safari.
  // In Firefox and Chrome get "SyntaxError: unterminated string literal"
  var err = String(assertThrows(function(){ t.eval('foo"bar'); }));
  assertNotNull(err.match(/^SyntaxError.*/i));
  err = String(assertThrows(function(){ t.eval('\'incomplete string'); }));
  assertNotNull(err.match(/^SyntaxError.*/i));
  // regex containing a slash
  txt = 'foo/bar';
  r = /** @type {!Array}*/(t.eval('"'+txt+'".match(/.*\\/.*/)'));
  assertEquals(txt, r[0]);
  r = /** @type {!Array}*/(t.eval('"'+txt+'".match(/.*[/].*/)'));
  assertEquals(txt, r[0]);
  delete window.terminal;
};

} // end class

/**
* @type {string}
* @const
*/
TerminalTest.groupName = 'TerminalTest.';

exports = TerminalTest;
