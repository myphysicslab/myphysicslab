CSS: ./Overview_2.css
Title: Getting Collision Data
HTML Header: <meta name="viewport" content="width=device-width, initial-scale=1">

[myPhysicsLab Documentation](index.html)

# Getting Collision Data

There are several myPhysicsLab simulations that include collisions between objects. To
get collision data use the `setCollisionFunction` method to specify a function which
prints the data to the Terminal. (Instead of printing, you could collect the data into a
Javascript array for later processing).

Each collision simulation has its own particular collsion class. Here are steps for the [CollideBlocks](https://www.myphysicslab.com/develop/build/sims/springs/CollideBlocksApp-en.html)
simulation, other simulations are described below.

Open the terminal window by clicking the "terminal" checkbox.

<img src='TerminalWindow.jpg'>
&nbsp;

Make sure you are using the [simple-compiled](Building.html#advancedvs.simplecompile)
version of the simulation. There should be a link to the simple-compiled version on the
simulation's web page, or find it on the
[set of simple-compiled applications](https://www.myphysicslab.com/develop/build/index-en.html).

Type `help` in the command box (and hit return of course) to see available commands.

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
different information available. Check the source code to find how to get the data you
want from a particular collision type. Links to the relevant source code are given below.

### CollideBlocks

For the 
[CollideBlocks](https://www.myphysicslab.com/develop/build/sims/springs/CollideBlocksApp-en.html)
simulation here is some sample code

    sim.setCollisionFunction(function(c,t) {
      const s = c.leftBlock_.getName()+"\t"
        +c.rightBlock_.getName()+"\t"
        +c.getDetectedTime().toFixed(2)+"\t"
        +c.getImpulse().toFixed(2)+"\t"
        +c.rightBlock_.getPosition().getX().toFixed(2);
      t.println(s);
    })

The collisions are instances of
[BlockCollision](https://github.com/myphysicslab/myphysicslab/blob/master/src/sims/springs/BlockCollision.js)
which inherits from
[Collision](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/model/Collision.js)

The block objects are instances of
[PointMass](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/model/PointMass.js)
which inherits from
[MassObject](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/model/MassObject.js)
and
[SimObject](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/model/SimObject.js)


### RollerFlight

For the [RollerFlight](https://www.myphysicslab.com/develop/build/sims/roller/RollerFlightApp-en.html)
simulation here is some sample code

    sim.setCollisionFunction(function(c,t) {
      const s = c.getDetectedTime().toFixed(2)+"\t"
        +c.getImpulse().toFixed(2)+"\t"
        +c.getPathPoint().getX().toFixed(2)+"\t"
        +c.getPathPoint().getY().toFixed(2);
      t.println(s);
    })


The collisions are instances of
[RollerCollision](https://github.com/myphysicslab/myphysicslab/blob/master/src/sims/roller/RollerCollision.js)
which inherits from
[Collision](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/model/Collision.js)

The collisions contain instances of
[PathPoint](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/model/PathPoint.js)




### Engine2D
Many myPhysicsLab simulations use the [Rigid Body Physics Engine](https://www.myphysicslab.com/explain/physics-engine-en.html). Some examples are
[BilliardsApp](https://www.myphysicslab.com/develop/build/sims/engine2D/BilliardsApp-en.html),
[FastBallApp](https://www.myphysicslab.com/develop/build/sims/engine2D/FastBallApp-en.html),
[PileApp](https://www.myphysicslab.com/develop/build/sims/engine2D/PileApp-en.html) and others.  In the simple-compiled version when you type `sim` in the Terminal command box, you will usually see that the sim is a 
[ContactSim](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/engine2D/ContactSim.js) or less often an
[ImpulseSim](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/engine2D/ImpulseSim.js).
Here is some sample code that works with these simulations

    sim.setCollisionFunction(function(c,t) {
    const s = c.getDetectedTime().toFixed(2)+"\t"
      +c.getImpulse().toFixed(2)+"\t"
      +c.getPrimaryBody().getName()+"\t"
      +c.getNormalBody().getName();
    t.println(s);
    })

The collisions are instances of
[RigidBodyCollision](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/engine2D/RigidBodyCollision.js)
which inherits from
[Collision](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/model/Collision.js)

The collisions contain instances of
[RigidBody](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/engine2D/RigidBody.js)
which inherits from
[MassObject](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/model/MassObject.js)
and
[SimObject](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/model/SimObject.js)



### Molecule1 & Molecule3
For the  [Molecule1](https://www.myphysicslab.com/develop/build/sims/springs/Molecule1App-en.html)
and
[Molecule3](https://www.myphysicslab.com/develop/build/sims/springs/Molecule3App-en.html)
simulations here is some sample code

    sim.setCollisionFunction(function(c,t) {
      const s = c.getDetectedTime().toFixed(2)+"\t"
        +c.getImpulse().toFixed(2)+"\t"
        +c.atom.getPosition().getX().toFixed(2)+"\t"
        +c.atom.getPosition().getY().toFixed(2)+"\t"
        +c.atom.getName();
      t.println(s);
    })

The collisions are instances of
[MoleculeCollision](https://github.com/myphysicslab/myphysicslab/blob/master/src/sims/springs/MoleculeCollision.js)
which inherits from
[Collision](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/model/Collision.js)

The collisions contain instances of
[PointMass](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/model/PointMass.js)
which inherits from
[MassObject](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/model/MassObject.js)
and
[SimObject](https://github.com/myphysicslab/myphysicslab/blob/master/src/lab/model/SimObject.js)

&nbsp;

&nbsp;



