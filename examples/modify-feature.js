// Alter default OpenLayers options
// --------------------------------

// Allow testing of specific renderers via "?renderer=Canvas", etc
var renderer = OpenLayers.Util.getParameters(window.location.href).renderer;
OpenLayers.Layer.Vector.prototype.renderers = renderer ?
                                    [renderer] :
                                    OpenLayers.Layer.Vector.prototype.renderers;

// Create Objects
// --------------

// To report draw modify and delete events
var reportEvent;
if (window.console && window.console.log) {
    reportEvent = function(event) {
        console.log(event.type,
                    event.feature ? event.feature.id : event.components);
    };
} else {
    reportEvent = function() {};
}

// Create the vectorial layer
var vectorLayer = new OpenLayers.Layer.Vector('Vector Layer', {
    styleMap: new OpenLayers.StyleMap({
        'default': OpenLayers.Util.applyDefaults({
                strokeWidth: 3,
                graphicName: 'triangle',
                pointRadius: '${radius}',
                rotation: '${angle}'
            }, OpenLayers.Feature.Vector.style['default']
        ),
        'select': OpenLayers.Util.applyDefaults({
                pointRadius: '${radius}'
            }, OpenLayers.Feature.Vector.style['select']
        )
    })
});
vectorLayer.events.on({
    'beforefeaturemodified': reportEvent,
    'featuremodified': reportEvent,
    'afterfeaturemodified': reportEvent,
    'beforefeatureremoved': reportEvent,
    'featureremoved': reportEvent,
    'vertexmodified': reportEvent,
    'sketchmodified': reportEvent,
    'sketchstarted': reportEvent,
    'sketchcomplete': reportEvent
});
// to ensure that the points have radius
vectorLayer.events.on({
    'beforefeatureadded': function(e) {
        e.feature.attributes.radius = 6;
    }
});

// Create and show the map
var map = new OpenLayers.Map({
    div: 'map',
    layers: [
        new OpenLayers.Layer.WMS('osgeo WMS',
                  'http://vmap0.tiles.osgeo.org/wms/vmap0?', {layers: 'basic'}),
        vectorLayer
    ]
});
map.setCenter(new OpenLayers.LonLat(0, 0), 3);

// Create the control collection to draw vectorial features.
var controls = {
    point: new OpenLayers.Control.DrawFeature(vectorLayer,
                OpenLayers.Handler.Point),
    multiPoint: new OpenLayers.Control.DrawFeature(vectorLayer,
                OpenLayers.Handler.Point, {handlerOptions: {multi: true}}),
    line: new OpenLayers.Control.DrawFeature(vectorLayer,
                OpenLayers.Handler.Path),
    polygon: new OpenLayers.Control.DrawFeature(vectorLayer,
                OpenLayers.Handler.Polygon),
    modify: new OpenLayers.Control.ModifyFeature(vectorLayer, {
        deferDelete: true,
        eventListeners: {
            'beforefeaturedeleted': reportEvent,
            'featuredeleted': reportEvent
        },
        tools: [ // custom tools
        { 
            // to rotate the "angle" attribute of a ponit by steps of 15 degrees
            geometryTypes: ['OpenLayers.Geometry.Point',
                            'OpenLayers.Geometry.MultiPoint'],
            dragAction: function(feature, initialAtt, escale, rotation) {
                var angle = ((initialAtt.angle || 0) - rotation) % 360;
                // force steps of 15 degrres
                angle = Math.floor(angle / 15) * 15;
                feature.attributes.angle = angle;
            },
            style: OpenLayers.Control.ModifyFeature_styles.rotate
        }, {
            // to resize the pointRadius.
            geometryTypes: ['OpenLayers.Geometry.Point',
                            'OpenLayers.Geometry.MultiPoint'],
            dragAction: function(feature, initialAtt, escale, rotation) {
                var radius = (initialAtt.radius || 6) * escale;
                feature.attributes.radius = Math.max(6, radius);
            },
            style: OpenLayers.Control.ModifyFeature_styles.resize
        }, {
            // to close a lineString as a ring
            geometryTypes: ['OpenLayers.Geometry.LineString'],
            pressingAction: function(feature) {
                var geometry = feature.geometry;
                geometry.addComponent(geometry.components[0].clone());
            },
            style: {
                label:'ring',
                title: 'press to close as a ring',
                cursor: "pointer",
                fontSize: '8px',
                fontColor: '#222',
                pointRadius: 10,
                fillColor: '#cccccc',
                strokeColor: '#444444'
            }
        }]
    })
};
// add this controls to the map
for (var key in controls) {
    map.addControl(controls[key]);
}
updateModifyControl();

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

// Functions to change the behavior of modify control
function updateModifyControl() {
    var vertices = document.getElementById('vertices').checked;
    var rotate = document.getElementById('rotate').checked;
    var resize = document.getElementById('resize').checked;
    var drag = document.getElementById('drag').checked;
    var deform = document.getElementById('deform').checked;
    var delete_ = document.getElementById('delete').checked;
    var reshape = document.getElementById('reshape').checked;

    controls.modify.createVertices =
                        document.getElementById('createVertices').checked;
    // reset modification mode
    controls.modify.mode = 0;
    if (vertices) {
        controls.modify.mode |= OpenLayers.Control.ModifyFeature.VERTICES;
    }
    if (rotate) {
        controls.modify.mode |= OpenLayers.Control.ModifyFeature.ROTATE;
    }
    if (resize) {
        controls.modify.mode |= OpenLayers.Control.ModifyFeature.RESIZE;
    }
    if (deform) {
        controls.modify.mode |= OpenLayers.Control.ModifyFeature.DEFORM;
    }
    if (drag) {
        controls.modify.mode |= OpenLayers.Control.ModifyFeature.DRAG;
    }
    if (delete_) {
        controls.modify.mode |= OpenLayers.Control.ModifyFeature.DELETE;
    }
    if (reshape) {
        controls.modify.mode |= OpenLayers.Control.ModifyFeature.RESHAPE;
    }
}



