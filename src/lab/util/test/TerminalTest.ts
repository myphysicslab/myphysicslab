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
import { assertEquals, schedule, startTest,
    assertTrue, assertFalse, assertRoughlyEquals,
    assertNotNull, assertUndefined, assertElementsEquals }
    from "../../../test/TestRig.js";
import { EasyScriptParser } from "../EasyScriptParser.js";

export default function scheduleTests() {
  schedule(testTerminal1);
  schedule(testTerminal2);
  schedule(testTerminal3);
  schedule(testTerminal6);
  schedule(testTerminal8);
};

const groupName = 'TerminalTest.';

declare const window: Window & typeof globalThis &
  { terminal?: Terminal,
    foobar?: string,
    baz?: string
  };

function testTerminal1() {
  startTest(groupName+'testTerminal1');
  const output_elem: HTMLTextAreaElement =
      document.createElement('textarea');
  const input_elem: HTMLInputElement =
      document.createElement('input');
  input_elem.type = 'text';
  const t = new Terminal(input_elem, output_elem);
  Util.defineGlobal('terminal', t, true);
  Util.assert(t === window.terminal);
  t.clear();
  Terminal.stdRegex(t);
  assertEquals(4, t.eval('2+2'));
  assertEquals('> 2+2\n4\n', output_elem.value);
  assertEquals('lab$util$DoubleRect',
      t.expand('DoubleRect'));
  // test that expand() ignores quoted strings containing escaped quotes
  let txt = 'replace this DoubleRect "but not this DoubleRect " and  "also not this \\\"DoubleRect\\\""';
  let exp = 'replace this lab$util$DoubleRect "but not this DoubleRect " and  "also not this \\\"DoubleRect\\\""';
  assertEquals(exp, t.expand(txt));
  txt = " this Vector is OK 'but not this Vector' and also 'don\\\'t process \"this Vector\"' and dont get confused by \"that 'Vector over there'\" or \"this 3\\\" Vector here\"";
  exp = " this lab$util$Vector is OK 'but not this Vector' and also 'don\\\'t process \"this Vector\"' and dont get confused by \"that 'Vector over there'\" or \"this 3\\\" Vector here\"";
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
  Util.defineGlobal('foobar', '_FOOBAR_', true);
  t.addToVars('foobar');
  Util.defineGlobal('baz', '_BAZ_', true);
  t.addToVars('baz');
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
  //delete window.foobar;
  window.foobar = undefined;
  //delete window.baz;
  window.baz = undefined;
  //delete window.terminal;
  window.terminal = undefined;
};

function testTerminal2() {
  startTest(groupName+'testTerminal2');
  const output_elem: HTMLTextAreaElement = document.createElement('textarea');
  const input_elem: HTMLInputElement = document.createElement('input');
  input_elem.type = 'text';
  window.terminal = new Terminal(input_elem, output_elem);
  const t = window.terminal;
  Terminal.stdRegex(t);
  // having a EasyScriptParser changes how Terminal.eval() works.
  const easyScript = new EasyScriptParser([]);
  easyScript.saveStart();
  t.setParser(easyScript);

  assertEquals(4, t.eval('2+2', /*output=*/true));
  assertEquals(4, t.eval('result', /*output=*/true));
  let out = output_elem.value;
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
  // when words are in quotes they are OK
  assertEquals('window', t.eval('"window"', /*output=*/false));
  assertEquals('foobar_', t.eval('"foo"+"bar_"', /*output=*/false));
  assertEquals('Eval', t.eval('"myEval".slice(2,6)', /*output=*/false));
  assertEquals('foobar_', t.eval('"foobar_"', /*output=*/false));
  // output_elem should be unchanged
  assertEquals(out, output_elem.value);
  assertEquals(window, t.eval('self', /*output=*/false));
  // square brackets with numbers are OK
  assertEquals(8, t.eval('Util.range(12)[8]', /*output=*/false));
  assertElementsEquals([2, 7], t.eval('z.a=[2, 7]', /*output=*/false));
  assertElementsEquals([-2, 1.7], t.eval('[-2, 1.7]', /*output=*/false));
  // test afterEval function; should only fire when output==true
  let r = 0;
  const afterFn = () => r++;
  t.setAfterEval(afterFn);
  assertEquals(5, t.eval('2+3', /*output=*/true));
  assertEquals(1, r);
  assertEquals(7, t.eval('4+3', /*output=*/false));
  assertEquals(1, r);
  assertEquals(21, t.eval('7*3', /*output=*/true));
  assertEquals(2, r);
  // we allow using eval because it is replaced by terminal.eval
  assertEquals(4, t.eval('eval("2+2")', /*output=*/false));
  //delete window.terminal;
};

