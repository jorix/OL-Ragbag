/* Copyright 2012-2014 by Xavier Mamano, http://github.com/jorix/OL-Ragbag
 * Published under MIT license. */

/**
 * @requires OpenLayers/Format/KML.js
 * @requires OpenLayers/Layer/Vector.js
 */

/**
 * Class: OpenLayers.Format.KML
 * Patch for KML format of OpenLayers.
 *
 * Extends the OpenLayers.Format.KML format to load StyleMap with "normal" and
 *     "highlight" styles.
 */
OpenLayers.Layer.Vector.prototype.drawFeature = function(feature, style) {
    // don't try to draw the feature with the renderer if the layer is not
    // drawn itself
    if (!this.drawn) {
        return;
    }
    if (typeof style != 'object') {
        if (!style && feature.state === OpenLayers.State.DELETE) {
            style = 'delete';
        }
        var renderIntent = style || feature.renderIntent;
        style = feature.style || this.style;
        if (!style) {
            style = this.styleMap.createSymbolizer(feature, renderIntent);
        } else if (style instanceof OpenLayers.StyleMap) {
            // added by this patch
            style = style.createSymbolizer(feature, renderIntent);
        }
    } else if (style instanceof OpenLayers.StyleMap) {
        // added by this patch
        style = style.createSymbolizer(feature, 'default');
    }

    var drawn = this.renderer.drawFeature(feature, style);
    //TODO remove the check for null when we get rid of Renderer.SVG
    if (drawn === false || drawn === null) {
        this.unrenderedFeatures[feature.id] = feature;
    } else {
        delete this.unrenderedFeatures[feature.id];
    }
};

(function() {

    var _prototype = OpenLayers.Format.KML.prototype;

    /**
     * Method: parseStyleMaps
     * Looks for <Style> nodes in the data and parses them
     * Also parses <StyleMap> nodes, but only uses the 'normal' key
     *
     * Parameters:
     * nodes    - {Array} of {DOMElement} data to read/parse.
     * options  - {Object} Hash of options
     *
     */
    _prototype.parseStyleMaps = function(nodes, options) {
        // Only the default or "normal" part of the StyleMap is processed now
        // To do the select or "highlight" bit, we'd need to change lots more

        for (var i = 0, len = nodes.length; i < len; i++) {
            var node = nodes[i];
            var pairs = this.getElementsByTagNameNS(node, '*',
                            'Pair');

            var id = node.getAttribute('id');
            var sDefault = null, sSelect = null;
            for (var j = 0, jlen = pairs.length; j < jlen; j++) {
                var pair = pairs[j];
                // Use the shortcut in the SLD format to quickly retrieve the
                // value of a node. Maybe it's good to have a method in
                // Format.XML to do this
                var key = this.parseProperty(pair, '*', 'key');
                var styleUrl = this.parseProperty(pair, '*', 'styleUrl');
                if (styleUrl) {
                    switch (key) {
                    case 'normal':
                        sDefault = this.styles[(options.styleBaseUrl || '') +
                                                                      styleUrl];
                        break;
                    case 'highlight':
                        sSelect = this.styles[(options.styleBaseUrl || '') +
                                                                      styleUrl];
                    }
                }
            }
            this.styles[(options.styleBaseUrl || '') + '#' + id] =
                new OpenLayers.StyleMap({
                    'default': new OpenLayers.Style(sDefault),
                    'temporary': new OpenLayers.Style(sSelect),
                    'select': new OpenLayers.Style(sSelect)
                });
        }

    };

    /**
     * Method: getStyle
     * Retrieves a style from a style hash using styleUrl as the key
     * If the styleUrl doesn't exist yet, we try to fetch it
     * Internet
     *
     * Parameters:
     * styleUrl  - {String} URL of style
     * options   - {Object} Hash of options
     */
    _prototype.getStyle = function(styleUrl, options) {

        var styleBaseUrl = OpenLayers.Util.removeTail(styleUrl);

        var newOptions = OpenLayers.Util.extend({}, options);
        newOptions.depth++;
        newOptions.styleBaseUrl = styleBaseUrl;

        // Fetch remote Style URLs (if not fetched before)
        if (!this.styles[styleUrl] &&
                !OpenLayers.String.startsWith(styleUrl, '#') &&
                newOptions.depth <= this.maxDepth &&
                !this.fetched[styleBaseUrl]) {

            var data = this.fetchLink(styleBaseUrl);
            if (data) {
                this.parseData(data, newOptions);
            }

        }

        // set style
        var styleObj = this.styles[styleUrl];
        if (styleObj instanceof OpenLayers.StyleMap) {
            return styleObj;
        } else {
            return OpenLayers.Util.extend({}, styleObj);
        }
    };
})();
