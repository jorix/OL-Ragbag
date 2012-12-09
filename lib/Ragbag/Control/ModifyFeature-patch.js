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
        var code = evt.keyCode;
        // check for delete key
        if(this.feature &&
           OpenLayers.Util.indexOf(this.deleteCodes, code) != -1) {
            var vertex = this.dragControl.feature;
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
        }
    };
    
    /**
     * APIMethod: justUnselectFeature
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