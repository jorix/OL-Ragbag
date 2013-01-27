// Create and show the map
var map = new OpenLayers.Map({
    div: 'map',
    layers: [new OpenLayers.Layer.OSM()]
});
map.setCenter(new OpenLayers.LonLat(0, 0), 3);

// Crate styleMap for the clustered vectorial layer
var clusterStyle =  new OpenLayers.StyleMap({ // l'estil
    'default': new OpenLayers.Style({
            pointRadius: '${radius}',
            fillOpacity: 0.5,
            fillColor: '#ffcc66',
            strokeColor: '#cc6633',
            label: '${count}',
            labelOutlineWidth: 1,

            fontSize: "10px"
        }, {
            context: {
                radius: function(feature) {
                    var num = feature.attributes.count || 1;
                    return Math.log(num) * 9 + 2;
                },
                count: function(feature) {
                    return feature.attributes.count || '';
                }
            }
        }
    ),
    'select': {
        fillColor: '#8aeeef'
    }
});

// Create the clustered vectorial layer
var _centeredCluster = new OpenLayers.Strategy.CenteredCluster({
    autoActivate: false,
    threshold: 2
});
var vectorLayer = new OpenLayers.Layer.Vector("Features", {
    strategies: [_centeredCluster],
    styleMap: clusterStyle,
});

// Add layers to map
map.addLayers([vectorLayer]);

// Declare a custom control to delete features.
var DeleteFeature = OpenLayers.Class(OpenLayers.Control, {
    initialize: function(layer, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.layer = layer;
        this.handler = new OpenLayers.Handler.Feature(
            this, layer, {click: this.clickFeature}
        );
    },
    clickFeature: function(feature) {
        this.layer.destroyFeatures([feature]);
    },
    CLASS_NAME: "OpenLayers.Control.DeleteFeature"
});

// Add some editing tools to a panel
var panel = new OpenLayers.Control.Panel({
    displayClass: 'olControlEditingToolbar',
    allowDepress: true
});
panel.addControls([
    new DeleteFeature(vectorLayer, {
        // To add as a button on a panel:
        title: "Delete Feature"
    }),
    new OpenLayers.Control.DrawFeature(vectorLayer, OpenLayers.Handler.Point, {
        // To add as a button on a panel:
        title: "Draw Point",
        displayClass: "olControlDrawFeaturePoint"
    }),
    new OpenLayers.Control({
        // To add as a button on a panel to activate/deactivate the clusters.
        title: "Clusters on/off",
        type: OpenLayers.Control.TYPE_TOGGLE,
        displayClass: "olControlCluster olButtonText",
        eventListeners: {
            activate: function() {
                _centeredCluster.activate();
            },
            deactivate: function() {
                _centeredCluster.deactivate();
            }
        }
    })
]);
map.addControl(panel);
