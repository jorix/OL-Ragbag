// Create clustered layers
    
function createCompareLayers(clusterClases, clusterOptions, layerOptions){

    /**
     */
    var setClusterProperties = function(layer, clusterOptions) {
        var strategy = layer.strategies[0];
        OpenLayers.Util.extend(strategy, clusterOptions);
        var layer = strategy.layer,
            features;
        if (strategy.features) {
            features = strategy.features.slice()
        } else {
            features = layer.features.slice();
        }
        layer.removeFeatures(layer.features);
        layer.addFeatures(features);
    };

    /**
     */
    var createStyleMap = function(fillColor) {
        return new OpenLayers.StyleMap({
            'default': new OpenLayers.Style({
                    pointRadius: '${radius}',
                    fillColor: fillColor,
                    fillOpacity: 0.5,
                    strokeColor: '#cc6633',
                    strokeWidth: '${width}',
                    strokeOpacity: 0.5,
                    label: '${count}',
                    labelOutlineWidth: 1,
                    fontColor: '#222',
                    fontSize: '10px'
                }, {
                    context: {
                        count: function(feature) {
                            return feature.attributes.count || '';
                        },
                        width: function(feature) {
                            return (feature.cluster) ? 2 : 1;
                        },
                        radius: function(feature) {
                            var pix = 2;
                            if (feature.cluster) {
                                pix = Math.min(feature.attributes.count, 7) + 2;
                            }
                            return pix;
                        }
                }
            })
        });
    };

    /**
     */
    var createClusterLayer = function(_layer, clustersClass, clusterOptions, color) {
        var cLayerName = clustersClass.prototype.CLASS_NAME
                                           .replace('OpenLayers.Strategy.', '');
        var _clustersLayer = new OpenLayers.Layer.Vector(cLayerName, {
            strategies: [createTimedStrategy(clustersClass, clusterOptions)],
            styleMap: createStyleMap(color)
        });
        _layer.events.on({
            'featuresadded': function(evt) {
                this.addFeatures(evt.features.slice());
            },
            'featuresremoved': function(evt) {
                this.removeFeatures(evt.features.slice());
            },
            scope: _clustersLayer
        })
        return _clustersLayer;
    };

    /* */
    var _layer = new OpenLayers.Layer.Vector(
        'Features', 
        OpenLayers.Util.extend(layerOptions, {
            styleMap: new OpenLayers.StyleMap({
                'default': new OpenLayers.Style({
                        pointRadius: '1',
                        fillColor: 'red',
                        fillOpacity: 0.7,
                        strokeWidth: '0'
                })
            })
        })
    );
    var layers = [_layer];

    var colors = ['#66ccff', '#cc66ff', '#ffcc66'],
        cLen = colors.length;
    for (var i = 0, len = clusterClases.length; i < len; i++) {
        layers.push(createClusterLayer(_layer, clusterClases[i], clusterOptions, colors[i % cLen]));
    }
    return {
        layers: layers,
        setOptions: function(options) {
            for (var i = 1, len = layers.length; i < len; i++) {
                setClusterProperties(layers[i], options);
            }
        }
    };
};
