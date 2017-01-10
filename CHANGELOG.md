Changelog
=========

Development code that is considered stable in the is in the *gh-pages* branch (note that *master* branch does not exist)


On development
--------------

(open for suggestions)


[v0.7.1](https://github.com/jorix/OL-Ragbag/tree/v0.7.1)
--------------------------------------------------------

#### Bug fixes
 * */dev/releaseEnvirontment.js*
   * Ensure that patches are loaded after OpenLayers on IE8 (or lower) when lib option is used.
 * *Control/ModifyFeature-tools.js*
   * Allows use delkey on IE8 (OL-Pull#1091)


[v0.7.0](https://github.com/jorix/OL-Ragbag/tree/v0.7.0)
--------------------------------------------------------

#### Improvements
 * *Control/ModifyFeature-tools.js*
   * Set tools position near to point more on top.

#### Changes
 * *Control/ModifyFeature-tools.js*
   * Is left to use *useVirtualPoint* property.
   * Method *collectVertices* agglutinates all code related to create tools and vertices.
 * */dev/releaseEnvirontment.js*
   * Use new OpenLayers v2.13.1


[v0.6.1](https://github.com/jorix/OL-Ragbag/tree/v0.6.1)
--------------------------------------------------------

#### Bug fixes
 * *Control/ModifyFeature-tools.js*
   * After a zoom the tools are not refreshed (when a feature is selected)


[v0.6.0](https://github.com/jorix/OL-Ragbag/tree/v0.6.0)
--------------------------------------------------------

#### Improvements
 * *Control/ModifyFeature-tools.js*
   * Select and drag simultaneously for single multipoins (as a point)
   * The position of the toolbar conforms to size of the point feature.
   * Support modify multilayer.
   * Control also acts if before activation there are other layers moved on top (due to SelecFeature or DragFeature controls)
   * Offers two options for selection by pressing (default) or releasing when *selectOnUp* is true.
   * Easy select feature programmatically also using multilayer by SelecFeature.

#### Changes
 * *Control/ModifyFeature-tools.js*
   * Never uses the layer styleMap (ignores options: `vertexRenderIntent` and `virtualStyle`)
   * Change the order of the tools in the toolbar.
   * Drag has been optimized considering the Canvas renderer.

#### Bug fixes
 * *Control/ModifyFeature-tools.js*
   * Zooming while dragging a tool form toolbar not fired event *"featuremodified"*.
   * Zooming the drag tool is located above the vertices.
   * "point" tool does not move with the point feature (using multipoint)
   * Apply [OL-984](https://github.com/openlayers/ol2/pull/984)


[v0.5.0](https://github.com/jorix/OL-Ragbag/tree/v0.5.0)
--------------------------------------------------------

#### Improvements
 * Replace *Control/ModifyFeature-patch.js* by *Control/ModifyFeature-tools.js*
   * It's a complete control, not a patch.
   * Delete a feature by a tools instead of *del-key*
   * Every action is a different tool (eg `ROTATE` & `RESIZE` work separately.)
   * Each tool has a different style (not a circle) and it is independent of the layer style.
   * Allows custom tools (eg rotate by a drag the angle attribute of a point)

#### Deprecated
 * *Control/ModifyFeature-patch.js*


[v0.4.0](https://github.com/jorix/OL-Ragbag/tree/v0.4.0)
--------------------------------------------------------

First version.

#### New components
 * *Control/ModifyFeature-patch.js* cancel last vertex drag by *esc-key* and delete feature by *del-key* (out of a vertex)
 * *Strategy/CenteredCluster.js* show clusters more centered (regarding its points)
 * *Handler/Path-patch.js* cancel last added point by *esc-key*
 * *Format/KML-patch.js* allows highlight features.
 * */dev/releaseEnvirontment.js* to load different OL releases using the same example.
