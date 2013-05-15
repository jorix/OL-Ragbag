Changelog
=========

Development code that is considered stable in the is in the *gh-pages* branch (note that *master* branch does not exist)


### On development

(open for suggestions)


### [v0.5.0](https://github.com/jorix/OL-Ragbag/tree/v0.5.0)

#### Improvements

 * Replace *Control/ModifyFeature-patch.js* by *Control/ModifyFeature-tools.js*
   * It's a complete control, not a patch.
   * Delete a feature by a tools instead of *del-key*
   * Every action is a different tool (eg `ROTATE` & `RESIZE` work separately.)
   * Each tool has a different style (not a circle) and it is independent of the layer style.
   * Allows custom tools (eg rotate by a drag the angle attribute of a point)

#### Deprecated

 * *Control/ModifyFeature-patch.js*


### [v0.4.0](https://github.com/jorix/OL-Ragbag/tree/v0.4.0)

First version.

#### New components

 * *Control/ModifyFeature-patch.js* cancel last vertex drag by *esc-key* and delete feature by *del-key* (out of a vertex)
 * *Strategy/CenteredCluster.js* show clusters more centered (regarding its points)
 * *Handler/Path-patch.js* cancel last added point by *esc-key*
 * *Format/KML-patch.js* allows highlight features.
 * */dev/releaseEnvirontment.js* to load different OL releases using the same example.
