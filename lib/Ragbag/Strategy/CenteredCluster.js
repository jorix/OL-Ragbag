/* Copyright 2013 Xavier Mamano, http://github.com/jorix/OL-CenteredCluster
 * Published under MIT license. All rights reserved. 
 *
 * `_groupFeatures` & `_groupCluster` functions and the skeleton of the class is
 * based on OpenLayers.Strategy.Cluster class which is Copyright (c) 2005-2013
 * by OpenLayers Contributors under the
 * 2-clause BSD license http://openlayers.org/dev/license.txt
 */

/**
 * @requires OpenLayers/Strategy.js
 */

/**
 * Class: OpenLayers.Strategy.CenteredCluster
 * Strategy for vector feature clustering.
 *
 * Inherits from:
 *  - <OpenLayers.Strategy>
 */
OpenLayers.Strategy.CenteredCluster = OpenLayers.Class(OpenLayers.Strategy, {

    /**
     * APIProperty: centered
     * {Boolean}
     */
    centered: true,

    /**
     * APIProperty: enabled
     * {Boolean}
     */
    enabled: true,

    /**
     * APIProperty: zoomSettings
     * {Boolean}
     */
    zoomSettings: null,

    /**
     * APIProperty: candidateMatches
     * {Function}
     */
    candidateMatches: null,

    /**
     * APIProperty: distance
     * {Integer} Pixel distance between features that should be considered a
     *     single cluster.  Default is 20 pixels.
     */
    distance: 20,

    /**
     * APIProperty: threshold
     * {Integer} Optional threshold below which original features will be
     *     added to the layer instead of clusters.  For example, a threshold
     *     of 3 would mean that any time there are 2 or fewer features in
     *     a cluster, those features will be added directly to the layer instead
     *     of a cluster representing those features.  Default is null (which is
     *     equivalent to 1 - meaning that clusters may contain just one feature).
     */
    threshold: null,

    /**
     * Property: features
     * {Array(<OpenLayers.Feature.Vector>)} Cached features.
     */
    features: null,

    /**
     * Property: clustering
     * {Boolean} The strategy is currently clustering features.
     */
    clustering: false,

    /**
     * Property: resolution
     * {Float} The resolution (map units per pixel) of the current cluster set.
     */
    resolution: null,

    /**
     * Property: defaultSettings
     * {Object} Internal use only.
     */
    defaultSettings: null,

    /**
     * Constructor: OpenLayers.Strategy.CenteredCluster
     * Create a new CenteredCluster strategy.
     *
     * Parameters:
     * options - {Object} Optional object whose properties will be set on the
     *     instance.
     */
    initialize: function(options) {
        OpenLayers.Strategy.prototype.initialize.apply(this, [options]);

        /*
         * Method: _centerCluster
         *
         * Parameters:
         * cluster -{Object}
         */
        var _addFeature = function(cluster, feature, fCenter, withinDistance) {
            if (withinDistance(cluster.x - fCenter.lon, 
                               cluster.y - fCenter.lat)) {
                cluster.f.push(feature);
                cluster.sx += fCenter.lon;
                cluster.sy += fCenter.lat;
                return true;
            }
            return false;
        };

        /*
         * Method: _centerCluster
         *
         * Parameters:
         * cluster -{Object})
         */
        var _centerCluster = function(cluster) {
            var len = cluster.f.length;
            cluster.x = cluster.sx / len;
            cluster.y = cluster.sy / len;
        };

        /*
         * Method: _groupFeatures
         *
         * Parameters:
         * clusters -Array({Object}) Initial and calculated
         *     clusters at the end.
         * features -Array({<OpenLayers.Feature.Vector>}) To cluster features.
         */
        var _groupFeatures = function(
                         clusters, features, withinDistance, candidateMatches) {
            var feature, cluster, clustered, fCenter;
            for (var i = 0, len = features.length; i < len; i++) {
                feature = features[i];
                feature.renderIntent = "default";
                if (feature.geometry) {
                    fCenter = feature.geometry.getBounds().getCenterLonLat();
                    clustered = false;
                    for (var ii = clusters.length - 1; ii >= 0; ii--) {
                        cluster = clusters[ii];
                        if (candidateMatches(cluster.f, feature) &&
                            _addFeature(
                                   cluster, feature, fCenter, withinDistance)) {
                            clustered = true;
                            break;
                        }
                    }
                    if (!clustered) {
                        cluster = {
                            sx: fCenter.lon,
                            sy: fCenter.lat,
                            x: fCenter.lon,
                            y: fCenter.lat,
                            f: [feature]
                        };
                        clusters.push(cluster);
                    }
                }
            }
        };

        /*
         * Method: _groupCluster
         *
         * Parameters:
         * remainingStart - {Integer}
         * clusters - Array({Object}) Calculated clusters at the end.
         * candidates - Array({<OpenLayers.Feature.Vector>}) Initial calculated
         *      clusters.
         */
        var _groupCluster = function(remainingStart,
                                     clusters, candidates,
                                     withinDistance, candidateMatches) {
            var candidate, cluster, clustered, ii, feature, fCenter;
            for (var i = 0, len = candidates.length; i < len; i++) {
                candidate = candidates[i];
                // calculate the center of the cluster candidate.
                _centerCluster(candidate);
                clustered = false;
                for (ii = clusters.length - 1; ii >= remainingStart; ii--) {
                    cluster = clusters[ii];
                    if (withinDistance(cluster.x - candidate.x,
                                       cluster.y - candidate.y) &&
                                   candidateMatches(cluster.f, candidate.f[0])){
                        Array.prototype.push.apply(cluster.f, candidate.f);
                        cluster.sx += candidate.sx;
                        cluster.sy += candidate.sy;
                        _centerCluster(cluster);
                        clustered = true;
                        break;
                    }
                }
                if (!clustered) {
                    for (ii = remainingStart - 1; ii >= 0; ii--) {
                        cluster = clusters[ii];
                        if (withinDistance(cluster.x - candidate.x,
                                           cluster.y - candidate.y) &&
                                  candidateMatches(cluster.f, candidate.f[0])) {
                            var cc = candidate.f;
                            for (var iii = cc.length - 1; iii >= 0; iii--) {
                                feature = cc[iii];
                                fCenter = feature.geometry.getBounds()
                                                             .getCenterLonLat();
                                if (_addFeature(cluster, feature, fCenter,
                                                withinDistance)) {
                                    cc.splice(iii, 1);
                                    if (candidate.f.length) {
                                        candidate.sx -= fCenter.lon;
                                        candidate.sy -= fCenter.lat;
                                        _centerCluster(candidate);
                                    } else {
                                        clustered = true;
                                        break;
                                    }
                                }
                            }
                            if (clustered) {
                                break;
                            }
                        }
                    }
                }
                if (!clustered) {
                    clusters.push(candidate);
                }
            }
        };

        /*
         * Method: _rejectFeatures
         *
         * Parameters:
         * remainingStart - {Integer}
         * clusters - Array({Object}) Calculated clusters.
         */
        var _rejectFeatures =
                            function(remainingStart, clusters, withinDistance) {
            var rejections = [];
            for (var i = remainingStart, len = clusters.length; i < len; i++) {
                var cluster = clusters[i],
                    clusterArr = cluster.f;
                for (var ii = clusterArr.length - 1; ii >= 0; ii--) {
                    var feature = clusterArr[ii],
                        fCenter =
                                 feature.geometry.getBounds().getCenterLonLat();
                    if (!withinDistance(cluster.x - fCenter.lon,
                                        cluster.y - fCenter.lat)) {
                        clusterArr.splice(ii,1);
                        cluster.sx -= fCenter.lon;
                        cluster.sy -= fCenter.lat;
                        // If we center again some features may be left out.
                        rejections.push(feature);
                    }
                }
            }
            return rejections;
        };

        /*
         * Method: _createClusters
         *
         * Parameters:
         * resolution - {Fload}
         */
        var _self = this;
        var _createClusters = function(resolution) {
            var _resDistance = _self.distance * resolution,
                withinDistance = function(x, y) {
                    return Math.sqrt(x * x + y * y) <= _resDistance;
                };

            var _candidateMatches = _self.candidateMatches,
                candidateMatches;
            if (_candidateMatches) {
                //candidateMatches = _candidateMatches;
                candidateMatches = function(a, b) {
                    return _candidateMatches.call(_self, a, b);
                };
            } else {
                candidateMatches = function() { return true; };
            }
            var finalClusters = [];
            _groupFeatures(
                finalClusters, _self.features, withinDistance, candidateMatches
            );

            var i, len;
            if (_self.centered) {
                var remainingStart = 0,
                    rejected,
                    remainingClusters;
                for (i = 0; i < 3; i++) {
                    remainingClusters = finalClusters.slice(remainingStart);
                    finalClusters = finalClusters.slice(0, remainingStart);
                    _groupCluster(
                        remainingStart, finalClusters, remainingClusters,
                        withinDistance, candidateMatches
                    );
                    rejected = _rejectFeatures(
                        remainingStart, finalClusters, withinDistance
                    );
                    if (!rejected.length) {
                        break;
                    }
                    remainingStart = finalClusters.length;
                    _groupFeatures(
                        finalClusters, rejected,
                        withinDistance, candidateMatches
                    );
                }
            }

            // We have calculated clusters on `remainingClusters`, we'll publish it.
            _self.clustering = true;
            _self.layer.removeAllFeatures();
            var clusters = [];
            if (finalClusters.length > 0) {
                for (i = 0, len = finalClusters.length; i < len; i++) {
                    var candidate = finalClusters[i],
                        cLen = candidate.f.length;
                    if (_self.threshold && cLen < _self.threshold) {
                        Array.prototype.push.apply(clusters, candidate.f);
                    } else {
                        var cluster = new OpenLayers.Feature.Vector(
                            new OpenLayers.Geometry.Point(
                                                      candidate.x, candidate.y),
                            {count: cLen}
                        );
                        cluster.cluster = candidate.f;
                        clusters.push(cluster);
                    }
                }
                _self.layer.addFeatures(clusters);
            }
            _self.clustering = false;
        };

        /**
         * Method: cluster
         * Cluster features based on some threshold distance.
         *
         * Parameters:
         * event - {Object} The event received when cluster is called as a
         *     result of a moveend event.
         */
        var cluster = function(event) {
            if (this.enabled) {
                if (!this.features) {
                    this.features = this.layer.features.slice();
                }
                if ((!event || event.zoomChanged) && this.features.length) {
                    var resolution = this.layer.map.getResolution();
                    if (!event || resolution !== this.resolution) {
                        this.resolution = resolution;
                        _createClusters(resolution);
                    }
                }
            } else {
                if (this.features) {
                    this.uncluster();
                }
            }
        };
        this.cluster = cluster;

        // Layer listeners
        this.layerListeners = {
            'beforefeaturesadded': this.cacheFeatures,
            'featuresremoved': this.refreshCache,
            'afterfeaturemodified': this.refreshCache,
            'moveend': this.onMoveend,
            scope: this
        };

        // Store defaultSettings
        this.defaultSettings = {
            distance: this.distance,
            threshold: this.threshold,
            enabled: this.enabled,
            centered: this.centered
        };
    },

    /**
     * Method: onMoveend
     */
    onMoveend: function(event) {
        if (event.zoomChanged && this.zoomSettings) {
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
        this.cluster(event);
    },

    /**
     * APIMethod: activate
     * Activate the strategy.  Register any listeners, do appropriate setup.
     *
     * Returns:
     * {Boolean} The strategy was successfully activated.
     */
    activate: function() {
        var activated = OpenLayers.Strategy.prototype.activate.call(this);
        if (activated) {
            this.cluster();
            this.layer.events.on(this.layerListeners);
        }
        return activated;
    },

    /**
     * APIMethod: deactivate
     * Deactivate the strategy.  Unregister any listeners, do appropriate
     *     tear-down.
     *
     * Returns:
     * {Boolean} The strategy was successfully deactivated.
     */
    deactivate: function() {
        var deactivated = OpenLayers.Strategy.prototype.deactivate.call(this);
        if (deactivated) {
            if (this.features) {
                this.uncluster();
            }
            this.layer.events.un(this.layerListeners);
        }
        return deactivated;
    },

    /**
     * Method: cacheFeatures
     * Cache features before they are added to the layer.
     *
     * Parameters:
     * event - {Object} The event that this was listening for.  This will come
     *     with a batch of features to be clustered.
     *     
     * Returns:
     * {Boolean} False to stop features from being added to the layer.
     */
    cacheFeatures: function(event) {
        if (this.clustering) { return; }
        if (this.enabled) {
            var layerFeatures = this.layer.features,
                layerFeaLen = layerFeatures.length,
                features;
            if (layerFeaLen) {
                features = event.features.slice();
                for (var i = 0; i < layerFeaLen; i++) {
                    var feature = layerFeatures[i];
                    if (feature.cluster) {
                        Array.prototype.push.apply(features, feature.cluster);
                    } else {
                        features.push(feature);
                    }
                }
            } else {
                features = event.features;
            }
            this.features = features;
            this.cluster();
            return false;
        } else if (this.features) {
            this.uncluster();
        }
    },

    /**
     * Method: refreshCache
     * Refresh the cached features.
     */
    refreshCache: function() {
        this.cacheFeatures({features: []});
    },

    
    /**
     * Method: uncluster
     * Uncluster features. Internal use!
     *
     * Warning: methods that call this function should monitor that
     *     `this.features` has value.
     */
    uncluster: function() {
        var features = this.features.slice();
        this.features = null;
        this.clustering = true;
        this.layer.removeAllFeatures();
        this.layer.addFeatures(features);
        this.clustering = false;
    },

    CLASS_NAME: 'OpenLayers.Strategy.CenteredCluster'
});
