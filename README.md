A ragbag for use with OpenLayers
================================

This mixed bag containing several components, which are not related to each other. 

The components:
==============

## Improve drawing and editing tools adding behaviors

  * Extends *Path* & *Polygon* handlers:
    * Provided by [Path-patch.js](lib/Ragbag/Handler/Path-patch.js)
    * Remove last added point by *esc-key* (or delete it if no more points to remove)
  * Extends *ModifyFeature* control behaviors:
    * Provided by [ModifyFeature-tools.js](lib/Ragbag/Control/ModifyFeature-tools.js)
    * Allows usage multilayer.
    * Allow delete a feature that have been selected for modification by a button.
    * Cancel a drag pressing *esc-key*.
    * Separate representation for each tool (rotate, resize ...)
    * Use icons to identify the tools.
    * Configurable styles are used to show the tools (independent of the layer *styleMap*)
    * Also uses Configurable styles to show vertices (independents of the layer *styleMap*)
    * Allows add custom tools (eg drag attributes as a angle attribute of a point)

See example [modify-feature.html](http://jorix.github.io/OL-Ragbag/examples/modify-feature.html)

See example of multilayer usage [modify-feature-multilayer.html](http://jorix.github.io/OL-Ragbag/examples/modify-feature-multilayer.html)

## Extends KML format to load StyleMap with *"normal"* and *"highlight"*

  * See example [sundials.html](http://jorix.github.io/OL-Ragbag/examples/sundials.html)

## *CenteredCluster* strategy

### Centered Clusters

The OL Cluster algorithm is simple and efficient, but a cluster with two points shown centered on one of them, see [DEV: cluster coord update proposition](http://osgeo-org.1560.n6.nabble.com/Cluster-strategy-cluster-coord-update-proposition-td3947012.html#a3947013)

The `CenteredCluster` proposal uses the OL algorithm as the main piece to group points and subsequently refine cluster. Enough to improve outcome: clusters with few points are shown centered. Less cluster with more points, and is satisfied that all points are within the selected distance. There may be fewer clusters closer than the distance set, but if presents, are few and the separation between them is not much smaller than the set distance.

NOTE: This represents a considerable increase of the calculations to be performed, but has been done a implementation to optimize performance, so in the majority of cases `CenteredCluster` is as fast as than OL Cluster strategy.

 * See example [strategy-centered-cluster-log-timed.html](http://jorix.github.io/OL-Ragbag/examples/strategy-centered-cluster-log-timed.html) (comparison between `CenteredCluster` and OL Cluster strategies)
 
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
The components (if not stated otherwise in component description) works correctly with release 2.11 2.12 and the OL development version.

NOTES: 
 * Most of the examples used are adaptations of OpenLayers examples (this examples have their original name)
 * Use examples for development if you want to try a example using another OL release or unpatched, the examples of development has the same name with the suffix `-dev`.
