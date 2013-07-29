/* Copyright 2013 by Xavier Mamano, http://github.com/jorix/OL-Ragbag
 * Published under MIT license.
 *
 * This control is based on OpenLayers.Control.ModifyFeature and
 * OpenLayers.Events.featureclick classes which are
 * copyright (c) 2006-2013 by OpenLayers Contributors under the
 * 2-clause BSD license http://openlayers.org/dev/license.txt
 */

/**
 * @requires OpenLayers/Control.js
 * @requires OpenLayers/Handler/Drag.js
 * @requires OpenLayers/Handler/Keyboard.js
 * @requires OpenLayers/Renderer.js
 */

/**
 * Class: OpenLayers.Control.ModifyFeature
 *
 * ModifyFeature OL control improved, see also <Constructor>.
 *
 * When tool <RESHAPE> or <VERTICES> is used the control allows to modify the
 *     vertices of a feature by dragging the vertices and create a new vertices
 *     dragging "virtual vertices" between vertices, see <createVertices>.
 *
 * By default, the delete key will delete the vertex under the mouse and escape
 *     key cancels current drag of a vertex or a tool.
 *
 * Allows to use the tools in OL compatibility mode by <RESHAPE> tool on its own
 *     mode using <VERTICES> and <DEFORM> simultaneously, and also allows the
 *     additional <DELETE> tool.  Allows add a custom tools using <tools>.
 *
 * Each tool is shown with different icon provided by <styles> and default is
 *     <OpenLayers.Control.ModifyFeature_styles>.
 *
 * Inherits From:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.ModifyFeature = OpenLayers.Class(OpenLayers.Control, {

    /**
     * APIProperty: events
     * {<OpenLayers.Events>} Events instance for listeners and triggering
     *     control specific events.
     *
     * Supported event types (in addition of <OpenLayers.Control.events>):
     * beforefeaturedeleted - Triggered before a feature is deleted. Listeners
     *      will receive an object with a *feature* property referencing the
     *      feature to be deleted, to stop delete listener should return false.
     * featuredeleted - Triggerd after a feature is deleted. The event
     *      object passed to listeners will have a *feature* property with a
     *      reference to the deleted feature, if <deferDelete> is true and the
     *      state of the feature is not INSERT, the estate is set as DELETE
     *      but still retains in the layer, otherwise layer is null and the
     *      feature will be destroyed after this enent.
     */

    /**
     * APIProperty: documentDrag
     * {Boolean} If set to true, dragging vertices will continue even if the
     *     mouse cursor leaves the map viewport. Default is false.
     */
    documentDrag: false,

    /**
     * APIProperty: geometryTypes
     * {Array(String)} To restrict modification to a limited set of geometry
     *     types, send a list of strings corresponding to the geometry class
     *     names.
     */
    geometryTypes: null,

    /**
     * APIProperty: clickout
     * {Boolean} Unselect features when clicking outside any feature.
     *     Default is true.
     */
    clickout: true,

    /**
     * APIProperty: toggle
     * {Boolean} Unselect a selected feature on click.
     *      Default is true.
     */
    toggle: true,

    /**
     * APIProperty: standalone
     * {Boolean} Set to true to create a control without select feature
     *     capabilities. Default is false.  If standalone is true, to modify
     *     a feature, call the <selectFeature> method with the target feature.
     *     Note that you must call the <unselectFeature> method to finish
     *     feature modification in standalone mode (before starting to modify
     *     another feature).
     */
    standalone: false,

    /**
     * APIProperty: deferDelete
     * {Boolean} Instead of removing features from the layer, set feature
     *     states of deleted features to DELETE.  This assumes a save strategy
     *     or other component is in charge of removing features from the
     *     layer.  Default is false.  If false, deleted features will be
     *     immediately removed from the layer.
     */
    deferDelete: false,

    /**
     * APIProperty: escapeCode
     * {Integer} Keycode for cancel a vertex drag.  Set to null to
     *     disable cancel vertex and tool drad by keypress.  Default is 27.
     *
     * NOTE: By canceling the tools DRAG, DEFORM or ROTATE can be obtained a
     *     geometry slightly different from starting (not visually perceptible)
     */
    escapeCode: 27,

    /**
     * APIProperty: styles
     * {Object} Alteration of the styles from
     *     <OpenLayers.Control.ModifyFeature_styles> used to show the tools and
     *     vertices.
     */
    styles: null,
    
    /**
     * APIProperty: tools
     * Array({Object}) Custom tools to use with this control. Each tool needs a
     *     function on a key named 'dragAction' (4 arguments: feature,
     *     initialAttributes, scale {Float}, rotation {Float})
     *     or 'pressingAction' (only feature argument), and could
     *     have additional keys: 'style' {Object} (with a default and
     *     select keys) and 'geometryTypes' Array({String}) (see usage on
     *     <geometryTypes>)
     */
    tools: null,
    
    /**
     * APIProperty: useVirtualPoint
     * {Boolean} Set to true force the use of virtual points to drag also
     *     single point features. If false the virtual points are only used for
     *     point on multiple geometries.  Default is false.
     *
     * Note that the default style for vitual points is transparent, see 'point'
     *     on <OpenLayers.Control.ModifyFeature_styles>.
     */
    useVirtualPoint: false,

    /**
     * APIProperty: selectOnUp
     * {Boolean} Set to true to select on mouseup & touchend instead of
     *     mousedown & touchstart, default is false.
     */
    selectOnUp: false,

    /**
     * APIProperty: buttonSize
     * {<OpenLayers.Size>} Determines the size reserved on the toolbar to each
     *     tool including the margin.  Default is new OpenLayers.Size(24, 24).
     */
    buttonSize: null,

    /**
     * Property: vStart
     * {Object} Internal use
     */
    vStart: null,

    /**
     * APIProperty: layers
     * Array({<OpenLayers.Layer.Vector>}) Layers over which control
     *     acts to modify features.
     */
    layers: null,

    /**
     * APIProperty: keepActiveLayer
     * {Boolean} Set to true to keep active layer after unselecting a feature,
     *     otherwise (if control is created without layer argument) there is no
     *     longer an active layer until a feature is selected,
     *     see <setLayer>.  Default is false.
     */
    keepActiveLayer: false,

    /**
     * Property: layer
     * {<OpenLayers.Layer.Vector>}
     */
    layer: null,

    /**
     * Property: activeLayer
     * {<OpenLayers.Layer.Vector>}
     */
    activeLayer: null,
    /**
     * Property: feature
     * {<OpenLayers.Feature.Vector>} Feature currently available for modification.
     */
    feature: null,

    /**
     * Property: isPoint
     * {Boolean} Currently feature available for modification is a point or a
     *      multi point with a single point.
     */
    isPoint: null,

    /**
     * Property: vertex
     * {<OpenLayers.Feature.Vector>} Vertex currently being modified.
     */
    vertex: null,

    /**
     * Property: vertices
     * {Array(<OpenLayers.Feature.Vector>)} Verticies currently available
     *     for dragging.
     */
    vertices: null,

    /**
     * Property: virtualVertices
     * {Array(<OpenLayers.Feature.Vector>)} Virtual vertices in the middle
     *     of each edge.
     */
    virtualVertices: null,

    /**
     * Property: handlers
     * {Object}
     */
    handlers: null,

    /**
     * APIProperty: deleteCodes
     * {Array(Integer)} Keycodes for deleting verticies.  Set to null to disable
     *     vertex deltion by keypress.  If non-null, keypresses with codes
     *     in this array will delete vertices under the mouse. Default
     *     is 46 and 68, the 'delete' and lowercase 'd' keys.
     */
    deleteCodes: null,

    /**
     * APIProperty: mode
     * {Integer} Bitfields specifying the modification mode. Defaults to
     *      OpenLayers.Control.ModifyFeature.VERTICES. To set the mode to a
     *      combination of options, use the | operator. For example, to allow
     *      the control to both resize and rotate features, use the following
     *      syntax
     * (code)
     * control.mode = OpenLayers.Control.ModifyFeature.RESIZE |
     *                OpenLayers.Control.ModifyFeature.ROTATE;
     * (end)
     */
    mode: null,

    /**
     * APIProperty: createVertices
     * {Boolean} Create new vertices by dragging the virtual vertices
     *     in the middle of each edge. Default is true.
     */
    createVertices: true,

    /**
     * Property: modified
     * {Boolean} The currently selected feature has been modified.
     */
    modified: false,

    /**
     * Property: dragTools
     * Array({<OpenLayers.Feature.Vector>}) Tools for dragging a feature.
     */
    dragTools: null,

    /**
     * Property: toolbar
     * Array({<OpenLayers.Feature.Vector>}) Toolbar to rotate resize
     *     or others actions on a feature.
     */
    toolbar: null,

    /**
     * Property: mapListeners
     * {Object} mapListeners object will be registered with
     *     <OpenLayers.Events.on>, internal use only.
     */
    mapListeners: null,

    /**
     * Property: layerListeners
     * {Object} layerListeners object will be registered with
     *     <OpenLayers.Events.on>, internal use only.
     */
    layerListeners: null,

    /**
     * APIProperty: onModificationStart 
     * {Function} *Deprecated*.  Register for "beforefeaturemodified" instead.
     *     The "beforefeaturemodified" event is triggered on the layer before
     *     any modification begins.
     *
     * Optional function to be called when a feature is selected
     *     to be modified. The function should expect to be called with a
     *     feature.  This could be used for example to allow to lock the
     *     feature on server-side.
     */
    onModificationStart: function() {},

    /**
     * APIProperty: onModification
     * {Function} *Deprecated*.  Register for "featuremodified" instead.
     *     The "featuremodified" event is triggered on the layer with each
     *     feature modification.
     *
     * Optional function to be called when a feature has been
     *     modified.  The function should expect to be called with a feature.
     */
    onModification: function() {},

    /**
     * APIProperty: onModificationEnd
     * {Function} *Deprecated*.  Register for "afterfeaturemodified" instead.
     *     The "afterfeaturemodified" event is triggered on the layer after
     *     a feature has been modified.
     *
     * Optional function to be called when a feature is finished 
     *     being modified.  The function should expect to be called with a
     *     feature.
     */
    onModificationEnd: function() {},

    /**
     * Constructor: OpenLayers.Control.ModifyFeature
     * Create a new modify feature control.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.Vector>|null} Default layer that contains
     *     features that will be modified. The layer becomes the active layer
     *     when control is activated.
     * options - {Object} Optional object whose properties will be set on the
     *     control.
     *
     * Major valid options:
     * mode - {Integer} Bitfields specifying the modification modes.
     * layers - Array({<OpenLayers.Layer.Vector>}) Layers over which control
     *     acts to modify features.
     * geometryTypes - {Array(String)} To restrict modification to a limited set
     *     of geometry types.
     * tools - Array({Object}) Custom tools to use with this control, see
     *     <tools>.
     * styles -  {Object} Alteration of the styles from
     *     <OpenLayers.Control.ModifyFeature_styles> used to show the tools and
     *     vertices.
     * buttonSize - {<OpenLayers.Size>} Determines the size reserved on the
     *     toolbar to each tool including the margin.
     * deferDelete - {Boolean} Instead of removing features from the layer, set
     *     feature states of deleted features to DELETE.
     *
     * Minor valid options:
     * clickout - {Boolean} Unselect features when clicking outside any feature,
     *     default is true.
     * toggle - {Boolean} Unselect a selected feature on click, default is true.
     * documentDrag - {Boolean} If set to true, dragging vertices will continue
     *     even if the mouse cursor leaves the map viewport.
     * deleteCodes - {Array(Integer)} Keycodes for deleting verticies.
     * escapeCode - {Integer} Keycode for cancel a vertex drag, default is 27.
     * createVertices - {Boolean} Create new vertices by dragging the virtual
     *     vertices in the middle of each edge. Default is true.
     * useVirtualPoint - {Boolean} Forces the use of virtual points
     *     to drag also single point features, see <useVirtualPoint>. Default is
     *     false.
     * selectOnUp {Boolean} Set to true to select on mouseup & touchend instead
     *     of mousedown & touchstart, default is false.
     * keepActiveLayer - {Boolean} Set to true to keep active layer after
     *     unselecting a feature, default is false.
     *
     * OL compatible options:
     * standalone - {Boolean} Set to true to create a control without select
     *     feature capabilities, default is false.
     */
    initialize: function(layer, options) {
        // set defaults
        this.deleteCodes = [46, 68];
        this.mode = OpenLayers.Control.ModifyFeature.VERTICES;
        this.buttonSize = new OpenLayers.Size(24, 24);

        // apply options
        options = options || {};
        if (this.EVENT_TYPES) { // Events compatibly with version 2.11 or lower.
            this.EVENT_TYPES.push('beforefeaturedeleted', 'featuredeleted');
        }
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        if(!(OpenLayers.Util.isArray(this.deleteCodes))) {
            this.deleteCodes = [this.deleteCodes];
        }
        this.layers = this.layers || [];
        this.layer = layer;
        this.vertices = [];
        this.virtualVertices = [];
        this.dragTools = [];
        this.toolbar = [];
        
        // Configure styles
        var _styles,
            // symbols cache
            _vertexDefSymbols,
            _vertexSelSymbols;
        /**
         * APIMethod: setStyles
         * Use to set styles or after change styles of the control.
         */
        this.setStyles = function(styles) {
            // clear symbols cache
            _vertexDefSymbols = {};
            _vertexSelSymbols = {};
            _styles = OpenLayers.Util.applyDefaults(
                OpenLayers.Util.extend({}, styles),
                OpenLayers.Control.ModifyFeature_styles
            );
            var tools = this.tools;
            if (tools) {
                for (var i = 0, len = tools.length; i < len; i++) {
                    _styles['custom_' + i] = tools[i].style;
                }
            }
            this._styles = _styles; // only needed to debug
        };
        this.setStyles(options.styles);

        // configure the drag handler
        var _unselect = false,
            _moved = false;
        var dragCallbacks = {
            down: function(pixel) {
                this.vertex = null;
                _unselect = false;
                _moved = false;
                var activeLayer = this.activeLayer,
                    dragEvt = this.handlers.drag.evt,
                    feature = (activeLayer &&
                                    activeLayer.getFeatureFromEvent(dragEvt)) ||
                                this.getFeatureFromLayers(dragEvt);
                if (feature) {
                    if (!this.standalone && !feature._sketch) {
                        if (this.toggle && this.feature === feature) {
                            // mark feature for unselection
                            _unselect = true;
                        }
                        if (!this.selectOnUp) {
                            this.selectFeature(feature);
                        }
                    }
                    this.dragStart(feature, pixel);
                } else if (this.clickout) {
                    _unselect = true;
                }
            },
            move: function(pixel) {
                _unselect = false;
                _moved = true;
                var vertex = this.vertex;
                if (vertex) {
                    this.dragVertex(
                        vertex,
                        this.map.getLonLatFromViewPortPx(pixel),
                        pixel
                    );
                }
            },
            up: function(pixel) {
                var handlerDrag = this.handlers.drag,
                    vertex = this.vertex,
                    selectOnUp = this.selectOnUp,
                    activeLayer = this.activeLayer,
                    feature = activeLayer ?
                        activeLayer.getFeatureFromEvent(handlerDrag.evt) :
                        null;
                handlerDrag.stopDown = false;
                if (vertex && vertex === feature) {
                    feature = null;
                    this.pressVertex(vertex, pixel);
                } else if (_unselect) {
                    if (this.feature === feature) {
                        feature = null;
                    }
                    this.unselectFeature(this.keepActiveLayer);
                } else if (selectOnUp && !feature){
                    feature = this.getFeatureFromLayers(handlerDrag.evt);
                }
                if (selectOnUp && feature) {
                    if (!this.standalone && !_moved) {
                        this.selectFeature(feature);
                    }
                }
            },
            done: function(pixel) {
                if (this.vertex) {
                    this.dragComplete();
                }
            }
        };

        // configure the keyboard handler
        var keyboardOptions = {
            keydown: this.handleKeypress
        };
        this.handlers = {
            keyboard: new OpenLayers.Handler.Keyboard(this, keyboardOptions),
            drag: new OpenLayers.Handler.Drag(this, dragCallbacks, {
                documentDrag: this.documentDrag,
                stopDown: false
            })
        };
        
        // configure listeners
        this.mapListeners = {
            'removelayer': function() {
                this.moveLayerToTop(this.activeLayer);
            },
            'changelayer': function(evt) {
                if (evt.property === 'order') {
                    this.moveLayerToTop(this.activeLayer);
                }
            },
            scope: this
        };
        this.layerListeners = {
            'moveend': function(evt) {
                if (this.feature && evt.zoomChanged) {
                    if (this.vertex && OpenLayers.Util.indexOf(
                                            this.toolbar, this.vertex) !== -1) {
                        this.dragComplete();
                    } else {
                        this.resetVertices(true);
                    }
                }
            },
            scope: this
        };
        
        // configure some methods for the vertices and tools.
        var _self = this;
        /**
         * Method: setVertex
         * Set the symbolizers for a vertex tool and highlight if necessary.
         */
        this.setVertex = function(vertex, highlight) {
            var toolName = vertex._tool;
            if (!(toolName in _vertexDefSymbols)) {
                var tempStyleMap = new OpenLayers.StyleMap(_styles[toolName]);
                _vertexDefSymbols[toolName] =
                        tempStyleMap.createSymbolizer(vertex, 'default');
                _vertexSelSymbols[toolName] =
                        tempStyleMap.createSymbolizer(vertex, 'select');
            }
            if (highlight) {
                vertex.style = _vertexSelSymbols[toolName];
            } else {
                vertex.style = _vertexDefSymbols[toolName];
            }
        };
    },

    /**
     * Method: createVertex
     * Crate a vertex/tool
     */
    createVertex: function(toolName, pressingAction, geometry, highlight) {
        var vertex = new OpenLayers.Feature.Vector(geometry);
        vertex._sketch = true;
        vertex._tool = toolName;
        vertex._pressingAction = pressingAction;
        this.setVertex(vertex, highlight);
        return vertex;
    },

    /**
     * APIMethod: destroy
     * Take care of things that are not handled in superclass.
     */
    destroy: function() {
        this.deactivate();
        this.layer = null;
        this.layerListeners = null;
        this.mapListeners = null;
        OpenLayers.Control.prototype.destroy.apply(this, []);
    },

    /**
     * Method: draw
     * This control does not have HTML component, so this method should
     *     be empty.
     */
    draw: function() {},

    /**
     * APIMethod: activate
     * Activate the control.
     * 
     * Returns:
     * {Boolean} Successfully activated the control.
     */
    activate: function() {
        var response = (this.handlers.keyboard.activate() &&
                this.handlers.drag.activate() &&
                OpenLayers.Control.prototype.activate.apply(this, arguments));
        if (response) {
            this.map.events.on(this.mapListeners);
            this.setLayer(this.layer);
        }
        return response;
    },

    /**
     * APIMethod: deactivate
     * Deactivate the control.
     *
     * Returns: 
     * {Boolean} Successfully deactivated the control.
     */
    deactivate: function() {
        var deactivated = false;
        // the return from the controls is unimportant in this case
        if (OpenLayers.Control.prototype.deactivate.apply(this, arguments)) {
            this.map.events.un(this.mapListeners);
            this.removeVertices();
            this.setLayer(null);
            this.handlers.drag.deactivate();
            this.vStart = null;
            this.handlers.keyboard.deactivate();
            var feature = this.feature;
            if (feature && feature.geometry && feature.layer) {
                this.unselectFeature();
            }
            deactivated = true;
        }
        return deactivated;
    },

    /**
     * APIMethod: setLayer
     * Activate the layer to modify features, the layer is moved to the top.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.Vector>|null} If null the active layer
     *     is turned off.
     */
    setLayer: function(layer) {
        var activeLayer = this.activeLayer;
        if (activeLayer !== layer) {
            if (activeLayer) {
                activeLayer.events.un(this.layerListeners);
                // Moves layer back to the position determined by the map's layers
                this.moveLayerBack(activeLayer);
            }
            if (this.active && layer) {
                this.activeLayer = layer;
                layer.events.on(this.layerListeners);
                // Moves layer to the top, so mouse events can reach
                this.moveLayerToTop(layer);
            } else {
                this.activeLayer = null;
            }
        }
    },

    /**
     * Method: moveLayerBack
     * Moves the layer back to the position determined by the map's layers
     * array.
     */
    moveLayerBack: function(layer) {
        var indexPrev = layer.getZIndex() - 1,
            map = this.map,
            topLayers = this._topLayers;
        if (indexPrev >= map.Z_INDEX_BASE['Feature']) {
            layer.setZIndex(indexPrev);
        } else {
            map.setLayerZIndex(layer, map.getLayerIndex(layer));
        }
        if (topLayers) {
            this._topLayers = null;
            for (var i = 0, len = topLayers.length; i < len; i++) {
                var topLayer = topLayers[i],
                    layerIndex = topLayer.getZIndex();
                if (indexPrev == layerIndex) {
                    topLayer.setZIndex(indexPrev + 1);
                }
            }
        }
    },

    /**
     * Method: moveLayerToTop
     * Moves the layer for this handler to the top, so mouse events can reach
     * it.
     *
     * Parameters:
     * layer - {<OpenLayers.Layer.Vector>}
     */
    moveLayerToTop: function(layer) {
        if (layer) {
            var index = Math.max(this.map.Z_INDEX_BASE['Feature'] - 1,
                        layer.getZIndex()) + 1,
                mapLayers = this.map.layers,
                done = false;
            this._topLayers = [];
            for (var i = 0, len = mapLayers.length; i < len; i++) {
                var mapLayer = mapLayers[i],
                    layerIndex = mapLayer.getZIndex();
                if (index == layerIndex) {
                    if (mapLayer instanceof
                                        OpenLayers.Layer.Vector.RootContainer &&
                            OpenLayers.Util.indexOf(
                                                mapLayer.layers, layer) != -1) {
                        // layer is on top, so in on a RootContainer.
                        done = true;
                        break;
                    } else {
                        mapLayer.setZIndex(index - 1);
                        this._topLayers.push(mapLayer);
                    }
                }
            }
            !done && layer.setZIndex(index);
        }
    },

    /**
     * APIMethod: selectFeature
     * Select a feature for modification, when this method is called the layer
     *     of the feature is automatically activated (see <setLayer>)
     * This method is useful when the control is created without specifying the
     *     layer argument and without <layers> option or in <standalone> mode,
     *     see <constructor>.
     *
     * Register a listener to the beforefeaturemodified event and return false
     * to prevent feature modification.
     *
     * This method is automatically called when a feature on layer argument or
     *     on <layers> option is selected by clicking.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} the selected feature.
     */
    selectFeature: function(feature) {
        var geometry = feature.geometry,
            geometryCLASS_NAME = geometry.CLASS_NAME;
        if (this.feature === feature || !this.active ||
            this.geometryTypes && OpenLayers.Util.indexOf(this.geometryTypes,
                geometryCLASS_NAME) == -1) {
            return;
        }
        var layer = feature.layer;
        if (layer.events.triggerEvent("beforefeaturemodified",
                                                {feature: feature}) !== false) {
            this.unselectFeature(true); // keep layer, next statement will set.
            this.setLayer(layer);
            this.feature = feature;
            this.isPoint =
                geometryCLASS_NAME === 'OpenLayers.Geometry.Point' ||
                (geometryCLASS_NAME === 'OpenLayers.Geometry.MultiPoint' &&
                                               geometry.components.length ===1);
            if (OpenLayers.Util.indexOf(layer.selectedFeatures, feature)
                                                                       === -1) {
                layer.selectedFeatures.push(feature);
                layer.drawFeature(feature, 'select');
            }
            this.modified = false;
            this.resetVertices();
            this.onModificationStart(feature);
            // keep track of geometry modifications
            var modified = feature.modified;
            if (geometry && !(modified && modified.geometry)) {
                this._originalGeometry = geometry.clone();
            }
        }
    },

    /**
     * APIMethod: unselectFeature
     * Call to unselects the current selected feature.
     *
     * Parameters:
     * keepActiveLayer - {Boolean} Keep current layer on top, so mouse events
     *     still can reach with the layer.
     */
    unselectFeature: function(keepActiveLayer) {
        var feature = this.feature;
        if (feature) {
            var layer = feature.layer;
            this.removeVertices();
            layer.drawFeature(feature, 'default');
            this.feature = null;
            OpenLayers.Util.removeItem(layer.selectedFeatures, feature);
            this.onModificationEnd(feature);
            layer.events.triggerEvent("afterfeaturemodified", {
                feature: feature,
                modified: this.modified
            });
            this.modified = false;
            !keepActiveLayer && this.setLayer(this.layer);
        }
    },
    
    /**
     * Method: dragStart
     * Called by the drag handler before a feature is dragged.  This method is
     *     used to differentiate between points and vertices
     *     of higher order geometries.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The point or vertex about to be
     *     dragged.
     * pixel - {<OpenLayers.Pixel>} Pixel location of the mouse event.
     */
    dragStart: function(feature, pixel) {
        var vertex,
            isRealPoint = false;
        if (feature._sketch) {
            vertex = feature;
        } else if (feature === this.feature) {
            if (this.isPoint) {
                if (this.virtualVertices.length === 1) {
                // if exists a virtual point then dit instead of the real point.
                    vertex = this.virtualVertices[0];
                } else {
                // drag a real point
                    vertex = feature;
                    isRealPoint = true;
                }
            }
        }
        if (vertex) {
            var geoPoint = vertex.geometry;
            if (isRealPoint && geoPoint.components) {
                geoPoint = geoPoint.components[0];
            }
            this.vStart = {
                _tool: vertex._tool,
                x: geoPoint.x,
                y: geoPoint.y,
                pixx: pixel.x,
                pixy: pixel.y
            };
            // feature is a tool a vertex or a real point
            this.vertex = vertex;
            this.handlers.drag.stopDown = true;
        }
    },

    /**
     * Method: pressVertex
     * Called by the drag handler with each drag move of a vertex.
     *
     * Parameters:
     * vertex - {<OpenLayers.Feature.Vector>} The vertex being dragged.
     * pixel - {<OpenLayers.Pixel>} Pixel location of the mouse event.
     */
    pressVertex: function(vertex, pixel) {
        if (!vertex._pressingAction) {
            return;
        }
        var feature = this.feature;
        if (vertex._tool === 'delete') {
            this.deleteFeature(feature);
        } else {
            vertex._pressingAction(feature);
            feature.layer.drawFeature(feature);
            this.dragComplete();
        }
    },

    /**
     * Method: dragVertex
     * Called by the drag handler with each drag move of a vertex.
     *
     * Parameters:
     * vertex - {<OpenLayers.Feature.Vector>} The vertex being dragged.
     * pos - {OpenLayers.LonLat} Map location.
     * pixel - {<OpenLayers.Pixel>} Pixel location of the mouse event.
     */
    dragVertex: function(vertex, pos, pixel) {
        if (vertex._pressingAction) {
            return;
        }
        var toolName = vertex._tool,
            vertexGeo = vertex.geometry;
        if (vertexGeo.components) {
            vertexGeo = vertexGeo.components[0];
        }
        var layer = this.activeLayer,
            feature = this.feature,
            // dragging a real point instead of a vertex, so instantaneous drag
            y = pos.lat - vertexGeo.y,
            x = pos.lon - vertexGeo.x,
            mustMoveTools = false,
            mustDrawVertex = false,
            removeVirtual = true;
        vertexGeo.move(x, y);
        this.modified = true;
        if (vertex._index) {
            mustDrawVertex = true;
            // dragging a virtual vertex
            vertexGeo.parent.addComponent(vertexGeo, vertex._index);
            // move from virtual to real vertex
            delete vertex._index;
            toolName = 'vertex';
            vertex._tool = toolName;
            OpenLayers.Util.removeItem(this.virtualVertices, vertex);
            this.vertices.push(vertex);
        } else if (toolName === 'vertex') {
            // dragging a real vertex
            mustDrawVertex = true;
            layer.events.triggerEvent("vertexmodified", {
                vertex: vertexGeo,
                feature: feature,
                pixel: pixel
            });
        } else if (toolName === 'point' || !toolName) {
            // dragging a point, if !toolName then is a real point
            mustMoveTools = true;
            removeVirtual = false; // if is a 'point' tool then is virtiual.
            var pointGeo = vertexGeo._origin;
            if (pointGeo) {
                mustDrawVertex = true;
                pointGeo.move(pos.lon - pointGeo.x, pos.lat - pointGeo.y);
            } else {
                pointGeo = vertexGeo;
            }
            layer.events.triggerEvent("vertexmodified", {
                vertex: pointGeo,
                feature: feature,
                pixel: pixel
            });
        } else {
            // dragging a tool
            mustMoveTools = true;
            if (this.vertices.length > 0) {
                layer.removeFeatures(this.vertices, {silent: true});
                this.vertices = [];
            }
        }

        // Feature modifications are made, now must be finish the job.
        if (removeVirtual) {
            if(this.virtualVertices.length > 0) {
                layer.destroyFeatures(this.virtualVertices, {silent: true});
                this.virtualVertices = [];
            }
        }
        layer.renderer.locked = true;
        if (toolName) {
            // Set the tool/vertex as highlighted.
            this.setVertex(vertex, true);
        }
        if (mustMoveTools) {
            // declate function...
            var movePoint = OpenLayers.Geometry.Point.prototype.move,
                moveTools = function(toolArray) {
                    for (var i = 0, len = toolArray.length; i < len; i++) {
                        movePoint.call(toolArray[i].geometry, x, y);
                        layer.drawFeature(toolArray[i]);
                    }
                };
            // and move.
            moveTools(this.toolbar, x, y);
            if (toolName === 'drag') {
                moveTools(this.dragTools, x, y);
            }
        }
        if (mustDrawVertex) {
            layer.drawFeature(vertex);
        }
        layer.renderer.locked = false;
        layer.drawFeature(feature);
        
    },

    /**
     * Method: dragComplete
     * Called by the drag handler when the feature dragging is complete.
     */
    dragComplete: function() {
        var feature = this.feature;
        if (feature) {
            this.resetVertices();
            this.setFeatureState();
            this.onModification(feature);
            feature.layer.events.triggerEvent("featuremodified",
                                           {feature: feature});
        }
    },
    
    /**
     * Method: setFeatureState
     * Called when the feature is modified.  If the current state is not
     *     INSERT or DELETE, the state is set to UPDATE.
     */
    setFeatureState: function() {
        var feature = this.feature,
            states = OpenLayers.State;
        if (feature &&
            feature.state != states.INSERT &&
            feature.state != states.DELETE) {
            feature.state = states.UPDATE;
            if (this.modified && this._originalGeometry) {
                feature.modified = OpenLayers.Util.extend(feature.modified, {
                    geometry: this._originalGeometry
                });
                delete this._originalGeometry;
            }
        }
    },

    /**
     * Method: removeVertices
     */
    removeVertices: function(onlyToolbar) {
        var layer = this.activeLayer;
        if (this.toolbar.length > 0) {
            layer.destroyFeatures(this.toolbar, {silent: true});
            this.toolbar = [];
        }
        if (!onlyToolbar) {
            if (this.dragTools.length > 0) {
                layer.destroyFeatures(this.dragTools, {silent: true});
                this.dragTools = [];
            }
            if(this.vertices.length > 0) {
                layer.removeFeatures(this.vertices, {silent: true});
                this.vertices = [];
            }
            if(this.virtualVertices.length > 0) {
                layer.destroyFeatures(this.virtualVertices, {silent: true});
                this.virtualVertices = [];
            }
            this.vStart = null;
            this.vertex = null;
        }
    },

    /**
     * Method: resetVertices
     */
    resetVertices: function(onlyToolbar) {
        this.removeVertices(onlyToolbar);
        var feature = this.feature;
        if (feature) {
            // When uses RESHAPE make mode compatible with OL-ModifyFeatures.
            var mode = this.mode,
                MODES = OpenLayers.Control.ModifyFeature;
            if (mode & MODES.RESHAPE) {
                // Don't collect vertices when we're reshape+resizing = DEFORM
                if (mode & MODES.RESIZE){
                    mode &= ~MODES.VERTICES & ~MODES.RESIZE;
                    mode |= MODES.DEFORM;
                } else if (!(mode &
                                  (MODES.ROTATE | MODES.DRAG | MODES.DEFORM))) {
                    mode |= MODES.VERTICES;
                }
            }
            var yOffset = 0,
                layer = feature.layer;
            if (this.isPoint) {
                var pointStyle = layer.styleMap.createSymbolizer(
                                                         feature, 'select');
                if (pointStyle.externalGraphic) {
                    var height = pointStyle.graphicHeight ||
                                                        pointStyle.graphicWidth;
                    height = height ? height : pointStyle.pointRadius * 2;
                    yOffset = (pointStyle.graphicYOffset != undefined) ?
                                    -pointStyle.graphicYOffset : (0.5 * height);
                } else {
                    yOffset = pointStyle.pointRadius;
                }
            }
            this.collectTools(mode, onlyToolbar, yOffset);
            if (!onlyToolbar && (!this.isPoint || this.useVirtualPoint) && mode & MODES.VERTICES) {
                this.collectVertices(mode);
            }
        }
    },
    
    /**
     * Method: handleKeypress
     * Called by the feature handler on keypress.  This is used to delete
     *     vertices. If the <deleteCode> property is set, vertices will
     *     be deleted when a feature is selected for modification and
     *     the mouse is over a vertex.
     *
     * Parameters:
     * evt - {Event} Keypress event.
     */
    handleKeypress: function(evt) {
        if (!this.feature) {
            return;
        }

        var code = evt.keyCode,
            delVertex = OpenLayers.Util.indexOf(this.deleteCodes, code) !== -1,
            cancelDrag = this.escapeCode === code;
        if (!delVertex && !cancelDrag) {
            return;
        }

        var dragHandler = this.handlers.drag,
            layer = this.feature.layer,
            vertex,
            vStart = this.vStart;
        if (cancelDrag && vStart) {
            vertex = this.vertex;
            dragHandler.deactivate();
            dragHandler.activate();
            if (vStart._tool === 'vvertex') {
                delVertex = true;
            } else {
                this.dragVertex(
                    vertex,
                    new OpenLayers.LonLat(vStart.x, vStart.y),
                    new OpenLayers.Pixel(vStart.pixx, vStart.pixy)
                );
                this.dragComplete();
            }
        } else {
            vertex = layer.getFeatureFromEvent(dragHandler.evt);
        }
        // check for delete key
        if (delVertex) {
            if (!vertex && dragHandler.lastMoveEvt.xy === dragHandler.last) {
                // drag done but there has been no further movement,
                // so this is the vertex.
                vertex = this.vertex; 
            }
            if (vertex && vertex._tool === 'vertex' && !dragHandler.dragging) {
                // remove the vertex
                var vertexGeo = vertex.geometry;
                vertexGeo.parent.removeComponent(vertexGeo);
                layer.events.triggerEvent("vertexremoved", {
                    vertex: vertexGeo,
                    feature: this.feature,
                    pixel: evt.xy
                });
                layer.drawFeature(this.feature);
                this.modified = true;
                this.dragComplete();
            }
        }
    },

    /**
     * Method: deleteFeature
     * Called to delete/destroy the feature, see <deferDelete>.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The unselected feature.
     */
    deleteFeature: function(feature) {
        if (this.events.triggerEvent(
                        'beforefeaturedeleted', {feature: feature}) !== false) {
            var layer = feature.layer;
            OpenLayers.Util.removeItem(layer.selectedFeatures, feature);
            // just unselect
            this.removeVertices();
            this.setLayer(this.layer);
            this.feature = null;
            this.modified = false;
            // destroy or delete
            if (feature.state === OpenLayers.State.INSERT ||
                                                            !this.deferDelete) {
                layer.removeFeatures([feature]);
                this.events.triggerEvent(
                    'featuredeleted', {feature: feature}
                );
                feature.destroy();
            } else {
                feature.state = OpenLayers.State.DELETE;
                layer.drawFeature(feature);
                layer.events.triggerEvent(
                    'afterfeaturemodified', {
                        feature: feature,
                        modified: true
                    }
                );
                this.events.triggerEvent(
                    'featuredeleted', {feature: feature}
                );
            }
        }
    },

    /**
     * Method: collectVertices
     * Collect the vertices from the modifiable feature's geometry and push
     *     them on to the control's vertices array.
     */
    collectVertices: function(mode) {
        var _feature = this.feature,
            _layer = _feature.layer,
            _vertices = [],
            _virtualVertices = [],
            control = this;
        var _pushPoint = function(geometry) {
            var p = new OpenLayers.Geometry.Point(geometry.x, geometry.y);
            p._origin = geometry;
            p.destroy = function() {
                OpenLayers.Geometry.Point.prototype
                                               .destroy.apply(this, arguments);
                this._origin = null;
            };
            var vertex = control.createVertex('point', false, p);
            // set point style of vertex
            var vertexStyle = vertex.style;
            if (vertexStyle.fillOpacity === 0 &&
                                              vertexStyle.strokeOpacity === 0) {
                var pointStyle =
                           _layer.styleMap.createSymbolizer(_feature, 'select');
                if (!pointStyle.externalGraphic) {
                    vertex.style = OpenLayers.Util.applyDefaults({
                            pointRadius: pointStyle.pointRadius,
                            rotation: pointStyle.rotation,
                            graphicName: pointStyle.graphicName
                        },
                        vertexStyle
                    );
                }
            }
            // push this vertex.
            _virtualVertices.push(vertex);
        };
        function collectComponentVertices(geometry) {
            if(geometry.CLASS_NAME == "OpenLayers.Geometry.Point") {
                _pushPoint(geometry);
            } else {
                var i, component, len,
                    components = geometry.components,
                    numVert = components.length,
                    isLine = false;
                switch (geometry.CLASS_NAME) {
                    case 'OpenLayers.Geometry.LinearRing':
                        numVert -= 1;
                        isLine = true;
                        break;
                    case 'OpenLayers.Geometry.LineString':
                        isLine = true;
                        break;
                }
                for (i = 0; i < numVert; ++i) {
                    component = components[i];
                    if(component.CLASS_NAME == "OpenLayers.Geometry.Point") {
                        if (isLine) {
                            _vertices.push(
                                     control.createVertex(
                                                   'vertex', false, component));
                        } else {
                            _pushPoint(component)
                        }
                    } else {
                        collectComponentVertices(component);
                    }
                }

                // add virtual vertices in the middle of each edge
                if (control.createVertices && isLine) {
                    for(i = 0, len = components.length - 1; i < len; i++) {
                        var prevVertex = components[i],
                            nextVertex = components[i + 1];
                        var point = control.createVertex('vvertex',
                            false,
                            new OpenLayers.Geometry.Point(
                                (prevVertex.x + nextVertex.x) / 2,
                                (prevVertex.y + nextVertex.y) / 2
                            )
                        );
                        point.geometry.parent = geometry;
                        point._index = i + 1;
                        _virtualVertices.push(point);
                    }
                }
            }
        }
        collectComponentVertices(_feature.geometry);
        _layer.addFeatures(_virtualVertices, {silent: true});
        _layer.addFeatures(_vertices, {silent: true});
        this.virtualVertices = _virtualVertices;
        this.vertices = _vertices;
    },

    /**
     * Method: collectTools
     * Collect the tools for the selected geometry.
     */
    collectTools: function(mode, onlyToolbar, yOffset) {
        var MODES = OpenLayers.Control.ModifyFeature,
            _feature = this.feature,
            layer = _feature.layer,
            _geometry = _feature.geometry,
            bounds = _geometry.getBounds(),
            isPoint = this.isPoint,
            deleteTool = mode & MODES.DELETE;
        if (isPoint && !deleteTool) {
            return;
        };
        var center = bounds.getCenterLonLat(),
            _originGeometry = new OpenLayers.Geometry.Point(
                center.lon, center.lat
            ),
            _self = this,
            _toolbar = [],
            // no scope
            addTool = function(
                          toolArray, toolName, x, y, pressingAction, dragAction) {
                var toolGeometry = new OpenLayers.Geometry.Point(x, y);
                toolGeometry.move = dragAction;
                toolArray.push(
                    _self.createVertex(toolName, pressingAction, toolGeometry));
            },
            buttonSize = this.buttonSize,
            resolution = this.map.getResolution(),
            _sizeX = buttonSize.w * resolution,
            _sizeY = buttonSize.h * resolution,
            _posX = bounds.right,
            _posY = bounds.top;
        // Set tools position near to point more on top (x cood)
        var verticesOO = _geometry.getVertices();
        for (var iii = 0, leniii = verticesOO.length; iii < leniii; iii++) {
            if (_posY === OpenLayers.Util.toFloat(verticesOO[iii].y)) {
                _posX = verticesOO[iii].x;
            }
        }
        _posY += (yOffset ? _sizeY / 2 + yOffset * resolution : _sizeY);
        var addToToolbar = function(toolName, pressingAction, p_dxAction) {
            addTool(_toolbar, toolName, _posX, _posY, pressingAction,
                function(x, y) {
                    // values before move the vertex or the tool
                    var dx0 = this.x - _originGeometry.x,
                        dy0 = this.y - _originGeometry.y,
                        dx1 = dx0 + x,
                        dy1 = dy0 + y;
                    p_dxAction(dx1, dy1, dx0, dy0);
                }
            );
            _posX -= _sizeX;
        };
        // collect custom tools
        var tools = this.tools;
        if (tools) {
            var _initialAttibutes =
                                OpenLayers.Util.extend({}, _feature.attributes),
                _cumulativeAngle = 0,
                _cumulativeScale = 1,
                addCustomTool = function(toolName, pressingAction, dragAction) {
                    addToToolbar(
                        toolName,
                        pressingAction,
                        function(dx1, dy1, dx0, dy0) {
                            var a0 = Math.atan2(dy0, dx0),
                                a1 = Math.atan2(dy1, dx1),
                                angle = (a1 - a0) * 180 / Math.PI,
                                l0 = Math.sqrt((dx0 * dx0) + (dy0 * dy0)),
                                l1 = Math.sqrt((dx1 * dx1) + (dy1 * dy1)),
                                scale = l1 / l0;
                            _cumulativeAngle += angle,
                            _cumulativeScale *= scale,
                            dragAction(_feature, _initialAttibutes,
                                Math.round(100000 * _cumulativeScale) / 100000,
                                Math.round(1000 * _cumulativeAngle) / 1000
                            );
                        }
                    );
                },
                feoGeoClassName = _geometry.CLASS_NAME;
            for (var i = 0, len = tools.length; i < len; i++) {
                var tool = tools[i],
                    geometryTypes = tool.geometryTypes;
                if (!geometryTypes ||
                    OpenLayers.Util.indexOf(
                                       geometryTypes, feoGeoClassName) !== -1) {
                    addCustomTool('custom_' + i,
                                          tool.pressingAction, tool.dragAction);
                }
            }
        }
        // collect standart tools
        if (!isPoint) {
            if (!onlyToolbar && mode & MODES.DRAG) {
                var _dragTools = [];
                addTool(_dragTools, "drag", center.lon, center.lat, false,
                    function(x, y) {
                        _geometry.move(x, y);
                    }
                );
                layer.addFeatures(_dragTools, {silent: true});
                this.dragTools = _dragTools;
            }
            if (mode & MODES.ROTATE) {
                addToToolbar("rotate", false,
                    function(dx1, dy1, dx0, dy0) {
                        var a0 = Math.atan2(dy0, dx0);
                        var a1 = Math.atan2(dy1, dx1);
                        var angle = a1 - a0;
                        angle *= 180 / Math.PI;
                        _geometry.rotate(angle, _originGeometry);
                    }
                );
            }
            if (mode & MODES.DEFORM) {
                addToToolbar("deform", false,
                    function(dx1, dy1, dx0, dy0) {
                        if (dx0 === 0 || dx1 === 0 || dy0 === 0 || dy1 === 0) {
                            return;
                        }
                        var scale = dy1 / dy0,
                            ratio = (dx1 / dx0) / scale;
                        _geometry.resize(scale, _originGeometry, ratio);
                    }
                );
            }
            if (mode & MODES.RESIZE) {
                addToToolbar("resize", false,
                    function(dx1, dy1, dx0, dy0) {
                        var l0 = Math.sqrt((dx0 * dx0) + (dy0 * dy0)),
                            l1 = Math.sqrt((dx1 * dx1) + (dy1 * dy1)),
                            scale = l1 / l0;
                        if (l0 === 0 || l1 === 0) {
                            return;
                        }
                        _geometry.resize(scale, _originGeometry);
                    }
                );
            }
        }
        if (deleteTool) {
            addToToolbar("delete", true, function() {});
        }

        layer.addFeatures(_toolbar, {silent: true});
        this.toolbar = _toolbar;
        return;
    },

    /**
     * Method: setMap
     * Set the map property for the control and all handlers.
     *
     * Parameters:
     * map - {<OpenLayers.Map>} The control's map.
     */
    setMap: function(map) {
        this.handlers.drag.setMap(map);
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
    },

    /**
     * Method: getFeatureFromEvent
     * Get one feature at the given screen location.
     *
     * Parameters:
     * evt - {Object} Event object.
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>|Null} Feature at the given point.
     */
    getFeatureFromLayers: function(evt) {
        var feature = null,
            layers = this.layers;
        if (layers.length) {
            var layer = this.activeLayer,
                layerDiv = layer && layer.div.style.display !== "none" ?
                                                               layer.div : null;
            if (layerDiv) {
                layerDiv.style.display = "none";
            }
            var features = this.getFeatures(evt);
            if (features.length) {
                feature = features[0];
                if (OpenLayers.Util.indexOf(layers, feature.layer) === -1) {
                    feature = null;
                }
            }
            if (layerDiv) {
                layerDiv.style.display = "block";
            }
        }
        return feature;
    },

    /**
     * Method: getFeatures
     * Get all features at the given screen location.
     *
     * This code is a simplification of OL2.13:Events/featureclick.js, so only
     *     required one feature.
     *
     * Parameters:
     * evt - {Object} Event object.
     *
     * Returns:
     * {Array(<OpenLayers.Feature.Vector>)} List of features at the given point.
     */
    getFeatures: function(evt) {
        var x = evt.clientX, y = evt.clientY,
            features = [], targets = [], layers = [],
            layer, target, feature, i, len;
        // go through all layers looking for targets
        for (i=this.map.layers.length-1; i>=0; --i) {
            layer = this.map.layers[i];
            if (layer.div.style.display !== "none") {
                if (layer.renderer instanceof OpenLayers.Renderer.Elements) {
                    if (layer instanceof OpenLayers.Layer.Vector) {
                        target = document.elementFromPoint(x, y);
                        while (target && target._featureId) {
                            feature = layer.getFeatureById(target._featureId);
                            if (feature) {
                                features.push(feature);
                                break;
                                // target.style.display = "none";
                                // targets.push(target);
                                // target = document.elementFromPoint(x, y);
                            } else {
                                // sketch, all bets off
                                break;
                                //target = false;
                            }
                        }
                    }
                    if (features.length) {
                        break;
                    }
                    layers.push(layer);
                    layer.div.style.display = "none";
                } else if (layer.renderer instanceof OpenLayers.Renderer.Canvas) {
                    feature = layer.renderer.getFeatureIdFromEvent(evt);
                    if (feature) {
                        features.push(feature);
                        break;
                        // layers.push(layer);
                    }
                }
            }
        }
        // restore feature visibility
        // for (i=0, len=targets.length; i<len; ++i) {
            // targets[i].style.display = "";
        // }
        // restore layer visibility
        for (i=layers.length-1; i>=0; --i) {
            layers[i].div.style.display = "block";
        }
        return features;
    },

    CLASS_NAME: "OpenLayers.Control.ModifyFeature"
});

