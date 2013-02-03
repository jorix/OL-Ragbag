var strategies = [
    createTimedStrategy(OpenLayers.Strategy.CenteredCluster),
    createTimedStrategy(OpenLayers.Strategy.Cluster)
];

function reset() {
    var setProperties = function(strategy) {
        var distance = parseInt(document.getElementById('distance').value, 10);
        var threshold = parseInt(
                                document.getElementById('threshold').value, 10);
        var centered = document.getElementById('centered').checked;
        strategy.distance = distance || 20;
        strategy.threshold = threshold || null;
        strategy.centered = !!centered;
        var layer = strategy.layer;
        layer.removeFeatures(layer.features);
        layer.addFeatures(features);
    };

    for (var i = 0, len = strategies.length; i < len; i++) {
        setProperties(strategies[i]);
    }
}
document.getElementById('reset').onclick = reset;

// Create a semi-random grid of features to be clustered
    var dx = 3;
    var dy = 3;
    var px, py;
    var features = [];
    for (var x = -45; x <= 45; x += dx) {
        for (var y = -22.5; y <= 22.5; y += dy) {
            px = x + (2 * dx * (Math.random() - 0.5));
            py = y + (2 * dy * (Math.random() - 0.5));
            features.push(new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Point(px, py), {x: px, y: py}
            ));
        }
    }

// Crate map
    var map = new OpenLayers.Map('map');
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    var base = new OpenLayers.Layer.WMS('OpenLayers WMS',
         'http://vmap0.tiles.osgeo.org/wms/vmap0',
        {layers: 'basic'}
    );

// Create clustered layers
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
    var clusters0 = new OpenLayers.Layer.Vector('Centered clusters', {
        strategies: [strategies[0]],
        styleMap: createStyleMap('#66ccff')
    });
    var clusters1 = new OpenLayers.Layer.Vector('Standard clusters', {
        strategies: [strategies[1]],
        styleMap: createStyleMap('#ffcc66')
    });

// Cleate no clustered layer
    var noClusters = new OpenLayers.Layer.Vector('Features', {
        styleMap: new OpenLayers.StyleMap({
            'default': new OpenLayers.Style({
                    pointRadius: '1',
                    fillColor: 'red',
                    fillOpacity: 0.7,
                    strokeWidth: '0'
            })
        })
    });
    noClusters.addFeatures(features);

// Show map
    map.addLayers([base]);
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);
    map.addLayers([noClusters, clusters0, clusters1]);
    reset();

