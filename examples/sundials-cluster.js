var map = new OpenLayers.Map({
    div: 'map',
    eventListeners: {
        'zoomend': function(event) {
            var element = document.getElementById('zoomLevel');
            element.innerHTML = this.getZoom();
        }
    }
});

var _centeredCluster = new OpenLayers.Strategy.CenteredCluster({
    zoomSettings: [
        {zoomRange: [0, 2], settings: {distance: 100}},
        {zoomRange: [3, 4], settings: {distance: 50}},
        // 5 normal clusters
        {zoomRange: [6, 7], settings: {threshold: 2}},
        {zoomRange: [8, 99], settings: {enabled: false}}
    ]
});
var sundials = new OpenLayers.Layer.Vector('KML', {
    projection: map.displayProjection,
    strategies: [
        new OpenLayers.Strategy.Fixed(),
        _centeredCluster
    ],
    styleMap: new OpenLayers.StyleMap({
        'default': new OpenLayers.Style({
                pointRadius: '${radius}',
                fillOpacity: 0.6,
                fillColor: '#ffcc66',
                strokeColor: '#cc6633'
            }, {
                context: {
                    radius: function(feature) {
                        return Math.min(feature.attributes.count, 10) * 1.5 + 2;
                    }
                }
        }),
        'select': {fillColor: '#8aeeef'}
    }),
    protocol: new OpenLayers.Protocol.HTTP({
        url: 'kml/sundials.kml',
        format: new OpenLayers.Format.KML({
            extractStyles: true,
            extractAttributes: true
        })
    })
});

map.addLayers([
    new OpenLayers.Layer.WMS(
        'OpenLayers WMS',
        'http://vmap0.tiles.osgeo.org/wms/vmap0',
        {layers: 'basic'}
    ),
    sundials
]);
map.zoomToMaxExtent();

var select = new OpenLayers.Control.SelectFeature(sundials);
sundials.events.on({
    'featureselected': onFeatureSelect,
    'featureunselected': onFeatureUnselect
});
map.addControl(select);
select.activate();

var _butonOnofcluster = document.getElementById('onofcluster');
_butonOnofcluster.onclick = function() {
    if (_centeredCluster.active) {
        _centeredCluster.deactivate();
        _butonOnofcluster.innerHTML = 'Activate';
    } else {
        _centeredCluster.activate();
        _butonOnofcluster.innerHTML = 'Deactivate';
    }
};

function onPopupClose(evt) {
    select.unselectAll();
}
function onFeatureSelect(event) {
    var feature = event.feature;
    // Since KML is user-generated, do naive protection against
    // Javascript.
    var content = '<h2>' + feature.attributes.name + '</h2>' +
                                                 feature.attributes.description;
    if (content.search('<script') != -1) {
        content = 'Content contained Javascript! Escaped content below.<br>' +
                                                  content.replace(/</g, '&lt;');
    }
    var popup = new OpenLayers.Popup.FramedCloud('chicken',
                             feature.geometry.getBounds().getCenterLonLat(),
                             new OpenLayers.Size(100, 100),
                             content,
                             null, true, onPopupClose);
    feature.popup = popup;
    map.addPopup(popup);
}
function onFeatureUnselect(event) {
    var feature = event.feature;
    if (feature.popup) {
        map.removePopup(feature.popup);
        feature.popup.destroy();
        delete feature.popup;
    }
}
