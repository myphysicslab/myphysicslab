myPhysicsLab Documentation
==========================

myPhysicsLab provides JavaScript classes to build real-time interactive animated
physics simulations.


Documentation
-------------

+ The [myPhysicsLab website](http://67.199.21.25) shows the simulations
    running and contains explanations of the math behind them.

+ Documentation for each class and interface is available on this page.
    + Open the drop-down menu at upper left to navigate among the Types menu.
    + Type in the "Search" bar above to find a specific class or method
    + Click a link to one of the representative classes listed below.

+ See [Building myPhysicsLab Software](Building.html) for information about building,
    testing, internationalization, and general programming issues.

+ See [myPhysicsLab Architecture](Architecture.html) for an introduction to classes
    and interfaces.

+ See [Engine2D Overview](Engine2D.html) for an overview of the 2d rigid body physics
    engine.

+ See [Customizing myPhysicsLab Simulations](Customizing.html) about how to customize
    using only a browser and text editor.

+ [Closure Library](http://google.github.io/closure-library/api/) has documentation
    about the Closure Library classes used here, for example `goog.array`.

Author and License
------------------

myPhysicsLab is provided as open source software under the
[Apache 2.0 License](http://www.apache.org/licenses/). See the accompanying file
named `LICENSE`. The author is Erik Neumann
<erikn@myphysicslab.com>.

Source code is available at <https://github.com/myphysicslab/myphysicslab>.


Namespaces and Important Classes
--------------------------------
Here are the namespaces of myPhysicsLab, with a few representative classes and
interfaces listed for ease of browsing.

+ `myphysicslab.lab.app` helper classes for applications
    + [myphysicslab.lab.app.SimController](myphysicslab.lab.app.SimController.html)
    + [myphysicslab.lab.app.SimRunner](myphysicslab.lab.app.SimRunner.html)

+ `myphysicslab.lab.controls` user interface controls
    + [myphysicslab.lab.controls.CheckBoxControl](myphysicslab.lab.controls.CheckBoxControl.html)
    + [myphysicslab.lab.controls.NumericControl](myphysicslab.lab.controls.NumericControl.html)

+ `myphysicslab.lab.engine2D` 2D rigid body physics engine
    + [myphysicslab.lab.engine2D.ContactSim](myphysicslab.lab.engine2D.ContactSim.html)
    + [myphysicslab.lab.engine2D.ImpulseSim](myphysicslab.lab.engine2D.ImpulseSim.html)
    + [myphysicslab.lab.engine2D.Joint](myphysicslab.lab.engine2D.Joint.html)
    + [myphysicslab.lab.engine2D.Polygon](myphysicslab.lab.engine2D.Polygon.html)
    + [myphysicslab.lab.engine2D.RigidBodySim](myphysicslab.lab.engine2D.RigidBodySim.html)
    + [myphysicslab.lab.engine2D.Shapes](myphysicslab.lab.engine2D.Shapes.html)

+ `myphysicslab.lab.graph` create graphs of simulation variables
    + [myphysicslab.lab.graph.DisplayGraph](myphysicslab.lab.graph.DisplayGraph.html)
    + [myphysicslab.lab.graph.GraphLine](myphysicslab.lab.graph.GraphLine.html)
    + [myphysicslab.lab.graph.StandardAxes](myphysicslab.lab.graph.StandardAxes.html)
    + []()

+ `myphysicslab.lab.model` the model of a simulation, including variables,
     differential equation solvers, physics objects
    + [myphysicslab.lab.model.AdvanceStrategy](myphysicslab.lab.model.AdvanceStrategy.html)
    + [myphysicslab.lab.model.CollisionSim](myphysicslab.lab.model.CollisionSim.html)
    + [myphysicslab.lab.model.DiffEqSolver](myphysicslab.lab.model.DiffEqSolver.html)
    + [myphysicslab.lab.model.PointMass](myphysicslab.lab.model.PointMass.html)
    + [myphysicslab.lab.model.SimList](myphysicslab.lab.model.SimList.html)
    + [myphysicslab.lab.model.SimObject](myphysicslab.lab.model.SimObject.html)
    + [myphysicslab.lab.model.Simulation](myphysicslab.lab.model.Simulation.html)
    + [myphysicslab.lab.model.Variable](myphysicslab.lab.model.Variable.html)
    + [myphysicslab.lab.model.VarsList](myphysicslab.lab.model.VarsList.html)

+ `myphysicslab.lab.util` utility classes, including Subject, Observer, Parameter
    + [myphysicslab.lab.util.Clock](myphysicslab.lab.util.Clock.html)
    + [myphysicslab.lab.util.Observer](myphysicslab.lab.util.Observer.html)
    + [myphysicslab.lab.util.Parameter](myphysicslab.lab.util.Parameter.html)
    + [myphysicslab.lab.util.Subject](myphysicslab.lab.util.Subject.html)
    + [myphysicslab.lab.util.SubjectEvent](myphysicslab.lab.util.SubjectEvent.html)
    + [myphysicslab.lab.util.Timer](myphysicslab.lab.util.Timer.html)
    + [myphysicslab.lab.util.Vector](myphysicslab.lab.util.Vector.html)

+ `myphysicslab.lab.view` displays simulation objects in a canvas
    + [myphysicslab.lab.view.CoordMap](myphysicslab.lab.view.CoordMap.html)
    + [myphysicslab.lab.view.DisplayObject](myphysicslab.lab.view.DisplayObject.html)
    + [myphysicslab.lab.view.DisplayShape](myphysicslab.lab.view.DisplayShape.html)
    + [myphysicslab.lab.view.DisplaySpring](myphysicslab.lab.view.DisplaySpring.html)
    + [myphysicslab.lab.view.LabCanvas](myphysicslab.lab.view.LabCanvas.html)
    + [myphysicslab.lab.view.LabView](myphysicslab.lab.view.LabView.html)
    + [myphysicslab.lab.view.SimView](myphysicslab.lab.view.SimView.html)

+ `myphysicslab.sims.engine2D` applications displaying rigid body simulations
    + [myphysicslab.sims.engine2D.ChainApp](myphysicslab.sims.engine2D.ChainApp.html)
    + [myphysicslab.sims.engine2D.Engine2DApp](myphysicslab.sims.engine2D.Engine2DApp.html)
    + [myphysicslab.sims.engine2D.NewtonsCradleApp](myphysicslab.sims.engine2D.NewtonsCradleApp.html)
    + [myphysicslab.sims.engine2D.RigidBodyObserver](myphysicslab.sims.engine2D.RigidBodyObserver.html)

+ `myphysicslab.sims.experimental` applications using myphysicslab classes
     in experimental ways
    + [myphysicslab.sims.experimental.BlankSlateApp](myphysicslab.sims.experimental.BlankSlateApp.html)
    + [myphysicslab.sims.experimental.GraphCalcApp](myphysicslab.sims.experimental.GraphCalcApp.html)

+ `myphysicslab.sims.layout` utility classes used by myphysicslab applications
    + [myphysicslab.sims.layout.AbstractApp](myphysicslab.sims.layout.AbstractApp.html)
    + [myphysicslab.sims.layout.CommonControls](myphysicslab.sims.layout.CommonControls.html)
    + [myphysicslab.sims.layout.StandardGraph1](myphysicslab.sims.layout.StandardGraph1.html)
    + [myphysicslab.sims.layout.TabLayout](myphysicslab.sims.layout.TabLayout.html)

+ `myphysicslab.sims.pde` applications displaying simulations using
     partial differential equations
    + [myphysicslab.sims.pde.StringApp](myphysicslab.sims.pde.StringApp.html)
    + [myphysicslab.sims.pde.StringPath](myphysicslab.sims.pde.StringPath.html)
    + [myphysicslab.sims.pde.StringShape](myphysicslab.sims.pde.StringShape.html)
    + [myphysicslab.sims.pde.StringSim](myphysicslab.sims.pde.StringSim.html)

+ `myphysicslab.sims.pendulum` applications displaying pendulum simulations
    + [myphysicslab.sims.pendulum.DoublePendulumApp](myphysicslab.sims.pendulum.DoublePendulumApp.html)
    + [myphysicslab.sims.pendulum.PendulumApp](myphysicslab.sims.pendulum.PendulumApp.html)

+ `myphysicslab.sims.roller` applications displaying roller coaster simulations
    + [myphysicslab.sims.roller.AbstractPath](myphysicslab.sims.roller.AbstractPath.html)
    + [myphysicslab.sims.roller.PathObserver](myphysicslab.sims.roller.PathObserver.html)
    + [myphysicslab.sims.roller.PathSelector](myphysicslab.sims.roller.PathSelector.html)
    + [myphysicslab.sims.roller.RigidBodyRollerApp](myphysicslab.sims.roller.RigidBodyRollerApp.html)
    + [myphysicslab.sims.roller.RollerDoubleApp](myphysicslab.sims.roller.RollerDoubleApp.html)

+ `myphysicslab.sims.springs` applications displaying spring simulations
    + [myphysicslab.sims.springs.ChainOfSpringsApp](myphysicslab.sims.springs.ChainOfSpringsApp.html)
    + [myphysicslab.sims.springs.CollideBlocksApp](myphysicslab.sims.springs.CollideBlocksApp.html)
    + [myphysicslab.sims.springs.SingleSpringApp](myphysicslab.sims.springs.SingleSpringApp.html)

+ `myphysicslab.test` tests of myphysicslab classes
    + [myphysicslab.test.Engine2DTestRig](myphysicslab.test.Engine2DTestRig.html)
    + [myphysicslab.test.Engine2DTests](myphysicslab.test.Engine2DTests.html)
    + [myphysicslab.test.TestViewerApp](myphysicslab.test.TestViewerApp.html)
