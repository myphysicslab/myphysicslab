CSS: ./Overview_2.css
Title: Getting Collision Data
HTML Header: <meta name="viewport" content="width=device-width, initial-scale=1">

[myPhysicsLab Documentation](index.html)

# Getting Collision Data

There are several myPhysicsLab simulations that include collisions between objects. To
get collision data use the `setCollisionFunction` method to specify a function which
prints the data to the Terminal. (Instead of printing, you could collect the data into a
Javascript array for later processing).

Each collision simulation has its own particular collsion class. Here are steps for the
[CollideBlocks](https://www.myphysicslab.com/springs/collide-blocks-en.html?reset;show-terminal=true)
simulation, other collision simulations are described below.

Open the terminal window by clicking the "terminal" checkbox. (This screenshot is from the Double Pendulum simulation, but CollideBlocks is similar).

<img src='TerminalWindow.jpg' width='1350' height='1368'>
&nbsp;

Type `help` in the command box (and hit return of course) to see available Terminal
commands.

Set your desired initial conditions on the simulation.

Paste into the Terminal command box this script

    sim.setCollisionFunction(function(c,t) {
      const s = c.getDetectedTime().toFixed(2)+"\t"
        +c.getImpulse().toFixed(2)+"\t"
        +c.rightBlock_.getPosition().getX().toFixed(2)+"\t"
        +c.leftBlock_.getName()+"\t"
        +c.rightBlock_.getName();
      t.println(s);
    })

To see it working [try this link](https://www.myphysicslab.com/springs/collide-blocks-en.html?reset;show-terminal=true;sim.setCollisionFunction(function(c,t){const%20s=c.getDetectedTime().toFixed(2)+"%5Ct"+c.getImpulse().toFixed(2)+"%5Ct"+c.rightBlock_.getPosition().getX().toFixed(2)+"%5Ct"+c.leftBlock_.getName()+"%5Ct"+c.rightBlock_.getName();t.println(s);});resume).

Hit the "play" button to start the simulation running. You should see output like this

    0.44	5.19	3.00	BLOCK1	BLOCK2
    1.51	5.19	7.20	BLOCK2	WALLRIGHT
    2.81	3.73	2.20	BLOCK1	BLOCK2
    3.34	4.16	1.69	BLOCK1	BLOCK2
    3.92	3.19	2.73	BLOCK1	BLOCK2
    4.95	5.89	7.20	BLOCK2	WALLRIGHT
    5.93	3.37	2.76	BLOCK1	BLOCK2
    6.54	4.37	1.74	BLOCK1	BLOCK2
    7.11	3.72	2.45	BLOCK1	BLOCK2
    8.26	5.57	7.20	BLOCK2	WALLRIGHT

As you can tell from the code the order is:
- time
- impulse (change in momentum)
- position
- name of left block
- name of right block

There are tab characters between each field `"\t"`, which makes it easy to paste into a
spreadsheet. You can of course change the formatting as you want by modifying the code.


## Collision Types and Collision Simulations

There are various collision simulations and each has it's particular collision type with
different information available. Check the documentation or source code to find how to
get the data you want from a particular collision type.

### CollideBlocks

See above for example code for the CollideBlocks simulation.
The collisions are instances of
[BlockCollision](./classes/sims_springs_BlockCollision.BlockCollision.html)
which contain block objects that are instances of
[PointMass](./classes/lab_model_PointMass.PointMass.html).


### RollerFlight

For the
[RollerFlight](https://www.myphysicslab.com/roller/roller-flight-en.html?reset;show-terminal=true)
simulation here is some sample code

    sim.setCollisionFunction(function(c,t) {
      const s = c.getDetectedTime().toFixed(2)+"\t"
        +c.getImpulse().toFixed(2)+"\t"
        +c.getPathPoint().getX().toFixed(2)+"\t"
        +c.getPathPoint().getY().toFixed(2);
      t.println(s);
    })

To see it working [try this link](https://www.myphysicslab.com/roller/roller-flight-en.html?reset;show-terminal=true;sim.setCollisionFunction(function(c,t){const%20s=c.getDetectedTime().toFixed(2)+"%5Ct"+c.getImpulse().toFixed(2)+"%5Ct"+c.getPathPoint().getX().toFixed(2)+"%5Ct"+c.getPathPoint().getY().toFixed(2);t.println(s);});resume;).

The collisions are instances of [RollerCollision](./classes/sims_roller_RollerCollision.RollerCollision.html)
which contain instances of
[PathPoint](./classes/lab_model_PathPoint.PathPoint.html).


### Engine2D
Many myPhysicsLab simulations use the
[Rigid Body Physics Engine](https://www.myphysicslab.com/explain/physics-engine-en.html).
Some examples are
[BilliardsApp](https://www.myphysicslab.com/engine2D/billiards-en.html),
[FastBallApp](https://www.myphysicslab.com/develop/build/sims/engine2D/FastBallApp-en.html),
[PileApp](https://www.myphysicslab.com/engine2D/pile-en.html) and
others. When you type `sim` in the Terminal command box, you will usually see that the
sim is a
[ContactSim](./classes/lab_engine2D_ContactSim.ContactSim.html) or less often an
[ImpulseSim](./classes/lab_engine2D_ImpulseSim.ImpulseSim.html).
Here is some sample code that works with these simulations

    sim.setCollisionFunction(function(c,t) {
    const s = c.getDetectedTime().toFixed(2)+"\t"
      +c.getDistance().toFixed(5)+"\t"
      +c.getImpulse().toFixed(2)+"\t"
      +c.getPrimaryBody().getName()+"\t"
      +c.getNormalBody().getName();
    t.println(s);
    })

To see it working in the FastBall simulation
[try this link](https://www.myphysicslab.com/develop/build/sims/engine2D/FastBallApp-en.html?reset;show-terminal=true;sim.setCollisionFunction(function(c,t){const%20s=c.getDetectedTime().toFixed(2)+"%5Ct"+c.getDistance().toFixed(5)+"%5Ct"+c.getImpulse().toFixed(2)+"%5Ct"+c.getPrimaryBody().getName()+"%5Ct"+c.getNormalBody().getName();t.println(s);});resume;)

The collisions are instances of
[RigidBodyCollision](./classes/lab_engine2D_RigidBody.RigidBodyCollision.html)
which contain instances of
[RigidBody](./interfaces/lab_engine2D_RigidBody.RigidBody.html).



### Molecule Apps
For the  [Molecule2](https://www.myphysicslab.com/springs/molecule2-en.html)
and
[Molecule3](https://www.myphysicslab.com/springs/molecule3-en.html)
simulations here is some sample code

    sim.setCollisionFunction(function(c,t) {
      const s = c.getDetectedTime().toFixed(2)+"\t"
        +c.getImpulse().toFixed(2)+"\t"
        +c.atom.getPosition().getX().toFixed(2)+"\t"
        +c.atom.getPosition().getY().toFixed(2)+"\t"
        +c.atom.getName()+"\t"+c.side;
      t.println(s);
    })

To see it working in the Molecule2 simulation
[try this link](https://www.myphysicslab.com/springs/molecule2-en.html?reset;show-terminal=true;gravity=0.8;sim.setCollisionFunction(function(c,t){const%20s=c.getDetectedTime().toFixed(2)+"%5Ct"+c.getImpulse().toFixed(2)+"%5Ct"+c.atom.getPosition().getX().toFixed(2)+"%5Ct"+c.atom.getPosition().getY().toFixed(2)+"%5Ct"+c.atom.getName()+"%5Ct"+c.side;t.println(s)});resume;)

The collisions are instances of
[MoleculeCollision](./classes/sims_springs_MoleculeCollision.MoleculeCollision.html)
which contain instances of
[PointMass](./classes/lab_model_PointMass.PointMass.html).

&nbsp;

&nbsp;
