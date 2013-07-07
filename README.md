Ragbag of components for use with OpenLayers
============================================

OpenLayers is powerful and versatile but sometimes difficult to use. This repository contains various components that facilitate its use in specific aspects, but without renouncing the possibility of customization.
 * [Improve drawing and editing tools](#improve-drawing-and-editing-tools)
   * [Control.DrawFeature](#extends-path--polygon-handlers): Allows *esc-key* to cancel addition of last vertex.
   * [Control.ModifyFeature](#extends-modifyfeature-control): Multiple improvements.
 * [Format.KML](#extends-kml-format-for-allow-features-highlighting): Allows highlight features.
 * [Strategy.Cluster](#centeredcluster-strategy): Centering the clusters.
 * Components in other jorix's repositories.
   * [OL-FeaturePopups](https://github.com/jorix/OL-FeaturePopups): Automate selection and show popups using templates.
   * [OL-DynamicMeasure](https://github.com/jorix/OL-DynamicMeasure): Show measurements at the cursor.

The components:
==============

## Improve drawing and editing tools.

### Extends *Path* & *Polygon* handlers.
  * Cancels addition of last vertex by *esc-key*
  * Centering the first vertex the feature is deleted.
  * (Provided by [Path-patch.js](lib/Ragbag/Handler/Path-patch.js))

### Extends *ModifyFeature* control.
  * Allows usage multilayer also using SelectFeature.
  * Allow delete a feature that have been selected for modification (by a button)
  * Cancel a drag pressing *esc-key*.
  * Separate representation for each tool (rotate, resize ...)
  * Use icons to identify the tools.
  * Configurable styles are used to show the tools (independent of the layer *styleMap*)
  * Also uses Configurable styles to show vertices (independents of the layer *styleMap*)
  * Allows add custom tools (eg drag attributes as a angle attribute of a point)
  * (Provided by [ModifyFeature-tools.js](lib/Ragbag/Control/ModifyFeature-tools.js))

See examples:
  * Draw & modify and custom tools [modify-feature.html](http://jorix.github.io/OL-Ragbag/examples/modify-feature.html)
  * Multilayer usage without SelectFeature control [modify-feature-multilayer.html](http://jorix.github.io/OL-Ragbag/examples/modify-feature-multilayer.html)
  * Multilayer usage with SelectFeature control [modify-feature-selectFeature.html](http://jorix.github.io/OL-Ragbag/examples/modify-feature-selectFeature.html)

See example of multilayer usage [modify-feature-multilayer.html](http://jorix.github.io/OL-Ragbag/examples/modify-feature-multilayer.html)

## Extends KML format for allow features highlighting.

Allows use both *"normal"* and *"highlight"* styles from KML using with *extracStyles:true*
  * See example [sundials.html](http://jorix.github.io/OL-Ragbag/examples/sundials.html)
  * (Provided by [KML-patch.js](lib/Ragbag/Format/KML-patch.js))

## *CenteredCluster* strategy

### Centered Clusters

The OL Cluster algorithm is simple and efficient, but a cluster with two points shown centered on one of them, see [DEV: cluster coord update proposition](http://osgeo-org.1560.n6.nabble.com/Cluster-strategy-cluster-coord-update-proposition-td3947012.html#a3947013)

The `CenteredCluster` proposal uses the OL algorithm as the main piece to group points and subsequently refine cluster. Enough to improve outcome: clusters with few points are shown centered. Less cluster with more points, and is satisfied that all points are within the selected distance. There may be fewer clusters closer than the distance set, but if presents, are few and the separation between them is not much smaller than the set distance.

NOTE: This represents a considerable increase of the calculations to be performed, but has been done a implementation to optimize performance, so in the majority of cases `CenteredCluster` is as fast as than OL Cluster strategy.

 * See example [strategy-centered-cluster-log-timed.html](http://jorix.github.io/OL-Ragbag/examples/strategy-centered-cluster-log-timed.html) (comparison between `CenteredCluster` and OL Cluster strategies)
 * (Provided by [CenteredCluster.js](lib/Ragbag/Strategy/CenteredCluster.js))
 
### Other improvements

  * Methods `activate` and `deactivate` makes cluster and uncluster the features.
  * Use adaptive settings depending on the level of zoom (allowed settings: `enabled`, `distance`, `threshold` and `centered`), see [sundials-cluster.html](http://jorix.github.io/OL-Ragbag/examples/sundials-cluster.html)
  * New properties in respect of OL Cluster:
    * *centered*: clusters are centered on the points they represent (default value is true)
    * *candidateMatches*: optional function that replaces the OL `shouldCluster` (see [strategy-cluster-extended.html](http://jorix.github.io/OL-Ragbag/examples/strategy-cluster-extended.html))
    * *enabled*: if false the features are shown unclustered.
    * *zoomSettings*: allows different settings depending on the zoom ranges.
  * Allows add and remove individual features dynamically, see [strategy-centered-cluster-add-remove.html](http://jorix.github.io/OL-Ragbag/examples/strategy-centered-cluster-add-remove.html)

NOTE: This code includes a patch for [`getDataExtent`](http://jorix.github.io/OL-Ragbag/doc/Ragbag/api/files/Ragbag/Strategy/CenteredCluster-js.html#OpenLayers.Layer.Vector.getDataExtent) of `OpenLayers.Layer.Vector`.

- - -

Deploy:
-------
To use any component need only add it after the declaration of `<script src="... /OpenLayers.js"></script>`.

This components could be used in a custom `*.cfg` file to compress  javaScript since in the code has been declared the appropriate clauses of `@requires` (see OL manual [minimizing-build-size](http://docs.openlayers.org/library/deploying.html#minimizing-build-size))

See also **OL-ragbag API documentation**:
 * [API for users](http://jorix.github.io/OL-Ragbag/doc/Ragbag/api)
 * For developers [all elements](http://jorix.github.io/OL-Ragbag/doc/Ragbag/all)

Compatibility with OpenLayers releases:
--------------------------------------
The components (if not stated otherwise in component description) works correctly with release from 2.11 to 2.13 and the OL development version.

NOTES: 
 * Most of the examples used are adaptations of OpenLayers examples (this examples have their original name)
 * Use examples for development if you want to try a example using another OL release or unpatched, the examples of development has the same name with the suffix `-dev`.
