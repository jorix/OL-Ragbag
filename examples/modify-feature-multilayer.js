// Allow testing of specific renderers via "?renderer=Canvas", etc
var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
OpenLayers.Layer.Vector.prototype.renderers = renderer ?
                                    [renderer] :
                                    OpenLayers.Layer.Vector.prototype.renderers;

// Create Objects
// --------------

// Create the vectorial layer
var topLayer = new OpenLayers.Layer.Vector('Green top', {
    styleMap: new OpenLayers.StyleMap({'default':{fillColor: 'green'},'select':{strokeColor: 'yellow'}})
});
var middleLayer = new OpenLayers.Layer.Vector('Red middle', {
    styleMap: new OpenLayers.StyleMap({'default':{fillColor: 'red'},'select':{strokeColor: 'yellow'}})
});
var bottomLayer = new OpenLayers.Layer.Vector('Blue bottom', {
    styleMap: new OpenLayers.StyleMap({'default':{fillColor: 'blue'},'select':{strokeColor: 'yellow'}})
});

// Create and show the map
var map = new OpenLayers.Map({
    div: 'map',
    layers: [
        new OpenLayers.Layer.WMS('osgeo WMS',
                  'http://vmap0.tiles.osgeo.org/wms/vmap0?', {layers: 'basic'}),
        bottomLayer, middleLayer, topLayer
    ]
});
map.setCenter(new OpenLayers.LonLat(0, 0), 3);
map.addControl(new OpenLayers.Control.LayerSwitcher());

// Create the control collection to draw vectorial features.
var controls = {
    bottom: new OpenLayers.Control.DrawFeature(bottomLayer,
                OpenLayers.Handler.Polygon),
    middle: new OpenLayers.Control.DrawFeature(middleLayer,
                OpenLayers.Handler.Polygon),
    top:    new OpenLayers.Control.DrawFeature(topLayer,
                OpenLayers.Handler.Polygon),
    modify: new OpenLayers.Control.ModifyFeature(null, {layers:[bottomLayer, middleLayer, topLayer]})
};
// add this controls to the map
for (var key in controls) {
    map.addControl(controls[key]);
}

// Functions called from the form fields to choose the desired control to test.
// ----------------------------------------------------------------------------

// Function to toggle the active control
function toggleControl(element) {
    for (key in controls) {
        var control = controls[key];
        if (element.value === key && element.checked) {
            control.activate();
        } else {
            control.deactivate();
        }
    }
}
