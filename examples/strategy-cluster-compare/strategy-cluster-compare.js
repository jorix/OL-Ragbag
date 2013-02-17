// Crate map
    var map = new OpenLayers.Map('map');
    map.addControl(new OpenLayers.Control.LayerSwitcher());
    var base = new OpenLayers.Layer.WMS('OpenLayers WMS',
         'http://vmap0.tiles.osgeo.org/wms/vmap0',
        {layers: 'basic'}
    );

// Show map
    map.addLayers([base]);
    map.setCenter(new OpenLayers.LonLat(0, 0), 2);


// Create a semi-random grid of features to be clustered
    function createFeatures(total, d) {
        var dx = 2;
        var dy = 2;
        var px, py;
        var features = [];
        for (var i = 0; i < total; i++) {
            var r1 = Math.random();
            var r2 = Math.random();
            var x = 45 * (r1 - 0.5);
            var y = 22.5 * (Math.random() - 0.5);
            px = x + 22.5 * d * (Math.random() - 0.5);
            py = y + 22.5 * d * (Math.random() - 0.5);
            features.push(new OpenLayers.Feature.Vector(
                new OpenLayers.Geometry.Point(px, py), {x: px, y: py}
            ));
        }
        return features;
    }
    
    var comparer = createCompareLayers([
        OpenLayers.Strategy.Cluster,
        //OpenLayers.Strategy.AnimatedCluster,
        OpenLayers.Strategy.CenteredCluster
    ]);

    function reset() {
        comparer.setOptions({
            distance: parseInt(document.getElementById('distance').value, 10),
            threshold: parseInt(document.getElementById('threshold').value, 10),
            centered: !!document.getElementById('centered').checked
        });
    }
    document.getElementById('reset').onclick = reset;

    map.addLayers(comparer.layers);
    reset();
    comparer.layers[0].addFeatures(createFeatures(4000, 0.5));

