CSS: ./Overview_2.css
Title: Customizing myPhysicsLab

<!-- Copyright 2016 Erik Neumann. All Rights Reserved.
* Use of this source code is governed by the Apache License, Version 2.0.
* See the LICENSE file and http://www.apache.org/licenses/LICENSE-2.0.
-->

# Customizing myPhysicsLab Simulations

This page describes how to customize
[myPhysicsLab simulations](http://www.myphysicslab.com) using only a browser and
text editor.

Contents of this page:

+ [Introduction][]
    + [Terminal][]
    + [Three Types Of Scripts][]
    + [Places To Put Scripts][]
+ [Customizing with ScriptParser][]
+ [Customizing with JavaScript][]
+ [Customizing the Start-Up HTML Page][]
+ [Terminal: An Interactive Programming Environment][]
    + [Terminal Utilities][]
    + [Command Short Names][]
+ [Miscellaneous Script Places][]
    + [Memorizable][]
    + [ExpressionVariable][]
    + [ClockTask][]
    + [GenericObserver][]

Additional information:

+ See [myPhysicsLab Architecture](Architecture.html) for an introduction to classes
    and interfaces.
+ See [myPhysicsLab Documentation](index.html) for detailed documentation of classes and
    interfaces.
+ See [Building myPhysicsLab Software](Building.html) for information about building,
    testing, internationalization, and general programming issues.


# Introduction

A range of options are available for customizing myPhysicsLab simulations. The greatest
flexibility comes from obtaining the source code and building new or modified
simulations as described in [Building myPhysicsLab Software](Building.html). But this
requires installing and using many tools such as Closure Compiler and Library, perl,
Java, make, etc.


## Terminal

myPhysicsLab provides several ways to customize simulations
**without any tools other than a web browser** and possibly a text editor. Most of
these methods of customizing make use of the
**command line interface called Terminal**, which is described
[below][Terminal: An Interactive Programming Environment].

Using Terminal along with ScriptParser, JavaScript and the myPhysicsLab classes enables:

+ **Customization** Creating simple scripts allows customizing simulations by
    setting parameters, initial conditions, graph options, etc.

+ **Inspection** Like a debugger, Terminal allows direct inspection of live simulation
    objects, as well as manipulation of them.

+ **Development** Users can try out small code fragments in Terminal, gradually
    assembling a larger simulation.

These capabilities are available with no installation of any tools. Simply type
text into the Terminal input area.


## Three Types Of Scripts

There are three types of scripts that can be used to customize simulations. (These can
be mixed together in various ways).

1. **ScriptParser scripts** These are very simple scripts that consist of just name and
    value pairs, for example `GRAVITY=5;`. They are entered in Terminal.

2. **"safe, short" JavaScript** This is JavaScript code entered in Terminal, but with
    some modifications that:

    a. restricts code to a "safe subset" of JavaScript to prevent execution of
    malicious scripts

    b. allows usage of "short names" which are expanded to the actual JavaScript
    identifiers. For example, you can write `PointMass` instead of
    `myphysicslab.lab.model.PointMass`.

3. **raw JavaScript in HTML page** This is regular JavaScript entered into a `<script>`
    tag on the start-up HTML page.

When creating scripts, it is important to understand the difference between
[Simple and Advanced Compile](Building.html#advancedvs.simplecompile). ScriptParser
scripts can be used with either level of compilation, but JavaScript can generally be
used only with simple-compile. (A limited subset of the myPhysicsLab API is available
with advanced-compile, see [Customizing the Start-Up HTML Page][] below).


## Places To Put Scripts

There are several places to put scripts so that they are executed when you want.

1. **Paste into Terminal** Copy the script and paste into Terminal's input area to
    execute.

2. **URL Query** This combines the URL of the simulation with a script to execute after
    the page loads.

3. **HTML 5 Local Storage** Stores a script locally that is executed when the page
    loads.

4. **HTML `<script>` tag that runs `app.eval()`** A script on the start-up HTML page
    which executes via Terminal by calling the applications `eval` method.

5. **HTML `<script>` tags with raw JavaScript** A script on the start-up HTML page
    which executes regular JavaScript.

6. **Miscellaneous places** Scripts can be put in a variety of other locations.
    See [Miscellaneous Script Places][] below.




# Customizing with ScriptParser

[ScriptParser](myphysicslab.lab.util.ScriptParser.html) interprets very simple scripts
which set the [Parameters](myphysicslab.lab.util.Parameter.html) of various objects.
This is based on the [Subject-Observer](Architecture.html#subjectobserverparameter)
design pattern as implemented by many myPhysicsLab classes. The scripts are executed by
entering them in Terminal, which passes them to ScriptParser.

An application will set up ScriptParser to know about its dozen or so important
[Subjects](myphysicslab.lab.util.Subject.html). ScriptParser interrogates all the
Subjects to find what settable Parameters they contain and their current values.

Here are some ways to use ScriptParser:

+ In Terminal you can enter ScriptParser scripts at the command line.
    Here is an example that you can try in the online version of
    [PendulumApp](http://www.myphysicslab.com/develop/adv-build/sims/pendulum/PendulumApp-en.html):

        ANGLE=-2.5; ANGLE_VELOCITY=-4; GRAVITY=5; DAMPING=0.1;

+ In Terminal the `script` command shows the simplest script that replicates the current
    simulation state. This script can be copied from the Terminal history area after executing the command:

        script

+ Create a **URL query script**. The *query* part of the URL is the part following the
    question mark. The URL can be saved or sent to someone else to view the customized
    simulation. See the method
    [ScriptParser.scriptURL](myphysicslab.lab.util.ScriptParser.html#scriptURL).
    Here is an example:

        http://www.myphysicslab.com/PendulumApp-en.html?DRIVE_AMPLITUDE=0;
        DAMPING=0.1;GRAVITY=9.8;ANGLE=2.5;ANGLE_VELOCITY=0;DRAW_MODE=lines;

+ Use the **URL Script Button** to automatically make a URL query script that
    replicates the current simulation state and settings. Many applications include
    the URL Script Button among their user interface controls. See
     [CommonControls.makeURLScriptButton](myphysicslab.sims.layout.CommonControls.html#CommonControls.makeURLScriptButton).

+ In an application's [Start-Up HTML file](Architecture.html#start-uphtmlfile),
    you can execute a ScriptParser script via the application's `eval` method (which
    passes the script to Terminal). This will work even with advanced-compile (because
    the `eval` method is [exported](Building.html#exportingsymbols)). Here is an
    example from the file `PendulumApp.html` which runs
    [PendulumApp](myphysicslab.sims.pendulum.PendulumApp.html)

        <script>
          app.eval('DRIVE_AMPLITUDE=0;DAMPING=0.1;GRAVITY=9.8;ANGLE=2.5;'
              +'ANGLE_VELOCITY=0;DRAW_MODE=lines;');
        </script>


# Customizing with JavaScript

Here is an example of JavaScript commands which can be pasted into the Terminal input
area while running
[DoublePendulumApp](myphysicslab.sims.pendulum.DoublePendulumApp.html).
You can try it with the online
[simple-compiled DoublePendulumApp](http://www.myphysicslab.com/develop/build/sims/pendulum/DoublePendulumApp-en.html).

    simRun.pause();
    simRun.reset();
    sim.setGravity(5.0);
    statusView.getDisplayList().add(energyGraph);
    statusView.getDisplayList().add(displayClock);
    var va=sim.getVarsList();
    va.setValue(0, 0.15545);
    va.setValue(1, -0.33548);
    va.setValue(2, -2.30681);
    va.setValue(3, 2.68179);
    sim.saveInitialState();
    simRun.resume();

Those commands will restart the simulation from the specified initial conditions, set
gravity to a certain value and show the EnergyBarGraph and DisplayClock.

The command history that appears in the Terminal output area can form
**a script that recreates the current state** of the simulation.

The command history can be saved and reused in several ways:

+ Copy the command history script to the clipboard and save it in a **text file** which
    can be pasted into the Terminal input area later on.

+ Create a
    [URL Query Script](myphysicslab.lab.util.Terminal.html#urlqueryscript)
    which will execute when the page is loaded. The URL can
    then be pasted into any browser to view the customized simulation.

+ A script can be incorporated into the
    [start-up HTML page](Architecture.html#start-uphtmlfile) as
    described below in [Customizing the Start-Up HTML Page][].

+ Save the command history script into **HTML5 local storage**, which causes it to be
    executed the next time that web page is loaded. See the section
    [Script Storage](myphysicslab.lab.util.Terminal.html#scriptstorage) in Terminal
    documentation where the Terminal methods `remember`, `forget`, and `recall`
    are described.

Note that entering JavaScript code into Terminal
**does not work with advanced-compile**. See the section
[Advanced-compile is the Enemy of Terminal]
(myphysicslab.lab.util.Terminal.html#advanced-compileistheenemyofterminal)
in Terminal documentation.



# Customizing the Start-Up HTML Page

It is possible to customize a simulation by adding scripts to the
[start-up HTML page](Architecture.html#start-uphtmlfile). You
don't need to install Closure Compiler because the start-up HTML page loads the
compiled code which defines various myPhysicsLab classes.

You will, however, need to **install the new HTML file somewhere** (such as your local
machine or a web server), as well as any other files that are needed such as

+ the compiled JavaScript application (for example `PendulumApp-en.js`)
+ image files (for example `rewind.png`)
+ CSS style file (for example `stylesheet.css`)

The compiled JavaScript application **determines what classes are available**. Usually
the compiled JavaScript file contains code for a single simulation and the application
that builds and displays the simulation.

It is possible to include several classes in the compiled JavaScript file. For example,
[TerminalSpringApp](myphysicslab.sims.springs.TerminalSpringApp.html) contains several
simulations. There are two HTML files using that same JavaScript file to show different
simulations: `TerminalSpringApp.html` runs `SingleSpringSim` and
`TerminalSpring2DApp.html` runs `Spring2DSim`. By the way, these files also demonstrate
*creating an application entirely with Terminal commands*.

Whether the JavaScript application is simple-compiled or advanced-compiled determines
what kind of scripting can be used. See
[Advanced vs. Simple Compile](Building.html#advancedvs.simplecompile).

If you are customizing with **ScriptParser scripts**, you can use either
advanced-compiled or simple-compiled code. An example is shown above in the section
[Customizing with ScriptParser][].

If you are customizing with **JavaScript scripts**, then you must use the
**simple-compiled** version of the application, so that you have full access to all of
the objects, properties, and methods (because with simple-compile the names have not
been minimized or removed as happens with advanced-compile).

Here is an example of a JavaScript script that could be added to `SingleSpringApp.html`
to customize [SingleSpringApp](myphysicslab.sims.springs.SingleSpringApp.html). The
commands are executed in Terminal via `app.eval`. The main advantage of writing scripts
that are run thru Terminal is that you can use [Command Short Names][].

    <script>
    app.eval('sim.setSpringStiffness(20);'
        +'sim.setDamping(0.01);'
        +'sim.getVarsList().setValues([-1, -5]);'
        );
    </script>

Here is another example which uses regular JavaScript that is not run thru Terminal.

    <script>
    (function() {
      var sim = app.sim;
      sim.setSpringStiffness(20);
      sim.setDamping(0.01);
      sim.getVarsList().setValues([-1, -5]);
    })();
    </script>

The reason the script is enclosed in a self-executing function is so that the local
variables stay local and do not become global variables.


# Terminal: An Interactive Programming Environment

Terminal provides a **command line interface** that allows executing script commands,
and displays the results of those commands. Besides this introduction, please see the
[Terminal class documentation](myphysicslab.lab.util.Terminal.html) for more details.

In most myPhysicsLab applications the Terminal input and output text areas can be made
visible by **clicking the "Terminal" checkbox**.

The Terminal class provides an **input text area** for the user to enter JavaScript or
ScriptParser scripts, and an **output text area** showing the results of the scripts
that are entered.

Terminal can execute
[Two Types of Scripts](myphysicslab.lab.util.Terminal.html#twotypesofscripts):

1. Parameter-setting scripts which are processed by
    [ScriptParser](myphysicslab.lab.util.ScriptParser.html).
    (which works with both simple-compile and advanced-compile).

2. a safe subset of JavaScript (available only with simple-compile),

See [Advanced vs. Simple Compile](Building.html#advancedvs.simplecompile).


## Terminal Utilities

When you type a command into Terminal, it is executed and the result is displayed in
the Terminal output text area. The result is converted to text and wrapped with
JavaScript comment symbols. If the command ends with a semi-colon then the printing of
the result is suppressed. Multiple commands separated by semi-colons can be given in
one line.

Some useful utilities available in Terminal:

+ `help` shows useful commands.

+ `vars` shows important variables

+ Typing any symbol, such as `foo`, by itself results in printing the object as text.
    For objects the text is from the object's `toString()` method.

+ `prettyPrint(foo)` inserts carriage returns and indentation to make the `toString()`
    result more readable.

+ `prettyPrint(foo, 5)` does prettyPrinting with indentation level of 5
    (default is 3)

+ `methodsOf(foo)` shows the available methods that can be called on the object;
    synonym for
    [UtilityCore.methodsOf](myphysicslab.lab.util.UtilityCore.html#UtilityCore.methodsOf).

+ `propertiesOf(foo)` shows the names of properties of an object; synonym for
    [UtilityCore.propertiesOf](myphysicslab.lab.util.UtilityCore.html#UtilityCore.propertiesOf).
    Useful especially to see the what is defined on `app` which is the usual name for
    the application that creates the simulation.

+ `propertiesOf(foo, true)` shows the properties and values of object `foo`

+ [UtilityCore.get](myphysicslab.lab.util.UtilityCore.html#UtilityCore.get) and
    [UtilityCore.set](myphysicslab.lab.util.UtilityCore.html#UtilityCore.set)
    can be used to access and modify arrays, which gets around the restrictions about
    using square brackets in Terminal.
    See [Safe Subset of JavaScript](myphysicslab.lab.util.Terminal.html#safesubsetofjavascript)


## Command Short Names

To make using JavaScript in Terminal more user-friendly – with less typing, less
remembering long path names – we define a set of "short names" for important objects.
For example, in many applications we can type just

+ `sim` instead of `app.sim`
+ `simCanvas` instead of `app.layout.simCanvas`
+ `PointMass` instead of `myphysicslab.lab.model.PointMass`

These short-names are implemented by defining a set of regular expression replacements
which are applied to the Terminal input string.

The regular expressions for short-names are defined in two places:

+ [Terminal.stdRegex](myphysicslab.lab.util.Terminal.html#Terminal.stdRegex) defines a
    standard set of short-name regular expressions; mostly class names, but also useful
    functions like `prettyPrint`, `methodsOf`, `println` and `propertiesOf`.

+ Each application usually has a method called `defineNames` which defines short-name
    regular expressions unique to that application. See for example
    [DoublePendulumApp.defineNames]
    (myphysicslab.sims.pendulum.DoublePendulumApp.html#defineNames).

For more information, see
[Short Names for Easy Scripting](myphysicslab.lab.util.Terminal.html#shortnamesforeasyscripting) in the
Terminal class documentation.  See the section
[Global Variable Usage](Building.html#globalvariableusage) to learn
about what global variables are available, such as `app` and `myphysicslab`.


# Miscellaneous Script Places

Scripts can be put in a variety of other locations besides Terminal and the Start-Up HTML File.

Some of these will execute the script repeatedly (Memorizable, ExpressionVariable),
others will execute only when certain events occur (ClockTask, GenericObserver).

## Memorizable

[GenericMemo](myphysicslab.lab.util.GenericMemo.html) is a
[Memorizable](myphysicslab.lab.util.Memorizable.html) which can be installed so that it
is executed after each simulation time step.

The documentation of GenericMemo shows an example that prints the value of a simulation
variable into the Terminal output area. Here `simRun` is an instance of
[SimRunner](myphysicslab.lab.app.SimRunner.html).

    var angle = sim.getVarsList().getVariable('ANGLE');
    var memo = new GenericMemo(function(){println('angle: '+angle.getValue())});
    simRun.addMemo(memo);

That code can be entered as Terminal commands in
[PendulumApp](myphysicslab.sims.pendulum.PendulumApp.html) if using simple-compile.


## ExpressionVariable

[ExpressionVariable](myphysicslab.lab.model.ExpressionVariable.html) is a Variable
whose value is defined by a JavaScript expression which is evaluated using Terminal.

An example of using ExpressionVariable is in
[SingleSpringApp](myphysicslab.sims.springs.SingleSpringApp.html).
This adds a variable whose value is `sin(time)`:

    var va = sim.getVarsList();
    va.addVariable(new ExpressionVariable(va, 'sin_time', 'sin(time)',
        this.terminal, 'Math.sin(sim.getTime());'));

The variable can then be displayed in a graph.

[FunctionVariable](myphysicslab.lab.model.FunctionVariable.html) is similar but
directly executes a JavaScript function instead of using Terminal to execute a string
expression.


## ClockTask

[ClockTask](myphysicslab.lab.util.ClockTask.html) holds a callback function to be
executed at a specified time; it is used with a
[Clock](myphysicslab.lab.util.Clock.html). The documentation of ClockTask shows an
example that pauses the Clock after 5 seconds:

    var task = new ClockTask(5, function() { clock.pause(); });
    clock.addTask(task);

This can be entered in Terminal if using simple-compile.


## GenericObserver

A [GenericObserver](myphysicslab.lab.util.GenericObserver.html) observes a Subject;
when the Subject broadcasts a SubjectEvent then this executes a specified function. See
the section about [Subject-Observer](Architecture.html#subjectobserverparameter) in the
Architectore overview.

Here is an example of a GenericObserver that prints
any event broadcast by a [Clock](myphysicslab.lab.util.Clock.html).
This code can be entered in Terminal if using simple-compile.

    var obs = new GenericObserver(clock, function(evt) { println('event='+evt); });

The next example prints only when a particular event occurs:

    var obs = new GenericObserver(clock, function(evt) {
        if (evt.nameEquals(Clock.CLOCK_PAUSE)) { println('event='+evt);}
    });
