A ragbag for use with OpenLayers
================================

This mixed bag containing several components, which are not related to each other. 

To use any component need only add it after the declaration of `<script src="... /OpenLayers.js"></script>`.
This components can also be used in a custom compressed [build](http://docs.openlayers.org/library/deploying.html#minimizing-build-size) so in the code has been declared the clauses of the `@requires`.

The mishmash items:
===================

Delete features using ModifyFeature control:
-------------------------------------------
Extends the ModifyFeature control behavior to allow delete the feature that have been selected for modification. 
See example [modify-feature.html](http://jorix.github.com/OL-Ragbag/examples/modify-feature.html)

Load KML StyleMap with "normal" and "highlight" styles:
------------------------------------------------------
See example [sundials.html](http://jorix.github.com/OL-Ragbag/examples/sundials.html)

Compatibility with OpenLayers releases:
======================================
The components (if not stated otherwise in component description) works correctly with release 2.11 or higher
including the development version.

NOTE: Most of the examples used are adaptations of OpenLayers examples (this examples have their original name)
