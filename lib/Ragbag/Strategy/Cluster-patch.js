/* Copyright 2013 Xavier Mamano, http://github.com/jorix/OL-Ragbag
 * Published under MIT license. All rights reserved. */

/**
 * @requires OpenLayers/Strategy/Cluster.js
 */
 
(function(){
    var _base = OpenLayers.Strategy.Cluster,
        _prototype = _base.prototype;

    OpenLayers.Strategy.Cluster = OpenLayers.Class(_base, {
        enabled: true,
        zoomSettings: null,
        defaultSettings: null,
        initialize: function() {
            _prototype.initialize.apply(this, arguments);
            this.defaultSettings = OpenLayers.Util.applyDefaults(
                this.defaultSettings, {
                    distance: this.distance,
                    threshold: this.threshold,
                    enabled: this.enabled
                }
            );
        },
        cacheFeatures: function(event) {
            if (this.clustering) { return; }
            if (this.enabled) {
                return _prototype.cacheFeatures.apply(this, arguments);
            } else if (this.features) {
                this.uncluster();
            }
        },
        cluster: function(event) {
            if (event && event.zoomChanged) {
                var zoomSettings = this.zoomSettings,
                    zoomLevel = this.layer.map.getZoom();
                OpenLayers.Util.extend(this, this.defaultSettings);
                for (var i=0, len = zoomSettings.length; i<len; i++) {
                    var item = zoomSettings[i];
                    if (zoomLevel >= item.zoomRange[0] && zoomLevel <= item.zoomRange[1]) {
                        OpenLayers.Util.extend(this, item.settings);
                        break;
                    }
                }
            }
            if (this.enabled) {
                if (!this.features) {
                    this.features = this.layer.features.slice();
                }
                _prototype.cluster.apply(this, arguments);
            } else {
                if (this.features) {
                    this.uncluster();
                }
            }
        },
        uncluster: function() {
            // Warning: methods that call this function should monitor that `this.features` has value.
            var features = this.features.slice();
            this.clearCache();
            this.clustering = true;
            this.layer.removeAllFeatures();
            this.layer.addFeatures(features);
            this.clustering = false;
        },
        // enable and disable are optional methods
        enable: function() {
            this.enabled = true;
            this.defaultSettings.enabled = true;
            if (!this.features) {
                this.features = this.layer.features.slice();
                this.cluster();
            }
        },
        disable: function() {
            this.enabled = false;
            this.defaultSettings.enabled = false;
            if (this.features) {
                this.uncluster();
            }
        }
    });
})();