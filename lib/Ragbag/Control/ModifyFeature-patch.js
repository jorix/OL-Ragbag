/* Copyright 2012 Xavier Mamano, http://github.com/jorix/OL-Ragbag
 * Published under MIT license. All rights reserved. */

/**
 * @requires OpenLayers/Control/ModifyFeature.js
 */
 
/**
 * Class: OpenLayers.Control.ModifyFeature
 * Patch for ModifyFeature control of OpenLayers.
 *
 * Extends the ModifyFeature control behavior to allow delete by del-key the
 *     feature that have been selected for modification.
 */
(function(){

    var _prototype = OpenLayers.Control.ModifyFeature.prototype;
    // Add event types on OL 2.11 or lower
    if (_prototype.EVENT_TYPES) { 
        _prototype.EVENT_TYPES.push("beforefeaturedeleted", "featuredeleted");
    }

    /**
     * APIProperty: featureDelkeyMode
     * {String} Mode in which the del-key acts to remove the feature that is
     *     selected for modification. The available modes are: "none", "always",
     *     "bounds" (only be deleted if when pressing del-key the mouse is
     *     within the feature bounds) and "hover" (only be deleted pressing
     *     del-key when the mouse is placed over the feature)
     */
    _prototype.featureDelkeyMode = "bounds";

    /**
     * APIProperty: deferDelete
     * {Boolean} Instead of removing features from the layer, set feature
     *     states of deleted features to DELETE.  This assumes a save strategy
     *     or other component is in charge of removing features from the
     *     layer.  Default is false.  If false, deleted features will be
     *     immediately removed from the layer.
     */
    _prototype.deferDelete = false;
    
    /**
     * APIProperty: escapeCode
     * {Integer} Keycode for cancel a vertex drag.  Set to null to
     *     disable cancel vertex drad by keypress.  Default is 27.
     */
    _prototype.escapeCode = 27;

    /**
     * Property: initialVertex
     * {Object} Internal use
     */
    _prototype.initialVertex = null;

    var _base_handleKeypress = _prototype.handleKeypress;
    /**
     * Method: handleKeypress
     * Called by the feature handler on keypress.  This is used to delete
     *     vertices and features. If the <deleteCode> property is set, vertices
     *     will be deleted when a feature is selected for modification and
     *     the mouse is over a vertex, otherwise the feature will be depending
     *     of <featureDelkeyMode>
     *
     * Parameters:
     * evt - {Event} Keypress event.
     */
    _prototype.handleKeypress = function(evt) {
        if(!this.feature) {
            return;
        }
        var vertex,
            code = evt.keyCode;
        // check for delete key
        if (OpenLayers.Util.indexOf(this.deleteCodes, code) != -1) {
            vertex = this.dragControl.feature;
            if (!vertex) {
            // patch
                var confirm = false,
                    feature = this.feature;
                switch (this.featureDelkeyMode) {
                    case "always":
                        confirm = true;
                        break;
                    case "hover":
                        var handlerFeature = this.selectControl && this.selectControl.handlers.feature;
                        if (handlerFeature) {
                            confirm = (feature === feature.layer.getFeatureFromEvent(handlerFeature.evt));
                        }
                        break;
                    case "bounds":
                        var handlerFeature = this.selectControl && this.selectControl.handlers.feature;
                        if (handlerFeature) {
                            var xy = handlerFeature.evt.xy;
                            var location = this.map.getLonLatFromPixel(xy);
                            confirm = feature.geometry.getBounds().containsLonLat(location);
                        }
                }
                if (confirm) {
                    var layer = feature.layer;
                    if(feature.state === OpenLayers.State.INSERT || 
                                                                !this.deferDelete) {
                        OpenLayers.Util.removeItem(layer.selectedFeatures, feature);
                        this.justUnselectFeature(feature);
                        layer.destroyFeatures([feature]);
                    } else {
                        var cont = this.events.triggerEvent(
                            "beforefeaturedeleted", {feature: feature}
                        );
                        if (cont !== false) {
                            OpenLayers.Util.removeItem(layer.selectedFeatures, feature);
                            this.justUnselectFeature(feature);
                            feature.state = OpenLayers.State.DELETE;
                            layer.drawFeature(feature);
                            this.events.triggerEvent(
                                "featuredeleted", {feature: feature}
                            );
                        }
                    }
                }
            } else {
            // call base code
                _base_handleKeypress.call(this, evt);
            }
        // check for escape key
        } else if (this.escapeCode == code && this.dragControl.feature) {
            vertex = this.dragControl.feature;
            if (vertex &&
                       OpenLayers.Util.indexOf(this.vertices, vertex) != -1 &&
                       this.dragControl.handlers.drag.dragging &&
                       vertex.geometry.parent) {
                var initialVertex = this.initialVertex;
                if (initialVertex.id === vertex.id) {
                    this.dragControl.handlers.drag.deactivate();
                    this.dragControl.handlers.drag.activate();
                    if (initialVertex.index) { 
                    // is virtual
                        _base_handleKeypress.call(
                            this,
                            OpenLayers.Util.applyDefaults({keyCode: 46}, evt)
                        );
                    } else {
                    // is real
                        vertex.geometry.x = initialVertex.x;
                        vertex.geometry.y = initialVertex.y;
                        vertex.geometry.clearBounds();
                        this.layer.events.triggerEvent("vertexmodified", {
                            vertex: vertex.geometry,
                            feature: this.feature,
                            pixel: new OpenLayers.Pixel(
                                         initialVertex.pixx, initialVertex.pixy)
                        });
                        this.layer.drawFeature(
                            this.feature,
                            this.standalone ? undefined :
                                              this.selectControl.renderIntent
                        );
                        this.dragComplete(vertex);
                    }
                }
            }
        }
    };

    var _base_dragStart = _prototype.dragStart;
    /**
     * Method: dragStart
     * Called by the drag feature control with before a feature is dragged.
     *     This method is used to differentiate between points and vertices
     *     of higher order geometries.  This respects the <geometryTypes>
     *     property and forces a select of points when the drag control is
     *     already active (and stops events from propagating to the select
     *     control).
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The point or vertex about to be
     *     dragged.
     * pixel - {<OpenLayers.Pixel>} Pixel location of the mouse event.
     */
    _prototype.dragStart = function(feature, pixel) {
        this.initialVertex = {
            index: feature._index,
            id: feature.id,
            x: feature.geometry.x,
            y: feature.geometry.y,
            pixx: pixel.x,
            pixy: pixel.y
        };
        _base_dragStart.apply(this, arguments);
    };

    /**
     * Method: justUnselectFeature
     * Called to unselect the feature.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The unselected feature.
     */
    _prototype.justUnselectFeature = function(feature) {
        this.layer.removeFeatures(this.vertices, {silent: true});
        this.vertices = [];
        this.layer.destroyFeatures(this.virtualVertices, {silent: true});
        this.virtualVertices = [];
        if(this.dragHandle) {
            this.layer.destroyFeatures([this.dragHandle], {silent: true});
            delete this.dragHandle;
        }
        if(this.radiusHandle) {
            this.layer.destroyFeatures([this.radiusHandle], {silent: true});
            delete this.radiusHandle;
        }
        this.feature = null;
        this.dragControl.deactivate();
        this.modified = false;
    };
})();