OpenLayers.Util.extend(OpenLayers.Control.ModifyFeature, {
    /**
     * Constant: RESHAPE
     * {Integer} Constant used to make the control work in reshape mode, use only
     *     for compatibility with OL ModifyFeature.
     */
    RESHAPE: 1,
    /**
     * Constant: RESIZE
     * {Integer} Constant used to make the control work in resize mode
     */
    RESIZE: 2,
    /**
     * Constant: ROTATE
     * {Integer} Constant used to make the control work in rotate mode
     */
    ROTATE: 4,
    /**
     * Constant: DRAG
     * {Integer} Constant used to make the control work in drag mode
     */
    DRAG: 8,
    /**
     * Constant: DELETE
     * {Integer} Constant used to make the control work in delete mode, see
     *     <deferDelete>
     */
    DELETE: 16,
    /**
     * Constant: DEFORM
     * {Integer} Constant used to make the control work in deform mode
     */
    DEFORM: 32,
    /**
     * Constant: VERTICES
     * {Integer} Constant used to make the control work with the vestices.
     */
    VERTICES: 64
});

/**
 * Constant: OpenLayers.Control.ModifyFeature_styles
 * ModifyFeature have a number of styles for each tool and vertex. The 'default'
 *     style will be used for normal display and 'select' is used to display a
 *     tool or vertex while dragging it.
 */
