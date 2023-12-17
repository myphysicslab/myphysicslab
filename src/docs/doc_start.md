myPhysicsLab provides JavaScript classes to build real-time interactive animated
physics simulations.


Documentation
-------------

Besides the links on this page for each class and interface, see also:

+ The [myPhysicsLab website](https://www.myphysicslab.com) shows the simulations
    running and contains explanations of the math behind them.

+ [Building myPhysicsLab Software](Building.html) has information about building,
    testing, internationalization, and general programming issues.

+ The [How Does It Work?](https://www.myphysicslab.com/index-en.html#how-does-it-work)
    section of myPhysicsLab explains how physics simulations work in general.

+ [myPhysicsLab Architecture](Architecture.html) is the best place to start for
    understanding the software.

+ [2D Physics Engine Overview](Engine2D.html) covers the rigid body physics engine.

+ [Customizing myPhysicsLab Simulations](Customizing.html) tells how to customize
    using only a browser and text editor.


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
    + [myphysicslab.lab.app.SimController](./classes/lab_app_SimController.SimController.html)
    + [myphysicslab.lab.app.SimRunner](./classes/lab_app_SimRunner.SimRunner.html)

+ `myphysicslab.lab.controls` user interface controls
    + [myphysicslab.lab.controls.CheckBoxControl](./classes/lab_controls_CheckBoxControl.CheckBoxControl.html)
    + [myphysicslab.lab.controls.NumericControl](./classes/lab_controls_NumericControl.NumericControl.html)

+ `myphysicslab.lab.engine2D` 2D rigid body physics engine
    + [myphysicslab.lab.engine2D.ContactSim](./classes/lab_engine2D_ContactSim.ContactSim.html)
    + [myphysicslab.lab.engine2D.ImpulseSim](./classes/lab_engine2D_ImpulseSim.ImpulseSim.html)
    + [myphysicslab.lab.engine2D.Joint](./classes/lab_engine2D_Joint.Joint.html)
    + [myphysicslab.lab.engine2D.Polygon](./classes/lab_engine2D_Polygon.Polygon.html)
 + [myphysicslab.lab.engine2D.RigidBody](./interfaces/lab_engine2D_RigidBody.RigidBody.html)
 + [myphysicslab.lab.engine2D.RigidBodySim](./classes/lab_engine2D_RigidBodySim.RigidBodySim.html)
     + [myphysicslab.lab.engine2D.Shapes](./classes/lab_engine2D_Shapes.Shapes.html)

+ `myphysicslab.lab.graph` create graphs of simulation variables
    + [myphysicslab.lab.graph.DisplayGraph](./classes/lab_graph_DisplayGraph.DisplayGraph.html)
    + [myphysicslab.lab.graph.GraphLine](./classes/lab_graph_GraphLine.GraphLine.html)
    + [myphysicslab.lab.graph.StandardAxes](./classes/lab_graph_StandardAxes.StandardAxes.html)
    + []()

+ `myphysicslab.lab.model` the model of a simulation, including variables,
     differential equation solvers, physics objects
    + [myphysicslab.lab.model.AdvanceStrategy](./classes/lab_model_AdvanceStrategy.AdvanceStrategy.html)
    + [myphysicslab.lab.model.CollisionSim](./classes/lab_model_CollisionSim.CollisionSim.html)
    + [myphysicslab.lab.model.DiffEqSolver](./classes/lab_model_DiffEqSolver.DiffEqSolver.html)
    + [myphysicslab.lab.model.PointMass](./classes/lab_model_PointMass.PointMass.html)
    + [myphysicslab.lab.model.SimList](./classes/lab_model_SimList.SimList.html)
    + [myphysicslab.lab.model.SimObject](./classes/lab_model_SimObject.SimObject.html)
    + [myphysicslab.lab.model.Simulation](./classes/lab_model_Simulation.Simulation.html)
    + [myphysicslab.lab.model.Variable](./classes/lab_model_Variable.Variable.html)
    + [myphysicslab.lab.model.VarsList](./classes/lab_model_VarsList.VarsList.html)

+ `myphysicslab.lab.util` utility classes, including Subject, Observer, Parameter
    + [myphysicslab.lab.util.Clock](./classes/lab_util_Clock.Clock.html)
    + [myphysicslab.lab.util.Observer](./interfaces/lab_util_Observe.Observer.html)
    + [myphysicslab.lab.util.Parameter](./interfaces/lab_util_Observe.Parameter.html)
    + [myphysicslab.lab.util.Subject](./interfaces/lab_util_Observe.Subject.html)
    + [myphysicslab.lab.util.SubjectEvent](./interfaces/lab_util_Observe.SubjectEvent.html)
    + [myphysicslab.lab.util.Timer](./classes/lab_util_Timer.Timer.html)
    + [myphysicslab.lab.util.Vector](./classes/lab_util_Vector.Vector.html)

+ `myphysicslab.lab.view` displays simulation objects in a canvas
    + [myphysicslab.lab.view.CoordMap](./classes/lab_view_CoordMap.CoordMap.html)
    + [myphysicslab.lab.view.DisplayObject](./interfaces/lab_view_DisplayObject.DisplayObject.html)
    + [myphysicslab.lab.view.DisplayShape](./classes/lab_view_DisplayShape.DisplayShape.html)
    + [myphysicslab.lab.view.DisplaySpring](./classes/lab_view_DisplaySpring.DisplaySpring.html)
    + [myphysicslab.lab.view.LabCanvas](./classes/lab_view_LabCanvas.LabCanvas.html)
    + [myphysicslab.lab.view.SimView](./classes/lab_view_SimView.SimView.html)

+ `myphysicslab.sims.engine2D` applications displaying rigid body physics engine simulations
    + [myphysicslab.sims.engine2D.ChainApp](./classes/sims_engine2D_ChainApp.ChainApp.html)
    + [myphysicslab.sims.engine2D.Engine2DApp](./classes/sims_engine2D_Engine2DApp.Engine2DApp.html)
    + [myphysicslab.sims.engine2D.NewtonsCradleApp](./classes/sims_engine2D_NewtonsCradleApp.NewtonsCradleApp.html)
    + [myphysicslab.sims.engine2D.RigidBodyObserver](./classes/sims_engine2D_RigidBodyObserver.RigidBodyObserver.html)

+ `myphysicslab.sims.experimental` applications using myphysicslab classes
     in experimental ways
    + [myphysicslab.sims.experimental.BlankSlateApp](./classes/sims_experimental_BlankSlateApp.BlankSlateApp.html)
    + [myphysicslab.sims.experimental.GraphCalcApp](./classes/sims_experimental_GraphCalcApp.GraphCalcApp.html)

+ `myphysicslab.sims.common` utility classes used by myphysicslab applications
    + [myphysicslab.sims.common.AbstractApp](./classes/sims_common_AbstractApp.AbstractApp.html)
    + [myphysicslab.sims.common.CommonControls](./classes/sims_common_CommonControls.CommonControls.html)
    + [myphysicslab.sims.common.StandardGraph1](./classes/sims_common_StandardGraph1.StandardGraph1.html)
    + [myphysicslab.sims.common.TabLayout](./classes/sims_common_TabLayout.TabLayout.html)

+ `myphysicslab.sims.pde` applications displaying simulations using
     partial differential equations
    + [myphysicslab.sims.pde.StringApp](./classes/sims_pde_StringApp.StringApp.html)
    + [myphysicslab.sims.pde.StringPath](./classes/sims_pde_StringPath.StringPath.html)
    + [myphysicslab.sims.pde.StringShapes](./classes/sims_pde_StringShapes.StringShapes.html)
    + [myphysicslab.sims.pde.StringSim](./classes/sims_pde_StringSim.StringSim.html)

+ `myphysicslab.sims.pendulum` applications displaying pendulum simulations
    + [myphysicslab.sims.pendulum.DoublePendulumApp](./classes/sims_pendulum_DoublePendulumApp.DoublePendulumApp.html)
    + [myphysicslab.sims.pendulum.PendulumApp](./classes/sims_pendulum_PendulumApp.PendulumApp.html)

+ `myphysicslab.sims.roller` applications displaying roller coaster simulations
    + [myphysicslab.sims.roller.AbstractPath](./classes/sims_roller_AbstractPath.AbstractPath.html)
    + [myphysicslab.sims.roller.PathObserver](./classes/sims_roller_PathObserver.PathObserver.html)
    + [myphysicslab.sims.roller.PathSelector](./classes/sims_roller_PathSelector.PathSelector.html)
    + [myphysicslab.sims.roller.RigidBodyRollerApp](./classes/sims_roller_RigidBodyRollerApp.RigidBodyRollerApp.html)
    + [myphysicslab.sims.roller.RollerDoubleApp](./classes/sims_roller_RollerDoubleApp.RollerDoubleApp.html)

+ `myphysicslab.sims.springs` applications displaying spring simulations
    + [myphysicslab.sims.springs.ChainOfSpringsApp](./classes/sims_springs_ChainOfSpringsApp.ChainOfSpringsApp.html)
    + [myphysicslab.sims.springs.CollideBlocksApp](./classes/sims_springs_CollideBlocksApp.CollideBlocksApp.html)
    + [myphysicslab.sims.springs.SingleSpringApp](./classes/sims_springs_SingleSpringApp.SingleSpringApp.html)

+ `myphysicslab.test` tests of myphysicslab classes
    + [myphysicslab.test.Engine2DTestRig](./modules/test_Engine2DTestRig.html)
    + [myphysicslab.test.Engine2DTests](./modules/test_Engine2DTests.html)
    + [myphysicslab.test.TestRig](./modules/test_TestRig.html)
    + [myphysicslab.test.TestViewerApp](./classes/test_TestViewerApp.html)
