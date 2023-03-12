CSS: ./Overview_2.css
Title: Getting Numbers with VarsHistory
HTML Header: <meta name="viewport" content="width=device-width, initial-scale=1">

[myPhysicsLab Documentation](index.html)

# Getting Numbers with VarsHistory

To get numeric data from a myPhysicsLab simulation using the VarsHistory class, follow these steps. (For more control over the output see "Getting Numbers with Javascript"). See the [VarsHistory source code](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/graph/VarsHistory.js) for all available options.

Open the terminal window by clicking the "terminal" checkbox.

&nbsp;

<img src='TerminalWindow.jpg'>
&nbsp;

Make sure you are using the [simple-compiled](Building.html#advancedvs.simplecompile)
version of the simulation. There should be a link to the simple-compiled version on the
simulation's web page, or find it on the
[set of simple-compiled applications](https://www.myphysicslab.com/develop/build/index-en.html).

Type 'help' in the command box (and hit return of course) to see available commands.

Set your desired initial conditions on the simulation. Type or paste into the Terminal
command box:

    var hist = new VarsHistory(sim.getVarsList());
    simRun.addMemo(hist); 

To memorize the starting initial conditions, call the memorize function once before starting the simulation. In the Terminal command box type:

    hist.memorize()

Run the simulation as long as you want. Click the "stop" button (or use a script to
automatically stop at a certain time). In the Terminal command box type:

    hist.output() 

This will print the data in Terminal output box. 

<img src='dbl-pendulum-data.png'>

The first line contains the names of the
variables. You can then select the text, copy and paste to a spreadsheet or text file.
For example I was able to generate this graph from the Double Pendulum with a
[simple Python program](dbl-pendulum-graph.html).

<img src='dbl-pendulum-graph.png'>

&nbsp;

The default separator between numbers is the tab character. To instead use comma separated values:

    hist.setSeparator(', ');

To change which variables are sampled or the order of the variables within each sample
use {@link #setVariables}. For example:

    hist.setVariables([9,0,1,2,3])

The default format for printing numbers gives 5 decimal places, but if the number is
too small then switches to exponential format. Use {@link #setNumberFormat} to change
the formatting function. For example:

    hist.setNumberFormat((n) => n.toFixed(2));

That example uses an [arrow function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
but you can provide any function that takes one numeric argument and returns a string.