OpenLayers.Control.ModifyFeature_styles = {
    'point': {
    // Transparent point used only to drag points on multipoint geometries or
    //    when <useVirtualPoint> option is true.
            cursor: "pointer",
            pointRadius: 6,
            graphicName: 'circle',
            fillOpacity: 0,
            strokeWidth: 1,
            strokeOpacity: 0
    },
    'vertex': {
        'default': {
            cursor: "pointer",
            pointRadius: 6,
            graphicName: 'square',
            fillColor: 'white',
            fillOpacity: 0.4,
            strokeWidth: 1,
            strokeColor: '#333333'
        },
        'select': {
            cursor: "",
            fillColor: 'yellow',
            fillOpacity: 0.4,
            strokeColor: '#000000'
        }
    },
    'vvertex': {
        'default': {
            cursor: "pointer",
            pointRadius: 5,
            graphicName: 'square',
            fillColor: 'white',
            fillOpacity: 0.3,
            strokeWidth: 1,
            strokeColor: '#333333',
            strokeOpacity: 0.3
        },
        'select': {
            cursor: "",
            fillColor: 'yellow',
            strokeColor: '#000000'
        }
    },
    'drag': {
        'default': {
            cursor: "pointer",
            pointRadius: 12,
            graphicName: 'modify_drag',
            fillColor: '#999999',
            strokeWidth: 1,
            strokeColor: 'black'
        },
        'select': {
            pointRadius: 9,
            cursor: "",
            fillColor: 'yellow'
        }
    },
    'rotate': {
        'default': {
            cursor: "pointer",
            pointRadius: 9,
            graphicName: 'modify_rotate',
            fillColor: '#999999',
            strokeWidth: 1,
            strokeColor: 'black'
        },
        'select': {
            cursor: "",
            fillColor: 'yellow',
            strokeColor: '#444444'
        }
    },
    'deform': {
        'default': {
            cursor: "pointer",
            pointRadius: 9,
            graphicName: 'modify_deform',
            fillColor: '#999999',
            strokeWidth: 1,
            strokeColor: 'black'
        },
        'select': {
            cursor: "",
            fillColor: 'yellow'
        }
    },
    'resize': {
        'default': {
            cursor: "pointer",
            pointRadius: 9,
            graphicName: 'modify_resize',
            fillColor: '#999999',
            strokeWidth: 1,
            strokeColor: 'black'
        },
        'select': {
            cursor: "",
            fillColor: 'yellow'
        }
    },
    'delete': {
        'default': {
            cursor: "pointer",
            pointRadius: 9,
            graphicName: 'modify_delete',
            fillColor: 'red',
            fillOpacity: 0.4,
            strokeWidth: 1,
            strokeColor: 'red'
        },
        'select': {
            cursor: "",
            fillOpacity: 1,
            strokeWidth: 2
        }
    }
};

