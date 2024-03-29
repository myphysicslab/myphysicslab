CSS: ./Overview_2.css
Title: Documentation Links
HTML Header: <meta name="viewport" content="width=device-width, initial-scale=1">

[myPhysicsLab Documentation](index.html)

# Documentation Links

The following describes the numerous ways of writing links to classes, pages, etc.
in the documentation of [myPhysicsLab](https://www.myphysicslab.com).

Note that we use Markdown within TypeScript documentation (in source files like `src/lab/util/Clock.ts`) and also in stand-alone markdown files (such as `src/docs/Architecture.md`).  It can get confusing to keep track of which type we are referring to when we use the generic term "Markdown".

Contents of this page:

+ [Docs Directory Structure][]

+ [TypeScript Documentation][]
    + [How Typedoc Generates HTML Files][]
    + [TypeScript to Same Class][]
    + [TypeScript to Imported Class][]
    + [TypeScript to Non-Imported Class][]
    + [TypeScript to Markdown File][]
    + [TypeScript to Web Page][]
    + [TypeScript to Markdown Heading in Same Class][]
    + [TypeScript to Markdown Heading in Different Class][]
    + [TypeScript to Anchor Tag][]
    + [Details about Markdown in TypeScript][]


+ [Links in Markdown Files][]
    + [Markdown File to TypeScript][]
    + [Markdown File to Markdown File][]

+ [Links in HTML Files][]

# Docs Directory Structure
The key to writing documentation links boils down to understanding the file structure of the documentation.  A link appears in the finished HTML as an anchor tag `<a>` with an `href` property telling the destination.  That `href` tag must be a valid file reference *from the current location* (the location of the HTML file you are reading).  If you can figure out how to refer to (or "navigate to") the target HTML file from the current HTML file, then you can write the link.

`typedoc` does some of that work of figuring out the name of the target file for you. This is described in following sections.

Here is an outline of the structure of the built documentation directory.

    docs/
        Architecture.html
        Building.html
        classes/
            lab_app_MouseTracker.MouseTracker.html
            lab_controls_ButtonControl.ButtonControl.html
            lab_engine2D_ContactSim.ContactSim.html
            lab_util_Clock.Clock.html
            etc.
        ContactSim_Math.html
        Customizing.html
        enums/
            lab_view_DrawingMode.DrawingMode.html
            etc.
        functions/
            lab_util_DoubleMath.hexToNum.html
            etc.
        GetNumbers1.html
        index.html
        interfaces/
            lab_model_Collision.Collision.html
            lab_model_Simulation.Simulation.html
            etc.
        modules/
            lab_app_EventHandler.html
            etc.
        Set_Initial_Conditions.html

The HTML files at the top level of `docs` are all generated from a Markdown file with MultiMarkdown.  For example `build/docs/Architecture.html` comes from `src/docs/Architecture.md`.  (The exception is `index.html` which is generated by `typedoc` from `src/docs/doc_start.md`).

The files in subdirectories of docs like `classes` are generated by `typedoc` from TypeScript source files.

Knowing the directory structure, you can understand how to write navigation links between various files.

For example, in `Architecture.md` to refer to the documentation for the `Clock` class, you need to go into the `classes` directory and refer to the name that `typedoc` generates for that class.  The link you write in `Architecture.md` will be

    [Clock](./classes/lab_util_Clock.Clock.html)

That link will appear like this in `Architecture.html`

    <a href="./classes/lab_util_Clock.Clock.html">Clock</a>

From within a TypeScript class file, to refer to an interface you need to go up a directory level, then down into `interfaces` directory.  To refer to something in a stand-alone Markdown file (like `Architecture.md`), you need to go up a level.

# TypeScript Documentation
The `typedoc` tool generates HTML files from the TypeScript source code `.ts` files. It directly translates the TypeScript definitions for classes, functions, interfaces into HTML documentation.  In addition, it interprets the comments preceding classes, functions, etc. as Markdown, if those comments start with `/**`.

`typedoc` translates the various forms of `@link` tags in markdown comments into HTML anchor tags `<a>` which have an `href` property pointing at the appropriate HTML documentation file.

According to [typedoc.org](https://typedoc.org/guides/doccomments/) the version of Markdown used is [Marked](https://github.com/markedjs/marked).

In the HTML documentation generated by `typedoc`, the links are colored to indicate what kind of element it is:

+ green = interface
+ blue = class or external web page
+ purple = function
+ red = type
+ brown = enum


## How Typedoc Generates HTML Files
TypeScript documentation (from `.ts` files) is created by the `typedoc` tool  and winds up in directories like

    docs/classes
    docs/enums
    docs/functions
    docs/interfaces
    docs/modules
    docs/types

The name of the generated documentation file follows this pattern:

    path_to_module.ClassName.html
    path_to_module.EnumName.html
    path_to_module.InterfaceName.html

For example, the `lab.util.Observe` module contains several classes and interfaces, and their documentation files wind up in different directories with names like this

    docs/classes/
        lab_util_Observe.GenericEvent.html
        lab_util_Observe.GenericObserver.html
        lab_util_Observe.ParameterBoolean.html
        lab_util_Observe.ParameterNumber.html
        lab_util_Observe.ParameterString.html
    docs/interfaces/
        lab_util_Observe.Observer.html
        lab_util_Observe.Parameter.html
        lab_util_Observe.Subject.html
        lab_util_Observe.SubjectList.html

In many cases a module contains a single class and the module and class have the same name, for example:

    docs/classes/
        lab_app_SimRunner.SimRunner.html
        lab_controls_ButtonControl.ButtonControl.html
        lab_engine2D_RigidBodySim.RigidBodySim.html

To write a reference to documentation in a different directory, you need to use syntax in the URL like `../` to go up a level. Here is an example of a markdown link that is in a TypeScript file.

    [About Units Of Measurement](../Architecture.html#aboutunitsofmeasurement).


## TypeScript to Same Class
Within a class you can refer to a function in the class very simply by

    {@link function}

To link to the constructor for a class:

    {@link constructor}

## TypeScript to Imported Class
For imported classes we can use this simple link syntax

    {@link Class}
    {@link Class.function}
    {@link Class.function | alternative text}
    {@link Class#function}
    {@link Class#function alternative text}

This syntax works for any imported classes, function, and the class itself or any other classes defined in the current TypeScript file. (I don't know if using `#` vs. `.` makes a difference.)

By "imported" we mean that the class appears in an `import` statement such as

    import { Util } from "./Util.js";
    import { GenericEvent, ParameterNumber, Subject } from "./Observe.js";

To link to the constructor for a class:

    {@link Class.constructor}


## TypeScript to Non-Imported Class
For non-imported classes we need to add navigation to the source file (not to the generated documentation).

    {@link path/to/Module.Class}
    {@link path/to/Module.Class | alternative text}
    {@link path/to/Module.Class.function}
    {@link path/to/Module.Class.function | alternative text}

Here are some examples.

    {@link lab/view/DisplayClock.DisplayClock | DisplayClock}
    {@link lab/view/DisplayObject.DisplayObject.getPosition}
    {@link lab/util/Observe.GenericObserver}

Note that if you don't specify the "alternative text" in the link, then the text of the
link will be the full name like "lab/view/DisplayObject.DisplayObject.getPosition".



## TypeScript to Markdown File
To link from TypeScript `.ts` file to an external Markdown `.md` file, the syntax is

    [text](../markdownfile.html)
    [text](../markdownfile.html#headingname)

Typically you need to go up a level (with `../`) to get to the `docs` directory where the Markdown file is located.  You can use the
[cross references](https://fletcher.github.io/MultiMarkdown-6/syntax/cross-references.html)
feature of MultiMarkdown to link to a specific heading in the target Markdown file. Here is an example from `lab/util/Util.ts`.

    [Customizing The Build Process](../Building.html#customizingthebuildprocess)


## TypeScript to Web Page
To link from TypeScript to an external web page, use standard Markdown syntax

    [text](URL)

where the URL can be any valid URL on the web.  Example:

    [ISO 639-1 language code](http://www.loc.gov/standards/iso639-2/php/English_list.php)

## TypeScript to Markdown Heading in Same Class
To link from within TypeScript to a Markdown documentation heading in the same class, the syntax is

    [text](#md:heading-name)

An example from `lab/util/Terminal.ts`

    [URL Query Script](#md:url-query-script)

Note that `typedoc` adds a prefix of `md:` to these heading identifiers. The resulting code in the HTML file will be

    <a href="#md:url-query-script">URL Query Script</a>

This is actually a link to an anchor `<a>` tag that is generated for the heading by `typedoc`.  The HTML generated for the markdown heading looks like this:

    <a id="md:url-query-script" class="tsd-anchor"></a>
    <h2><a href="#md:url-query-script">URL Query Script</a></h2>


## TypeScript to Markdown Heading in Different Class
To link from TypeScript to a Markdown documentation heading in a different class, you need to add the navigation to the file. The syntax is

    [text](./path_to_module.ClassName.html#md:heading-name)

An example from `lab/util/EasyScriptParser.ts`

    [URL Query Script](./lab_util_Terminal.Terminal.html#md:url-query-script)

Note that the navigation is required even when the class is in the same TypeScript
file; here is an example from `ViewPanner` docs in `lab/app/SimController.ts`

    /** Pans (scrolls) a SimView to follow mouse movements. See
    [SimView Panning](./lab_app_SimController.SimController.html#md:simview-panning)
    in {@link SimController}.
    */

If the link is between types (interface vs. class for example), then more navigation is needed to refer to the proper directory.  Perhaps like this

    [URL Query Script](../classes/lab_util_Terminal.Terminal.html#md:url-query-script)

## TypeScript to Anchor Tag
Sometimes we add an anchor tag like `<a id="md:foobar">` within the markdown, to be able to link to something other than a heading. The syntax to link is the same as for linking to headings.

    [text](#md:foobar)

An example from `lab/util/Clock.ts` gives an anchor tag to a list entry

    <a id="md:realtime"></a>
    + **Real Time** is given by {@link Clock.getRealTime}.

A link to that (in the same `Clock.ts` file) is

    /** Returns the [real time](#md:realtime) in seconds which is

If the anchor tag is in a different HTML file, then you need to add the navigation to that file, for example

    [text](./path_to_module.ClassName.html#md:foobar)


## Details about Markdown in TypeScript

Writing doc comments for a class or function starts with `/**`.  You then have the
option of starting each line of the comment with `*`, but if you do be sure to do this
on every line, otherwise you will get some random characters showing up.

Here is the style of using asterisks

    /** Sets the size of the HTML canvas. All SimViews are set to have the
    * same screen rectangle as this LabCanvas by calling {@link SimView.setScreenRect}.
    * Notifies any Observers by broadcasting a GenericEvent named
    * {@link LabCanvas.SIZE_CHANGED}.
    * @param width  the width of the canvas, in screen coords (pixels)
    * @param height  the height of the canvas, in screen coords (pixels)
    */
    setSize(width: number, height: number): void {

Here is the style of not using asterisks

    /** Sets the size of the HTML canvas. All SimViews are set to have the
    same screen rectangle as this LabCanvas by calling {@link SimView.setScreenRect}.
    Notifies any Observers by broadcasting a GenericEvent named
    {@link LabCanvas.SIZE_CHANGED}.
    @param width  the width of the canvas, in screen coords (pixels)
    @param height  the height of the canvas, in screen coords (pixels)
    */
    setSize(width: number, height: number): void {

But don't mix the two styles. The start of the second line determines which style is
used, so you would see some random asterisks in the text from this example:

    /** Sets the size of the HTML canvas. All SimViews are set to have the
    same screen rectangle as this LabCanvas by calling {@link SimView.setScreenRect}.
    Notifies any Observers by broadcasting a GenericEvent named
    {@link LabCanvas.SIZE_CHANGED}.
    * @param width  the width of the canvas, in screen coords (pixels)
    * @param height  the height of the canvas, in screen coords (pixels)
    */
    setSize(width: number, height: number): void {

For code samples, you can specify the code-coloring scheme to be JavaScript:

    ```js
    at = at.scale(this.pixel_per_unit_x_, -this.pixel_per_unit_y_);
    ```

# Links in Markdown Files
Stand-alone Markdown files live at the top level of the `docs` directory.  They are created with the [MultiMarkdown](http://fletcherpenney.net/multimarkdown/) tool. An example is `src/docs/Architecture.md` which generates the file `develop/docs/Architecture.html`.


## Markdown File to TypeScript
Use your understanding about the docs directory file structure (explained above) to write the correct reference.  For example:

    [documentation about Terminal](./classes/lab_util_Terminal.Terminal.html)

You can link to a specific method within a class with `#`

    [SimRunner.callback](./classes/lab_app_SimRunner.SimRunner.html#callback)
    [Util.prettyPrint](./classes/lab_util_Util.Util.html#prettyPrint)

## Markdown File to Markdown File
Links between Markdown files are at the same level in the docs directory, so no extra navigation is needed. For example, in `Architecture.md` we can write

    [Building myPhysicsLab Software](Building.html)

You can use the
[cross references](https://fletcher.github.io/MultiMarkdown-6/syntax/cross-references.html)
feature of MultiMarkdown to link to a specific heading in the target Markdown file. Here is an example from `lab/util/Util.ts`.

    [Customizing The Build Process](../Building.html#customizingthebuildprocess)



# Links in HTML Files

Links in HTML files need to navigate into the `docs` directory on the myphysicslab website which is at `develop/docs`.  So you might need to navigate up a level as in this example:

    <a href="../develop/docs/classes/sims_engine2D_BilliardsApp.BilliardsApp.html">documentation</a>

To link to a stand-alone Markdown file you also naviage into the `develop/docs` directory. Here is a link on the home page `index.html` which only needs to go down into the `develop/docs` directory:

    <a href="./develop/docs/Customizing.html">Customizing myPhysicsLab Simulations</a>

You can also use `#` to refer to particular functions or headings on a page (see  examples in previous sections).  Here is an example:

    <a href="./develop/docs/Building.html#buildinstructions">Build Instructions</a>


