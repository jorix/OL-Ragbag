var map = new OpenLayers.Map({div: 'map'});
map.addControl(new OpenLayers.Control.LayerSwitcher());

var comparer = createCompareLayers(
    [
        OpenLayers.Strategy.Cluster,
        //OpenLayers.Strategy.AnimatedCluster,
        OpenLayers.Strategy.CenteredCluster
    ],
    {},
    {
        projection: map.displayProjection,
        strategies: [
            new OpenLayers.Strategy.Fixed()
        ],
        protocol: new OpenLayers.Protocol.HTTP({
            url: '../kml/sundials.kml',
            format: new OpenLayers.Format.KML()
        })
    }
);

map.addLayers([
    new OpenLayers.Layer.WMS(
        'OpenLayers WMS',
        'http://vmap0.tiles.osgeo.org/wms/vmap0',
        {layers: 'basic'}
    )
]);
map.addLayers(comparer.layers);

map.zoomToMaxExtent();