OpenLayers.Util.applyDefaults(OpenLayers.Renderer.symbol, {
    modify_drag: [
        5,10,  7,8,  6,8, 6,6, 8,6, 8,7, 10,5,
        8,3, 8,4, 6,4, 6,2, 7,2, 5,0,
        3,2, 4,2, 4,4, 2,4, 2,3, 0,5,
        2,7, 2,6, 4,6, 4,8, 3,8,
        5,10],
    modify_rotate: [
        100,120, 80,120, 120,160, 160,120, 140,120, 137,100, 131,80, 120,60,
        110,50,
        100,40, 80,29, 60,23, 40,20, 40,0, 0,40, 40,80, 40,60,
        50,61, 60,64, 70,68, 80,75,
        85,80, 92,90, 96,100, 99,110,
        100,120],
    modify_deform: [1,9, 6,9, 6,8, 8,8, 8,9, 10,7,
        8,5, 8,6, 6,6, 6,4,
        4,4, 4,2, 5,2, 3,0,
        1,2, 2,2, 2,4, 1,4,
        1,9],
    modify_resize: [100,0, 100,30, 92,22, 70,42, 70,90,
        10,90, 10,30, 52,30, 78,8, 70,0,
        100,0],
    modify_delete: [0,1, 1,0, 3,2, 5,0, 6,1, 4,3, 6,5, 5,6, 3,4, 1,6, 0,5, 2,3,
        0,1]
});
