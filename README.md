A ragbag for use with OpenLayers
================================

This mixed bag containing several components, which are not related to each other. 

To use any component need only add it after the declaration of `<script src="... /OpenLayers.js"></script>`.
This components can also be used in a custom compressed [build](http://docs.openlayers.org/library/deploying.html#minimizing-build-size) so in the code has been declared the clauses of `@requires`.

The components:
---------------

### Improve ModifyFeature control using keys "del" and "esc"

  * Extends the ModifyFeature control behavior to allow delete the feature that have been selected for modification (by del-key).
  * Cancel vertex drag pressing esc-key.
  * See example [modify-feature.html](http://jorix.github.com/OL-Ragbag/examples/modify-feature.html)

### Extends KML format to load StyleMap with "normal" and "highlight" styles

  * See example [sundials.html](http://jorix.github.com/OL-Ragbag/examples/sundials.html)

### Centered Cluster strategy
  * Allow uncluster on deactivate and use adaptive settings depending on the level of zoom
  * Methods `activate` and `deactivate` makes cluster and uncluster the features.
  * New properties in respect of OL Cluster:
    * *centered*: clusters are centered on the points they represent (aprox)
    * *candidateMatches*: optional function that replaces the OL `shouldCluster` (see [strategy-cluster-extended.html](http://jorix.github.com/OL-Ragbag/examples/strategy-cluster-extended.html))
    * *enabled*: if false the features are shown unclustered.
    * *zoomSettings*: allows different settings depending on the zoom ranges (allowed settings: `enabled`, `distance` and `threshold`)
  * See examples: [sundials-cluster.html](http://jorix.github.com/OL-Ragbag/examples/sundials-cluster.html)  [strategy-centered-cluster-add-remove.html](http://jorix.github.com/OL-Ragbag/examples/strategy-centered-cluster-add-remove.html)

Compatibility with OpenLayers releases:
--------------------------------------
The components (if not stated otherwise in component description) works correctly with release 2.11 2.12 and the OL development version.

NOTES: 
 * Most of the examples used are adaptations of OpenLayers examples (this examples have their original name)
 * Use examples for development if you want to try a example using another OL release or unpatched, the examples of development has the same name with the suffix `-dev`.