function testTerminal3() {
  startTest(groupName+'testTerminal3');
  const output_elem: HTMLTextAreaElement = document.createElement('textarea');
  const input_elem: HTMLInputElement = document.createElement('input');
  input_elem.type = 'text';
  window.terminal = new Terminal(input_elem, output_elem);
  const t = window.terminal;
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
  assertEquals(4, t.eval('let bar=4'));
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
      '>> terminal.z.b =/* new lab$util$Vector */5\n'+
      '5\n', output_elem.value);
  // semicolon does not end a // comment
  output_elem.value = '';
  assertEquals(3, t.eval('3//5; new Vector(1,1)'));
  assertEquals('> 3//5; new Vector(1,1)\n'+
      '>> 3//5; new lab$util$Vector(1,1)\n'+
      '3\n', output_elem.value);
  // a comment ends at the newline, not at semicolon
  output_elem.value = '';
  assertEquals(5, t.eval('3 //foo; new Vector(1,1)\n5'));
  assertEquals('> 3 //foo; new Vector(1,1)\n'+
      '>> 3 //terminal.z.foo; new lab$util$Vector(1,1)\n'+
      '> 5\n'+
      '>> 5\n'+
      '5\n', output_elem.value);

  // Should get "SyntaxError: Unexpected number '456'. Parse error."
  // But the error message could vary in different browsers.
  assertUndefined(t.eval('123/*foo*/456', true, false));
  assertNotNull(t.getError().match(/.*SyntaxError.*/i));
  t.setVerbose(false);

  // test of comments and newlines in script
  assertEquals(30, t.eval('5 * /* multi \n line comment*/ 6'));
  assertEquals(30, t.eval('5 * \n 6'));
  // Following is because of JavaScript's "optional semicolon" policy
  assertEquals(6, t.eval('5 \n 6'));
  assertEquals(99, t.eval('const foobar2=99'));
  assertEquals(99, t.eval('foobar2'));
  assertEquals(99, t.eval('z.foobar2'));
  //delete window.terminal;
};

function testTerminal6() {
  startTest(groupName+'testTerminal6');
  window.terminal = new Terminal(null, null);
  const t = window.terminal;
  Terminal.stdRegex(t);
  // test recursion of Terminal.eval. The `result` variable should be preserved.
  assertEquals(4, t.eval('2+2'));
  assertEquals(4, t.eval('result'));
  t.eval('var a');
  assertEquals(3, t.eval('eval("1+1;a=result")+1'));
  assertEquals(3, t.eval('result'));
  assertEquals(2, t.eval('a'));
  //delete window.terminal;
};

// tests handling of regex and strings by Terminal.expand()
// and Terminal.splitAtSemicolon().
function testTerminal8() {
  startTest(groupName+'testTerminal8');
  window.terminal = new Terminal(null, null);
  const t = window.terminal;
  Terminal.stdRegex(t);
  assertEquals(4, t.eval('2+2'));
  assertEquals('lab$util$DoubleRect',
      t.expand('DoubleRect'));
  // regex containing a semicolon.
  let txt = 'SIM_VARS.foo=1.00;';
  let r = t.eval('"'+txt+'".match(/SIM_VARS.*;/)');
  assertEquals(txt, r[0]);
  // regex containing a quote
  txt = 'foo\'bar';
  r = t.eval('"'+txt+'".match(/.*\'.*/)');
  assertEquals(txt, r[0]);
  // expression looks like a regex with two slashes, but isn't a regex
  assertRoughlyEquals(0.5, t.eval('(1/8) + (3/8)'), 1E-10);
  assertRoughlyEquals(0.5, t.eval('(1\t/8)+ (3 /8)'), 1E-10);
  assertRoughlyEquals(3/8, t.eval('(1/8);(3/8)'), 1E-10);
  assertRoughlyEquals(3/8, t.eval('(1\t/8);(3 /8)'), 1E-10);
  // incomplete string gives "SyntaxError: Unexpected EOF" in Safari.
  // In Firefox and Chrome get "SyntaxError: unterminated string literal"
  assertUndefined(t.eval('foo"bar', true, false));
  assertNotNull(t.getError().match(/.*SyntaxError.*/i));
  assertUndefined(t.eval('\'incomplete string', true, false));
  assertNotNull(t.getError().match(/.*SyntaxError.*/i));
  // regex containing a slash
  txt = 'foo/bar';
  r = t.eval('"'+txt+'".match(/.*\\/.*/)');
  assertEquals(txt, r[0]);
  r = t.eval('"'+txt+'".match(/.*[/].*/)');
  assertEquals(txt, r[0]);
  //delete window.terminal;
};
