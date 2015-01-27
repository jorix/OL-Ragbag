/* Copyright 2013-2015 by Xavier Mamano, http://github.com/jorix/OL-Ragbag
 * Published under MIT license. */

/**
 * @requires OpenLayers/Handler/Path.js
 * @requires OpenLayers/Handler/Polygon.js
 */

/**
 * Class: OpenLayers.Handler.Path
 * Patch for Path and Poligon handlers.
 *
 * Extends `Path` & `Polygon` handlers to remove the last added point or delete
 *     the drawing if no more points to remove by *esc-key*.  The keys
 *     act only when the cursor is on the map.
 *
 * NOTE: At the build process "requires" for Polygon.js is not strictly
 *     necessary, so if not want to use Handler.Polygon the Polygon.js file
 *     could be added in [exclude] paragraph in the *.cfg file.
 */
(function() {
    var addhandleKeypress = function(handlerClass) {
        var handlerPrototype = handlerClass.prototype;
        return OpenLayers.Class(handlerClass, {

            /**
             * Property: onMap
             * {Boolean} Read only, true if the cursor is on the map.
             */
            onMap: false,

            /**
             * Property: keyboardHandler
             * {<OpenLayers.Handler.Keyboard>}
             */
            keyboardHandler: null,

            /**
             * Method: destroy
             */
            destroy: function() {
                handlerPrototype.destroy.apply(this, arguments);
                if (this.keyboardHandler) {
                    this.keyboardHandler.destroy();
                    this.keyboardHandler = null;
                }
            },

            /**
             * Method: setMap
             */
            setMap: function(map) {
                handlerPrototype.setMap.apply(this, arguments);
                this.keyboardHandler = new OpenLayers.Handler.Keyboard(this, {
                    keydown: this.handleKeypress
                });
                this.keyboardHandler.setMap(map);
            },

            /**
             * Method: activate
             */
            activate: function() {
                // Custom `setMap` call is required!
                if (!this.keyboardHandler) { return false; }
                if (handlerPrototype.activate.apply(this, arguments)) {
                    this.onMap = true;
                    this.keyboardHandler.activate();
                    return true;
                } else {
                    return false;
                }
            },

            /**
             * Method: deactivate
             */
            deactivate: function() {
                if (handlerPrototype.deactivate.apply(this, arguments)) {
                    this.onMap = false;
                    this.keyboardHandler.deactivate();
                    return true;
                } else {
                    return false;
                }
            },

            /**
             * Method: handleKeypress
             * Called by the handler on keydown.
             *
             * Parameters:
             * evt - {Event} Keydown event.
             */
            handleKeypress: function(evt) {
                if (!this.onMap || !this.line) { return; }
                if (evt.keyCode === 27) { // esc-key
                    if (!this.undo()) {
                        this.cancel();
                    }
                    OpenLayers.Event.stop(evt);
                }
            },

            /**
             * Method: move
             * Handle mousemove and touchmove.  Adjust the geometry and redraw.
             * Return determines whether to propagate the event on the map.
             *
             * Parameters:
             * evt - {Event} The browser event
             *
             * Returns:
             * {Boolean} Allow event propagation
             */
            move: function(evt) {
                this.onMap = true;
                return handlerPrototype.move.apply(this, arguments);
            },

            /**
             * Method: mouseout
             * Handle mouse out.  For better user experience reset mouseDown
             * and stoppedDown when the mouse leaves the map viewport.
             *
             * Parameters:
             * evt - {Event} The browser event
             */
            mouseout: function(evt) {
                this.onMap = false;
                return handlerPrototype.mouseout.apply(this, arguments);
            }
        });
    };

    OpenLayers.Handler.Path = addhandleKeypress(OpenLayers.Handler.Path);
    if (OpenLayers.Handler.Polygon) {
        OpenLayers.Handler.Polygon =
                                  addhandleKeypress(OpenLayers.Handler.Polygon);
    }

})();
