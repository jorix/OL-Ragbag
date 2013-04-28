/* Copyright 2013 by Xavier Mamano, http://github.com/jorix/OL-Ragbag
 * Published under MIT license.
 *
 * This control is based on OpenLayers.Control.ModifyFeature class which is
 * copyright (c) 2006-2013 by OpenLayers Contributors under the
 * 2-clause BSD license http://openlayers.org/dev/license.txt
 */

/**
 * @requires OpenLayers/Handler/Drag.js
 * @requires OpenLayers/Handler/Keyboard.js
 * @requires OpenLayers/Renderer.js
 */

/**
 * Class: OpenLayers.Control.ModifyFeature
 * Control to modify features.  When activated, a click renders the vertices
 *     of a feature - these vertices can then be dragged.  By default, the
 *     delete key will delete the vertex under the mouse.  New features are
 *     added by dragging "virtual vertices" between vertices.  Create a new
 *     control with the <OpenLayers.Control.ModifyFeature> constructor.
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
     * {Boolean} Set to true to create a control without SelectFeature
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
     */
    escapeCode: 27,

    /**
     * APIProperty: styles
     * {Object} Alteration of the styles from
     *     <OpenLayers.Control.ModifyFeature_styles>.
     */
    styles: null,

    /**
     * Property: buttonSize
     * Default is new OpenLayers.Size(24, 24).
     * {<OpenLayers.Size>}
     */
    buttonSize: null,

    /**
     * Property: vStart
     * {Object} Internal use
     */
    vStart: null,

    /**
     * Property: usePoint
     * {Boolean} Thrue when the point style is used, read only.
     */
    usePoint: false,

    /**
     * Property: layer
     * {<OpenLayers.Layer.Vector>}
     */
    layer: null,

    /**
     * Property: feature
     * {<OpenLayers.Feature.Vector>} Feature currently available for modification.
     */
    feature: null,

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
     * APIProperty: virtualStyle
     * {Object} A symbolizer to be used for virtual vertices.
     */
    virtualStyle: null,

    /**
     * APIProperty: vertexRenderIntent
     * {String} The renderIntent to use for vertices. If no <virtualStyle> is
     * provided, this renderIntent will also be used for virtual vertices, with
     * a fillOpacity and strokeOpacity of 0.3. Default is null, which means
     * that the layer's default style will be used for vertices.
     */
    vertexRenderIntent: null,

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
     * Property: tools
     * Array({<OpenLayers.Feature.Vector>}) Tools for dragging rotating resizing
     *     etc. a feature.
     */
    tools: null,

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
     * layer - {<OpenLayers.Layer.Vector>} Layer that contains features that
     *     will be modified.
     * options - {Object} Optional object whose properties will be set on the
     *     control.
     *
     * Valid options:
     *
     * Compatible options:
     * virtualStyle - {Object} A symbolizer to be used for virtual vertices.
     * vertexRenderIntent -{String} The renderIntent to use for vertices, If no virtualStyle is
     * provided, this renderIntent will also be used for virtual vertices, with
     * a fillOpacity and strokeOpacity of 0.3
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
        this.layer = layer;
        this.vertices = [];
        this.virtualVertices = [];
        this.tools = [];
        
        // Configure styles
        var _styles,
            // symbols cache
            _vertexDefSymbols,
            _vertexSelSymbols;
        /**
         * APIMethod: setStyles
         * Use to set styles or after change layer of the control.
         */
        this.setStyles = function(styles) {
            // clear symbols cache
            _vertexDefSymbols = {};
            _vertexSelSymbols = {};
            _styles = OpenLayers.Util.applyDefaults(
                OpenLayers.Util.extend({}, styles || this.styles),
                OpenLayers.Control.ModifyFeature_styles
            );
            this.usePoint = !!_styles.point;
            // make styles compatible with the OL ModifyFeatures control.
            //  Take into account the options: vertexRenderIntent and virtualStyle
            var opVertexRenderIntent = this.vertexRenderIntent,
                virtualStyle = this.virtualStyle;
            if (virtualStyle || opVertexRenderIntent) {
                var compatibleStyle = OpenLayers.Util.extend({},
                        this.layer.style ||
                        this.layer.styleMap.createSymbolizer(
                                                         null, opVertexRenderIntent)
                    );
                if (opVertexRenderIntent) {
                    _styles.vertex = compatibleStyle;
                    _styles.point = compatibleStyle;
                }
                if (virtualStyle) {
                    _styles.vvertex = virtualStyle;
                } else if (opVertexRenderIntent) {
                    _styles.vvertex = OpenLayers.Util.extend({}, compatibleStyle);
                    _styles.vvertex.fillOpacity = 0.3;
                    _styles.vvertex.strokeOpacity = 0.3;
                }
            }
            this._styles = _styles; // only needed to debug
        };
        this.setStyles(options.styles);

        // configure the drag handler
        var dragCallbacks = {
            down: function(pixel) {
                this.vertex = null;
                var feature = this.layer.getFeatureFromEvent(
                        this.handlers.drag.evt);
                if (feature) {
                    this.dragStart(feature, pixel);
                } else if (this.feature && this.clickout) {
                    this.unselectFeature(this.feature);
                }
            },
            move: function(pixel) {
                delete this._unselect;
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
                    vertex = this.vertex;
                handlerDrag.stopDown = false;
                if (vertex &&
                    vertex === this.layer.getFeatureFromEvent(
                                                             handlerDrag.evt)) {
                    this.pressVertex(vertex, pixel);
                }
                if (this._unselect) {
                    this.unselectFeature(this._unselect);
                    delete this._unselect;
                }
            },
            done: function(pixel) {
                if (this.vertex) {
                    this.dragComplete(this.vertex);
                }
            }
        };
        var dragOptions = {
            documentDrag: this.documentDrag,
            stopDown: false
        };

        // configure the keyboard handler
        var keyboardOptions = {
            keydown: this.handleKeypress
        };
        this.handlers = {
            keyboard: new OpenLayers.Handler.Keyboard(this, keyboardOptions),
            drag: new OpenLayers.Handler.Drag(this, dragCallbacks, dragOptions)
        };
        
        // configure listeners
        this.mapListeners = {
            'removelayer': this.moveLayerToTop,
            'changelayer': function(evt) {
                if (evt.property === 'order') {
                    this.moveLayerToTop();
                }
            },
            scope: this
        };
        this.layerListeners = {
            'moveend': function(evt) {
                if (this.feature && evt.zoomChanged) {
                    this.vertex = null;
                    this.removeTools();
                    this.collectTools();
                }
            },
            scope: this
        };
        
        // configure some methods for the vertices and tools.
        var _self = this;
        /**
         * Method: setVetex
         * Set the symbolizers for a vertex tool and highlight if necessary.
         */
        this.setVetex = function(vertex, highlight) {
            var toolName = vertex._tool;
            if (!(toolName in _vertexDefSymbols)) {
                var layer = _self.layer,
                    styleMapObj = _styles[toolName];
                if (!styleMapObj) {
                    styleMapObj = layer.style;
                }
                var tempStyleMap = styleMapObj ?
                                    new OpenLayers.StyleMap(styleMapObj) :
                                    layer.styleMap;
                var renderIntents = (!styleMapObj && toolName === 'point') ?
                        ['select', 'temporary'] :
                        ['default', 'select'];
                _vertexDefSymbols[toolName] =
                        tempStyleMap.createSymbolizer(vertex, renderIntents[0]);
                _vertexSelSymbols[toolName] =
                        tempStyleMap.createSymbolizer(vertex, renderIntents[1]);
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
     * Take care of things that are not handled in superclass.
     */
    createVertex: function(toolName, geometry, highlight) {
        var vertex = new OpenLayers.Feature.Vector(geometry, {
            toolName: toolName
        });
        vertex._sketch = true;
        vertex._tool = toolName;
        this.setVetex(vertex, highlight);
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
            this.vStart = null;
            this.map.events.on(this.mapListeners);
            this.layer.events.on(this.layerListeners);
            // Moves layer to the top, so mouse events can reach
            this.moveLayerToTop();
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
        if(OpenLayers.Control.prototype.deactivate.apply(this, arguments)) {
            this.map.events.un(this.mapListeners);
            this.layer.events.un(this.layerListeners);
            this.removeVertices();
            this.handlers.drag.deactivate();
            this.vStart = null;
            this.handlers.keyboard.deactivate();
            var feature = this.feature;
            if (feature && feature.geometry && feature.layer) {
                this.unselectFeature(feature);
            }
            // Moves layer back to the position determined by the map's layers
            this.moveLayerBack();
            deactivated = true;
        }
        return deactivated;
    },

    /**
     * Method: beforeSelectFeature
     * Called before a feature is selected.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The feature about to be selected.
     */
    beforeSelectFeature: function(feature) {
        return this.layer.events.triggerEvent(
            "beforefeaturemodified", {feature: feature}
        );
    },

    /**
     * APIMethod: selectFeature
     * Select a feature for modification in standalone mode. In non-standalone
     * mode, this method is called when a feature is selected by clicking.
     * Register a listener to the beforefeaturemodified event and return false
     * to prevent feature modification.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} the selected feature.
     */
    selectFeature: function(feature) {
        if (this.geometryTypes && OpenLayers.Util.indexOf(this.geometryTypes,
                feature.geometry.CLASS_NAME) == -1) {
            return;
        }
        if (this.beforeSelectFeature(feature) !== false) {
            if (this.feature) {
                this.unselectFeature(this.feature);
            }
            this.feature = feature;
            this.layer.selectedFeatures.push(feature);
            this.layer.drawFeature(feature, 'select');
            this.modified = false;
            this.resetVertices();
            this.onModificationStart(this.feature);
        }
        // keep track of geometry modifications
        var modified = feature.modified;
        if (feature.geometry && !(modified && modified.geometry)) {
            this._originalGeometry = feature.geometry.clone();
        }
    },

    /**
     * APIMethod: unselectFeature
     * Called when the select feature control unselects a feature.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>} The unselected feature.
     */
    unselectFeature: function(feature) {
        this.removeVertices();
        this.layer.drawFeature(this.feature, 'default');
        this.feature = null;
        OpenLayers.Util.removeItem(this.layer.selectedFeatures, feature);
        this.onModificationEnd(feature);
        this.layer.events.triggerEvent("afterfeaturemodified", {
            feature: feature,
            modified: this.modified
        });
        this.modified = false;
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
        if (!this.standalone && !feature._sketch) {
            if (this.toggle && this.feature === feature) {
                // mark feature for unselection
                this._unselect = feature;
            }
            this.selectFeature(feature);
        }
        var isPoint =
                    feature.geometry.CLASS_NAME === 'OpenLayers.Geometry.Point';
        if (!feature._sketch && isPoint && this.virtualVertices.length) {
            // if exists drag the virtual point instead of the real point
            feature = this.virtualVertices[0];
        }
        if (feature._sketch || isPoint) {
            this.vStart = {
                _tool: feature._tool,
                x: feature.geometry.x,
                y: feature.geometry.y,
                pixx: pixel.x,
                pixy: pixel.y
            };
            // feature is a vertex tool or point
            this.vertex = feature;
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
        if (vertex._tool === "delete") {
            this.deleteFeature(this.feature);
        }
    },

    /**
     * Method: dragVertex
     * Called by the drag handler with each drag move of a vertex.
     *
     * Parameters:
     * vertex - {<OpenLayers.Feature.Vector>} The vertex being dragged.
     * pixel - {<OpenLayers.Pixel>} Pixel location of the mouse event.
     */
    dragVertex: function(vertex, pos, pixel) {
        if (vertex._tool === "delete") {
            return;
        }
        var vertexGeo = vertex.geometry,
            // dragging a real point instead of a vertex, so instantaneous drag
            isPoint = !vertex._tool,
            isTool = false,
            removeVirtual = true;
        vertexGeo.move(pos.lon - vertexGeo.x, pos.lat - vertexGeo.y);
        this.modified = true;
        /**
         * Five cases:
         * 1) dragging a simple point
         * 2) dragging a virtual vertex
         * 3) dragging a drag handle
         * 4) dragging a real vertex
         * 5) dragging a radius handle
         */
        if (vertex._index) {
            // dragging a virtual vertex
            vertexGeo.parent.addComponent(vertexGeo, vertex._index);
            // move from virtual to real vertex
            delete vertex._index;
            vertex._tool = 'vertex';
            vertex.attributes.toolName = 'vertex';
            OpenLayers.Util.removeItem(this.virtualVertices, vertex);
            this.vertices.push(vertex);
        } else if (vertex._tool === 'vertex'|| isPoint) {
            // dragging a real vertex or real point
            this.layer.events.triggerEvent("vertexmodified", {
                vertex: vertexGeo,
                feature: this.feature,
                pixel: pixel
            }); 
        } else if (vertex._tool === 'point') {
            var origin = vertexGeo._origin;
            if (origin) {
                origin.move(pos.lon - origin.x, pos.lat - origin.y);
            } else {
                origin = vertexGeo;
            }
            this.layer.events.triggerEvent("vertexmodified", {
                vertex: origin,
                feature: this.feature,
                pixel: pixel
            });
            removeVirtual = false;
        } else {
            // dragging a tool
            isTool = true;
            this.layer.removeFeatures(this.vertices, {silent: true});
            this.vertices = [];
        }
        // dragging a radius handle - no special treatment
        if (removeVirtual) {
            if(this.virtualVertices.length > 0) {
                this.layer.destroyFeatures(this.virtualVertices, {silent: true});
                this.virtualVertices = [];
            }
        }
        this.layer.drawFeature(this.feature, this.standalone ? undefined :
                                        'select');
        // keep the vertex on top so it gets the mouseout after dragging
        // this should be removed in favor of an option to draw under or
        // maintain node z-index
        if (!isPoint) {
            this.setVetex(vertex, true);
            if (isTool) {
                var tools = this.tools;
                var renderer = this.layer.renderer;
                for (var i = tools.length - 1; i >= 0; i--) {
                    renderer.locked = (i > 0); // to remove some flashing using Canvas
                    this.layer.drawFeature(tools[i]);
                }
            } else {
                this.layer.drawFeature(vertex);
            }
        }
    },
    
    /**
     * Method: dragComplete
     * Called by the drag handler when the feature dragging is complete.
     *
     * Parameters:
     * vertex - {<OpenLayers.Feature.Vector>} The vertex being dragged.
     */
    dragComplete: function(vertex) {
        this.resetVertices();
        this.setFeatureState();
        this.onModification(this.feature);
        this.layer.events.triggerEvent("featuremodified", 
                                       {feature: this.feature});
        this.vStart = null;
    },
    
    /**
     * Method: setFeatureState
     * Called when the feature is modified.  If the current state is not
     *     INSERT or DELETE, the state is set to UPDATE.
     */
    setFeatureState: function() {
        if(this.feature.state != OpenLayers.State.INSERT &&
           this.feature.state != OpenLayers.State.DELETE) {
            this.feature.state = OpenLayers.State.UPDATE;
            if (this.modified && this._originalGeometry) {
                var feature = this.feature;
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
    removeVertices: function() {
        this.removeTools();
        if(this.vertices.length > 0) {
            this.layer.removeFeatures(this.vertices, {silent: true});
            this.vertices = [];
        }
        if(this.virtualVertices.length > 0) {
            this.layer.destroyFeatures(this.virtualVertices, {silent: true});
            this.virtualVertices = [];
        }
    },
    
    /**
     * Method: removeTools
     */
    removeTools: function() {
        if (this.tools.length > 0) {
            this.layer.destroyFeatures(this.tools, {silent: true});
            this.tools = [];
        }
    },

    /**
     * Method: resetVertices
     */
    resetVertices: function() {
        this.removeVertices();
        if (this.feature) {
            var mode = this.collectTools();
            this.collectVertices(mode);
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
            this.vStart = null;
            dragHandler.activate();
            if (vStart._tool === 'vvertex') {
                delVertex = true;
            } else {
                this.dragVertex(
                    vertex,
                    new OpenLayers.LonLat(vStart.x, vStart.y),
                    new OpenLayers.Pixel(vStart.pixx, vStart.pixy)
                );
                this.dragComplete(vertex);
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
                layer.drawFeature(this.feature, this.standalone ?
                                       undefined : 'select');
                this.modified = true;
                this.resetVertices();
                this.setFeatureState();
                this.onModification(this.feature);
                layer.events.triggerEvent("featuremodified", 
                                               {feature: this.feature});
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
                feature.layer.events.triggerEvent(
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
        var geometry = this.feature.geometry,
            _usePoint = this.usePoint;
        if ((!_usePoint &&
                        geometry.CLASS_NAME === "OpenLayers.Geometry.Point") ||
                        !(mode & OpenLayers.Control.ModifyFeature.VERTICES)) {
            return;
        }
        var _vertices = [],
            _virtualVertices = [],
            control = this;
        var _pushPoint = function(geometry) {
            if (_usePoint) {
                var p = new OpenLayers.Geometry.Point(geometry.x, geometry.y);
                p._origin = geometry;
                p.destroy = function() {
                    OpenLayers.Geometry.Point.prototype
                                                   .destroy.apply(this, arguments);
                    this._origin = null;
                };
                _virtualVertices.push(control.createVertex('point', p));
            } else {
                _vertices.push(control.createVertex('point', geometry));
            }
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
                                     control.createVertex('vertex', component));
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
        collectComponentVertices(geometry);
        this.layer.addFeatures(_virtualVertices, {silent: true});
        this.layer.addFeatures(_vertices, {silent: true});
        this.virtualVertices = _virtualVertices;
        this.vertices = _vertices;
    },

    /**
     * Method: collectTools
     * Collect the tools for the selected geometry.
     */
    collectTools: function() {
        var MODES = OpenLayers.Control.ModifyFeature,
            mode = this.mode,
            _geometry = this.feature.geometry,
            bounds = _geometry.getBounds(),
            isLikeAPoint = bounds.left === bounds.right &&
                           bounds.top === bounds.bottom,
            deleteTool = mode & MODES.DELETE;
        // When uses RESHAPE make mode compatible with the OL ModifyFeatures.
        if (mode & MODES.RESHAPE) {
            // Don't collect vertices when we're reshape+resizing = DEFORM
            if (mode & MODES.RESIZE){
                mode &= ~MODES.VERTICES & ~MODES.RESIZE;
                mode |= MODES.DEFORM;
            }
        }
        if (isLikeAPoint && !deleteTool) {
            return mode;
        };
        var center = bounds.getCenterLonLat(),
            _originGeometry = new OpenLayers.Geometry.Point(
                center.lon, center.lat
            ),
            _self = this,
            _tools = [],
            // no scope
            addTool = function(toolName, x, y, toolMove) {
                var toolGeometry = new OpenLayers.Geometry.Point(x, y);
                toolGeometry.move = toolMove;
                var tool = _self.createVertex(toolName, toolGeometry);
                _tools.push(tool);
                return tool;
            },
            _movePoint = OpenLayers.Geometry.Point.prototype.move,
            _moveTool = function(_toolPos, x, y) {
                for (var i = 0, len = _toolPos.length; i < len; i++) {
                    _movePoint.call(_toolPos[i].geometry, x, y);
                }
            },
            _toolPosBounds = [],
            buttonSize = this.buttonSize,
            resolution = this.map.getResolution(),
            _sizeX = buttonSize.w * resolution,
            _sizeY = buttonSize.h * resolution,
            _posX = bounds.right,
            _posY = bounds.top + _sizeY,
            addToolBounds = function(toolName, p_dxAction) {
                _toolPosBounds.push(
                    addTool(toolName,
                        _posX,
                        _posY,
                        function(x, y) {
                            _moveTool(_toolPosBounds, x, y);
                            var dx1 = this.x - _originGeometry.x;
                            var dy1 = this.y - _originGeometry.y;
                            var dx0 = dx1 - x;
                            var dy0 = dy1 - y;
                            p_dxAction(dx1, dy1, dx0, dy0);
                        }
                    )
                );
                _posX -= _sizeX;
            };
        // declare tools
        if (!isLikeAPoint) {
            if (mode & MODES.DRAG) {
                addTool("drag", center.lon, center.lat, 
                    function(x, y) {
                        _moveTool(_tools, x, y);
                        _geometry.move(x, y);
                    }
                );
            }
            if (mode & MODES.ROTATE) {
                addToolBounds("rotate",
                    function(dx1, dy1, dx0, dy0) {
                        var a0 = Math.atan2(dy0, dx0);
                        var a1 = Math.atan2(dy1, dx1);
                        var angle = a1 - a0;
                        angle *= 180 / Math.PI;
                        _geometry.rotate(angle, _originGeometry);
                    }
                );
            }
            if (mode & MODES.RESIZE) {
                addToolBounds("resize",
                    function(dx1, dy1, dx0, dy0) {
                        var l0 = Math.sqrt((dx0 * dx0) + (dy0 * dy0)),
                            l1 = Math.sqrt((dx1 * dx1) + (dy1 * dy1)),
                            scale = l1 / l0;
                        _geometry.resize(scale, _originGeometry);
                    }
                );
            }
            if (mode & MODES.DEFORM) {
                addToolBounds("deform",
                    function(dx1, dy1, dx0, dy0) {
                        var scale = dy1 / dy0,
                            ratio = (dx1 / dx0) / scale;
                        _geometry.resize(scale, _originGeometry, ratio);
                    }
                );
            }
        }
        if (deleteTool) {
            addToolBounds("delete", function() {});
        }
        this.layer.addFeatures(_tools, {silent: true});
        this.tools = _tools;
        return mode;
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
     * Method: moveLayerToTop
     * Moves the layer for this handler to the top, so mouse events can reach
     * it.
     */
    moveLayerToTop: function() {
        var index = Math.max(this.map.Z_INDEX_BASE['Feature'] - 1,
            this.layer.getZIndex()) + 1;
        this.layer.setZIndex(index);
    },

    /**
     * Method: moveLayerBack
     * Moves the layer back to the position determined by the map's layers
     * array.
     */
    moveLayerBack: function() {
        var index = this.layer.getZIndex() - 1;
        if (index >= this.map.Z_INDEX_BASE['Feature']) {
            this.layer.setZIndex(index);
        } else {
            this.map.setLayerZIndex(this.layer,
                this.map.getLayerIndex(this.layer));
        }
    },

    CLASS_NAME: "OpenLayers.Control.ModifyFeature"
});

/**
 * Constant: RESHAPE
 * {Integer} Constant used to make the control work in reshape mode, use only
 *     for compatibility with OL ModifyFeature.
 */
OpenLayers.Control.ModifyFeature.RESHAPE = 1;
/**
 * Constant: RESIZE
 * {Integer} Constant used to make the control work in resize mode
 */
OpenLayers.Control.ModifyFeature.RESIZE = 2;
/**
 * Constant: ROTATE
 * {Integer} Constant used to make the control work in rotate mode
 */
OpenLayers.Control.ModifyFeature.ROTATE = 4;
/**
 * Constant: DRAG
 * {Integer} Constant used to make the control work in drag mode
 */
OpenLayers.Control.ModifyFeature.DRAG = 8;
/**
 * Constant: DELETE
 * {Integer} Constant used to make the control work in delete mode
 */
OpenLayers.Control.ModifyFeature.DELETE = 16;
/**
 * Constant: DEFORM
 * {Integer} Constant used to make the control work in deform mode
 */
OpenLayers.Control.ModifyFeature.DEFORM = 32;
/**
 * Constant: VERTICES
 * {Integer} Constant used to make the control work with the vestices.
 */
OpenLayers.Control.ModifyFeature.VERTICES = 64;

/**
 * Constant: OpenLayers.Control.ModifyFeature_styles
 * ModifyFeature have a number of styles for each tool and vertex. The 'default'
 *     style will be used for normal display and 'select' is used to display a
 *     tool or vertex while dragging it.
 */
OpenLayers.Control.ModifyFeature_styles = {
    'point': null,
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
            pointRadius: 11,
            graphicName: 'modify_drag',
            fillColor: '#999999',
            strokeWidth: 1,
            strokeColor: 'black'
        },
        'select': {
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
        10,12, 8,12, 12,16, 16,12, 14,12, 13.7,10, 13.1,8, 12,6, 11,5,
        10,4, 8,2.9, 6,2.3, 4,2, 4,0, 0,4, 4,8, 4,6,
        5,6.1, 6,6.4, 7,6.8, 8,7.5,
        8.5,8, 9.2,9, 9.6,10, 9.9,11,
        10,12],
    modify_deform: [1,9, 6,9, 6,8, 8,8, 8,9, 10,7,
        8,5, 8,6, 6,6, 6,4,
        4,4, 4,2, 5,2, 3,0,
        1,2, 2,2, 2,4, 1,4,
        1,9],
    modify_resize: [10,0, 10,3, 9.2,2.2, 7,4.2, 7,9,
        1,9, 1,3, 5.2,3, 7.8,0.8, 7,0,
        10,0],
    modify_delete: [0,1, 1,0, 3,2, 5,0, 6,1, 4,3, 6,5, 5,6, 3,4, 1,6, 0,5, 2,3,
        0,1]
})