CSS: ./Overview_2.css
Title: Setting Initial Conditions
HTML Header: <meta name="viewport" content="width=device-width, initial-scale=1">

[myPhysicsLab Documentation](index.html)

# Setting Initial Conditions

To set the inital conditions for a myPhysicsLab simulation

+ click the "rewind" button to both pause the simulation and set its variables
    to the stored intial conditions at time zero. Or give the `reset` command in the
    Terminal command line which does the same thing.

+ for many simulations you can move the objects around to the initial positions by
    dragging with mouse or touch.

+ to set initial velocity, use the Terminal command line.
    Initial positions can also be set here. The `values` command shows the names and
    current values of all available variables. In the Double Pendulum simulation you
    would see
```
SIM_VARS.ANGLE_1=0.39269908169872414;
SIM_VARS.ANGLE_1_VELOCITY=0;
SIM_VARS.ANGLE_2=0;
SIM_VARS.ANGLE_2_VELOCITY=0;
```

+ set the initial conditions from the Terminal command line like this
    (the `>` symbol indicates what was entered).
```
> angle_1 = 1
1
> angle_1_velocity=2
2
```

+ enter the `save` command to save the current initial conditions. The next time
    you click "rewind" the simulation will return to this state.

+ click the "play" button, or give the `resume` command to run the simulation.

The above instructions use the EasyScript feature of myPhysicsLab.
[Customizing with EasyScript](Customizing.html#customizingwitheasyscript)
has more information.

## Set Initial Conditions with JavaScript

To set initial conditions using Javascript

+ click the "rewind" button to both pause the simulation and set its variables
    to the stored intial conditions at time zero. Or give the `reset` command in the
    Terminal command line which does the same thing.

+ give the `vars` command in Terminal to confirm that `varsList` is an available
    variable.

+ enter `prettyPrint(varsList)` in Terminal to see the variables listed
    with their index number and value. For the Double Pendulum simulation it looks like
    this
```
(0) ANGLE_1: 0.39270,
(1) ANGLE_1_VELOCITY: 0.00000,
(2) ANGLE_2: 0.00000,
(3) ANGLE_2_VELOCITY: 0.00000,
(4) ACCELERATION_1: -6.54247,
(5) ACCELERATION_2: 6.04446,
(6) KINETIC_ENERGY: 0.00000,
(7) POTENTIAL_ENERGY: 2.98392,
(8) TOTAL_ENERGY: 2.98392,
(9) TIME: 0.00000,
```

+ enter `varsList.setValue(0, 1); varsList.setValue(1, 2)` to set angle-1
    and its velocity.  Or use any other
    [VarsList methods](./classes/lab_model_VarsList.VarsList.html)
    or JavaScript code.

+ enter the `save` command to save the current initial conditions. The next time
    you click "rewind" the simulation will return to this state.

+ click the "play" button, or give the `resume` command to run the simulation.

[Customizing with JavaScript](Customizing.html#customizingwithjavascript) has more
information about using JavaScript with myPhysicsLab.

&nbsp;

&nbsp;


