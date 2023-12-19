CSS: ./Overview_2.css
Title: Building myPhysicsLab
HTML Header: <meta name="viewport" content="width=device-width, initial-scale=1">

[Build_Process]: ./Overview_Build_Process.svg

[myPhysicsLab Documentation](index.html)

# Building myPhysicsLab Software

[myPhysicsLab](https://www.myphysicslab.com) provides classes to build real-time
interactive animated physics simulations. This page has information about building the
myPhysicsLab software, running tests, internationalization and general programming
issues.

Contents of this page:

+ [License and Source Code][]

+ [Building][]
    + [Build Instructions][]
    + [Customizing The Build Process][]
    + [Building the Documentation][]
    + [Inside the Build Process][]
    + [Directory Structure][]

+ [Testing][]
    + [HTML Example Files][]
    + [Unit Tests][]
    + [Engine2D Tests][]
    + [TestViewerApp][]
    + [Performance Tests][]

+ [Internationalization (i18n)][]
    + [How To Set Locale][]
    + [Localized Strings][]
    + [Language Independent Names][]
    + [Non-ASCII Characters][]
    + [File Naming Convention][]
    + [Separate File Per Locale][]
    + [Language Menu in HTML File][]
    + [What should be localized?][]
    + [What should not be localized?][]

+ [Programming Details][]
    + [Macros in HTML Files][]
    + [Debugging][]
    + [Bundling and Minification][]
    + [Class Global Variables][]
    + [App Global Variable][]
    + [toString() format][]
    + [toStringShort()][]
    + [Programming Style][]
    + [Documentation Guidelines][]

+ [References][]

Additional information:

+ See [myPhysicsLab Documentation](index.html) for detailed documentation of classes and
    interfaces.
+ See [myPhysicsLab Architecture](Architecture.html) for an introduction to classes
    and interfaces.
+ See [Customizing myPhysicsLab Simulations](Customizing.html) about how to customize
    using only a browser and text editor.
+ See [2D Physics Engine Overview](Engine2D.html)



# License and Source Code

myPhysicsLab is provided as open source software under the
[Apache 2.0 License](http://www.apache.org/licenses/). See the accompanying file
named `LICENSE`.

Source code is available at <http://www.github.com/myphysicslab/myphysicslab>

The [myPhysicsLab](https://www.myphysicslab.com) project was started in 2001 by Erik
Neumann <erikn@myphysicslab.com>. It was originally written in Java, improved and
enhanced over the years and converted to JavaScript from 2013 to 2016.
In 2023 the code was converted to TypeScript.



# Building

## Build Instructions

It is possible to customize a myPhysicsLab simulation without building from
source code, see [Customizing myPhysicsLab Simulations](Customizing.html).

To build from source code:

1. Download the myPhysicsLab source code from
    <https://github.com/myphysicslab/myphysicslab>. You can download a zip file
    from that github page, or use

        git clone https://github.com/myphysicslab/myphysicslab.git

2. Install the required tools:

    + [TypeScript](https://www.typescriptlang.org)
        You should be able to execute `tsc --version` within
        the `myphysicslab` directory.
        Making an alias in your `.bash_profile` like this might be helpful:

            alias tsc=~/Documents/Programming/myphysicslab/node_modules/typescript/bin/tsc

    + [esbuild](https://esbuild.github.io)
        Make a symbolic link to the `esbuild` executable within
        the `myphysicslab` directory.

            ln -s node_modules/esbuild/bin/esbuild esbuild

        You should then be able to execute
        `./esbuild --version` within the `myphysicslab` directory

    + [Perl](https://www.perl.org)

    + [GNU Make](https://www.gnu.org/software/make/)

3. Execute `tsc` at the command line. This will compile all the typescript `.ts` files
    to become JavaScript `.js` files in the `build` directory.

4. Execute `make` at the command line. This creates `.html` files and
    bundled `.js` files in the `build` directory for all applications and tests in all
    language versions. Execute `make help` to see available options.

5.  Open the file `/build/index-en.html` with a browser. This has
    links to all the example files that were built.

See [References][] below for more information on the required tools.


## Customizing The Build Process

Use the command

    make help

to see available targets and options. See comments in the `makefile` for more info.

There are **variables used in `makefile`** which control important aspects of the
build process. These variables have default values which can be overridden via
command-line arguments.

+ `LOCALE` – selects which locale to use for [Internationalization (i18n)][], but only
    for single files specified with a shortcut (more about shortcuts below). Examples:

        make doublependulum LOCALE=en
        make doublependulum LOCALE=de
        make doublependulum LOCALE="en de"

    To build all apps for a particular locale use targets `apps-en` or `apps-de`.

+ `BUILD_DIR` – location of build directory relative to `makefile` location. 
    The command `make BUILD_DIR=myBuild` changes location.

The `makefile` contains **shortcuts for building applications**. For example, instead
of typing:

    make build/sims/pendulum/DoublePendulumApp-en.html

You can just type

    make doublependulum

The shortcut is the name of the application in all lowercase, minus the "app" suffix.


## Building the Documentation

Building the documentation requires installation of Typedoc and MultiMarkdown; see
[References][] for how to obtain these. After installing MultiMarkDown, you should be
able to execute this command:

    multimarkdown -help

MultiMarkDown is used to create documentation from markdown files such as
`docs/Building.md`, `docs/Architecture.md` and `docs/Engine2D.md`.

To install Typedoc, see <https://typedoc.org>.

Make a symbolic link to the `esbuild` executable within
the `myphysicslab` directory.

    ln -s node_modules/esbuild/bin/esbuild esbuild

You should then be able to execute
`./esbuild --version` within the `myphysicslab` directory

Typedoc creates the documentation by compiling all of the source code, and interpreting
comments as markdown. Some Typedoc options are specified in the file `typedoc.json`.

All of the documentation can be built with the command

    make docs

The file `docs/index.html` is the **home page** for the documentation, it is built by
Typedoc from the `src/docs/doc_start.md` markdown file. View it by opening with a
browser:

    open docs/index.html

To build only the markdown documentation use the command

    make docs-md

**Diagrams** are mostly created with OmniGraffle `.graffle` source files and output to
`svg` or `pdf` formats, which are stored alongside the source files and copied over to
the docs directory by the `makefile`.

**Papers** written using LaTeX are files ending in `.tex` which produce `.pdf` files by
using the command `pdflatex`. For example

    pdflatex Rigid_Double_Pendulum.tex

will produce the file `Rigid_Double_Pendulum.pdf` as well as some associated files
ending in `.aux`, `.out` and `.log`. Some of these files are needed to figure out
cross-references within the document. Note that you usually have to run `pdflatex` twice
in order to figure out the cross-references.

See [References][] for information about obtaining OmniGraffle and LaTeX.


## Inside the Build Process

<img src='Overview_Build_Process.svg' width='533' height='550'>

This section describes what happens in the build process.

Once the environment has been set up, the `makefile` can handle building any
myPhysicsLab application. The three main transformations are shown in the above diagram.

1. TypeScript compiler `tsc` compiles all `.ts` files into the parallel locations in
    the build directory. For example `src/sims/pendulum/DoublePendulumApp.ts`
    is compiled to become `build/sims/pendulum/DoublePendulumApp.js`

2. The `esbuild` tool bundles one Javascript file like `DoublePendulumApp.js`, along
    with all other required files (specified by `import` statements in TypeScript)
    into one localized file like `DoublePendulumApp-en.js`.

3. The HTML application file – for example, `DoublePendulumApp.html` – is transformed
    via a perl script `prep_html.pl` to a language specific version –
    `DoublePendulumApp-en.html`– with various text transformations such as
    [internationalization][Internationalization (i18n)].
    The `prep_html.pl` script does macro substitutions (similar to C preprocessor) to
    transform text within the file, writing a new HTML file.  Many of the macros are
    defined in the file `src/macros.html`.


The `makefile` also copies over all the image files in `src/images` to `build/images`
and copies the CSS file `src/stylesheet.css` to `build/stylesheet.css`.

The HTML application files have "next" and "previous" links to make it easy to visit
all of the applications. These links are automatically generated by the macros
`NEXT_LINK` and `PREV_LINK` which use the ordering specified in the file
`src/index_order.txt`. See `prep_html.pl` for more information.

There are "index" files that are essentially a "table of contents" for all the
myPhysicsLab apps. These index files (one for each language such as English and
German) have links to all of the apps. The links are in the order
given by `src/index_order.txt`.




## Directory Structure

For reference, the following describes the purpose and origin of the various files.

+ `myphysicslab` – top-level directory (can be named whatever you like)

    + `build` – *(generated by `make`)* – Directory created by the command
      `tsc` when `outDir` is set to `build`. Contains compiled Javascript applications
      and HTML files.

        + `images` – contains images used in applications; copy of `src/images/`

        + `index-de.html` – links to all the example HTML applications, German versions

        + `index-en.html` – links to all the example HTML applications, English versions

        + `sims` – contains compiled applications

        + `stylesheet.css` – the stylesheet used by all HTML applications

        + `test` – contains compiled tests

    + `docs` – *(generated by `make docs`)* – Contains documentation built from source
       code with `typedoc`, and other docs build from `.md` files and other sources.

    + `esbuild` - symbolic link to the `esbuild` executable, which you should create.

    + `LICENSE` – contains license information

    + `MachineName.js` – *(created manually)* – if present it defines the global
        property `MYPHYSICSLAB_MACHINE_NAME` which is used to find expected times in
        [Performance Tests][]. Use the format shown in `sampleMachineName.js`.

    + `makefile` – the instructions used by `make`

    + `prep_html.pl` – transforms the HTML files into language-specific compiled
        versions, and does macro substitutions.

    + `README.md` – Project information

    + `sampleMachineName.js` – example version of `MachineName.js`.

    + `src` – contains source code

        + `docs` – contains sources for documentation. Large variety of file types.

            + `doc_start.md` Typedoc transforms this to be the documentation
                "home page" file `docs/index.html`

        + `images` – image files for user interface controls

        + `index_order.txt` – lists the example HTML applications in order, used by
            `prep_html.pl` to create the "next" and "previous" links in HTML files

        + `index.html` – links to all the example HTML applications

        + `lab` – source code directory for general myPhysicsLab library code

        + `macros_tab.html` – defines text substitution macros, used for tab layout

        + `macros_vert.html` – defines text substitution macros, used for vertical
           layout

        + `macros.html` – defines text substitution macros, used in all HTML files

        + `sims` – source code directory for myPhysicsLab simulations and applications

        + `test` – source code directory for myPhysicsLab tests and test viewer

    + `tsconfig.json` – specifies options for Typescript compiler `tsc`

    + `typedoc.json` – specifies options for Typedoc documentation generator

The `make` variable `BUILD_DIR` specifies where to put compiled code, see
[Customizing The Build Process][].


# Testing

## HTML Example Files

The [HTML Example Files](https://www.myphysicslab.com/develop/build/index-en.html) are
for developer testing, not meant to be finished web pages.

The HTML files in the source directories **cannot be used directly** from
a browser. You must complete the build process first.

The command to build the HTML Example Files is

    make

The "home page" for the examples is `src/index.html`. It lists all the examples for
quick access. The examples are linked together via **"next" and "previous" links** on
each page to easily view all the examples. Clicking on the myPhysicsLab logo on any
page takes you back to the examples "home page".

After compiling, there will be a "home page" **version for each locale** such as
`index-en.html` and `index-de.html`. Use a web browser to open these these:

    open build/index-en.html

To build only the English versions of all the apps use this command:

    make apps-en
    open build/index-en.html

To build only the German versions:

    make apps-de
    open build/index-de.html

The "next" and "previous" links on each example page are generated by the
`prep_html.pl` perl script, which gets the order by reading the file
`src/index_order.txt`.

Each application has two file components:

1. An HTML file that is opened in a browser and loads the JavaScript application.
    The source file is typically named with the suffix `...App-en.html`,
    for example `DoublePendulumApp-en.html`.

2. The JavaScript file containing the application code. Note that within the `build`
    directory there are many JavaScript files generated by TypeScript compiler. But
    only the bundled versions created by `esbuild` are used to run the application.
    Typically these versions end with the suffix `...App-en.js` or `...App-de.js`
    depending on the language.

When adding a new application follow these steps:

1. Add the application to appropriate places in `makefile` so that it is
    built as part of the `make all` command.

2. Add the application to the list in `src/index_order.txt`.

3. Add a link to the application in `src/index.html`.

4. Execute `make all` to ensure all the "next/previous" links are remade in other
    web pages that link to the new page.


## Unit Tests

These are commands that will build and run the unit tests using various options for
locale:

+ English tests

        make unittest
        open build/test/UnitTest-en.html

+ German tests

        make unittest LOCALE=de
        open build/test/UnitTest-de.html

Unit tests are contained in `/test` subdirectories of many namespaces, for example in
`lab/util/test`, or `lab/engine2D/test`.

To debug a unit test more easily, use
[SingleTest](./modules/test_SingleTest.html)
and remove the `--minify` flag from the `esbuild` command in `makefile`.

*Note that the unit test coverage is far from complete!*


## Engine2D Tests

[Engine2DTests](./modules/test_Engine2DTests.html) are a set of tests of the
`myphysicslab.lab.engine2D` namespace.

These tests are mainly useful as a warning that the behavior of the physics engine has
changed. This can happen when changes are made to the physics engine or when browser
behavior changes (because of an update to a browser). These tests don't specify
"correct" behavior, but rather the historical expected behavior.

To run engine2D tests, open the file `build/test/Engine2DTests-en.html` in a browser.

The engine2D tests will run the simulation, usually
[ContactSim](./classes/lab_engine2D_ContactSim.ContactSim.html), without any user
interface view or
controller. A typical test will create the simulation, set up initial conditions, run
the simulation for a set amount of time, and then analyze the resulting simulation
state. Typically the simulation variables are compared to a pre-computed "good" state.
Also the energy of the simulation might be tested in some way; for example the energy
of a system might be expected to be constant.

When changes are made to the `myphysicslab.lab.engine2D` simulation engine it is
possible that the *expected results* for tests need to be modified. Changing the
expected results should be avoided unless you are sure that the changes you've made are
correct.

[SingleTest](./modules/test_SingleTest.html) runs a single test and is useful
for debugging a test.


## TestViewerApp

[TestViewerApp](./classes/test_TestViewerApp.TestViewerApp.html) is an application that
provides the ability to interactively run the tests found in
[Engine2DTests](./modules/test_Engine2DTests.html).
This is useful to ensure that the tests are functioning as designed, and for debugging.

TO run it, open the file `build/test/TestViewerApp-en.html` in a browser.

TestViewerApp has a set of menus for selecting which test to run. It looks for global
functions whose name ends `_setup` and includes those in the menus. Therefore these
`_setup` functions must be exported, see [Exporting Symbols][].

TestViewerApp only does the *setup* portion of the test, it won't check the test
results.

Note that subtle differences can occur in TestViewerApp which can make the results
different from when tests are run by Engine2DTestRig. There are many options available
with ContactSim, so you need to be careful to make sure they are the same in both
places when debugging.  The state of the
[random number generator](./classes/lab_util_Random.RandomLCG.html) is particularly
important; the test setup function should set the seed of the random number generaotor
for this reason.


## Performance Tests

[PerformanceTests](./modules/test_PerformanceTests.html) runs a small set of
performance tests of the engine2D physics engine.

**Copy the file `sampleMachineName.js`** to `MachineName.js` and edit the file to have
a unique name for your development machine.

To run engine2D performance tests open the file `build/test/PerformanceTests-en.html`
in a browser.

A performance test gets an **expected time limit** from properties defined in
`src/test/ExpectedPerf.js`. Each combination of test, browser, and machine has a
different expected time limit. The test passes if the time to run the test is near the
expected time.

Because *performance is different on each browser and machine*, each computer that the
performance test is run on should be given a **unique machine name** which is specified
in the file `MachineName.js`. This `MachineName.js` file is not checked in to the
source repository because it is different on each machine. There is a file
`sampleMachineName.js` which can be copied and modified to specify the unique machine
name.

The file `src/test/ExpectedPerf.js` *is checked in to the repository* so that we can
then compare running times across various browsers and machines.

If the file `src/test/MachineName.js` doesn't exist, then the performance test will
still run and report the how long each test took, but the tests will all pass because
the default expected time is very long (10000 seconds).



# Internationalization (i18n)

This section explains programming details concerning internationalization (i18n).



## How To Set Locale

To set the locale when building an application, set the `LOCALE` variable during the
`make` process; see [Customizing The Build Process][].

The
[ISO 639-1 language code](http://www.loc.gov/standards/iso639-2/php/English_list.php)
is a two-letter lowercase code. For example, English is `en`, and German is `de`.
The `LOCALE` variable seen in the `makefile` is inserted into the compiled code
via the `esbuild` option `--define:MPL_LOCALE='"en"'`. This defines the `MPL_LOCALE` variable which is then stored into
[Util.LOCALE](./classes/lab_util_Util.Util.html#LOCALE).


## Localized Strings

Most classes have a static `i18n` property where localized strings are stored. Strings
are defined in versions for each supported language. The localized strings are found at
the end of a class file. Here is an example with English and German:

    type i18n_strings = {
      TIME_STEP: string,
      DISPLAY_PERIOD: string
    }

    static readonly en: i18n_strings = {
      TIME_STEP: 'time step',
      DISPLAY_PERIOD: 'display period'
    };

    static readonly de_strings: i18n_strings = {
      TIME_STEP: 'Zeitschritt',
      DISPLAY_PERIOD: 'Bild Dauer'
    };

    static readonly i18n = Util.LOCALE === 'de' ? SimRunner.de_strings : SimRunner.en;

Code that refers to `SimRunner.i18n.TIME_STEP` will use the localized version of that
string in the current locale.


## Language Independent Names

For scripting purposes it is often necessary to have a language independent name,
so that a script can work regardless of the current locale. A language independent
name is **derived from the English version** of the name by running it through
the function
[Util.toName()](./classes/lab_util_Util.Util.html#toName)
which turns the name into all caps and replaces spaces and dashes with underscores. For
example:

    Util.toName('time step')

will return `'TIME_STEP'`. Equivalently, you can use the property name:

    Util.toName(SimRunner.en.TIME_STEP);

Many methods that deal with finding objects by name will do the `toName()` conversion
automatically. For example, in the following code fragment, the
[VarsList.getVariable()](./classes/lab_model_VarsList.VarsList.html#getVariable) method
converts the input argument string `'angle-1'` to the language independent form
`'ANGLE_1'`:

    vars = sim.getVarsList();
    var angle = vars.getVariable('angle-1');
    angle.setValue(Math.PI/4);

Other methods that *convert an input string argument to a language independent version*
include:

+ [SimObject.nameEquals()](./interfaces/lab_model_SimObject.SimObject.html#nameEquals)

+ [SubjectEvent.nameEquals()](./interfaces/lab_util_Observe.SubjectEvent.html#nameEquals)
    This is inherited by `Parameter` and `Variable` as well.

+ [ParametricPath.nameEquals()](./interfaces/lab_model_ParametricPath.ParametricPath.html#nameEquals)

+ [DiffEqSolver.nameEquals()](./interfaces/lab_model_DiffEqSolver.DiffEqSolver.html#nameEquals)

+ [RigidBodySim.getBody()](./classes/lab_engine2D_RigidBodySim.RigidBodySim.html#getBody)

+ [Subject.getParameter()](./interfaces/lab_util_Observe.Subject.html#getParameter)

+ [VarsList.getVariable()](./classes/lab_model_VarsList.VarsList.html#getVariable)

Using the above methods helps avoid errors like the following from
`RigidBodyRollerApp`:

    if (this.path.getName() == CirclePath.en.NAME) {

That comparison won't work because `NumericalPath.getName()` returns the
language-independent version of the name which is not the same as the English version.
There are two ways to fix this:

    if (this.path.getName() == Util.toName(CirclePath.en.NAME)) {

or:

    if (this.path.nameEquals(CirclePath.en.NAME)) {



## Non-ASCII Characters

Because we use UTF-8 file encoding, it is appropriate to use non-ASCII characters in
source code. Follow the
[Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html#special-characters)
section about Special Characters.


## File Naming Convention

The **last characters of a file name specify the locale**, for example
`DoublePendulumApp-en.html` is the English version which loads
`DoublePendulumApp-en.js`, whereas `DoublePendulumApp-de.html` is the German version
which loads `DoublePendulumApp-de.js`.

Bundling with `esbuild` creates a JavaScript file that is targeted for a particular
locale, depending on the setting of the `LOCALE` variable in the `makefile`. So we
typically make a separate bundled file for each language locale. The HTML web page then
decides which localized compiled version to load.

The `makefile` handles the details about how to produce the desired localized version,
you only have to tell it the name of the file you want to build, and the `makefile`
figures out what the locale is from the requested filename. For example, the command

    make build/sims/pendulum/DoublePendulumApp-de.html

results in the German version of the JavaScript and HTML files being made.
Equivalently, you can use the shortcut name and specify the locale like this:

    make doublependulum LOCALE=de

See [Customizing The Build Process][].

## Separate File Per Locale

*Note: before 2023, myPhysicsLab was built with the Google Closure Compiler.
Since 2023 myPhysicsLab is built with TypeScript and esbuild.
But the following approach to i18n is still in place, for now.*

This approach of having a **separate file for each locale** is recommended in the book
[*Closure: The Definitive Guide*][References] by Michael Bolin:

>In the Closure Library, the intended technique for doing i18n is for the Compiler to
>produce one JavaScript file per locale with the translations for the respective locale
>baked into the file. This differs from other schemes, in which there is one file per
>locale that contains only translated messages assigned to variables and one JavaScript
>file with the bulk of the application logic that uses the message variables.
>Implementing the “two file” approach is also an option for doing i18n in the Closure
>Library today: the file with the translated messages should redefine goog.getMsg() as
>follows:

    // File with application logic:
    var MSG_HELLO_WORLD = goog.getMsg('hello world');

    // File with translations:
    goog.getMsg = function(str, values) {
      switch (str) {
        case 'hello world': return 'hola mundo';
        default: throw Error('No translation for: ' + str);
      }
    };

>The Compiler is not designed for the “two file” scheme because the “single file” scheme
>results in less JavaScript for the user to download. The drawback is that locales
> cannot be changed at runtime in the application (note how Google applications, such as
> Gmail, reload themselves if the user changes her locale setting), but this is fairly
> infrequent and is considered a reasonable trade-off.

>*From Closure: The Definitive Guide, by Michael Bolin, p. 67.*

The code size savings only happen when using the Google Closure Compiler with
"advanced" compilation which removes dead code. When
myPhysicsLab is compiled by bundling with `esbuild` there are no savings of code size,
in fact all the strings for each locale are included, but only one set of locale
strings are used.

It is most practical to **regard the locale as fixed** when the web
page loads so that we don't have to rebuild or modify user interface controls when
switching locale. Plus we may want to provide translated text on the web page itself,
which usually requires having a separate web page per locale.


## Language Menu in HTML File

The scheme of naming HTML and JavaScript files for a particular locale is seen in how
the language menu operates in the HTML files for the various applications. For example
in the compiled version `DoublePendulumApp-en.html` there is code like this:

    <select id='language_menu'
      onchange='location = this.options[this.selectedIndex].value;'>
      <option value='DoublePendulumApp-en.html' selected>
        English
      </option>
      <option value='DoublePendulumApp-de.html' >
        German
      </option>
    </select>

That creates a menu for selecting the current locale; selecting the German option would
load the file `DoublePendulumApp-de.html`.


## What should be localized?

Names that are visible to users should be localized. This includes:

+ Parameters. These are often visible as user interface controls.

+ Variables. These appear in the pop-up menus for graphs.

+ User interface controls, such as NumericControl, ChoiceControl, CheckBoxControl.

+ Polygon names. These are used to generate variable names in RigidBodySim.

## What should not be localized?

Some names are not seen by the user, they are only used for scripting so they only have
language-independent names. These include:

+ GenericEvent names

+ Subject names

+ SimObject names other than Polygon (because not used for generating variable names)

For example in [SimList](./classes/lab_model_SimList.SimList.html) there are
GenericEvents
that occur when objects are added or removed; SimList defines only language independent
names for these:

    SimList.OBJECT_ADDED = 'OBJECT_ADDED';
    SimList.OBJECT_REMOVED = 'OBJECT_REMOVED';

Using the static property reference `SimList.OBJECT_ADDED` rather than the literal
string 'OBJECT_ADDED' will
remain correct in case the string is ever changed.


# Programming Details


## Macros in HTML Files

The reason that the HTML files in the source directories **cannot be used directly**
from a browser is that they contain macros (or "templates") which must be expanded to
become proper HTML.

When you look at the [Start-Up HTML Files](Architecture.html#start-uphtmlfile) for
applications, you will notice a mix of regular HTML and macros. The macros are the
words starting with a hash-tag. for example:

    #define #TOP_DIR ../..
    #define #APP_PATH sims.pendulum.PendulumApp
    #include "#TOP_DIR/macros.html"
    #include "#TOP_DIR/macros_tab.html"
    #DOC_TYPE
    <html lang="en">
    <head>
    #META_TAGS
    #HIDE_ALL
    </head>
    <body>
    #SITE_LOGO
    <h1>#APP_PATH</h1>
    #HEADER_BAR
    #CONTROLS_CONTAINER

During the build process, the `.html` file undergoes text manipulation to expand macro
definitions (roughly similar to macros in the C preprocessor). The expanded version is
written to a **new file** in the build directory.

The text manipulation is done with a **perl script called `prep_html.pl`**. That perl
script interprets text-replacement rules defined in the `macros.html` and
`macros_tab.html` files in the above example.

See the documentation at the start of `prep_html.pl` for more information.


## Debugging

In the `makefile` find the `esbuild` command and remove the `--minify` option. Then the
generated code will look just like it does in the source code.

There are various debugging flags that can be turned on in the code.

+ [Util.DEBUG](./classes/lab_util_Util.Util.html#DEBUG) is widely used

+ [CollisionAdvance](./classes/lab_model_CollisionAdvance.CollisionAdvance.html)
    has ways to set various levels of debugging messages by specifiying
    [WayPoint](./enums/lab_model_CollisionAdvance.WayPoint.html) or
    [DebugLevel](./enums/lab_model_CollisionAdvance.DebugLevel.html)

+ [ComputeForces](./classes/lab_engine2D_ComputeForces.ComputeForces.html#compute_forces)
    has a debug boolean argument that can be turned on in the code.

## Bundling and Minification

The [esbuild](https://esbuild.github.io) tool is used to bundle all the various classes
needed for a particular application into a single JavaScript file. This tool also
performs some minification, which reduces the length of names in the code that are not
visible to the outside.

For the [SingleSpringApp](./classes/sims_springs_SingleSpringApp.SingleSpringApp.html)
the resulting single JavaScript file for English is `SingleSpringApp-en.js`.
In `SingleSpringApp-en.html` the code is executed like this

    <script src="SingleSpringApp-en.js"></script>

This causes the class `SingleSpringApp` to be defined, along with many other classes.

## Class Global Variables

Many classes define a global variable for the class. To avoid conflicts with
pre-existing global variables, these globals have a longer name, for example
`sims$springs$SingleSpringApp`. At the end of most class source files is a command that
creates the global variable, for example

    Util.defineGlobal('sims$springs$SingleSpringApp', SingleSpringApp);

The global variable for the application is used in the HTML file to instantiate the
application. In `SingleSpringApp-en.html` it happens here:

    app = new sims$springs$SingleSpringApp(elem_ids);

The other class names are used in
[Terminal Scripts](Customizing.html#terminalforscriptexecution) for interactive
programming.  For example, to instantiate a `Vector` you can execute in Terminal

    new lab$util$Vector(1, 2)

Terminal provides translations from "short names" to "long names" so that you can simply write

    new Vector(1, 2)

## App Global Variable
When an application is instantiated, a global variable `app` is created to hold it.
For example, in `SingleSpringApp-en.html`

    app = new sims$springs$SingleSpringApp(elem_ids);

When there are multiple applications on a page, these might be called `app1`, `app2`,
etc.

The name of this global is passed to `app.defineNames()` so that short-names in scripts
can be properly expanded during
[Terminal script execution](Customizing.html#terminalforscriptexecution).

        app.defineNames('app');


## toString() format

The `toString()` method should print a format that looks somewhat
**like a JavaScript object literal** preceded by the name of the class. Here is an
example of a [PointMass](./classes/lab_model_PointMass.PointMass.html) object;
note that there are nested Vector objects inside it.

    PointMass{
      name_: "BLOCK",
      expireTime_: Infinity,
      mass_: 0.5,
      loc_world_: Vector{
        x: -0.72021,
        y: 0
      },
      angle_: 0,
      velocity_: Vector{
        x: 4.38584,
        y: 0
      },
      angular_velocity_: 0,
      cm_body_: Vector{
        x: 0,
        y: 0
      },
      zeroEnergyLevel_: null,
      moment_: 0,
      shape_: 1,
      width_: 0.4,
      height_: 0.8
    }
The indentation shown above is done automatically by the function
[Util.prettyPrint](./classes/lab_util_Util.Util.html#prettyPrint). Suppose you have a
`PointMass` object in the variable `block1`, then the following would produce the above
output

    prettyPrint(block1)

Without pretty-printing, the above output of `toString()` looks like this:

    PointMass{name_: "BLOCK", expireTime_: Infinity, mass_: 0.5, loc_world_: Vector{x:
    -0.72021, y: 0}, angle_: 0, velocity_: Vector{x: 4.38584, y: 0}, angular_velocity_:
    0, cm_body_: Vector{x: 0, y: 0}, zeroEnergyLevel_: null, moment_: 0, shape_: 1,
    width_: 0.4, height_: 0.8}


## toStringShort()

There is an alternate version of `toString()` called `toStringShort()` which prints
**minimal identifying information** for the object, often just the class name and the
name of the object. Many myPhysicsLab classes implement the
[Printable](./interfaces/lab_util_Util.Printable.html) interface which specifies
the `toStringShort()` method. There are two reasons for using the `toStringShort()`
method:

1. **avoids infinite loops** There can be circular references between objects – if a
    `toString()` method calls `toString()` on another object an infinite loop could
    occur. The `toStringShort()` method is safe because it never lists any sub-objects.

2. **makes `toString()` output more readable** When an object has another sub-object as
    a property it may be important to show the sub-object, but a full `toString()`
    printout of the sub-object can result in too much output and distracts from showing
    the object.

Here is a pretty-printed example showing an array-like object where each member of the
`elements_` array is printed using `toStringShort()`

    SimList{
      name_: "SIM_LIST",
      length: 3,
      tolerance_: 0.1,
      elements_: [
        PointMass{name_: "BLOCK"},
        PointMass{name_: "FIXED_POINT"},
        Spring{name_: "SPRING"}
      ],
      parameters: [
      ],
      observers: [
      ]
    }


## Programming Style

See [Google JavaScript Style Guide](https://google.github.io/styleguide/javascriptguide.xml);
those style guidelines are mostly followed by myPhysicsLab code.

+ Prefer single quotes for strings.

+ Indentation is 2 spaces.

+ Continued lines are indented 4 spaces from the line it continues.

+ [Non-ASCII Characters][]

+ Private and protected property names should end with a trailing underscore.

+ Use markdown in comments.  See [Documentation Tools References][] about `Dossier`
    and `CommonMark`. HTML tags can be
    used as well, for example `<img>` and `<pre>` tags.

The order of items in a TypeScript source code file should be:

+ `import` statements

+ `export class`  The comment for the class is the summary documentation
    for the class.

+ `constructor` with it's arguments documented like any other function

+ `toString` and `toStringShort` methods should be right after the constructor.

+ Functions (methods), in alphabetic order within a file. Static and instance methods
    are mixed together, except for static factory methods. (Instance methods have
    `prototype` in the name, static methods don't.)

+ Internationalized strings. The typedef `i18n_strings` comes first, then the English
    version (because it is public and is the basis of the language independent
    names), then other languages in alphabetic order.

There are exceptions to keeping things in alphabetic order when a different order makes
the code more readable.


## Documentation Guidelines

Every public class, interface, method, function, enum, etc. should have documentation.
Use markdown, following examples found in the code.

Note that there are **two flavors of markdown** in use depending on whether the
documentation is in JavaScript code or is in a markdown `.md` file, see [Documentation Tools References][].
In particular, the way to write hyperlinks differs between these.

Here are general documentation guidelines:

1. The first line should be a summary of what the class/interface/function does.

2. The first paragraph should give the gist of what the class does:
    a quick-to-read summary.

3. Document what is relevant to a user of the class, rather than details
    about how the class works internally.

4. Code examples and diagrams are helpful.

5. Use section headings to group concepts.

6. Supply links to relevant classes, to functions within the class, or to other docs.


# References

[esbuild](https://esbuild.github.io)

[GNU Make](https://www.gnu.org/software/make/)

[LaTeX](https://en.wikipedia.org/wiki/LaTeX) is used to produce `.pdf` files from
`.tex` files using the `pdflatex` command.
The [MacTeX Distribution](http://www.tug.org/mactex/index.html) is an easy way for Mac
users to get the necessary tools.

[MultiMarkdown](http://fletcherpenney.net/multimarkdown/) is used for myPhysicsLab
documentation files ending in `.md` such as `Overview.md`. MultiMarkdown adds some
features to
[standard markdown](http://daringfireball.net/projects/markdown/syntax) such as
having links to sections within a page. See
[MultiMarkDown Guide](https://rawgit.com/fletcher/human-markdown-reference/master/index.html)
for summary of available commands.

[OmniGraffle](https://www.omnigroup.com/omnigraffle) is used for creating documentation
diagrams. Files have suffix `.graffle`. They are exported to `.svg` or `.pdf` files
which are included in the documentation. Version 4.2.2 of OmniGraffle was used.

[Perl](https://www.perl.org)

[Typedoc](https://typedoc.org)

[TypeScript](https://www.typescriptlang.org)

&nbsp;

&nbsp;

